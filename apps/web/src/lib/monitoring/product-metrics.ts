import { supabase } from '../supabase';

export interface FeatureUsage {
  feature: string;
  users: number;
  adoption_rate: number;
  total_uses: number;
}

export interface JourneyMetrics {
  averageTimeToFirstWill: number;
  averageDocumentsPerUser: number;
  onboardingCompletionRate: number;
  featureDiscoveryRate: number;
}

export interface UserJourneyStep {
  step: string;
  users: number;
  completion_rate: number;
  average_time: number;
}

export class ProductMetrics {
  static async getFeatureUsageMetrics(): Promise<FeatureUsage[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('metrics')
      .select('feature, user_id, timestamp')
      .eq('type', 'feature_usage')
      .gte('timestamp', thirtyDaysAgo.toISOString());

    if (!data) return [];

    const usage = new Map<string, Set<string>>();
    const totalUses = new Map<string, number>();

    data.forEach(metric => {
      if (!usage.has(metric.feature)) {
        usage.set(metric.feature, new Set());
        totalUses.set(metric.feature, 0);
      }
      usage.get(metric.feature)!.add(metric.user_id);
      totalUses.set(metric.feature, totalUses.get(metric.feature)! + 1);
    });

    const totalUsers = await this.getTotalActiveUsers();

    return Array.from(usage.entries()).map(([feature, users]) => ({
      feature,
      users: users.size,
      adoption_rate: totalUsers > 0 ? (users.size / totalUsers) * 100 : 0,
      total_uses: totalUses.get(feature) || 0
    }));
  }

  static async getUserJourneyMetrics(): Promise<JourneyMetrics> {
    const [timeToFirstWill, docsPerUser, onboardingRate, discoveryRate] = await Promise.all([
      this.getAverageTimeToFirstAction('will_created'),
      this.getAverageDocumentsPerUser(),
      this.getOnboardingCompletionRate(),
      this.getFeatureDiscoveryRate()
    ]);

    return {
      averageTimeToFirstWill: timeToFirstWill,
      averageDocumentsPerUser: docsPerUser,
      onboardingCompletionRate: onboardingRate,
      featureDiscoveryRate: discoveryRate
    };
  }

  static async getOnboardingFunnelMetrics(): Promise<UserJourneyStep[]> {
    const steps = [
      'account_created',
      'profile_completed',
      'first_will_started',
      'first_will_completed',
      'first_document_shared'
    ];

    const funnelData: UserJourneyStep[] = [];
    let previousUsers = 0;

    for (const step of steps) {
      const users = await this.getUsersWhoCompletedStep(step);
      const completion_rate = previousUsers > 0 ? (users / previousUsers) * 100 : 100;
      const average_time = await this.getAverageTimeToCompleteStep(step);

      funnelData.push({
        step,
        users,
        completion_rate,
        average_time
      });

      previousUsers = users;
    }

    return funnelData;
  }

  static async getRetentionCohorts(): Promise<any[]> {
    // Get users by signup month
    const { data: users } = await supabase
      .from('profiles')
      .select('id, created_at')
      .order('created_at');

    if (!users) return [];

    // Group users by signup month
    const cohorts = new Map<string, string[]>();
    
    users.forEach(user => {
      const month = user.created_at.substring(0, 7); // YYYY-MM
      if (!cohorts.has(month)) {
        cohorts.set(month, []);
      }
      cohorts.get(month)!.push(user.id);
    });

    // Calculate retention for each cohort
    const retentionData = [];
    
    for (const [month, userIds] of cohorts.entries()) {
      const cohortSize = userIds.length;
      const retention = await this.calculateCohortRetention(userIds, month);
      
      retentionData.push({
        cohort: month,
        size: cohortSize,
        retention
      });
    }

    return retentionData;
  }

  // Helper methods
  private static async getTotalActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('metrics')
      .select('user_id')
      .eq('type', 'user_action')
      .gte('timestamp', thirtyDaysAgo.toISOString());

    if (!data) return 0;

    const uniqueUsers = new Set(data.map(metric => metric.user_id));
    return uniqueUsers.size;
  }

  private static async getAverageTimeToFirstAction(action: string): Promise<number> {
    const { data } = await supabase.rpc('get_time_to_first_action', {
      action_type: action
    });

    return data || 0;
  }

  private static async getAverageDocumentsPerUser(): Promise<number> {
    const { data: totalDocs } = await supabase
      .from('documents')
      .select('id', { count: 'exact' });

    const { data: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });

    if (!totalDocs || !totalUsers || totalUsers === 0) return 0;

    return totalDocs / totalUsers;
  }

  private static async getOnboardingCompletionRate(): Promise<number> {
    const { data: totalUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' });

    const { data: completedOnboarding } = await supabase
      .from('user_onboarding')
      .select('user_id', { count: 'exact' })
      .eq('completed', true);

    if (!totalUsers || totalUsers === 0) return 0;

    return ((completedOnboarding || 0) / totalUsers) * 100;
  }

  private static async getFeatureDiscoveryRate(): Promise<number> {
    const totalUsers = await this.getTotalActiveUsers();
    const usersWithFeatureUsage = await this.getUsersWithFeatureUsage();

    if (totalUsers === 0) return 0;

    return (usersWithFeatureUsage / totalUsers) * 100;
  }

  private static async getUsersWithFeatureUsage(): Promise<number> {
    const { data } = await supabase
      .from('metrics')
      .select('user_id')
      .eq('type', 'feature_usage');

    if (!data) return 0;

    const uniqueUsers = new Set(data.map(metric => metric.user_id));
    return uniqueUsers.size;
  }

  private static async getUsersWhoCompletedStep(step: string): Promise<number> {
    const { data } = await supabase
      .from('metrics')
      .select('user_id')
      .eq('action', step)
      .eq('type', 'user_action');

    if (!data) return 0;

    const uniqueUsers = new Set(data.map(metric => metric.user_id));
    return uniqueUsers.size;
  }

  private static async getAverageTimeToCompleteStep(step: string): Promise<number> {
    // This would require more complex queries to calculate time between steps
    // For now, return placeholder values
    const stepTimes: Record<string, number> = {
      'account_created': 0,
      'profile_completed': 300, // 5 minutes
      'first_will_started': 600, // 10 minutes
      'first_will_completed': 1800, // 30 minutes
      'first_document_shared': 3600 // 1 hour
    };

    return stepTimes[step] || 0;
  }

  private static async calculateCohortRetention(userIds: string[], cohortMonth: string): Promise<number[]> {
    const retention = [];
    const cohortStart = new Date(cohortMonth + '-01');

    // Calculate retention for each month after signup
    for (let month = 0; month < 12; month++) {
      const checkDate = new Date(cohortStart);
      checkDate.setMonth(checkDate.getMonth() + month + 1);
      
      const activeUsers = await this.getActiveUsersInMonth(userIds, checkDate);
      const retentionRate = (activeUsers / userIds.length) * 100;
      
      retention.push(retentionRate);
    }

    return retention;
  }

  private static async getActiveUsersInMonth(userIds: string[], month: Date): Promise<number> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const { data } = await supabase
      .from('metrics')
      .select('user_id')
      .in('user_id', userIds)
      .eq('type', 'user_action')
      .gte('timestamp', startOfMonth.toISOString())
      .lte('timestamp', endOfMonth.toISOString());

    if (!data) return 0;

    const uniqueUsers = new Set(data.map(metric => metric.user_id));
    return uniqueUsers.size;
  }
}