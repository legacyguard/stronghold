'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  BarChart3,
  Clock,
  HardDrive
} from 'lucide-react';

import { CacheManager, CacheStats } from '@/lib/performance/cache-manager';

interface CacheMonitorDashboardProps {
  className?: string;
}

export function CacheMonitorDashboard({ className }: CacheMonitorDashboardProps) {
  const [cacheStats, setCacheStats] = useState<Map<string, CacheStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCacheStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(loadCacheStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCacheStats = async () => {
    try {
      setLoading(true);
      const stats = CacheManager.getAllCacheStats();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCacheStats();
    setRefreshing(false);
  };

  const handleClearCache = (cacheName: string) => {
    CacheManager.clearCache(cacheName);
    loadCacheStats();
  };

  const handleClearAllCaches = () => {
    CacheManager.clearAllCaches();
    loadCacheStats();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value * 100)}%`;
  };

  const getHitRateColor = (hitRate: number): string => {
    if (hitRate >= 0.8) return 'green';
    if (hitRate >= 0.6) return 'yellow';
    return 'red';
  };

  const getTotalStats = () => {
    let totalHits = 0;
    let totalMisses = 0;
    let totalSize = 0;
    let totalEntries = 0;

    for (const stats of cacheStats.values()) {
      totalHits += stats.hits;
      totalMisses += stats.misses;
      totalSize += stats.totalSize;
      totalEntries += stats.entryCount;
    }

    const totalRequests = totalHits + totalMisses;
    const overallHitRate = totalRequests > 0 ? totalHits / totalRequests : 0;

    return {
      totalHits,
      totalMisses,
      totalSize,
      totalEntries,
      overallHitRate
    };
  };

  const totalStats = getTotalStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Cache Performance Monitor
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time monitoring výkonu cache systému
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Obnoviť
          </Button>
          <Button
            onClick={handleClearAllCaches}
            variant="destructive"
            size="sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vymazať všetko
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {formatPercentage(totalStats.overallHitRate)}
              {totalStats.overallHitRate >= 0.8 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <p className="text-xs text-gray-600">
              {totalStats.totalHits} hits, {totalStats.totalMisses} misses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalStats.totalSize)}</div>
            <p className="text-xs text-gray-600">Across all caches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cache Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalEntries}</div>
            <p className="text-xs text-gray-600">{cacheStats.size} active caches</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              <Badge variant={totalStats.overallHitRate >= 0.8 ? 'default' : 'destructive'}>
                {totalStats.overallHitRate >= 0.8 ? 'Excellent' : 'Needs Attention'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Prehľad</TabsTrigger>
          <TabsTrigger value="details">Detaily cache</TabsTrigger>
          <TabsTrigger value="analytics">Analytika</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4">
            {Array.from(cacheStats.entries()).map(([cacheName, stats]) => (
              <Card key={cacheName}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        {cacheName}
                      </CardTitle>
                      <CardDescription>
                        {stats.entryCount} entries, {formatBytes(stats.totalSize)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`bg-${getHitRateColor(stats.hitRate)}-100 text-${getHitRateColor(stats.hitRate)}-800`}
                      >
                        {formatPercentage(stats.hitRate)} hit rate
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleClearCache(cacheName)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Hits</div>
                      <div className="text-lg font-bold text-green-600">{stats.hits}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Misses</div>
                      <div className="text-lg font-bold text-red-600">{stats.misses}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Entries</div>
                      <div className="text-lg font-bold">{stats.entryCount}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Size</div>
                      <div className="text-lg font-bold">{formatBytes(stats.totalSize)}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Hit Rate</span>
                      <span>{formatPercentage(stats.hitRate)}</span>
                    </div>
                    <Progress
                      value={stats.hitRate * 100}
                      className="h-2"
                    />
                  </div>

                  {(stats.oldestEntry || stats.newestEntry) && (
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500">
                      {stats.oldestEntry && (
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          Oldest: {stats.oldestEntry.toLocaleTimeString()}
                        </div>
                      )}
                      {stats.newestEntry && (
                        <div>
                          <Clock className="h-3 w-3 inline mr-1" />
                          Newest: {stats.newestEntry.toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details">
          <div className="space-y-4">
            {Array.from(cacheStats.entries()).map(([cacheName, stats]) => (
              <Card key={cacheName}>
                <CardHeader>
                  <CardTitle>{cacheName} - Detailed Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Performance Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Requests:</span>
                          <span>{stats.hits + stats.misses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache Hits:</span>
                          <span className="text-green-600">{stats.hits}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cache Misses:</span>
                          <span className="text-red-600">{stats.misses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Hit Ratio:</span>
                          <span className={`text-${getHitRateColor(stats.hitRate)}-600`}>
                            {formatPercentage(stats.hitRate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Storage Metrics</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Total Entries:</span>
                          <span>{stats.entryCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Size:</span>
                          <span>{formatBytes(stats.totalSize)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg Entry Size:</span>
                          <span>
                            {stats.entryCount > 0
                              ? formatBytes(stats.totalSize / stats.entryCount)
                              : '0 B'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Timing Information</h4>
                      <div className="space-y-1 text-sm">
                        {stats.oldestEntry && (
                          <div className="flex justify-between">
                            <span>Oldest Entry:</span>
                            <span>{stats.oldestEntry.toLocaleString()}</span>
                          </div>
                        )}
                        {stats.newestEntry && (
                          <div className="flex justify-between">
                            <span>Newest Entry:</span>
                            <span>{stats.newestEntry.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hit Rate Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Hit Rate Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(cacheStats.entries()).map(([cacheName, stats]) => (
                    <div key={cacheName} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{cacheName}</span>
                        <span className={`text-${getHitRateColor(stats.hitRate)}-600`}>
                          {formatPercentage(stats.hitRate)}
                        </span>
                      </div>
                      <Progress
                        value={stats.hitRate * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Size Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Size Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from(cacheStats.entries()).map(([cacheName, stats]) => {
                    const percentage = totalStats.totalSize > 0
                      ? (stats.totalSize / totalStats.totalSize) * 100
                      : 0;

                    return (
                      <div key={cacheName} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{cacheName}</span>
                          <span>{formatBytes(stats.totalSize)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <Progress
                          value={percentage}
                          className="h-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Performance Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Performance Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(cacheStats.entries()).map(([cacheName, stats]) => {
                    const recommendations = [];

                    if (stats.hitRate < 0.6) {
                      recommendations.push(`${cacheName}: Low hit rate (${formatPercentage(stats.hitRate)}). Consider increasing TTL or reviewing cache strategy.`);
                    }

                    if (stats.totalSize > 50 * 1024 * 1024) { // 50MB
                      recommendations.push(`${cacheName}: Large cache size (${formatBytes(stats.totalSize)}). Consider implementing size limits.`);
                    }

                    if (stats.entryCount > 10000) {
                      recommendations.push(`${cacheName}: High entry count (${stats.entryCount}). Monitor for memory usage.`);
                    }

                    return recommendations.map((rec, index) => (
                      <div key={`${cacheName}-${index}`} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                        💡 {rec}
                      </div>
                    ));
                  })}

                  {totalStats.overallHitRate >= 0.8 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                      ✅ Cache performance is excellent! Overall hit rate: {formatPercentage(totalStats.overallHitRate)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}