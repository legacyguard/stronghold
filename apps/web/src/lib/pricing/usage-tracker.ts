import { supabase } from '../supabase';
import { PRICING_PLANS, type PricingPlan } from './plans';

export interface UsageData {
  user_id: string;
  plan_id: string;
  usage: {
    wills: number;
    documents: number;
    emergency_contacts: number;
    storage_bytes: number;
    family_members: number;
    ai_queries: number;
  };
  last_updated: string;
}

export interface UsageLimit {
  limit: number; // -1 = unlimited
  used: number;
  remaining: number;
  percentage: number;
  exceeded: boolean;
}

export interface UsageSummary {
  plan: PricingPlan;
  limits: {
    wills: UsageLimit;
    documents: UsageLimit;
    emergency_contacts: UsageLimit;
    storage_gb: UsageLimit;
    family_members: UsageLimit;
    ai_queries: UsageLimit;
  };
  overall_usage_percentage: number;
  needs_upgrade: boolean;
  upgrade_recommendations: string[];
}

export class UsageTracker {
  static async getCurrentUsage(userId: string): Promise<UsageData | null> {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user usage:', error);
        return null;
      }

      if (!data) {
        // Create initial usage record
        return await this.initializeUsage(userId);
      }

      return data;
    } catch (error) {
      console.error('Error fetching user usage:', error);
      return null;
    }
  }

  static async getUsageSummary(userId: string): Promise<UsageSummary | null> {
    try {
      const usage = await this.getCurrentUsage(userId);
      if (!usage) return null;

      const plan = PRICING_PLANS[usage.plan_id];
      if (!plan) return null;

      const limits = {
        wills: this.calculateUsageLimit(plan.limits.wills, usage.usage.wills),
        documents: this.calculateUsageLimit(plan.limits.documents, usage.usage.documents),
        emergency_contacts: this.calculateUsageLimit(plan.limits.emergency_contacts, usage.usage.emergency_contacts),
        storage_gb: this.calculateUsageLimit(plan.limits.storage_gb, Math.round((usage.usage.storage_bytes / (1024 * 1024 * 1024)) * 100) / 100),
        family_members: this.calculateUsageLimit(plan.limits.family_members || 0, usage.usage.family_members),
        ai_queries: this.calculateUsageLimit(plan.limits.ai_queries || 0, usage.usage.ai_queries)
      };

      // Calculate overall usage percentage
      const limitValues = Object.values(limits);
      const finitePercentages = limitValues
        .filter(limit => limit.limit !== -1)
        .map(limit => limit.percentage);
      
      const overallUsagePercentage = finitePercentages.length > 0
        ? finitePercentages.reduce((sum, pct) => sum + pct, 0) / finitePercentages.length
        : 0;

      const exceededLimits = Object.values(limits).filter(limit => limit.exceeded);
      const needsUpgrade = exceededLimits.length > 0 || overallUsagePercentage > 80;

      const upgradeRecommendations = this.generateUpgradeRecommendations(limits, plan);

      return {
        plan,
        limits,
        overall_usage_percentage: overallUsagePercentage,
        needs_upgrade: needsUpgrade,
        upgrade_recommendations: upgradeRecommendations
      };
    } catch (error) {
      console.error('Error getting usage summary:', error);
      return null;
    }
  }

  static async checkLimit(userId: string, resource: keyof UsageData['usage']): Promise<boolean> {
    try {
      const usage = await this.getCurrentUsage(userId);
      if (!usage) return false;

      const plan = PRICING_PLANS[usage.plan_id];
      if (!plan) return false;

      const currentUsage = usage.usage[resource];
      const limit = this.getPlanLimit(plan, resource);

      if (limit === -1) return true; // unlimited
      return currentUsage < limit;
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return false;
    }
  }

  static async incrementUsage(
    userId: string,
    resource: keyof UsageData['usage'],
    amount: number = 1
  ): Promise<boolean> {
    try {
      // Check if user can increment (has remaining limit)
      const canIncrement = await this.checkLimit(userId, resource);
      if (!canIncrement) {
        return false;
      }

      // Update usage
      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_resource: resource,
        p_amount: amount
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  }

  static async decrementUsage(
    userId: string,
    resource: keyof UsageData['usage'],
    amount: number = 1
  ): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('decrement_usage', {
        p_user_id: userId,
        p_resource: resource,
        p_amount: amount
      });

      if (error) {
        console.error('Error decrementing usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error decrementing usage:', error);
      return false;
    }
  }

  static async updatePlan(userId: string, newPlanId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_usage')
        .update({
          plan_id: newPlanId,
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating user plan:', error);
        return false;
      }

      // Log plan change
      await supabase.from('plan_changes').insert({
        user_id: userId,
        new_plan_id: newPlanId,
        changed_at: new Date().toISOString(),
        reason: 'user_upgrade'
      });

      return true;
    } catch (error) {
      console.error('Error updating user plan:', error);
      return false;
    }
  }

  static async resetUsage(userId: string, resource?: keyof UsageData['usage']): Promise<boolean> {
    try {
      if (resource) {
        // Reset specific resource
        const { error } = await supabase.rpc('reset_usage', {
          p_user_id: userId,
          p_resource: resource
        });

        if (error) {
          console.error('Error resetting usage:', error);
          return false;
        }
      } else {
        // Reset all usage
        const { error } = await supabase
          .from('user_usage')
          .update({
            usage: {
              wills: 0,
              documents: 0,
              emergency_contacts: 0,
              storage_bytes: 0,
              family_members: 0,
              ai_queries: 0
            },
            last_updated: new Date().toISOString()
          })
          .eq('user_id', userId);

        if (error) {
          console.error('Error resetting all usage:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error resetting usage:', error);
      return false;
    }
  }

  static async getUsageHistory(userId: string, days: number = 30): Promise<{
    daily: Array<{ date: string; usage: Partial<UsageData['usage']> }>;
    trends: {
      wills: number;
      documents: number;
      ai_queries: number;
    };
  }> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('usage_history')
        .select('*')
        .eq('user_id', userId)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at');

      if (error) {
        console.error('Error fetching usage history:', error);
        return { daily: [], trends: { wills: 0, documents: 0, ai_queries: 0 } };
      }

      const daily = data || [];
      
      // Calculate trends
      const trends = {
        wills: this.calculateTrend(daily, 'wills'),
        documents: this.calculateTrend(daily, 'documents'),
        ai_queries: this.calculateTrend(daily, 'ai_queries')
      };

      return { daily, trends };
    } catch (error) {
      console.error('Error fetching usage history:', error);
      return { daily: [], trends: { wills: 0, documents: 0, ai_queries: 0 } };
    }
  }

  // Helper methods
  private static async initializeUsage(userId: string): Promise<UsageData> {
    const initialUsage: UsageData = {
      user_id: userId,
      plan_id: 'free', // Default to free plan
      usage: {
        wills: 0,
        documents: 0,
        emergency_contacts: 0,
        storage_bytes: 0,
        family_members: 0,
        ai_queries: 0
      },
      last_updated: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_usage')
      .insert(initialUsage)
      .select()
      .single();

    if (error) {
      console.error('Error initializing usage:', error);
      throw error;
    }

    return data;
  }

  private static calculateUsageLimit(limit: number, used: number): UsageLimit {
    if (limit === -1) {
      return {
        limit: -1,
        used,
        remaining: -1,
        percentage: 0,
        exceeded: false
      };
    }

    const remaining = Math.max(0, limit - used);
    const percentage = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    const exceeded = used > limit;

    return {
      limit,
      used,
      remaining,
      percentage,
      exceeded
    };
  }

  private static getPlanLimit(plan: PricingPlan, resource: keyof UsageData['usage']): number {
    switch (resource) {
      case 'wills':
        return plan.limits.wills;
      case 'documents':
        return plan.limits.documents;
      case 'emergency_contacts':
        return plan.limits.emergency_contacts;
      case 'storage_bytes':
        return plan.limits.storage_gb * 1024 * 1024 * 1024; // Convert GB to bytes
      case 'family_members':
        return plan.limits.family_members || 0;
      case 'ai_queries':
        return plan.limits.ai_queries || 0;
      default:
        return 0;
    }
  }

  private static generateUpgradeRecommendations(
    limits: UsageSummary['limits'],
    currentPlan: PricingPlan
  ): string[] {
    const recommendations: string[] = [];
    
    const exceededLimits = Object.entries(limits)
      .filter(([_, limit]) => limit.exceeded)
      .map(([resource, _]) => resource);

    const nearLimits = Object.entries(limits)
      .filter(([_, limit]) => !limit.exceeded && limit.percentage > 80)
      .map(([resource, _]) => resource);

    if (exceededLimits.length > 0) {
      if (currentPlan.id === 'free') {
        recommendations.push('Upgrade na Premium plán pre neobmedzené možnosti');
      } else {
        recommendations.push('Zvážte Enterprise plán pre rozšírené limity');
      }
    }

    if (nearLimits.includes('storage_gb')) {
      recommendations.push('Blížite sa k limitu úložiska - archivujte staré dokumenty alebo upgradnite plán');
    }

    if (nearLimits.includes('ai_queries')) {
      recommendations.push('Využívate veľa AI dotazov - Premium plán ponúka neobmedzené dotazy');
    }

    if (nearLimits.includes('family_members')) {
      recommendations.push('Pridali ste veľa rodinných členov - zvážte vyšší plán');
    }

    if (recommendations.length === 0 && currentPlan.id === 'free') {
      recommendations.push('Využívate základné funkcie dobre. Premium plán ponúka pokročilé možnosti.');
    }

    return recommendations;
  }

  private static calculateTrend(data: any[], resource: string): number {
    if (data.length < 2) return 0;

    const values = data.map(d => d.usage?.[resource] || 0);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    return secondAvg - firstAvg;
  }

  // Bulk operations
  static async syncUsageFromDatabase(userId: string): Promise<boolean> {
    try {
      // Count actual usage from database
      const [willsCount, documentsCount, contactsCount, storageUsed, familyCount] = await Promise.all([
        this.countUserWills(userId),
        this.countUserDocuments(userId),
        this.countEmergencyContacts(userId),
        this.calculateStorageUsed(userId),
        this.countFamilyMembers(userId)
      ]);

      // Update usage record
      const { error } = await supabase
        .from('user_usage')
        .update({
          usage: {
            wills: willsCount,
            documents: documentsCount,
            emergency_contacts: contactsCount,
            storage_bytes: storageUsed,
            family_members: familyCount,
            ai_queries: 0 // This would need to be tracked separately
          },
          last_updated: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Error syncing usage:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error syncing usage from database:', error);
      return false;
    }
  }

  private static async countUserWills(userId: string): Promise<number> {
    const { count } = await supabase
      .from('wills')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    return count || 0;
  }

  private static async countUserDocuments(userId: string): Promise<number> {
    const { count } = await supabase
      .from('documents')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    return count || 0;
  }

  private static async countEmergencyContacts(userId: string): Promise<number> {
    const { count } = await supabase
      .from('emergency_contacts')
      .select('id', { count: 'exact' })
      .eq('user_id', userId);
    return count || 0;
  }

  private static async calculateStorageUsed(userId: string): Promise<number> {
    // This would calculate actual file storage used
    // For now, return 0 as placeholder
    return 0;
  }

  private static async countFamilyMembers(userId: string): Promise<number> {
    const { count } = await supabase
      .from('family_members')
      .select('id', { count: 'exact' })
      .eq('family_owner_id', userId);
    return count || 0;
  }
}