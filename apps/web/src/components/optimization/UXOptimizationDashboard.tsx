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
      const [optimizationsData, quickWinsData, highImpactData] = await Promise.all([
        uxOptimizer.getOptimizations(),
        uxOptimizer.getQuickWins(),
        uxOptimizer.getHighImpactOpportunities()
      ]);

      setOptimizations(optimizationsData);
      setQuickWins(quickWinsData);
      setHighImpact(highImpactData);
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="optimizations">All Optimizations</TabsTrigger>
          <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
          <TabsTrigger value="high-impact">High Impact</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
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

        <TabsContent value="insights" className="space-y-6">
          {report ? (
            <>
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.performance_insights.length > 0 ? (
                      <ul className="space-y-2">
                        {report.performance_insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No performance insights available</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Journey Issues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.user_journey_issues.length > 0 ? (
                      <ul className="space-y-2">
                        {report.user_journey_issues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No user journey issues detected</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {report.recommendations_summary.length > 0 ? (
                      <ul className="space-y-2">
                        {report.recommendations_summary.map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-600">No recommendations available</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Insights Available</h3>
                <p className="text-gray-600">Run an analysis to generate insights and recommendations</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}