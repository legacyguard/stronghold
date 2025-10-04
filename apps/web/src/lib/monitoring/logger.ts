import { supabase } from '@/lib/supabase';
import { DataEncryption } from '@/lib/security/encryption';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  category: string;
  userId?: string;
  sessionId?: string;
  context: Record<string, any>;
  metadata: {
    userAgent?: string;
    url?: string;
    ip?: string;
    requestId?: string;
    component?: string;
    stackTrace?: string;
  };
  tags: string[];
  environment: 'development' | 'staging' | 'production';
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  bufferSize: number;
  flushInterval: number;
  categories: string[];
  sensitiveFields: string[];
}

export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: process.env.NODE_ENV === 'development',
      enableRemote: true,
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      categories: ['app', 'security', 'performance', 'user', 'system'],
      sensitiveFields: ['password', 'token', 'key', 'secret', 'ssn', 'creditCard'],
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
  }

  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Debug level logging
   */
  debug(message: string, context: Record<string, any> = {}, category: string = 'app'): void {
    this.log(LogLevel.DEBUG, message, context, category);
  }

  /**
   * Info level logging
   */
  info(message: string, context: Record<string, any> = {}, category: string = 'app'): void {
    this.log(LogLevel.INFO, message, context, category);
  }

  /**
   * Warning level logging
   */
  warn(message: string, context: Record<string, any> = {}, category: string = 'app'): void {
    this.log(LogLevel.WARN, message, context, category);
  }

  /**
   * Error level logging
   */
  error(message: string, context: Record<string, any> = {}, category: string = 'app'): void {
    this.log(LogLevel.ERROR, message, context, category);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, context: Record<string, any> = {}, category: string = 'app'): void {
    this.log(LogLevel.FATAL, message, context, category);
    this.flush(); // Immediate flush for fatal errors
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: Record<string, any>, category: string): void {
    if (level < this.config.level) {
      return; // Skip logs below configured level
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date(),
      level,
      message,
      category,
      userId: context.userId,
      sessionId: this.sessionId,
      context: this.sanitizeContext(context),
      metadata: this.getMetadata(context),
      tags: this.extractTags(context),
      environment: (process.env.NODE_ENV as any) || 'development'
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Buffer for remote logging
    if (this.config.enableRemote) {
      this.buffer.push(entry);

      // Immediate flush for high-level logs
      if (level >= LogLevel.ERROR) {
        this.flush();
      } else if (this.buffer.length >= this.config.bufferSize) {
        this.flush();
      }
    }
  }

  /**
   * Log specific events
   */
  logUserAction(userId: string, action: string, details: Record<string, any> = {}): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...details
    }, 'user');
  }

  logSecurityEvent(event: string, details: Record<string, any> = {}): void {
    this.warn(`Security event: ${event}`, details, 'security');
  }

  logPerformance(metric: string, value: number, details: Record<string, any> = {}): void {
    this.info(`Performance: ${metric} = ${value}`, {
      metric,
      value,
      ...details
    }, 'performance');
  }

  logError(error: Error, context: Record<string, any> = {}): void {
    this.error(error.message, {
      error: error.name,
      stack: error.stack,
      ...context
    });
  }

  logAPICall(method: string, url: string, status: number, duration: number, details: Record<string, any> = {}): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, `API ${method} ${url} - ${status} (${duration}ms)`, {
      method,
      url,
      status,
      duration,
      ...details
    }, 'api');
  }

  logDatabaseQuery(query: string, duration: number, details: Record<string, any> = {}): void {
    const level = duration > 1000 ? LogLevel.WARN : LogLevel.DEBUG;
    this.log(level, `DB Query (${duration}ms): ${query.substring(0, 100)}...`, {
      query,
      duration,
      ...details
    }, 'database');
  }

  /**
   * Structured logging for compliance
   */
  logCompliance(event: string, details: Record<string, any>): void {
    this.info(`Compliance: ${event}`, {
      ...details,
      compliance: true,
      timestamp: new Date().toISOString()
    }, 'compliance');
  }

  /**
   * Log to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
      [LogLevel.FATAL]: 'FATAL'
    };

    const color = levelColors[entry.level];
    const levelName = levelNames[entry.level];
    const timestamp = entry.timestamp.toISOString();

    const prefix = `${color}[${timestamp}] ${levelName}\x1b[0m [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    // Use appropriate console method
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.context);
        break;
      case LogLevel.INFO:
        console.info(message, entry.context);
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.context);
        if (entry.metadata.stackTrace) {
          console.error(entry.metadata.stackTrace);
        }
        break;
    }
  }

  /**
   * Flush logs to remote storage
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      const logRecords = logsToFlush.map(entry => ({
        log_id: entry.id,
        timestamp: entry.timestamp.toISOString(),
        level: Object.keys(LogLevel)[entry.level],
        message: entry.message,
        category: entry.category,
        user_id: entry.userId,
        session_id: entry.sessionId,
        context: entry.context,
        metadata: entry.metadata,
        tags: entry.tags,
        environment: entry.environment
      }));

      await supabase
        .from('application_logs')
        .insert(logRecords);

    } catch (error) {
      console.error('Failed to flush logs to remote storage:', error);

      // Re-add to buffer for retry
      this.buffer.unshift(...logsToFlush);

      // Prevent infinite buffer growth
      if (this.buffer.length > this.config.bufferSize * 2) {
        this.buffer = this.buffer.slice(0, this.config.bufferSize);
      }
    }
  }

  /**
   * Sanitize context to remove sensitive data
   */
  private sanitizeContext(context: Record<string, any>): Record<string, any> {
    const sanitized = { ...context };

    const sanitizeValue = (obj: any, key: string): any => {
      if (this.config.sensitiveFields.some(field =>
        key.toLowerCase().includes(field.toLowerCase()))) {
        return '[REDACTED]';
      }

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        return this.sanitizeObject(obj[key]);
      }

      return obj[key];
    };

    return this.sanitizeObject(sanitized);
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.config.sensitiveFields.some(field =>
        key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get metadata from context and environment
   */
  private getMetadata(context: Record<string, any>): LogEntry['metadata'] {
    const metadata: LogEntry['metadata'] = {};

    if (typeof window !== 'undefined') {
      metadata.userAgent = navigator.userAgent;
      metadata.url = window.location.href;
    }

    if (context.error instanceof Error) {
      metadata.stackTrace = context.error.stack;
    }

    if (context.component) {
      metadata.component = context.component;
    }

    if (context.requestId) {
      metadata.requestId = context.requestId;
    }

    return metadata;
  }

  /**
   * Extract tags from context
   */
  private extractTags(context: Record<string, any>): string[] {
    const tags: string[] = [];

    if (context.tags && Array.isArray(context.tags)) {
      tags.push(...context.tags);
    }

    if (context.feature) {
      tags.push(`feature:${context.feature}`);
    }

    if (context.version) {
      tags.push(`version:${context.version}`);
    }

    if (context.userId) {
      tags.push('authenticated');
    } else {
      tags.push('anonymous');
    }

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get logs from storage
   */
  async getLogs(filters: {
    level?: LogLevel;
    category?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    search?: string;
  } = {}): Promise<LogEntry[]> {
    try {
      let query = supabase
        .from('application_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters.level !== undefined) {
        query = query.eq('level', Object.keys(LogLevel)[filters.level]);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate.toISOString());
      }

      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate.toISOString());
      }

      if (filters.search) {
        query = query.ilike('message', `%${filters.search}%`);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(record => ({
        id: record.log_id,
        timestamp: new Date(record.timestamp),
        level: LogLevel[record.level as keyof typeof LogLevel],
        message: record.message,
        category: record.category,
        userId: record.user_id,
        sessionId: record.session_id,
        context: record.context || {},
        metadata: record.metadata || {},
        tags: record.tags || [],
        environment: record.environment
      }));

    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  /**
   * Get log statistics
   */
  async getLogStatistics(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByCategory: Record<string, number>;
    errorRate: number;
    topErrors: Array<{ message: string; count: number }>;
  }> {
    try {
      const now = new Date();
      const timeframes = {
        hour: 60 * 60 * 1000,
        day: 24 * 60 * 60 * 1000,
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000
      };

      const startDate = new Date(now.getTime() - timeframes[timeframe]);

      const { data, error } = await supabase
        .from('application_logs')
        .select('level, category, message')
        .gte('timestamp', startDate.toISOString());

      if (error) throw error;

      const logs = data || [];
      const totalLogs = logs.length;

      const logsByLevel: Record<string, number> = {};
      const logsByCategory: Record<string, number> = {};
      const errorMessages: Record<string, number> = {};

      logs.forEach(log => {
        logsByLevel[log.level] = (logsByLevel[log.level] || 0) + 1;
        logsByCategory[log.category] = (logsByCategory[log.category] || 0) + 1;

        if (log.level === 'ERROR' || log.level === 'FATAL') {
          errorMessages[log.message] = (errorMessages[log.message] || 0) + 1;
        }
      });

      const errorCount = (logsByLevel['ERROR'] || 0) + (logsByLevel['FATAL'] || 0);
      const errorRate = totalLogs > 0 ? (errorCount / totalLogs) * 100 : 0;

      const topErrors = Object.entries(errorMessages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([message, count]) => ({ message, count }));

      return {
        totalLogs,
        logsByLevel,
        logsByCategory,
        errorRate,
        topErrors
      };

    } catch (error) {
      console.error('Failed to get log statistics:', error);
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByCategory: {},
        errorRate: 0,
        topErrors: []
      };
    }
  }

  /**
   * Cleanup old logs
   */
  async cleanupOldLogs(retentionDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('application_logs')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      if (error) throw error;

      const deletedCount = Array.isArray(data) ? data.length : 0;
      this.info(`Cleaned up ${deletedCount} old logs`, { retentionDays, cutoffDate }, 'system');

      return deletedCount;
    } catch (error) {
      this.error('Failed to cleanup old logs', { error: error.message }, 'system');
      return 0;
    }
  }

  /**
   * Destroy logger instance
   */
  destroy(): void {
    this.flush();
    this.stopFlushTimer();
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const logUserAction = logger.logUserAction.bind(logger);
export const logSecurityEvent = logger.logSecurityEvent.bind(logger);
export const logPerformance = logger.logPerformance.bind(logger);
export const logError = logger.logError.bind(logger);
export const logAPICall = logger.logAPICall.bind(logger);
export const logCompliance = logger.logCompliance.bind(logger);