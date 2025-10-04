import { supabase } from '@/lib/supabase';

interface SystemMetrics {
  timestamp: Date;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
  network: {
    downlink: number;
    effectiveType: string;
    rtt: number;
  };
  battery?: {
    level: number;
    charging: boolean;
  };
  storage: {
    used: number;
    available: number;
    quota: number;
  };
  performance: {
    navigation: number;
    firstPaint: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    cumulativeLayoutShift: number;
  };
}

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
}

interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'availability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  private metricsInterval?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private alerts: Alert[] = [];

  static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  /**
   * Start system monitoring
   */
  async startMonitoring(options: {
    metricsInterval?: number; // milliseconds
    healthCheckInterval?: number; // milliseconds
    enableAlerts?: boolean;
  } = {}): Promise<void> {
    if (this.isMonitoring) return;

    const {
      metricsInterval = 60000, // 1 minute
      healthCheckInterval = 300000, // 5 minutes
      enableAlerts = true
    } = options;

    this.isMonitoring = true;

    // Start metrics collection
    this.metricsInterval = setInterval(async () => {
      await this.collectMetrics();
    }, metricsInterval);

    // Start health checks
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, healthCheckInterval);

    // Initial collection
    await this.collectMetrics();
    await this.performHealthChecks();

    console.log('System monitoring started');
  }

  /**
   * Stop system monitoring
   */
  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    this.isMonitoring = false;
    console.log('System monitoring stopped');
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        memory: this.getMemoryMetrics(),
        cpu: this.getCPUMetrics(),
        network: this.getNetworkMetrics(),
        battery: await this.getBatteryMetrics(),
        storage: await this.getStorageMetrics(),
        performance: this.getPerformanceMetrics()
      };

      // Store metrics
      await this.storeMetrics(metrics);

      // Check for alerts
      this.checkMetricAlerts(metrics);

    } catch (error) {
      console.error('Failed to collect metrics:', error);
    }
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics(): SystemMetrics['memory'] {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }

    return {
      used: 0,
      total: 0,
      percentage: 0
    };
  }

  /**
   * Get CPU metrics (approximation)
   */
  private getCPUMetrics(): SystemMetrics['cpu'] {
    return {
      usage: this.approximateCPUUsage(),
      cores: navigator.hardwareConcurrency || 1
    };
  }

  /**
   * Approximate CPU usage based on performance timing
   */
  private approximateCPUUsage(): number {
    const start = performance.now();

    // Perform a CPU-intensive task
    let result = 0;
    for (let i = 0; i < 10000; i++) {
      result += Math.random();
    }

    const duration = performance.now() - start;

    // Normalize to percentage (rough approximation)
    return Math.min(duration * 10, 100);
  }

  /**
   * Get network metrics
   */
  private getNetworkMetrics(): SystemMetrics['network'] {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || 'unknown',
        rtt: connection.rtt || 0
      };
    }

    return {
      downlink: 0,
      effectiveType: 'unknown',
      rtt: 0
    };
  }

  /**
   * Get battery metrics
   */
  private async getBatteryMetrics(): Promise<SystemMetrics['battery']> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level * 100,
          charging: battery.charging
        };
      } catch (error) {
        console.warn('Battery API not available:', error);
      }
    }

    return undefined;
  }

  /**
   * Get storage metrics
   */
  private async getStorageMetrics(): Promise<SystemMetrics['storage']> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: (estimate.quota || 0) - (estimate.usage || 0),
          quota: estimate.quota || 0
        };
      } catch (error) {
        console.warn('Storage API not available:', error);
      }
    }

    // Fallback to localStorage approximation
    let localStorageSize = 0;
    try {
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          localStorageSize += localStorage[key].length;
        }
      }
    } catch (error) {
      // localStorage not available
    }

    return {
      used: localStorageSize,
      available: 10 * 1024 * 1024 - localStorageSize, // Assume 10MB limit
      quota: 10 * 1024 * 1024
    };
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): SystemMetrics['performance'] {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const paintEntries = performance.getEntriesByType('paint');

    let firstPaint = 0;
    let firstContentfulPaint = 0;

    paintEntries.forEach(entry => {
      if (entry.name === 'first-paint') {
        firstPaint = entry.startTime;
      }
      if (entry.name === 'first-contentful-paint') {
        firstContentfulPaint = entry.startTime;
      }
    });

    // Get LCP from observer (if available)
    let largestContentfulPaint = 0;
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      largestContentfulPaint = lcpEntries[lcpEntries.length - 1].startTime;
    }

    return {
      navigation: navigation?.loadEventEnd - navigation?.navigationStart || 0,
      firstPaint,
      firstContentfulPaint,
      largestContentfulPaint,
      firstInputDelay: 0, // Would need observer
      cumulativeLayoutShift: 0 // Would need observer
    };
  }

  /**
   * Store metrics to database
   */
  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      await supabase
        .from('system_metrics')
        .insert({
          timestamp: metrics.timestamp.toISOString(),
          memory_used: metrics.memory.used,
          memory_total: metrics.memory.total,
          memory_percentage: metrics.memory.percentage,
          cpu_usage: metrics.cpu.usage,
          cpu_cores: metrics.cpu.cores,
          network_downlink: metrics.network.downlink,
          network_type: metrics.network.effectiveType,
          network_rtt: metrics.network.rtt,
          battery_level: metrics.battery?.level,
          battery_charging: metrics.battery?.charging,
          storage_used: metrics.storage.used,
          storage_available: metrics.storage.available,
          storage_quota: metrics.storage.quota,
          perf_navigation: metrics.performance.navigation,
          perf_first_paint: metrics.performance.firstPaint,
          perf_fcp: metrics.performance.firstContentfulPaint,
          perf_lcp: metrics.performance.largestContentfulPaint,
          perf_fid: metrics.performance.firstInputDelay,
          perf_cls: metrics.performance.cumulativeLayoutShift,
          user_agent: navigator.userAgent,
          url: window.location.href
        });
    } catch (error) {
      console.error('Failed to store metrics:', error);
      // Store locally as fallback
      this.storeMetricsLocally(metrics);
    }
  }

  /**
   * Store metrics locally as fallback
   */
  private storeMetricsLocally(metrics: SystemMetrics): void {
    try {
      const stored = localStorage.getItem('system_metrics') || '[]';
      const localMetrics = JSON.parse(stored);

      localMetrics.push(metrics);

      // Keep only last 50 metrics
      if (localMetrics.length > 50) {
        localMetrics.splice(0, localMetrics.length - 50);
      }

      localStorage.setItem('system_metrics', JSON.stringify(localMetrics));
    } catch (error) {
      console.error('Failed to store metrics locally:', error);
    }
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    const services = [
      { name: 'database', url: '/api/health/database' },
      { name: 'auth', url: '/api/health/auth' },
      { name: 'storage', url: '/api/health/storage' },
      { name: 'api', url: '/api/health/api' }
    ];

    for (const service of services) {
      try {
        const healthCheck = await this.checkService(service.name, service.url);
        await this.storeHealthCheck(healthCheck);

        if (healthCheck.status !== 'healthy') {
          this.createAlert({
            type: 'availability',
            severity: healthCheck.status === 'unhealthy' ? 'high' : 'medium',
            message: `Service ${service.name} is ${healthCheck.status}`,
            details: {
              service: service.name,
              responseTime: healthCheck.responseTime,
              status: healthCheck.status
            }
          });
        }
      } catch (error) {
        console.error(`Health check failed for ${service.name}:`, error);

        this.createAlert({
          type: 'availability',
          severity: 'critical',
          message: `Health check failed for ${service.name}`,
          details: {
            service: service.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    }
  }

  /**
   * Check individual service health
   */
  private async checkService(serviceName: string, url: string): Promise<HealthCheck> {
    const startTime = performance.now();

    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000,
        signal: AbortSignal.timeout(5000)
      } as any);

      const responseTime = performance.now() - startTime;

      let status: HealthCheck['status'] = 'healthy';
      let details: Record<string, any> = {};

      if (response.ok) {
        try {
          const data = await response.json();
          details = data;

          // Determine status based on response time
          if (responseTime > 5000) {
            status = 'unhealthy';
          } else if (responseTime > 2000) {
            status = 'degraded';
          }
        } catch (error) {
          status = 'degraded';
          details = { error: 'Invalid JSON response' };
        }
      } else {
        status = 'unhealthy';
        details = {
          httpStatus: response.status,
          statusText: response.statusText
        };
      }

      return {
        service: serviceName,
        status,
        responseTime,
        timestamp: new Date(),
        details
      };
    } catch (error) {
      return {
        service: serviceName,
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        timestamp: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Network error'
        }
      };
    }
  }

  /**
   * Store health check results
   */
  private async storeHealthCheck(healthCheck: HealthCheck): Promise<void> {
    try {
      await supabase
        .from('health_checks')
        .insert({
          service: healthCheck.service,
          status: healthCheck.status,
          response_time: healthCheck.responseTime,
          timestamp: healthCheck.timestamp.toISOString(),
          details: healthCheck.details
        });
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  /**
   * Check metrics for alert conditions
   */
  private checkMetricAlerts(metrics: SystemMetrics): void {
    // Memory usage alert
    if (metrics.memory.percentage > 80) {
      this.createAlert({
        type: 'performance',
        severity: metrics.memory.percentage > 95 ? 'critical' : 'high',
        message: `High memory usage: ${metrics.memory.percentage.toFixed(1)}%`,
        details: {
          memoryUsed: metrics.memory.used,
          memoryTotal: metrics.memory.total,
          percentage: metrics.memory.percentage
        }
      });
    }

    // CPU usage alert
    if (metrics.cpu.usage > 80) {
      this.createAlert({
        type: 'performance',
        severity: metrics.cpu.usage > 95 ? 'critical' : 'high',
        message: `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
        details: {
          cpuUsage: metrics.cpu.usage,
          cores: metrics.cpu.cores
        }
      });
    }

    // Storage alert
    const storagePercentage = (metrics.storage.used / metrics.storage.quota) * 100;
    if (storagePercentage > 80) {
      this.createAlert({
        type: 'performance',
        severity: storagePercentage > 95 ? 'critical' : 'medium',
        message: `Low storage space: ${storagePercentage.toFixed(1)}% used`,
        details: {
          storageUsed: metrics.storage.used,
          storageQuota: metrics.storage.quota,
          percentage: storagePercentage
        }
      });
    }

    // Performance alerts
    if (metrics.performance.largestContentfulPaint > 4000) {
      this.createAlert({
        type: 'performance',
        severity: 'medium',
        message: `Slow page load: LCP ${metrics.performance.largestContentfulPaint}ms`,
        details: {
          lcp: metrics.performance.largestContentfulPaint,
          navigation: metrics.performance.navigation
        }
      });
    }

    // Network alert
    if (metrics.network.effectiveType === 'slow-2g') {
      this.createAlert({
        type: 'performance',
        severity: 'low',
        message: 'Slow network connection detected',
        details: {
          effectiveType: metrics.network.effectiveType,
          downlink: metrics.network.downlink,
          rtt: metrics.network.rtt
        }
      });
    }

    // Battery alert
    if (metrics.battery && metrics.battery.level < 20 && !metrics.battery.charging) {
      this.createAlert({
        type: 'performance',
        severity: 'low',
        message: `Low battery: ${metrics.battery.level}%`,
        details: {
          batteryLevel: metrics.battery.level,
          charging: metrics.battery.charging
        }
      });
    }
  }

  /**
   * Create alert
   */
  private createAlert(alertData: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: Alert = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      acknowledged: false,
      ...alertData
    };

    this.alerts.push(alert);

    // Store alert
    this.storeAlert(alert);

    // Emit alert event
    this.emitAlert(alert);
  }

  /**
   * Store alert to database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await supabase
        .from('system_alerts')
        .insert({
          alert_id: alert.id,
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          details: alert.details,
          timestamp: alert.timestamp.toISOString(),
          acknowledged: alert.acknowledged
        });
    } catch (error) {
      console.error('Failed to store alert:', error);
    }
  }

  /**
   * Emit alert event
   */
  private emitAlert(alert: Alert): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('system-alert', {
        detail: alert
      }));
    }

    // Console log for development
    console.warn(`[SYSTEM ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, alert.details);
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: Partial<SystemMetrics>;
    alerts: Alert[];
    uptime: number;
  }> {
    const metrics = await this.getCurrentMetrics();
    const activeAlerts = this.alerts.filter(alert => !alert.acknowledged);

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (activeAlerts.some(alert => alert.severity === 'critical')) {
      status = 'unhealthy';
    } else if (activeAlerts.some(alert => alert.severity === 'high')) {
      status = 'degraded';
    }

    return {
      status,
      metrics,
      alerts: activeAlerts,
      uptime: performance.now()
    };
  }

  /**
   * Get current metrics
   */
  private async getCurrentMetrics(): Promise<Partial<SystemMetrics>> {
    if (typeof window === 'undefined') return {};

    return {
      memory: this.getMemoryMetrics(),
      cpu: this.getCPUMetrics(),
      network: this.getNetworkMetrics(),
      storage: await this.getStorageMetrics(),
      performance: this.getPerformanceMetrics()
    };
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;

      try {
        await supabase
          .from('system_alerts')
          .update({ acknowledged: true })
          .eq('alert_id', alertId);
      } catch (error) {
        console.error('Failed to acknowledge alert:', error);
      }
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();

      try {
        await supabase
          .from('system_alerts')
          .update({
            resolved_at: alert.resolvedAt.toISOString(),
            acknowledged: true
          })
          .eq('alert_id', alertId);
      } catch (error) {
        console.error('Failed to resolve alert:', error);
      }
    }
  }

  /**
   * Get alerts
   */
  getAlerts(filter?: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    acknowledged?: boolean;
  }): Alert[] {
    let filteredAlerts = this.alerts;

    if (filter) {
      if (filter.type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filter.type);
      }
      if (filter.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filter.severity);
      }
      if (filter.acknowledged !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filter.acknowledged);
      }
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Export singleton instance
export const systemMonitor = SystemMonitor.getInstance();