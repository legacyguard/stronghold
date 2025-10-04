import { createClient } from '@/lib/supabase';
import { webhookSystem, ExternalIntegration, IntegrationTemplate } from './webhook-system';

export interface IntegrationEvent {
  type: string;
  data: Record<string, any>;
  source: 'user_action' | 'system' | 'external';
  timestamp: Date;
  correlation_id?: string;
}

export interface IntegrationFlow {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  trigger: {
    type: 'webhook' | 'schedule' | 'event';
    configuration: Record<string, any>;
  };
  actions: {
    id: string;
    type: string;
    integration_id: string;
    configuration: Record<string, any>;
    order: number;
  }[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_execution?: Date;
  execution_count: number;
  success_count: number;
  error_count: number;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  flow_id?: string;
  event_type: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  data?: Record<string, any>;
  created_at: Date;
  execution_time_ms?: number;
}

class IntegrationManager {
  private static instance: IntegrationManager;
  private supabase = createClient();
  private isInitialized = false;
  private eventQueue: Map<string, IntegrationEvent[]> = new Map();
  private templates: Map<string, IntegrationTemplate> = new Map();

  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await webhookSystem.initialize();
    await this.loadIntegrationTemplates();
    await this.startEventProcessor();
    this.isInitialized = true;
  }

  async getAvailableIntegrations(): Promise<IntegrationTemplate[]> {
    return Array.from(this.templates.values()).filter(template => template.is_active);
  }

  async createIntegrationFromTemplate(
    organizationId: string,
    templateId: string,
    name: string,
    configuration: Record<string, any>
  ): Promise<ExternalIntegration> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error('Integration template not found');
    }

    // Validate configuration against template schema
    this.validateConfiguration(configuration, template.configuration_schema);

    const integration = await webhookSystem.createExternalIntegration(
      organizationId,
      template.integration_type,
      name,
      configuration
    );

    // Create default webhook endpoint for this integration if required
    if (template.webhook_events.length > 0) {
      await webhookSystem.createWebhookEndpoint(
        organizationId,
        configuration.webhook_url || `${configuration.base_url}/webhook`,
        template.webhook_events
      );
    }

    await this.logIntegrationEvent(integration.id, 'integration_created', 'success', {
      template_id: templateId,
      configuration: configuration
    });

    return integration;
  }

  async createIntegrationFlow(
    organizationId: string,
    name: string,
    description: string,
    trigger: any,
    actions: any[]
  ): Promise<IntegrationFlow> {
    const flow: Partial<IntegrationFlow> = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      name,
      description,
      trigger,
      actions: actions.map((action, index) => ({
        ...action,
        id: crypto.randomUUID(),
        order: index
      })),
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      execution_count: 0,
      success_count: 0,
      error_count: 0
    };

    const { data, error } = await this.supabase
      .from('integration_flows')
      .insert(flow)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async executeIntegrationFlow(flowId: string, eventData: Record<string, any>): Promise<void> {
    const { data: flow } = await this.supabase
      .from('integration_flows')
      .select('*')
      .eq('id', flowId)
      .eq('is_active', true)
      .single();

    if (!flow) {
      throw new Error('Integration flow not found or inactive');
    }

    const startTime = Date.now();
    let success = true;
    let errorMessage = '';

    try {
      // Sort actions by order
      const sortedActions = flow.actions.sort((a, b) => a.order - b.order);

      for (const action of sortedActions) {
        await this.executeAction(action, eventData, flow.organization_id);
      }

      await this.supabase
        .from('integration_flows')
        .update({
          last_execution: new Date(),
          execution_count: flow.execution_count + 1,
          success_count: flow.success_count + 1
        })
        .eq('id', flowId);

    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.supabase
        .from('integration_flows')
        .update({
          last_execution: new Date(),
          execution_count: flow.execution_count + 1,
          error_count: flow.error_count + 1
        })
        .eq('id', flowId);
    }

    await this.logIntegrationEvent(
      flowId,
      'flow_execution',
      success ? 'success' : 'error',
      {
        event_data: eventData,
        execution_time_ms: Date.now() - startTime,
        error_message: errorMessage
      },
      flowId
    );
  }

  async sendToSlack(
    integrationId: string,
    message: string,
    options: {
      channel?: string;
      username?: string;
      iconEmoji?: string;
      attachments?: any[];
    } = {}
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (integration.integration_type !== 'slack') {
      throw new Error('Integration is not a Slack integration');
    }

    const webhookUrl = integration.configuration.webhook_url;
    if (!webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const payload = {
      text: message,
      channel: options.channel || integration.configuration.channel_id,
      username: options.username || 'LegacyGuard',
      icon_emoji: options.iconEmoji || ':shield:',
      attachments: options.attachments || []
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.statusText}`);
    }

    await this.updateIntegrationStats(integrationId, true);
    await this.logIntegrationEvent(integrationId, 'slack_message_sent', 'success', { message, options });
  }

  async sendToTeams(
    integrationId: string,
    title: string,
    message: string,
    options: {
      color?: string;
      sections?: any[];
      potentialAction?: any[];
    } = {}
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (integration.integration_type !== 'teams') {
      throw new Error('Integration is not a Teams integration');
    }

    const webhookUrl = integration.configuration.webhook_url;
    if (!webhookUrl) {
      throw new Error('Teams webhook URL not configured');
    }

    const payload = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: title,
      themeColor: options.color || '0076D7',
      sections: [{
        activityTitle: title,
        activitySubtitle: 'LegacyGuard Notification',
        text: message,
        ...(options.sections && { sections: options.sections })
      }],
      ...(options.potentialAction && { potentialAction: options.potentialAction })
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.statusText}`);
    }

    await this.updateIntegrationStats(integrationId, true);
    await this.logIntegrationEvent(integrationId, 'teams_message_sent', 'success', { title, message, options });
  }

  async sendEmail(
    integrationId: string,
    to: string,
    subject: string,
    body: string,
    options: {
      html?: string;
      cc?: string[];
      bcc?: string[];
      attachments?: any[];
    } = {}
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (integration.integration_type !== 'email') {
      throw new Error('Integration is not an Email integration');
    }

    // Email sending would be implemented based on the email service provider
    // For now, this is a placeholder that logs the action
    await this.logIntegrationEvent(integrationId, 'email_sent', 'success', {
      to, subject, body, options
    });

    await this.updateIntegrationStats(integrationId, true);
  }

  async triggerZapierWebhook(
    integrationId: string,
    data: Record<string, any>
  ): Promise<void> {
    const integration = await this.getIntegration(integrationId);
    if (integration.integration_type !== 'zapier') {
      throw new Error('Integration is not a Zapier integration');
    }

    const webhookUrl = integration.configuration.webhook_url;
    if (!webhookUrl) {
      throw new Error('Zapier webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Zapier webhook error: ${response.statusText}`);
    }

    await this.updateIntegrationStats(integrationId, true);
    await this.logIntegrationEvent(integrationId, 'zapier_triggered', 'success', data);
  }

  async getIntegrationLogs(
    integrationId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
      eventType?: string;
    } = {}
  ): Promise<IntegrationLog[]> {
    let query = this.supabase
      .from('integration_logs')
      .select('*')
      .eq('integration_id', integrationId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getIntegrationMetrics(
    organizationId: string,
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    total_integrations: number;
    active_integrations: number;
    total_executions: number;
    success_rate: number;
    error_rate: number;
    avg_execution_time: number;
  }> {
    const timeAgo = new Date();
    switch (timeRange) {
      case 'hour':
        timeAgo.setHours(timeAgo.getHours() - 1);
        break;
      case 'day':
        timeAgo.setDate(timeAgo.getDate() - 1);
        break;
      case 'week':
        timeAgo.setDate(timeAgo.getDate() - 7);
        break;
      case 'month':
        timeAgo.setMonth(timeAgo.getMonth() - 1);
        break;
    }

    const { data: integrations } = await this.supabase
      .from('external_integrations')
      .select('success_count, error_count, is_active')
      .eq('organization_id', organizationId);

    const { data: logs } = await this.supabase
      .from('integration_logs')
      .select('status, execution_time_ms')
      .gte('created_at', timeAgo.toISOString());

    const totalIntegrations = integrations?.length || 0;
    const activeIntegrations = integrations?.filter(i => i.is_active).length || 0;
    const totalSuccesses = integrations?.reduce((sum, i) => sum + i.success_count, 0) || 0;
    const totalErrors = integrations?.reduce((sum, i) => sum + i.error_count, 0) || 0;
    const totalExecutions = totalSuccesses + totalErrors;

    const recentLogs = logs || [];
    const avgExecutionTime = recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + (log.execution_time_ms || 0), 0) / recentLogs.length
      : 0;

    return {
      total_integrations: totalIntegrations,
      active_integrations: activeIntegrations,
      total_executions: totalExecutions,
      success_rate: totalExecutions > 0 ? (totalSuccesses / totalExecutions) * 100 : 0,
      error_rate: totalExecutions > 0 ? (totalErrors / totalExecutions) * 100 : 0,
      avg_execution_time: avgExecutionTime
    };
  }

  private async getIntegration(integrationId: string): Promise<ExternalIntegration> {
    const { data: integration, error } = await this.supabase
      .from('external_integrations')
      .select('*')
      .eq('id', integrationId)
      .eq('is_active', true)
      .single();

    if (error || !integration) {
      throw new Error('Integration not found or inactive');
    }

    return integration;
  }

  private async executeAction(
    action: any,
    eventData: Record<string, any>,
    organizationId: string
  ): Promise<void> {
    const integration = await this.getIntegration(action.integration_id);

    switch (action.type) {
      case 'slack_message':
        await this.sendToSlack(
          integration.id,
          this.interpolateTemplate(action.configuration.message, eventData),
          action.configuration.options
        );
        break;

      case 'teams_message':
        await this.sendToTeams(
          integration.id,
          this.interpolateTemplate(action.configuration.title, eventData),
          this.interpolateTemplate(action.configuration.message, eventData),
          action.configuration.options
        );
        break;

      case 'email':
        await this.sendEmail(
          integration.id,
          action.configuration.to,
          this.interpolateTemplate(action.configuration.subject, eventData),
          this.interpolateTemplate(action.configuration.body, eventData),
          action.configuration.options
        );
        break;

      case 'webhook':
        await webhookSystem.triggerWebhookEvent(
          organizationId,
          action.configuration.event_type,
          { ...eventData, ...action.configuration.data }
        );
        break;

      case 'zapier':
        await this.triggerZapierWebhook(integration.id, {
          ...eventData,
          ...action.configuration.data
        });
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  private async updateIntegrationStats(integrationId: string, success: boolean): Promise<void> {
    const field = success ? 'success_count' : 'error_count';

    await this.supabase.rpc('increment_integration_stat', {
      integration_id: integrationId,
      field_name: field
    });

    await this.supabase
      .from('external_integrations')
      .update({ last_used_at: new Date() })
      .eq('id', integrationId);
  }

  private async logIntegrationEvent(
    integrationId: string,
    eventType: string,
    status: 'success' | 'error' | 'warning',
    data: Record<string, any>,
    flowId?: string
  ): Promise<void> {
    const log: Partial<IntegrationLog> = {
      id: crypto.randomUUID(),
      integration_id: integrationId,
      flow_id: flowId,
      event_type: eventType,
      status,
      message: this.generateLogMessage(eventType, status, data),
      data,
      created_at: new Date(),
      execution_time_ms: data.execution_time_ms
    };

    await this.supabase.from('integration_logs').insert(log);
  }

  private generateLogMessage(eventType: string, status: string, data: Record<string, any>): string {
    switch (eventType) {
      case 'integration_created':
        return `Integration created with template ${data.template_id}`;
      case 'slack_message_sent':
        return `Slack message sent: "${data.message}"`;
      case 'teams_message_sent':
        return `Teams message sent: "${data.title}"`;
      case 'email_sent':
        return `Email sent to ${data.to}: "${data.subject}"`;
      case 'zapier_triggered':
        return 'Zapier webhook triggered successfully';
      case 'flow_execution':
        return status === 'success'
          ? `Integration flow executed successfully in ${data.execution_time_ms}ms`
          : `Integration flow failed: ${data.error_message}`;
      default:
        return `${eventType} - ${status}`;
    }
  }

  private validateConfiguration(config: Record<string, any>, schema: Record<string, any>): void {
    // Basic validation - in production, use a proper JSON schema validator
    for (const [key, rules] of Object.entries(schema)) {
      if (rules.required && !config[key]) {
        throw new Error(`Required configuration field missing: ${key}`);
      }
    }
  }

  private async loadIntegrationTemplates(): Promise<void> {
    const templates: IntegrationTemplate[] = [
      {
        id: 'slack-notifications',
        name: 'Slack Notifications',
        description: 'Send notifications to Slack channels',
        integration_type: 'slack',
        configuration_schema: {
          webhook_url: { required: true, type: 'string' },
          channel_id: { required: false, type: 'string' },
          username: { required: false, type: 'string' }
        },
        webhook_events: ['user.created', 'document.signed', 'alert.triggered'],
        is_active: true,
        created_at: new Date()
      },
      {
        id: 'teams-notifications',
        name: 'Microsoft Teams Notifications',
        description: 'Send notifications to Microsoft Teams channels',
        integration_type: 'teams',
        configuration_schema: {
          webhook_url: { required: true, type: 'string' },
          theme_color: { required: false, type: 'string' }
        },
        webhook_events: ['user.created', 'document.signed', 'alert.triggered'],
        is_active: true,
        created_at: new Date()
      },
      {
        id: 'zapier-automation',
        name: 'Zapier Automation',
        description: 'Trigger Zapier workflows',
        integration_type: 'zapier',
        configuration_schema: {
          webhook_url: { required: true, type: 'string' }
        },
        webhook_events: ['*'],
        is_active: true,
        created_at: new Date()
      }
    ];

    for (const template of templates) {
      this.templates.set(template.id, template);
    }
  }

  private async startEventProcessor(): Promise<void> {
    // Event processor would run in the background
    // This is a simplified version
    setInterval(async () => {
      try {
        // Process queued events
        for (const [key, events] of this.eventQueue.entries()) {
          if (events.length > 0) {
            const event = events.shift()!;
            await this.processEvent(event);
          }
        }
      } catch (error) {
        console.error('Event processor error:', error);
      }
    }, 5000);
  }

  private async processEvent(event: IntegrationEvent): Promise<void> {
    // Process integration events
    // This would trigger relevant integration flows
  }
}

export const integrationManager = IntegrationManager.getInstance();