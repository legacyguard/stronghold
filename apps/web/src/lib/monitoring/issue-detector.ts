import { AnalyticsTracker } from '@/lib/analytics/tracker';
import { behaviorTracker } from '@/lib/analytics/behavior-tracker';
import { ErrorHandler, StrongholdError } from '@/lib/error/error-handler';

export type IssueType =
  | 'performance_degradation'
  | 'memory_leak'
  | 'api_latency'
  | 'user_experience'
  | 'feature_failure'
  | 'security_anomaly'
  | 'data_inconsistency'
  | 'resource_exhaustion'
  | 'user_flow_disruption'
  | 'accessibility_issue';

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'detected' | 'investigating' | 'mitigating' | 'resolved' | 'false_positive';

export interface DetectedIssue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  status: IssueStatus;
  title: string;
  description: string;
  detection_time: string;
  last_updated: string;
  affected_users: number;
  affected_features: string[];
  metrics: Record<string, number>;
  evidence: IssueEvidence[];
  potential_causes: string[];
  recommended_actions: string[];
  auto_mitigation_available: boolean;
  confidence_score: number;
  impact_score: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface IssueEvidence {
  id: string;
  evidence_type: 'metric' | 'error' | 'user_report' | 'performance' | 'behavior';
  timestamp: string;
  description: string;
  value?: number;
  threshold?: number;
  metadata: Record<string, any>;
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  issue_type: IssueType;
  enabled: boolean;
  conditions: RuleCondition[];
  severity_mapping: Record<string, IssueSeverity>;
  check_interval: number; // milliseconds
  cooldown_period: number; // milliseconds
  auto_mitigation: boolean;
  last_triggered: string | null;
  false_positive_count: number;
  detection_count: number;
  accuracy_score: number;
}

export interface RuleCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'trend';
  value: number | string;
  timeframe?: number; // minutes
  aggregation?: 'avg' | 'sum' | 'max' | 'min' | 'count';
}

export interface SystemMetrics {
  timestamp: string;
  performance: {
    page_load_time: number;
    memory_usage: number;
    cpu_usage: number;
    network_latency: number;
    render_time: number;
  };
  user_experience: {
    error_rate: number;
    bounce_rate: number;
    session_duration: number;
    interaction_rate: number;
    satisfaction_score: number;
  };
  features: {
    availability: Record<string, number>;
    response_times: Record<string, number>;
    success_rates: Record<string, number>;
  };
  security: {
    failed_auth_attempts: number;
    suspicious_requests: number;
    data_access_anomalies: number;
  };
}

export class IssueDetector {
  private static instance: IssueDetector;
  private rules: Map<string, MonitoringRule> = new Map();
  private detectedIssues: Map<string, DetectedIssue> = new Map();
  private metricsHistory: SystemMetrics[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private alertCallbacks: Array<(issue: DetectedIssue) => void> = [];

  private constructor() {
    this.setupDefaultRules();
  }

  static getInstance(): IssueDetector {
    if (!IssueDetector.instance) {
      IssueDetector.instance = new IssueDetector();
    }
    return IssueDetector.instance;
  }

  private setupDefaultRules(): void {
    const defaultRules: MonitoringRule[] = [
      {
        id: 'performance_degradation',
        name: 'Performance Degradation Detection',
        description: 'Detects when page load times exceed normal thresholds',
        issue_type: 'performance_degradation',
        enabled: true,
        conditions: [
          { metric: 'page_load_time', operator: 'gt', value: 3000 },
          { metric: 'render_time', operator: 'gt', value: 1000 }
        ],
        severity_mapping: {
          'page_load_time > 5000': 'critical',
          'page_load_time > 3000': 'high',
          'render_time > 2000': 'medium'
        },
        check_interval: 30000,
        cooldown_period: 300000,
        auto_mitigation: false,
        last_triggered: null,
        false_positive_count: 0,
        detection_count: 0,
        accuracy_score: 0.85
      },
      {
        id: 'memory_leak_detection',
        name: 'Memory Leak Detection',
        description: 'Monitors memory usage trends to detect potential leaks',
        issue_type: 'memory_leak',
        enabled: true,
        conditions: [
          { metric: 'memory_usage', operator: 'trend', value: 'increasing', timeframe: 15 }
        ],
        severity_mapping: {
          'memory_usage > 0.9': 'critical',
          'memory_usage > 0.8': 'high',
          'memory_usage > 0.7': 'medium'
        },
        check_interval: 60000,
        cooldown_period: 600000,
        auto_mitigation: true,
        last_triggered: null,
        false_positive_count: 0,
        detection_count: 0,
        accuracy_score: 0.75
      },
      {
        id: 'api_latency_spike',
        name: 'API Latency Spike Detection',
        description: 'Detects unusual increases in API response times',
        issue_type: 'api_latency',
        enabled: true,
        conditions: [
          { metric: 'network_latency', operator: 'gt', value: 2000 },
          { metric: 'api_response_time', operator: 'gt', value: 5000 }
        ],
        severity_mapping: {
          'network_latency > 5000': 'critical',
          'api_response_time > 10000': 'high'
        },
        check_interval: 15000,
        cooldown_period: 180000,
        auto_mitigation: false,
        last_triggered: null,
        false_positive_count: 0,
        detection_count: 0,
        accuracy_score: 0.90
      },
      {
        id: 'user_experience_degradation',
        name: 'User Experience Degradation',
        description: 'Monitors user satisfaction and engagement metrics',
        issue_type: 'user_experience',
        enabled: true,
        conditions: [
          { metric: 'error_rate', operator: 'gt', value: 0.05 },
          { metric: 'bounce_rate', operator: 'gt', value: 0.7 }
        ],
        severity_mapping: {
          'error_rate > 0.1': 'high',
          'bounce_rate > 0.8': 'medium'
        },
        check_interval: 60000,
        cooldown_period: 300000,
        auto_mitigation: false,
        last_triggered: null,
        false_positive_count: 0,
        detection_count: 0,
        accuracy_score: 0.80
      },
      {
        id: 'feature_failure_detection',
        name: 'Feature Failure Detection',
        description: 'Detects when core features become unavailable or fail',
        issue_type: 'feature_failure',
        enabled: true,
        conditions: [
          { metric: 'feature_availability', operator: 'lt', value: 0.95 },
          { metric: 'feature_success_rate', operator: 'lt', value: 0.90 }
        ],
        severity_mapping: {
          'feature_availability < 0.5': 'critical',
          'feature_success_rate < 0.8': 'high'
        },
        check_interval: 30000,
        cooldown_period: 120000,
        auto_mitigation: true,
        last_triggered: null,
        false_positive_count: 0,
        detection_count: 0,
        accuracy_score: 0.92
      },
      {
        id: 'security_anomaly_detection',
        name: 'Security Anomaly Detection',
        description: 'Detects unusual security-related activities',
        issue_type: 'security_anomaly',
        enabled: true,
        conditions: [
          { metric: 'failed_auth_attempts', operator: 'gt', value: 10, timeframe: 5 },
          { metric: 'suspicious_requests', operator: 'gt', value: 20, timeframe: 10 }
        ],
        severity_mapping: {
          'failed_auth_attempts > 50': 'critical',
          'suspicious_requests > 100': 'high'
        },
        check_interval: 30000,
        cooldown_period: 600000,
        auto_mitigation: false,
        last_triggered: null,
        false_positive_count: 0,
        detection_count: 0,
        accuracy_score: 0.88
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('Issue Detection monitoring started');

    // Start the monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.runDetectionCycle();
    }, 15000); // Run every 15 seconds

    // Initial metrics collection
    await this.collectMetrics();
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Issue Detection monitoring stopped');
  }

  private async runDetectionCycle(): Promise<void> {
    try {
      // Collect current metrics
      await this.collectMetrics();

      // Run detection rules
      for (const [ruleId, rule] of this.rules) {
        if (rule.enabled && this.shouldRunRule(rule)) {
          await this.evaluateRule(rule);
        }
      }

      // Update existing issues
      await this.updateIssueStatuses();

      // Clean up old metrics (keep last 100 entries)
      if (this.metricsHistory.length > 100) {
        this.metricsHistory = this.metricsHistory.slice(-100);
      }

    } catch (error) {
      console.error('Error in detection cycle:', error);
    }
  }

  private async collectMetrics(): Promise<void> {
    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      performance: await this.collectPerformanceMetrics(),
      user_experience: await this.collectUserExperienceMetrics(),
      features: await this.collectFeatureMetrics(),
      security: await this.collectSecurityMetrics()
    };

    this.metricsHistory.push(metrics);
  }

  private async collectPerformanceMetrics(): Promise<SystemMetrics['performance']> {
    const defaults = {
      page_load_time: 1500,
      memory_usage: 0.5,
      cpu_usage: 0.3,
      network_latency: 100,
      render_time: 500
    };

    try {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const memory = (performance as any).memory;

        return {
          page_load_time: navigation ? navigation.loadEventEnd - navigation.navigationStart : defaults.page_load_time,
          memory_usage: memory ? memory.usedJSHeapSize / memory.jsHeapSizeLimit : defaults.memory_usage,
          cpu_usage: defaults.cpu_usage, // Would need additional APIs
          network_latency: navigation ? navigation.responseStart - navigation.requestStart : defaults.network_latency,
          render_time: navigation ? navigation.domContentLoadedEventEnd - navigation.responseEnd : defaults.render_time
        };
      }
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }

    return defaults;
  }

  private async collectUserExperienceMetrics(): Promise<SystemMetrics['user_experience']> {
    try {
      const sessionData = await behaviorTracker.getSessionData();

      return {
        error_rate: Math.random() * 0.02, // Would come from error tracking
        bounce_rate: sessionData.bounce_rate,
        session_duration: sessionData.total_duration / 1000 / 60, // Convert to minutes
        interaction_rate: sessionData.interactions_count / Math.max(1, sessionData.total_duration / 1000 / 60),
        satisfaction_score: 4.2 + Math.random() * 0.8 // Mock satisfaction score
      };
    } catch (error) {
      console.error('Failed to collect user experience metrics:', error);
      return {
        error_rate: 0,
        bounce_rate: 0,
        session_duration: 0,
        interaction_rate: 0,
        satisfaction_score: 0
      };
    }
  }

  private async collectFeatureMetrics(): Promise<SystemMetrics['features']> {
    // Mock feature metrics - in real implementation, this would check actual feature health
    const features = ['document_upload', 'user_auth', 'dashboard', 'notifications', 'search'];

    const availability: Record<string, number> = {};
    const response_times: Record<string, number> = {};
    const success_rates: Record<string, number> = {};

    features.forEach(feature => {
      availability[feature] = 0.95 + Math.random() * 0.05;
      response_times[feature] = 200 + Math.random() * 800;
      success_rates[feature] = 0.90 + Math.random() * 0.10;
    });

    return { availability, response_times, success_rates };
  }

  private async collectSecurityMetrics(): Promise<SystemMetrics['security']> {
    // Mock security metrics - in real implementation, this would come from security monitoring
    return {
      failed_auth_attempts: Math.floor(Math.random() * 5),
      suspicious_requests: Math.floor(Math.random() * 10),
      data_access_anomalies: Math.floor(Math.random() * 2)
    };
  }

  private shouldRunRule(rule: MonitoringRule): boolean {
    if (!rule.last_triggered) return true;

    const lastTriggered = new Date(rule.last_triggered).getTime();
    const cooldownExpired = Date.now() - lastTriggered > rule.cooldown_period;

    return cooldownExpired;
  }

  private async evaluateRule(rule: MonitoringRule): Promise<void> {
    try {
      const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
      if (!currentMetrics) return;

      const conditionsMet = rule.conditions.every(condition =>
        this.evaluateCondition(condition, currentMetrics)
      );

      if (conditionsMet) {
        await this.createIssue(rule, currentMetrics);
        rule.last_triggered = new Date().toISOString();
        rule.detection_count++;
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
    }
  }

  private evaluateCondition(condition: RuleCondition, metrics: SystemMetrics): boolean {
    const value = this.getMetricValue(condition.metric, metrics);

    if (value === null || value === undefined) return false;

    switch (condition.operator) {
      case 'gt':
        return Number(value) > Number(condition.value);
      case 'lt':
        return Number(value) < Number(condition.value);
      case 'eq':
        return value === condition.value;
      case 'gte':
        return Number(value) >= Number(condition.value);
      case 'lte':
        return Number(value) <= Number(condition.value);
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'trend':
        return this.evaluateTrend(condition.metric, String(condition.value), condition.timeframe || 10);
      default:
        return false;
    }
  }

  private getMetricValue(metricPath: string, metrics: SystemMetrics): any {
    const path = metricPath.split('.');
    let value: any = metrics;

    for (const key of path) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }

    return value;
  }

  private evaluateTrend(metric: string, expectedTrend: string, timeframe: number): boolean {
    if (this.metricsHistory.length < 2) return false;

    const recentMetrics = this.metricsHistory.slice(-Math.min(timeframe, this.metricsHistory.length));
    const values = recentMetrics.map(m => this.getMetricValue(metric, m)).filter(v => v !== null);

    if (values.length < 2) return false;

    const firstValue = values[0];
    const lastValue = values[values.length - 1];

    switch (expectedTrend) {
      case 'increasing':
        return lastValue > firstValue;
      case 'decreasing':
        return lastValue < firstValue;
      case 'stable':
        return Math.abs(lastValue - firstValue) / firstValue < 0.1;
      default:
        return false;
    }
  }

  private async createIssue(rule: MonitoringRule, metrics: SystemMetrics): Promise<void> {
    const issueId = `issue_${rule.id}_${Date.now()}`;
    const severity = this.calculateSeverity(rule, metrics);

    const issue: DetectedIssue = {
      id: issueId,
      type: rule.issue_type,
      severity,
      status: 'detected',
      title: `${rule.name} Alert`,
      description: rule.description,
      detection_time: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      affected_users: this.estimateAffectedUsers(rule.issue_type),
      affected_features: this.getAffectedFeatures(rule.issue_type),
      metrics: this.extractRelevantMetrics(rule, metrics),
      evidence: this.generateEvidence(rule, metrics),
      potential_causes: this.getPotentialCauses(rule.issue_type),
      recommended_actions: this.getRecommendedActions(rule.issue_type),
      auto_mitigation_available: rule.auto_mitigation,
      confidence_score: rule.accuracy_score,
      impact_score: this.calculateImpactScore(severity, rule.issue_type),
      trend: 'stable'
    };

    this.detectedIssues.set(issueId, issue);

    // Trigger alerts
    this.alertCallbacks.forEach(callback => {
      try {
        callback(issue);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    // Track the detection
    await AnalyticsTracker.track('issue_detection', 'issue_detected', undefined, {
      issue_id: issueId,
      issue_type: rule.issue_type,
      severity,
      rule_id: rule.id
    });

    console.log(`Issue detected: ${issue.title} (${severity})`);
  }

  private calculateSeverity(rule: MonitoringRule, metrics: SystemMetrics): IssueSeverity {
    // Simple severity calculation based on rule mapping
    for (const [condition, severity] of Object.entries(rule.severity_mapping)) {
      // Parse condition and check if it matches current metrics
      // For now, return medium as default
    }
    return 'medium';
  }

  private estimateAffectedUsers(issueType: IssueType): number {
    // Estimate based on issue type and current session data
    const baseUsers = Math.floor(Math.random() * 100) + 1;

    switch (issueType) {
      case 'performance_degradation':
      case 'user_experience':
        return baseUsers * 2; // Performance issues affect more users
      case 'feature_failure':
        return baseUsers * 3; // Feature failures affect many users
      case 'security_anomaly':
        return 1; // Security issues might affect fewer users initially
      default:
        return baseUsers;
    }
  }

  private getAffectedFeatures(issueType: IssueType): string[] {
    const featureMap: Record<IssueType, string[]> = {
      performance_degradation: ['navigation', 'page_loading', 'user_interface'],
      memory_leak: ['document_processing', 'user_interface'],
      api_latency: ['data_sync', 'authentication', 'document_upload'],
      user_experience: ['navigation', 'forms', 'notifications'],
      feature_failure: ['core_functionality'],
      security_anomaly: ['authentication', 'data_access'],
      data_inconsistency: ['database', 'sync'],
      resource_exhaustion: ['system_resources'],
      user_flow_disruption: ['user_workflows'],
      accessibility_issue: ['user_interface', 'navigation']
    };

    return featureMap[issueType] || [];
  }

  private extractRelevantMetrics(rule: MonitoringRule, metrics: SystemMetrics): Record<string, number> {
    const relevantMetrics: Record<string, number> = {};

    rule.conditions.forEach(condition => {
      const value = this.getMetricValue(condition.metric, metrics);
      if (typeof value === 'number') {
        relevantMetrics[condition.metric] = value;
      }
    });

    return relevantMetrics;
  }

  private generateEvidence(rule: MonitoringRule, metrics: SystemMetrics): IssueEvidence[] {
    return rule.conditions.map((condition, index) => ({
      id: `evidence_${index}`,
      evidence_type: 'metric',
      timestamp: metrics.timestamp,
      description: `${condition.metric} ${condition.operator} ${condition.value}`,
      value: this.getMetricValue(condition.metric, metrics),
      threshold: typeof condition.value === 'number' ? condition.value : undefined,
      metadata: { condition }
    }));
  }

  private getPotentialCauses(issueType: IssueType): string[] {
    const causesMap: Record<IssueType, string[]> = {
      performance_degradation: ['Large payload sizes', 'Inefficient database queries', 'Memory leaks', 'Network congestion'],
      memory_leak: ['Unreleased event listeners', 'Circular references', 'Large data structures not garbage collected'],
      api_latency: ['Database performance issues', 'Network problems', 'Server overload', 'Third-party service delays'],
      user_experience: ['UI/UX design issues', 'Performance problems', 'Feature bugs', 'User flow complexity'],
      feature_failure: ['Code deployment issues', 'Database problems', 'External service failures', 'Configuration errors'],
      security_anomaly: ['Malicious attacks', 'System vulnerabilities', 'Unauthorized access attempts'],
      data_inconsistency: ['Synchronization issues', 'Database corruption', 'Race conditions'],
      resource_exhaustion: ['Memory limits reached', 'CPU overload', 'Storage limitations'],
      user_flow_disruption: ['Navigation issues', 'Form validation problems', 'Session management'],
      accessibility_issue: ['Missing ARIA labels', 'Poor color contrast', 'Keyboard navigation problems']
    };

    return causesMap[issueType] || ['Unknown cause'];
  }

  private getRecommendedActions(issueType: IssueType): string[] {
    const actionsMap: Record<IssueType, string[]> = {
      performance_degradation: ['Optimize database queries', 'Implement caching', 'Compress assets', 'Code profiling'],
      memory_leak: ['Review event listeners', 'Check for circular references', 'Implement proper cleanup'],
      api_latency: ['Check database performance', 'Review network configuration', 'Implement request timeouts'],
      user_experience: ['Conduct user testing', 'Review UI/UX design', 'Analyze user feedback'],
      feature_failure: ['Check recent deployments', 'Review error logs', 'Test feature functionality'],
      security_anomaly: ['Review security logs', 'Check for unauthorized access', 'Update security measures'],
      data_inconsistency: ['Verify data synchronization', 'Check database integrity', 'Review transaction handling'],
      resource_exhaustion: ['Monitor resource usage', 'Optimize resource allocation', 'Scale infrastructure'],
      user_flow_disruption: ['Review user journeys', 'Test navigation flows', 'Check form validation'],
      accessibility_issue: ['Run accessibility audit', 'Review ARIA implementation', 'Test with screen readers']
    };

    return actionsMap[issueType] || ['Investigate further'];
  }

  private calculateImpactScore(severity: IssueSeverity, issueType: IssueType): number {
    const severityScores = { low: 0.25, medium: 0.5, high: 0.75, critical: 1.0 };
    const typeMultipliers: Record<IssueType, number> = {
      security_anomaly: 1.2,
      feature_failure: 1.1,
      performance_degradation: 1.0,
      user_experience: 0.9,
      api_latency: 0.8,
      memory_leak: 0.7,
      data_inconsistency: 0.8,
      resource_exhaustion: 0.9,
      user_flow_disruption: 0.8,
      accessibility_issue: 0.6
    };

    return severityScores[severity] * (typeMultipliers[issueType] || 1.0);
  }

  private async updateIssueStatuses(): Promise<void> {
    for (const [issueId, issue] of this.detectedIssues) {
      // Auto-resolve issues that are no longer detected
      if (issue.status === 'detected' && this.isIssueResolved(issue)) {
        issue.status = 'resolved';
        issue.last_updated = new Date().toISOString();

        await AnalyticsTracker.track('issue_detection', 'issue_resolved', undefined, {
          issue_id: issueId,
          issue_type: issue.type,
          duration: new Date().getTime() - new Date(issue.detection_time).getTime()
        });
      }

      // Update trend
      issue.trend = this.calculateIssueTrend(issue);
    }
  }

  private isIssueResolved(issue: DetectedIssue): boolean {
    // Check if the conditions that triggered this issue are no longer met
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    if (!currentMetrics) return false;

    // Simple resolution check - if metrics are back to normal for this issue type
    switch (issue.type) {
      case 'performance_degradation':
        return currentMetrics.performance.page_load_time < 2000;
      case 'memory_leak':
        return currentMetrics.performance.memory_usage < 0.7;
      case 'api_latency':
        return currentMetrics.performance.network_latency < 1000;
      default:
        return false;
    }
  }

  private calculateIssueTrend(issue: DetectedIssue): 'improving' | 'stable' | 'worsening' {
    // Simple trend calculation based on recent metrics
    if (this.metricsHistory.length < 3) return 'stable';

    const recentMetrics = this.metricsHistory.slice(-3);
    // This would analyze whether the issue is getting better or worse
    // For now, return random for demonstration
    const trends = ['improving', 'stable', 'worsening'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  // Public API methods
  getDetectedIssues(): DetectedIssue[] {
    return Array.from(this.detectedIssues.values())
      .sort((a, b) => b.impact_score - a.impact_score);
  }

  getIssueById(issueId: string): DetectedIssue | undefined {
    return this.detectedIssues.get(issueId);
  }

  async updateIssueStatus(issueId: string, status: IssueStatus): Promise<boolean> {
    const issue = this.detectedIssues.get(issueId);
    if (!issue) return false;

    issue.status = status;
    issue.last_updated = new Date().toISOString();

    await AnalyticsTracker.track('issue_detection', 'issue_status_updated', undefined, {
      issue_id: issueId,
      old_status: issue.status,
      new_status: status
    });

    return true;
  }

  async addRule(rule: MonitoringRule): Promise<void> {
    this.rules.set(rule.id, rule);

    await AnalyticsTracker.track('issue_detection', 'rule_added', undefined, {
      rule_id: rule.id,
      rule_type: rule.issue_type
    });
  }

  onIssueDetected(callback: (issue: DetectedIssue) => void): void {
    this.alertCallbacks.push(callback);
  }

  removeIssueCallback(callback: (issue: DetectedIssue) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  getSystemHealth(): {
    monitoring_status: 'active' | 'inactive';
    total_issues: number;
    critical_issues: number;
    resolved_issues: number;
    detection_accuracy: number;
  } {
    const issues = Array.from(this.detectedIssues.values());
    const totalRules = Array.from(this.rules.values());
    const avgAccuracy = totalRules.reduce((sum, rule) => sum + rule.accuracy_score, 0) / totalRules.length;

    return {
      monitoring_status: this.isMonitoring ? 'active' : 'inactive',
      total_issues: issues.length,
      critical_issues: issues.filter(i => i.severity === 'critical').length,
      resolved_issues: issues.filter(i => i.status === 'resolved').length,
      detection_accuracy: Math.round(avgAccuracy * 100)
    };
  }
}

// Export singleton instance
export const issueDetector = IssueDetector.getInstance();