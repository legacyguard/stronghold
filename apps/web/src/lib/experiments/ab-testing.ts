import { supabase } from '../supabase';
import { FeatureFlagManager } from '../feature-flags/manager';

export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  variants: ABVariant[];
  traffic_split: Record<string, number>; // variant -> percentage
  target_metric: string;
  secondary_metrics: string[];
  start_date: string;
  end_date?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'cancelled';
  sample_size: number;
  confidence_level: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ABVariant {
  id: string;
  name: string;
  description: string;
  config: Record<string, any>;
  is_control: boolean;
}

export interface ABTestResult {
  experiment_id: string;
  variant_id: string;
  user_id: string;
  event_type: string;
  event_value?: number;
  timestamp: string;
  session_id?: string;
  metadata?: Record<string, any>;
}

export interface ExperimentStats {
  variant_id: string;
  variant_name: string;
  participants: number;
  conversions: number;
  conversion_rate: number;
  average_value: number;
  confidence_interval: [number, number];
  statistical_significance: boolean;
  p_value: number;
}

export class ABTesting {
  private static userAssignments = new Map<string, Map<string, string>>();

  static async getVariant(experimentName: string, userId: string): Promise<string> {
    try {
      // Check if user already assigned to this experiment
      const existingAssignment = await this.getUserAssignment(experimentName, userId);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Get experiment configuration
      const experiment = await this.getExperiment(experimentName);
      if (!experiment || experiment.status !== 'running') {
        return 'control'; // Default to control if experiment not found or not running
      }

      // Check if experiment has ended
      if (experiment.end_date && new Date(experiment.end_date) < new Date()) {
        return 'control';
      }

      // Assign user to variant based on traffic split
      const assignedVariant = this.assignUserToVariant(userId, experiment);
      
      // Save assignment
      await this.saveUserAssignment(experiment.id, userId, assignedVariant);
      
      return assignedVariant;
    } catch (error) {
      console.error(`Error getting AB test variant for ${experimentName}:`, error);
      return 'control';
    }
  }

  static async getExperiment(name: string): Promise<ABExperiment | null> {
    try {
      const { data, error } = await supabase
        .from('ab_experiments')
        .select(`
          *,
          variants:ab_variants(*)
        `)
        .eq('name', name)
        .single();

      if (error) {
        console.error('Error fetching AB experiment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching AB experiment:', error);
      return null;
    }
  }

  static async createExperiment(experiment: Omit<ABExperiment, 'id' | 'created_at' | 'updated_at'>): Promise<ABExperiment | null> {
    try {
      // Validate traffic split adds up to 100%
      const totalTraffic = Object.values(experiment.traffic_split).reduce((sum, pct) => sum + pct, 0);
      if (Math.abs(totalTraffic - 100) > 0.01) {
        throw new Error('Traffic split must add up to 100%');
      }

      const { data, error } = await supabase
        .from('ab_experiments')
        .insert({
          ...experiment,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating AB experiment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating AB experiment:', error);
      return null;
    }
  }

  static async startExperiment(experimentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ab_experiments')
        .update({
          status: 'running',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', experimentId);

      if (error) {
        console.error('Error starting AB experiment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error starting AB experiment:', error);
      return false;
    }
  }

  static async stopExperiment(experimentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ab_experiments')
        .update({
          status: 'completed',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', experimentId);

      if (error) {
        console.error('Error stopping AB experiment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error stopping AB experiment:', error);
      return false;
    }
  }

  static async trackConversion(
    experimentName: string,
    userId: string,
    eventType: string,
    eventValue?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Get user's variant assignment
      const variant = await this.getVariant(experimentName, userId);
      
      // Get experiment and variant IDs
      const experiment = await this.getExperiment(experimentName);
      if (!experiment) return;

      const variantData = experiment.variants.find(v => v.name === variant);
      if (!variantData) return;

      // Save conversion event
      await supabase
        .from('ab_test_results')
        .insert({
          experiment_id: experiment.id,
          variant_id: variantData.id,
          user_id: userId,
          event_type: eventType,
          event_value: eventValue,
          timestamp: new Date().toISOString(),
          metadata
        });

    } catch (error) {
      console.error('Error tracking AB test conversion:', error);
    }
  }

  static async getExperimentResults(experimentId: string): Promise<{
    stats: ExperimentStats[];
    winner?: string;
    recommendation: string;
  }> {
    try {
      // Get experiment details
      const experiment = await this.getExperimentById(experimentId);
      if (!experiment) {
        throw new Error('Experiment not found');
      }

      // Get raw results data
      const { data: results, error } = await supabase
        .from('ab_test_results')
        .select(`
          variant_id,
          user_id,
          event_type,
          event_value,
          ab_variants(name)
        `)
        .eq('experiment_id', experimentId);

      if (error) {
        console.error('Error fetching AB test results:', error);
        return { stats: [], recommendation: 'Insufficient data' };
      }

      // Calculate statistics for each variant
      const stats = await this.calculateVariantStats(experiment, results || []);
      
      // Determine winner and recommendation
      const analysis = this.analyzeResults(stats);

      return {
        stats,
        winner: analysis.winner,
        recommendation: analysis.recommendation
      };

    } catch (error) {
      console.error('Error getting AB test results:', error);
      return { stats: [], recommendation: 'Error analyzing results' };
    }
  }

  // Private helper methods
  private static async getUserAssignment(experimentName: string, userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ab_user_assignments')
        .select('variant_name')
        .eq('experiment_name', experimentName)
        .eq('user_id', userId)
        .single();

      if (error) {
        return null;
      }

      return data?.variant_name || null;
    } catch (error) {
      return null;
    }
  }

  private static async saveUserAssignment(
    experimentId: string,
    userId: string,
    variantName: string
  ): Promise<void> {
    try {
      await supabase
        .from('ab_user_assignments')
        .insert({
          experiment_id: experimentId,
          user_id: userId,
          variant_name: variantName,
          assigned_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error saving AB test assignment:', error);
    }
  }

  private static assignUserToVariant(userId: string, experiment: ABExperiment): string {
    // Use consistent hashing to ensure user always gets same variant
    const hash = this.hashUser(userId + experiment.name);
    const hashPercent = hash % 100;

    let cumulativePercent = 0;
    for (const [variantName, percentage] of Object.entries(experiment.traffic_split)) {
      cumulativePercent += percentage;
      if (hashPercent < cumulativePercent) {
        return variantName;
      }
    }

    // Fallback to control (should not happen if traffic split is valid)
    return experiment.variants.find(v => v.is_control)?.name || 'control';
  }

  private static hashUser(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private static async getExperimentById(id: string): Promise<ABExperiment | null> {
    try {
      const { data, error } = await supabase
        .from('ab_experiments')
        .select(`
          *,
          variants:ab_variants(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching AB experiment by ID:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching AB experiment by ID:', error);
      return null;
    }
  }

  private static async calculateVariantStats(
    experiment: ABExperiment,
    results: any[]
  ): Promise<ExperimentStats[]> {
    const stats: ExperimentStats[] = [];

    for (const variant of experiment.variants) {
      const variantResults = results.filter(r => r.variant_id === variant.id);
      const participants = new Set(variantResults.map(r => r.user_id)).size;
      
      // Count conversions (target metric events)
      const conversions = variantResults.filter(
        r => r.event_type === experiment.target_metric
      ).length;
      
      const conversionRate = participants > 0 ? conversions / participants : 0;
      
      // Calculate average value for value-based metrics
      const valueEvents = variantResults
        .filter(r => r.event_type === experiment.target_metric && r.event_value)
        .map(r => r.event_value);
      
      const averageValue = valueEvents.length > 0
        ? valueEvents.reduce((sum, val) => sum + val, 0) / valueEvents.length
        : 0;

      // Calculate confidence interval (simplified)
      const confidenceInterval = this.calculateConfidenceInterval(
        conversionRate,
        participants,
        experiment.confidence_level
      );

      // Calculate statistical significance vs control
      const controlVariant = experiment.variants.find(v => v.is_control);
      const controlResults = controlVariant
        ? results.filter(r => r.variant_id === controlVariant.id)
        : [];
      
      const pValue = this.calculatePValue(
        variantResults,
        controlResults,
        experiment.target_metric
      );

      stats.push({
        variant_id: variant.id,
        variant_name: variant.name,
        participants,
        conversions,
        conversion_rate: conversionRate,
        average_value: averageValue,
        confidence_interval: confidenceInterval,
        statistical_significance: pValue < (1 - experiment.confidence_level / 100),
        p_value: pValue
      });
    }

    return stats;
  }

  private static calculateConfidenceInterval(
    rate: number,
    sampleSize: number,
    confidenceLevel: number
  ): [number, number] {
    if (sampleSize === 0) return [0, 0];

    // Simplified confidence interval calculation
    const z = confidenceLevel === 95 ? 1.96 : confidenceLevel === 99 ? 2.58 : 1.96;
    const standardError = Math.sqrt((rate * (1 - rate)) / sampleSize);
    const margin = z * standardError;

    return [
      Math.max(0, rate - margin),
      Math.min(1, rate + margin)
    ];
  }

  private static calculatePValue(
    variantResults: any[],
    controlResults: any[],
    targetMetric: string
  ): number {
    // Simplified p-value calculation (should use proper statistical test)
    const variantConversions = variantResults.filter(r => r.event_type === targetMetric).length;
    const variantParticipants = new Set(variantResults.map(r => r.user_id)).size;
    
    const controlConversions = controlResults.filter(r => r.event_type === targetMetric).length;
    const controlParticipants = new Set(controlResults.map(r => r.user_id)).size;

    if (variantParticipants === 0 || controlParticipants === 0) {
      return 1; // No significance
    }

    const variantRate = variantConversions / variantParticipants;
    const controlRate = controlConversions / controlParticipants;
    
    // Simplified two-proportion z-test
    const pooledRate = (variantConversions + controlConversions) / (variantParticipants + controlParticipants);
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / variantParticipants + 1 / controlParticipants)
    );
    
    if (standardError === 0) return 1;
    
    const zScore = Math.abs(variantRate - controlRate) / standardError;
    
    // Convert z-score to p-value (simplified)
    return Math.max(0.001, 2 * (1 - this.normalCDF(zScore)));
  }

  private static normalCDF(x: number): number {
    // Simplified normal CDF approximation
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    // Simplified error function approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private static analyzeResults(stats: ExperimentStats[]): {
    winner?: string;
    recommendation: string;
  } {
    const controlStat = stats.find(s => s.variant_name === 'control');
    if (!controlStat) {
      return { recommendation: 'No control variant found' };
    }

    // Find variants with statistical significance
    const significantVariants = stats.filter(s => 
      s.statistical_significance && 
      s.conversion_rate > controlStat.conversion_rate
    );

    if (significantVariants.length === 0) {
      return {
        recommendation: 'No variants show statistically significant improvement over control'
      };
    }

    // Find best performing variant
    const winner = significantVariants.reduce((best, current) => 
      current.conversion_rate > best.conversion_rate ? current : best
    );

    const improvement = ((winner.conversion_rate - controlStat.conversion_rate) / controlStat.conversion_rate) * 100;

    return {
      winner: winner.variant_name,
      recommendation: `${winner.variant_name} shows ${improvement.toFixed(1)}% improvement with ${winner.conversion_rate.toFixed(2)}% conversion rate (p=${winner.p_value.toFixed(3)})`
    };
  }

  // Public convenience methods
  static async getRunningExperiments(): Promise<ABExperiment[]> {
    try {
      const { data, error } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('status', 'running');

      if (error) {
        console.error('Error fetching running experiments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching running experiments:', error);
      return [];
    }
  }

  static async isUserInExperiment(experimentName: string, userId: string): Promise<boolean> {
    const assignment = await this.getUserAssignment(experimentName, userId);
    return assignment !== null;
  }
}

// Specific experiment classes for common use cases
export class WillGenerationExperiment {
  static async getVariant(userId: string): Promise<'wizard' | 'form'> {
    const variant = await ABTesting.getVariant('will_generation_ui', userId);
    return variant === 'form' ? 'form' : 'wizard';
  }

  static async trackConversion(userId: string, variant: 'wizard' | 'form', completed: boolean): Promise<void> {
    await ABTesting.trackConversion(
      'will_generation_ui',
      userId,
      completed ? 'will_completed' : 'will_abandoned',
      completed ? 1 : 0,
      { variant, completed }
    );
  }
}

export class OnboardingExperiment {
  static async getVariant(userId: string): Promise<'short' | 'detailed'> {
    const variant = await ABTesting.getVariant('onboarding_flow', userId);
    return variant === 'detailed' ? 'detailed' : 'short';
  }

  static async trackStep(userId: string, step: number, completed: boolean): Promise<void> {
    await ABTesting.trackConversion(
      'onboarding_flow',
      userId,
      `onboarding_step_${step}_${completed ? 'completed' : 'abandoned'}`,
      step,
      { step, completed }
    );
  }

  static async trackCompletion(userId: string, timeToComplete: number): Promise<void> {
    await ABTesting.trackConversion(
      'onboarding_flow',
      userId,
      'onboarding_completed',
      timeToComplete,
      { completion_time: timeToComplete }
    );
  }
}

/**
 * Alias for backward compatibility
 */
export const ExperimentManager = ABTesting;