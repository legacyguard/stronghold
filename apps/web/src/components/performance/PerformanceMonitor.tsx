"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useServiceWorker } from '@/lib/pwa/service-worker-registration';
import { CacheManager } from '@/lib/performance/cache-manager';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface PerformanceMetrics {
  bundleSize: {
    totalTransferSize: number;
    totalDecodedSize: number;
    loadTime: number;
  } | null;
  cacheStats: Map<string, any>;
  networkStatus: {
    isOnline: boolean;
    effectiveType?: string;
    rtt?: number;
    downlink?: number;
  };
  memoryUsage: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null;
  renderPerformance: {
    fcp: number | null; // First Contentful Paint
    lcp: number | null; // Largest Contentful Paint
    fid: number | null; // First Input Delay
    cls: number | null; // Cumulative Layout Shift
  };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    bundleSize: null,
    cacheStats: new Map(),
    networkStatus: { isOnline: navigator.onLine },
    memoryUsage: null,
    renderPerformance: {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null
    }
  });

  const [showDetails, setShowDetails] = useState(false);
  const { isOnline, getCacheStatus } = useServiceWorker();

  // Collect performance metrics
  const collectMetrics = useCallback(async () => {
    const newMetrics: PerformanceMetrics = {
      bundleSize: getBundleMetrics(),
      cacheStats: CacheManager.getAllCacheStats(),
      networkStatus: getNetworkStatus(),
      memoryUsage: getMemoryUsage(),
      renderPerformance: await getRenderPerformance()
    };

    setMetrics(newMetrics);
  }, []);

  useEffect(() => {
    collectMetrics();

    // Update metrics every 30 seconds
    const interval = setInterval(collectMetrics, 30000);

    return () => clearInterval(interval);
  }, [collectMetrics]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Performance Status Indicator */}
      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />

        <Button
          onClick={() => setShowDetails(!showDetails)}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Performance
        </Button>
      </div>

      {/* Detailed Performance Panel */}
      {showDetails && (
        <div className="absolute bottom-12 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-h3">Performance Metrics</h3>
              <Button
                onClick={() => setShowDetails(false)}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>

            {/* Network Status */}
            <div>
              <h4 className="font-medium text-sm mb-2">Network Status</h4>
              <div className="space-y-1 text-xs">
                <div>Status: {isOnline ? '🟢 Online' : '🔴 Offline'}</div>
                {metrics.networkStatus.effectiveType && (
                  <div>Connection: {metrics.networkStatus.effectiveType}</div>
                )}
                {metrics.networkStatus.rtt && (
                  <div>RTT: {metrics.networkStatus.rtt}ms</div>
                )}
                {metrics.networkStatus.downlink && (
                  <div>Downlink: {metrics.networkStatus.downlink} Mbps</div>
                )}
              </div>
            </div>

            {/* Bundle Size */}
            {metrics.bundleSize && (
              <div>
                <h4 className="font-medium text-sm mb-2">Bundle Metrics</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    Transfer Size: {formatBytes(metrics.bundleSize.totalTransferSize)}
                  </div>
                  <div>
                    Decoded Size: {formatBytes(metrics.bundleSize.totalDecodedSize)}
                  </div>
                  <div>Load Time: {metrics.bundleSize.loadTime}ms</div>
                </div>
              </div>
            )}

            {/* Memory Usage */}
            {metrics.memoryUsage && (
              <div>
                <h4 className="font-medium text-sm mb-2">Memory Usage</h4>
                <div className="space-y-1 text-xs">
                  <div>
                    Used: {formatBytes(metrics.memoryUsage.usedJSHeapSize)}
                  </div>
                  <div>
                    Total: {formatBytes(metrics.memoryUsage.totalJSHeapSize)}
                  </div>
                  <div>
                    Limit: {formatBytes(metrics.memoryUsage.jsHeapSizeLimit)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (metrics.memoryUsage.usedJSHeapSize /
                            metrics.memoryUsage.totalJSHeapSize) *
                          100
                        }%`
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Render Performance */}
            <div>
              <h4 className="font-medium text-sm mb-2">Core Web Vitals</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>FCP:</span>
                  <span className={getPerformanceColor(metrics.renderPerformance.fcp, 1800)}>
                    {metrics.renderPerformance.fcp ? `${metrics.renderPerformance.fcp}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>LCP:</span>
                  <span className={getPerformanceColor(metrics.renderPerformance.lcp, 2500)}>
                    {metrics.renderPerformance.lcp ? `${metrics.renderPerformance.lcp}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>FID:</span>
                  <span className={getPerformanceColor(metrics.renderPerformance.fid, 100)}>
                    {metrics.renderPerformance.fid ? `${metrics.renderPerformance.fid}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CLS:</span>
                  <span className={getPerformanceColor(metrics.renderPerformance.cls, 0.1)}>
                    {metrics.renderPerformance.cls ? metrics.renderPerformance.cls.toFixed(3) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Stats */}
            {metrics.cacheStats.size > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-2">Cache Performance</h4>
                <div className="space-y-2 text-xs">
                  {Array.from(metrics.cacheStats.entries()).map(([cacheName, stats]) => (
                    <div key={cacheName} className="border-l-2 border-blue-500 pl-2">
                      <div className="font-medium">{cacheName}</div>
                      <div>Hits: {stats.hits}, Misses: {stats.misses}</div>
                      <div>Hit Rate: {(stats.hitRate * 100).toFixed(1)}%</div>
                      <div>Entries: {stats.entryCount}</div>
                      <div>Size: {formatBytes(stats.totalSize)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                onClick={collectMetrics}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Refresh
              </Button>
              <Button
                onClick={() => CacheManager.clearAllCaches()}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Clear Cache
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getBundleMetrics() {
  if (typeof window === 'undefined' || !('performance' in window)) return null;

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

  if (!navigation) return null;

  return {
    totalTransferSize: navigation.transferSize || 0,
    totalDecodedSize: navigation.decodedBodySize || 0,
    loadTime: navigation.loadEventEnd - navigation.loadEventStart
  };
}

function getNetworkStatus() {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

  return {
    isOnline: navigator.onLine,
    effectiveType: connection?.effectiveType,
    rtt: connection?.rtt,
    downlink: connection?.downlink
  };
}

function getMemoryUsage() {
  const memory = (performance as any).memory;

  if (!memory) return null;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit
  };
}

async function getRenderPerformance() {
  return new Promise<{
    fcp: number | null;
    lcp: number | null;
    fid: number | null;
    cls: number | null;
  }>((resolve) => {
    const metrics = {
      fcp: null as number | null,
      lcp: null as number | null,
      fid: null as number | null,
      cls: null as number | null
    };

    // Get FCP (First Contentful Paint)
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    if (fcpEntry) {
      metrics.fcp = fcpEntry.startTime;
    }

    // Use PerformanceObserver for other metrics if available
    if ('PerformanceObserver' in window) {
      try {
        // LCP Observer
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.lcp = lastEntry.startTime;
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // FID Observer
        const fidObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            const eventEntry = entry as PerformanceEventTiming;
            if (eventEntry.processingStart) {
              metrics.fid = eventEntry.processingStart - entry.startTime;
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // CLS Observer
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              metrics.cls = clsValue;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        // Resolve after a short delay to collect initial metrics
        setTimeout(() => {
          resolve(metrics);
        }, 1000);
      } catch (error) {
        console.warn('PerformanceObserver not fully supported', error);
        resolve(metrics);
      }
    } else {
      resolve(metrics);
    }
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getPerformanceColor(value: number | null, threshold: number): string {
  if (value === null) return 'text-gray-500';

  if (value <= threshold) return 'text-green-600';
  if (value <= threshold * 1.5) return 'text-yellow-600';
  return 'text-red-600';
}