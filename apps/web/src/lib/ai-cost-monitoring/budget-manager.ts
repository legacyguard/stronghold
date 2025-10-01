// AI Cost Monitoring & Budget Management System

import { supabase } from '@/lib/supabase';

export interface AIUsageEntry {
  id: string;
  userId: string;
  operationType: string;
  tokensUsed: number;
  costUsd: number;
  modelUsed: string;
  requestData: Record<string, unknown>;
  responseData: Record<string, unknown>;
  createdAt: Date;
}

export interface BudgetAlert {
  id: string;
  userId: string;
  alertType: 'warning' | 'limit_exceeded' | 'daily_reset';
  currentUsage: number;
  threshold: number;
  message: string;
  sentAt: Date;
}

export interface UsageStats {
  todayUsage: number;
  weekUsage: number;
  monthUsage: number;
  totalRequests: number;
  averageCostPerRequest: number;
  remainingBudget: number;
  budgetUtilization: number;
}

export class AIBudgetManager {
  private static DAILY_LIMIT = 0.10; // $0.10/day
  private static WARNING_THRESHOLD = 0.08; // $0.08 (80%)
  private static ALERT_THRESHOLD = 0.09; // $0.09 (90%)

  // Cost per 1K tokens for different models
  private static MODEL_COSTS = {
    'gpt-4o': 0.005, // $0.005 per 1K tokens
    'gpt-4o-mini': 0.00015, // $0.00015 per 1K tokens
    'gpt-3.5-turbo': 0.0015, // $0.0015 per 1K tokens
  };

  // Check if user can make a request within budget
  static async checkBudgetBeforeRequest(userId: string): Promise<{
    allowed: boolean;
    reason?: string;
    currentUsage: number;
    remainingBudget: number;
  }> {
    try {
      const todayUsage = await this.getTodayUsage(userId);
      const remainingBudget = this.DAILY_LIMIT - todayUsage;

      if (todayUsage >= this.DAILY_LIMIT) {
        return {
          allowed: false,
          reason: 'daily_limit_exceeded',
          currentUsage: todayUsage,
          remainingBudget: 0
        };
      }

      return {
        allowed: true,
        currentUsage: todayUsage,
        remainingBudget
      };
    } catch (error) {
      console.error('Budget check failed:', error);
      // Allow request on error to avoid blocking users
      return {
        allowed: true,
        currentUsage: 0,
        remainingBudget: this.DAILY_LIMIT
      };
    }
  }

  // Track AI usage and check for alerts
  static async trackUsage(
    userId: string,
    operationType: string,
    tokensUsed: number,
    modelUsed: string,
    requestData: Record<string, unknown> = {},
    responseData: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      const cost = this.calculateCost(tokensUsed, modelUsed);

      // Insert usage record
      const { error } = await supabase
        .from('ai_usage_tracking')
        .insert({
          user_id: userId,
          operation_type: operationType,
          tokens_used: tokensUsed,
          cost_usd: cost,
          model_used: modelUsed,
          request_data: requestData,
          response_data: responseData
        });

      if (error) {
        console.error('Failed to track AI usage:', error);
        return;
      }

      // Check for budget alerts
      await this.checkAndSendAlerts(userId);

    } catch (error) {
      console.error('Failed to track usage:', error);
    }
  }

  // Get today's usage for a user
  static async getTodayUsage(userId: string): Promise<number> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_usage_tracking')
        .select('cost_usd')
        .eq('user_id', userId)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Failed to get today usage:', error);
        return 0;
      }

      return data?.reduce((sum, record) => sum + record.cost_usd, 0) || 0;
    } catch (error) {
      console.error('Failed to calculate today usage:', error);
      return 0;
    }
  }

  // Get comprehensive usage statistics
  static async getUsageStats(userId: string): Promise<UsageStats> {
    try {
      const now = new Date();

      // Today
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Week
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Month
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const [todayData, weekData, monthData, totalData] = await Promise.all([
        this.getUsageForPeriod(userId, today),
        this.getUsageForPeriod(userId, weekAgo),
        this.getUsageForPeriod(userId, monthAgo),
        this.getUsageForPeriod(userId, new Date(0)) // All time
      ]);

      const todayUsage = todayData.reduce((sum, r) => sum + r.cost_usd, 0);
      const weekUsage = weekData.reduce((sum, r) => sum + r.cost_usd, 0);
      const monthUsage = monthData.reduce((sum, r) => sum + r.cost_usd, 0);

      return {
        todayUsage,
        weekUsage,
        monthUsage,
        totalRequests: totalData.length,
        averageCostPerRequest: totalData.length > 0
          ? totalData.reduce((sum, r) => sum + r.cost_usd, 0) / totalData.length
          : 0,
        remainingBudget: Math.max(0, this.DAILY_LIMIT - todayUsage),
        budgetUtilization: (todayUsage / this.DAILY_LIMIT) * 100
      };
    } catch (error) {
      console.error('Failed to get usage stats:', error);
      return {
        todayUsage: 0,
        weekUsage: 0,
        monthUsage: 0,
        totalRequests: 0,
        averageCostPerRequest: 0,
        remainingBudget: this.DAILY_LIMIT,
        budgetUtilization: 0
      };
    }
  }

  // Get usage data for a specific period
  private static async getUsageForPeriod(userId: string, since: Date) {
    const { data, error } = await supabase
      .from('ai_usage_tracking')
      .select('cost_usd, tokens_used, created_at')
      .eq('user_id', userId)
      .gte('created_at', since.toISOString());

    if (error) {
      console.error('Failed to get usage for period:', error);
      return [];
    }

    return data || [];
  }

  // Calculate cost based on tokens and model
  private static calculateCost(tokens: number, model: string): number {
    const costPer1K = this.MODEL_COSTS[model as keyof typeof this.MODEL_COSTS] || this.MODEL_COSTS['gpt-4o'];
    return (tokens / 1000) * costPer1K;
  }

  // Estimate cost before making request
  static estimateCost(estimatedTokens: number, model: string): number {
    return this.calculateCost(estimatedTokens, model);
  }

  // Check and send budget alerts
  private static async checkAndSendAlerts(userId: string): Promise<void> {
    try {
      const todayUsage = await this.getTodayUsage(userId);
      const utilizationPercentage = (todayUsage / this.DAILY_LIMIT) * 100;

      // Check if we need to send alerts
      if (todayUsage >= this.DAILY_LIMIT) {
        await this.sendBudgetAlert(userId, 'limit_exceeded', todayUsage, this.DAILY_LIMIT);
      } else if (todayUsage >= this.ALERT_THRESHOLD) {
        await this.sendBudgetAlert(userId, 'warning', todayUsage, this.ALERT_THRESHOLD);
      }

    } catch (error) {
      console.error('Failed to check alerts:', error);
    }
  }

  // Send budget alert
  private static async sendBudgetAlert(
    userId: string,
    alertType: 'warning' | 'limit_exceeded' | 'daily_reset',
    currentUsage: number,
    threshold: number
  ): Promise<void> {
    try {
      // Check if we already sent this type of alert today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: existingAlerts } = await supabase
        .from('budget_alerts')
        .select('id')
        .eq('user_id', userId)
        .eq('alert_type', alertType)
        .gte('sent_at', today.toISOString());

      if (existingAlerts && existingAlerts.length > 0) {
        return; // Already sent this alert today
      }

      const messages = {
        warning: `Upozornenie: Využili ste ${Math.round((currentUsage / this.DAILY_LIMIT) * 100)}% denného AI rozpočtu ($${currentUsage.toFixed(4)} z $${this.DAILY_LIMIT}).`,
        limit_exceeded: `Denný limit AI rozpočtu bol prekročený ($${currentUsage.toFixed(4)} z $${this.DAILY_LIMIT}). Ďalšie AI generovanie bude dostupné zajtra.`,
        daily_reset: `Denný AI rozpočet bol obnovený. Máte k dispozícii $${this.DAILY_LIMIT} na AI služby.`
      };

      // Insert alert record
      await supabase
        .from('budget_alerts')
        .insert({
          user_id: userId,
          alert_type: alertType,
          current_usage: currentUsage,
          threshold: threshold,
          message: messages[alertType],
          sent_at: new Date().toISOString()
        });

      // Here you could also send email/push notification
      console.log(`Budget alert sent to user ${userId}: ${messages[alertType]}`);

    } catch (error) {
      console.error('Failed to send budget alert:', error);
    }
  }

  // Get recent alerts for user
  static async getRecentAlerts(userId: string, limit: number = 5): Promise<BudgetAlert[]> {
    try {
      const { data, error } = await supabase
        .from('budget_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get recent alerts:', error);
        return [];
      }

      return data?.map(alert => ({
        id: alert.id,
        userId: alert.user_id,
        alertType: alert.alert_type,
        currentUsage: alert.current_usage,
        threshold: alert.threshold,
        message: alert.message,
        sentAt: new Date(alert.sent_at)
      })) || [];

    } catch (error) {
      console.error('Failed to get recent alerts:', error);
      return [];
    }
  }

  // Daily reset job (would be called by cron)
  static async performDailyReset(): Promise<void> {
    try {
      // Send daily reset notifications to active users
      const { data: activeUsers } = await supabase
        .from('ai_usage_tracking')
        .select('user_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .group('user_id');

      if (activeUsers) {
        for (const user of activeUsers) {
          await this.sendBudgetAlert(user.user_id, 'daily_reset', 0, this.DAILY_LIMIT);
        }
      }

      console.log('Daily budget reset completed');
    } catch (error) {
      console.error('Failed to perform daily reset:', error);
    }
  }

  // Get current limits and settings
  static getBudgetSettings() {
    return {
      dailyLimit: this.DAILY_LIMIT,
      warningThreshold: this.WARNING_THRESHOLD,
      alertThreshold: this.ALERT_THRESHOLD,
      modelCosts: this.MODEL_COSTS
    };
  }

  // For admin: get system-wide usage stats
  static async getSystemUsageStats(): Promise<{
    totalUsersToday: number;
    totalCostToday: number;
    totalRequestsToday: number;
    averageCostPerUser: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_usage_tracking')
        .select('user_id, cost_usd')
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Failed to get system usage stats:', error);
        return {
          totalUsersToday: 0,
          totalCostToday: 0,
          totalRequestsToday: 0,
          averageCostPerUser: 0
        };
      }

      const uniqueUsers = new Set(data?.map(record => record.user_id)).size;
      const totalCost = data?.reduce((sum, record) => sum + record.cost_usd, 0) || 0;
      const totalRequests = data?.length || 0;

      return {
        totalUsersToday: uniqueUsers,
        totalCostToday: totalCost,
        totalRequestsToday: totalRequests,
        averageCostPerUser: uniqueUsers > 0 ? totalCost / uniqueUsers : 0
      };

    } catch (error) {
      console.error('Failed to get system usage stats:', error);
      return {
        totalUsersToday: 0,
        totalCostToday: 0,
        totalRequestsToday: 0,
        averageCostPerUser: 0
      };
    }
  }
}

// Budget monitoring hook for React components
export function useAIBudgetMonitoring(userId?: string) {
  const checkBudget = async () => {
    if (!userId) return { allowed: false, reason: 'no_user' };
    return await AIBudgetManager.checkBudgetBeforeRequest(userId);
  };

  const trackUsage = async (
    operationType: string,
    tokensUsed: number,
    modelUsed: string,
    requestData?: Record<string, unknown>,
    responseData?: Record<string, unknown>
  ) => {
    if (!userId) return;
    await AIBudgetManager.trackUsage(
      userId,
      operationType,
      tokensUsed,
      modelUsed,
      requestData,
      responseData
    );
  };

  const getUsageStats = async () => {
    if (!userId) return null;
    return await AIBudgetManager.getUsageStats(userId);
  };

  const getRecentAlerts = async () => {
    if (!userId) return [];
    return await AIBudgetManager.getRecentAlerts(userId);
  };

  return {
    checkBudget,
    trackUsage,
    getUsageStats,
    getRecentAlerts,
    estimateCost: AIBudgetManager.estimateCost,
    budgetSettings: AIBudgetManager.getBudgetSettings()
  };
}