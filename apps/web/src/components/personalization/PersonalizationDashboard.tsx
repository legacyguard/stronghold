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
  Brain,
  Users,
  Target,
  Zap,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Eye,
  Lightbulb,
  Layers,
  Activity,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Play,
  Pause,
  RefreshCw,
  Download
} from 'lucide-react';
import { dynamicContentOptimizer, ContentRecommendation, ContentPerformanceAnalysis } from '@/lib/content/dynamic-content-optimizer';
import { behaviorPersonalizationEngine, UserBehaviorProfile, PersonalizationStrategy } from '@/lib/personalization/behavior-personalization';
import { contentPerformanceAnalytics, ContentMetrics, ContentComparison } from '@/lib/content/content-performance-analytics';
import { adaptiveUIEngine, RealTimeAdaptationDecision, UIPersonalizationState } from '@/lib/ui/adaptive-ui-components';

interface PersonalizationDashboardProps {
  className?: string;
  autoRefresh?: boolean;
}

export function PersonalizationDashboard({ className = '', autoRefresh = true }: PersonalizationDashboardProps) {
  const [contentRecommendations, setContentRecommendations] = useState<ContentRecommendation[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserBehaviorProfile[]>([]);
  const [contentMetrics, setContentMetrics] = useState<ContentMetrics[]>([]);
  const [contentComparison, setContentComparison] = useState<ContentComparison | null>(null);
  const [adaptationDecisions, setAdaptationDecisions] = useState<RealTimeAdaptationDecision[]>([]);
  const [personalizationStates, setPersonalizationStates] = useState<UIPersonalizationState[]>([]);
  const [strategies, setStrategies] = useState<PersonalizationStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedSegment, setSelectedSegment] = useState('all');

  useEffect(() => {
    loadPersonalizationData();
    if (autoRefresh) {
      const interval = setInterval(loadPersonalizationData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedTimeRange]);

  const loadPersonalizationData = async () => {
    try {
      const dateRange = getDateRange(selectedTimeRange);

      // Load all personalization data
      await Promise.all([
        loadContentData(dateRange),
        loadUserBehaviorData(),
        loadAdaptationData(),
        loadStrategyData()
      ]);
    } catch (error) {
      console.error('Failed to load personalization data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContentData = async (dateRange: { start: Date; end: Date }) => {
    try {
      // Get content performance metrics for top content pieces
      const topContentIds = ['home', 'will-generator', 'family-shield', 'pricing'];

      const metrics = await Promise.all(
        topContentIds.map(id =>
          contentPerformanceAnalytics.getContentMetrics(id, dateRange).catch(() => null)
        )
      );

      setContentMetrics(metrics.filter(Boolean) as ContentMetrics[]);

      // Get content comparison
      const comparison = await contentPerformanceAnalytics.compareContent(topContentIds, dateRange);
      setContentComparison(comparison);

      // Get content recommendations
      const recommendations = await Promise.all(
        topContentIds.map(async id => {
          try {
            return await dynamicContentOptimizer.getOptimalContent(id, 'current_user', {
              session_id: 'current_session',
              device_type: 'desktop'
            });
          } catch {
            return null;
          }
        })
      );

      setContentRecommendations(recommendations.filter(Boolean) as ContentRecommendation[]);
    } catch (error) {
      console.error('Failed to load content data:', error);
    }
  };

  const loadUserBehaviorData = async () => {
    try {
      // In a real implementation, this would load actual user profiles
      const mockProfiles: UserBehaviorProfile[] = [
        {
          user_id: 'user_1',
          session_id: 'session_1',
          current_patterns: ['quick_decision_maker'],
          behavior_score: {
            engagement: 0.8,
            intent: 0.7,
            urgency: 0.9,
            knowledge_level: 0.6
          },
          interaction_history: [],
          preferences_inferred: {
            content_complexity: 'simple',
            interaction_style: 'action_oriented',
            decision_speed: 'quick'
          },
          personalization_state: {
            current_strategy: 'quick_conversion',
            adaptations_applied: ['simplified_ui', 'prominent_cta'],
            effectiveness_score: 0.75,
            last_adaptation: new Date()
          },
          predictive_insights: {
            likely_next_actions: [
              { action: 'start_will_generator', probability: 0.8, timing_estimate: 60000 },
              { action: 'view_pricing', probability: 0.6, timing_estimate: 120000 }
            ],
            conversion_probability: 0.7,
            churn_risk: 0.2,
            value_potential: 0.8
          }
        }
      ];

      setUserProfiles(mockProfiles);
    } catch (error) {
      console.error('Failed to load user behavior data:', error);
    }
  };

  const loadAdaptationData = async () => {
    try {
      // Get real-time adaptation decisions
      const mockDecisions: RealTimeAdaptationDecision[] = [
        {
          component_id: 'hero_cta',
          recommended_variant: 'urgent_style',
          confidence_score: 0.85,
          reasoning: ['High urgency behavior pattern', 'Quick decision maker profile'],
          expected_performance: {
            engagement_lift: 0.25,
            conversion_impact: 0.15,
            user_satisfaction: 0.8
          },
          implementation_urgency: 'immediate',
          fallback_options: ['default_style', 'friendly_style']
        }
      ];

      setAdaptationDecisions(mockDecisions);

      // Get personalization states
      const mockStates: UIPersonalizationState[] = [
        {
          user_id: 'user_1',
          session_id: 'session_1',
          active_adaptations: [
            {
              component_id: 'hero_cta',
              variant_id: 'urgent_style',
              adaptation_reason: 'behavioral_match',
              applied_at: new Date(),
              effectiveness_score: 0.75
            }
          ],
          adaptation_history: [],
          user_preferences: {
            preferred_layouts: ['compact'],
            preferred_interactions: ['direct'],
            accessibility_needs: [],
            performance_preferences: ['fast_loading']
          },
          context_awareness: {
            device_capabilities: { screen_size: 'large', touch: false },
            network_conditions: { speed: 'fast' },
            time_constraints: { available_time: 'medium' },
            usage_patterns: { frequency: 'first_time' }
          }
        }
      ];

      setPersonalizationStates(mockStates);
    } catch (error) {
      console.error('Failed to load adaptation data:', error);
    }
  };

  const loadStrategyData = async () => {
    try {
      // Load personalization strategies
      const mockStrategies: PersonalizationStrategy[] = [
        {
          id: 'quick_conversion',
          name: 'Quick Conversion Strategy',
          description: 'Optimized for users with high urgency and quick decision patterns',
          target_behaviors: ['quick_decision_maker', 'high_intent'],
          adaptation_rules: [
            {
              trigger: 'high_urgency_score',
              modification_type: 'content',
              changes: { tone: 'direct', cta_style: 'prominent' },
              priority: 1
            }
          ],
          success_criteria: {
            primary_metric: 'conversion_rate',
            target_improvement: 0.2,
            measurement_period: 14
          },
          is_active: true
        }
      ];

      setStrategies(mockStrategies);
    } catch (error) {
      console.error('Failed to load strategy data:', error);
    }
  };

  const getDateRange = (range: string): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (range) {
      case '1d':
        start.setDate(start.getDate() - 1);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case '90d':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  };

  const calculateOverallPersonalizationScore = (): number => {
    if (userProfiles.length === 0) return 0;

    const avgEffectiveness = userProfiles.reduce((sum, profile) =>
      sum + profile.personalization_state.effectiveness_score, 0
    ) / userProfiles.length;

    return Math.round(avgEffectiveness * 100);
  };

  const getActiveAdaptationsCount = (): number => {
    return personalizationStates.reduce((sum, state) =>
      sum + state.active_adaptations.length, 0
    );
  };

  const getConversionUplift = (): number => {
    return contentComparison?.trends.find(t => t.metric === 'conversion_rate')?.change_percentage || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading personalization data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Personalization Intelligence Dashboard
          </h2>
          <p className="text-gray-600">AI-driven content and experience optimization</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadPersonalizationData} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Personalization Score</p>
                <p className="text-2xl font-bold">{calculateOverallPersonalizationScore()}/100</p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
            <Progress value={calculateOverallPersonalizationScore()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Adaptations</p>
                <p className="text-2xl font-bold">{getActiveAdaptationsCount()}</p>
              </div>
              <Zap className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Conversion Uplift</p>
                <p className="text-2xl font-bold text-green-600">+{getConversionUplift().toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">User Segments</p>
                <p className="text-2xl font-bold">{userProfiles.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content Intelligence</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="adaptations">Live Adaptations</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Real-Time Insights
                </CardTitle>
                <CardDescription>Current personalization activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adaptationDecisions.slice(0, 3).map((decision, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{decision.component_id}</h4>
                        <p className="text-sm text-gray-600">
                          Confidence: {(decision.confidence_score * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Badge className={
                        decision.implementation_urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                        decision.implementation_urgency === 'next_interaction' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {decision.implementation_urgency}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-600" />
                  Content Recommendations
                </CardTitle>
                <CardDescription>Optimized content suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contentRecommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{rec.content_id}</h4>
                        <p className="text-sm text-gray-600">
                          Expected uplift: {(rec.expected_performance.conversion_probability * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Badge variant="outline">
                        {(rec.confidence_score * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Personalization Performance Trends</CardTitle>
              <CardDescription>Key metrics over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {contentComparison?.trends.map((trend, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      {trend.direction === 'increasing' ? (
                        <ArrowUp className="w-5 h-5 text-green-600" />
                      ) : trend.direction === 'decreasing' ? (
                        <ArrowDown className="w-5 h-5 text-red-600" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div className="text-sm font-medium">{trend.metric.replace('_', ' ')}</div>
                    <div className={`text-lg font-bold ${
                      trend.direction === 'increasing' ? 'text-green-600' :
                      trend.direction === 'decreasing' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {trend.change_percentage > 0 ? '+' : ''}{trend.change_percentage.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Content Performance Analysis</CardTitle>
              <CardDescription>AI-optimized content insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentMetrics.map((metric, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{metric.content_id}</h3>
                      <Badge className={
                        metric.conversion_metrics.conversion_rate > 0.1 ? 'bg-green-100 text-green-800' :
                        metric.conversion_metrics.conversion_rate > 0.05 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {(metric.conversion_metrics.conversion_rate * 100).toFixed(2)}% CR
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Views:</span>
                        <span className="ml-1 font-medium">{metric.performance_data.views.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Engagement:</span>
                        <span className="ml-1 font-medium">{(metric.engagement_metrics.interaction_rate * 100).toFixed(1)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Time on Page:</span>
                        <span className="ml-1 font-medium">{Math.round(metric.engagement_metrics.average_read_time)}s</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Scroll Depth:</span>
                        <span className="ml-1 font-medium">{(metric.engagement_metrics.scroll_completion_rate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Content Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Content Recommendations</CardTitle>
              <CardDescription>Personalized content suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentRecommendations.map((rec, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{rec.content_id}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rec.variant_id}</Badge>
                        <Badge className="bg-purple-100 text-purple-800">
                          {(rec.confidence_score * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h4 className="text-sm font-medium">Reasoning:</h4>
                        <ul className="text-sm text-gray-600 ml-4">
                          {rec.reasoning.map((reason, idx) => (
                            <li key={idx} className="list-disc">{reason}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span>Expected CTR: <strong>{(rec.expected_performance.click_probability * 100).toFixed(1)}%</strong></span>
                        <span>Conversion Probability: <strong>{(rec.expected_performance.conversion_probability * 100).toFixed(1)}%</strong></span>
                        <span>Engagement Score: <strong>{rec.expected_performance.engagement_score.toFixed(0)}</strong></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          {/* User Behavior Profiles */}
          <Card>
            <CardHeader>
              <CardTitle>User Behavior Analysis</CardTitle>
              <CardDescription>Real-time user behavior insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {userProfiles.map((profile, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">User {profile.user_id}</h3>
                      <div className="flex items-center gap-2">
                        {profile.current_patterns.map((pattern, idx) => (
                          <Badge key={idx} variant="outline">{pattern.replace('_', ' ')}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-600">Engagement</div>
                        <div className="flex items-center">
                          <Progress value={profile.behavior_score.engagement * 100} className="flex-1 mr-2" />
                          <span className="text-sm font-medium">{(profile.behavior_score.engagement * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Intent</div>
                        <div className="flex items-center">
                          <Progress value={profile.behavior_score.intent * 100} className="flex-1 mr-2" />
                          <span className="text-sm font-medium">{(profile.behavior_score.intent * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Urgency</div>
                        <div className="flex items-center">
                          <Progress value={profile.behavior_score.urgency * 100} className="flex-1 mr-2" />
                          <span className="text-sm font-medium">{(profile.behavior_score.urgency * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Knowledge Level</div>
                        <div className="flex items-center">
                          <Progress value={profile.behavior_score.knowledge_level * 100} className="flex-1 mr-2" />
                          <span className="text-sm font-medium">{(profile.behavior_score.knowledge_level * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Preferences</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Style: {profile.preferences_inferred.interaction_style.replace('_', ' ')}</div>
                          <div>Speed: {profile.preferences_inferred.decision_speed.replace('_', ' ')}</div>
                          <div>Complexity: {profile.preferences_inferred.content_complexity}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Predictions</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Conversion: {(profile.predictive_insights.conversion_probability * 100).toFixed(0)}%</div>
                          <div>Churn Risk: {(profile.predictive_insights.churn_risk * 100).toFixed(0)}%</div>
                          <div>Value Potential: {(profile.predictive_insights.value_potential * 100).toFixed(0)}%</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Next Actions</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          {profile.predictive_insights.likely_next_actions.slice(0, 2).map((action, idx) => (
                            <div key={idx}>
                              {action.action.replace('_', ' ')}: {(action.probability * 100).toFixed(0)}%
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adaptations" className="space-y-6">
          {/* Live Adaptations */}
          <Card>
            <CardHeader>
              <CardTitle>Real-Time UI Adaptations</CardTitle>
              <CardDescription>Live component optimizations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {adaptationDecisions.map((decision, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{decision.component_id.replace('_', ' ')}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          decision.confidence_score > 0.8 ? 'bg-green-100 text-green-800' :
                          decision.confidence_score > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {(decision.confidence_score * 100).toFixed(0)}% confidence
                        </Badge>
                        <Badge variant="outline">{decision.recommended_variant}</Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Reasoning</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {decision.reasoning.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Expected Impact</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>Engagement Lift: <strong>+{(decision.expected_performance.engagement_lift * 100).toFixed(1)}%</strong></div>
                          <div>Conversion Impact: <strong>+{(decision.expected_performance.conversion_impact * 100).toFixed(1)}%</strong></div>
                          <div>User Satisfaction: <strong>{(decision.expected_performance.user_satisfaction * 100).toFixed(0)}%</strong></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Implementation: {decision.implementation_urgency}</span>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline">
                            <Play className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                          <Button size="sm" variant="outline">
                            <Pause className="w-3 h-3 mr-1" />
                            Test
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Personalization States */}
          <Card>
            <CardHeader>
              <CardTitle>Active Personalization States</CardTitle>
              <CardDescription>Current user adaptations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {personalizationStates.map((state, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">User {state.user_id}</h3>
                      <Badge variant="outline">{state.active_adaptations.length} active adaptations</Badge>
                    </div>

                    <div className="space-y-3">
                      {state.active_adaptations.map((adaptation, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{adaptation.component_id}</span>
                            <span className="text-sm text-gray-600 ml-2">({adaptation.variant_id})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={adaptation.effectiveness_score * 100} className="w-16" />
                            <span className="text-sm">{(adaptation.effectiveness_score * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          {/* Personalization Strategies */}
          <Card>
            <CardHeader>
              <CardTitle>Personalization Strategies</CardTitle>
              <CardDescription>Active optimization strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies.map((strategy, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{strategy.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={strategy.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {strategy.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Settings className="w-3 h-3 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Target Behaviors</h4>
                        <div className="flex flex-wrap gap-1">
                          {strategy.target_behaviors.map((behavior, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {behavior.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Success Criteria</h4>
                        <div className="text-sm text-gray-600">
                          <div>Primary Metric: {strategy.success_criteria.primary_metric.replace('_', ' ')}</div>
                          <div>Target: +{(strategy.success_criteria.target_improvement * 100).toFixed(0)}%</div>
                          <div>Period: {strategy.success_criteria.measurement_period} days</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Personalization Performance Summary</CardTitle>
              <CardDescription>Overall optimization impact</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">+{getConversionUplift().toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Conversion Rate Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{calculateOverallPersonalizationScore()}%</div>
                  <div className="text-sm text-gray-600">Personalization Effectiveness</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{getActiveAdaptationsCount()}</div>
                  <div className="text-sm text-gray-600">Active Optimizations</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Performance Comparison */}
          {contentComparison && (
            <Card>
              <CardHeader>
                <CardTitle>Content Performance Comparison</CardTitle>
                <CardDescription>Best and worst performing content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3 text-green-600">Top Performers</h4>
                    <div className="space-y-2">
                      {contentComparison.best_performers.map((performer, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <span className="text-sm">{performer.content_id}</span>
                          <span className="text-sm font-medium text-green-600">
                            {performer.metric}: {performer.value.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-red-600">Needs Optimization</h4>
                    <div className="space-y-2">
                      {contentComparison.underperformers.map((underperformer, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{underperformer.content_id}</span>
                            <Badge className={`${
                              underperformer.priority_level === 'high' ? 'bg-red-100 text-red-800' :
                              underperformer.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {underperformer.priority_level}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600">
                            {underperformer.issues.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}