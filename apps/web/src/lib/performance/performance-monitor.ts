import { AnalyticsTracker } from '@/lib/analytics/tracker';

export interface CoreWebVitals {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  tti: number; // Time to Interactive
}

export interface ResourceTiming {
  name: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xmlhttprequest' | 'other';
  duration: number;
  size: number;
  startTime: number;
  endTime: number;
  blocked: boolean;
  cached: boolean;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  limit: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface NetworkMetrics {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface PerformanceSnapshot {
  id: string;
  timestamp: string;
  page_path: string;
  user_agent: string;
  connection: NetworkMetrics;
  core_web_vitals: CoreWebVitals;
  memory: MemoryMetrics;
  resources: ResourceTiming[];
  navigation: {
    type: string;
    redirect_count: number;
    timing: PerformanceNavigationTiming;
  };
  custom_metrics: Record<string, number>;
  performance_score: number;
  recommendations: string[];
}

export interface PerformanceBudget {
  id: string;
  name: string;
  enabled: boolean;
  thresholds: {
    fcp: number;
    lcp: number;
    fid: number;
    cls: number;
    ttfb: number;
    tti: number;
    memory_usage: number;
    bundle_size: number;
    resource_count: number;
  };
  violations: BudgetViolation[];
  last_check: string;
  compliance_score: number;
}

export interface BudgetViolation {
  metric: string;
  actual_value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: string;
  suggestion: string;
  timestamp: string;
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold_exceeded' | 'regression_detected' | 'budget_violation' | 'anomaly_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  current_value: number;
  threshold_value?: number;
  trend_data: number[];
  affected_pages: string[];
  triggered_at: string;
  resolved_at?: string;
  auto_resolved: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private snapshots: PerformanceSnapshot[] = [];
  private budgets: Map<string, PerformanceBudget> = new Map();
  private alerts: Map<string, PerformanceAlert> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private observers: PerformanceObserver[] = [];
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  private constructor() {
    this.setupDefaultBudgets();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupDefaultBudgets(): void {
    const defaultBudget: PerformanceBudget = {
      id: 'default_budget',
      name: 'Default Performance Budget',
      enabled: true,
      thresholds: {
        fcp: 1800, // 1.8s
        lcp: 2500, // 2.5s
        fid: 100,  // 100ms
        cls: 0.1,  // 0.1
        ttfb: 800, // 800ms
        tti: 3800, // 3.8s
        memory_usage: 0.8, // 80%
        bundle_size: 250000, // 250KB
        resource_count: 50
      },
      violations: [],
      last_check: new Date().toISOString(),
      compliance_score: 100
    };

    this.budgets.set(defaultBudget.id, defaultBudget);
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    console.log('Performance monitoring started');

    // Setup Performance Observers
    this.setupPerformanceObservers();

    // Take initial snapshot
    await this.captureSnapshot();

    // Schedule regular monitoring
    this.monitoringInterval = setInterval(() => {
      this.captureSnapshot();
      this.checkBudgets();
      this.detectAnomalies();
    }, 30000); // Every 30 seconds
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    // Clear observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Clear interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Performance monitoring stopped');
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      // Core Web Vitals Observer
      const webVitalsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processWebVitalEntry(entry);
        }
      });

      webVitalsObserver.observe({
        entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift']
      });
      this.observers.push(webVitalsObserver);

      // Resource Timing Observer
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processResourceEntry(entry as PerformanceResourceTiming);
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Navigation Timing Observer
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.processNavigationEntry(entry as PerformanceNavigationTiming);
        }
      });

      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);

    } catch (error) {
      console.error('Failed to setup performance observers:', error);
    }
  }

  private processWebVitalEntry(entry: PerformanceEntry): void {
    const metric = {
      name: entry.name,
      value: entry.startTime,
      timestamp: new Date().toISOString()
    };

    // Track metric
    AnalyticsTracker.track('performance', 'web_vital_measured', undefined, metric);

    // Check for threshold violations
    this.checkWebVitalThreshold(entry.name, entry.startTime);
  }

  private processResourceEntry(entry: PerformanceResourceTiming): void {
    const resource: ResourceTiming = {
      name: entry.name,
      type: this.getResourceType(entry.name),
      duration: entry.duration,
      size: entry.transferSize || 0,
      startTime: entry.startTime,
      endTime: entry.responseEnd,
      blocked: entry.duration > 1000, // Consider slow if >1s
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    };

    // Track slow resources
    if (resource.duration > 1000) {
      this.triggerAlert({
        type: 'threshold_exceeded',
        severity: 'medium',
        title: 'Slow Resource Detected',
        description: `Resource ${resource.name} took ${Math.round(resource.duration)}ms to load`,
        metric: 'resource_duration',
        current_value: resource.duration,
        threshold_value: 1000,
        affected_pages: [window.location.pathname]
      });
    }
  }

  private processNavigationEntry(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcp_connection: entry.connectEnd - entry.connectStart,
      request_response: entry.responseEnd - entry.requestStart,
      dom_processing: entry.domContentLoadedEventEnd - entry.responseEnd,
      resource_loading: entry.loadEventEnd - entry.domContentLoadedEventEnd,
      total_time: entry.loadEventEnd - entry.navigationStart
    };

    // Track navigation performance
    AnalyticsTracker.track('performance', 'navigation_timing', undefined, metrics);
  }

  private getResourceType(url: string): ResourceTiming['type'] {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font';
    if (url.includes('/api/') || url.includes('fetch')) return 'fetch';
    return 'other';
  }

  private async captureSnapshot(): Promise<void> {
    try {
      const snapshot: PerformanceSnapshot = {
        id: `snapshot_${Date.now()}`,
        timestamp: new Date().toISOString(),
        page_path: window.location.pathname,
        user_agent: navigator.userAgent,
        connection: this.getNetworkMetrics(),
        core_web_vitals: await this.getCoreWebVitals(),
        memory: this.getMemoryMetrics(),
        resources: this.getResourceMetrics(),
        navigation: this.getNavigationMetrics(),
        custom_metrics: await this.getCustomMetrics(),
        performance_score: 0,
        recommendations: []
      };

      // Calculate performance score
      snapshot.performance_score = this.calculatePerformanceScore(snapshot);

      // Generate recommendations
      snapshot.recommendations = this.generateRecommendations(snapshot);

      // Store snapshot
      this.snapshots.push(snapshot);

      // Keep only last 50 snapshots
      if (this.snapshots.length > 50) {
        this.snapshots = this.snapshots.slice(-50);
      }

      // Track snapshot
      await AnalyticsTracker.track('performance', 'snapshot_captured', undefined, {
        performance_score: snapshot.performance_score,
        page_path: snapshot.page_path,
        lcp: snapshot.core_web_vitals.lcp,
        fcp: snapshot.core_web_vitals.fcp,
        cls: snapshot.core_web_vitals.cls
      });

    } catch (error) {
      console.error('Failed to capture performance snapshot:', error);
    }
  }

  private getNetworkMetrics(): NetworkMetrics {
    const connection = (navigator as any).connection || {};

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }

  private async getCoreWebVitals(): Promise<CoreWebVitals> {
    const defaults: CoreWebVitals = {
      fcp: 0,
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      tti: 0
    };

    if (typeof window === 'undefined' || !('performance' in window)) {
      return defaults;
    }

    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paintEntries = performance.getEntriesByType('paint');

      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;

      // Get LCP from observer or estimate
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : fcp * 1.5;

      // Get CLS from observer or estimate
      const layoutShiftEntries = performance.getEntriesByType('layout-shift');
      const cls = layoutShiftEntries.reduce((sum: number, entry: any) => {
        return entry.hadRecentInput ? sum : sum + entry.value;
      }, 0);

      return {
        fcp,
        lcp,
        fid: 0, // Would be captured by observer
        cls,
        ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
        tti: navigation ? navigation.domInteractive - navigation.navigationStart : 0
      };

    } catch (error) {
      console.error('Failed to get Core Web Vitals:', error);
      return defaults;
    }
  }

  private getMemoryMetrics(): MemoryMetrics {
    const defaults: MemoryMetrics = {
      used: 0,
      total: 0,
      limit: 0,
      percentage: 0,
      trend: 'stable'
    };

    try {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
        const memory = (performance as any).memory;

        const used = memory.usedJSHeapSize;
        const total = memory.totalJSHeapSize;
        const limit = memory.jsHeapSizeLimit;
        const percentage = (used / limit) * 100;

        // Calculate trend
        const recentSnapshots = this.snapshots.slice(-3);
        let trend: MemoryMetrics['trend'] = 'stable';

        if (recentSnapshots.length >= 2) {
          const oldUsage = recentSnapshots[0].memory.percentage;
          const currentUsage = percentage;

          if (currentUsage > oldUsage + 5) trend = 'increasing';
          else if (currentUsage < oldUsage - 5) trend = 'decreasing';
        }

        return { used, total, limit, percentage, trend };
      }
    } catch (error) {
      console.error('Failed to get memory metrics:', error);
    }

    return defaults;
  }

  private getResourceMetrics(): ResourceTiming[] {
    try {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

      return resourceEntries.map(entry => ({
        name: entry.name,
        type: this.getResourceType(entry.name),
        duration: entry.duration,
        size: entry.transferSize || 0,
        startTime: entry.startTime,
        endTime: entry.responseEnd,
        blocked: entry.duration > 1000,
        cached: entry.transferSize === 0 && entry.decodedBodySize > 0
      }));

    } catch (error) {
      console.error('Failed to get resource metrics:', error);
      return [];
    }
  }

  private getNavigationMetrics(): PerformanceSnapshot['navigation'] {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (navigation) {
        return {
          type: navigation.type,
          redirect_count: navigation.redirectCount,
          timing: navigation
        };
      }
    } catch (error) {
      console.error('Failed to get navigation metrics:', error);
    }

    return {
      type: 'navigate',
      redirect_count: 0,
      timing: {} as PerformanceNavigationTiming
    };
  }

  private async getCustomMetrics(): Promise<Record<string, number>> {
    const metrics: Record<string, number> = {};

    try {
      // Bundle size estimation
      const scriptTags = document.querySelectorAll('script[src]');
      let estimatedBundleSize = 0;

      scriptTags.forEach(script => {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('/_next/') || src.includes('/static/')) {
          // Estimate based on typical Next.js bundle sizes
          estimatedBundleSize += 100000; // ~100KB per chunk
        }
      });

      metrics.estimated_bundle_size = estimatedBundleSize;

      // DOM complexity
      metrics.dom_nodes = document.querySelectorAll('*').length;
      metrics.dom_depth = this.calculateDOMDepth();

      // Interaction readiness
      metrics.interactive_elements = document.querySelectorAll('button, a, input, select, textarea').length;

    } catch (error) {
      console.error('Failed to get custom metrics:', error);
    }

    return metrics;
  }

  private calculateDOMDepth(): number {
    let maxDepth = 0;

    function traverse(element: Element, depth: number) {
      maxDepth = Math.max(maxDepth, depth);
      for (const child of element.children) {
        traverse(child, depth + 1);
      }
    }

    if (document.body) {
      traverse(document.body, 1);
    }

    return maxDepth;
  }

  private calculatePerformanceScore(snapshot: PerformanceSnapshot): number {
    // Weighted scoring based on Core Web Vitals and other metrics
    const weights = {
      fcp: 0.15,
      lcp: 0.25,
      fid: 0.15,
      cls: 0.15,
      ttfb: 0.10,
      tti: 0.20
    };

    const scores = {
      fcp: this.scoreMetric(snapshot.core_web_vitals.fcp, 1800, 3000),
      lcp: this.scoreMetric(snapshot.core_web_vitals.lcp, 2500, 4000),
      fid: this.scoreMetric(snapshot.core_web_vitals.fid, 100, 300),
      cls: this.scoreMetric(snapshot.core_web_vitals.cls * 1000, 100, 250), // Convert to ms equivalent
      ttfb: this.scoreMetric(snapshot.core_web_vitals.ttfb, 800, 1800),
      tti: this.scoreMetric(snapshot.core_web_vitals.tti, 3800, 7300)
    };

    const weightedScore = Object.entries(scores).reduce((total, [metric, score]) => {
      const weight = weights[metric as keyof typeof weights];
      return total + (score * weight);
    }, 0);

    return Math.round(weightedScore);
  }

  private scoreMetric(value: number, goodThreshold: number, poorThreshold: number): number {
    if (value <= goodThreshold) return 100;
    if (value >= poorThreshold) return 0;

    // Linear interpolation between good and poor
    const range = poorThreshold - goodThreshold;
    const position = value - goodThreshold;
    return Math.round(100 - (position / range) * 100);
  }

  private generateRecommendations(snapshot: PerformanceSnapshot): string[] {
    const recommendations: string[] = [];

    // Core Web Vitals recommendations
    if (snapshot.core_web_vitals.fcp > 1800) {
      recommendations.push('Optimize First Contentful Paint by reducing render-blocking resources');
    }

    if (snapshot.core_web_vitals.lcp > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and server response times');
    }

    if (snapshot.core_web_vitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by setting image dimensions and avoiding dynamic content insertion');
    }

    if (snapshot.core_web_vitals.ttfb > 800) {
      recommendations.push('Improve Time to First Byte by optimizing server response time');
    }

    // Memory recommendations
    if (snapshot.memory.percentage > 80) {
      recommendations.push('High memory usage detected - consider memory optimization techniques');
    }

    // Resource recommendations
    const slowResources = snapshot.resources.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      recommendations.push(`Optimize slow-loading resources: ${slowResources.length} resources taking >1s`);
    }

    // Bundle size recommendations
    if (snapshot.custom_metrics.estimated_bundle_size > 500000) {
      recommendations.push('Consider code splitting to reduce bundle size');
    }

    return recommendations;
  }

  private async checkBudgets(): Promise<void> {
    for (const budget of this.budgets.values()) {
      if (!budget.enabled) continue;

      const latestSnapshot = this.snapshots[this.snapshots.length - 1];
      if (!latestSnapshot) continue;

      const violations = this.checkBudgetViolations(budget, latestSnapshot);
      budget.violations = violations;
      budget.last_check = new Date().toISOString();
      budget.compliance_score = this.calculateComplianceScore(budget, violations);

      // Trigger alerts for critical violations
      violations.forEach(violation => {
        if (violation.severity === 'critical' || violation.severity === 'high') {
          this.triggerAlert({
            type: 'budget_violation',
            severity: violation.severity,
            title: `Performance Budget Violation: ${violation.metric}`,
            description: violation.impact,
            metric: violation.metric,
            current_value: violation.actual_value,
            threshold_value: violation.threshold,
            affected_pages: [latestSnapshot.page_path]
          });
        }
      });
    }
  }

  private checkBudgetViolations(budget: PerformanceBudget, snapshot: PerformanceSnapshot): BudgetViolation[] {
    const violations: BudgetViolation[] = [];

    // Check Core Web Vitals
    const checks = [
      { metric: 'fcp', value: snapshot.core_web_vitals.fcp, threshold: budget.thresholds.fcp },
      { metric: 'lcp', value: snapshot.core_web_vitals.lcp, threshold: budget.thresholds.lcp },
      { metric: 'fid', value: snapshot.core_web_vitals.fid, threshold: budget.thresholds.fid },
      { metric: 'cls', value: snapshot.core_web_vitals.cls, threshold: budget.thresholds.cls },
      { metric: 'ttfb', value: snapshot.core_web_vitals.ttfb, threshold: budget.thresholds.ttfb },
      { metric: 'tti', value: snapshot.core_web_vitals.tti, threshold: budget.thresholds.tti },
      { metric: 'memory_usage', value: snapshot.memory.percentage / 100, threshold: budget.thresholds.memory_usage },
      { metric: 'bundle_size', value: snapshot.custom_metrics.estimated_bundle_size, threshold: budget.thresholds.bundle_size },
      { metric: 'resource_count', value: snapshot.resources.length, threshold: budget.thresholds.resource_count }
    ];

    checks.forEach(check => {
      if (check.value > check.threshold) {
        const severity = this.calculateViolationSeverity(check.value, check.threshold);

        violations.push({
          metric: check.metric,
          actual_value: check.value,
          threshold: check.threshold,
          severity,
          impact: this.getViolationImpact(check.metric, severity),
          suggestion: this.getViolationSuggestion(check.metric),
          timestamp: new Date().toISOString()
        });
      }
    });

    return violations;
  }

  private calculateViolationSeverity(actual: number, threshold: number): BudgetViolation['severity'] {
    const ratio = actual / threshold;

    if (ratio > 3) return 'critical';
    if (ratio > 2) return 'high';
    if (ratio > 1.5) return 'medium';
    return 'low';
  }

  private getViolationImpact(metric: string, severity: BudgetViolation['severity']): string {
    const impacts: Record<string, Record<BudgetViolation['severity'], string>> = {
      fcp: {
        low: 'Slightly delayed content visibility',
        medium: 'Noticeable delay in content appearance',
        high: 'Significant user experience degradation',
        critical: 'Severe performance impact affecting user engagement'
      },
      lcp: {
        low: 'Minor delay in main content loading',
        medium: 'Noticeable main content loading delay',
        high: 'Poor perceived performance',
        critical: 'Unacceptable loading experience'
      },
      memory_usage: {
        low: 'Increased memory pressure',
        medium: 'Risk of performance degradation',
        high: 'High risk of browser slowdown',
        critical: 'Risk of browser crashes or freezing'
      }
    };

    return impacts[metric]?.[severity] || 'Performance impact detected';
  }

  private getViolationSuggestion(metric: string): string {
    const suggestions: Record<string, string> = {
      fcp: 'Minimize render-blocking resources and optimize critical path',
      lcp: 'Optimize largest content element (images, text blocks)',
      fid: 'Reduce JavaScript execution time and improve responsiveness',
      cls: 'Set explicit dimensions for images and avoid dynamic content insertion',
      ttfb: 'Optimize server response time and caching',
      tti: 'Reduce JavaScript bundle size and optimize initialization',
      memory_usage: 'Implement memory optimization and cleanup strategies',
      bundle_size: 'Implement code splitting and tree shaking',
      resource_count: 'Combine resources and implement resource optimization'
    };

    return suggestions[metric] || 'Review and optimize this metric';
  }

  private calculateComplianceScore(budget: PerformanceBudget, violations: BudgetViolation[]): number {
    if (violations.length === 0) return 100;

    const totalMetrics = Object.keys(budget.thresholds).length;
    const violationPenalty = violations.reduce((penalty, violation) => {
      const severityPenalties = { low: 5, medium: 15, high: 25, critical: 40 };
      return penalty + severityPenalties[violation.severity];
    }, 0);

    return Math.max(0, 100 - violationPenalty);
  }

  private checkWebVitalThreshold(metricName: string, value: number): void {
    const thresholds: Record<string, number> = {
      'first-contentful-paint': 1800,
      'largest-contentful-paint': 2500,
      'first-input-delay': 100,
      'cumulative-layout-shift': 100 // CLS is typically < 1, so *100 for comparison
    };

    const threshold = thresholds[metricName];
    if (threshold && value > threshold) {
      this.triggerAlert({
        type: 'threshold_exceeded',
        severity: value > threshold * 2 ? 'high' : 'medium',
        title: `${metricName} threshold exceeded`,
        description: `${metricName} measured ${Math.round(value)}ms, exceeding threshold of ${threshold}ms`,
        metric: metricName,
        current_value: value,
        threshold_value: threshold,
        affected_pages: [window.location.pathname]
      });
    }
  }

  private detectAnomalies(): void {
    if (this.snapshots.length < 5) return;

    const recent = this.snapshots.slice(-5);
    const baseline = this.snapshots.slice(-20, -5);

    if (baseline.length < 3) return;

    // Check for performance regressions
    const metrics = ['core_web_vitals.lcp', 'core_web_vitals.fcp', 'memory.percentage'];

    metrics.forEach(metricPath => {
      const recentValues = recent.map(s => this.getNestedValue(s, metricPath)).filter(v => v > 0);
      const baselineValues = baseline.map(s => this.getNestedValue(s, metricPath)).filter(v => v > 0);

      if (recentValues.length < 3 || baselineValues.length < 3) return;

      const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const baselineAvg = baselineValues.reduce((sum, val) => sum + val, 0) / baselineValues.length;

      // Detect significant regression (>20% increase)
      if (recentAvg > baselineAvg * 1.2) {
        this.triggerAlert({
          type: 'regression_detected',
          severity: 'high',
          title: `Performance Regression Detected`,
          description: `${metricPath} increased by ${Math.round(((recentAvg - baselineAvg) / baselineAvg) * 100)}%`,
          metric: metricPath,
          current_value: recentAvg,
          threshold_value: baselineAvg,
          trend_data: [...baselineValues, ...recentValues],
          affected_pages: [window.location.pathname]
        });
      }
    });
  }

  private getNestedValue(obj: any, path: string): number {
    return path.split('.').reduce((current, key) => current?.[key], obj) || 0;
  }

  private triggerAlert(alertData: Omit<PerformanceAlert, 'id' | 'triggered_at' | 'auto_resolved' | 'trend_data'> & { trend_data?: number[] }): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      triggered_at: new Date().toISOString(),
      auto_resolved: false,
      trend_data: alertData.trend_data || [],
      ...alertData
    };

    this.alerts.set(alert.id, alert);

    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });

    // Track alert
    AnalyticsTracker.track('performance', 'alert_triggered', undefined, {
      alert_type: alert.type,
      severity: alert.severity,
      metric: alert.metric,
      current_value: alert.current_value
    });

    console.warn(`Performance Alert: ${alert.title}`, alert);
  }

  // Public API methods
  async getCurrentSnapshot(): Promise<PerformanceSnapshot | null> {
    return this.snapshots[this.snapshots.length - 1] || null;
  }

  getSnapshots(limit: number = 10): PerformanceSnapshot[] {
    return this.snapshots.slice(-limit);
  }

  getPerformanceBudgets(): PerformanceBudget[] {
    return Array.from(this.budgets.values());
  }

  async addPerformanceBudget(budget: Omit<PerformanceBudget, 'violations' | 'last_check' | 'compliance_score'>): Promise<void> {
    const fullBudget: PerformanceBudget = {
      ...budget,
      violations: [],
      last_check: new Date().toISOString(),
      compliance_score: 100
    };

    this.budgets.set(budget.id, fullBudget);
  }

  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved_at);
  }

  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved_at = new Date().toISOString();
    return true;
  }

  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  removeAlertCallback(callback: (alert: PerformanceAlert) => void): void {
    const index = this.alertCallbacks.indexOf(callback);
    if (index > -1) {
      this.alertCallbacks.splice(index, 1);
    }
  }

  getPerformanceTrends(metricName: string, days: number = 7): Array<{ timestamp: string; value: number }> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

    return this.snapshots
      .filter(snapshot => new Date(snapshot.timestamp).getTime() > cutoff)
      .map(snapshot => ({
        timestamp: snapshot.timestamp,
        value: this.getNestedValue(snapshot, metricName)
      }))
      .filter(point => point.value > 0);
  }

  getSystemHealth(): {
    monitoring_status: 'active' | 'inactive';
    performance_score: number;
    active_alerts: number;
    budget_compliance: number;
    last_snapshot: string | null;
  } {
    const latestSnapshot = this.snapshots[this.snapshots.length - 1];
    const activeAlerts = this.getActiveAlerts().length;
    const budgets = Array.from(this.budgets.values()).filter(b => b.enabled);
    const avgCompliance = budgets.length > 0
      ? budgets.reduce((sum, b) => sum + b.compliance_score, 0) / budgets.length
      : 100;

    return {
      monitoring_status: this.isMonitoring ? 'active' : 'inactive',
      performance_score: latestSnapshot?.performance_score || 0,
      active_alerts: activeAlerts,
      budget_compliance: Math.round(avgCompliance),
      last_snapshot: latestSnapshot?.timestamp || null
    };
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();