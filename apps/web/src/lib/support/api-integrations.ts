// API Integrations for Third-Party Support Tools
// Phase 6C Advanced Features - External Tool Connectivity

import { createClient } from '@/lib/supabase';

export type IntegrationType =
  | 'slack'
  | 'discord'
  | 'zendesk'
  | 'intercom'
  | 'freshdesk'
  | 'jira'
  | 'notion'
  | 'email'
  | 'webhook';

export interface Integration {
  id: string;
  type: IntegrationType;
  name: string;
  description: string;
  enabled: boolean;
  configuration: Record<string, any>;

  // Metadata
  created_at: string;
  updated_at: string;
  last_sync: string;
  sync_status: 'active' | 'error' | 'disabled';
  error_message?: string;
}

export interface NotificationEvent {
  type: 'ticket_created' | 'ticket_resolved' | 'escalation' | 'user_feedback' | 'churn_risk';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: Record<string, any>;
  user_id?: string;
  ticket_id?: string;
}

export interface WebhookPayload {
  event: NotificationEvent;
  timestamp: string;
  source: 'legacyguard_support';
  integration_id: string;
  signature?: string;
}

export class APIIntegrationsManager {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Slack Integration
   */
  async sendSlackNotification(event: NotificationEvent, config: any): Promise<boolean> {
    try {
      const { webhook_url, channel, username } = config;

      const message = this.formatSlackMessage(event);

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          username: username || 'LegacyGuard Support',
          icon_emoji: ':shield:',
          attachments: [message]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Slack notification failed:', error);
      return false;
    }
  }

  private formatSlackMessage(event: NotificationEvent): any {
    const colors = {
      low: '#36a64f',
      medium: '#ff9500',
      high: '#ff4444',
      urgent: '#8b0000'
    };

    switch (event.type) {
      case 'ticket_created':
        return {
          color: colors[event.priority],
          title: '🎫 Nový Support Ticket',
          fields: [
            { title: 'Používateľ', value: event.data.user_email, short: true },
            { title: 'Kategória', value: event.data.category, short: true },
            { title: 'Priorita', value: event.priority, short: true },
            { title: 'Popis', value: event.data.description.substring(0, 200), short: false }
          ],
          footer: 'LegacyGuard Support System',
          ts: Math.floor(Date.now() / 1000)
        };

      case 'escalation':
        return {
          color: '#ff4444',
          title: '🚨 Eskalácia Ticketu',
          fields: [
            { title: 'Ticket ID', value: event.ticket_id, short: true },
            { title: 'Dôvod', value: event.data.reason, short: true },
            { title: 'AI Confidence', value: `${event.data.confidence}%`, short: true },
            { title: 'Sentiment', value: event.data.sentiment, short: true }
          ],
          footer: 'Immediate attention required',
          ts: Math.floor(Date.now() / 1000)
        };

      case 'churn_risk':
        return {
          color: '#ff9500',
          title: '⚠️ Churn Risk Alert',
          fields: [
            { title: 'Používateľ', value: event.data.user_email, short: true },
            { title: 'Risk Score', value: `${event.data.risk_score}%`, short: true },
            { title: 'Tier', value: event.data.subscription_tier, short: true },
            { title: 'Last Activity', value: event.data.last_activity, short: true }
          ],
          footer: 'Proactive intervention recommended',
          ts: Math.floor(Date.now() / 1000)
        };

      default:
        return {
          color: colors.medium,
          title: `📢 Support Event: ${event.type}`,
          text: JSON.stringify(event.data, null, 2),
          footer: 'LegacyGuard Support System',
          ts: Math.floor(Date.now() / 1000)
        };
    }
  }

  /**
   * Discord Integration
   */
  async sendDiscordNotification(event: NotificationEvent, config: any): Promise<boolean> {
    try {
      const { webhook_url } = config;

      const embed = this.formatDiscordEmbed(event);

      const response = await fetch(webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'LegacyGuard Support',
          avatar_url: 'https://example.com/logo.png',
          embeds: [embed]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Discord notification failed:', error);
      return false;
    }
  }

  private formatDiscordEmbed(event: NotificationEvent): any {
    const colors = {
      low: 0x36a64f,
      medium: 0xff9500,
      high: 0xff4444,
      urgent: 0x8b0000
    };

    const baseEmbed = {
      color: colors[event.priority],
      timestamp: new Date().toISOString(),
      footer: { text: 'LegacyGuard Support System' }
    };

    switch (event.type) {
      case 'ticket_created':
        return {
          ...baseEmbed,
          title: '🎫 Nový Support Ticket',
          description: event.data.description.substring(0, 200),
          fields: [
            { name: 'Používateľ', value: event.data.user_email, inline: true },
            { name: 'Kategória', value: event.data.category, inline: true },
            { name: 'Priorita', value: event.priority, inline: true }
          ]
        };

      case 'escalation':
        return {
          ...baseEmbed,
          title: '🚨 Eskalácia Ticketu',
          description: 'Ticket vyžaduje okamžitú pozornosť',
          fields: [
            { name: 'Ticket ID', value: event.ticket_id || 'N/A', inline: true },
            { name: 'Dôvod', value: event.data.reason, inline: true },
            { name: 'AI Confidence', value: `${event.data.confidence}%`, inline: true }
          ]
        };

      default:
        return {
          ...baseEmbed,
          title: `📢 Support Event: ${event.type}`,
          description: JSON.stringify(event.data, null, 2).substring(0, 200)
        };
    }
  }

  /**
   * Email Integration
   */
  async sendEmailNotification(event: NotificationEvent, config: any): Promise<boolean> {
    try {
      const { smtp_host, smtp_port, username, password, from_email, to_emails } = config;

      const { subject, html, text } = this.formatEmailContent(event);

      // In production, use nodemailer or similar
      console.log('Email notification:', { subject, to_emails, html });

      return true;
    } catch (error) {
      console.error('Email notification failed:', error);
      return false;
    }
  }

  private formatEmailContent(event: NotificationEvent): { subject: string; html: string; text: string } {
    switch (event.type) {
      case 'ticket_created':
        return {
          subject: `[LegacyGuard] Nový Support Ticket - ${event.priority.toUpperCase()}`,
          html: `
            <h2>🎫 Nový Support Ticket</h2>
            <p><strong>Používateľ:</strong> ${event.data.user_email}</p>
            <p><strong>Kategória:</strong> ${event.data.category}</p>
            <p><strong>Priorita:</strong> ${event.priority}</p>
            <p><strong>Popis:</strong></p>
            <blockquote>${event.data.description}</blockquote>
            <hr>
            <p><small>LegacyGuard Support System</small></p>
          `,
          text: `
            Nový Support Ticket

            Používateľ: ${event.data.user_email}
            Kategória: ${event.data.category}
            Priorita: ${event.priority}

            Popis:
            ${event.data.description}

            --
            LegacyGuard Support System
          `
        };

      case 'escalation':
        return {
          subject: `[LegacyGuard] ESKALÁCIA - Ticket ${event.ticket_id}`,
          html: `
            <h2>🚨 Eskalácia Ticketu</h2>
            <p><strong>Ticket ID:</strong> ${event.ticket_id}</p>
            <p><strong>Dôvod:</strong> ${event.data.reason}</p>
            <p><strong>AI Confidence:</strong> ${event.data.confidence}%</p>
            <p><strong>Sentiment:</strong> ${event.data.sentiment}</p>
            <hr>
            <p><em>Vyžaduje okamžitú pozornosť</em></p>
          `,
          text: `
            ESKALÁCIA TICKETU

            Ticket ID: ${event.ticket_id}
            Dôvod: ${event.data.reason}
            AI Confidence: ${event.data.confidence}%
            Sentiment: ${event.data.sentiment}

            Vyžaduje okamžitú pozornosť
          `
        };

      default:
        return {
          subject: `[LegacyGuard] Support Event: ${event.type}`,
          html: `<h2>Support Event</h2><pre>${JSON.stringify(event.data, null, 2)}</pre>`,
          text: `Support Event: ${event.type}\n\n${JSON.stringify(event.data, null, 2)}`
        };
    }
  }

  /**
   * Webhook Integration
   */
  async sendWebhookNotification(event: NotificationEvent, config: any): Promise<boolean> {
    try {
      const { url, method = 'POST', headers = {}, secret } = config;

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        source: 'legacyguard_support',
        integration_id: config.integration_id
      };

      // Add signature if secret is provided
      if (secret) {
        payload.signature = await this.generateWebhookSignature(payload, secret);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LegacyGuard-Support/1.0',
          ...headers
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error('Webhook notification failed:', error);
      return false;
    }
  }

  private async generateWebhookSignature(payload: WebhookPayload, secret: string): Promise<string> {
    // In production, use crypto to generate HMAC-SHA256 signature
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = encoder.encode(secret);

    // Simplified signature for demo
    return `sha256=${Buffer.from(data).toString('hex')}`;
  }

  /**
   * Zendesk Integration
   */
  async createZendeskTicket(event: NotificationEvent, config: any): Promise<boolean> {
    try {
      const { subdomain, email, api_token } = config;

      const ticket = {
        ticket: {
          subject: `[LegacyGuard] ${event.data.title || event.type}`,
          comment: {
            body: event.data.description || JSON.stringify(event.data, null, 2)
          },
          priority: this.mapPriorityToZendesk(event.priority),
          type: 'incident',
          tags: ['legacyguard', 'automated', event.type],
          custom_fields: [
            { id: 'user_tier', value: event.data.user_tier },
            { id: 'source', value: 'legacyguard_support' }
          ]
        }
      };

      const response = await fetch(`https://${subdomain}.zendesk.com/api/v2/tickets.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${email}/token:${api_token}`).toString('base64')}`
        },
        body: JSON.stringify(ticket)
      });

      return response.ok;
    } catch (error) {
      console.error('Zendesk integration failed:', error);
      return false;
    }
  }

  private mapPriorityToZendesk(priority: string): string {
    const mapping = {
      low: 'low',
      medium: 'normal',
      high: 'high',
      urgent: 'urgent'
    };
    return mapping[priority as keyof typeof mapping] || 'normal';
  }

  /**
   * Main notification dispatcher
   */
  async sendNotification(event: NotificationEvent): Promise<void> {
    try {
      // Get active integrations
      const { data: integrations } = await this.supabase
        .from('support_integrations')
        .select('*')
        .eq('enabled', true)
        .eq('sync_status', 'active');

      if (!integrations || integrations.length === 0) {
        console.log('No active integrations found');
        return;
      }

      // Send to all active integrations
      const promises = integrations.map(async (integration) => {
        try {
          let success = false;

          switch (integration.type) {
            case 'slack':
              success = await this.sendSlackNotification(event, integration.configuration);
              break;
            case 'discord':
              success = await this.sendDiscordNotification(event, integration.configuration);
              break;
            case 'email':
              success = await this.sendEmailNotification(event, integration.configuration);
              break;
            case 'webhook':
              success = await this.sendWebhookNotification(event, integration.configuration);
              break;
            case 'zendesk':
              success = await this.createZendeskTicket(event, integration.configuration);
              break;
            default:
              console.warn(`Unknown integration type: ${integration.type}`);
              return;
          }

          // Log the result
          await this.logIntegrationEvent(integration.id, event, success);

        } catch (error) {
          console.error(`Integration ${integration.type} failed:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await this.logIntegrationEvent(integration.id, event, false, errorMessage);
        }
      });

      await Promise.allSettled(promises);

    } catch (error) {
      console.error('Failed to send notifications:', error);
    }
  }

  /**
   * Log integration events for monitoring
   */
  private async logIntegrationEvent(
    integrationId: string,
    event: NotificationEvent,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from('integration_logs')
        .insert({
          integration_id: integrationId,
          event_type: event.type,
          event_priority: event.priority,
          success,
          error_message: errorMessage,
          event_data: event.data,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to log integration event:', error);
    }
  }

  /**
   * Test integration connectivity
   */
  async testIntegration(integration: Integration): Promise<{ success: boolean; error?: string }> {
    try {
      const testEvent: NotificationEvent = {
        type: 'ticket_created',
        priority: 'low',
        data: {
          title: 'Test Notification',
          description: 'This is a test notification from LegacyGuard Support System',
          user_email: 'test@example.com',
          category: 'technical'
        }
      };

      let success = false;

      switch (integration.type) {
        case 'slack':
          success = await this.sendSlackNotification(testEvent, integration.configuration);
          break;
        case 'discord':
          success = await this.sendDiscordNotification(testEvent, integration.configuration);
          break;
        case 'email':
          success = await this.sendEmailNotification(testEvent, integration.configuration);
          break;
        case 'webhook':
          success = await this.sendWebhookNotification(testEvent, integration.configuration);
          break;
        case 'zendesk':
          success = await this.createZendeskTicket(testEvent, integration.configuration);
          break;
        default:
          throw new Error(`Unknown integration type: ${integration.type}`);
      }

      return { success };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get integration templates for setup
   */
  getIntegrationTemplates(): Record<IntegrationType, any> {
    return {
      slack: {
        name: 'Slack',
        description: 'Send notifications to Slack channels',
        required_fields: ['webhook_url', 'channel'],
        optional_fields: ['username'],
        setup_guide: 'Create a Slack webhook in your workspace settings'
      },
      discord: {
        name: 'Discord',
        description: 'Send notifications to Discord channels',
        required_fields: ['webhook_url'],
        optional_fields: [],
        setup_guide: 'Create a Discord webhook in your server channel settings'
      },
      email: {
        name: 'Email',
        description: 'Send email notifications',
        required_fields: ['smtp_host', 'smtp_port', 'username', 'password', 'from_email', 'to_emails'],
        optional_fields: [],
        setup_guide: 'Configure SMTP settings for your email provider'
      },
      webhook: {
        name: 'Custom Webhook',
        description: 'Send HTTP webhooks to custom endpoints',
        required_fields: ['url'],
        optional_fields: ['method', 'headers', 'secret'],
        setup_guide: 'Provide your webhook endpoint URL'
      },
      zendesk: {
        name: 'Zendesk',
        description: 'Create tickets in Zendesk',
        required_fields: ['subdomain', 'email', 'api_token'],
        optional_fields: [],
        setup_guide: 'Generate an API token in your Zendesk admin settings'
      },
      intercom: {
        name: 'Intercom',
        description: 'Create conversations in Intercom',
        required_fields: ['access_token'],
        optional_fields: [],
        setup_guide: 'Create an access token in Intercom Developer Hub'
      },
      freshdesk: {
        name: 'Freshdesk',
        description: 'Create tickets in Freshdesk',
        required_fields: ['domain', 'api_key'],
        optional_fields: [],
        setup_guide: 'Generate an API key in your Freshdesk admin settings'
      },
      jira: {
        name: 'Jira',
        description: 'Create issues in Jira',
        required_fields: ['base_url', 'email', 'api_token', 'project_key'],
        optional_fields: [],
        setup_guide: 'Create an API token in your Atlassian account settings'
      },
      notion: {
        name: 'Notion',
        description: 'Create pages in Notion database',
        required_fields: ['token', 'database_id'],
        optional_fields: [],
        setup_guide: 'Create an integration and get the database ID from Notion'
      }
    };
  }
}

// Utility functions
export function createAPIIntegrationsManager(): APIIntegrationsManager {
  return new APIIntegrationsManager();
}

export async function sendSupportNotification(event: NotificationEvent): Promise<void> {
  const manager = new APIIntegrationsManager();
  await manager.sendNotification(event);
}

// Common event creators
export function createTicketEvent(
  ticketData: any,
  priority: NotificationEvent['priority'] = 'medium'
): NotificationEvent {
  return {
    type: 'ticket_created',
    priority,
    data: ticketData,
    ticket_id: ticketData.id,
    user_id: ticketData.user_id
  };
}

export function createEscalationEvent(
  ticketId: string,
  reason: string,
  confidence: number,
  sentiment: string
): NotificationEvent {
  return {
    type: 'escalation',
    priority: 'high',
    data: { reason, confidence, sentiment },
    ticket_id: ticketId
  };
}

export function createChurnRiskEvent(
  userId: string,
  riskScore: number,
  userTier: string,
  lastActivity: string
): NotificationEvent {
  return {
    type: 'churn_risk',
    priority: riskScore > 0.8 ? 'urgent' : 'high',
    data: {
      risk_score: riskScore,
      subscription_tier: userTier,
      last_activity: lastActivity
    },
    user_id: userId
  };
}