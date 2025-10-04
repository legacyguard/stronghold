import { supabase } from '../supabase';
import { BusinessMetrics } from './business-metrics';

export interface Alert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  action: string;
  timestamp: Date;
  metric?: string;
  value?: number;
  threshold?: number;
}

export interface AlertConfig {
  errorRateThreshold: number;
  conversionDropThreshold: number;
  satisfactionThreshold: number;
  churnRateThreshold: number;
  responseTimeThreshold: number;
}

const DEFAULT_CONFIG: AlertConfig = {
  errorRateThreshold: 5, // 5% error rate
  conversionDropThreshold: 30, // 30% drop in conversion
  satisfactionThreshold: 3.5, // 3.5/5 satisfaction score
  churnRateThreshold: 10, // 10% monthly churn
  responseTimeThreshold: 3000 // 3 seconds response time
};

export class AlertManager {
  private static config: AlertConfig = DEFAULT_CONFIG;

  static async checkCriticalMetrics(): Promise<Alert[]> {
    const alerts: Alert[] = [];

    try {
      // Check error rates
      const errorRate = await this.getErrorRate(60); // last hour
      if (errorRate > this.config.errorRateThreshold) {
        alerts.push({
          type: 'critical',
          message: `Vysoká miera chýb: ${errorRate.toFixed(1)}%`,
          action: 'Okamžite prešetriť problémy so serverom',
          timestamp: new Date(),
          metric: 'error_rate',
          value: errorRate,
          threshold: this.config.errorRateThreshold
        });
      }

      // Check conversion drop
      const currentConversion = await BusinessMetrics.getConversionRate(7);
      const previousConversion = await BusinessMetrics.getConversionRate(7, 7);
      
      if (previousConversion > 0) {
        const conversionDrop = ((previousConversion - currentConversion) / previousConversion) * 100;
        if (conversionDrop > this.config.conversionDropThreshold) {
          alerts.push({
            type: 'warning',
            message: `Pokles konverzie: ${currentConversion.toFixed(1)}% (bolo ${previousConversion.toFixed(1)}%)`,
            action: 'Preskúmať nedávne zmeny a používateľskú spätnú väzbu',
            timestamp: new Date(),
            metric: 'conversion_rate',
            value: currentConversion,
            threshold: previousConversion
          });
        }
      }

      // Check user satisfaction
      const satisfaction = await this.getAverageSatisfaction(7);
      if (satisfaction > 0 && satisfaction < this.config.satisfactionThreshold) {
        alerts.push({
          type: 'warning',
          message: `Nízka spokojnosť používateľov: ${satisfaction.toFixed(1)}/5`,
          action: 'Preskúmať používateľskú spätnú väzbu a support tikety',
          timestamp: new Date(),
          metric: 'user_satisfaction',
          value: satisfaction,
          threshold: this.config.satisfactionThreshold
        });
      }

      // Check churn rate
      const churnRate = await BusinessMetrics.getChurnRate(30);
      if (churnRate > this.config.churnRateThreshold) {
        alerts.push({
          type: 'warning',
          message: `Vysoký churn rate: ${churnRate.toFixed(1)}%`,
          action: 'Zamerať sa na retentné opatrenia a hodnotu produktu',
          timestamp: new Date(),
          metric: 'churn_rate',
          value: churnRate,
          threshold: this.config.churnRateThreshold
        });
      }

      // Check response times
      const avgResponseTime = await this.getAverageResponseTime(60);
      if (avgResponseTime > this.config.responseTimeThreshold) {
        alerts.push({
          type: 'warning',
          message: `Pomalé odozvy: ${avgResponseTime.toFixed(0)}ms`,
          action: 'Optimalizovať výkon aplikácie a databázy',
          timestamp: new Date(),
          metric: 'response_time',
          value: avgResponseTime,
          threshold: this.config.responseTimeThreshold
        });
      }

      // Check for anomalies in user activity
      const dailyActiveUsers = await this.getDailyActiveUsers(7);
      const avgDAU = dailyActiveUsers.reduce((sum, dau) => sum + dau, 0) / dailyActiveUsers.length;
      const todayDAU = dailyActiveUsers[dailyActiveUsers.length - 1] || 0;
      
      if (avgDAU > 0 && todayDAU < avgDAU * 0.5) { // 50% drop
        alerts.push({
          type: 'critical',
          message: `Výrazný pokles aktívnych používateľov: ${todayDAU} (priemer: ${avgDAU.toFixed(0)})`,
          action: 'Prešetriť technické problémy alebo výpadky',
          timestamp: new Date(),
          metric: 'daily_active_users',
          value: todayDAU,
          threshold: avgDAU * 0.5
        });
      }

      // Send alerts if any found
      if (alerts.length > 0) {
        await this.sendAlerts(alerts);
        await this.logAlerts(alerts);
      }

    } catch (error) {
      console.error('Error checking critical metrics:', error);
      alerts.push({
        type: 'critical',
        message: 'Chyba pri kontrole metrík',
        action: 'Prešetriť monitoring systém',
        timestamp: new Date()
      });
    }

    return alerts;
  }

  static async getActiveAlerts(): Promise<Alert[]> {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('resolved', false)
      .order('created_at', { ascending: false });

    return data?.map(alert => ({
      type: alert.type,
      message: alert.message,
      action: alert.action,
      timestamp: new Date(alert.created_at),
      metric: alert.metric,
      value: alert.value,
      threshold: alert.threshold
    })) || [];
  }

  static async resolveAlert(alertId: string): Promise<boolean> {
    const { error } = await supabase
      .from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', alertId);

    return !error;
  }

  static async updateConfig(config: Partial<AlertConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    
    // Save to database
    await supabase
      .from('alert_config')
      .upsert({
        id: 'default',
        config: this.config,
        updated_at: new Date().toISOString()
      });
  }

  static async loadConfig(): Promise<AlertConfig> {
    const { data } = await supabase
      .from('alert_config')
      .select('config')
      .eq('id', 'default')
      .single();

    if (data?.config) {
      this.config = { ...DEFAULT_CONFIG, ...data.config };
    }

    return this.config;
  }

  // Helper methods
  private static async getErrorRate(minutes: number): Promise<number> {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const { data: totalRequests } = await supabase
      .from('request_logs')
      .select('id', { count: 'exact' })
      .gte('timestamp', startTime.toISOString());

    const { data: errorRequests } = await supabase
      .from('request_logs')
      .select('id', { count: 'exact' })
      .gte('timestamp', startTime.toISOString())
      .gte('status_code', 400);

    const total = totalRequests || 0;
    const errors = errorRequests || 0;

    return total > 0 ? (errors / total) * 100 : 0;
  }

  private static async getAverageSatisfaction(days: number): Promise<number> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const { data } = await supabase
      .from('user_feedback')
      .select('rating')
      .gte('timestamp', startDate.toISOString())
      .not('rating', 'is', null);

    if (!data || data.length === 0) return 0;

    const totalRating = data.reduce((sum, feedback) => sum + feedback.rating, 0);
    return totalRating / data.length;
  }

  private static async getAverageResponseTime(minutes: number): Promise<number> {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    
    const { data } = await supabase
      .from('request_logs')
      .select('response_time')
      .gte('timestamp', startTime.toISOString())
      .not('response_time', 'is', null);

    if (!data || data.length === 0) return 0;

    const totalTime = data.reduce((sum, log) => sum + log.response_time, 0);
    return totalTime / data.length;
  }

  private static async getDailyActiveUsers(days: number): Promise<number[]> {
    const results: number[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
      
      const { data } = await supabase
        .from('user_sessions')
        .select('user_id')
        .gte('last_seen', startOfDay.toISOString())
        .lt('last_seen', endOfDay.toISOString());

      const uniqueUsers = new Set(data?.map(session => session.user_id) || []);
      results.push(uniqueUsers.size);
    }

    return results;
  }

  private static async sendAlerts(alerts: Alert[]): Promise<void> {
    // In production, this would send to Slack, email, etc.
    console.group('🚨 STRONGHOLD ALERTS');
    alerts.forEach(alert => {
      const emoji = alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`${emoji} ${alert.message}`);
      console.log(`   Action: ${alert.action}`);
      if (alert.metric) {
        console.log(`   Metric: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`);
      }
      console.log('');
    });
    console.groupEnd();

    // TODO: Implement actual alert delivery
    // - Slack webhook
    // - Email notifications
    // - SMS for critical alerts
    // - Push notifications
  }

  private static async logAlerts(alerts: Alert[]): Promise<void> {
    for (const alert of alerts) {
      await supabase.from('alerts').insert({
        type: alert.type,
        message: alert.message,
        action: alert.action,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        resolved: false,
        created_at: alert.timestamp.toISOString()
      });
    }
  }

  // Scheduled monitoring
  static async startMonitoring(): Promise<void> {
    // Load configuration
    await this.loadConfig();

    // Check metrics every 5 minutes
    setInterval(async () => {
      await this.checkCriticalMetrics();
    }, 5 * 60 * 1000);

    console.log('✅ Alert monitoring started');
  }

  static async generateHealthReport(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    alerts: Alert[];
    metrics: Record<string, number>;
  }> {
    const alerts = await this.checkCriticalMetrics();
    
    const criticalAlerts = alerts.filter(a => a.type === 'critical');
    const warningAlerts = alerts.filter(a => a.type === 'warning');
    
    let status: 'healthy' | 'warning' | 'critical';
    if (criticalAlerts.length > 0) {
      status = 'critical';
    } else if (warningAlerts.length > 0) {
      status = 'warning';
    } else {
      status = 'healthy';
    }

    const metrics = {
      error_rate: await this.getErrorRate(60),
      avg_response_time: await this.getAverageResponseTime(60),
      user_satisfaction: await this.getAverageSatisfaction(7),
      daily_active_users: (await this.getDailyActiveUsers(1))[0] || 0
    };

    return {
      status,
      alerts,
      metrics
    };
  }
}