import { supabase } from '@/lib/supabase';
import { DataEncryption } from './encryption';

interface SecurityEvent {
  user_id: string;
  event_type: 'login' | 'logout' | 'failed_login' | 'password_change' | 'suspicious_activity';
  ip_address: string;
  user_agent: string;
  location?: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface SessionInfo {
  user_id: string;
  session_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_activity: string;
  is_active: boolean;
}

export class SessionManager {
  private static readonly MAX_SESSIONS_PER_USER = 5;
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly FAILED_LOGIN_THRESHOLD = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  /**
   * Create new user session
   */
  static async createSession(userId: string, request: Request): Promise<string> {
    const sessionId = DataEncryption.generateSecureToken();
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    try {
      // Clean up old sessions
      await this.cleanupOldSessions(userId);

      // Create new session
      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          ip_address: ipAddress,
          user_agent: userAgent,
          created_at: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true
        });

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'login',
        ip_address: ipAddress,
        user_agent: userAgent,
        timestamp: new Date().toISOString()
      });

      return sessionId;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  /**
   * Validate session and update activity
   */
  static async validateSession(sessionId: string): Promise<SessionInfo | null> {
    try {
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .single();

      if (error || !session) return null;

      // Check if session expired
      const lastActivity = new Date(session.last_activity);
      const now = new Date();
      if (now.getTime() - lastActivity.getTime() > this.SESSION_TIMEOUT) {
        await this.invalidateSession(sessionId);
        return null;
      }

      // Update last activity
      await supabase
        .from('user_sessions')
        .update({ last_activity: now.toISOString() })
        .eq('session_id', sessionId);

      return session;
    } catch (error) {
      console.error('Session validation failed:', error);
      return null;
    }
  }

  /**
   * Invalidate specific session
   */
  static async invalidateSession(sessionId: string): Promise<void> {
    try {
      const { data: session } = await supabase
        .from('user_sessions')
        .select('user_id, ip_address, user_agent')
        .eq('session_id', sessionId)
        .single();

      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId);

      if (session) {
        await this.logSecurityEvent({
          user_id: session.user_id,
          event_type: 'logout',
          ip_address: session.ip_address,
          user_agent: session.user_agent,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Failed to invalidate session:', error);
    }
  }

  /**
   * Invalidate all user sessions (useful for password change, etc.)
   */
  static async invalidateAllUserSessions(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', userId);

      await this.logSecurityEvent({
        user_id: userId,
        event_type: 'logout',
        ip_address: 'system',
        user_agent: 'system',
        timestamp: new Date().toISOString(),
        details: { reason: 'all_sessions_invalidated' }
      });
    } catch (error) {
      console.error('Failed to invalidate all sessions:', error);
    }
  }

  /**
   * Check for suspicious login activity
   */
  static async checkSuspiciousActivity(userId: string, request: Request): Promise<boolean> {
    const ipAddress = this.getClientIP(request);
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    try {
      // Check failed login attempts
      const { data: failedLogins } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'failed_login')
        .gte('timestamp', thirtyMinutesAgo.toISOString());

      if (failedLogins && failedLogins.length >= this.FAILED_LOGIN_THRESHOLD) {
        await this.logSecurityEvent({
          user_id: userId,
          event_type: 'suspicious_activity',
          ip_address: ipAddress,
          user_agent: request.headers.get('user-agent') || 'Unknown',
          timestamp: new Date().toISOString(),
          details: { reason: 'multiple_failed_logins', count: failedLogins.length }
        });

        return true;
      }

      // Check for multiple IPs
      const { data: recentSessions } = await supabase
        .from('user_sessions')
        .select('ip_address')
        .eq('user_id', userId)
        .gte('created_at', thirtyMinutesAgo.toISOString());

      if (recentSessions) {
        const uniqueIPs = new Set(recentSessions.map(s => s.ip_address));
        if (uniqueIPs.size > 3) {
          await this.logSecurityEvent({
            user_id: userId,
            event_type: 'suspicious_activity',
            ip_address: ipAddress,
            user_agent: request.headers.get('user-agent') || 'Unknown',
            timestamp: new Date().toISOString(),
            details: { reason: 'multiple_ips', count: uniqueIPs.size }
          });

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
      return false;
    }
  }

  /**
   * Log failed login attempt
   */
  static async logFailedLogin(userId: string, request: Request): Promise<void> {
    const ipAddress = this.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'failed_login',
      ip_address: ipAddress,
      user_agent: userAgent,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check if user is locked out
   */
  static async isUserLockedOut(userId: string): Promise<boolean> {
    const now = new Date();
    const lockoutStart = new Date(now.getTime() - this.LOCKOUT_DURATION);

    try {
      const { data: failedLogins } = await supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .eq('event_type', 'failed_login')
        .gte('timestamp', lockoutStart.toISOString());

      return failedLogins ? failedLogins.length >= this.FAILED_LOGIN_THRESHOLD : false;
    } catch (error) {
      console.error('Failed to check lockout status:', error);
      return false;
    }
  }

  /**
   * Get active sessions for user
   */
  static async getUserSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const { data: sessions, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      if (error) throw error;

      return sessions || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Clean up old sessions
   */
  private static async cleanupOldSessions(userId: string): Promise<void> {
    try {
      // Get current active sessions
      const sessions = await this.getUserSessions(userId);

      // If user has too many sessions, deactivate oldest ones
      if (sessions.length >= this.MAX_SESSIONS_PER_USER) {
        const sessionsToDeactivate = sessions
          .slice(this.MAX_SESSIONS_PER_USER - 1)
          .map(s => s.session_id);

        await supabase
          .from('user_sessions')
          .update({ is_active: false })
          .in('session_id', sessionsToDeactivate);
      }

      // Clean up expired sessions
      const expiredTime = new Date(Date.now() - this.SESSION_TIMEOUT);
      await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .lt('last_activity', expiredTime.toISOString());
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await supabase
        .from('security_events')
        .insert(event);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get client IP address
   */
  private static getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const remoteAddr = request.headers.get('remote-addr');

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return realIP || remoteAddr || 'unknown';
  }

  /**
   * Generate device fingerprint
   */
  static generateDeviceFingerprint(userAgent: string, acceptLanguage?: string): string {
    const components = [
      userAgent,
      acceptLanguage || 'unknown'
    ].join('|');

    return DataEncryption.hash(components, 'device-fingerprint').hash;
  }
}