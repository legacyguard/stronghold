// Enhanced Error Handling & Recovery for Will Generation System

export class WillGenerationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true,
    public userMessage?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'WillGenerationError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      recoverable: this.recoverable,
      userMessage: this.userMessage,
      context: this.context,
      stack: this.stack
    };
  }
}

export class AIServiceError extends WillGenerationError {
  constructor(message: string, public apiError?: any) {
    super(
      message,
      'AI_SERVICE_ERROR',
      true,
      'AI služba je dočasne nedostupná. Skúšame alternatívne riešenie.'
    );
  }
}

export class DatabaseError extends WillGenerationError {
  constructor(message: string, public operation: string) {
    super(
      message,
      'DATABASE_ERROR',
      true,
      'Problém s uložením dát. Skúšame znovu.'
    );
  }
}

export class ValidationError extends WillGenerationError {
  constructor(message: string, public validationIssues: string[]) {
    super(
      message,
      'VALIDATION_ERROR',
      false,
      'Formulár obsahuje neplatné údaje.'
    );
  }
}

export class BudgetExceededError extends WillGenerationError {
  constructor(dailyUsage: number, limit: number) {
    super(
      `Daily AI budget exceeded: $${dailyUsage} of $${limit}`,
      'BUDGET_EXCEEDED',
      false,
      'Denný limit AI služieb bol prekročený. Skúste znovu zajtra alebo sa presuňte na vyšší tarif.'
    );
  }
}

// Error Recovery Manager
export class ErrorRecoveryManager {
  private static retryCount = new Map<string, number>();
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY_BASE = 1000; // 1 second

  static async handleAIFailure(
    userData: any,
    originalError: Error
  ): Promise<any> {
    console.error('AI service failure, attempting recovery:', originalError);

    try {
      // Import here to avoid circular dependencies
      const { getEnhancedWillTemplate } = await import('@/lib/will/enhanced-templates');
      const { generateFromTemplate } = await import('@/lib/will/template-generator');

      // Fallback to template-based generation
      const template = await getEnhancedWillTemplate(
        userData.jurisdiction || 'SK',
        userData.userTier || 'free'
      );

      if (!template) {
        throw new WillGenerationError(
          'No fallback template available',
          'TEMPLATE_NOT_FOUND',
          false,
          'Nie je možné vygenerovať závet. Skúste znovu neskôr.'
        );
      }

      const result = await generateFromTemplate(userData, template);

      // Track recovery success
      await this.logRecoverySuccess('ai_fallback_to_template', userData.userId);

      return {
        type: 'will_generated',
        willResult: result,
        cost: 0, // Template generation is free
        content: result.willContent,
        recoveryMethod: 'template_fallback'
      };

    } catch (recoveryError) {
      await this.logRecoveryFailure('ai_fallback_to_template', originalError, recoveryError);
      throw new WillGenerationError(
        'Recovery failed after AI service error',
        'RECOVERY_FAILED',
        false,
        'Systém nie je momentálne dostupný. Kontaktujte podporu.',
        { originalError: originalError.message, recoveryError: recoveryError.message }
      );
    }
  }

  static async handleDatabaseFailure(
    operation: string,
    data: any,
    error: Error
  ): Promise<void> {
    const retryKey = `db_${operation}_${Date.now()}`;
    const currentRetries = this.retryCount.get(retryKey) || 0;

    if (currentRetries >= this.MAX_RETRIES) {
      this.retryCount.delete(retryKey);
      throw new DatabaseError(
        `Database operation failed after ${this.MAX_RETRIES} retries: ${operation}`,
        operation
      );
    }

    // Exponential backoff
    const delay = this.RETRY_DELAY_BASE * Math.pow(2, currentRetries);
    await new Promise(resolve => setTimeout(resolve, delay));

    this.retryCount.set(retryKey, currentRetries + 1);

    try {
      // Queue for retry with exponential backoff
      await this.queueForRetry(operation, data, delay);
      this.retryCount.delete(retryKey);
    } catch (retryError) {
      console.error(`Retry ${currentRetries + 1} failed for ${operation}:`, retryError);
      throw retryError;
    }
  }

  static async handleValidationFailure(
    validationIssues: string[],
    userData: any
  ): Promise<never> {
    // Log validation issues for analysis
    await this.logValidationFailure(validationIssues, userData);

    throw new ValidationError(
      `Validation failed: ${validationIssues.join(', ')}`,
      validationIssues
    );
  }

  static async handleBudgetExceeded(
    userId: string,
    currentUsage: number,
    limit: number
  ): Promise<never> {
    // Log budget exceeded event
    await this.logBudgetExceeded(userId, currentUsage, limit);

    throw new BudgetExceededError(currentUsage, limit);
  }

  private static async queueForRetry(
    operation: string,
    data: any,
    delay: number
  ): Promise<void> {
    // In a production environment, this would queue the operation
    // for retry using a job queue system like Bull or Agenda
    console.log(`Queueing ${operation} for retry in ${delay}ms`);

    // For now, just wait and try again
    await new Promise(resolve => setTimeout(resolve, delay));

    // This would be replaced with actual retry logic
    console.log(`Retrying ${operation}`);
  }

  private static async logRecoverySuccess(
    method: string,
    userId?: string
  ): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'recovery_success',
        resource_type: 'will_generation',
        new_values: { recovery_method: method }
      });
    } catch (error) {
      console.error('Failed to log recovery success:', error);
    }
  }

  private static async logRecoveryFailure(
    method: string,
    originalError: Error,
    recoveryError: unknown
  ): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('audit_logs').insert({
        action: 'recovery_failure',
        resource_type: 'will_generation',
        new_values: {
          recovery_method: method,
          original_error: originalError.message,
          recovery_error: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
        }
      });
    } catch (error) {
      console.error('Failed to log recovery failure:', error);
    }
  }

  private static async logValidationFailure(
    issues: string[],
    userData: any
  ): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('audit_logs').insert({
        user_id: userData.userId,
        action: 'validation_failure',
        resource_type: 'will_generation',
        new_values: {
          validation_issues: issues,
          jurisdiction: userData.jurisdiction,
          user_tier: userData.userTier
        }
      });
    } catch (error) {
      console.error('Failed to log validation failure:', error);
    }
  }

  private static async logBudgetExceeded(
    userId: string,
    usage: number,
    limit: number
  ): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'budget_exceeded',
        resource_type: 'ai_usage',
        new_values: {
          daily_usage: usage,
          daily_limit: limit,
          exceeded_by: usage - limit
        }
      });
    } catch (error) {
      console.error('Failed to log budget exceeded:', error);
    }
  }
}

// Error reporting utility
export class ErrorReporter {
  static async reportError(
    error: Error,
    context: {
      userId?: string;
      operation?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase');

      await supabase.from('audit_logs').insert({
        user_id: context.userId,
        action: 'error_occurred',
        resource_type: context.operation || 'unknown',
        new_values: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
          metadata: context.metadata
        }
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  static createErrorHandler(operation: string) {
    return async (error: Error, context?: Record<string, unknown>) => {
      await this.reportError(error, {
        operation,
        metadata: context
      });

      // Re-throw the error after reporting
      throw error;
    };
  }
}

// Circuit breaker pattern for external services
export class CircuitBreaker {
  private static services = new Map<string, {
    failures: number;
    lastFailure: number;
    state: 'closed' | 'open' | 'half-open';
  }>();

  private static readonly FAILURE_THRESHOLD = 5;
  private static readonly TIMEOUT = 60000; // 1 minute
  private static readonly RETRY_TIMEOUT = 30000; // 30 seconds

  static async execute<T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const service = this.services.get(serviceName) || {
      failures: 0,
      lastFailure: 0,
      state: 'closed' as const
    };

    // Check if circuit is open
    if (service.state === 'open') {
      const timeSinceLastFailure = Date.now() - service.lastFailure;
      if (timeSinceLastFailure < this.RETRY_TIMEOUT) {
        throw new WillGenerationError(
          `Service ${serviceName} is currently unavailable`,
          'SERVICE_UNAVAILABLE',
          true,
          'Služba je dočasne nedostupná. Skúste znovu neskôr.'
        );
      } else {
        service.state = 'half-open';
      }
    }

    try {
      const result = await operation();

      // Reset on success
      service.failures = 0;
      service.state = 'closed';
      this.services.set(serviceName, service);

      return result;
    } catch (error) {
      service.failures++;
      service.lastFailure = Date.now();

      if (service.failures >= this.FAILURE_THRESHOLD) {
        service.state = 'open';
      }

      this.services.set(serviceName, service);
      throw error;
    }
  }
}

// Health check utilities
export class HealthChecker {
  static async checkAIService(): Promise<boolean> {
    try {
      // Simple health check - this would ping the AI service
      const response = await fetch('/api/health/ai', { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async checkDatabase(): Promise<boolean> {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('user_profiles').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  static async getSystemHealth(): Promise<{
    ai: boolean;
    database: boolean;
    overall: boolean;
  }> {
    const [ai, database] = await Promise.all([
      this.checkAIService(),
      this.checkDatabase()
    ]);

    return {
      ai,
      database,
      overall: ai && database
    };
  }
}