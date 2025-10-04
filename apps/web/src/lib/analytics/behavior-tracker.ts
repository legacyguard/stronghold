import { AnalyticsTracker } from './tracker';
import { supabase } from '../supabase';

export interface UserInteraction {
  id: string;
  session_id: string;
  user_id?: string;
  event_type: 'click' | 'scroll' | 'hover' | 'focus' | 'blur' | 'form_input' | 'page_view' | 'navigation' | 'error_encounter';
  element_selector?: string;
  element_text?: string;
  page_path: string;
  coordinates?: { x: number; y: number };
  scroll_position?: { x: number; y: number };
  viewport_size: { width: number; height: number };
  timestamp: string;
  duration?: number;
  metadata: Record<string, any>;
}

export interface UserSession {
  id: string;
  user_id?: string;
  start_time: string;
  end_time?: string;
  page_views: number;
  total_duration: number;
  interactions_count: number;
  bounce_rate: number;
  conversion_events: string[];
  device_info: {
    user_agent: string;
    screen_resolution: string;
    viewport_size: string;
    platform: string;
    language: string;
  };
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

export interface BehaviorPattern {
  pattern_id: string;
  pattern_type: 'navigation' | 'engagement' | 'conversion' | 'abandonment' | 'error';
  description: string;
  frequency: number;
  user_segments: string[];
  confidence_score: number;
  actions_sequence: string[];
  average_duration: number;
  success_rate: number;
  insights: string[];
  recommendations: string[];
}

export interface HeatmapData {
  page_path: string;
  element_selector: string;
  click_count: number;
  hover_count: number;
  attention_duration: number;
  coordinates: Array<{ x: number; y: number; intensity: number }>;
  viewport_coverage: number;
}

export class BehaviorTracker {
  private static instance: BehaviorTracker;
  private sessionId: string;
  private startTime: number;
  private interactions: UserInteraction[] = [];
  private currentPage: string = '';
  private isTracking: boolean = false;
  private bufferSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.setupEventListeners();
    this.startPeriodicFlush();
  }

  static getInstance(): BehaviorTracker {
    if (!BehaviorTracker.instance) {
      BehaviorTracker.instance = new BehaviorTracker();
    }
    return BehaviorTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Click tracking
    document.addEventListener('click', this.handleClick.bind(this), true);

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.handleScroll(), 100);
    }, { passive: true });

    // Form interaction tracking
    document.addEventListener('input', this.handleFormInput.bind(this), true);
    document.addEventListener('focus', this.handleFocus.bind(this), true);
    document.addEventListener('blur', this.handleBlur.bind(this), true);

    // Page visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Navigation tracking
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.addEventListener('popstate', this.handleNavigation.bind(this));

    // Error tracking
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Mouse movement for heatmaps (sampled)
    let mouseMoveTimer: NodeJS.Timeout;
    document.addEventListener('mousemove', (event) => {
      clearTimeout(mouseMoveTimer);
      mouseMoveTimer = setTimeout(() => this.handleMouseMove(event), 250);
    }, { passive: true });

    // Store session ID
    sessionStorage.setItem('session_id', this.sessionId);
  }

  private handleClick(event: Event): void {
    const target = event.target as HTMLElement;
    this.recordInteraction({
      event_type: 'click',
      element_selector: this.getElementSelector(target),
      element_text: this.getElementText(target),
      coordinates: this.getEventCoordinates(event as MouseEvent),
      metadata: {
        button: (event as MouseEvent).button,
        alt_key: (event as MouseEvent).altKey,
        ctrl_key: (event as MouseEvent).ctrlKey,
        shift_key: (event as MouseEvent).shiftKey
      }
    });
  }

  private handleScroll(): void {
    this.recordInteraction({
      event_type: 'scroll',
      scroll_position: {
        x: window.scrollX,
        y: window.scrollY
      },
      metadata: {
        scroll_height: document.documentElement.scrollHeight,
        scroll_percentage: Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100)
      }
    });
  }

  private handleFormInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.recordInteraction({
      event_type: 'form_input',
      element_selector: this.getElementSelector(target),
      metadata: {
        input_type: target.type,
        field_name: target.name || target.id,
        value_length: target.value?.length || 0,
        is_required: target.required
      }
    });
  }

  private handleFocus(event: Event): void {
    const target = event.target as HTMLElement;
    this.recordInteraction({
      event_type: 'focus',
      element_selector: this.getElementSelector(target),
      metadata: {
        element_type: target.tagName.toLowerCase()
      }
    });
  }

  private handleBlur(event: Event): void {
    const target = event.target as HTMLElement;
    this.recordInteraction({
      event_type: 'blur',
      element_selector: this.getElementSelector(target),
      metadata: {
        element_type: target.tagName.toLowerCase()
      }
    });
  }

  private handleMouseMove(event: MouseEvent): void {
    // Sample mouse movements for heatmap data
    if (Math.random() < 0.1) { // Sample 10% of movements
      this.recordInteraction({
        event_type: 'hover',
        coordinates: this.getEventCoordinates(event),
        metadata: {
          sampled: true
        }
      });
    }
  }

  private handleVisibilityChange(): void {
    const isVisible = !document.hidden;
    this.recordInteraction({
      event_type: isVisible ? 'focus' : 'blur',
      metadata: {
        visibility_state: document.visibilityState,
        page_visibility: isVisible
      }
    });
  }

  private handleNavigation(): void {
    this.recordInteraction({
      event_type: 'navigation',
      metadata: {
        from_page: this.currentPage,
        to_page: window.location.pathname,
        navigation_type: 'browser_navigation'
      }
    });
    this.trackPageView();
  }

  private handleBeforeUnload(): void {
    this.flushInteractions();
  }

  private handleError(event: ErrorEvent): void {
    this.recordInteraction({
      event_type: 'error_encounter',
      metadata: {
        error_message: event.message,
        error_filename: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
        error_type: 'javascript_error'
      }
    });
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    this.recordInteraction({
      event_type: 'error_encounter',
      metadata: {
        error_message: event.reason?.message || 'Unhandled promise rejection',
        error_type: 'promise_rejection',
        error_reason: String(event.reason)
      }
    });
  }

  private recordInteraction(interactionData: Partial<UserInteraction>): void {
    if (!this.isTracking) return;

    const interaction: UserInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      session_id: this.sessionId,
      user_id: this.getCurrentUserId(),
      page_path: this.currentPage || window.location.pathname,
      viewport_size: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString(),
      metadata: {},
      ...interactionData
    } as UserInteraction;

    this.interactions.push(interaction);

    // Auto-flush when buffer is full
    if (this.interactions.length >= this.bufferSize) {
      this.flushInteractions();
    }
  }

  private getElementSelector(element: HTMLElement): string {
    // Try to get a meaningful selector
    if (element.id) {
      return `#${element.id}`;
    }

    if (element.getAttribute('data-testid')) {
      return `[data-testid="${element.getAttribute('data-testid')}"]`;
    }

    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }

    // Fallback to tag name with position
    const siblings = Array.from(element.parentElement?.children || []);
    const index = siblings.indexOf(element);
    return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
  }

  private getElementText(element: HTMLElement): string {
    const text = element.textContent?.trim() || '';
    return text.length > 100 ? text.substring(0, 97) + '...' : text;
  }

  private getEventCoordinates(event: MouseEvent): { x: number; y: number } {
    return {
      x: event.clientX,
      y: event.clientY
    };
  }

  private getCurrentUserId(): string | undefined {
    // This would integrate with your auth system
    if (typeof window !== 'undefined') {
      const userSession = sessionStorage.getItem('user_session');
      if (userSession) {
        try {
          const session = JSON.parse(userSession);
          return session.user?.id;
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushInteractions();
    }, this.flushInterval);
  }

  private async flushInteractions(): Promise<void> {
    if (this.interactions.length === 0) return;

    const interactionsToFlush = [...this.interactions];
    this.interactions = [];

    try {
      // Send interactions to analytics via Supabase
      for (const interaction of interactionsToFlush) {
        await supabase.from('user_interactions').insert({
          id: interaction.id,
          session_id: interaction.session_id,
          user_id: interaction.user_id,
          event_type: interaction.event_type,
          element_selector: interaction.element_selector,
          element_text: interaction.element_text,
          page_path: interaction.page_path,
          coordinates: interaction.coordinates,
          scroll_position: interaction.scroll_position,
          viewport_size: interaction.viewport_size,
          timestamp: interaction.timestamp,
          duration: interaction.duration,
          metadata: interaction.metadata
        });
      }

      // Also send to main analytics tracker
      await AnalyticsTracker.track('user_behavior', 'interactions_batch', this.getCurrentUserId(), {
        session_id: this.sessionId,
        interactions_count: interactionsToFlush.length,
        batch_timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to flush behavior interactions:', error);
      // Put interactions back for retry
      this.interactions.unshift(...interactionsToFlush);
    }
  }

  // Public API methods
  public startTracking(): void {
    this.isTracking = true;
    this.trackPageView();
    console.log('Behavior tracking started');
  }

  public stopTracking(): void {
    this.isTracking = false;
    this.flushInteractions();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    console.log('Behavior tracking stopped');
  }

  public trackPageView(pagePath?: string): void {
    const currentPath = pagePath || window.location.pathname;
    this.currentPage = currentPath;

    this.recordInteraction({
      event_type: 'page_view',
      metadata: {
        page_title: document.title,
        referrer: document.referrer,
        url_params: window.location.search,
        user_agent: navigator.userAgent,
        language: navigator.language,
        screen_resolution: `${screen.width}x${screen.height}`,
        session_duration: Date.now() - this.startTime
      }
    });
  }

  public trackCustomEvent(eventName: string, properties: Record<string, any> = {}): void {
    this.recordInteraction({
      event_type: 'click', // Using click as base type for custom events
      metadata: {
        custom_event: eventName,
        custom_properties: properties
      }
    });
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public async getSessionData(): Promise<UserSession> {
    const currentTime = Date.now();
    const duration = currentTime - this.startTime;
    const pageViews = this.interactions.filter(i => i.event_type === 'page_view').length;

    return {
      id: this.sessionId,
      user_id: this.getCurrentUserId(),
      start_time: new Date(this.startTime).toISOString(),
      page_views: Math.max(1, pageViews),
      total_duration: duration,
      interactions_count: this.interactions.length,
      bounce_rate: pageViews <= 1 ? 1 : 0,
      conversion_events: [], // Would be populated based on conversion tracking
      device_info: {
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        platform: navigator.platform,
        language: navigator.language
      },
      referrer: document.referrer,
      utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined
    };
  }

  // Static methods for behavior analysis
  public static async analyzeBehaviorPatterns(timeframe: number = 7): Promise<BehaviorPattern[]> {
    try {
      // This would query the analytics data to find patterns
      // For now, return mock patterns
      return [
        {
          pattern_id: 'pattern_1',
          pattern_type: 'navigation',
          description: 'Users frequently navigate from dashboard to document management',
          frequency: 0.75,
          user_segments: ['new_users', 'returning_users'],
          confidence_score: 0.85,
          actions_sequence: ['page_view:/dashboard', 'click:nav-documents', 'page_view:/documents'],
          average_duration: 15000,
          success_rate: 0.92,
          insights: ['High navigation success rate indicates clear UX'],
          recommendations: ['Consider adding shortcut widget on dashboard']
        }
      ];
    } catch (error) {
      console.error('Failed to analyze behavior patterns:', error);
      return [];
    }
  }

  public static async generateHeatmapData(pagePath: string, timeframe: number = 7): Promise<HeatmapData[]> {
    try {
      // This would aggregate click and hover data for heatmap visualization
      // For now, return mock data
      return [
        {
          page_path: pagePath,
          element_selector: '.cta-button',
          click_count: 150,
          hover_count: 300,
          attention_duration: 5000,
          coordinates: [
            { x: 500, y: 300, intensity: 0.9 },
            { x: 505, y: 305, intensity: 0.7 }
          ],
          viewport_coverage: 0.8
        }
      ];
    } catch (error) {
      console.error('Failed to generate heatmap data:', error);
      return [];
    }
  }

  public static async getUserJourney(userId: string, sessionId?: string): Promise<UserInteraction[]> {
    try {
      // This would fetch user's interaction journey from analytics
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get user journey:', error);
      return [];
    }
  }
}

// Export singleton instance
export const behaviorTracker = BehaviorTracker.getInstance();