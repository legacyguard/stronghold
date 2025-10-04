import { supabase } from '@/lib/supabase';

interface PerformanceMetrics {
  pageLoadTime: number;
  timeToFirstByte: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  memoryUsage?: number;
  jsHeapSize?: number;
}

interface ResourceTiming {
  name: string;
  duration: number;
  size: number;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other';
}

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
  }>;
  duplicatedPackages: string[];
  unusedExports: string[];
}

export class PerformanceOptimizer {
  private static metricsBuffer: PerformanceMetrics[] = [];
  private static observerInitialized = false;

  /**
   * Initialize performance monitoring
   */
  static initialize(): void {
    if (typeof window === 'undefined' || this.observerInitialized) return;

    this.setupWebVitalsObserver();
    this.setupResourceTimingObserver();
    this.setupMemoryMonitoring();
    this.setupErrorBoundary();

    this.observerInitialized = true;
  }

  /**
   * Setup Web Vitals observer
   */
  private static setupWebVitalsObserver(): void {
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('LCP', entry.startTime);
          }
        });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.entryType === 'first-input') {
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Setup resource timing observer
   */
  private static setupResourceTimingObserver(): void {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.duration > 1000) { // Resources taking more than 1 second
            console.warn(`Slow resource detected: ${entry.name} (${entry.duration}ms)`);
            this.optimizeResource(entry);
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  /**
   * Setup memory monitoring
   */
  private static setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
          console.warn('High memory usage detected');
          this.performGarbageCollection();
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Setup error boundary for performance issues
   */
  private static setupErrorBoundary(): void {
    window.addEventListener('error', (event) => {
      if (event.error?.name === 'ChunkLoadError') {
        this.handleChunkLoadError(event.error);
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Loading chunk')) {
        this.handleChunkLoadError(event.reason);
      }
    });
  }

  /**
   * Record performance metric
   */
  private static recordMetric(name: string, value: number): void {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname
    };

    // Store locally for batching
    this.storeMetricLocally(metric);

    // Send to analytics if critical
    if (this.isCriticalMetric(name, value)) {
      this.sendMetricImmediately(metric);
    }
  }

  /**
   * Store metric locally for batching
   */
  private static storeMetricLocally(metric: any): void {
    try {
      const stored = localStorage.getItem('performance_metrics') || '[]';
      const metrics = JSON.parse(stored);
      metrics.push(metric);

      // Keep only last 100 metrics
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }

      localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    } catch (error) {
      console.error('Failed to store metric locally:', error);
    }
  }

  /**
   * Check if metric is critical
   */
  private static isCriticalMetric(name: string, value: number): boolean {
    const thresholds = {
      'LCP': 4000, // 4 seconds
      'FID': 300,  // 300ms
      'CLS': 0.25  // 0.25
    };

    return value > (thresholds[name as keyof typeof thresholds] || Infinity);
  }

  /**
   * Send metric immediately for critical values
   */
  private static async sendMetricImmediately(metric: any): Promise<void> {
    try {
      await supabase
        .from('performance_metrics')
        .insert({
          metric_name: metric.name,
          metric_value: metric.value,
          page_url: metric.url,
          timestamp: new Date(metric.timestamp).toISOString(),
          is_critical: true
        });
    } catch (error) {
      console.error('Failed to send critical metric:', error);
    }
  }

  /**
   * Batch send stored metrics
   */
  static async flushMetrics(): Promise<void> {
    try {
      const stored = localStorage.getItem('performance_metrics');
      if (!stored) return;

      const metrics = JSON.parse(stored);
      if (metrics.length === 0) return;

      const transformedMetrics = metrics.map((metric: any) => ({
        metric_name: metric.name,
        metric_value: metric.value,
        page_url: metric.url,
        timestamp: new Date(metric.timestamp).toISOString(),
        is_critical: false
      }));

      await supabase
        .from('performance_metrics')
        .insert(transformedMetrics);

      localStorage.removeItem('performance_metrics');
    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  /**
   * Optimize resource loading
   */
  private static optimizeResource(entry: PerformanceResourceTiming): void {
    const resourceType = this.getResourceType(entry.name);

    switch (resourceType) {
      case 'image':
        this.optimizeImage(entry.name);
        break;
      case 'script':
        this.optimizeScript(entry.name);
        break;
      case 'stylesheet':
        this.optimizeStylesheet(entry.name);
        break;
    }
  }

  /**
   * Get resource type from URL
   */
  private static getResourceType(url: string): 'image' | 'script' | 'stylesheet' | 'font' | 'other' {
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(js|mjs)$/i)) return 'script';
    if (url.match(/\.css$/i)) return 'stylesheet';
    if (url.match(/\.(woff|woff2|ttf|otf)$/i)) return 'font';
    return 'other';
  }

  /**
   * Optimize image loading
   */
  private static optimizeImage(url: string): void {
    const img = document.querySelector(`img[src="${url}"]`) as HTMLImageElement;
    if (!img) return;

    // Add lazy loading if not present
    if (!img.hasAttribute('loading')) {
      img.loading = 'lazy';
    }

    // Add srcset for responsive images
    if (!img.hasAttribute('srcset') && !url.includes('?')) {
      const extension = url.split('.').pop();
      const baseName = url.replace(`.${extension}`, '');
      img.srcset = `
        ${baseName}-320w.${extension} 320w,
        ${baseName}-640w.${extension} 640w,
        ${baseName}-1024w.${extension} 1024w
      `;
      img.sizes = '(max-width: 320px) 320px, (max-width: 640px) 640px, 1024px';
    }
  }

  /**
   * Optimize script loading
   */
  private static optimizeScript(url: string): void {
    const script = document.querySelector(`script[src="${url}"]`) as HTMLScriptElement;
    if (!script) return;

    // Add async or defer if not present
    if (!script.async && !script.defer) {
      script.defer = true;
    }
  }

  /**
   * Optimize stylesheet loading
   */
  private static optimizeStylesheet(url: string): void {
    const link = document.querySelector(`link[href="${url}"]`) as HTMLLinkElement;
    if (!link) return;

    // Preload critical CSS
    if (!link.hasAttribute('as')) {
      link.rel = 'preload';
      link.as = 'style';
      link.onload = function() {
        this.onload = null;
        this.rel = 'stylesheet';
      };
    }
  }

  /**
   * Handle chunk load errors
   */
  private static handleChunkLoadError(error: Error): void {
    console.warn('Chunk load error detected, attempting reload:', error);

    // Clear cache and reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  }

  /**
   * Perform garbage collection if available
   */
  private static performGarbageCollection(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    // Clear unnecessary data
    this.clearUnnecessaryData();
  }

  /**
   * Clear unnecessary data
   */
  private static clearUnnecessaryData(): void {
    // Clear old performance entries
    if (performance.clearResourceTimings) {
      performance.clearResourceTimings();
    }

    // Clear old metrics
    const stored = localStorage.getItem('performance_metrics');
    if (stored) {
      const metrics = JSON.parse(stored);
      const recent = metrics.filter((m: any) => Date.now() - m.timestamp < 300000); // Keep last 5 minutes
      localStorage.setItem('performance_metrics', JSON.stringify(recent));
    }
  }

  /**
   * Preload critical resources
   */
  static preloadCriticalResources(): void {
    const criticalResources = [
      '/api/user/profile',
      '/fonts/inter-var.woff2',
      '/images/logo.svg'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';

      if (resource.endsWith('.woff2') || resource.endsWith('.woff')) {
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
      } else if (resource.startsWith('/api/')) {
        link.as = 'fetch';
        link.crossOrigin = 'anonymous';
      } else {
        link.as = 'image';
      }

      link.href = resource;
      document.head.appendChild(link);
    });
  }

  /**
   * Implement lazy loading for components
   */
  static setupLazyLoading(): void {
    if ('IntersectionObserver' in window) {
      const lazyElements = document.querySelectorAll('[data-lazy]');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.dataset.lazySrc;

            if (src) {
              if (element.tagName === 'IMG') {
                (element as HTMLImageElement).src = src;
              } else {
                element.style.backgroundImage = `url(${src})`;
              }

              element.removeAttribute('data-lazy');
              element.removeAttribute('data-lazy-src');
              observer.unobserve(element);
            }
          }
        });
      }, {
        rootMargin: '50px 0px'
      });

      lazyElements.forEach(element => observer.observe(element));
    }
  }

  /**
   * Optimize database queries
   */
  static async optimizeQuery<T>(
    tableName: string,
    query: any,
    cacheKey?: string,
    cacheDuration: number = 300000 // 5 minutes
  ): Promise<T> {
    // Check cache first
    if (cacheKey && typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheDuration) {
          return data;
        }
      }
    }

    // Execute query
    const { data, error } = await query;

    if (error) throw error;

    // Cache result
    if (cacheKey && typeof window !== 'undefined') {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    }

    return data;
  }

  /**
   * Implement virtual scrolling for large lists
   */
  static createVirtualList<T>(
    container: HTMLElement,
    items: T[],
    renderItem: (item: T, index: number) => HTMLElement,
    itemHeight: number = 50
  ): void {
    const viewportHeight = container.clientHeight;
    const visibleCount = Math.ceil(viewportHeight / itemHeight) + 2; // Buffer

    let scrollTop = 0;
    let startIndex = 0;

    const totalHeight = items.length * itemHeight;
    const scrollableDiv = document.createElement('div');
    scrollableDiv.style.height = `${totalHeight}px`;
    scrollableDiv.style.position = 'relative';

    const visibleDiv = document.createElement('div');
    visibleDiv.style.position = 'absolute';
    visibleDiv.style.top = '0';
    visibleDiv.style.width = '100%';

    container.appendChild(scrollableDiv);
    scrollableDiv.appendChild(visibleDiv);

    const renderVisibleItems = () => {
      visibleDiv.innerHTML = '';

      const endIndex = Math.min(startIndex + visibleCount, items.length);

      for (let i = startIndex; i < endIndex; i++) {
        const item = renderItem(items[i], i);
        item.style.position = 'absolute';
        item.style.top = `${i * itemHeight}px`;
        item.style.height = `${itemHeight}px`;
        visibleDiv.appendChild(item);
      }
    };

    container.addEventListener('scroll', () => {
      scrollTop = container.scrollTop;
      const newStartIndex = Math.floor(scrollTop / itemHeight);

      if (newStartIndex !== startIndex) {
        startIndex = newStartIndex;
        renderVisibleItems();
      }
    });

    renderVisibleItems();
  }

  /**
   * Monitor and report performance issues
   */
  static async reportPerformanceIssue(issue: {
    type: 'slow_query' | 'memory_leak' | 'render_block' | 'network_error';
    details: any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      await supabase
        .from('performance_issues')
        .insert({
          issue_type: issue.type,
          details: issue.details,
          severity: issue.severity,
          user_agent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Failed to report performance issue:', error);
    }
  }

  /**
   * Get performance recommendations
   */
  static getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];

    if (typeof window === 'undefined') return recommendations;

    // Check connection
    const connection = (navigator as any).connection;
    if (connection && connection.effectiveType === 'slow-2g') {
      recommendations.push('Optimize for slow connections - reduce image sizes and enable compression');
    }

    // Check memory
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
        recommendations.push('High memory usage detected - consider code splitting');
      }
    }

    // Check local storage
    const storageUsed = new Blob(Object.values(localStorage)).size;
    if (storageUsed > 5 * 1024 * 1024) { // 5MB
      recommendations.push('Local storage usage is high - clean up old data');
    }

    return recommendations;
  }
}