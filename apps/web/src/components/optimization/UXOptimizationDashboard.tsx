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
  TrendingUp,
  Target,
  Zap,
  Clock,
  Users,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Settings,
  Download
} from 'lucide-react';
import { uxOptimizer, UXOptimization, OptimizationReport, OptimizationType, OptimizationPriority } from '@/lib/optimization/ux-optimizer';
import { useComponentTracking } from '@/hooks/useBehaviorTracking';
import { userJourneyAnalytics, JourneyAnalytics } from '@/lib/ux/user-journey-analytics';
import { conversionFunnelTracker, FunnelAnalyticsData } from '@/lib/ux/conversion-funnel';
import { abTestingEngine, ABTestResults } from '@/lib/ux/ab-testing';
import { heatmapAnalytics, HeatmapAnalysis } from '@/lib/ux/heatmap-analytics';

interface UXOptimizationDashboardProps {
  className?: string;
  autoRefresh?: boolean;
}

export function UXOptimizationDashboard({ className = '', autoRefresh = true }: UXOptimizationDashboardProps) {
  const { trackInteraction } = useComponentTracking('UXOptimizationDashboard');

  const [report, setReport] = useState<OptimizationReport | null>(null);
  const [optimizations, setOptimizations] = useState<UXOptimization[]>([]);
  const [quickWins, setQuickWins] = useState<UXOptimization[]>([]);
  const [highImpact, setHighImpact] = useState<UXOptimization[]>([]);
  const [journeyAnalytics, setJourneyAnalytics] = useState<JourneyAnalytics | null>(null);
  const [funnelAnalytics, setFunnelAnalytics] = useState<FunnelAnalyticsData | null>(null);
  const [abTestResults, setAbTestResults] = useState<ABTestResults[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState<OptimizationType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<OptimizationPriority | 'all'>('all');

  useEffect(() => {
    loadOptimizationData();
  }, []);

  const loadOptimizationData = async () => {
    try {
      const dateRange = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };

      const [
        optimizationsData,
        quickWinsData,
        highImpactData,
        journeyData,
        funnelData,
        abTestData,
        heatmapAnalysisData
      ] = await Promise.all([
        uxOptimizer.getOptimizations(),
        uxOptimizer.getQuickWins(),
        uxOptimizer.getHighImpactOpportunities(),
        userJourneyAnalytics.getJourneyAnalytics(dateRange).catch(() => null),
        conversionFunnelTracker.getFunnelAnalytics('will_generator', dateRange).catch(() => null),
        abTestingEngine.getTestResults('default_test').then(result => result ? [result] : []).catch(() => []),
        heatmapAnalytics.getHeatmapData(window?.location?.pathname || '/', dateRange).catch(() => null)
      ]);

      setOptimizations(optimizationsData);
      setQuickWins(quickWinsData);
      setHighImpact(highImpactData);
      setJourneyAnalytics(journeyData);
      setFunnelAnalytics(funnelData);
      setAbTestResults(abTestData);
      setHeatmapData(heatmapAnalysisData);
    } catch (error) {
      console.error('Failed to load optimization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    trackInteraction('run_analysis');

    try {
      const newReport = await uxOptimizer.analyzeUserExperience();
      setReport(newReport);
      await loadOptimizationData(); // Refresh data
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    trackInteraction('update_status', { optimization_id: id, status });

    try {
      await uxOptimizer.updateOptimizationStatus(id, status);
      await loadOptimizationData(); // Refresh data
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getFilteredOptimizations = () => {
    return optimizations.filter(opt => {
      const typeMatch = filterType === 'all' || opt.type === filterType;
      const priorityMatch = filterPriority === 'all' || opt.priority === filterPriority;
      return typeMatch && priorityMatch;
    });
  };

  const getPriorityColor = (priority: OptimizationPriority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800'
    };
    return colors[priority];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      suggested: 'bg-gray-100 text-gray-800',
      planned: 'bg-blue-100 text-blue-800',
      implementing: 'bg-yellow-100 text-yellow-800',
      testing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      dismissed: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || colors.suggested;
  };

  const getEffortIcon = (effort: string) => {
    switch (effort) {
      case 'low':
        return <Zap className="w-4 h-4 text-green-600" />;
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatOptimizationType = (type: OptimizationType) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading optimization data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            UX Optimization Dashboard
          </h2>
          <p className="text-gray-600">Data-driven insights for user experience improvements</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-primary hover:bg-primary/90"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">UX Score</p>
                  <p className="text-2xl font-bold">{report.overall_score}/100</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
              <Progress value={report.overall_score} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Optimizations</p>
                  <p className="text-2xl font-bold">{optimizations.filter(o => o.status !== 'completed' && o.status !== 'dismissed').length}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Quick Wins</p>
                  <p className="text-2xl font-bold">{quickWins.length}</p>
                </div>
                <Zap className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">High Impact</p>
                  <p className="text-2xl font-bold">{highImpact.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
          <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
          <TabsTrigger value="high-impact">High Impact</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
          <TabsTrigger value="funnels">Funnels</TabsTrigger>
          <TabsTrigger value="ab-tests">A/B Tests</TabsTrigger>
          <TabsTrigger value="heatmaps">Heatmaps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {report ? (
            <>
              {/* Key Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Current user experience metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Page Load Time</span>
                        <span className="font-medium">{Math.round(report.metrics.performance.page_load_time)}ms</span>
                      </div>
                      <Progress value={(3000 - report.metrics.performance.page_load_time) / 30} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Bounce Rate</span>
                        <span className="font-medium">{Math.round(report.metrics.usability.bounce_rate * 100)}%</span>
                      </div>
                      <Progress value={(1 - report.metrics.usability.bounce_rate) * 100} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Engagement Rate</span>
                        <span className="font-medium">{report.metrics.engagement.interaction_rate.toFixed(1)}/min</span>
                      </div>
                      <Progress value={Math.min(100, report.metrics.engagement.interaction_rate * 20)} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Conversion Rate</span>
                        <span className="font-medium">{(report.metrics.conversion.conversion_rate * 100).toFixed(2)}%</span>
                      </div>
                      <Progress value={report.metrics.conversion.conversion_rate * 2000} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      Quick Wins ({quickWins.length})
                    </CardTitle>
                    <CardDescription>Low effort, high impact optimizations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {quickWins.slice(0, 3).map((opt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-medium">{opt.title}</h4>
                            <p className="text-sm text-gray-600">{opt.expected_impact}</p>
                          </div>
                          <Button size="sm" onClick={() => handleUpdateStatus(opt.id, 'planned')}>
                            <Play className="w-4 h-4 mr-1" />
                            Start
                          </Button>
                        </div>
                      ))}
                      {quickWins.length === 0 && (
                        <p className="text-gray-600 text-center py-4">No quick wins available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                      High Impact Opportunities ({highImpact.length})
                    </CardTitle>
                    <CardDescription>Critical improvements for maximum ROI</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {highImpact.slice(0, 3).map((opt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium">{opt.title}</h4>
                              <Badge className={getPriorityColor(opt.priority)}>
                                {opt.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{opt.expected_impact}</p>
                          </div>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-1" />
                            Plan
                          </Button>
                        </div>
                      ))}
                      {highImpact.length === 0 && (
                        <p className="text-gray-600 text-center py-4">No high impact opportunities found</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Analysis Data</h3>
                <p className="text-gray-600 mb-4">Run an analysis to get UX optimization recommendations</p>
                <Button onClick={runAnalysis} disabled={analyzing}>
                  {analyzing ? 'Analyzing...' : 'Run UX Analysis'}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="usability">Usability</SelectItem>
                <SelectItem value="accessibility">Accessibility</SelectItem>
                <SelectItem value="engagement">Engagement</SelectItem>
                <SelectItem value="conversion">Conversion</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(value: any) => setFilterPriority(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optimizations List */}
          <div className="grid gap-4">
            {getFilteredOptimizations().map((optimization) => (
              <Card key={optimization.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{optimization.title}</h3>
                        <Badge className={getPriorityColor(optimization.priority)}>
                          {optimization.priority}
                        </Badge>
                        <Badge variant="outline">
                          {formatOptimizationType(optimization.type)}
                        </Badge>
                        <Badge className={getStatusColor(optimization.status)}>
                          {optimization.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{optimization.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          {getEffortIcon(optimization.effort_estimate)}
                          <span className="text-gray-600">Effort:</span>
                          <span className="font-medium">{optimization.effort_estimate}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-1 font-medium">{Math.round(optimization.confidence_score * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Expected Impact:</span>
                          <span className="ml-1 font-medium">
                            {Object.values(optimization.potential_uplift)[0] || 'N/A'}
                            {Object.values(optimization.potential_uplift)[0] && '%'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <span className="ml-1 font-medium">
                            {new Date(optimization.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {optimization.status === 'suggested' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(optimization.id, 'planned')}>
                          Plan
                        </Button>
                      )}
                      {optimization.status === 'planned' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(optimization.id, 'implementing')}>
                          Start
                        </Button>
                      )}
                      {optimization.status === 'implementing' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(optimization.id, 'testing')}>
                          Test
                        </Button>
                      )}
                      {optimization.status === 'testing' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(optimization.id, 'completed')}>
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Problem Statement</h4>
                      <p className="text-sm text-gray-600">{optimization.problem_statement}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Suggested Solution</h4>
                      <p className="text-sm text-gray-600">{optimization.suggested_solution}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Success Metrics</h4>
                      <div className="flex flex-wrap gap-2">
                        {optimization.success_metrics.map((metric, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {optimization.implementation_steps.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Implementation Steps</h4>
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                          {optimization.implementation_steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {getFilteredOptimizations().length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Optimizations Found</h3>
                  <p className="text-gray-600">Run an analysis to discover optimization opportunities</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="quick-wins" className="space-y-6">
          <div className="grid gap-4">
            {quickWins.map((optimization) => (
              <Card key={optimization.id} className="border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold">{optimization.title}</h3>
                        <Badge className="bg-green-100 text-green-800">Quick Win</Badge>
                        <Badge className={getPriorityColor(optimization.priority)}>
                          {optimization.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{optimization.expected_impact}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Effort: {optimization.effort_estimate}</span>
                        <span>Confidence: {Math.round(optimization.confidence_score * 100)}%</span>
                      </div>
                    </div>
                    <Button onClick={() => handleUpdateStatus(optimization.id, 'planned')}>
                      <Play className="w-4 h-4 mr-2" />
                      Start Implementation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {quickWins.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Quick Wins Available</h3>
                  <p className="text-gray-600">Quick wins will appear here when analysis finds low-effort, high-impact opportunities</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="high-impact" className="space-y-6">
          <div className="grid gap-4">
            {highImpact.map((optimization) => (
              <Card key={optimization.id} className="border-purple-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h3 className="font-semibold">{optimization.title}</h3>
                        <Badge className="bg-purple-100 text-purple-800">High Impact</Badge>
                        <Badge className={getPriorityColor(optimization.priority)}>
                          {optimization.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3">{optimization.expected_impact}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <span>Effort: {optimization.effort_estimate}</span>
                        <span>Confidence: {Math.round(optimization.confidence_score * 100)}%</span>
                        <span>
                          Potential Uplift: {Object.values(optimization.potential_uplift)[0] || 'N/A'}
                          {Object.values(optimization.potential_uplift)[0] && '%'}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Plan Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {highImpact.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No High Impact Opportunities</h3>
                  <p className="text-gray-600">High impact opportunities will appear here when analysis identifies critical improvements</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          {journeyAnalytics ? (
            <div className="grid gap-6">
              {/* Journey Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold">{journeyAnalytics.total_sessions.toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Unique Users</p>
                        <p className="text-2xl font-bold">{journeyAnalytics.unique_users.toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Session Duration</p>
                        <p className="text-2xl font-bold">{Math.round(journeyAnalytics.average_session_duration / 1000 / 60)}m</p>
                      </div>
                      <Clock className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Bounce Rate</p>
                        <p className="text-2xl font-bold">{(journeyAnalytics.bounce_rate * 100).toFixed(1)}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Most Common Paths */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Common User Paths</CardTitle>
                  <CardDescription>Top user navigation patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {journeyAnalytics.most_common_paths.slice(0, 5).map((path, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{path.path.join(' → ')}</div>
                          <div className="text-sm text-gray-600">
                            {path.frequency} sessions • {(path.conversion_rate * 100).toFixed(1)}% conversion rate
                          </div>
                        </div>
                        <Badge variant="outline">{path.frequency}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Drop-off Points */}
              <Card>
                <CardHeader>
                  <CardTitle>Drop-off Analysis</CardTitle>
                  <CardDescription>Pages with highest exit rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {journeyAnalytics.drop_off_points.slice(0, 5).map((point, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{point.page}</div>
                          <div className="text-sm text-gray-600">{point.total_visits} total visits</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-red-600">{(point.drop_rate * 100).toFixed(1)}%</div>
                          <div className="text-sm text-gray-600">drop rate</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Journey Data</h3>
                <p className="text-gray-600">User journey data will appear here once tracking is active</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="funnels" className="space-y-6">
          {funnelAnalytics ? (
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Funnel Performance: {funnelAnalytics.funnel_name}</CardTitle>
                  <CardDescription>Conversion funnel analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{funnelAnalytics.total_entries.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Total Entries</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{funnelAnalytics.total_completions.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Completions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{(funnelAnalytics.completion_rate * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Conversion Rate</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {funnelAnalytics.step_performance.map((step, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{step.step_name}</h4>
                          <Badge className={step.conversion_rate > 0.5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {(step.conversion_rate * 100).toFixed(1)}%
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Entries:</span>
                            <span className="ml-1 font-medium">{step.entries.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Completions:</span>
                            <span className="ml-1 font-medium">{step.completions.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Drop-offs:</span>
                            <span className="ml-1 font-medium">{step.drop_offs.toLocaleString()}</span>
                          </div>
                        </div>
                        <Progress value={step.conversion_rate * 100} className="mt-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {funnelAnalytics.optimization_recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Funnel Data</h3>
                <p className="text-gray-600">Funnel analytics will appear here once tracking is configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ab-tests" className="space-y-6">
          {abTestResults.length > 0 ? (
            <div className="space-y-6">
              {abTestResults.map((test, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{test.test_name}</span>
                      <Badge className={
                        test.statistical_significance > 0.95 ? 'bg-green-100 text-green-800' :
                        test.statistical_significance > 0.8 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {(test.statistical_significance * 100).toFixed(0)}% significant
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {test.duration_days.toFixed(0)} days • {test.total_participants} participants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {test.variants_performance.map((variant, vIndex) => (
                        <div key={vIndex} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{variant.variant_name}</h4>
                            <div className="flex items-center gap-2">
                              {variant.lift_vs_control !== undefined && (
                                <Badge variant="outline">
                                  {variant.lift_vs_control > 0 ? '+' : ''}{variant.lift_vs_control.toFixed(1)}% lift
                                </Badge>
                              )}
                              <Badge className={variant.conversion_rate > 0.1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {(variant.conversion_rate * 100).toFixed(2)}% CR
                              </Badge>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Participants:</span>
                              <span className="ml-1 font-medium">{variant.participants.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Conversions:</span>
                              <span className="ml-1 font-medium">{variant.conversions.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Significance:</span>
                              <span className="ml-1 font-medium">{(variant.statistical_significance * 100).toFixed(1)}%</span>
                            </div>
                          </div>
                          <Progress value={variant.conversion_rate * 1000} className="mt-2" />
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Recommendation</h4>
                      <p className="text-sm text-blue-800">
                        {test.recommended_action === 'stop_winner' && test.winner_variant_id &&
                          `Implement ${test.variants_performance.find(v => v.variant_id === test.winner_variant_id)?.variant_name} as the winner`}
                        {test.recommended_action === 'continue' && 'Continue running the test for more data'}
                        {test.recommended_action === 'stop_no_winner' && 'Stop test - no clear winner found'}
                        {test.recommended_action === 'need_more_data' && 'Collect more data before making decisions'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No A/B Tests</h3>
                <p className="text-gray-600">A/B test results will appear here once tests are running</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-6">
          {heatmapData ? (
            <div className="grid gap-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Sessions</p>
                        <p className="text-2xl font-bold">{heatmapData.total_sessions.toLocaleString()}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Click Zones</p>
                        <p className="text-2xl font-bold">{heatmapData.click_zones.length}</p>
                      </div>
                      <Target className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Rage Clicks</p>
                        <p className="text-2xl font-bold text-red-600">{heatmapData.rage_clicks.length}</p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Avg Scroll Depth</p>
                        <p className="text-2xl font-bold">{heatmapData.scroll_behavior.average_scroll_depth.toFixed(0)}%</p>
                      </div>
                      <ArrowDown className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Scroll Behavior Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{(heatmapData.scroll_behavior.bounce_at_fold * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Bounce at Fold</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{(heatmapData.scroll_behavior.full_page_readers * 100).toFixed(1)}%</div>
                      <div className="text-sm text-gray-600">Full Page Readers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{heatmapData.scroll_behavior.average_scroll_depth.toFixed(0)}%</div>
                      <div className="text-sm text-gray-600">Avg Scroll Depth</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {heatmapData.rage_clicks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600">Rage Click Analysis</CardTitle>
                    <CardDescription>Areas of user frustration requiring attention</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {heatmapData.rage_clicks.slice(0, 5).map((rageClick, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-red-200 rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">
                              {rageClick.element_selector || `Position (${rageClick.x}, ${rageClick.y})`}
                            </div>
                            <div className="text-sm text-gray-600">
                              {rageClick.count} rage clicks • {rageClick.sessions_affected} sessions affected
                            </div>
                          </div>
                          <Badge className="bg-red-100 text-red-800">
                            Priority
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <div className="space-y-2">
                        {heatmapData.insights.map((insight, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {heatmapData.recommendations.map((rec, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Heatmap Data</h3>
                <p className="text-gray-600">Heatmap analytics will appear here once tracking is active</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}