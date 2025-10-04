import { createClient } from '@/lib/supabase';

export interface MFAMethod {
  id: string;
  user_id: string;
  method_type: 'totp' | 'sms' | 'email' | 'hardware_key' | 'backup_codes';
  is_primary: boolean;
  is_verified: boolean;
  created_at: Date;
  last_used_at?: Date;
  configuration: {
    secret_key?: string; // For TOTP
    phone_number?: string; // For SMS
    email_address?: string; // For email
    device_id?: string; // For hardware keys
    backup_codes?: string[]; // For backup codes
  };
  metadata: Record<string, any>;
}

export interface AccessControl {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id?: string;
  permission: 'read' | 'write' | 'delete' | 'admin' | 'execute';
  granted_at: Date;
  granted_by: string;
  expires_at?: Date;
  conditions?: {
    ip_whitelist?: string[];
    time_restrictions?: {
      days_of_week: number[];
      hours_of_day: { start: number; end: number };
    };
    location_restrictions?: string[];
    device_restrictions?: string[];
  };
  status: 'active' | 'suspended' | 'revoked' | 'expired';
}

export interface SecuritySession {
  id: string;
  user_id: string;
  session_token: string;
  created_at: Date;
  expires_at: Date;
  last_activity: Date;
  ip_address: string;
  user_agent: string;
  mfa_verified: boolean;
  risk_score: number;
  is_active: boolean;
  device_fingerprint?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
}

class MFAAccessControlEngine {
  private static instance: MFAAccessControlEngine;
  private supabase = createClient();
  private isInitialized = false;

  static getInstance(): MFAAccessControlEngine {
    if (!MFAAccessControlEngine.instance) {
      MFAAccessControlEngine.instance = new MFAAccessControlEngine();
    }
    return MFAAccessControlEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;
  }

  async setupTOTP(userId: string): Promise<{ secret: string; qr_code: string }> {
    const secret = this.generateTOTPSecret();
    const qrCode = this.generateQRCode(secret, userId);

    const mfaMethod: Partial<MFAMethod> = {
      id: crypto.randomUUID(),
      user_id: userId,
      method_type: 'totp',
      is_primary: true,
      is_verified: false,
      created_at: new Date(),
      configuration: { secret_key: secret },
      metadata: {}
    };

    await this.supabase.from('mfa_methods').insert(mfaMethod);

    return { secret, qr_code: qrCode };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const { data: methods } = await this.supabase
      .from('mfa_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('method_type', 'totp')
      .eq('is_verified', true);

    if (!methods || methods.length === 0) return false;

    const method = methods[0];
    const secret = method.configuration.secret_key;

    return this.validateTOTPToken(secret, token);
  }

  async grantAccess(
    userId: string,
    resourceType: string,
    permission: string,
    grantedBy: string,
    conditions?: any
  ): Promise<string> {
    const accessControl: Partial<AccessControl> = {
      id: crypto.randomUUID(),
      user_id: userId,
      resource_type: resourceType,
      permission: permission as any,
      granted_at: new Date(),
      granted_by: grantedBy,
      conditions: conditions,
      status: 'active'
    };

    const { data, error } = await this.supabase
      .from('access_controls')
      .insert(accessControl)
      .select()
      .single();

    if (error) throw error;
    return data.id;
  }

  async checkAccess(userId: string, resourceType: string, permission: string): Promise<boolean> {
    const { data: permissions } = await this.supabase
      .from('access_controls')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('permission', permission)
      .eq('status', 'active');

    return permissions && permissions.length > 0;
  }

  private generateTOTPSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  }

  private generateQRCode(secret: string, userId: string): string {
    return `otpauth://totp/LegacyGuard:${userId}?secret=${secret}&issuer=LegacyGuard`;
  }

  private validateTOTPToken(secret: string, token: string): boolean {
    // Simplified TOTP validation - in production use proper TOTP library
    const timeWindow = Math.floor(Date.now() / 30000);
    const expectedToken = this.generateTOTPToken(secret, timeWindow);
    return token === expectedToken;
  }

  private generateTOTPToken(secret: string, timeWindow: number): string {
    // Simplified TOTP generation - in production use proper TOTP library
    return String(timeWindow % 1000000).padStart(6, '0');
  }
}

export const mfaAccessControl = MFAAccessControlEngine.getInstance();