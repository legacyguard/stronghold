import { createClient } from '@/lib/supabase';
import { auditTrail } from '@/lib/security/audit-trail';

export interface SSOProvider {
  id: string;
  name: string;
  provider_type: 'saml' | 'oidc' | 'oauth2' | 'ldap' | 'active_directory';
  domain: string;
  is_active: boolean;
  configuration: {
    // SAML Configuration
    saml_entity_id?: string;
    saml_sso_url?: string;
    saml_slo_url?: string;
    saml_certificate?: string;
    saml_private_key?: string;
    saml_name_id_format?: string;
    saml_attribute_mapping?: Record<string, string>;

    // OIDC Configuration
    oidc_issuer?: string;
    oidc_client_id?: string;
    oidc_client_secret?: string;
    oidc_discovery_url?: string;
    oidc_scopes?: string[];
    oidc_claim_mapping?: Record<string, string>;

    // OAuth2 Configuration
    oauth2_client_id?: string;
    oauth2_client_secret?: string;
    oauth2_auth_url?: string;
    oauth2_token_url?: string;
    oauth2_user_info_url?: string;
    oauth2_scope?: string;

    // LDAP Configuration
    ldap_server_url?: string;
    ldap_bind_dn?: string;
    ldap_bind_password?: string;
    ldap_search_base?: string;
    ldap_search_filter?: string;
    ldap_attribute_mapping?: Record<string, string>;
    ldap_use_tls?: boolean;
  };
  user_provisioning: {
    auto_provision: boolean;
    default_role: string;
    role_mapping?: Record<string, string>;
    group_mapping?: Record<string, string[]>;
    attribute_mapping: Record<string, string>;
    deactivate_on_missing: boolean;
  };
  security_settings: {
    force_authentication: boolean;
    session_timeout_minutes: number;
    allowed_clock_drift_seconds: number;
    require_signed_assertions: boolean;
    require_encrypted_assertions: boolean;
    logout_redirect_url?: string;
  };
  created_at: Date;
  created_by: string;
  last_updated: Date;
  last_updated_by: string;
  metadata: Record<string, any>;
}

export interface SSOSession {
  id: string;
  user_id: string;
  provider_id: string;
  session_token: string;
  saml_session_id?: string;
  oidc_session_id?: string;
  created_at: Date;
  expires_at: Date;
  last_activity: Date;
  ip_address: string;
  user_agent: string;
  attributes: Record<string, any>;
  is_active: boolean;
}

export interface SSOUser {
  id: string;
  provider_id: string;
  external_user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  groups: string[];
  roles: string[];
  attributes: Record<string, any>;
  is_active: boolean;
  last_login: Date;
  created_at: Date;
  updated_at: Date;
}

export interface SAMLRequest {
  id: string;
  request_id: string;
  provider_id: string;
  relay_state?: string;
  created_at: Date;
  expires_at: Date;
  is_consumed: boolean;
  metadata: Record<string, any>;
}

export interface SSOAuditEvent {
  id: string;
  event_type: 'login_attempt' | 'login_success' | 'login_failure' | 'logout' | 'provisioning' | 'configuration_change';
  provider_id: string;
  user_id?: string;
  external_user_id?: string;
  timestamp: Date;
  ip_address: string;
  user_agent: string;
  details: {
    error_message?: string;
    attributes_received?: Record<string, any>;
    provisioning_action?: string;
    configuration_changes?: Record<string, any>;
  };
  success: boolean;
}

class EnterpriseSSOEngine {
  private static instance: EnterpriseSSOEngine;
  private supabase = createClient();
  private providers: Map<string, SSOProvider> = new Map();
  private activeSessions: Map<string, SSOSession> = new Map();
  private isInitialized = false;

  static getInstance(): EnterpriseSSOEngine {
    if (!EnterpriseSSOEngine.instance) {
      EnterpriseSSOEngine.instance = new EnterpriseSSOEngine();
    }
    return EnterpriseSSOEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadProviders();
    await this.loadActiveSessions();
    this.startSessionCleanup();
    this.isInitialized = true;
  }

  private async loadProviders(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sso_providers')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        data.forEach(provider => {
          this.providers.set(provider.id, provider);
        });
      }
    } catch (error) {
      console.error('Error loading SSO providers:', error);
    }
  }

  private async loadActiveSessions(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('sso_sessions')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      if (data) {
        data.forEach(session => {
          this.activeSessions.set(session.session_token, session);
        });
      }
    } catch (error) {
      console.error('Error loading active SSO sessions:', error);
    }
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 5 * 60 * 1000);
  }

  async createProvider(providerData: Partial<SSOProvider>, createdBy: string): Promise<string> {
    try {
      const provider: SSOProvider = {
        id: crypto.randomUUID(),
        created_at: new Date(),
        created_by: createdBy,
        last_updated: new Date(),
        last_updated_by: createdBy,
        is_active: true,
        metadata: {},
        ...providerData
      } as SSOProvider;

      const { data, error } = await this.supabase
        .from('sso_providers')
        .insert(provider)
        .select()
        .single();

      if (error) throw error;

      this.providers.set(provider.id, data);

      // Audit log
      await this.logSSOEvent({
        event_type: 'configuration_change',
        provider_id: provider.id,
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'System',
        details: {
          configuration_changes: { action: 'provider_created', provider_name: provider.name }
        },
        success: true
      });

      return provider.id;

    } catch (error) {
      console.error('Error creating SSO provider:', error);
      throw error;
    }
  }

  async initiateSAMLLogin(providerId: string, relayState?: string): Promise<{ redirect_url: string; request_id: string }> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider || provider.provider_type !== 'saml') {
        throw new Error('Invalid SAML provider');
      }

      const requestId = crypto.randomUUID();
      const samlRequest = this.generateSAMLRequest(provider, requestId, relayState);

      // Store SAML request
      const samlRequestRecord: Partial<SAMLRequest> = {
        id: crypto.randomUUID(),
        request_id: requestId,
        provider_id: providerId,
        relay_state: relayState,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        is_consumed: false,
        metadata: {}
      };

      await this.supabase.from('saml_requests').insert(samlRequestRecord);

      const redirectUrl = this.buildSAMLRedirectUrl(provider, samlRequest);

      return {
        redirect_url: redirectUrl,
        request_id: requestId
      };

    } catch (error) {
      console.error('Error initiating SAML login:', error);
      throw error;
    }
  }

  async handleSAMLResponse(samlResponse: string, relayState?: string): Promise<{ session_token: string; user: SSOUser }> {
    try {
      // Parse and validate SAML response
      const parsedResponse = await this.parseSAMLResponse(samlResponse);
      const provider = this.providers.get(parsedResponse.providerId);

      if (!provider) {
        throw new Error('Provider not found');
      }

      // Validate SAML response
      await this.validateSAMLResponse(parsedResponse, provider);

      // Extract user attributes
      const userAttributes = this.extractSAMLAttributes(parsedResponse, provider);

      // Provision or update user
      const ssoUser = await this.provisionUser(provider, userAttributes);

      // Create session
      const session = await this.createSSOSession(provider.id, ssoUser.id, userAttributes);

      // Log successful login
      await this.logSSOEvent({
        event_type: 'login_success',
        provider_id: provider.id,
        user_id: ssoUser.id,
        external_user_id: ssoUser.external_user_id,
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Browser',
        details: {
          attributes_received: userAttributes
        },
        success: true
      });

      return {
        session_token: session.session_token,
        user: ssoUser
      };

    } catch (error) {
      console.error('Error handling SAML response:', error);

      // Log failed login
      await this.logSSOEvent({
        event_type: 'login_failure',
        provider_id: 'unknown',
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Browser',
        details: {
          error_message: error instanceof Error ? error.message : 'Unknown error'
        },
        success: false
      });

      throw error;
    }
  }

  async initiateOIDCLogin(providerId: string, redirectUri: string): Promise<{ redirect_url: string; state: string }> {
    try {
      const provider = this.providers.get(providerId);
      if (!provider || provider.provider_type !== 'oidc') {
        throw new Error('Invalid OIDC provider');
      }

      const state = crypto.randomUUID();
      const nonce = crypto.randomUUID();

      // Build OIDC authorization URL
      const authUrl = new URL(provider.configuration.oidc_discovery_url + '/auth');
      authUrl.searchParams.set('client_id', provider.configuration.oidc_client_id!);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', (provider.configuration.oidc_scopes || ['openid', 'profile', 'email']).join(' '));
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('nonce', nonce);

      // Store state for validation
      await this.supabase.from('oidc_states').insert({
        id: crypto.randomUUID(),
        state: state,
        nonce: nonce,
        provider_id: providerId,
        redirect_uri: redirectUri,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 10 * 60 * 1000)
      });

      return {
        redirect_url: authUrl.toString(),
        state: state
      };

    } catch (error) {
      console.error('Error initiating OIDC login:', error);
      throw error;
    }
  }

  async handleOIDCCallback(code: string, state: string): Promise<{ session_token: string; user: SSOUser }> {
    try {
      // Validate state
      const { data: stateRecord } = await this.supabase
        .from('oidc_states')
        .select('*')
        .eq('state', state)
        .single();

      if (!stateRecord || new Date(stateRecord.expires_at) < new Date()) {
        throw new Error('Invalid or expired state');
      }

      const provider = this.providers.get(stateRecord.provider_id);
      if (!provider) {
        throw new Error('Provider not found');
      }

      // Exchange code for tokens
      const tokens = await this.exchangeOIDCCode(provider, code, stateRecord.redirect_uri);

      // Get user info
      const userInfo = await this.getOIDCUserInfo(provider, tokens.access_token);

      // Provision or update user
      const ssoUser = await this.provisionUser(provider, userInfo);

      // Create session
      const session = await this.createSSOSession(provider.id, ssoUser.id, userInfo);

      // Clean up state
      await this.supabase.from('oidc_states').delete().eq('state', state);

      // Log successful login
      await this.logSSOEvent({
        event_type: 'login_success',
        provider_id: provider.id,
        user_id: ssoUser.id,
        external_user_id: ssoUser.external_user_id,
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Browser',
        details: {
          attributes_received: userInfo
        },
        success: true
      });

      return {
        session_token: session.session_token,
        user: ssoUser
      };

    } catch (error) {
      console.error('Error handling OIDC callback:', error);
      throw error;
    }
  }

  async validateSession(sessionToken: string): Promise<SSOSession | null> {
    try {
      const session = this.activeSessions.get(sessionToken);

      if (!session) {
        // Try loading from database
        const { data } = await this.supabase
          .from('sso_sessions')
          .select('*')
          .eq('session_token', sessionToken)
          .eq('is_active', true)
          .single();

        if (data && new Date(data.expires_at) > new Date()) {
          this.activeSessions.set(sessionToken, data);
          return data;
        }
        return null;
      }

      if (new Date(session.expires_at) < new Date()) {
        await this.invalidateSession(sessionToken);
        return null;
      }

      // Update last activity
      session.last_activity = new Date();
      await this.supabase
        .from('sso_sessions')
        .update({ last_activity: session.last_activity })
        .eq('session_token', sessionToken);

      return session;

    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  async invalidateSession(sessionToken: string): Promise<void> {
    try {
      await this.supabase
        .from('sso_sessions')
        .update({ is_active: false })
        .eq('session_token', sessionToken);

      this.activeSessions.delete(sessionToken);

    } catch (error) {
      console.error('Error invalidating session:', error);
    }
  }

  async initiateSingleLogout(sessionToken: string): Promise<{ logout_url?: string; success: boolean }> {
    try {
      const session = await this.validateSession(sessionToken);
      if (!session) {
        return { success: false };
      }

      const provider = this.providers.get(session.provider_id);
      if (!provider) {
        return { success: false };
      }

      // Invalidate local session
      await this.invalidateSession(sessionToken);

      // Log logout
      await this.logSSOEvent({
        event_type: 'logout',
        provider_id: provider.id,
        user_id: session.user_id,
        timestamp: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Browser',
        details: {},
        success: true
      });

      // Return provider logout URL if available
      if (provider.provider_type === 'saml' && provider.configuration.saml_slo_url) {
        const logoutRequest = this.generateSAMLLogoutRequest(provider, session);
        const logoutUrl = this.buildSAMLLogoutUrl(provider, logoutRequest);
        return { logout_url: logoutUrl, success: true };
      }

      if (provider.security_settings.logout_redirect_url) {
        return { logout_url: provider.security_settings.logout_redirect_url, success: true };
      }

      return { success: true };

    } catch (error) {
      console.error('Error initiating single logout:', error);
      return { success: false };
    }
  }

  private async provisionUser(provider: SSOProvider, attributes: Record<string, any>): Promise<SSOUser> {
    try {
      const externalUserId = attributes[provider.user_provisioning.attribute_mapping.external_id] || attributes.sub || attributes.nameID;
      const email = attributes[provider.user_provisioning.attribute_mapping.email] || attributes.email;

      if (!externalUserId || !email) {
        throw new Error('Required user attributes missing');
      }

      // Check if user already exists
      const { data: existingUser } = await this.supabase
        .from('sso_users')
        .select('*')
        .eq('provider_id', provider.id)
        .eq('external_user_id', externalUserId)
        .single();

      const userData: Partial<SSOUser> = {
        provider_id: provider.id,
        external_user_id: externalUserId,
        email: email,
        first_name: attributes[provider.user_provisioning.attribute_mapping.first_name] || attributes.given_name,
        last_name: attributes[provider.user_provisioning.attribute_mapping.last_name] || attributes.family_name,
        display_name: attributes[provider.user_provisioning.attribute_mapping.display_name] || attributes.name,
        groups: this.extractGroups(attributes, provider),
        roles: this.extractRoles(attributes, provider),
        attributes: attributes,
        is_active: true,
        last_login: new Date(),
        updated_at: new Date()
      };

      if (existingUser) {
        // Update existing user
        const { data, error } = await this.supabase
          .from('sso_users')
          .update(userData)
          .eq('id', existingUser.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new user
        userData.id = crypto.randomUUID();
        userData.created_at = new Date();

        const { data, error } = await this.supabase
          .from('sso_users')
          .insert(userData)
          .select()
          .single();

        if (error) throw error;

        // Log provisioning
        await this.logSSOEvent({
          event_type: 'provisioning',
          provider_id: provider.id,
          user_id: data.id,
          external_user_id: externalUserId,
          timestamp: new Date(),
          ip_address: '127.0.0.1',
          user_agent: 'System',
          details: {
            provisioning_action: 'user_created',
            attributes_received: attributes
          },
          success: true
        });

        return data;
      }

    } catch (error) {
      console.error('Error provisioning user:', error);
      throw error;
    }
  }

  private async createSSOSession(providerId: string, userId: string, attributes: Record<string, any>): Promise<SSOSession> {
    try {
      const session: Partial<SSOSession> = {
        id: crypto.randomUUID(),
        user_id: userId,
        provider_id: providerId,
        session_token: crypto.randomUUID(),
        created_at: new Date(),
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
        last_activity: new Date(),
        ip_address: '127.0.0.1',
        user_agent: 'Browser',
        attributes: attributes,
        is_active: true
      };

      const { data, error } = await this.supabase
        .from('sso_sessions')
        .insert(session)
        .select()
        .single();

      if (error) throw error;

      this.activeSessions.set(data.session_token, data);
      return data;

    } catch (error) {
      console.error('Error creating SSO session:', error);
      throw error;
    }
  }

  private async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();

      // Remove expired sessions from database
      await this.supabase
        .from('sso_sessions')
        .update({ is_active: false })
        .lt('expires_at', now.toISOString());

      // Remove expired sessions from memory
      for (const [token, session] of this.activeSessions.entries()) {
        if (new Date(session.expires_at) < now) {
          this.activeSessions.delete(token);
        }
      }

    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  private async logSSOEvent(event: Partial<SSOAuditEvent>): Promise<void> {
    try {
      const auditEvent: SSOAuditEvent = {
        id: crypto.randomUUID(),
        ...event
      } as SSOAuditEvent;

      await this.supabase.from('sso_audit_events').insert(auditEvent);

      // Also log to main audit trail
      await auditTrail.logEvent({
        event_type: 'authentication',
        category: 'security',
        severity: event.success ? 'info' : 'warning',
        user_id: event.user_id,
        ip_address: event.ip_address || '127.0.0.1',
        user_agent: event.user_agent || 'Unknown',
        resource_type: 'sso_provider',
        resource_id: event.provider_id,
        action: event.event_type || 'sso_action',
        outcome: event.success ? 'success' : 'failure',
        details: {
          description: `SSO ${event.event_type}: ${event.success ? 'Success' : 'Failed'}`,
          provider_id: event.provider_id,
          external_user_id: event.external_user_id,
          ...event.details
        },
        compliance_requirements: ['SOX', 'ISO27001'],
        tags: ['sso', 'enterprise', 'authentication']
      });

    } catch (error) {
      console.error('Error logging SSO event:', error);
    }
  }

  // Simplified helper methods (would be implemented with proper SAML/OIDC libraries)
  private generateSAMLRequest(provider: SSOProvider, requestId: string, relayState?: string): string {
    // In production, use proper SAML library
    return `<samlp:AuthnRequest ID="${requestId}" />`;
  }

  private buildSAMLRedirectUrl(provider: SSOProvider, samlRequest: string): string {
    const encodedRequest = Buffer.from(samlRequest).toString('base64');
    return `${provider.configuration.saml_sso_url}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;
  }

  private async parseSAMLResponse(samlResponse: string): Promise<any> {
    // In production, use proper SAML library to parse and validate
    return {
      providerId: 'example-provider',
      nameID: 'user@example.com',
      attributes: {
        email: 'user@example.com',
        name: 'Test User'
      }
    };
  }

  private async validateSAMLResponse(response: any, provider: SSOProvider): Promise<void> {
    // In production, implement proper SAML response validation
    if (!response.nameID) {
      throw new Error('Invalid SAML response');
    }
  }

  private extractSAMLAttributes(response: any, provider: SSOProvider): Record<string, any> {
    return response.attributes;
  }

  private async exchangeOIDCCode(provider: SSOProvider, code: string, redirectUri: string): Promise<any> {
    // In production, implement proper OIDC token exchange
    return {
      access_token: 'example_access_token',
      id_token: 'example_id_token'
    };
  }

  private async getOIDCUserInfo(provider: SSOProvider, accessToken: string): Promise<any> {
    // In production, implement proper OIDC user info retrieval
    return {
      sub: 'user123',
      email: 'user@example.com',
      name: 'Test User'
    };
  }

  private extractGroups(attributes: Record<string, any>, provider: SSOProvider): string[] {
    const groupAttribute = provider.user_provisioning.attribute_mapping.groups || 'groups';
    const groups = attributes[groupAttribute];
    return Array.isArray(groups) ? groups : [];
  }

  private extractRoles(attributes: Record<string, any>, provider: SSOProvider): string[] {
    const roleAttribute = provider.user_provisioning.attribute_mapping.roles || 'roles';
    const roles = attributes[roleAttribute];

    if (Array.isArray(roles)) {
      return roles;
    }

    // Apply role mapping if configured
    if (provider.user_provisioning.role_mapping) {
      const mappedRoles = [];
      for (const [externalRole, internalRole] of Object.entries(provider.user_provisioning.role_mapping)) {
        if (roles === externalRole || (Array.isArray(roles) && roles.includes(externalRole))) {
          mappedRoles.push(internalRole);
        }
      }
      return mappedRoles;
    }

    return [provider.user_provisioning.default_role];
  }

  private generateSAMLLogoutRequest(provider: SSOProvider, session: SSOSession): string {
    // In production, use proper SAML library
    return `<samlp:LogoutRequest />`;
  }

  private buildSAMLLogoutUrl(provider: SSOProvider, logoutRequest: string): string {
    const encodedRequest = Buffer.from(logoutRequest).toString('base64');
    return `${provider.configuration.saml_slo_url}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;
  }

  // Public getters
  getProviders(): SSOProvider[] {
    return Array.from(this.providers.values());
  }

  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  async getProviderByDomain(domain: string): Promise<SSOProvider | null> {
    for (const provider of this.providers.values()) {
      if (provider.domain === domain) {
        return provider;
      }
    }
    return null;
  }
}

// Export singleton instance
export const enterpriseSSO = EnterpriseSSOEngine.getInstance();