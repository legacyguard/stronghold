import { createClient } from '@/lib/supabase';

export interface CustomerLifecycleStage {
  id: string;
  name: string;
  description: string;
  criteria: Record<string, any>;
  typical_duration_days: number;
  conversion_rate_target: number;
  key_metrics: string[];
}

export interface CustomerLifecycleEvent {
  id: string;
  user_id: string;
  session_id?: string;
  event_type: 'stage_entry' | 'stage_exit' | 'milestone' | 'touchpoint' | 'engagement' | 'transaction';
  stage_id: string;
  previous_stage_id?: string;
  timestamp: Date;
  event_data: Record<string, any>;
  value?: number;
  metadata?: Record<string, any>;
}

export interface CustomerJourney {
  id: string;
  user_id: string;
  current_stage_id: string;
  journey_start: Date;
  last_activity: Date;
  total_value: number;
  stage_progression: {
    stage_id: string;
    entry_date: Date;
    exit_date?: Date;
    duration_days?: number;
    activities_count: number;
    value_generated: number;
  }[];
  lifecycle_metrics: {
    acquisition_cost: number;
    lifetime_value: number;
    engagement_score: number;
    retention_probability: number;
    churn_risk_score: number;
  };
}

export interface LifecycleAnalytics {
  stage_performance: {
    stage_id: string;
    stage_name: string;
    total_customers: number;
    avg_duration_days: number;
    conversion_rate: number;
    dropout_rate: number;
    value_per_customer: number;
    engagement_rate: number;
  }[];
  funnel_analysis: {
    stage_transitions: {
      from_stage: string;
      to_stage: string;
      transition_rate: number;
      avg_transition_time: number;
      customer_count: number;
    }[];
    bottlenecks: {
      stage_id: string;
      bottleneck_score: number;
      improvement_potential: number;
    }[];
  };
  cohort_insights: {
    cohort_period: string;
    retention_rates: Record<string, number>;
    value_progression: Record<string, number>;
    stage_distribution: Record<string, number>;
  }[];
}

class CustomerLifecycleAnalyticsEngine {
  private static instance: CustomerLifecycleAnalyticsEngine;
  private supabase = createClient();
  private lifecycleStages: Map<string, CustomerLifecycleStage> = new Map();
  private isInitialized = false;

  static getInstance(): CustomerLifecycleAnalyticsEngine {
    if (!CustomerLifecycleAnalyticsEngine.instance) {
      CustomerLifecycleAnalyticsEngine.instance = new CustomerLifecycleAnalyticsEngine();
    }
    return CustomerLifecycleAnalyticsEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.setupDefaultStages();
    this.isInitialized = true;
  }

  private async setupDefaultStages(): Promise<void> {
    const defaultStages: CustomerLifecycleStage[] = [
      {
        id: 'visitor',
        name: 'Visitor',
        description: 'First-time website visitor, exploring content',
        criteria: { has_account: false, sessions_count: { min: 1, max: 3 } },
        typical_duration_days: 7,
        conversion_rate_target: 0.15,
        key_metrics: ['page_views', 'session_duration', 'bounce_rate']
      },
      {
        id: 'lead',
        name: 'Lead',
        description: 'Shown interest, may have downloaded content or engaged',
        criteria: { has_account: false, engaged_with_content: true },
        typical_duration_days: 14,
        conversion_rate_target: 0.25,
        key_metrics: ['content_downloads', 'form_submissions', 'engagement_score']
      },
      {
        id: 'prospect',
        name: 'Prospect',
        description: 'Registered user, actively exploring services',
        criteria: { has_account: true, days_since_signup: { min: 0, max: 30 } },
        typical_duration_days: 21,
        conversion_rate_target: 0.35,
        key_metrics: ['feature_usage', 'documentation_views', 'support_interactions']
      },
      {
        id: 'trial_user',
        name: 'Trial User',
        description: 'Using free trial or freemium features',
        criteria: { has_trial: true, is_paying: false },
        typical_duration_days: 14,
        conversion_rate_target: 0.20,
        key_metrics: ['feature_adoption', 'trial_engagement', 'usage_frequency']
      },
      {
        id: 'new_customer',
        name: 'New Customer',
        description: 'Recently converted to paid plan',
        criteria: { is_paying: true, days_since_conversion: { min: 0, max: 90 } },
        typical_duration_days: 90,
        conversion_rate_target: 0.80,
        key_metrics: ['onboarding_completion', 'feature_adoption', 'support_satisfaction']
      },
      {
        id: 'active_customer',
        name: 'Active Customer',
        description: 'Regularly using service, established patterns',
        criteria: { is_paying: true, monthly_usage: { min: 5 }, engagement_score: { min: 0.6 } },
        typical_duration_days: 365,
        conversion_rate_target: 0.90,
        key_metrics: ['monthly_usage', 'feature_utilization', 'satisfaction_score']
      },
      {
        id: 'power_user',
        name: 'Power User',
        description: 'Heavy usage, potential advocate',
        criteria: { is_paying: true, usage_percentile: { min: 80 } },
        typical_duration_days: 730,
        conversion_rate_target: 0.95,
        key_metrics: ['advanced_features', 'referrals', 'community_participation']
      },
      {
        id: 'at_risk',
        name: 'At Risk',
        description: 'Declining engagement, potential churn',
        criteria: { engagement_decline: true, churn_risk_score: { min: 0.7 } },
        typical_duration_days: 30,
        conversion_rate_target: 0.40,
        key_metrics: ['engagement_trend', 'support_tickets', 'feature_abandonment']
      },
      {
        id: 'churned',
        name: 'Churned',
        description: 'Cancelled subscription or inactive',
        criteria: { is_active: false },
        typical_duration_days: 0,
        conversion_rate_target: 0.10,
        key_metrics: ['churn_reason', 'win_back_potential', 'exit_feedback']
      }
    ];

    defaultStages.forEach(stage => {
      this.lifecycleStages.set(stage.id, stage);
    });
  }

  async trackLifecycleEvent(eventData: Partial<CustomerLifecycleEvent>): Promise<void> {
    const event: CustomerLifecycleEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ...eventData
    } as CustomerLifecycleEvent;

    try {
      const { error } = await this.supabase
        .from('customer_lifecycle_events')
        .insert(event);

      if (error) throw error;

      // Update customer journey
      await this.updateCustomerJourney(event.user_id, event);

    } catch (error) {
      console.error('Error tracking lifecycle event:', error);
    }
  }

  async updateCustomerJourney(userId: string, event: CustomerLifecycleEvent): Promise<void> {
    try {
      // Get current journey
      const { data: journey } = await this.supabase
        .from('customer_journeys')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!journey) {
        // Create new journey
        await this.createCustomerJourney(userId, event);
        return;
      }

      // Update existing journey
      const updatedJourney = {
        ...journey,
        last_activity: event.timestamp,
        current_stage_id: event.stage_id
      };

      // Update stage progression if stage changed
      if (event.event_type === 'stage_entry') {
        const stageProgression = [...journey.stage_progression];

        // Close previous stage
        if (event.previous_stage_id) {
          const prevStageIndex = stageProgression.findIndex(s => s.stage_id === event.previous_stage_id && !s.exit_date);
          if (prevStageIndex >= 0) {
            stageProgression[prevStageIndex].exit_date = event.timestamp;
            stageProgression[prevStageIndex].duration_days =
              Math.ceil((event.timestamp.getTime() - new Date(stageProgression[prevStageIndex].entry_date).getTime()) / (1000 * 60 * 60 * 24));
          }
        }

        // Add new stage entry
        stageProgression.push({
          stage_id: event.stage_id,
          entry_date: event.timestamp,
          activities_count: 1,
          value_generated: event.value || 0
        });

        updatedJourney.stage_progression = stageProgression;
      }

      // Update total value
      if (event.value) {
        updatedJourney.total_value = (journey.total_value || 0) + event.value;
      }

      // Update lifecycle metrics
      updatedJourney.lifecycle_metrics = await this.calculateLifecycleMetrics(userId, updatedJourney);

      const { error } = await this.supabase
        .from('customer_journeys')
        .update(updatedJourney)
        .eq('user_id', userId);

      if (error) throw error;

    } catch (error) {
      console.error('Error updating customer journey:', error);
    }
  }

  private async createCustomerJourney(userId: string, initialEvent: CustomerLifecycleEvent): Promise<void> {
    const journey: Partial<CustomerJourney> = {
      id: crypto.randomUUID(),
      user_id: userId,
      current_stage_id: initialEvent.stage_id,
      journey_start: initialEvent.timestamp,
      last_activity: initialEvent.timestamp,
      total_value: initialEvent.value || 0,
      stage_progression: [{
        stage_id: initialEvent.stage_id,
        entry_date: initialEvent.timestamp,
        activities_count: 1,
        value_generated: initialEvent.value || 0
      }],
      lifecycle_metrics: {
        acquisition_cost: 0,
        lifetime_value: initialEvent.value || 0,
        engagement_score: 0.5,
        retention_probability: 0.7,
        churn_risk_score: 0.1
      }
    };

    try {
      const { error } = await this.supabase
        .from('customer_journeys')
        .insert(journey);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating customer journey:', error);
    }
  }

  private async calculateLifecycleMetrics(userId: string, journey: any): Promise<any> {
    // Calculate engagement score based on recent activity
    const recentEvents = await this.getRecentEvents(userId, 30);
    const engagementScore = Math.min(1, recentEvents.length / 20); // Normalized engagement

    // Calculate retention probability based on stage and behavior patterns
    const currentStage = this.lifecycleStages.get(journey.current_stage_id);
    const stageMultiplier = currentStage?.conversion_rate_target || 0.5;
    const retentionProbability = Math.min(1, engagementScore * stageMultiplier * 1.2);

    // Calculate churn risk (inverse of retention with additional factors)
    const daysSinceLastActivity = Math.ceil((new Date().getTime() - new Date(journey.last_activity).getTime()) / (1000 * 60 * 60 * 24));
    const inactivityFactor = Math.min(1, daysSinceLastActivity / 30);
    const churnRiskScore = Math.max(0, (1 - retentionProbability) + (inactivityFactor * 0.3));

    // Calculate lifetime value (basic projection)
    const avgMonthlyValue = journey.total_value / Math.max(1, journey.stage_progression.length);
    const projectedLifetimeValue = avgMonthlyValue * retentionProbability * 12;

    return {
      acquisition_cost: journey.lifecycle_metrics?.acquisition_cost || 0,
      lifetime_value: projectedLifetimeValue,
      engagement_score: engagementScore,
      retention_probability: retentionProbability,
      churn_risk_score: churnRiskScore
    };
  }

  private async getRecentEvents(userId: string, days: number): Promise<CustomerLifecycleEvent[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const { data, error } = await this.supabase
        .from('customer_lifecycle_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }
  }

  async analyzeCustomerStage(userId: string, userData: Record<string, any>): Promise<string> {
    // Analyze user data against stage criteria to determine current stage
    for (const [stageId, stage] of this.lifecycleStages.entries()) {
      if (this.matchesStageCriteria(userData, stage.criteria)) {
        return stageId;
      }
    }
    return 'visitor'; // Default stage
  }

  private matchesStageCriteria(userData: Record<string, any>, criteria: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(criteria)) {
      const userValue = userData[key];

      if (typeof value === 'object' && value !== null) {
        if ('min' in value && userValue < value.min) return false;
        if ('max' in value && userValue > value.max) return false;
      } else {
        if (userValue !== value) return false;
      }
    }
    return true;
  }

  async generateLifecycleAnalytics(timeRange: { start: Date; end: Date }): Promise<LifecycleAnalytics> {
    try {
      // Get all events in time range
      const { data: events } = await this.supabase
        .from('customer_lifecycle_events')
        .select('*')
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString());

      // Get all journeys
      const { data: journeys } = await this.supabase
        .from('customer_journeys')
        .select('*');

      // Analyze stage performance
      const stagePerformance = await this.analyzeStagePerformance(events || [], journeys || []);

      // Analyze funnel
      const funnelAnalysis = await this.analyzeFunnel(events || [], journeys || []);

      // Generate cohort insights
      const cohortInsights = await this.generateCohortInsights(journeys || [], timeRange);

      return {
        stage_performance: stagePerformance,
        funnel_analysis: funnelAnalysis,
        cohort_insights: cohortInsights
      };

    } catch (error) {
      console.error('Error generating lifecycle analytics:', error);
      throw error;
    }
  }

  private async analyzeStagePerformance(events: CustomerLifecycleEvent[], journeys: CustomerJourney[]): Promise<any[]> {
    const stageStats = new Map();

    // Initialize stage stats
    for (const [stageId, stage] of this.lifecycleStages.entries()) {
      stageStats.set(stageId, {
        stage_id: stageId,
        stage_name: stage.name,
        total_customers: 0,
        total_duration: 0,
        conversions: 0,
        dropouts: 0,
        total_value: 0,
        engagement_events: 0
      });
    }

    // Analyze journeys
    journeys.forEach(journey => {
      journey.stage_progression.forEach(stageProgress => {
        const stats = stageStats.get(stageProgress.stage_id);
        if (stats) {
          stats.total_customers++;
          if (stageProgress.duration_days) {
            stats.total_duration += stageProgress.duration_days;
          }
          stats.total_value += stageProgress.value_generated || 0;
        }
      });
    });

    // Count engagement events
    events.forEach(event => {
      if (event.event_type === 'engagement') {
        const stats = stageStats.get(event.stage_id);
        if (stats) {
          stats.engagement_events++;
        }
      }
    });

    // Calculate final metrics
    return Array.from(stageStats.values()).map(stats => ({
      stage_id: stats.stage_id,
      stage_name: stats.stage_name,
      total_customers: stats.total_customers,
      avg_duration_days: stats.total_customers > 0 ? stats.total_duration / stats.total_customers : 0,
      conversion_rate: 0.75, // Simplified calculation
      dropout_rate: 0.25,
      value_per_customer: stats.total_customers > 0 ? stats.total_value / stats.total_customers : 0,
      engagement_rate: stats.total_customers > 0 ? stats.engagement_events / stats.total_customers : 0
    }));
  }

  private async analyzeFunnel(events: CustomerLifecycleEvent[], journeys: CustomerJourney[]): Promise<any> {
    const transitions = new Map();
    const bottlenecks = new Map();

    // Analyze stage transitions
    journeys.forEach(journey => {
      for (let i = 1; i < journey.stage_progression.length; i++) {
        const fromStage = journey.stage_progression[i - 1].stage_id;
        const toStage = journey.stage_progression[i].stage_id;
        const transitionKey = `${fromStage}->${toStage}`;

        if (!transitions.has(transitionKey)) {
          transitions.set(transitionKey, {
            from_stage: fromStage,
            to_stage: toStage,
            count: 0,
            total_time: 0
          });
        }

        const transition = transitions.get(transitionKey);
        transition.count++;

        if (journey.stage_progression[i - 1].duration_days) {
          transition.total_time += journey.stage_progression[i - 1].duration_days;
        }
      }
    });

    // Calculate transition rates and bottlenecks
    const stageTransitions = Array.from(transitions.values()).map(t => ({
      from_stage: t.from_stage,
      to_stage: t.to_stage,
      transition_rate: 0.8, // Simplified
      avg_transition_time: t.count > 0 ? t.total_time / t.count : 0,
      customer_count: t.count
    }));

    // Identify bottlenecks (simplified)
    const bottleneckList = Array.from(this.lifecycleStages.keys()).map(stageId => ({
      stage_id: stageId,
      bottleneck_score: Math.random() * 0.5, // Simplified scoring
      improvement_potential: Math.random() * 100
    }));

    return {
      stage_transitions: stageTransitions,
      bottlenecks: bottleneckList
    };
  }

  private async generateCohortInsights(journeys: CustomerJourney[], timeRange: { start: Date; end: Date }): Promise<any[]> {
    // Group by month cohorts
    const cohorts = new Map();

    journeys.forEach(journey => {
      const startMonth = journey.journey_start.toISOString().substring(0, 7); // YYYY-MM

      if (!cohorts.has(startMonth)) {
        cohorts.set(startMonth, {
          cohort_period: startMonth,
          customers: [],
          retention_rates: {},
          value_progression: {},
          stage_distribution: {}
        });
      }

      cohorts.get(startMonth).customers.push(journey);
    });

    // Calculate metrics for each cohort
    return Array.from(cohorts.values()).map(cohort => {
      const totalCustomers = cohort.customers.length;

      // Simplified retention calculation
      cohort.retention_rates = {
        'month_1': 0.85,
        'month_3': 0.70,
        'month_6': 0.55,
        'month_12': 0.40
      };

      cohort.value_progression = {
        'month_1': cohort.customers.reduce((sum: number, c: any) => sum + c.total_value, 0) / totalCustomers,
        'month_3': cohort.customers.reduce((sum: number, c: any) => sum + c.total_value, 0) / totalCustomers * 1.5,
        'month_6': cohort.customers.reduce((sum: number, c: any) => sum + c.total_value, 0) / totalCustomers * 2.2,
        'month_12': cohort.customers.reduce((sum: number, c: any) => sum + c.total_value, 0) / totalCustomers * 3.0
      };

      // Stage distribution
      const stageCount = new Map();
      cohort.customers.forEach((customer: any) => {
        const stage = customer.current_stage_id;
        stageCount.set(stage, (stageCount.get(stage) || 0) + 1);
      });

      cohort.stage_distribution = {};
      for (const [stage, count] of stageCount.entries()) {
        cohort.stage_distribution[stage] = count / totalCustomers;
      }

      return cohort;
    });
  }

  async getCustomerJourney(userId: string): Promise<CustomerJourney | null> {
    try {
      const { data, error } = await this.supabase
        .from('customer_journeys')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching customer journey:', error);
      return null;
    }
  }

  getStages(): CustomerLifecycleStage[] {
    return Array.from(this.lifecycleStages.values());
  }
}

// Export singleton instance
export const customerLifecycleAnalytics = CustomerLifecycleAnalyticsEngine.getInstance();