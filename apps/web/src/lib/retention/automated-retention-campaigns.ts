import { createClient } from '@/lib/supabase';
import { retentionPredictionEngine, type RetentionPrediction } from './retention-prediction-engine';
import { customerSegmentationEngine, type CustomerSegment } from './customer-segmentation';
import { customerLifecycleAnalytics, type CustomerJourney } from './customer-lifecycle-analytics';

export interface RetentionCampaign {
  id: string;
  name: string;
  description: string;
  campaign_type: 'email' | 'in_app' | 'push' | 'sms' | 'personalized_offer' | 'support_outreach';
  trigger_conditions: CampaignTrigger;
  target_segments: string[];
  content_template: CampaignContent;
  schedule_config: CampaignSchedule;
  personalization_rules: PersonalizationRule[];
  success_metrics: {
    primary_goal: 'retention' | 'engagement' | 'conversion' | 'reactivation';
    target_improvement: number; // percentage
    measurement_period_days: number;
  };
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: Date;
  last_modified: Date;
  performance_stats: CampaignPerformance;
}

export interface CampaignTrigger {
  trigger_type: 'risk_threshold' | 'segment_entry' | 'behavior_change' | 'time_based' | 'lifecycle_stage';
  conditions: {
    churn_risk_min?: number;
    churn_risk_max?: number;
    days_since_last_login?: number;
    engagement_decline_percentage?: number;
    lifecycle_stage?: string[];
    inactivity_days?: number;
    feature_abandonment?: boolean;
    billing_issues?: boolean;
  };
  exclusion_criteria?: {
    recently_contacted_days?: number;
    active_campaigns?: string[];
    customer_preferences?: string[];
  };
}

export interface CampaignContent {
  subject_template: string;
  content_template: string;
  cta_text: string;
  cta_url?: string;
  personalization_tags: string[];
  content_variants: {
    variant_id: string;
    weight: number;
    content: {
      subject: string;
      body: string;
      cta: string;
    };
  }[];
  dynamic_content_rules: {
    condition: string;
    content_override: Partial<CampaignContent>;
  }[];
}

export interface CampaignSchedule {
  schedule_type: 'immediate' | 'delayed' | 'recurring' | 'drip_sequence';
  delay_hours?: number;
  recurring_interval_days?: number;
  drip_sequence?: {
    step: number;
    delay_days: number;
    content_variant: string;
  }[];
  optimal_timing?: {
    use_user_timezone: boolean;
    preferred_hours: number[];
    avoid_weekends: boolean;
  };
}

export interface PersonalizationRule {
  rule_id: string;
  condition: string;
  personalization: {
    content_modifications: Record<string, string>;
    dynamic_values: Record<string, any>;
    conditional_sections: {
      show_if: string;
      content: string;
    }[];
  };
}

export interface CampaignExecution {
  id: string;
  campaign_id: string;
  user_id: string;
  execution_date: Date;
  content_variant: string;
  personalized_content: {
    subject: string;
    body: string;
    cta: string;
  };
  delivery_status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  engagement_metrics: {
    opened?: Date;
    clicked?: Date;
    converted?: Date;
    unsubscribed?: Date;
  };
  campaign_step?: number; // For drip campaigns
  next_step_date?: Date;
}

export interface CampaignPerformance {
  total_sent: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  unsubscribe_rate: number;
  retention_impact: number;
  revenue_impact: number;
  cost_per_retention: number;
  roi: number;
  last_updated: Date;
}

export interface CampaignOptimization {
  campaign_id: string;
  optimization_type: 'content' | 'timing' | 'targeting' | 'frequency';
  current_performance: number;
  suggested_changes: {
    change_type: string;
    description: string;
    expected_improvement: number;
    confidence_score: number;
  }[];
  ab_test_recommendations: {
    test_element: string;
    variants: string[];
    success_metric: string;
    minimum_sample_size: number;
  }[];
}

class AutomatedRetentionCampaignEngine {
  private static instance: AutomatedRetentionCampaignEngine;
  private supabase = createClient();
  private activeCampaigns: Map<string, RetentionCampaign> = new Map();
  private isProcessing = false;
  private isInitialized = false;

  static getInstance(): AutomatedRetentionCampaignEngine {
    if (!AutomatedRetentionCampaignEngine.instance) {
      AutomatedRetentionCampaignEngine.instance = new AutomatedRetentionCampaignEngine();
    }
    return AutomatedRetentionCampaignEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadActiveCampaigns();
    await this.setupDefaultCampaigns();
    this.startCampaignProcessor();
    this.isInitialized = true;
  }

  private async loadActiveCampaigns(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('retention_campaigns')
        .select('*')
        .eq('status', 'active');

      if (error) throw error;

      if (data) {
        data.forEach(campaign => {
          this.activeCampaigns.set(campaign.id, campaign);
        });
      }
    } catch (error) {
      console.error('Error loading active campaigns:', error);
    }
  }

  private async setupDefaultCampaigns(): Promise<void> {
    if (this.activeCampaigns.size > 0) return; // Campaigns already exist

    const defaultCampaigns: Partial<RetentionCampaign>[] = [
      {
        id: 'at_risk_immediate',
        name: 'At Risk - Immediate Intervention',
        description: 'Immediate outreach for customers at critical churn risk',
        campaign_type: 'email',
        trigger_conditions: {
          trigger_type: 'risk_threshold',
          conditions: {
            churn_risk_min: 0.7
          },
          exclusion_criteria: {
            recently_contacted_days: 7
          }
        },
        target_segments: ['at_risk', 'cannot_lose_them'],
        content_template: {
          subject_template: 'We want to help - {{user_name}}',
          content_template: `Hi {{user_name}},

We've noticed you haven't been as active recently, and we want to make sure you're getting the most value from {{product_name}}.

Our customer success team is here to help with any questions or challenges you might be facing.

{{personalized_recommendation}}

Would you like to schedule a quick call with our team?`,
          cta_text: 'Schedule a Call',
          cta_url: '/schedule-support',
          personalization_tags: ['user_name', 'product_name', 'personalized_recommendation'],
          content_variants: [
            {
              variant_id: 'supportive',
              weight: 0.5,
              content: {
                subject: 'We\'re here to help',
                body: 'Supportive tone content...',
                cta: 'Get Help Now'
              }
            },
            {
              variant_id: 'value_focused',
              weight: 0.5,
              content: {
                subject: 'Don\'t miss out on these features',
                body: 'Value-focused content...',
                cta: 'Explore Features'
              }
            }
          ],
          dynamic_content_rules: []
        },
        schedule_config: {
          schedule_type: 'immediate',
          optimal_timing: {
            use_user_timezone: true,
            preferred_hours: [9, 10, 11, 14, 15, 16],
            avoid_weekends: false
          }
        },
        personalization_rules: [
          {
            rule_id: 'high_value_customer',
            condition: 'total_spent > 1000',
            personalization: {
              content_modifications: {
                'subject_template': 'Important: Let\'s discuss your {{product_name}} experience'
              },
              dynamic_values: {},
              conditional_sections: [
                {
                  show_if: 'total_spent > 1000',
                  content: 'As one of our valued customers, we want to ensure you\'re completely satisfied.'
                }
              ]
            }
          }
        ],
        success_metrics: {
          primary_goal: 'retention',
          target_improvement: 0.25,
          measurement_period_days: 30
        },
        status: 'active'
      },
      {
        id: 'win_back_sequence',
        name: 'Win-Back Drip Sequence',
        description: 'Multi-step campaign to re-engage inactive users',
        campaign_type: 'email',
        trigger_conditions: {
          trigger_type: 'behavior_change',
          conditions: {
            days_since_last_login: 14,
            inactivity_days: 30
          }
        },
        target_segments: ['hibernating', 'at_risk'],
        content_template: {
          subject_template: 'We miss you, {{user_name}}!',
          content_template: 'Multi-step drip content...',
          cta_text: 'Come Back',
          personalization_tags: ['user_name'],
          content_variants: [],
          dynamic_content_rules: []
        },
        schedule_config: {
          schedule_type: 'drip_sequence',
          drip_sequence: [
            { step: 1, delay_days: 0, content_variant: 'gentle_reminder' },
            { step: 2, delay_days: 7, content_variant: 'value_showcase' },
            { step: 3, delay_days: 14, content_variant: 'special_offer' },
            { step: 4, delay_days: 21, content_variant: 'final_appeal' }
          ]
        },
        personalization_rules: [],
        success_metrics: {
          primary_goal: 'reactivation',
          target_improvement: 0.15,
          measurement_period_days: 45
        },
        status: 'active'
      },
      {
        id: 'feature_adoption_nudge',
        name: 'Feature Adoption Nudge',
        description: 'Encourage adoption of underutilized features',
        campaign_type: 'in_app',
        trigger_conditions: {
          trigger_type: 'behavior_change',
          conditions: {
            feature_abandonment: true
          }
        },
        target_segments: ['new_customers', 'potential_loyalists'],
        content_template: {
          subject_template: 'Unlock more value with {{feature_name}}',
          content_template: 'Feature adoption content...',
          cta_text: 'Try Feature',
          personalization_tags: ['feature_name'],
          content_variants: [],
          dynamic_content_rules: []
        },
        schedule_config: {
          schedule_type: 'delayed',
          delay_hours: 24
        },
        personalization_rules: [],
        success_metrics: {
          primary_goal: 'engagement',
          target_improvement: 0.30,
          measurement_period_days: 14
        },
        status: 'active'
      }
    ];

    for (const campaignData of defaultCampaigns) {
      const campaign: RetentionCampaign = {
        ...campaignData,
        created_at: new Date(),
        last_modified: new Date(),
        performance_stats: {
          total_sent: 0,
          delivery_rate: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
          unsubscribe_rate: 0,
          retention_impact: 0,
          revenue_impact: 0,
          cost_per_retention: 0,
          roi: 0,
          last_updated: new Date()
        }
      } as RetentionCampaign;

      try {
        const { data, error } = await this.supabase
          .from('retention_campaigns')
          .insert(campaign)
          .select()
          .single();

        if (error) throw error;
        this.activeCampaigns.set(campaign.id, data);
      } catch (error) {
        console.error('Error creating default campaign:', campaign.name, error);
      }
    }
  }

  private startCampaignProcessor(): void {
    // Process campaigns every 5 minutes
    setInterval(async () => {
      if (!this.isProcessing) {
        await this.processCampaignTriggers();
      }
    }, 5 * 60 * 1000);
  }

  async processCampaignTriggers(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      console.log('Processing campaign triggers...');

      for (const [campaignId, campaign] of this.activeCampaigns.entries()) {
        await this.evaluateCampaignTrigger(campaign);
      }

    } catch (error) {
      console.error('Error processing campaign triggers:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async evaluateCampaignTrigger(campaign: RetentionCampaign): Promise<void> {
    try {
      // Get eligible users based on trigger conditions
      const eligibleUsers = await this.getEligibleUsers(campaign);

      console.log(`Found ${eligibleUsers.length} eligible users for campaign: ${campaign.name}`);

      // Execute campaign for eligible users
      for (const userId of eligibleUsers) {
        await this.executeCampaign(campaign, userId);
      }

    } catch (error) {
      console.error(`Error evaluating campaign trigger for ${campaign.name}:`, error);
    }
  }

  private async getEligibleUsers(campaign: RetentionCampaign): Promise<string[]> {
    const eligibleUsers: string[] = [];

    try {
      // Get users from target segments
      let targetUsers: string[] = [];
      for (const segmentId of campaign.target_segments) {
        const segmentUsers = await customerSegmentationEngine.getSegmentMembers(segmentId);
        targetUsers = [...targetUsers, ...segmentUsers];
      }

      // Remove duplicates
      targetUsers = [...new Set(targetUsers)];

      // Evaluate trigger conditions for each user
      for (const userId of targetUsers) {
        const isEligible = await this.evaluateUserEligibility(userId, campaign);
        if (isEligible) {
          eligibleUsers.push(userId);
        }
      }

    } catch (error) {
      console.error('Error getting eligible users:', error);
    }

    return eligibleUsers;
  }

  private async evaluateUserEligibility(userId: string, campaign: RetentionCampaign): Promise<boolean> {
    try {
      // Check exclusion criteria first
      if (campaign.trigger_conditions.exclusion_criteria) {
        const isExcluded = await this.checkExclusionCriteria(userId, campaign.trigger_conditions.exclusion_criteria);
        if (isExcluded) return false;
      }

      // Evaluate trigger conditions
      const conditions = campaign.trigger_conditions.conditions;

      switch (campaign.trigger_conditions.trigger_type) {
        case 'risk_threshold':
          const prediction = await retentionPredictionEngine.predictRetention(userId);
          if (conditions.churn_risk_min && prediction.churn_probability < conditions.churn_risk_min) return false;
          if (conditions.churn_risk_max && prediction.churn_probability > conditions.churn_risk_max) return false;
          break;

        case 'behavior_change':
          const features = await retentionPredictionEngine.extractFeatures(userId);
          if (conditions.days_since_last_login && features.last_login_days_ago < conditions.days_since_last_login) return false;
          if (conditions.inactivity_days && features.last_login_days_ago < conditions.inactivity_days) return false;
          break;

        case 'lifecycle_stage':
          const journey = await customerLifecycleAnalytics.getCustomerJourney(userId);
          if (conditions.lifecycle_stage && journey && !conditions.lifecycle_stage.includes(journey.current_stage_id)) return false;
          break;
      }

      return true;

    } catch (error) {
      console.error('Error evaluating user eligibility:', userId, error);
      return false;
    }
  }

  private async checkExclusionCriteria(userId: string, exclusionCriteria: any): Promise<boolean> {
    try {
      // Check if user was recently contacted
      if (exclusionCriteria.recently_contacted_days) {
        const recentContactDate = new Date();
        recentContactDate.setDate(recentContactDate.getDate() - exclusionCriteria.recently_contacted_days);

        const { data } = await this.supabase
          .from('campaign_executions')
          .select('execution_date')
          .eq('user_id', userId)
          .gte('execution_date', recentContactDate.toISOString())
          .limit(1);

        if (data && data.length > 0) return true; // Excluded - recently contacted
      }

      // Add other exclusion criteria checks here...

      return false; // Not excluded

    } catch (error) {
      console.error('Error checking exclusion criteria:', error);
      return false;
    }
  }

  private async executeCampaign(campaign: RetentionCampaign, userId: string): Promise<void> {
    try {
      // Generate personalized content
      const personalizedContent = await this.generatePersonalizedContent(campaign, userId);

      // Select content variant
      const contentVariant = this.selectContentVariant(campaign);

      // Create campaign execution record
      const execution: Partial<CampaignExecution> = {
        id: crypto.randomUUID(),
        campaign_id: campaign.id,
        user_id: userId,
        execution_date: new Date(),
        content_variant: contentVariant,
        personalized_content: personalizedContent,
        delivery_status: 'pending',
        engagement_metrics: {}
      };

      // Schedule delivery based on campaign schedule
      const deliveryDate = this.calculateDeliveryDate(campaign);
      if (deliveryDate > new Date()) {
        // Schedule for later delivery
        await this.scheduleExecution(execution as CampaignExecution, deliveryDate);
      } else {
        // Deliver immediately
        await this.deliverCampaign(execution as CampaignExecution);
      }

      // Store execution record
      await this.supabase
        .from('campaign_executions')
        .insert(execution);

    } catch (error) {
      console.error('Error executing campaign:', error);
    }
  }

  private async generatePersonalizedContent(campaign: RetentionCampaign, userId: string): Promise<any> {
    try {
      // Get user data for personalization
      const journey = await customerLifecycleAnalytics.getCustomerJourney(userId);
      const features = await retentionPredictionEngine.extractFeatures(userId);

      // Start with base template
      let content = {
        subject: campaign.content_template.subject_template,
        body: campaign.content_template.content_template,
        cta: campaign.content_template.cta_text
      };

      // Apply personalization rules
      for (const rule of campaign.personalization_rules) {
        if (this.evaluateCondition(rule.condition, { journey, features })) {
          // Apply content modifications
          Object.entries(rule.personalization.content_modifications).forEach(([key, value]) => {
            content[key as keyof typeof content] = value;
          });
        }
      }

      // Replace personalization tags
      content = this.replacePlaceholders(content, userId, journey, features);

      return content;

    } catch (error) {
      console.error('Error generating personalized content:', error);
      return {
        subject: campaign.content_template.subject_template,
        body: campaign.content_template.content_template,
        cta: campaign.content_template.cta_text
      };
    }
  }

  private selectContentVariant(campaign: RetentionCampaign): string {
    if (campaign.content_template.content_variants.length === 0) {
      return 'default';
    }

    // Weighted random selection
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variant of campaign.content_template.content_variants) {
      cumulativeWeight += variant.weight;
      if (random <= cumulativeWeight) {
        return variant.variant_id;
      }
    }

    return campaign.content_template.content_variants[0].variant_id;
  }

  private calculateDeliveryDate(campaign: RetentionCampaign): Date {
    const now = new Date();

    switch (campaign.schedule_config.schedule_type) {
      case 'immediate':
        return now;

      case 'delayed':
        const delayed = new Date(now);
        delayed.setHours(delayed.getHours() + (campaign.schedule_config.delay_hours || 0));
        return delayed;

      default:
        return now;
    }
  }

  private async scheduleExecution(execution: CampaignExecution, deliveryDate: Date): Promise<void> {
    // In a real implementation, this would integrate with a job scheduler
    console.log(`Scheduling campaign execution for ${deliveryDate}`);

    // For now, we'll use a simple timeout (not recommended for production)
    const delay = deliveryDate.getTime() - new Date().getTime();
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Only schedule if within 24 hours
      setTimeout(async () => {
        await this.deliverCampaign(execution);
      }, delay);
    }
  }

  private async deliverCampaign(execution: CampaignExecution): Promise<void> {
    try {
      // In a real implementation, this would integrate with email/SMS/push notification services
      console.log(`Delivering campaign to user ${execution.user_id}:`, {
        subject: execution.personalized_content.subject,
        body: execution.personalized_content.body.substring(0, 100) + '...'
      });

      // Update delivery status
      await this.supabase
        .from('campaign_executions')
        .update({ delivery_status: 'sent' })
        .eq('id', execution.id);

      // Update campaign performance stats
      await this.updateCampaignStats(execution.campaign_id, 'sent');

    } catch (error) {
      console.error('Error delivering campaign:', error);

      // Update status to failed
      await this.supabase
        .from('campaign_executions')
        .update({ delivery_status: 'failed' })
        .eq('id', execution.id);
    }
  }

  private evaluateCondition(condition: string, data: any): boolean {
    // Simple condition evaluation - in production, use a proper expression evaluator
    try {
      // Example conditions: "total_spent > 1000", "engagement_score < 0.5"
      return eval(condition.replace(/\w+/g, (match) => {
        const value = this.getNestedValue(data, match);
        return typeof value === 'number' ? value.toString() : `"${value}"`;
      }));
    } catch {
      return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private replacePlaceholders(content: any, userId: string, journey: any, features: any): any {
    const placeholders = {
      user_name: 'Valued Customer', // Would get from user profile
      product_name: 'LegacyGuard',
      personalized_recommendation: this.generateRecommendation(features)
    };

    let processedContent = { ...content };

    Object.entries(placeholders).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      Object.keys(processedContent).forEach(contentKey => {
        if (typeof processedContent[contentKey] === 'string') {
          processedContent[contentKey] = processedContent[contentKey].replace(new RegExp(placeholder, 'g'), value);
        }
      });
    });

    return processedContent;
  }

  private generateRecommendation(features: any): string {
    if (features.feature_adoption_rate < 0.3) {
      return 'We\'d love to show you some features that could save you time and effort.';
    }
    if (features.last_login_days_ago > 14) {
      return 'There have been some great updates since your last visit that we think you\'ll find valuable.';
    }
    return 'Our team has some personalized tips to help you get even more value from your account.';
  }

  private async updateCampaignStats(campaignId: string, eventType: string): Promise<void> {
    try {
      const campaign = this.activeCampaigns.get(campaignId);
      if (!campaign) return;

      const stats = { ...campaign.performance_stats };

      switch (eventType) {
        case 'sent':
          stats.total_sent++;
          break;
        case 'opened':
          // Calculate open rate
          break;
        case 'clicked':
          // Calculate click rate
          break;
        case 'converted':
          // Calculate conversion rate
          break;
      }

      stats.last_updated = new Date();

      await this.supabase
        .from('retention_campaigns')
        .update({ performance_stats: stats })
        .eq('id', campaignId);

      // Update local cache
      campaign.performance_stats = stats;

    } catch (error) {
      console.error('Error updating campaign stats:', error);
    }
  }

  async trackCampaignEngagement(executionId: string, eventType: 'opened' | 'clicked' | 'converted' | 'unsubscribed'): Promise<void> {
    try {
      const updateData: any = {
        [`engagement_metrics.${eventType}`]: new Date()
      };

      await this.supabase
        .from('campaign_executions')
        .update(updateData)
        .eq('id', executionId);

      // Get campaign ID and update stats
      const { data } = await this.supabase
        .from('campaign_executions')
        .select('campaign_id')
        .eq('id', executionId)
        .single();

      if (data) {
        await this.updateCampaignStats(data.campaign_id, eventType);
      }

    } catch (error) {
      console.error('Error tracking campaign engagement:', error);
    }
  }

  async createCampaign(campaignData: Partial<RetentionCampaign>): Promise<string> {
    try {
      const campaign: RetentionCampaign = {
        id: crypto.randomUUID(),
        created_at: new Date(),
        last_modified: new Date(),
        performance_stats: {
          total_sent: 0,
          delivery_rate: 0,
          open_rate: 0,
          click_rate: 0,
          conversion_rate: 0,
          unsubscribe_rate: 0,
          retention_impact: 0,
          revenue_impact: 0,
          cost_per_retention: 0,
          roi: 0,
          last_updated: new Date()
        },
        ...campaignData
      } as RetentionCampaign;

      const { data, error } = await this.supabase
        .from('retention_campaigns')
        .insert(campaign)
        .select()
        .single();

      if (error) throw error;

      if (campaign.status === 'active') {
        this.activeCampaigns.set(campaign.id, data);
      }

      return campaign.id;

    } catch (error) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  async getCampaignPerformance(campaignId: string): Promise<CampaignPerformance | null> {
    try {
      const { data, error } = await this.supabase
        .from('retention_campaigns')
        .select('performance_stats')
        .eq('id', campaignId)
        .single();

      if (error) throw error;
      return data?.performance_stats || null;

    } catch (error) {
      console.error('Error getting campaign performance:', error);
      return null;
    }
  }

  async optimizeCampaign(campaignId: string): Promise<CampaignOptimization> {
    // Simplified optimization recommendations
    return {
      campaign_id: campaignId,
      optimization_type: 'content',
      current_performance: 0.15,
      suggested_changes: [
        {
          change_type: 'subject_line',
          description: 'Test more personalized subject lines',
          expected_improvement: 0.08,
          confidence_score: 0.75
        },
        {
          change_type: 'timing',
          description: 'Send campaigns during optimal engagement hours',
          expected_improvement: 0.05,
          confidence_score: 0.85
        }
      ],
      ab_test_recommendations: [
        {
          test_element: 'cta_button',
          variants: ['Get Help Now', 'Schedule Call', 'Contact Support'],
          success_metric: 'click_rate',
          minimum_sample_size: 200
        }
      ]
    };
  }

  getCampaigns(): RetentionCampaign[] {
    return Array.from(this.activeCampaigns.values());
  }
}

// Export singleton instance
export const automatedRetentionCampaigns = AutomatedRetentionCampaignEngine.getInstance();