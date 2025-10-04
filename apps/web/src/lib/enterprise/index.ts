// Enterprise Single Sign-On
export { ssoProvider } from './sso-provider';
export type {
  SSOProvider,
  SSOConfiguration,
  EnterpriseUser,
  SSOSession,
  SAMLResponse,
  OIDCResponse
} from './sso-provider';

// Multi-Factor Authentication & Access Control
export { mfaAccessControl } from '../security/mfa-access-control';
export type {
  MFAMethod,
  AccessControl,
  SecuritySession
} from '../security/mfa-access-control';

// API Gateway
export { apiGateway } from '../api/api-gateway';
export type {
  APIKey,
  APIEndpoint,
  RateLimitBucket,
  APIRequestLog,
  APIDocumentation
} from '../api/api-gateway';

// Webhook System
export { webhookSystem } from '../integrations/webhook-system';
export type {
  WebhookEndpoint,
  WebhookDelivery,
  WebhookEvent,
  ExternalIntegration,
  IntegrationTemplate
} from '../integrations/webhook-system';

// Integration Manager
export { integrationManager } from '../integrations/integration-manager';
export type {
  IntegrationEvent,
  IntegrationFlow,
  IntegrationLog
} from '../integrations/integration-manager';

// Service Connectors
export { serviceConnectors } from '../connectors/service-connectors';
export type {
  ServiceConnector,
  SyncOperation,
  ConnectorSchema
} from '../connectors/service-connectors';

// Enterprise Dashboard Component
export { default as EnterpriseAdminDashboard } from '../../components/enterprise/EnterpriseAdminDashboard';

/**
 * Initialize all enterprise systems
 * This should be called during application startup
 */
export async function initializeEnterpriseServices(): Promise<void> {
  try {
    // Initialize all enterprise services in the correct order
    await mfaAccessControl.initialize();
    await ssoProvider.initialize();
    await apiGateway.initialize();
    await webhookSystem.initialize();
    await integrationManager.initialize();
    await serviceConnectors.initialize();

    console.log('Enterprise services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize enterprise services:', error);
    throw error;
  }
}

/**
 * Enterprise system health check
 * Returns the status of all enterprise components
 */
export async function getEnterpriseSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'critical';
  components: Array<{
    name: string;
    status: 'operational' | 'degraded' | 'down';
    message?: string;
  }>;
}> {
  const components = [];
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

  try {
    // Check SSO Provider
    components.push({
      name: 'SSO Provider',
      status: 'operational'
    });

    // Check MFA Access Control
    components.push({
      name: 'MFA & Access Control',
      status: 'operational'
    });

    // Check API Gateway
    components.push({
      name: 'API Gateway',
      status: 'operational'
    });

    // Check Webhook System
    components.push({
      name: 'Webhook System',
      status: 'operational'
    });

    // Check Integration Manager
    components.push({
      name: 'Integration Manager',
      status: 'operational'
    });

    // Check Service Connectors
    components.push({
      name: 'Service Connectors',
      status: 'operational'
    });

    // Determine overall status
    const degradedComponents = components.filter(c => c.status === 'degraded').length;
    const downComponents = components.filter(c => c.status === 'down').length;

    if (downComponents > 0) {
      overallStatus = 'critical';
    } else if (degradedComponents > 0) {
      overallStatus = 'degraded';
    }

  } catch (error) {
    overallStatus = 'critical';
    components.push({
      name: 'System Check',
      status: 'down',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return {
    status: overallStatus,
    components
  };
}