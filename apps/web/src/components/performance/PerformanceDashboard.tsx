'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Gauge,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  Activity,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw,
  Cpu,
  Memory,
  Network,
  HardDrive
} from 'lucide-react';
import { performanceMonitor, PerformanceSnapshot, PerformanceAlert } from '@/lib/performance/performance-monitor';
import { reliabilityScorer, ReliabilityScore } from '@/lib/reliability/reliability-scorer';
import { optimizationEngine, PerformanceOptimization } from '@/lib/performance/optimization-engine';
import { useComponentTracking } from '@/hooks/useBehaviorTracking';

interface PerformanceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
}

export function PerformanceDashboard({ className = '', autoRefresh = true }: PerformanceDashboardProps) {
  const { trackInteraction } = useComponentTracking('PerformanceDashboard');

  const [snapshot, setSnapshot] = useState<PerformanceSnapshot | null>(null);
  const [reliabilityScore, setReliabilityScore] = useState<ReliabilityScore | null>(null);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
    checkMonitoringStatus();

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      const [
        currentSnapshot,
        currentReliabilityScore,
        currentOptimizations,
        currentAlerts
      ] = await Promise.all([
        performanceMonitor.getCurrentSnapshot(),
        reliabilityScorer.getCurrentScore(),
        optimizationEngine.getOptimizations(),
        performanceMonitor.getActiveAlerts()
      ]);

      setSnapshot(currentSnapshot);
      setReliabilityScore(currentReliabilityScore);
      setOptimizations(currentOptimizations);
      setAlerts(currentAlerts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMonitoringStatus = () => {
    const perfHealth = performanceMonitor.getSystemHealth();
    const reliabilityHealth = reliabilityScorer.getSystemHealth();
    const optimizationHealth = optimizationEngine.getSystemHealth();

    setIsMonitoring(
      perfHealth.monitoring_status === 'active' &&
      reliabilityHealth.scoring_status === 'active' &&
      optimizationHealth.optimization_status === 'active'
    );
  };

  const handleStartMonitoring = async () => {
    trackInteraction('start_monitoring');

    try {
      await Promise.all([
        performanceMonitor.startMonitoring(),
        reliabilityScorer.startScoring(),
        optimizationEngine.startOptimization()
      ]);
      setIsMonitoring(true);
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStopMonitoring = () => {
    trackInteraction('stop_monitoring');

    performanceMonitor.stopMonitoring();
    reliabilityScorer.stopScoring();
    optimizationEngine.stopOptimization();
    setIsMonitoring(false);
  };

  const getCoreWebVitalStatus = (metric: string, value: number) => {
    const thresholds = {
      lcp: { good: 2500, poor: 4000 },
      fcp: { good: 1800, poor: 3000 },
      cls: { good: 0.1, poor: 0.25 },
      fid: { good: 100, poor: 300 },
      ttfb: { good: 800, poor: 1800 },
      tti: { good: 3800, poor: 7300 }
    };

    const threshold = thresholds[metric as keyof typeof thresholds];
    if (!threshold) return 'unknown';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-100';
      case 'needs-improvement':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600 bg-green-100';
    if (grade.startsWith('B')) return 'text-blue-600 bg-blue-100';
    if (grade.startsWith('C')) return 'text-yellow-600 bg-yellow-100';
    if (grade.startsWith('D')) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatMetric = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`;
    }
    if (unit === 's') {
      return `${(value / 1000).toFixed(1)}s`;
    }
    if (unit === '%') {
      return `${Math.round(value * 100)}%`;
    }
    return Math.round(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gauge className="w-6 h-6 text-primary" />
            Performance & Reliability Dashboard
          </h2>
          <p className="text-gray-600">Real-time monitoring and optimization insights</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={isMonitoring ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            <Activity className="w-3 h-3 mr-1" />
            {isMonitoring ? 'Active' : 'Inactive'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
          >
            {isMonitoring ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Performance Score</p>
                <p className="text-2xl font-bold">{snapshot?.performance_score || 0}</p>
              </div>
              <Gauge className="w-8 h-8 text-blue-600" />
            </div>
            <Progress value={snapshot?.performance_score || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Reliability Grade</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{reliabilityScore?.grade || 'N/A'}</p>
                  {reliabilityScore && getTrendIcon(reliabilityScore.trend)}
                </div>
              </div>
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            {reliabilityScore && (
              <Badge className={getGradeColor(reliabilityScore.grade)}>
                {reliabilityScore.overall_score}/100
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${alerts.length > 0 ? 'text-red-600' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Optimizations</p>
                <p className="text-2xl font-bold">{optimizations.filter(o => o.status === 'suggested').length}</p>
              </div>
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="reliability">Reliability</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {snapshot && (
            <>
              {/* Core Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Performance Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Score</span>
                        <div className="flex items-center gap-2">
                          <Progress value={snapshot.performance_score} className="w-20 h-2" />
                          <span className="font-medium">{snapshot.performance_score}/100</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">LCP</span>
                        <Badge className={getStatusColor(getCoreWebVitalStatus('lcp', snapshot.core_web_vitals.lcp))}>
                          {formatMetric(snapshot.core_web_vitals.lcp, 'ms')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">FCP</span>
                        <Badge className={getStatusColor(getCoreWebVitalStatus('fcp', snapshot.core_web_vitals.fcp))}>
                          {formatMetric(snapshot.core_web_vitals.fcp, 'ms')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">CLS</span>
                        <Badge className={getStatusColor(getCoreWebVitalStatus('cls', snapshot.core_web_vitals.cls))}>
                          {snapshot.core_web_vitals.cls.toFixed(3)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      System Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Memory className="w-4 h-4" />
                          <span className="text-sm">Memory Usage</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={snapshot.memory.percentage} className="w-20 h-2" />
                          <span className="font-medium">{Math.round(snapshot.memory.percentage)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Network className="w-4 h-4" />
                          <span className="text-sm">Network</span>
                        </div>
                        <span className="font-medium">{snapshot.connection.effectiveType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4" />
                          <span className="text-sm">Resources</span>
                        </div>
                        <span className="font-medium">{snapshot.resources.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              {snapshot.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Recommendations</CardTitle>
                    <CardDescription>Immediate actions to improve performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {snapshot.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-2 p-3 border rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="vitals" className="space-y-6">
          {snapshot && (
            <div className="grid gap-4">
              {Object.entries({
                'Largest Contentful Paint': { value: snapshot.core_web_vitals.lcp, unit: 'ms', metric: 'lcp' },
                'First Contentful Paint': { value: snapshot.core_web_vitals.fcp, unit: 'ms', metric: 'fcp' },
                'Cumulative Layout Shift': { value: snapshot.core_web_vitals.cls, unit: '', metric: 'cls' },
                'First Input Delay': { value: snapshot.core_web_vitals.fid, unit: 'ms', metric: 'fid' },
                'Time to First Byte': { value: snapshot.core_web_vitals.ttfb, unit: 'ms', metric: 'ttfb' },
                'Time to Interactive': { value: snapshot.core_web_vitals.tti, unit: 'ms', metric: 'tti' }
              }).map(([name, data]) => {
                const status = getCoreWebVitalStatus(data.metric, data.value);
                return (
                  <Card key={name}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{name}</h3>
                        <Badge className={getStatusColor(status)}>
                          {status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">
                          {data.metric === 'cls' ? data.value.toFixed(3) : formatMetric(data.value, data.unit)}
                        </div>
                        <div className="flex-1">
                          <Progress
                            value={status === 'good' ? 100 : status === 'needs-improvement' ? 60 : 30}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reliability" className="space-y-6">
          {reliabilityScore && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Reliability Overview</CardTitle>
                  <CardDescription>System reliability across all dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>Overall Score</span>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{reliabilityScore.overall_score}</span>
                          <Badge className={getGradeColor(reliabilityScore.grade)}>
                            {reliabilityScore.grade}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Trend</span>
                        <div className="flex items-center gap-2">
                          {getTrendIcon(reliabilityScore.trend)}
                          <span className="capitalize">{reliabilityScore.trend}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Confidence Level</span>
                        <span className="font-medium">{reliabilityScore.confidence_level}%</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Dimension Scores</h4>
                      <div className="space-y-2">
                        {Object.entries(reliabilityScore.dimensions).map(([dimension, score]) => (
                          <div key={dimension} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{dimension.replace('_', ' ')}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={score.score} className="w-16 h-2" />
                              <span className="text-sm font-medium w-8">{score.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {reliabilityScore.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reliability Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {reliabilityScore.recommendations.slice(0, 5).map((rec, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{rec.title}</h4>
                              <Badge variant="outline">{rec.priority}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          <div className="grid gap-4">
            {optimizations.slice(0, 10).map((optimization) => (
              <Card key={optimization.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{optimization.title}</h3>
                        <Badge variant="outline">{optimization.priority}</Badge>
                        <Badge className={
                          optimization.status === 'deployed' ? 'bg-green-100 text-green-800' :
                          optimization.status === 'implementing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {optimization.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{optimization.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Expected Impact: +{optimization.expected_impact.performance_score_improvement} points</span>
                        <span>Effort: {optimization.effort_estimate}</span>
                        <span>Risk: {optimization.risk_level}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {optimization.status === 'suggested' && (
                        <Button size="sm" onClick={() => optimizationEngine.approveOptimization(optimization.id)}>
                          Approve
                        </Button>
                      )}
                      {optimization.auto_implementable && optimization.status === 'planned' && (
                        <Button size="sm" onClick={() => optimizationEngine.implementOptimizationManually(optimization.id)}>
                          <Zap className="w-4 h-4 mr-2" />
                          Implement
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {optimizations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Optimizations Needed</h3>
                  <p className="text-gray-600">System is performing optimally. Keep monitoring for future opportunities.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid gap-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge className="bg-red-100 text-red-800">{alert.severity}</Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{alert.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Current: {alert.current_value}</span>
                        {alert.threshold_value && <span>Threshold: {alert.threshold_value}</span>}
                        <span>Triggered: {new Date(alert.triggered_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => performanceMonitor.resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {alerts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">All systems are operating within normal parameters.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {snapshot && (
            <Card>
              <CardHeader>
                <CardTitle>Resource Performance</CardTitle>
                <CardDescription>Detailed analysis of loaded resources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {snapshot.resources.slice(0, 10).map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{resource.type}</Badge>
                          {resource.blocked && <Badge className="bg-red-100 text-red-800">Slow</Badge>}
                          {resource.cached && <Badge className="bg-green-100 text-green-800">Cached</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 truncate">{resource.name}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{Math.round(resource.duration)}ms</div>
                        <div className="text-xs text-gray-500">{Math.round(resource.size / 1024)}KB</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}