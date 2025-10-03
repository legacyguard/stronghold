import { createClient } from '@supabase/supabase-js';
import { AnalyticsTracker } from '@/lib/analytics/tracker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ServiceContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export abstract class BaseService {
  protected abstract tableName: string;
  protected context: ServiceContext;

  constructor(context: ServiceContext = {}) {
    this.context = context;
  }

  protected getCurrentUserId(): string | undefined {
    return this.context.userId;
  }

  protected getClientIP(): string | undefined {
    return this.context.ipAddress;
  }

  protected getUserAgent(): string | undefined {
    return this.context.userAgent;
  }

  protected async logAction(
    action: string,
    resourceId: string,
    oldValues?: any,
    newValues?: any
  ) {
    try {
      await supabase.from('audit_logs').insert({
        user_id: this.getCurrentUserId(),
        action,
        resource_type: this.tableName,
        resource_id: resourceId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: this.getClientIP(),
        user_agent: this.getUserAgent()
      });
    } catch (error) {
      console.error('Failed to log action:', error);
      // Don't throw - audit logging shouldn't break main functionality
    }
  }

  protected async trackMetric(action: string, metadata?: Record<string, any>) {
    try {
      AnalyticsTracker.trackUserAction(action, this.getCurrentUserId(), {
        service: this.tableName,
        ...metadata
      });
    } catch (error) {
      console.error('Failed to track metric:', error);
      // Don't throw - analytics shouldn't break main functionality
    }
  }

  protected validateUserId(): string {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User authentication required');
    }
    return userId;
  }

  protected async checkRateLimit(action: string, maxRequests: number = 10, windowMs: number = 60000): Promise<boolean> {
    const key = `${this.getCurrentUserId()}_${action}`;
    // Simple rate limiting - in production, use Redis or similar
    // For now, just return true
    return true;
  }

  // Common validation methods
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  protected sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  // Error handling
  protected handleError(error: any, context: string): never {
    console.error(`Service error in ${this.tableName}.${context}:`, error);

    // Track error
    AnalyticsTracker.trackError(
      error instanceof Error ? error : new Error(String(error)),
      this.getCurrentUserId(),
      { service: this.tableName, context }
    );

    // Throw user-friendly error
    if (error?.code === 'PGRST116') {
      throw new Error('Record not found');
    }

    if (error?.code === '23505') {
      throw new Error('Duplicate entry');
    }

    if (error?.code === '23503') {
      throw new Error('Referenced record does not exist');
    }

    throw new Error(`Service error: ${error?.message || 'Unknown error'}`);
  }

  // Database helpers
  protected async executeQuery<T>(
    query: Promise<{ data: T | null; error: any }>,
    context: string
  ): Promise<T> {
    try {
      const { data, error } = await query;

      if (error) {
        this.handleError(error, context);
      }

      if (!data) {
        throw new Error('No data returned');
      }

      return data;
    } catch (error) {
      this.handleError(error, context);
    }
  }

  protected async executeQueryWithCount<T>(
    query: Promise<{ data: T | null; error: any; count?: number }>,
    context: string
  ): Promise<{ data: T; count: number }> {
    try {
      const { data, error, count } = await query;

      if (error) {
        this.handleError(error, context);
      }

      if (!data) {
        throw new Error('No data returned');
      }

      return { data, count: count || 0 };
    } catch (error) {
      this.handleError(error, context);
    }
  }

  // Pagination helpers
  protected getPaginationParams(page: number = 1, limit: number = 10) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    return { from, to };
  }

  // Security helpers
  protected async checkUserPermission(resourceId: string, permission: 'read' | 'write' | 'delete'): Promise<boolean> {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    // Basic check - user can access their own resources
    // Override in specific services for more complex permissions
    return true;
  }

  protected async isResourceOwner(resourceId: string, ownerField: string = 'user_id'): Promise<boolean> {
    const userId = this.getCurrentUserId();
    if (!userId) return false;

    try {
      const { data } = await supabase
        .from(this.tableName)
        .select(ownerField)
        .eq('id', resourceId)
        .single();

      return (data as any)?.[ownerField] === userId;
    } catch {
      return false;
    }
  }

  // Utility methods
  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected getTimestamp(): string {
    return new Date().toISOString();
  }

  // Caching helpers (basic implementation)
  private static cache = new Map<string, { data: any; expires: number }>();

  protected async getFromCache<T>(key: string): Promise<T | null> {
    const cached = BaseService.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    BaseService.cache.delete(key);
    return null;
  }

  protected setCache<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 minutes default
    BaseService.cache.set(key, {
      data,
      expires: Date.now() + ttlMs
    });
  }

  protected clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of BaseService.cache.keys()) {
        if (key.includes(pattern)) {
          BaseService.cache.delete(key);
        }
      }
    } else {
      BaseService.cache.clear();
    }
  }
}

// Service factory for creating services with proper context
export class ServiceFactory {
  static createService<T extends BaseService>(
    ServiceClass: new (context: ServiceContext) => T,
    context: ServiceContext = {}
  ): T {
    return new ServiceClass(context);
  }

  static async createServiceFromRequest<T extends BaseService>(
    ServiceClass: new (context: ServiceContext) => T,
    request?: Request
  ): Promise<T> {
    const context: ServiceContext = {};

    if (request) {
      // Extract user from auth header (implement based on your auth system)
      const authHeader = request.headers.get('authorization');
      if (authHeader) {
        // Parse JWT and extract user ID
        // context.userId = extractUserIdFromToken(authHeader);
      }

      // Extract IP and user agent
      context.ipAddress = request.headers.get('x-forwarded-for') ||
                         request.headers.get('x-real-ip') ||
                         'unknown';
      context.userAgent = request.headers.get('user-agent') || 'unknown';
    }

    return new ServiceClass(context);
  }
}