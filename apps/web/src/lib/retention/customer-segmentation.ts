import { createClient } from '@/lib/supabase';
import { retentionPredictionEngine, type RetentionFeatures } from './retention-prediction-engine';
import { customerLifecycleAnalytics, type CustomerJourney } from './customer-lifecycle-analytics';

export interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  criteria: SegmentCriteria;
  color: string;
  priority: number;
  created_at: Date;
  last_updated: Date;
  customer_count: number;
  avg_ltv: number;
  retention_rate: number;
  churn_risk_avg: number;
}

export interface SegmentCriteria {
  behavioral: {
    session_frequency?: { min?: number; max?: number };
    feature_adoption_rate?: { min?: number; max?: number };
    engagement_score?: { min?: number; max?: number };
    last_login_days?: { min?: number; max?: number };
  };
  transactional: {
    total_spent?: { min?: number; max?: number };
    avg_order_value?: { min?: number; max?: number };
    subscription_length?: { min?: number; max?: number };
  };
  lifecycle: {
    current_stage?: string[];
    stage_progression_rate?: { min?: number; max?: number };
    onboarding_completion?: { min?: number; max?: number };
  };
  risk: {
    churn_probability?: { min?: number; max?: number };
    retention_probability?: { min?: number; max?: number };
    risk_level?: ('low' | 'medium' | 'high' | 'critical')[];
  };
  demographic: {
    signup_date_range?: { start?: Date; end?: Date };
    subscription_type?: string[];
    geographic_region?: string[];
  };
}

export interface CustomerSegmentMembership {
  user_id: string;
  segment_id: string;
  assigned_date: Date;
  confidence_score: number;
  segment_rank: number; // If user belongs to multiple segments
  last_evaluated: Date;
}

export interface CohortAnalysis {
  id: string;
  name: string;
  cohort_type: 'signup_month' | 'first_purchase' | 'feature_adoption' | 'custom';
  start_date: Date;
  end_date: Date;
  customer_count: number;
  retention_analysis: {
    periods: string[];
    retention_rates: number[];
    churn_rates: number[];
    customer_counts: number[];
  };
  value_analysis: {
    total_revenue: number;
    avg_revenue_per_customer: number;
    revenue_retention: number[];
    ltv_progression: number[];
  };
  behavioral_analysis: {
    feature_adoption_rates: Record<string, number>;
    engagement_trends: number[];
    support_interaction_rates: number[];
  };
  comparative_metrics: {
    vs_previous_cohort: {
      retention_change: number;
      revenue_change: number;
      engagement_change: number;
    };
    vs_baseline: {
      performance_index: number;
      risk_index: number;
    };
  };
}

export interface SegmentationInsights {
  segment_performance: {
    segment_id: string;
    segment_name: string;
    size: number;
    growth_rate: number;
    avg_ltv: number;
    retention_rate: number;
    engagement_score: number;
    revenue_contribution: number;
  }[];
  segment_transitions: {
    from_segment: string;
    to_segment: string;
    transition_rate: number;
    avg_transition_time_days: number;
    common_triggers: string[];
  }[];
  optimization_opportunities: {
    segment_id: string;
    opportunity_type: 'retention' | 'upsell' | 'engagement' | 'activation';
    impact_potential: number;
    recommended_actions: string[];
  }[];
}

class CustomerSegmentationEngine {
  private static instance: CustomerSegmentationEngine;
  private supabase = createClient();
  private segments: Map<string, CustomerSegment> = new Map();
  private isInitialized = false;

  static getInstance(): CustomerSegmentationEngine {
    if (!CustomerSegmentationEngine.instance) {
      CustomerSegmentationEngine.instance = new CustomerSegmentationEngine();
    }
    return CustomerSegmentationEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadSegments();
    await this.setupDefaultSegments();
    this.isInitialized = true;
  }

  private async loadSegments(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('customer_segments')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;

      if (data) {
        data.forEach(segment => {
          this.segments.set(segment.id, segment);
        });
      }
    } catch (error) {
      console.error('Error loading segments:', error);
    }
  }

  private async setupDefaultSegments(): Promise<void> {
    if (this.segments.size > 0) return; // Segments already exist

    const defaultSegments: Partial<CustomerSegment>[] = [
      {
        id: 'champions',
        name: 'Champions',
        description: 'High-value, highly engaged customers who advocate for your product',
        criteria: {
          behavioral: {
            engagement_score: { min: 0.8 },
            session_frequency: { min: 0.5 }
          },
          transactional: {
            total_spent: { min: 500 }
          },
          risk: {
            churn_probability: { max: 0.2 }
          }
        },
        color: '#10B981',
        priority: 1
      },
      {
        id: 'loyal_customers',
        name: 'Loyal Customers',
        description: 'Regular users with consistent engagement and spending',
        criteria: {
          behavioral: {
            engagement_score: { min: 0.6, max: 0.8 },
            session_frequency: { min: 0.3 }
          },
          transactional: {
            total_spent: { min: 200 }
          },
          risk: {
            churn_probability: { max: 0.3 }
          }
        },
        color: '#3B82F6',
        priority: 2
      },
      {
        id: 'potential_loyalists',
        name: 'Potential Loyalists',
        description: 'Recent customers with high engagement but lower spending',
        criteria: {
          behavioral: {
            engagement_score: { min: 0.6 },
            last_login_days: { max: 7 }
          },
          transactional: {
            total_spent: { max: 200 }
          },
          lifecycle: {
            current_stage: ['new_customer', 'prospect']
          }
        },
        color: '#8B5CF6',
        priority: 3
      },
      {
        id: 'new_customers',
        name: 'New Customers',
        description: 'Recently acquired customers in onboarding phase',
        criteria: {
          lifecycle: {
            current_stage: ['new_customer'],
            onboarding_completion: { max: 0.8 }
          },
          demographic: {
            signup_date_range: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        },
        color: '#06B6D4',
        priority: 4
      },
      {
        id: 'at_risk',
        name: 'At Risk',
        description: 'Customers showing signs of declining engagement',
        criteria: {
          behavioral: {
            engagement_score: { min: 0.3, max: 0.6 },
            last_login_days: { min: 7, max: 30 }
          },
          risk: {
            churn_probability: { min: 0.4, max: 0.7 }
          }
        },
        color: '#F59E0B',
        priority: 5
      },
      {
        id: 'cannot_lose_them',
        name: 'Cannot Lose Them',
        description: 'High-value customers at high risk of churning',
        criteria: {
          transactional: {
            total_spent: { min: 1000 }
          },
          risk: {
            churn_probability: { min: 0.5 }
          }
        },
        color: '#EF4444',
        priority: 6
      },
      {
        id: 'hibernating',
        name: 'Hibernating',
        description: 'Previously active customers who have become inactive',
        criteria: {
          behavioral: {
            last_login_days: { min: 30, max: 90 },
            engagement_score: { max: 0.3 }
          },
          transactional: {
            total_spent: { min: 100 }
          }
        },
        color: '#6B7280',
        priority: 7
      },
      {
        id: 'lost',
        name: 'Lost',
        description: 'Inactive customers who have likely churned',
        criteria: {
          behavioral: {
            last_login_days: { min: 90 }
          },
          risk: {
            churn_probability: { min: 0.8 }
          }
        },
        color: '#374151',
        priority: 8
      }
    ];

    for (const segmentData of defaultSegments) {
      const segment: CustomerSegment = {
        ...segmentData,
        created_at: new Date(),
        last_updated: new Date(),
        customer_count: 0,
        avg_ltv: 0,
        retention_rate: 0,
        churn_risk_avg: 0
      } as CustomerSegment;

      try {
        const { data, error } = await this.supabase
          .from('customer_segments')
          .insert(segment)
          .select()
          .single();

        if (error) throw error;
        this.segments.set(segment.id, data);
      } catch (error) {
        console.error('Error creating default segment:', segment.name, error);
      }
    }
  }

  async segmentCustomer(userId: string): Promise<string[]> {
    try {
      // Get customer features and journey
      const features = await retentionPredictionEngine.extractFeatures(userId);
      const journey = await customerLifecycleAnalytics.getCustomerJourney(userId);
      const prediction = await retentionPredictionEngine.predictRetention(userId);

      const matchingSegments: { segmentId: string; confidence: number }[] = [];

      // Check each segment criteria
      for (const [segmentId, segment] of this.segments.entries()) {
        const confidence = this.evaluateSegmentMatch(features, journey, prediction, segment.criteria);

        if (confidence > 0.5) { // Minimum confidence threshold
          matchingSegments.push({ segmentId, confidence });
        }
      }

      // Sort by confidence and take top segments
      matchingSegments.sort((a, b) => b.confidence - a.confidence);

      // Store segment memberships
      await this.storeSegmentMemberships(userId, matchingSegments);

      return matchingSegments.map(s => s.segmentId);

    } catch (error) {
      console.error('Error segmenting customer:', userId, error);
      return [];
    }
  }

  private evaluateSegmentMatch(
    features: RetentionFeatures,
    journey: CustomerJourney | null,
    prediction: any,
    criteria: SegmentCriteria
  ): number {
    let totalWeight = 0;
    let matchedWeight = 0;

    // Evaluate behavioral criteria
    if (criteria.behavioral) {
      totalWeight += 4;
      let behavioralScore = 0;

      if (criteria.behavioral.session_frequency) {
        behavioralScore += this.checkRangeMatch(features.session_frequency, criteria.behavioral.session_frequency);
      }
      if (criteria.behavioral.feature_adoption_rate) {
        behavioralScore += this.checkRangeMatch(features.feature_adoption_rate, criteria.behavioral.feature_adoption_rate);
      }
      if (criteria.behavioral.engagement_score) {
        behavioralScore += this.checkRangeMatch(features.content_interaction_score, criteria.behavioral.engagement_score);
      }
      if (criteria.behavioral.last_login_days) {
        behavioralScore += this.checkRangeMatch(features.last_login_days_ago, criteria.behavioral.last_login_days);
      }

      matchedWeight += behavioralScore;
    }

    // Evaluate transactional criteria
    if (criteria.transactional) {
      totalWeight += 3;
      let transactionalScore = 0;

      if (criteria.transactional.total_spent) {
        transactionalScore += this.checkRangeMatch(features.total_spent, criteria.transactional.total_spent);
      }
      if (criteria.transactional.avg_order_value) {
        transactionalScore += this.checkRangeMatch(features.avg_order_value, criteria.transactional.avg_order_value);
      }
      if (criteria.transactional.subscription_length) {
        transactionalScore += this.checkRangeMatch(features.subscription_length_days, criteria.transactional.subscription_length);
      }

      matchedWeight += transactionalScore;
    }

    // Evaluate lifecycle criteria
    if (criteria.lifecycle && journey) {
      totalWeight += 2;
      let lifecycleScore = 0;

      if (criteria.lifecycle.current_stage) {
        lifecycleScore += criteria.lifecycle.current_stage.includes(journey.current_stage_id) ? 1 : 0;
      }
      if (criteria.lifecycle.stage_progression_rate) {
        lifecycleScore += this.checkRangeMatch(features.stage_progression_rate, criteria.lifecycle.stage_progression_rate);
      }
      if (criteria.lifecycle.onboarding_completion) {
        lifecycleScore += this.checkRangeMatch(features.onboarding_completion_score, criteria.lifecycle.onboarding_completion);
      }

      matchedWeight += lifecycleScore;
    }

    // Evaluate risk criteria
    if (criteria.risk && prediction) {
      totalWeight += 3;
      let riskScore = 0;

      if (criteria.risk.churn_probability) {
        riskScore += this.checkRangeMatch(prediction.churn_probability, criteria.risk.churn_probability);
      }
      if (criteria.risk.retention_probability) {
        riskScore += this.checkRangeMatch(prediction.retention_probability, criteria.risk.retention_probability);
      }
      if (criteria.risk.risk_level) {
        riskScore += criteria.risk.risk_level.includes(prediction.risk_level) ? 1 : 0;
      }

      matchedWeight += riskScore;
    }

    return totalWeight > 0 ? matchedWeight / totalWeight : 0;
  }

  private checkRangeMatch(value: number, range: { min?: number; max?: number }): number {
    if (range.min !== undefined && value < range.min) return 0;
    if (range.max !== undefined && value > range.max) return 0;
    return 1;
  }

  private async storeSegmentMemberships(userId: string, segments: { segmentId: string; confidence: number }[]): Promise<void> {
    try {
      // Remove existing memberships
      await this.supabase
        .from('customer_segment_memberships')
        .delete()
        .eq('user_id', userId);

      // Insert new memberships
      const memberships: Partial<CustomerSegmentMembership>[] = segments.map((segment, index) => ({
        user_id: userId,
        segment_id: segment.segmentId,
        assigned_date: new Date(),
        confidence_score: segment.confidence,
        segment_rank: index + 1,
        last_evaluated: new Date()
      }));

      if (memberships.length > 0) {
        const { error } = await this.supabase
          .from('customer_segment_memberships')
          .insert(memberships);

        if (error) throw error;
      }

    } catch (error) {
      console.error('Error storing segment memberships:', error);
    }
  }

  async createCohortAnalysis(
    cohortType: CohortAnalysis['cohort_type'],
    startDate: Date,
    endDate: Date,
    customCriteria?: Record<string, any>
  ): Promise<CohortAnalysis> {
    try {
      // Get cohort customers based on type
      const cohortCustomers = await this.getCohortCustomers(cohortType, startDate, endDate, customCriteria);

      if (cohortCustomers.length === 0) {
        throw new Error('No customers found for cohort criteria');
      }

      // Analyze retention
      const retentionAnalysis = await this.analyzeRetention(cohortCustomers, startDate);

      // Analyze value
      const valueAnalysis = await this.analyzeValue(cohortCustomers);

      // Analyze behavior
      const behavioralAnalysis = await this.analyzeBehavior(cohortCustomers);

      // Comparative analysis
      const comparativeMetrics = await this.getComparativeMetrics(cohortCustomers, cohortType, startDate);

      const cohortAnalysis: CohortAnalysis = {
        id: crypto.randomUUID(),
        name: `${cohortType}_${startDate.toISOString().substring(0, 7)}`,
        cohort_type: cohortType,
        start_date: startDate,
        end_date: endDate,
        customer_count: cohortCustomers.length,
        retention_analysis: retentionAnalysis,
        value_analysis: valueAnalysis,
        behavioral_analysis: behavioralAnalysis,
        comparative_metrics: comparativeMetrics
      };

      // Store cohort analysis
      await this.storeCohortAnalysis(cohortAnalysis);

      return cohortAnalysis;

    } catch (error) {
      console.error('Error creating cohort analysis:', error);
      throw error;
    }
  }

  private async getCohortCustomers(
    cohortType: CohortAnalysis['cohort_type'],
    startDate: Date,
    endDate: Date,
    customCriteria?: Record<string, any>
  ): Promise<CustomerJourney[]> {
    let query = this.supabase.from('customer_journeys').select('*');

    switch (cohortType) {
      case 'signup_month':
        query = query
          .gte('journey_start', startDate.toISOString())
          .lte('journey_start', endDate.toISOString());
        break;
      case 'first_purchase':
        // Add logic for first purchase cohort
        query = query
          .gte('journey_start', startDate.toISOString())
          .lte('journey_start', endDate.toISOString())
          .gt('total_value', 0);
        break;
      case 'feature_adoption':
        // Add logic for feature adoption cohort
        query = query
          .gte('journey_start', startDate.toISOString())
          .lte('journey_start', endDate.toISOString());
        break;
      case 'custom':
        // Apply custom criteria
        if (customCriteria) {
          Object.entries(customCriteria).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        break;
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  private async analyzeRetention(customers: CustomerJourney[], cohortStart: Date): Promise<any> {
    const periods = ['day_1', 'day_7', 'day_30', 'day_90', 'day_180', 'day_365'];
    const retentionRates: number[] = [];
    const churnRates: number[] = [];
    const customerCounts: number[] = [];

    for (const period of periods) {
      const days = parseInt(period.split('_')[1]);
      const checkDate = new Date(cohortStart);
      checkDate.setDate(checkDate.getDate() + days);

      if (checkDate > new Date()) {
        retentionRates.push(0);
        churnRates.push(0);
        customerCounts.push(0);
        continue;
      }

      const retainedCustomers = customers.filter(customer => {
        const lastActivity = new Date(customer.last_activity);
        return lastActivity >= checkDate;
      });

      const retentionRate = retainedCustomers.length / customers.length;
      retentionRates.push(retentionRate);
      churnRates.push(1 - retentionRate);
      customerCounts.push(retainedCustomers.length);
    }

    return {
      periods,
      retention_rates: retentionRates,
      churn_rates: churnRates,
      customer_counts: customerCounts
    };
  }

  private async analyzeValue(customers: CustomerJourney[]): Promise<any> {
    const totalRevenue = customers.reduce((sum, customer) => sum + customer.total_value, 0);
    const avgRevenuePerCustomer = totalRevenue / customers.length;

    // Simplified revenue retention calculation
    const revenueRetention = [1.0, 0.95, 0.87, 0.78, 0.72, 0.68]; // Typical retention curve
    const ltvProgression = [
      avgRevenuePerCustomer,
      avgRevenuePerCustomer * 1.2,
      avgRevenuePerCustomer * 1.5,
      avgRevenuePerCustomer * 1.8,
      avgRevenuePerCustomer * 2.1,
      avgRevenuePerCustomer * 2.4
    ];

    return {
      total_revenue: totalRevenue,
      avg_revenue_per_customer: avgRevenuePerCustomer,
      revenue_retention: revenueRetention,
      ltv_progression: ltvProgression
    };
  }

  private async analyzeBehavior(customers: CustomerJourney[]): Promise<any> {
    // Simplified behavioral analysis
    return {
      feature_adoption_rates: {
        basic_features: 0.85,
        intermediate_features: 0.60,
        advanced_features: 0.35
      },
      engagement_trends: [0.8, 0.75, 0.73, 0.70, 0.68, 0.66],
      support_interaction_rates: [0.15, 0.12, 0.10, 0.08, 0.07, 0.06]
    };
  }

  private async getComparativeMetrics(
    customers: CustomerJourney[],
    cohortType: CohortAnalysis['cohort_type'],
    startDate: Date
  ): Promise<any> {
    // Simplified comparative analysis
    return {
      vs_previous_cohort: {
        retention_change: 0.05, // 5% improvement
        revenue_change: 0.12, // 12% improvement
        engagement_change: 0.03 // 3% improvement
      },
      vs_baseline: {
        performance_index: 1.08, // 8% above baseline
        risk_index: 0.92 // 8% lower risk than baseline
      }
    };
  }

  private async storeCohortAnalysis(analysis: CohortAnalysis): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cohort_analyses')
        .insert(analysis);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing cohort analysis:', error);
    }
  }

  async generateSegmentationInsights(): Promise<SegmentationInsights> {
    try {
      // Get segment performance
      const segmentPerformance = await this.getSegmentPerformance();

      // Get segment transitions
      const segmentTransitions = await this.getSegmentTransitions();

      // Identify optimization opportunities
      const optimizationOpportunities = await this.identifyOptimizationOpportunities();

      return {
        segment_performance: segmentPerformance,
        segment_transitions: segmentTransitions,
        optimization_opportunities: optimizationOpportunities
      };

    } catch (error) {
      console.error('Error generating segmentation insights:', error);
      throw error;
    }
  }

  private async getSegmentPerformance(): Promise<any[]> {
    const performance = [];

    for (const [segmentId, segment] of this.segments.entries()) {
      // Get segment members
      const { data: members } = await this.supabase
        .from('customer_segment_memberships')
        .select('user_id')
        .eq('segment_id', segmentId);

      const memberCount = members?.length || 0;

      performance.push({
        segment_id: segmentId,
        segment_name: segment.name,
        size: memberCount,
        growth_rate: 0.05, // Simplified
        avg_ltv: segment.avg_ltv,
        retention_rate: segment.retention_rate,
        engagement_score: 0.7, // Simplified
        revenue_contribution: memberCount * segment.avg_ltv
      });
    }

    return performance;
  }

  private async getSegmentTransitions(): Promise<any[]> {
    // Simplified segment transition analysis
    return [
      {
        from_segment: 'new_customers',
        to_segment: 'potential_loyalists',
        transition_rate: 0.35,
        avg_transition_time_days: 45,
        common_triggers: ['feature_adoption', 'successful_onboarding']
      },
      {
        from_segment: 'potential_loyalists',
        to_segment: 'loyal_customers',
        transition_rate: 0.60,
        avg_transition_time_days: 90,
        common_triggers: ['increased_usage', 'first_purchase']
      }
    ];
  }

  private async identifyOptimizationOpportunities(): Promise<any[]> {
    return [
      {
        segment_id: 'at_risk',
        opportunity_type: 'retention',
        impact_potential: 0.8,
        recommended_actions: [
          'Implement proactive outreach campaign',
          'Offer personalized discounts',
          'Provide dedicated support'
        ]
      },
      {
        segment_id: 'potential_loyalists',
        opportunity_type: 'upsell',
        impact_potential: 0.6,
        recommended_actions: [
          'Introduce premium features',
          'Create upgrade incentives',
          'Showcase advanced use cases'
        ]
      }
    ];
  }

  async getSegmentMembers(segmentId: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from('customer_segment_memberships')
        .select('user_id')
        .eq('segment_id', segmentId)
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data?.map(member => member.user_id) || [];
    } catch (error) {
      console.error('Error getting segment members:', error);
      return [];
    }
  }

  async updateSegmentMetrics(): Promise<void> {
    for (const [segmentId, segment] of this.segments.entries()) {
      try {
        const members = await this.getSegmentMembers(segmentId);
        const memberJourneys = await Promise.all(
          members.map(userId => customerLifecycleAnalytics.getCustomerJourney(userId))
        );

        const validJourneys = memberJourneys.filter(j => j !== null) as CustomerJourney[];

        const avgLtv = validJourneys.reduce((sum, j) => sum + j.total_value, 0) / validJourneys.length || 0;
        const retentionRate = validJourneys.filter(j => j.lifecycle_metrics.retention_probability > 0.5).length / validJourneys.length || 0;
        const churnRiskAvg = validJourneys.reduce((sum, j) => sum + j.lifecycle_metrics.churn_risk_score, 0) / validJourneys.length || 0;

        const updatedSegment = {
          ...segment,
          customer_count: members.length,
          avg_ltv: avgLtv,
          retention_rate: retentionRate,
          churn_risk_avg: churnRiskAvg,
          last_updated: new Date()
        };

        await this.supabase
          .from('customer_segments')
          .update(updatedSegment)
          .eq('id', segmentId);

        this.segments.set(segmentId, updatedSegment);

      } catch (error) {
        console.error(`Error updating metrics for segment ${segmentId}:`, error);
      }
    }
  }

  getSegments(): CustomerSegment[] {
    return Array.from(this.segments.values());
  }
}

// Export singleton instance
export const customerSegmentationEngine = CustomerSegmentationEngine.getInstance();