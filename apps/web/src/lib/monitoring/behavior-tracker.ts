import { supabase } from '@/lib/supabase';

interface UserAction {
  id: string;
  user_id: string;
  action: string;
  page: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

interface FormInteraction {
  form: string;
  field: string;
  action: 'focus' | 'blur' | 'error' | 'submit';
  value?: string;
  duration?: number;
}

interface PageView {
  page: string;
  referrer?: string;
  duration?: number;
  exit_page?: boolean;
}

interface UserJourney {
  session_id: string;
  user_id: string;
  actions: UserAction[];
  start_time: string;
  end_time?: string;
  total_duration?: number;
}

export class BehaviorTracker {
  private static sessionId: string = crypto.randomUUID();
  private static pageStartTime: number = Date.now();
  private static formInteractions: Map<string, FormInteraction[]> = new Map();

  /**
   * Track user page view
   */
  static trackPageView(page: string, userId: string, metadata?: Record<string, any>): void {
    // Record exit from previous page
    if (typeof window !== 'undefined' && document.referrer) {
      this.trackPageExit(document.referrer, Date.now() - this.pageStartTime);
    }

    this.pageStartTime = Date.now();

    this.trackUserAction('page_view', userId, {
      page,
      referrer: typeof window !== 'undefined' ? document.referrer : '',
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screen_resolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : '',
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Track page exit/leave
   */
  static trackPageExit(page: string, duration: number): void {
    this.trackEvent('page_exit', {
      page,
      duration,
      session_id: this.sessionId
    });
  }

  /**
   * Track form interactions
   */
  static trackFormInteraction(
    formName: string,
    field: string,
    action: 'focus' | 'blur' | 'error' | 'submit',
    userId: string,
    metadata?: Record<string, any>
  ): void {
    const interaction: FormInteraction = {
      form: formName,
      field,
      action,
      ...metadata
    };

    // Store locally for form completion analysis
    if (!this.formInteractions.has(formName)) {
      this.formInteractions.set(formName, []);
    }
    this.formInteractions.get(formName)!.push(interaction);

    this.trackUserAction('form_interaction', userId, {
      form: formName,
      field,
      action,
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Track form completion
   */
  static trackFormCompletion(formName: string, userId: string, successful: boolean, data?: Record<string, any>): void {
    const interactions = this.formInteractions.get(formName) || [];
    const startTime = interactions.length > 0 ? Date.now() : 0;
    const totalTime = interactions.length > 0 ? Date.now() - startTime : 0;

    this.trackUserAction('form_completion', userId, {
      form: formName,
      successful,
      total_interactions: interactions.length,
      completion_time: totalTime,
      form_data: successful ? data : undefined,
      session_id: this.sessionId
    });

    // Clear form interactions after completion
    this.formInteractions.delete(formName);
  }

  /**
   * Track document actions
   */
  static trackDocumentAction(
    action: 'create' | 'edit' | 'download' | 'share' | 'delete',
    documentType: string,
    userId: string,
    metadata?: Record<string, any>
  ): void {
    this.trackUserAction('document_action', userId, {
      action,
      document_type: documentType,
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsage(feature: string, userId: string, metadata?: Record<string, any>): void {
    this.trackUserAction('feature_usage', userId, {
      feature,
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Track button clicks
   */
  static trackButtonClick(buttonId: string, userId: string, metadata?: Record<string, any>): void {
    this.trackUserAction('button_click', userId, {
      button_id: buttonId,
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Track search actions
   */
  static trackSearch(query: string, userId: string, results?: number, metadata?: Record<string, any>): void {
    this.trackUserAction('search', userId, {
      query,
      results_count: results,
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Track errors encountered by users
   */
  static trackError(error: string, userId: string, context?: Record<string, any>): void {
    this.trackUserAction('user_error', userId, {
      error_message: error,
      context,
      session_id: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : ''
    });
  }

  /**
   * Track conversion events
   */
  static trackConversion(event: string, userId: string, value?: number, metadata?: Record<string, any>): void {
    this.trackUserAction('conversion', userId, {
      conversion_event: event,
      value,
      session_id: this.sessionId,
      ...metadata
    });
  }

  /**
   * Generic user action tracking
   */
  private static trackUserAction(action: string, userId: string, metadata: Record<string, any>): void {
    this.trackEvent('user_action', {
      user_id: userId,
      action,
      ...metadata
    });
  }

  /**
   * Generic event tracking
   */
  static async trackEvent(type: string, data: Record<string, any>): Promise<void> {
    try {
      await supabase
        .from('user_analytics')
        .insert({
          event_type: type,
          event_data: data,
          timestamp: new Date().toISOString(),
          session_id: this.sessionId
        });
    } catch (error) {
      console.warn('Failed to track event:', error);
      // Store locally as fallback
      this.storeEventLocally(type, data);
    }
  }

  /**
   * Store event locally if database fails
   */
  private static storeEventLocally(type: string, data: Record<string, any>): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('pending_analytics') || '[]';
        const events = JSON.parse(stored);
        events.push({ type, data, timestamp: new Date().toISOString() });

        // Keep only last 100 events
        if (events.length > 100) {
          events.splice(0, events.length - 100);
        }

        localStorage.setItem('pending_analytics', JSON.stringify(events));
      } catch (error) {
        console.warn('Failed to store event locally:', error);
      }
    }
  }

  /**
   * Flush locally stored events
   */
  static async flushLocalEvents(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    try {
      const stored = localStorage.getItem('pending_analytics');
      if (!stored) return;

      const events = JSON.parse(stored);
      if (events.length === 0) return;

      const transformedEvents = events.map((event: any) => ({
        event_type: event.type,
        event_data: event.data,
        timestamp: event.timestamp,
        session_id: this.sessionId
      }));

      await supabase
        .from('user_analytics')
        .insert(transformedEvents);

      localStorage.removeItem('pending_analytics');
    } catch (error) {
      console.warn('Failed to flush local events:', error);
    }
  }

  /**
   * Generate user journey analysis
   */
  static async generateUserJourney(userId: string, days: number = 30): Promise<UserJourney[]> {
    try {
      const { data } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('event_data->>user_id', userId)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp');

      // Group by session
      const sessions = new Map<string, UserAction[]>();

      data?.forEach(event => {
        const sessionId = event.event_data?.session_id || 'unknown';
        if (!sessions.has(sessionId)) {
          sessions.set(sessionId, []);
        }
        sessions.get(sessionId)!.push({
          id: event.id,
          user_id: userId,
          action: event.event_data?.action || event.event_type,
          page: event.event_data?.page || '',
          metadata: event.event_data,
          timestamp: event.timestamp
        });
      });

      // Convert to journey format
      const journeys: UserJourney[] = [];
      sessions.forEach((actions, sessionId) => {
        if (actions.length > 0) {
          const sortedActions = actions.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          journeys.push({
            session_id: sessionId,
            user_id: userId,
            actions: sortedActions,
            start_time: sortedActions[0].timestamp,
            end_time: sortedActions[sortedActions.length - 1].timestamp,
            total_duration: new Date(sortedActions[sortedActions.length - 1].timestamp).getTime() -
                           new Date(sortedActions[0].timestamp).getTime()
          });
        }
      });

      return journeys;
    } catch (error) {
      console.error('Failed to generate user journey:', error);
      return [];
    }
  }

  /**
   * Get form abandonment analysis
   */
  static async getFormAbandonmentAnalysis(formName: string, days: number = 30): Promise<{
    total_starts: number;
    total_completions: number;
    abandonment_rate: number;
    common_exit_fields: Array<{ field: string; count: number }>;
  }> {
    try {
      const { data } = await supabase
        .from('user_analytics')
        .select('event_data')
        .eq('event_type', 'user_action')
        .eq('event_data->>action', 'form_interaction')
        .eq('event_data->>form', formName)
        .gte('timestamp', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      const starts = new Set();
      const completions = new Set();
      const exitFields = new Map<string, number>();

      data?.forEach(event => {
        const eventData = event.event_data;
        const userId = eventData.user_id;
        const field = eventData.field;
        const action = eventData.action;

        if (action === 'focus') {
          starts.add(userId);
        } else if (action === 'submit') {
          completions.add(userId);
        } else if (action === 'blur') {
          exitFields.set(field, (exitFields.get(field) || 0) + 1);
        }
      });

      const abandonmentRate = starts.size > 0 ?
        ((starts.size - completions.size) / starts.size) * 100 : 0;

      const commonExitFields = Array.from(exitFields.entries())
        .map(([field, count]) => ({ field, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        total_starts: starts.size,
        total_completions: completions.size,
        abandonment_rate: abandonmentRate,
        common_exit_fields: commonExitFields
      };
    } catch (error) {
      console.error('Failed to get form abandonment analysis:', error);
      return {
        total_starts: 0,
        total_completions: 0,
        abandonment_rate: 0,
        common_exit_fields: []
      };
    }
  }

  /**
   * Initialize behavior tracking
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', {
          page: window.location.pathname,
          session_id: this.sessionId
        });
      } else {
        this.trackEvent('page_visible', {
          page: window.location.pathname,
          session_id: this.sessionId
        });
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.trackPageExit(window.location.pathname, Date.now() - this.pageStartTime);
      this.flushLocalEvents();
    });

    // Flush events periodically
    setInterval(() => {
      this.flushLocalEvents();
    }, 60000); // Every minute
  }
}