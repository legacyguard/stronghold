import { createClient } from '@/lib/supabase';
import crypto from 'crypto';

export interface WebhookEndpoint {
  id: string;
  organization_id: string;
  url: string;
  events: string[];
  secret: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_delivery_attempt?: Date;
  failure_count: number;
  max_retries: number;
  retry_backoff: number;
  headers?: Record<string, string>;
  metadata: Record<string, any>;
}

export interface WebhookDelivery {
  id: string;
  webhook_endpoint_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempt_count: number;
  response_status?: number;
  response_body?: string;
  error_message?: string;
  created_at: Date;
  delivered_at?: Date;
  next_retry_at?: Date;
}

export interface WebhookEvent {
  id: string;
  event_type: string;
  organization_id: string;
  user_id?: string;
  payload: Record<string, any>;
  created_at: Date;
  processed: boolean;
  source: string;
  correlation_id?: string;
}

export interface ExternalIntegration {
  id: string;
  organization_id: string;
  integration_type: 'slack' | 'teams' | 'email' | 'sms' | 'zapier' | 'custom';
  name: string;
  configuration: {
    api_key?: string;
    webhook_url?: string;
    channel_id?: string;
    email_address?: string;
    phone_number?: string;
    custom_settings?: Record<string, any>;
  };
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_used_at?: Date;
  error_count: number;
  success_count: number;
}

export interface IntegrationTemplate {
  id: string;
  name: string;
  description: string;
  integration_type: string;
  configuration_schema: Record<string, any>;
  webhook_events: string[];
  is_active: boolean;
  created_at: Date;
}

class WebhookSystem {
  private static instance: WebhookSystem;
  private supabase = createClient();
  private isInitialized = false;
  private deliveryQueue: Map<string, WebhookDelivery[]> = new Map();
  private retryTimer: NodeJS.Timeout | null = null;

  static getInstance(): WebhookSystem {
    if (!WebhookSystem.instance) {
      WebhookSystem.instance = new WebhookSystem();
    }
    return WebhookSystem.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.createWebhookTables();
    await this.startRetryProcessor();
    this.isInitialized = true;
  }

  async createWebhookEndpoint(
    organizationId: string,
    url: string,
    events: string[],
    options: {
      headers?: Record<string, string>;
      maxRetries?: number;
      retryBackoff?: number;
    } = {}
  ): Promise<WebhookEndpoint> {
    const secret = this.generateWebhookSecret();

    const webhook: Partial<WebhookEndpoint> = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      url,
      events,
      secret,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      failure_count: 0,
      max_retries: options.maxRetries || 3,
      retry_backoff: options.retryBackoff || 300, // 5 minutes
      headers: options.headers || {},
      metadata: {}
    };

    const { data, error } = await this.supabase
      .from('webhook_endpoints')
      .insert(webhook)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateWebhookEndpoint(
    webhookId: string,
    updates: Partial<WebhookEndpoint>
  ): Promise<WebhookEndpoint> {
    const { data, error } = await this.supabase
      .from('webhook_endpoints')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', webhookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteWebhookEndpoint(webhookId: string): Promise<void> {
    const { error } = await this.supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', webhookId);

    if (error) throw error;
  }

  async triggerWebhookEvent(
    organizationId: string,
    eventType: string,
    payload: Record<string, any>,
    source: string = 'system',
    correlationId?: string
  ): Promise<string> {
    const event: Partial<WebhookEvent> = {
      id: crypto.randomUUID(),
      event_type: eventType,
      organization_id: organizationId,
      payload,
      created_at: new Date(),
      processed: false,
      source,
      correlation_id: correlationId
    };

    const { data, error } = await this.supabase
      .from('webhook_events')
      .insert(event)
      .select()
      .single();

    if (error) throw error;

    // Process webhooks for this event
    await this.processWebhookEvent(data);

    return data.id;
  }

  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    const { data: endpoints } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('organization_id', event.organization_id)
      .eq('is_active', true)
      .contains('events', [event.event_type]);

    if (!endpoints || endpoints.length === 0) return;

    const deliveries: Partial<WebhookDelivery>[] = endpoints.map(endpoint => ({
      id: crypto.randomUUID(),
      webhook_endpoint_id: endpoint.id,
      event_type: event.event_type,
      payload: event.payload,
      status: 'pending',
      attempt_count: 0,
      created_at: new Date()
    }));

    const { error } = await this.supabase
      .from('webhook_deliveries')
      .insert(deliveries);

    if (error) throw error;

    // Queue deliveries for processing
    for (const delivery of deliveries) {
      await this.queueDelivery(delivery as WebhookDelivery);
    }

    // Mark event as processed
    await this.supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('id', event.id);
  }

  async queueDelivery(delivery: WebhookDelivery): Promise<void> {
    const queueKey = delivery.webhook_endpoint_id;

    if (!this.deliveryQueue.has(queueKey)) {
      this.deliveryQueue.set(queueKey, []);
    }

    this.deliveryQueue.get(queueKey)!.push(delivery);

    // Process immediately if no other deliveries are queued
    if (this.deliveryQueue.get(queueKey)!.length === 1) {
      await this.processDeliveryQueue(queueKey);
    }
  }

  async processDeliveryQueue(webhookEndpointId: string): Promise<void> {
    const queue = this.deliveryQueue.get(webhookEndpointId);
    if (!queue || queue.length === 0) return;

    const delivery = queue.shift()!;

    try {
      const success = await this.deliverWebhook(delivery);

      if (success) {
        await this.markDeliverySuccess(delivery);
      } else {
        await this.handleDeliveryFailure(delivery);
      }
    } catch (error) {
      console.error('Webhook delivery error:', error);
      await this.handleDeliveryFailure(delivery);
    }

    // Process next in queue
    if (queue.length > 0) {
      setTimeout(() => this.processDeliveryQueue(webhookEndpointId), 1000);
    }
  }

  async deliverWebhook(delivery: WebhookDelivery): Promise<boolean> {
    const { data: endpoint } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', delivery.webhook_endpoint_id)
      .single();

    if (!endpoint || !endpoint.is_active) return false;

    const signature = this.generateSignature(
      JSON.stringify(delivery.payload),
      endpoint.secret
    );

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': delivery.event_type,
      'X-Webhook-Delivery': delivery.id,
      'User-Agent': 'LegacyGuard-Webhooks/1.0',
      ...endpoint.headers
    };

    try {
      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      await this.supabase
        .from('webhook_deliveries')
        .update({
          attempt_count: delivery.attempt_count + 1,
          response_status: response.status,
          response_body: await response.text().catch(() => '')
        })
        .eq('id', delivery.id);

      return response.ok;
    } catch (error) {
      await this.supabase
        .from('webhook_deliveries')
        .update({
          attempt_count: delivery.attempt_count + 1,
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', delivery.id);

      return false;
    }
  }

  async markDeliverySuccess(delivery: WebhookDelivery): Promise<void> {
    await this.supabase
      .from('webhook_deliveries')
      .update({
        status: 'delivered',
        delivered_at: new Date()
      })
      .eq('id', delivery.id);

    // Reset failure count on endpoint
    await this.supabase
      .from('webhook_endpoints')
      .update({
        failure_count: 0,
        last_delivery_attempt: new Date()
      })
      .eq('id', delivery.webhook_endpoint_id);
  }

  async handleDeliveryFailure(delivery: WebhookDelivery): Promise<void> {
    const { data: endpoint } = await this.supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('id', delivery.webhook_endpoint_id)
      .single();

    if (!endpoint) return;

    const newFailureCount = endpoint.failure_count + 1;
    const shouldRetry = delivery.attempt_count < endpoint.max_retries;

    if (shouldRetry) {
      const nextRetryAt = new Date(
        Date.now() + endpoint.retry_backoff * 1000 * Math.pow(2, delivery.attempt_count)
      );

      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'retrying',
          next_retry_at: nextRetryAt
        })
        .eq('id', delivery.id);

      // Schedule retry
      setTimeout(() => {
        this.queueDelivery({ ...delivery, attempt_count: delivery.attempt_count + 1 });
      }, nextRetryAt.getTime() - Date.now());
    } else {
      await this.supabase
        .from('webhook_deliveries')
        .update({
          status: 'failed'
        })
        .eq('id', delivery.id);
    }

    // Update endpoint failure count
    await this.supabase
      .from('webhook_endpoints')
      .update({
        failure_count: newFailureCount,
        last_delivery_attempt: new Date(),
        is_active: newFailureCount < 10 // Disable after 10 consecutive failures
      })
      .eq('id', delivery.webhook_endpoint_id);
  }

  async createExternalIntegration(
    organizationId: string,
    integrationType: string,
    name: string,
    configuration: Record<string, any>
  ): Promise<ExternalIntegration> {
    const integration: Partial<ExternalIntegration> = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      integration_type: integrationType as any,
      name,
      configuration,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      error_count: 0,
      success_count: 0
    };

    const { data, error } = await this.supabase
      .from('external_integrations')
      .insert(integration)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async testIntegration(integrationId: string): Promise<{ success: boolean; message: string }> {
    const { data: integration } = await this.supabase
      .from('external_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (!integration) {
      return { success: false, message: 'Integration not found' };
    }

    try {
      switch (integration.integration_type) {
        case 'slack':
          return await this.testSlackIntegration(integration);
        case 'teams':
          return await this.testTeamsIntegration(integration);
        case 'email':
          return await this.testEmailIntegration(integration);
        case 'zapier':
          return await this.testZapierIntegration(integration);
        default:
          return { success: false, message: 'Integration type not supported for testing' };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getWebhookDeliveries(
    webhookEndpointId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<WebhookDelivery[]> {
    let query = this.supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('webhook_endpoint_id', webhookEndpointId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
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

  private async createWebhookTables(): Promise<void> {
    // Tables will be created via Supabase migrations
    // This is a placeholder for any runtime table validation
  }

  private async startRetryProcessor(): Promise<void> {
    if (this.retryTimer) return;

    this.retryTimer = setInterval(async () => {
      try {
        const { data: retries } = await this.supabase
          .from('webhook_deliveries')
          .select('*')
          .eq('status', 'retrying')
          .lte('next_retry_at', new Date().toISOString());

        if (retries) {
          for (const retry of retries) {
            await this.queueDelivery(retry);
          }
        }
      } catch (error) {
        console.error('Retry processor error:', error);
      }
    }, 60000); // Check every minute
  }

  private generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  private async testSlackIntegration(integration: ExternalIntegration): Promise<{ success: boolean; message: string }> {
    const webhookUrl = integration.configuration.webhook_url;
    if (!webhookUrl) {
      return { success: false, message: 'Slack webhook URL not configured' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'LegacyGuard integration test - connection successful!'
      })
    });

    return {
      success: response.ok,
      message: response.ok ? 'Slack integration test successful' : `Failed: ${response.statusText}`
    };
  }

  private async testTeamsIntegration(integration: ExternalIntegration): Promise<{ success: boolean; message: string }> {
    const webhookUrl = integration.configuration.webhook_url;
    if (!webhookUrl) {
      return { success: false, message: 'Teams webhook URL not configured' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        'summary': 'LegacyGuard Test',
        'text': 'LegacyGuard integration test - connection successful!'
      })
    });

    return {
      success: response.ok,
      message: response.ok ? 'Teams integration test successful' : `Failed: ${response.statusText}`
    };
  }

  private async testEmailIntegration(integration: ExternalIntegration): Promise<{ success: boolean; message: string }> {
    // Email testing would require SMTP configuration
    return {
      success: true,
      message: 'Email integration configured (SMTP test not implemented)'
    };
  }

  private async testZapierIntegration(integration: ExternalIntegration): Promise<{ success: boolean; message: string }> {
    const webhookUrl = integration.configuration.webhook_url;
    if (!webhookUrl) {
      return { success: false, message: 'Zapier webhook URL not configured' };
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'test',
        data: { message: 'LegacyGuard integration test' }
      })
    });

    return {
      success: response.ok,
      message: response.ok ? 'Zapier integration test successful' : `Failed: ${response.statusText}`
    };
  }
}

export const webhookSystem = WebhookSystem.getInstance();