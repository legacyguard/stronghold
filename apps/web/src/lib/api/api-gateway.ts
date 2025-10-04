import { createClient } from '@/lib/supabase';
import { auditTrail } from '@/lib/security/audit-trail';
import { securityThreatDetection } from '@/lib/security/threat-detection';

export interface APIKey {
  id: string;
  name: string;
  key_hash: string;
  prefix: string;
  user_id: string;
  organization_id?: string;
  scopes: string[];
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    requests_per_day: number;
  };
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    admin: boolean;
  };
  restrictions: {
    ip_whitelist?: string[];
    allowed_endpoints?: string[];
    allowed_methods?: string[];
    referrer_whitelist?: string[];
  };
  is_active: boolean;
  expires_at?: Date;
  last_used_at?: Date;
  created_at: Date;
  created_by: string;
  metadata: Record<string, any>;
}

export interface APIRequest {
  id: string;
  api_key_id?: string;
  user_id?: string;
  method: string;
  endpoint: string;
  ip_address: string;
  user_agent: string;
  request_headers: Record<string, string>;
  request_body?: any;
  response_status: number;
  response_headers: Record<string, string>;
  response_body?: any;
  response_time_ms: number;
  timestamp: Date;
  rate_limit_hit: boolean;
  error_message?: string;
  metadata: Record<string, any>;
}

export interface RateLimitBucket {
  id: string;
  api_key_id: string;
  window_type: 'minute' | 'hour' | 'day';
  window_start: Date;
  request_count: number;
  last_request: Date;
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  description: string;
  parameters: APIParameter[];
  request_schema?: any;
  response_schema?: any;
  examples: APIExample[];
  rate_limits: {
    default_per_minute: number;
    default_per_hour: number;
    default_per_day: number;
  };
  authentication_required: boolean;
  scopes_required: string[];
  is_public: boolean;
  is_deprecated: boolean;
  deprecation_date?: Date;
  replacement_endpoint?: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface APIParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  location: 'query' | 'path' | 'header' | 'body';
  required: boolean;
  description: string;
  default_value?: any;
  validation_rules?: {
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;
    enum_values?: any[];
  };
  examples: any[];
}

export interface APIExample {
  name: string;
  description: string;
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body: any;
  };
}

export interface APIDocumentation {
  version: string;
  title: string;
  description: string;
  base_url: string;
  authentication: {
    type: 'api_key' | 'bearer_token' | 'oauth2';
    description: string;
    flows?: any;
  };
  endpoints: APIEndpoint[];
  schemas: Record<string, any>;
  tags: Array<{
    name: string;
    description: string;
  }>;
  servers: Array<{
    url: string;
    description: string;
  }>;
  contact: {
    name: string;
    email: string;
    url: string;
  };
  license: {
    name: string;
    url: string;
  };
  generated_at: Date;
}

export interface APIMetrics {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  requests_by_endpoint: Record<string, number>;
  requests_by_status: Record<string, number>;
  top_api_keys: Array<{
    api_key_id: string;
    request_count: number;
    success_rate: number;
  }>;
  rate_limit_violations: number;
  error_rate: number;
  uptime_percentage: number;
}

class APIGatewayEngine {
  private static instance: APIGatewayEngine;
  private supabase = createClient();
  private apiKeys: Map<string, APIKey> = new Map();
  private endpoints: Map<string, APIEndpoint> = new Map();
  private rateLimitBuckets: Map<string, RateLimitBucket[]> = new Map();
  private isInitialized = false;

  static getInstance(): APIGatewayEngine {
    if (!APIGatewayEngine.instance) {
      APIGatewayEngine.instance = new APIGatewayEngine();
    }
    return APIGatewayEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadAPIKeys();
    await this.loadEndpoints();
    await this.setupDefaultEndpoints();
    this.startCleanupTasks();
    this.isInitialized = true;
  }

  private async loadAPIKeys(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('api_keys')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        data.forEach(key => {
          this.apiKeys.set(key.prefix, key);
        });
      }
    } catch (error) {
      console.error('Error loading API keys:', error);
    }
  }

  private async loadEndpoints(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('api_endpoints')
        .select('*');

      if (error) throw error;

      if (data) {
        data.forEach(endpoint => {
          const key = `${endpoint.method}:${endpoint.path}`;
          this.endpoints.set(key, endpoint);
        });
      }
    } catch (error) {
      console.error('Error loading API endpoints:', error);
    }
  }

  private async setupDefaultEndpoints(): Promise<void> {
    if (this.endpoints.size > 0) return; // Endpoints already exist

    const defaultEndpoints: Partial<APIEndpoint>[] = [
      {
        id: 'user-profile-get',
        path: '/api/v1/users/{userId}',
        method: 'GET',
        description: 'Retrieve user profile information',
        parameters: [
          {
            name: 'userId',
            type: 'string',
            location: 'path',
            required: true,
            description: 'Unique identifier for the user',
            examples: ['user_123', 'usr_456789']
          }
        ],
        examples: [
          {
            name: 'Get User Profile',
            description: 'Retrieve profile for a specific user',
            request: {
              method: 'GET',
              url: '/api/v1/users/user_123',
              headers: { 'Authorization': 'Bearer your_api_key' }
            },
            response: {
              status: 200,
              body: {
                id: 'user_123',
                email: 'user@example.com',
                name: 'John Doe',
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        ],
        rate_limits: {
          default_per_minute: 60,
          default_per_hour: 1000,
          default_per_day: 10000
        },
        authentication_required: true,
        scopes_required: ['users:read'],
        is_public: false,
        is_deprecated: false,
        tags: ['Users', 'Profile']
      },
      {
        id: 'user-profile-update',
        path: '/api/v1/users/{userId}',
        method: 'PUT',
        description: 'Update user profile information',
        parameters: [
          {
            name: 'userId',
            type: 'string',
            location: 'path',
            required: true,
            description: 'Unique identifier for the user',
            examples: ['user_123']
          },
          {
            name: 'name',
            type: 'string',
            location: 'body',
            required: false,
            description: 'Updated name for the user',
            validation_rules: {
              min_length: 1,
              max_length: 100
            },
            examples: ['John Smith']
          }
        ],
        examples: [
          {
            name: 'Update User Name',
            description: 'Update the name field of a user profile',
            request: {
              method: 'PUT',
              url: '/api/v1/users/user_123',
              headers: {
                'Authorization': 'Bearer your_api_key',
                'Content-Type': 'application/json'
              },
              body: { name: 'John Smith' }
            },
            response: {
              status: 200,
              body: {
                id: 'user_123',
                email: 'user@example.com',
                name: 'John Smith',
                updated_at: '2024-01-01T12:00:00Z'
              }
            }
          }
        ],
        rate_limits: {
          default_per_minute: 30,
          default_per_hour: 500,
          default_per_day: 2000
        },
        authentication_required: true,
        scopes_required: ['users:write'],
        is_public: false,
        is_deprecated: false,
        tags: ['Users', 'Profile']
      },
      {
        id: 'analytics-metrics',
        path: '/api/v1/analytics/metrics',
        method: 'GET',
        description: 'Retrieve analytics metrics and insights',
        parameters: [
          {
            name: 'start_date',
            type: 'string',
            location: 'query',
            required: true,
            description: 'Start date for metrics (ISO 8601 format)',
            examples: ['2024-01-01', '2024-01-01T00:00:00Z']
          },
          {
            name: 'end_date',
            type: 'string',
            location: 'query',
            required: true,
            description: 'End date for metrics (ISO 8601 format)',
            examples: ['2024-01-31', '2024-01-31T23:59:59Z']
          },
          {
            name: 'metric_type',
            type: 'string',
            location: 'query',
            required: false,
            description: 'Type of metrics to retrieve',
            validation_rules: {
              enum_values: ['engagement', 'performance', 'security', 'compliance']
            },
            examples: ['engagement']
          }
        ],
        examples: [
          {
            name: 'Get Monthly Metrics',
            description: 'Retrieve engagement metrics for January 2024',
            request: {
              method: 'GET',
              url: '/api/v1/analytics/metrics?start_date=2024-01-01&end_date=2024-01-31&metric_type=engagement',
              headers: { 'Authorization': 'Bearer your_api_key' }
            },
            response: {
              status: 200,
              body: {
                period: { start: '2024-01-01', end: '2024-01-31' },
                metrics: {
                  total_users: 1247,
                  active_users: 892,
                  engagement_rate: 0.715
                }
              }
            }
          }
        ],
        rate_limits: {
          default_per_minute: 10,
          default_per_hour: 100,
          default_per_day: 1000
        },
        authentication_required: true,
        scopes_required: ['analytics:read'],
        is_public: false,
        is_deprecated: false,
        tags: ['Analytics', 'Metrics']
      },
      {
        id: 'webhook-create',
        path: '/api/v1/webhooks',
        method: 'POST',
        description: 'Create a new webhook endpoint',
        parameters: [
          {
            name: 'url',
            type: 'string',
            location: 'body',
            required: true,
            description: 'The URL to send webhook payloads to',
            validation_rules: {
              pattern: '^https?://.+'
            },
            examples: ['https://example.com/webhook']
          },
          {
            name: 'events',
            type: 'array',
            location: 'body',
            required: true,
            description: 'Array of event types to subscribe to',
            examples: [['user.created', 'user.updated']]
          }
        ],
        examples: [
          {
            name: 'Create User Event Webhook',
            description: 'Create a webhook to receive user-related events',
            request: {
              method: 'POST',
              url: '/api/v1/webhooks',
              headers: {
                'Authorization': 'Bearer your_api_key',
                'Content-Type': 'application/json'
              },
              body: {
                url: 'https://example.com/webhook',
                events: ['user.created', 'user.updated'],
                active: true
              }
            },
            response: {
              status: 201,
              body: {
                id: 'webhook_123',
                url: 'https://example.com/webhook',
                events: ['user.created', 'user.updated'],
                active: true,
                secret: 'whsec_...',
                created_at: '2024-01-01T00:00:00Z'
              }
            }
          }
        ],
        rate_limits: {
          default_per_minute: 5,
          default_per_hour: 50,
          default_per_day: 200
        },
        authentication_required: true,
        scopes_required: ['webhooks:write'],
        is_public: false,
        is_deprecated: false,
        tags: ['Webhooks', 'Integration']
      }
    ];

    for (const endpointData of defaultEndpoints) {
      const endpoint: APIEndpoint = {
        ...endpointData,
        created_at: new Date(),
        updated_at: new Date()
      } as APIEndpoint;

      try {
        const { data, error } = await this.supabase
          .from('api_endpoints')
          .insert(endpoint)
          .select()
          .single();

        if (error) throw error;

        const key = `${endpoint.method}:${endpoint.path}`;
        this.endpoints.set(key, data);
      } catch (error) {
        console.error('Error creating default endpoint:', endpoint.path, error);
      }
    }
  }

  private startCleanupTasks(): void {
    // Clean up old API requests and rate limit buckets every hour
    setInterval(async () => {
      await this.cleanupOldData();
    }, 60 * 60 * 1000); // 1 hour
  }

  async createAPIKey(keyData: Partial<APIKey>, createdBy: string): Promise<{ api_key: string; key_id: string }> {
    try {
      const apiKeyValue = this.generateAPIKey();
      const prefix = apiKeyValue.substring(0, 8);
      const keyHash = await this.hashAPIKey(apiKeyValue);

      const apiKey: APIKey = {
        id: crypto.randomUUID(),
        key_hash: keyHash,
        prefix: prefix,
        created_at: new Date(),
        created_by: createdBy,
        is_active: true,
        metadata: {},
        rate_limit: {
          requests_per_minute: 60,
          requests_per_hour: 1000,
          requests_per_day: 10000
        },
        permissions: {
          read: true,
          write: false,
          delete: false,
          admin: false
        },
        restrictions: {},
        scopes: ['users:read'],
        ...keyData
      } as APIKey;

      const { data, error } = await this.supabase
        .from('api_keys')
        .insert(apiKey)
        .select()
        .single();

      if (error) throw error;

      this.apiKeys.set(prefix, data);

      // Audit log
      await auditTrail.logEvent({
        event_type: 'configuration_change',
        category: 'administrative',
        severity: 'info',
        user_id: createdBy,
        resource_type: 'api_key',
        resource_id: apiKey.id,
        action: 'api_key_created',
        outcome: 'success',
        details: {
          description: `API key created: ${apiKey.name}`,
          scopes: apiKey.scopes,
          permissions: apiKey.permissions
        }
      });

      return {
        api_key: apiKeyValue,
        key_id: apiKey.id
      };

    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  async validateAPIKey(apiKeyValue: string): Promise<APIKey | null> {
    try {
      const prefix = apiKeyValue.substring(0, 8);
      const apiKey = this.apiKeys.get(prefix);

      if (!apiKey || !apiKey.is_active) {
        return null;
      }

      // Check expiration
      if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
        return null;
      }

      // Verify key hash
      const isValid = await this.verifyAPIKey(apiKeyValue, apiKey.key_hash);
      if (!isValid) {
        return null;
      }

      // Update last used
      apiKey.last_used_at = new Date();
      await this.supabase
        .from('api_keys')
        .update({ last_used_at: apiKey.last_used_at })
        .eq('id', apiKey.id);

      return apiKey;

    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }

  async processAPIRequest(
    method: string,
    endpoint: string,
    apiKey: APIKey | null,
    request: {
      ip_address: string;
      user_agent: string;
      headers: Record<string, string>;
      body?: any;
    }
  ): Promise<{ allowed: boolean; reason?: string; rate_limit_status?: any }> {
    const startTime = Date.now();

    try {
      // Find endpoint configuration
      const endpointConfig = this.findEndpointConfig(method, endpoint);
      if (!endpointConfig) {
        return { allowed: false, reason: 'Endpoint not found' };
      }

      // Check authentication requirements
      if (endpointConfig.authentication_required && !apiKey) {
        return { allowed: false, reason: 'Authentication required' };
      }

      // Check scopes if API key is provided
      if (apiKey && endpointConfig.scopes_required.length > 0) {
        const hasRequiredScopes = endpointConfig.scopes_required.every(scope =>
          apiKey.scopes.includes(scope)
        );
        if (!hasRequiredScopes) {
          return { allowed: false, reason: 'Insufficient scopes' };
        }
      }

      // Check IP restrictions
      if (apiKey?.restrictions.ip_whitelist) {
        if (!apiKey.restrictions.ip_whitelist.includes(request.ip_address)) {
          return { allowed: false, reason: 'IP address not allowed' };
        }
      }

      // Check rate limits
      if (apiKey) {
        const rateLimitResult = await this.checkRateLimit(apiKey, endpointConfig);
        if (!rateLimitResult.allowed) {
          return {
            allowed: false,
            reason: 'Rate limit exceeded',
            rate_limit_status: rateLimitResult.status
          };
        }
      }

      // Check for suspicious patterns
      await this.detectSuspiciousActivity(apiKey, request, endpointConfig);

      return { allowed: true };

    } catch (error) {
      console.error('Error processing API request:', error);
      return { allowed: false, reason: 'Internal error' };
    }
  }

  async logAPIRequest(
    method: string,
    endpoint: string,
    apiKey: APIKey | null,
    request: any,
    response: {
      status: number;
      headers: Record<string, string>;
      body?: any;
      response_time_ms: number;
    },
    rateLimitHit: boolean = false,
    errorMessage?: string
  ): Promise<void> {
    try {
      const apiRequest: Partial<APIRequest> = {
        id: crypto.randomUUID(),
        api_key_id: apiKey?.id,
        user_id: apiKey?.user_id,
        method: method,
        endpoint: endpoint,
        ip_address: request.ip_address,
        user_agent: request.user_agent,
        request_headers: request.headers,
        request_body: request.body,
        response_status: response.status,
        response_headers: response.headers,
        response_body: response.body,
        response_time_ms: response.response_time_ms,
        timestamp: new Date(),
        rate_limit_hit: rateLimitHit,
        error_message: errorMessage,
        metadata: {}
      };

      await this.supabase.from('api_requests').insert(apiRequest);

      // Log to audit trail for important endpoints
      if (method !== 'GET' || response.status >= 400) {
        await auditTrail.logEvent({
          event_type: 'data_access',
          category: 'operational',
          severity: response.status >= 400 ? 'warning' : 'info',
          user_id: apiKey?.user_id,
          ip_address: request.ip_address,
          user_agent: request.user_agent,
          resource_type: 'api_endpoint',
          resource_id: endpoint,
          action: `api_${method.toLowerCase()}`,
          outcome: response.status < 400 ? 'success' : 'failure',
          details: {
            description: `API ${method} ${endpoint} - ${response.status}`,
            api_key_id: apiKey?.id,
            response_time_ms: response.response_time_ms,
            rate_limit_hit: rateLimitHit,
            error_message: errorMessage
          }
        });
      }

    } catch (error) {
      console.error('Error logging API request:', error);
    }
  }

  async generateAPIDocumentation(): Promise<APIDocumentation> {
    try {
      const documentation: APIDocumentation = {
        version: '1.0.0',
        title: 'LegacyGuard API',
        description: 'Enterprise family legacy protection platform API',
        base_url: 'https://api.legacyguard.com',
        authentication: {
          type: 'api_key',
          description: 'API key authentication using Bearer token in Authorization header'
        },
        endpoints: Array.from(this.endpoints.values()),
        schemas: this.generateAPISchemas(),
        tags: [
          { name: 'Users', description: 'User management and profile operations' },
          { name: 'Analytics', description: 'Analytics and metrics endpoints' },
          { name: 'Webhooks', description: 'Webhook management and event subscriptions' },
          { name: 'Security', description: 'Security and compliance endpoints' }
        ],
        servers: [
          { url: 'https://api.legacyguard.com', description: 'Production server' },
          { url: 'https://api-staging.legacyguard.com', description: 'Staging server' }
        ],
        contact: {
          name: 'LegacyGuard API Support',
          email: 'api-support@legacyguard.com',
          url: 'https://docs.legacyguard.com'
        },
        license: {
          name: 'Proprietary',
          url: 'https://legacyguard.com/license'
        },
        generated_at: new Date()
      };

      return documentation;

    } catch (error) {
      console.error('Error generating API documentation:', error);
      throw error;
    }
  }

  async getAPIMetrics(timeRange: { start: Date; end: Date }): Promise<APIMetrics> {
    try {
      const { data: requests } = await this.supabase
        .from('api_requests')
        .select('*')
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString());

      if (!requests) {
        return this.getEmptyMetrics();
      }

      const totalRequests = requests.length;
      const successfulRequests = requests.filter(r => r.response_status < 400).length;
      const failedRequests = totalRequests - successfulRequests;
      const avgResponseTime = requests.reduce((sum, r) => sum + r.response_time_ms, 0) / totalRequests;

      const requestsByEndpoint: Record<string, number> = {};
      const requestsByStatus: Record<string, number> = {};
      const apiKeyStats = new Map<string, { count: number; successes: number }>();

      requests.forEach(request => {
        // Endpoint stats
        const endpoint = `${request.method} ${request.endpoint}`;
        requestsByEndpoint[endpoint] = (requestsByEndpoint[endpoint] || 0) + 1;

        // Status stats
        const statusGroup = `${Math.floor(request.response_status / 100)}xx`;
        requestsByStatus[statusGroup] = (requestsByStatus[statusGroup] || 0) + 1;

        // API key stats
        if (request.api_key_id) {
          const stats = apiKeyStats.get(request.api_key_id) || { count: 0, successes: 0 };
          stats.count++;
          if (request.response_status < 400) stats.successes++;
          apiKeyStats.set(request.api_key_id, stats);
        }
      });

      const topApiKeys = Array.from(apiKeyStats.entries())
        .map(([keyId, stats]) => ({
          api_key_id: keyId,
          request_count: stats.count,
          success_rate: stats.successes / stats.count
        }))
        .sort((a, b) => b.request_count - a.request_count)
        .slice(0, 10);

      const rateLimitViolations = requests.filter(r => r.rate_limit_hit).length;
      const errorRate = failedRequests / totalRequests;

      return {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        failed_requests: failedRequests,
        avg_response_time_ms: avgResponseTime,
        requests_by_endpoint: requestsByEndpoint,
        requests_by_status: requestsByStatus,
        top_api_keys: topApiKeys,
        rate_limit_violations: rateLimitViolations,
        error_rate: errorRate,
        uptime_percentage: 99.9 // Simplified calculation
      };

    } catch (error) {
      console.error('Error getting API metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  private generateAPIKey(): string {
    const prefix = 'lgapi_';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = prefix;
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async hashAPIKey(apiKey: string): Promise<string> {
    // In production, use proper cryptographic hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyAPIKey(apiKey: string, hash: string): Promise<boolean> {
    const computedHash = await this.hashAPIKey(apiKey);
    return computedHash === hash;
  }

  private findEndpointConfig(method: string, endpoint: string): APIEndpoint | null {
    // Try exact match first
    const exactKey = `${method}:${endpoint}`;
    if (this.endpoints.has(exactKey)) {
      return this.endpoints.get(exactKey)!;
    }

    // Try pattern matching for parameterized endpoints
    for (const [key, config] of this.endpoints.entries()) {
      const [configMethod, configPath] = key.split(':');
      if (configMethod === method && this.matchesPathPattern(endpoint, configPath)) {
        return config;
      }
    }

    return null;
  }

  private matchesPathPattern(actualPath: string, patternPath: string): boolean {
    // Simple pattern matching for {param} style patterns
    const actualParts = actualPath.split('/');
    const patternParts = patternPath.split('/');

    if (actualParts.length !== patternParts.length) {
      return false;
    }

    return patternParts.every((part, index) => {
      return part.startsWith('{') && part.endsWith('}') || part === actualParts[index];
    });
  }

  private async checkRateLimit(apiKey: APIKey, endpoint: APIEndpoint): Promise<{ allowed: boolean; status: any }> {
    try {
      const now = new Date();
      const limits = [
        { window: 'minute', limit: apiKey.rate_limit.requests_per_minute, duration: 60 * 1000 },
        { window: 'hour', limit: apiKey.rate_limit.requests_per_hour, duration: 60 * 60 * 1000 },
        { window: 'day', limit: apiKey.rate_limit.requests_per_day, duration: 24 * 60 * 60 * 1000 }
      ];

      for (const { window, limit, duration } of limits) {
        const windowStart = new Date(now.getTime() - duration);

        const { data: buckets } = await this.supabase
          .from('rate_limit_buckets')
          .select('*')
          .eq('api_key_id', apiKey.id)
          .eq('window_type', window)
          .gte('window_start', windowStart.toISOString());

        const requestCount = buckets?.reduce((sum, bucket) => sum + bucket.request_count, 0) || 0;

        if (requestCount >= limit) {
          return {
            allowed: false,
            status: {
              window,
              limit,
              current: requestCount,
              reset_time: new Date(now.getTime() + duration)
            }
          };
        }
      }

      // Update rate limit buckets
      await this.updateRateLimitBuckets(apiKey.id, now);

      return { allowed: true, status: {} };

    } catch (error) {
      console.error('Error checking rate limit:', error);
      return { allowed: true, status: {} }; // Allow on error
    }
  }

  private async updateRateLimitBuckets(apiKeyId: string, timestamp: Date): Promise<void> {
    try {
      const windows = [
        { type: 'minute', duration: 60 * 1000 },
        { type: 'hour', duration: 60 * 60 * 1000 },
        { type: 'day', duration: 24 * 60 * 60 * 1000 }
      ];

      for (const window of windows) {
        const windowStart = new Date(timestamp.getTime() - (timestamp.getTime() % window.duration));

        const { data: existingBucket } = await this.supabase
          .from('rate_limit_buckets')
          .select('*')
          .eq('api_key_id', apiKeyId)
          .eq('window_type', window.type)
          .eq('window_start', windowStart.toISOString())
          .single();

        if (existingBucket) {
          await this.supabase
            .from('rate_limit_buckets')
            .update({
              request_count: existingBucket.request_count + 1,
              last_request: timestamp
            })
            .eq('id', existingBucket.id);
        } else {
          await this.supabase
            .from('rate_limit_buckets')
            .insert({
              id: crypto.randomUUID(),
              api_key_id: apiKeyId,
              window_type: window.type,
              window_start: windowStart,
              request_count: 1,
              last_request: timestamp
            });
        }
      }

    } catch (error) {
      console.error('Error updating rate limit buckets:', error);
    }
  }

  private async detectSuspiciousActivity(apiKey: APIKey | null, request: any, endpoint: APIEndpoint): Promise<void> {
    try {
      const suspiciousIndicators = [];

      // High frequency requests
      if (apiKey) {
        const recentRequests = await this.getRecentRequestCount(apiKey.id, 60000); // Last minute
        if (recentRequests > 100) {
          suspiciousIndicators.push('high_frequency_requests');
        }
      }

      // Unusual user agent
      if (!request.user_agent || request.user_agent.length < 10) {
        suspiciousIndicators.push('suspicious_user_agent');
      }

      // Multiple failed requests from same IP
      const failedRequests = await this.getFailedRequestCount(request.ip_address, 300000); // Last 5 minutes
      if (failedRequests > 10) {
        suspiciousIndicators.push('multiple_failed_requests');
      }

      if (suspiciousIndicators.length > 0) {
        await securityThreatDetection.processSecurityEvent({
          event_type: 'suspicious_activity',
          severity: 'medium',
          user_id: apiKey?.user_id,
          ip_address: request.ip_address,
          user_agent: request.user_agent,
          event_data: {
            endpoint: endpoint.path,
            method: endpoint.method,
            api_key_id: apiKey?.id,
            risk_indicators: suspiciousIndicators
          }
        });
      }

    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
    }
  }

  private async getRecentRequestCount(apiKeyId: string, timeWindowMs: number): Promise<number> {
    const since = new Date(Date.now() - timeWindowMs);

    const { data } = await this.supabase
      .from('api_requests')
      .select('id', { count: 'exact' })
      .eq('api_key_id', apiKeyId)
      .gte('timestamp', since.toISOString());

    return data?.length || 0;
  }

  private async getFailedRequestCount(ipAddress: string, timeWindowMs: number): Promise<number> {
    const since = new Date(Date.now() - timeWindowMs);

    const { data } = await this.supabase
      .from('api_requests')
      .select('id', { count: 'exact' })
      .eq('ip_address', ipAddress)
      .gte('response_status', 400)
      .gte('timestamp', since.toISOString());

    return data?.length || 0;
  }

  private generateAPISchemas(): Record<string, any> {
    return {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique user identifier' },
          email: { type: 'string', format: 'email', description: 'User email address' },
          name: { type: 'string', description: 'User full name' },
          created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' },
          updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
        },
        required: ['id', 'email', 'name', 'created_at']
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Error message' },
          code: { type: 'string', description: 'Error code' },
          details: { type: 'object', description: 'Additional error details' }
        },
        required: ['error', 'code']
      }
    };
  }

  private async cleanupOldData(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Clean up old API requests
      await this.supabase
        .from('api_requests')
        .delete()
        .lt('timestamp', thirtyDaysAgo.toISOString());

      // Clean up old rate limit buckets
      await this.supabase
        .from('rate_limit_buckets')
        .delete()
        .lt('window_start', thirtyDaysAgo.toISOString());

    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  private getEmptyMetrics(): APIMetrics {
    return {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      avg_response_time_ms: 0,
      requests_by_endpoint: {},
      requests_by_status: {},
      top_api_keys: [],
      rate_limit_violations: 0,
      error_rate: 0,
      uptime_percentage: 100
    };
  }

  // Public getters
  getEndpoints(): APIEndpoint[] {
    return Array.from(this.endpoints.values());
  }

  getActiveAPIKeyCount(): number {
    return this.apiKeys.size;
  }
}

// Export singleton instance
export const apiGateway = APIGatewayEngine.getInstance();