import { createClient } from '@supabase/supabase-js';
import { AnalyticsTracker } from '@/lib/analytics/tracker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  pagePath?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  user_id?: string;
  error_type: string;
  error_message: string;
  error_stack?: string;
  page_path?: string;
  user_agent?: string;
  ip_address?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  timestamp: string;
  created_at: string;
}

export type ErrorType =
  | 'validation_error'
  | 'authentication_error'
  | 'authorization_error'
  | 'network_error'
  | 'database_error'
  | 'api_error'
  | 'ui_error'
  | 'performance_error'
  | 'third_party_error'
  | 'unknown_error';

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  originalError?: Error;
  context?: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userFriendlyMessage?: string;
  retryable?: boolean;
  reportToUser?: boolean;
}

export class StrongholdError extends Error {
  public readonly type: ErrorType;
  public readonly severity: 'low' | 'medium' | 'high' | 'critical';
  public readonly userFriendlyMessage: string;
  public readonly context: ErrorContext;
  public readonly retryable: boolean;
  public readonly reportToUser: boolean;
  public readonly originalError?: Error;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = 'StrongholdError';
    this.type = details.type;
    this.severity = details.severity;
    this.userFriendlyMessage = details.userFriendlyMessage || this.getDefaultUserMessage(details.type);
    this.context = details.context || {};
    this.retryable = details.retryable ?? false;
    this.reportToUser = details.reportToUser ?? true;
    this.originalError = details.originalError;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, StrongholdError);
    }
  }

  private getDefaultUserMessage(type: ErrorType): string {
    const messages: Record<ErrorType, string> = {
      validation_error: 'Please check your input and try again.',
      authentication_error: 'Please log in to continue.',
      authorization_error: 'You do not have permission to perform this action.',
      network_error: 'Network connection issue. Please check your internet connection.',
      database_error: 'A temporary issue occurred. Please try again later.',
      api_error: 'Service temporarily unavailable. Please try again.',
      ui_error: 'An interface issue occurred. Please refresh the page.',
      performance_error: 'The request is taking longer than expected.',
      third_party_error: 'External service unavailable. Please try again later.',
      unknown_error: 'An unexpected error occurred. Please try again.'
    };

    return messages[type];
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userFriendlyMessage: this.userFriendlyMessage,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      reportToUser: this.reportToUser,
      stack: this.stack,
      originalError: this.originalError?.message
    };
  }
}

export class ErrorHandler {
  private static sessionId: string = ErrorHandler.generateSessionId();

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static async handleError(error: Error | StrongholdError, context?: ErrorContext): Promise<void> {
    let strongholdError: StrongholdError;

    if (error instanceof StrongholdError) {
      strongholdError = error;
    } else {
      // Convert regular Error to StrongholdError
      strongholdError = new StrongholdError({
        type: ErrorHandler.classifyError(error),
        message: error.message,
        originalError: error,
        context,
        severity: 'medium',
        retryable: false
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('StrongholdError:', strongholdError.toJSON());
    }

    // Log to analytics
    try {
      await AnalyticsTracker.track('error', strongholdError.type, strongholdError.context.userId, {
        error_type: strongholdError.type,
        error_message: strongholdError.message,
        severity: strongholdError.severity,
        page_path: strongholdError.context.pagePath,
        retryable: strongholdError.retryable,
        ...strongholdError.context.metadata
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }

    // Save to database
    try {
      await ErrorHandler.saveToDatabase(strongholdError);
    } catch (dbError) {
      console.error('Failed to save error to database:', dbError);
      // Fallback to local storage for critical errors
      ErrorHandler.saveToLocalStorage(strongholdError);
    }

    // Report to external services for critical errors
    if (strongholdError.severity === 'critical') {
      ErrorHandler.reportCriticalError(strongholdError);
    }
  }

  private static classifyError(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('validation') || message.includes('required')) {
      return 'validation_error';
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return 'authentication_error';
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return 'authorization_error';
    }

    if (message.includes('network') || message.includes('fetch')) {
      return 'network_error';
    }

    if (message.includes('database') || message.includes('sql')) {
      return 'database_error';
    }

    if (stack.includes('api/') || message.includes('api')) {
      return 'api_error';
    }

    return 'unknown_error';
  }

  private static async saveToDatabase(error: StrongholdError): Promise<void> {
    const errorData = {
      user_id: error.context.userId || null,
      error_type: error.type,
      error_message: error.message,
      error_stack: error.stack,
      page_path: error.context.pagePath,
      user_agent: error.context.userAgent,
      metadata: {
        severity: error.severity,
        retryable: error.retryable,
        user_friendly_message: error.userFriendlyMessage,
        session_id: ErrorHandler.sessionId,
        ...error.context.metadata
      },
      resolved: false
    };

    const { error: dbError } = await supabase
      .from('error_logs')
      .insert(errorData);

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }
  }

  private static saveToLocalStorage(error: StrongholdError): void {
    try {
      const stored = localStorage.getItem('stronghold_error_queue') || '[]';
      const errorQueue = JSON.parse(stored);

      errorQueue.push({
        ...error.toJSON(),
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 errors
      if (errorQueue.length > 50) {
        errorQueue.splice(0, errorQueue.length - 50);
      }

      localStorage.setItem('stronghold_error_queue', JSON.stringify(errorQueue));
    } catch (storageError) {
      console.error('Failed to save error to localStorage:', storageError);
    }
  }

  private static reportCriticalError(error: StrongholdError): void {
    // In production, this would integrate with services like Sentry, Bugsnag, etc.
    console.error('CRITICAL ERROR REPORTED:', error.toJSON());

    // Could send to external monitoring service
    // Example: Sentry.captureException(error);
  }

  // Process queued errors from localStorage
  static async processErrorQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem('stronghold_error_queue');
      if (!stored) return;

      const errorQueue = JSON.parse(stored);
      if (errorQueue.length === 0) return;

      // Try to upload queued errors
      for (const errorData of errorQueue) {
        try {
          await supabase.from('error_logs').insert({
            user_id: errorData.context?.userId || null,
            error_type: errorData.type,
            error_message: errorData.message,
            error_stack: errorData.stack,
            page_path: errorData.context?.pagePath,
            user_agent: errorData.context?.userAgent,
            metadata: {
              severity: errorData.severity,
              retryable: errorData.retryable,
              user_friendly_message: errorData.userFriendlyMessage,
              session_id: ErrorHandler.sessionId,
              queued: true,
              ...errorData.context?.metadata
            },
            resolved: false
          });
        } catch (uploadError) {
          console.error('Failed to upload queued error:', uploadError);
          break; // Stop processing if still having connection issues
        }
      }

      // Clear queue after successful upload
      localStorage.removeItem('stronghold_error_queue');
    } catch (queueError) {
      console.error('Failed to process error queue:', queueError);
    }
  }

  // Get error statistics
  static async getErrorStats(days: number = 7): Promise<{
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    errorTrend: Array<{ date: string; count: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('error_type, metadata, timestamp')
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const totalErrors = data?.length || 0;
      const errorsByType: Record<string, number> = {};
      const errorsBySeverity: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      data?.forEach(log => {
        // Count by type
        errorsByType[log.error_type] = (errorsByType[log.error_type] || 0) + 1;

        // Count by severity
        const severity = log.metadata?.severity || 'unknown';
        errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;

        // Count by date
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        dailyCounts[date] = (dailyCounts[date] || 0) + 1;
      });

      const errorTrend = Object.entries(dailyCounts).map(([date, count]) => ({
        date,
        count
      }));

      return {
        totalErrors,
        errorsByType,
        errorsBySeverity,
        errorTrend
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsBySeverity: {},
        errorTrend: []
      };
    }
  }

  // Mark error as resolved
  static async resolveError(errorId: string, resolvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: resolvedBy
        })
        .eq('id', errorId);

      return !error;
    } catch (error) {
      console.error('Failed to resolve error:', error);
      return false;
    }
  }

  // Initialize error handler
  static initialize(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      ErrorHandler.handleError(new StrongholdError({
        type: 'ui_error',
        message: event.message,
        severity: 'medium',
        context: {
          pagePath: window.location.pathname,
          userAgent: navigator.userAgent,
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      }));
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      ErrorHandler.handleError(new StrongholdError({
        type: 'unknown_error',
        message: `Unhandled promise rejection: ${event.reason}`,
        severity: 'high',
        context: {
          pagePath: window.location.pathname,
          userAgent: navigator.userAgent,
          metadata: {
            reason: event.reason
          }
        }
      }));
    });

    // Process any queued errors
    ErrorHandler.processErrorQueue();
  }
}