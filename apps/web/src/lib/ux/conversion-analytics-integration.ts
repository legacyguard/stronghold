import { userJourneyAnalytics } from './user-journey-analytics';
import { conversionFunnelTracker } from './conversion-funnel';
import { abTestingEngine } from './ab-testing';
import { heatmapAnalytics } from './heatmap-analytics';
import { performanceMonitor } from '../performance/performance-monitor';
import { reliabilityScorer } from '../reliability/reliability-scorer';

export interface ConversionMetrics {
  total_conversions: number;
  conversion_rate: number;
  average_conversion_value: number;
  conversion_by_source: Record<string, number>;
  time_to_conversion: number;
  conversion_trends: Array<{
    date: string;
    conversions: number;
    rate: number;
  }>;
}

export interface UserExperienceMetrics {
  bounce_rate: number;
  session_duration: number;
  pages_per_session: number;
  user_engagement_score: number;
  satisfaction_score: number;
  task_completion_rate: number;
}

export interface PerformanceImpactMetrics {
  conversion_by_performance: Record<string, number>;
  speed_impact_on_conversion: number;
  reliability_impact_on_conversion: number;
  performance_correlation_score: number;
}

export interface IntegratedAnalytics {
  conversion_metrics: ConversionMetrics;
  user_experience: UserExperienceMetrics;
  performance_impact: PerformanceImpactMetrics;
  top_conversion_paths: Array<{
    path: string[];
    conversions: number;
    rate: number;
    avg_time: number;
  }>;
  optimization_opportunities: Array<{
    type: 'funnel' | 'journey' | 'performance' | 'ab_test' | 'heatmap';
    priority: 'high' | 'medium' | 'low';
    opportunity: string;
    potential_impact: string;
    effort_required: string;
    data_confidence: number;
  }>;
  cross_channel_insights: Array<{
    channel: string;
    insight: string;
    impact: string;
    recommendation: string;
  }>;
}

export interface TrackingConfig {
  user_id?: string;
  session_id: string;
  enable_journey_tracking: boolean;
  enable_funnel_tracking: boolean;
  enable_ab_testing: boolean;
  enable_heatmap_tracking: boolean;
  conversion_events: string[];
  funnel_definitions: string[];
}

export class ConversionAnalyticsIntegration {
  private static instance: ConversionAnalyticsIntegration;
  private config: TrackingConfig | null = null;
  private isInitialized: boolean = false;

  static getInstance(): ConversionAnalyticsIntegration {
    if (!ConversionAnalyticsIntegration.instance) {
      ConversionAnalyticsIntegration.instance = new ConversionAnalyticsIntegration();
    }
    return ConversionAnalyticsIntegration.instance;
  }

  async initialize(config: TrackingConfig): Promise<void> {
    this.config = config;

    try {
      // Initialize all tracking systems
      if (config.enable_journey_tracking) {
        await userJourneyAnalytics.initializeSession(config.user_id);
      }

      if (config.enable_funnel_tracking) {
        await conversionFunnelTracker.initialize();
      }

      if (config.enable_ab_testing) {
        await abTestingEngine.initialize();
      }

      if (config.enable_heatmap_tracking) {
        await heatmapAnalytics.initialize(config.session_id, config.user_id);
      }

      this.isInitialized = true;
      this.setupIntegratedTracking();
    } catch (error) {
      console.error('Failed to initialize conversion analytics integration:', error);
    }
  }

  async trackConversion(eventType: string, value?: number, metadata?: Record<string, any>): Promise<void> {
    if (!this.isInitialized || !this.config) {
      console.warn('Conversion analytics not initialized');
      return;
    }

    try {
      // Track across all systems simultaneously
      const promises: Promise<void>[] = [];

      if (this.config.enable_journey_tracking) {
        promises.push(userJourneyAnalytics.trackConversion(eventType, value));
      }

      if (this.config.enable_funnel_tracking) {
        // Track conversion in all active funnels
        for (const funnelId of this.config.funnel_definitions) {
          promises.push(
            conversionFunnelTracker.trackConversion(this.config.user_id || 'anonymous', funnelId, eventType, value, metadata)
          );
        }
      }

      if (this.config.enable_ab_testing) {
        const runningTests = await abTestingEngine.getRunningTestsForUser(this.config.user_id || 'anonymous');
        for (const test of runningTests) {
          promises.push(
            abTestingEngine.trackConversion(this.config.user_id || 'anonymous', test.test_id, eventType, value, metadata)
          );
        }
      }

      await Promise.all(promises);

      // Log integrated conversion event
      this.logConversionEvent(eventType, value, metadata);
    } catch (error) {
      console.error('Failed to track conversion across systems:', error);
    }
  }

  async getIntegratedAnalytics(dateRange: { start: Date; end: Date }): Promise<IntegratedAnalytics> {
    if (!this.isInitialized) {
      throw new Error('Analytics integration not initialized');
    }

    try {
      const [
        journeyAnalytics,
        performanceData,
        reliabilityData
      ] = await Promise.all([
        userJourneyAnalytics.getJourneyAnalytics(dateRange),
        performanceMonitor.getPerformanceSnapshot(),
        reliabilityScorer.getCurrentScore()
      ]);

      const conversionMetrics = this.calculateConversionMetrics(journeyAnalytics, dateRange);
      const userExperience = this.calculateUserExperienceMetrics(journeyAnalytics);
      const performanceImpact = this.calculatePerformanceImpact(performanceData, reliabilityData, conversionMetrics);
      const topConversionPaths = this.analyzeConversionPaths(journeyAnalytics);
      const optimizationOpportunities = await this.identifyOptimizationOpportunities(dateRange);
      const crossChannelInsights = await this.generateCrossChannelInsights(dateRange);

      return {
        conversion_metrics: conversionMetrics,
        user_experience: userExperience,
        performance_impact: performanceImpact,
        top_conversion_paths: topConversionPaths,
        optimization_opportunities: optimizationOpportunities,
        cross_channel_insights: crossChannelInsights
      };
    } catch (error) {
      console.error('Failed to generate integrated analytics:', error);
      throw error;
    }
  }

  async generateConversionReport(dateRange: { start: Date; end: Date }): Promise<{
    executive_summary: string[];
    key_findings: string[];
    actionable_insights: Array<{
      insight: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'low' | 'medium' | 'high';
      timeline: string;
    }>;
    detailed_metrics: IntegratedAnalytics;
  }> {
    const analytics = await this.getIntegratedAnalytics(dateRange);

    return {
      executive_summary: this.generateExecutiveSummary(analytics),
      key_findings: this.generateKeyFindings(analytics),
      actionable_insights: this.generateActionableInsights(analytics),
      detailed_metrics: analytics
    };
  }

  private setupIntegratedTracking(): void {
    if (typeof window === 'undefined') return;

    // Set up cross-system event tracking
    this.setupPageViewTracking();
    this.setupFormTracking();
    this.setupClickTracking();
    this.setupScrollTracking();
  }

  private setupPageViewTracking(): void {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = (...args) => {
      originalPushState.apply(window.history, args);
      this.handlePageView();
    };

    window.history.replaceState = (...args) => {
      originalReplaceState.apply(window.history, args);
      this.handlePageView();
    };

    window.addEventListener('popstate', () => {
      this.handlePageView();
    });

    // Track initial page view
    this.handlePageView();
  }

  private async handlePageView(): Promise<void> {
    if (!this.config) return;

    const path = window.location.pathname;

    if (this.config.enable_journey_tracking) {
      await userJourneyAnalytics.trackPageView(path);
    }

    // Check for funnel step progression
    if (this.config.enable_funnel_tracking) {
      // This would be handled automatically by the funnel tracker's page change detection
    }
  }

  private setupFormTracking(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('focusin', async (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        const form = target.closest('form');
        if (form) {
          const formId = form.id || form.className || 'unknown-form';
          if (this.config?.enable_journey_tracking) {
            await userJourneyAnalytics.trackFormInteraction(formId, 'start');
          }
        }
      }
    });

    document.addEventListener('submit', async (event) => {
      const form = event.target as HTMLFormElement;
      const formId = form.id || form.className || 'unknown-form';

      if (this.config?.enable_journey_tracking) {
        await userJourneyAnalytics.trackFormInteraction(formId, 'submit');
      }

      // Check if this is a conversion event
      if (this.config?.conversion_events.includes(formId)) {
        await this.trackConversion(`form_submit_${formId}`);
      }
    });
  }

  private setupClickTracking(): void {
    if (typeof window === 'undefined') return;

    document.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;

      // Track button clicks that might be conversions
      if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button') {
        const buttonId = target.id || target.className || target.textContent?.trim() || 'unknown-button';

        if (this.config?.conversion_events.includes(buttonId)) {
          await this.trackConversion(`button_click_${buttonId}`);
        }
      }

      // Track link clicks
      if (target.tagName === 'A') {
        const href = target.getAttribute('href');
        if (href && !href.startsWith('#')) {
          if (this.config?.enable_journey_tracking) {
            await userJourneyAnalytics.trackEvent({
              event_type: 'button_click' as any,
              page_path: window.location.pathname,
              metadata: {
                link_href: href,
                link_text: target.textContent?.trim()
              }
            });
          }
        }
      }
    });
  }

  private setupScrollTracking(): void {
    if (typeof window === 'undefined') return;

    let lastScrollDepth = 0;
    const scrollThresholds = [25, 50, 75, 90];

    const handleScroll = async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      const scrollDepth = ((scrollTop + viewportHeight) / scrollHeight) * 100;

      for (const threshold of scrollThresholds) {
        if (scrollDepth >= threshold && lastScrollDepth < threshold) {
          if (this.config?.enable_journey_tracking) {
            await userJourneyAnalytics.trackScrollDepth(threshold);
          }
        }
      }

      lastScrollDepth = scrollDepth;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  private calculateConversionMetrics(journeyAnalytics: any, dateRange: { start: Date; end: Date }): ConversionMetrics {
    return {
      total_conversions: journeyAnalytics?.total_sessions || 0,
      conversion_rate: journeyAnalytics?.conversion_rate || 0,
      average_conversion_value: 0, // Would need actual conversion value data
      conversion_by_source: {},
      time_to_conversion: journeyAnalytics?.average_session_duration || 0,
      conversion_trends: []
    };
  }

  private calculateUserExperienceMetrics(journeyAnalytics: any): UserExperienceMetrics {
    return {
      bounce_rate: journeyAnalytics?.bounce_rate || 0,
      session_duration: journeyAnalytics?.average_session_duration || 0,
      pages_per_session: journeyAnalytics?.total_sessions > 0 ?
        (journeyAnalytics.most_common_paths?.reduce((sum: number, path: any) => sum + path.path.length, 0) || 0) / journeyAnalytics.total_sessions : 0,
      user_engagement_score: Math.max(0, 100 - (journeyAnalytics?.bounce_rate * 100 || 100)),
      satisfaction_score: 0, // Would need user feedback data
      task_completion_rate: journeyAnalytics?.conversion_rate || 0
    };
  }

  private calculatePerformanceImpact(performanceData: any, reliabilityData: any, conversionMetrics: ConversionMetrics): PerformanceImpactMetrics {
    return {
      conversion_by_performance: {},
      speed_impact_on_conversion: 0, // Would correlate performance with conversion data
      reliability_impact_on_conversion: 0,
      performance_correlation_score: 0
    };
  }

  private analyzeConversionPaths(journeyAnalytics: any): Array<{
    path: string[];
    conversions: number;
    rate: number;
    avg_time: number;
  }> {
    if (!journeyAnalytics?.most_common_paths) return [];

    return journeyAnalytics.most_common_paths.map((path: any) => ({
      path: path.path,
      conversions: Math.round(path.frequency * path.conversion_rate),
      rate: path.conversion_rate,
      avg_time: 0 // Would need timing data
    }));
  }

  private async identifyOptimizationOpportunities(dateRange: { start: Date; end: Date }): Promise<Array<{
    type: 'funnel' | 'journey' | 'performance' | 'ab_test' | 'heatmap';
    priority: 'high' | 'medium' | 'low';
    opportunity: string;
    potential_impact: string;
    effort_required: string;
    data_confidence: number;
  }>> {
    const opportunities: Array<{
      type: 'funnel' | 'journey' | 'performance' | 'ab_test' | 'heatmap';
      priority: 'high' | 'medium' | 'low';
      opportunity: string;
      potential_impact: string;
      effort_required: string;
      data_confidence: number;
    }> = [];

    try {
      // Analyze journey data for opportunities
      const journeyAnalytics = await userJourneyAnalytics.getJourneyAnalytics(dateRange);
      if (journeyAnalytics.bounce_rate > 0.7) {
        opportunities.push({
          type: 'journey',
          priority: 'high',
          opportunity: 'Reduce high bounce rate on landing pages',
          potential_impact: 'Could improve conversion rate by 15-30%',
          effort_required: 'medium',
          data_confidence: 0.85
        });
      }

      // Analyze heatmap data for opportunities
      try {
        const heatmapData = await heatmapAnalytics.getHeatmapData(window?.location?.pathname || '/', dateRange);
        if (heatmapData.rage_clicks.length > 0) {
          opportunities.push({
            type: 'heatmap',
            priority: 'high',
            opportunity: 'Fix rage click areas causing user frustration',
            potential_impact: 'Could improve user satisfaction by 20%',
            effort_required: 'low',
            data_confidence: 0.9
          });
        }
      } catch (error) {
        // Heatmap data not available
      }

      return opportunities;
    } catch (error) {
      console.error('Failed to identify optimization opportunities:', error);
      return [];
    }
  }

  private async generateCrossChannelInsights(dateRange: { start: Date; end: Date }): Promise<Array<{
    channel: string;
    insight: string;
    impact: string;
    recommendation: string;
  }>> {
    return [
      {
        channel: 'User Journey',
        insight: 'Users follow predictable navigation patterns',
        impact: 'Understanding these patterns can improve conversion rates',
        recommendation: 'Optimize high-traffic paths for conversion'
      },
      {
        channel: 'Performance',
        insight: 'Page load speed correlates with conversion rates',
        impact: 'Faster pages see higher conversion rates',
        recommendation: 'Prioritize performance optimization for conversion-critical pages'
      }
    ];
  }

  private generateExecutiveSummary(analytics: IntegratedAnalytics): string[] {
    const summary: string[] = [];

    summary.push(`Conversion rate: ${(analytics.conversion_metrics.conversion_rate * 100).toFixed(2)}%`);
    summary.push(`User experience score: ${analytics.user_experience.user_engagement_score.toFixed(0)}/100`);
    summary.push(`${analytics.optimization_opportunities.length} optimization opportunities identified`);

    return summary;
  }

  private generateKeyFindings(analytics: IntegratedAnalytics): string[] {
    const findings: string[] = [];

    if (analytics.user_experience.bounce_rate > 0.5) {
      findings.push('High bounce rate indicates potential landing page issues');
    }

    if (analytics.optimization_opportunities.filter(o => o.priority === 'high').length > 0) {
      findings.push('Multiple high-priority optimization opportunities available');
    }

    return findings;
  }

  private generateActionableInsights(analytics: IntegratedAnalytics): Array<{
    insight: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }> {
    return analytics.optimization_opportunities.map(opp => ({
      insight: opp.opportunity,
      impact: opp.priority,
      effort: opp.effort_required as 'low' | 'medium' | 'high',
      timeline: opp.effort_required === 'low' ? '1-2 weeks' :
                opp.effort_required === 'medium' ? '2-4 weeks' : '1-2 months'
    }));
  }

  private logConversionEvent(eventType: string, value?: number, metadata?: Record<string, any>): void {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        event_category: 'conversion',
        event_label: eventType,
        value: value,
        custom_parameters: metadata
      });
    }
  }
}

export const conversionAnalyticsIntegration = ConversionAnalyticsIntegration.getInstance();