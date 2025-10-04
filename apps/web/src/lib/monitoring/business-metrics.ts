import { supabase } from '../supabase';

export interface BusinessMetricsData {
  mrr: number;
  conversionRate: number;
  churnRate: number;
  ltvToCacRatio: number;
  totalActiveUsers: number;
  premiumUsers: number;
}

export interface UserMetrics {
  totalSignups: number;
  activeUsers: number;
  premiumConversions: number;
  churnedUsers: number;
}

export class BusinessMetrics {
  static async calculateMRR(): Promise<number> {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('status', 'active');

    if (!data) return 0;

    const PRICING_PLANS = {
      free: { price: 0 },
      premium: { price: 19 }
    } as const;

    return data.reduce((mrr, sub) => {
      return mrr + (PRICING_PLANS[sub.plan as keyof typeof PRICING_PLANS]?.price || 0);
    }, 0);
  }

  static async getConversionRate(days: number = 30, offsetDays: number = 0): Promise<number> {
    const endDate = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const totalSignups = await this.getTotalSignups(startDate, endDate);
    const paidConversions = await this.getPaidConversions(startDate, endDate);

    return totalSignups > 0 ? (paidConversions / totalSignups) * 100 : 0;
  }

  static async getChurnRate(days: number = 30): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const startingSubscribers = await this.getActiveSubscribersAtDate(startDate);
    const currentSubscribers = await this.getActiveSubscribersAtDate(endDate);
    
    // Calculate churned users (those who were active but cancelled)
    const { data: churnedData } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'cancelled')
      .gte('cancelled_at', startDate.toISOString())
      .lte('cancelled_at', endDate.toISOString());

    const churned = churnedData?.length || 0;

    return startingSubscribers > 0 ? (churned / startingSubscribers) * 100 : 0;
  }

  static async getLTVtoCACRatio(): Promise<number> {
    const avgLifetime = await this.getAverageLifetime();
    const avgRevenuePerUser = await this.getAverageRevenuePerUser();
    const ltv = avgLifetime * avgRevenuePerUser;

    const cac = await this.getCustomerAcquisitionCost();

    return cac > 0 ? ltv / cac : 0;
  }

  static async getTotalActiveUsers(): Promise<number> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('user_sessions')
      .select('user_id')
      .gte('last_seen', thirtyDaysAgo.toISOString());

    if (!data) return 0;

    // Count unique users
    const uniqueUsers = new Set(data.map(session => session.user_id));
    return uniqueUsers.size;
  }

  static async getPremiumUsers(): Promise<number> {
    const { data } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'active')
      .neq('plan', 'free');

    return data?.length || 0;
  }

  // Helper methods
  private static async getTotalSignups(startDate: Date, endDate: Date): Promise<number> {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return data?.length || 0;
  }

  private static async getPaidConversions(startDate: Date, endDate: Date): Promise<number> {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .neq('plan', 'free')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    return data?.length || 0;
  }

  private static async getActiveSubscribersAtDate(date: Date): Promise<number> {
    const { data } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('status', 'active')
      .lte('created_at', date.toISOString());

    return data?.length || 0;
  }

  private static async getAverageLifetime(): Promise<number> {
    const { data } = await supabase
      .from('subscriptions')
      .select('created_at, cancelled_at')
      .eq('status', 'cancelled');

    if (!data || data.length === 0) return 12; // Default 12 months

    const lifetimes = data.map(sub => {
      const start = new Date(sub.created_at);
      const end = new Date(sub.cancelled_at);
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
    });

    return lifetimes.reduce((sum, lifetime) => sum + lifetime, 0) / lifetimes.length;
  }

  private static async getAverageRevenuePerUser(): Promise<number> {
    const { data } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('status', 'active');

    if (!data || data.length === 0) return 0;

    const PRICING = { free: 0, premium: 19 };
    const totalRevenue = data.reduce((sum, sub) => {
      return sum + (PRICING[sub.plan as keyof typeof PRICING] || 0);
    }, 0);

    return totalRevenue / data.length;
  }

  private static async getCustomerAcquisitionCost(): Promise<number> {
    // For now, return a placeholder value
    // In production, this would integrate with marketing spend data
    return 50; // $50 placeholder CAC
  }

  static async getBusinessMetricsSnapshot(): Promise<BusinessMetricsData> {
    const [mrr, conversionRate, churnRate, ltvToCacRatio, totalActiveUsers, premiumUsers] = await Promise.all([
      this.calculateMRR(),
      this.getConversionRate(),
      this.getChurnRate(),
      this.getLTVtoCACRatio(),
      this.getTotalActiveUsers(),
      this.getPremiumUsers()
    ]);

    return {
      mrr,
      conversionRate,
      churnRate,
      ltvToCacRatio,
      totalActiveUsers,
      premiumUsers
    };
  }
}