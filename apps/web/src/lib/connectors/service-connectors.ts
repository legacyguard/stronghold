import { createClient } from '@/lib/supabase';

export interface ServiceConnector {
  id: string;
  organization_id: string;
  service_type: 'salesforce' | 'hubspot' | 'mailchimp' | 'stripe' | 'docusign' | 'dropbox' | 'google_drive' | 'office365' | 'custom';
  name: string;
  configuration: {
    api_key?: string;
    api_secret?: string;
    access_token?: string;
    refresh_token?: string;
    base_url?: string;
    webhook_secret?: string;
    custom_headers?: Record<string, string>;
    rate_limit?: {
      requests_per_minute: number;
      requests_per_hour: number;
    };
    timeout_ms?: number;
    retry_config?: {
      max_retries: number;
      backoff_multiplier: number;
      initial_delay_ms: number;
    };
  };
  status: 'active' | 'inactive' | 'error' | 'rate_limited' | 'token_expired';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_sync_at?: Date;
  last_error?: string;
  sync_count: number;
  error_count: number;
  metadata: Record<string, any>;
}

export interface SyncOperation {
  id: string;
  connector_id: string;
  operation_type: 'import' | 'export' | 'sync' | 'webhook';
  entity_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  records_processed: number;
  records_total: number;
  records_success: number;
  records_failed: number;
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
  configuration: Record<string, any>;
  results: {
    created: number;
    updated: number;
    deleted: number;
    errors: any[];
  };
}

export interface ConnectorSchema {
  service_type: string;
  entities: {
    [entity: string]: {
      fields: {
        [field: string]: {
          type: string;
          required: boolean;
          description: string;
          mapping?: string;
        };
      };
      endpoints: {
        list: string;
        get: string;
        create: string;
        update: string;
        delete: string;
      };
    };
  };
  authentication: {
    type: 'api_key' | 'oauth2' | 'basic' | 'bearer';
    fields: string[];
  };
  rate_limits: {
    requests_per_minute: number;
    requests_per_hour: number;
  };
}

class ServiceConnectorEngine {
  private static instance: ServiceConnectorEngine;
  private supabase = createClient();
  private isInitialized = false;
  private connectors: Map<string, ServiceConnector> = new Map();
  private schemas: Map<string, ConnectorSchema> = new Map();
  private rateLimiters: Map<string, { tokens: number; lastRefill: number }> = new Map();

  static getInstance(): ServiceConnectorEngine {
    if (!ServiceConnectorEngine.instance) {
      ServiceConnectorEngine.instance = new ServiceConnectorEngine();
    }
    return ServiceConnectorEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadConnectorSchemas();
    await this.loadActiveConnectors();
    await this.startSyncScheduler();
    this.isInitialized = true;
  }

  async createConnector(
    organizationId: string,
    serviceType: string,
    name: string,
    configuration: Record<string, any>
  ): Promise<ServiceConnector> {
    const schema = this.schemas.get(serviceType);
    if (!schema) {
      throw new Error(`Unsupported service type: ${serviceType}`);
    }

    // Validate configuration
    await this.validateConfiguration(configuration, schema);

    const connector: Partial<ServiceConnector> = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      service_type: serviceType as any,
      name,
      configuration,
      status: 'inactive',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      sync_count: 0,
      error_count: 0,
      metadata: {}
    };

    const { data, error } = await this.supabase
      .from('service_connectors')
      .insert(connector)
      .select()
      .single();

    if (error) throw error;

    // Test the connection
    const testResult = await this.testConnection(data.id);
    if (testResult.success) {
      await this.updateConnectorStatus(data.id, 'active');
      data.status = 'active';
    } else {
      await this.updateConnectorStatus(data.id, 'error', testResult.error);
      data.status = 'error';
      data.last_error = testResult.error;
    }

    this.connectors.set(data.id, data);
    return data;
  }

  async testConnection(connectorId: string): Promise<{ success: boolean; error?: string }> {
    const connector = await this.getConnector(connectorId);
    if (!connector) {
      return { success: false, error: 'Connector not found' };
    }

    try {
      switch (connector.service_type) {
        case 'salesforce':
          return await this.testSalesforceConnection(connector);
        case 'hubspot':
          return await this.testHubSpotConnection(connector);
        case 'mailchimp':
          return await this.testMailchimpConnection(connector);
        case 'stripe':
          return await this.testStripeConnection(connector);
        case 'docusign':
          return await this.testDocuSignConnection(connector);
        case 'dropbox':
          return await this.testDropboxConnection(connector);
        case 'google_drive':
          return await this.testGoogleDriveConnection(connector);
        case 'office365':
          return await this.testOffice365Connection(connector);
        default:
          return await this.testCustomConnection(connector);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async syncData(
    connectorId: string,
    entityType: string,
    operationType: 'import' | 'export' | 'sync',
    options: {
      batchSize?: number;
      filters?: Record<string, any>;
      mapping?: Record<string, string>;
    } = {}
  ): Promise<string> {
    const connector = await this.getConnector(connectorId);
    if (!connector || connector.status !== 'active') {
      throw new Error('Connector not available for sync');
    }

    const operation: Partial<SyncOperation> = {
      id: crypto.randomUUID(),
      connector_id: connectorId,
      operation_type: operationType,
      entity_type: entityType,
      status: 'pending',
      records_processed: 0,
      records_total: 0,
      records_success: 0,
      records_failed: 0,
      started_at: new Date(),
      configuration: options,
      results: {
        created: 0,
        updated: 0,
        deleted: 0,
        errors: []
      }
    };

    const { data, error } = await this.supabase
      .from('sync_operations')
      .insert(operation)
      .select()
      .single();

    if (error) throw error;

    // Start sync in background
    this.executeSyncOperation(data.id);

    return data.id;
  }

  async executeSyncOperation(operationId: string): Promise<void> {
    const { data: operation } = await this.supabase
      .from('sync_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (!operation) return;

    try {
      await this.supabase
        .from('sync_operations')
        .update({ status: 'running' })
        .eq('id', operationId);

      const connector = await this.getConnector(operation.connector_id);
      if (!connector) throw new Error('Connector not found');

      const schema = this.schemas.get(connector.service_type);
      if (!schema) throw new Error('Schema not found');

      let result;
      switch (operation.operation_type) {
        case 'import':
          result = await this.importData(connector, schema, operation);
          break;
        case 'export':
          result = await this.exportData(connector, schema, operation);
          break;
        case 'sync':
          result = await this.syncBidirectional(connector, schema, operation);
          break;
        default:
          throw new Error('Unknown operation type');
      }

      await this.supabase
        .from('sync_operations')
        .update({
          status: 'completed',
          completed_at: new Date(),
          records_total: result.total,
          records_processed: result.processed,
          records_success: result.success,
          records_failed: result.failed,
          results: result.results
        })
        .eq('id', operationId);

      await this.updateConnectorStats(connector.id, true);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.supabase
        .from('sync_operations')
        .update({
          status: 'failed',
          completed_at: new Date(),
          error_message: errorMessage
        })
        .eq('id', operationId);

      await this.updateConnectorStats(operation.connector_id, false, errorMessage);
    }
  }

  async getSyncOperations(
    connectorId: string,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<SyncOperation[]> {
    let query = this.supabase
      .from('sync_operations')
      .select('*')
      .eq('connector_id', connectorId)
      .order('started_at', { ascending: false });

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

  async getConnectorMetrics(
    organizationId: string,
    timeRange: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    total_connectors: number;
    active_connectors: number;
    sync_operations: number;
    success_rate: number;
    data_transferred: number;
  }> {
    const timeAgo = new Date();
    switch (timeRange) {
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

    const { data: connectors } = await this.supabase
      .from('service_connectors')
      .select('sync_count, error_count, status')
      .eq('organization_id', organizationId);

    const { data: operations } = await this.supabase
      .from('sync_operations')
      .select('status, records_processed')
      .gte('started_at', timeAgo.toISOString());

    const totalConnectors = connectors?.length || 0;
    const activeConnectors = connectors?.filter(c => c.status === 'active').length || 0;
    const syncOperations = operations?.length || 0;
    const successfulOps = operations?.filter(op => op.status === 'completed').length || 0;
    const dataTransferred = operations?.reduce((sum, op) => sum + op.records_processed, 0) || 0;

    return {
      total_connectors: totalConnectors,
      active_connectors: activeConnectors,
      sync_operations: syncOperations,
      success_rate: syncOperations > 0 ? (successfulOps / syncOperations) * 100 : 0,
      data_transferred: dataTransferred
    };
  }

  private async getConnector(connectorId: string): Promise<ServiceConnector | null> {
    if (this.connectors.has(connectorId)) {
      return this.connectors.get(connectorId)!;
    }

    const { data } = await this.supabase
      .from('service_connectors')
      .select('*')
      .eq('id', connectorId)
      .single();

    if (data) {
      this.connectors.set(connectorId, data);
    }

    return data;
  }

  private async updateConnectorStatus(
    connectorId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date()
    };

    if (errorMessage) {
      updates.last_error = errorMessage;
    }

    await this.supabase
      .from('service_connectors')
      .update(updates)
      .eq('id', connectorId);
  }

  private async updateConnectorStats(
    connectorId: string,
    success: boolean,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      last_sync_at: new Date()
    };

    if (success) {
      await this.supabase.rpc('increment_connector_sync', { connector_id: connectorId });
    } else {
      await this.supabase.rpc('increment_connector_error', { connector_id: connectorId });
      if (errorMessage) {
        updates.last_error = errorMessage;
      }
    }

    await this.supabase
      .from('service_connectors')
      .update(updates)
      .eq('id', connectorId);
  }

  private async validateConfiguration(config: Record<string, any>, schema: ConnectorSchema): Promise<void> {
    const requiredFields = schema.authentication.fields;
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }

  private async testSalesforceConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const baseUrl = connector.configuration.base_url || 'https://login.salesforce.com';
    const response = await fetch(`${baseUrl}/services/data/v58.0/sobjects/`, {
      headers: {
        'Authorization': `Bearer ${connector.configuration.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testHubSpotConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=1', {
      headers: {
        'Authorization': `Bearer ${connector.configuration.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testMailchimpConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const apiKey = connector.configuration.api_key;
    const dc = apiKey.split('-')[1];

    const response = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists`, {
      headers: {
        'Authorization': `apikey ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testStripeConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      headers: {
        'Authorization': `Bearer ${connector.configuration.api_key}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testDocuSignConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const baseUrl = connector.configuration.base_url || 'https://demo.docusign.net/restapi';

    const response = await fetch(`${baseUrl}/v2.1/accounts`, {
      headers: {
        'Authorization': `Bearer ${connector.configuration.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testDropboxConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connector.configuration.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testGoogleDriveConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
      headers: {
        'Authorization': `Bearer ${connector.configuration.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testOffice365Connection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${connector.configuration.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };
  }

  private async testCustomConnection(connector: ServiceConnector): Promise<{ success: boolean; error?: string }> {
    if (!connector.configuration.base_url) {
      return { success: false, error: 'Base URL not configured for custom connector' };
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...connector.configuration.custom_headers
    };

    if (connector.configuration.api_key) {
      headers['Authorization'] = `Bearer ${connector.configuration.api_key}`;
    }

    try {
      const response = await fetch(connector.configuration.base_url, {
        headers,
        signal: AbortSignal.timeout(connector.configuration.timeout_ms || 10000)
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  private async importData(
    connector: ServiceConnector,
    schema: ConnectorSchema,
    operation: SyncOperation
  ): Promise<any> {
    // Simplified import implementation
    return {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      results: { created: 0, updated: 0, deleted: 0, errors: [] }
    };
  }

  private async exportData(
    connector: ServiceConnector,
    schema: ConnectorSchema,
    operation: SyncOperation
  ): Promise<any> {
    // Simplified export implementation
    return {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      results: { created: 0, updated: 0, deleted: 0, errors: [] }
    };
  }

  private async syncBidirectional(
    connector: ServiceConnector,
    schema: ConnectorSchema,
    operation: SyncOperation
  ): Promise<any> {
    // Simplified bidirectional sync implementation
    return {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      results: { created: 0, updated: 0, deleted: 0, errors: [] }
    };
  }

  private async loadConnectorSchemas(): Promise<void> {
    // Load connector schemas - in production these would come from configuration files
    const salesforceSchema: ConnectorSchema = {
      service_type: 'salesforce',
      entities: {
        contacts: {
          fields: {
            FirstName: { type: 'string', required: false, description: 'First name' },
            LastName: { type: 'string', required: true, description: 'Last name' },
            Email: { type: 'email', required: false, description: 'Email address' }
          },
          endpoints: {
            list: '/services/data/v58.0/sobjects/Contact',
            get: '/services/data/v58.0/sobjects/Contact/{id}',
            create: '/services/data/v58.0/sobjects/Contact',
            update: '/services/data/v58.0/sobjects/Contact/{id}',
            delete: '/services/data/v58.0/sobjects/Contact/{id}'
          }
        }
      },
      authentication: {
        type: 'oauth2',
        fields: ['access_token', 'refresh_token', 'base_url']
      },
      rate_limits: {
        requests_per_minute: 1000,
        requests_per_hour: 25000
      }
    };

    this.schemas.set('salesforce', salesforceSchema);

    // Add other schemas...
  }

  private async loadActiveConnectors(): Promise<void> {
    const { data: connectors } = await this.supabase
      .from('service_connectors')
      .select('*')
      .eq('is_active', true);

    if (connectors) {
      for (const connector of connectors) {
        this.connectors.set(connector.id, connector);
      }
    }
  }

  private async startSyncScheduler(): Promise<void> {
    // Background scheduler for automated syncs
    setInterval(async () => {
      try {
        // Process scheduled sync operations
        const { data: operations } = await this.supabase
          .from('sync_operations')
          .select('*')
          .eq('status', 'pending')
          .lte('started_at', new Date().toISOString());

        if (operations) {
          for (const operation of operations) {
            this.executeSyncOperation(operation.id);
          }
        }
      } catch (error) {
        console.error('Sync scheduler error:', error);
      }
    }, 60000); // Check every minute
  }
}

export const serviceConnectors = ServiceConnectorEngine.getInstance();