import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface MetricEvent {
  id?: string;
  type: 'page_view' | 'feature_usage' | 'user_action' | 'error' | 'performance';
  action: string;
  user_id?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export class AnalyticsTracker {
  private static sessionId: string = '';
  private static userId: string = '';

  static initialize(userId?: string) {
    this.sessionId = this.generateSessionId();
    this.userId = userId || '';

    // Track session start
    this.track('user_action', 'session_start', this.userId, {
      timestamp: new Date().toISOString()
    });
  }

  static track(type: MetricEvent['type'], action: string, userId?: string, metadata?: Record<string, any>) {
    const event: MetricEvent = {
      type,
      action,
      user_id: userId || this.userId,
      metadata: {
        ...metadata,
        session_id: this.sessionId,
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof window !== 'undefined' ? document.referrer : '',
        viewport: typeof window !== 'undefined' ? {
          width: window.innerWidth,
          height: window.innerHeight
        } : null
      },
      timestamp: new Date().toISOString()
    };

    // Store in Supabase
    this.saveToDatabase(event).catch(error => {
      console.error('Failed to save analytics event:', error);
      // Fallback to local storage for offline scenarios
      this.saveToLocalStorage(event);
    });

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event);
    }
  }

  static trackPageView(page: string, userId?: string) {
    this.track('page_view', 'page_view', userId, {
      page,
      title: typeof document !== 'undefined' ? document.title : '',
      loading_time: this.getPageLoadTime()
    });
  }

  static trackFeatureUsage(feature: string, userId?: string, context?: Record<string, any>) {
    this.track('feature_usage', feature, userId, {
      feature,
      context
    });
  }

  static trackUserAction(action: string, userId?: string, context?: Record<string, any>) {
    this.track('user_action', action, userId, context);
  }

  static trackError(error: Error, userId?: string, context?: Record<string, any>) {
    this.track('error', 'error_occurred', userId, {
      error_message: error.message,
      error_stack: error.stack,
      context
    });
  }

  static trackPerformance(metric: string, value: number, userId?: string) {
    this.track('performance', metric, userId, {
      metric,
      value,
      timestamp: new Date().toISOString()
    });
  }

  private static async saveToDatabase(event: MetricEvent) {
    const { error } = await supabase
      .from('analytics_events')
      .insert(event);

    if (error) {
      throw error;
    }
  }

  private static saveToLocalStorage(event: MetricEvent) {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);

      // Keep only last 100 events to prevent storage bloat
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getPageLoadTime(): number {
    if (typeof window !== 'undefined' && window.performance) {
      return Math.round(window.performance.now());
    }
    return 0;
  }

  static async syncOfflineEvents() {
    try {
      const offlineEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');

      if (offlineEvents.length > 0) {
        for (const event of offlineEvents) {
          await this.saveToDatabase(event);
        }

        // Clear offline events after successful sync
        localStorage.removeItem('analytics_events');
        console.log(`Synced ${offlineEvents.length} offline analytics events`);
      }
    } catch (error) {
      console.error('Failed to sync offline events:', error);
    }
  }

  // Real-time analytics queries
  static async getDailyActiveUsers(days: number = 30): Promise<number[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('analytics_events')
      .select('user_id, timestamp')
      .eq('type', 'user_action')
      .gte('timestamp', startDate.toISOString());

    if (error) {
      console.error('Error fetching DAU:', error);
      return [];
    }

    // Group by day and count unique users
    const dailyUsers = new Map<string, Set<string>>();

    data?.forEach(event => {
      const day = event.timestamp.split('T')[0];
      if (!dailyUsers.has(day)) {
        dailyUsers.set(day, new Set());
      }
      if (event.user_id) {
        dailyUsers.get(day)!.add(event.user_id);
      }
    });

    return Array.from(dailyUsers.values()).map(users => users.size);
  }

  static async getFeatureAdoption(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('action, user_id')
      .eq('type', 'feature_usage');

    if (error) {
      console.error('Error fetching feature adoption:', error);
      return {};
    }

    const adoption = new Map<string, Set<string>>();

    data?.forEach(event => {
      if (!adoption.has(event.action)) {
        adoption.set(event.action, new Set());
      }
      if (event.user_id) {
        adoption.get(event.action)!.add(event.user_id);
      }
    });

    const result: Record<string, number> = {};
    adoption.forEach((users, feature) => {
      result[feature] = users.size;
    });

    return result;
  }

  static async getErrorRate(hours: number = 24): Promise<number> {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const [errorsResult, totalResult] = await Promise.all([
      supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('type', 'error')
        .gte('timestamp', startTime.toISOString()),

      supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .gte('timestamp', startTime.toISOString())
    ]);

    const errorCount = errorsResult.count || 0;
    const totalCount = totalResult.count || 0;

    return totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
  }

  static async getPagePerformance(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('metadata')
      .eq('type', 'page_view')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching page performance:', error);
      return {};
    }

    const pageStats = new Map<string, number[]>();

    data?.forEach(event => {
      const page = event.metadata?.page || 'unknown';
      const loadTime = event.metadata?.loading_time || 0;

      if (!pageStats.has(page)) {
        pageStats.set(page, []);
      }
      pageStats.get(page)!.push(loadTime);
    });

    const result: Record<string, number> = {};
    pageStats.forEach((times, page) => {
      if (times.length > 0) {
        result[page] = times.reduce((a, b) => a + b, 0) / times.length;
      }
    });

    return result;
  }
}