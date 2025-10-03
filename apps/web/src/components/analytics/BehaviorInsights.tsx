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
  MousePointer,
  Eye,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  LineChart,
  PieChart,
  Zap
} from 'lucide-react';
import { BehaviorTracker, BehaviorPattern, HeatmapData, UserSession } from '@/lib/analytics/behavior-tracker';
import { useBehaviorTracking, useComponentTracking } from '@/hooks/useBehaviorTracking';

interface BehaviorInsightsProps {
  className?: string;
  timeframe?: number;
  showRealTime?: boolean;
}

interface InsightCard {
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  description: string;
}

export function BehaviorInsights({ className = '', timeframe = 7, showRealTime = true }: BehaviorInsightsProps) {
  const { isTracking } = useBehaviorTracking();
  const { trackInteraction } = useComponentTracking('BehaviorInsights');

  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [sessionData, setSessionData] = useState<UserSession | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadBehaviorData();
  }, [selectedTimeframe]);

  const loadBehaviorData = async () => {
    setLoading(true);
    trackInteraction('load_data', { timeframe: selectedTimeframe });

    try {
      const [patternsData, heatmapDataResult, sessionDataResult] = await Promise.all([
        BehaviorTracker.analyzeBehaviorPatterns(selectedTimeframe),
        BehaviorTracker.generateHeatmapData(window.location.pathname, selectedTimeframe),
        BehaviorTracker.getInstance().getSessionData()
      ]);

      setPatterns(patternsData);
      setHeatmapData(heatmapDataResult);
      setSessionData(sessionDataResult);

      // Generate insights
      generateInsights(patternsData, sessionDataResult);

    } catch (error) {
      console.error('Failed to load behavior data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (patterns: BehaviorPattern[], session: UserSession) => {
    const mockInsights: InsightCard[] = [
      {
        title: 'Session Duration',
        value: `${Math.round(session.total_duration / 1000 / 60)}m`,
        change: 12.5,
        trend: 'up',
        icon: Clock,
        description: 'Average time users spend on the platform'
      },
      {
        title: 'Page Views',
        value: session.page_views,
        change: -2.1,
        trend: 'down',
        icon: Eye,
        description: 'Number of pages viewed in session'
      },
      {
        title: 'Interactions',
        value: session.interactions_count,
        change: 8.3,
        trend: 'up',
        icon: MousePointer,
        description: 'User interactions tracked'
      },
      {
        title: 'Bounce Rate',
        value: `${Math.round(session.bounce_rate * 100)}%`,
        change: -5.2,
        trend: 'up',
        icon: TrendingUp,
        description: 'Percentage of single-page sessions'
      },
      {
        title: 'Engagement Score',
        value: Math.round(85 + Math.random() * 10),
        change: 4.7,
        trend: 'up',
        icon: Target,
        description: 'Overall user engagement rating'
      },
      {
        title: 'Conversion Rate',
        value: `${(2.1 + Math.random() * 2).toFixed(1)}%`,
        change: 1.3,
        trend: 'up',
        icon: Zap,
        description: 'Percentage of sessions with conversions'
      }
    ];

    setInsights(mockInsights);
  };

  const formatPatternType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPatternTypeColor = (type: string) => {
    const colors = {
      navigation: 'bg-blue-100 text-blue-800',
      engagement: 'bg-green-100 text-green-800',
      conversion: 'bg-purple-100 text-purple-800',
      abandonment: 'bg-red-100 text-red-800',
      error: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading behavior insights...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Behavior Insights</h2>
          <p className="text-gray-600">Real-time user behavior analytics and patterns</p>
        </div>
        <div className="flex items-center gap-2">
          {isTracking && (
            <Badge className="bg-green-100 text-green-800">
              <Activity className="w-3 h-3 mr-1" />
              Live Tracking
            </Badge>
          )}
          <Select value={selectedTimeframe.toString()} onValueChange={(value) => setSelectedTimeframe(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
          <TabsTrigger value="session">Session</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{insight.title}</p>
                      <p className="text-2xl font-bold">{insight.value}</p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(insight.trend)}
                        <span className={`text-sm ${insight.trend === 'up' ? 'text-green-600' : insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {insight.change > 0 ? '+' : ''}{insight.change}%
                        </span>
                      </div>
                    </div>
                    <insight.icon className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for behavior analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" onClick={() => trackInteraction('export_data')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" onClick={() => trackInteraction('view_reports')}>
                  <LineChart className="w-4 h-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline" onClick={() => trackInteraction('setup_alerts')}>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Setup Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid gap-4">
            {patterns.map((pattern, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{pattern.description}</h3>
                        <Badge className={getPatternTypeColor(pattern.pattern_type)}>
                          {formatPatternType(pattern.pattern_type)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Frequency:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.frequency * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.confidence_score * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.success_rate * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Duration:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.average_duration / 1000)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Action Sequence</h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.actions_sequence.map((action, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {action}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {pattern.insights.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Insights</h4>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          {pattern.insights.map((insight, idx) => (
                            <li key={idx}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {pattern.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                        <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                          {pattern.recommendations.map((recommendation, idx) => (
                            <li key={idx}>{recommendation}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {patterns.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Patterns Found</h3>
                  <p className="text-gray-600">Collect more user interaction data to identify behavior patterns.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Page Heatmap Data</CardTitle>
              <CardDescription>Click and hover interaction data for current page</CardDescription>
            </CardHeader>
            <CardContent>
              {heatmapData.length > 0 ? (
                <div className="space-y-4">
                  {heatmapData.map((data, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{data.element_selector}</h4>
                        <Badge>Coverage: {Math.round(data.viewport_coverage * 100)}%</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Clicks:</span>
                          <span className="ml-1 font-medium">{data.click_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Hovers:</span>
                          <span className="ml-1 font-medium">{data.hover_count}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Attention:</span>
                          <span className="ml-1 font-medium">{Math.round(data.attention_duration / 1000)}s</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Progress value={(data.click_count / 200) * 100} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MousePointer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Heatmap Data</h3>
                  <p className="text-gray-600">Interaction data will appear here as users engage with the page.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-6">
          {sessionData && (
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Session</CardTitle>
                  <CardDescription>Real-time session information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Session ID:</span>
                        <p className="font-mono text-sm">{sessionData.id}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Start Time:</span>
                        <p>{new Date(sessionData.start_time).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Duration:</span>
                        <p>{Math.round(sessionData.total_duration / 1000 / 60)} minutes</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Page Views:</span>
                        <p>{sessionData.page_views}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Interactions:</span>
                        <p>{sessionData.interactions_count}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Device:</span>
                        <p>{sessionData.device_info.platform}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Screen:</span>
                        <p>{sessionData.device_info.screen_resolution}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Language:</span>
                        <p>{sessionData.device_info.language}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}