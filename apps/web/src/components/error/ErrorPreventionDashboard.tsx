'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Zap,
  Activity,
  Brain,
  Target,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { ErrorPrevention, ErrorPattern, ErrorPrediction, PreventionStrategy } from '@/lib/error/error-prevention';
import { useComponentTracking } from '@/hooks/useBehaviorTracking';

interface ErrorPreventionDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function ErrorPreventionDashboard({
  className = '',
  autoRefresh = true,
  refreshInterval = 30000
}: ErrorPreventionDashboardProps) {
  const { trackInteraction } = useComponentTracking('ErrorPreventionDashboard');

  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [predictions, setPredictions] = useState<ErrorPrediction[]>([]);
  const [strategies, setStrategies] = useState<PreventionStrategy[]>([]);
  const [systemHealth, setSystemHealth] = useState({
    error_prevention_score: 0,
    active_predictions: 0,
    prevention_success_rate: 0,
    system_stability: 'stable' as 'stable' | 'warning' | 'critical'
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    loadPreventionData();

    if (autoRefresh && isMonitoring) {
      const interval = setInterval(loadPreventionData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isMonitoring]);

  const loadPreventionData = async () => {
    try {
      const [patternsData, predictionsData, strategiesData, healthData] = await Promise.all([
        ErrorPrevention.getErrorPatterns(),
        ErrorPrevention.predictErrors(60), // Next 60 minutes
        ErrorPrevention.getPreventionStrategies(),
        ErrorPrevention.getSystemHealth()
      ]);

      setPatterns(patternsData);
      setPredictions(predictionsData);
      setStrategies(strategiesData);
      setSystemHealth(healthData);
    } catch (error) {
      console.error('Failed to load prevention data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyStrategy = async (strategyId: string) => {
    trackInteraction('apply_strategy', { strategy_id: strategyId });

    try {
      const success = await ErrorPrevention.applyPreventionStrategy(strategyId);
      if (success) {
        await loadPreventionData(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to apply strategy:', error);
    }
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    trackInteraction('toggle_monitoring', { monitoring: !isMonitoring });
  };

  const getStabilityColor = (stability: string) => {
    switch (stability) {
      case 'stable':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStabilityIcon = (stability: string) => {
    switch (stability) {
      case 'stable':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getPredictionColor = (probability: number) => {
    if (probability >= 0.8) return 'text-red-600 bg-red-100';
    if (probability >= 0.5) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const formatTimeToOccurrence = (minutes: number) => {
    if (minutes < 1) return 'Immediate';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60)}h`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2">Loading prevention data...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Error Prevention Dashboard
          </h2>
          <p className="text-gray-600">Intelligent error prediction and prevention system</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStabilityColor(systemHealth.system_stability)}>
            {getStabilityIcon(systemHealth.system_stability)}
            {systemHealth.system_stability.toUpperCase()}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleMonitoring}
          >
            {isMonitoring ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isMonitoring ? 'Pause' : 'Start'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPreventionData}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Prevention Score</p>
                <p className="text-2xl font-bold">{systemHealth.error_prevention_score}%</p>
              </div>
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <Progress value={systemHealth.error_prevention_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Predictions</p>
                <p className="text-2xl font-bold">{systemHealth.active_predictions}</p>
              </div>
              <Brain className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{systemHealth.prevention_success_rate}%</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
            <Progress value={systemHealth.prevention_success_rate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">System Status</p>
                <p className="text-lg font-semibold">{systemHealth.system_stability}</p>
              </div>
              {getStabilityIcon(systemHealth.system_stability)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Recent Predictions */}
          <Card>
            <CardHeader>
              <CardTitle>High Risk Predictions</CardTitle>
              <CardDescription>Errors likely to occur in the next hour</CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.slice(0, 3).map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg mb-2 last:mb-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getPredictionColor(prediction.probability)}>
                        {Math.round(prediction.probability * 100)}% risk
                      </Badge>
                      <span className="font-medium">{prediction.predicted_error_type.replace('_', ' ')}</span>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeToOccurrence(prediction.time_to_occurrence)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {prediction.prevention_recommendations.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
              {predictions.length === 0 && (
                <div className="text-center py-4 text-gray-600">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  No high-risk predictions detected
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Strategies */}
          <Card>
            <CardHeader>
              <CardTitle>Most Effective Strategies</CardTitle>
              <CardDescription>Prevention strategies with highest success rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {strategies.slice(0, 3).map((strategy, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{strategy.description}</span>
                        <Badge variant="outline">{strategy.strategy_type}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Success: {Math.round(strategy.success_rate * 100)}%</span>
                        <span>Effectiveness: {Math.round(strategy.effectiveness_score * 100)}%</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApplyStrategy(strategy.id)}
                    >
                      <Zap className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-4">
            {predictions.map((prediction, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{prediction.predicted_error_type.replace('_', ' ')}</h3>
                        <Badge className={getPredictionColor(prediction.probability)}>
                          {Math.round(prediction.probability * 100)}% probability
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeToOccurrence(prediction.time_to_occurrence)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Confidence:</span>
                          <span className="ml-1 font-medium">{prediction.confidence_level}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Risk Factors:</span>
                          <span className="ml-1 font-medium">{prediction.risk_factors.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Triggering Conditions</h4>
                      <div className="flex flex-wrap gap-2">
                        {prediction.triggering_conditions.map((condition, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Prevention Recommendations</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {prediction.prevention_recommendations.map((recommendation, idx) => (
                          <li key={idx}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>

                    {prediction.risk_factors.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Risk Factors</h4>
                        <div className="space-y-2">
                          {prediction.risk_factors.map((factor, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>{factor.factor}</span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={(factor.current_value / factor.threshold) * 100}
                                  className="w-20 h-2"
                                />
                                <span className="text-gray-600 text-xs">
                                  {Math.round(factor.current_value * 100)}/{Math.round(factor.threshold * 100)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {predictions.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Active Predictions</h3>
                  <p className="text-gray-600">System is stable with no error predictions at this time.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid gap-4">
            {patterns.map((pattern, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{pattern.pattern_description}</h3>
                        <Badge variant="outline">{pattern.error_type}</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Frequency:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.frequency * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Failure Rate:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.failure_rate * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Resolution Rate:</span>
                          <span className="ml-1 font-medium">{Math.round(pattern.resolution_success_rate * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Trend:</span>
                          <span className="ml-1 font-medium">{pattern.severity_trend}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Common Triggers</h4>
                      <div className="flex flex-wrap gap-2">
                        {pattern.common_triggers.map((trigger, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2">Last Occurrence</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(pattern.last_occurrence).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {patterns.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Error Patterns Detected</h3>
                  <p className="text-gray-600">System is learning user patterns and will show insights here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <div className="grid gap-4">
            {strategies.map((strategy, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{strategy.description}</h3>
                        <Badge variant="outline">{strategy.strategy_type}</Badge>
                        {strategy.automated && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Zap className="w-3 h-3 mr-1" />
                            Automated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{strategy.implementation}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Effectiveness:</span>
                          <span className="ml-1 font-medium">{Math.round(strategy.effectiveness_score * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Success Rate:</span>
                          <span className="ml-1 font-medium">{Math.round(strategy.success_rate * 100)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Applied:</span>
                          <span className="ml-1 font-medium">
                            {new Date(strategy.last_applied).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApplyStrategy(strategy.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Apply Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Activation Conditions</h4>
                    <div className="flex flex-wrap gap-2">
                      {strategy.activation_conditions.map((condition, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-600">Effectiveness Score</span>
                      <span className="text-sm font-medium">{Math.round(strategy.effectiveness_score * 100)}%</span>
                    </div>
                    <Progress value={strategy.effectiveness_score * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}