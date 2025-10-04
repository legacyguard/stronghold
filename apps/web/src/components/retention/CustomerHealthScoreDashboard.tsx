'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, Scatter, ScatterChart
} from 'recharts';
import {
  HeartHandshake, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Users, Target, Zap, Clock, DollarSign, BarChart3, Activity
} from 'lucide-react';

interface CustomerHealthScore {
  user_id: string;
  overall_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  component_scores: {
    engagement: number;
    usage: number;
    value: number;
    support: number;
    retention_likelihood: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  last_updated: Date;
  key_insights: string[];
  recommended_actions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    impact: number;
  }>;
}

interface HealthMetrics {
  total_customers: number;
  avg_health_score: number;
  health_distribution: {
    healthy: number;
    at_risk: number;
    critical: number;
  };
  trending_metrics: {
    improving: number;
    stable: number;
    declining: number;
  };
  segment_health: Array<{
    segment: string;
    avg_score: number;
    customer_count: number;
    risk_level: string;
  }>;
}

interface RetentionImpact {
  health_score_ranges: Array<{
    range: string;
    retention_rate: number;
    customer_count: number;
    avg_ltv: number;
  }>;
  improvement_impact: {
    score_increase: number;
    retention_improvement: number;
    revenue_impact: number;
  };
}

export default function CustomerHealthScoreDashboard() {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics | null>(null);
  const [customerHealthScores, setCustomerHealthScores] = useState<CustomerHealthScore[]>([]);
  const [retentionImpact, setRetentionImpact] = useState<RetentionImpact | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setIsLoading(true);
    try {
      // Simulate API calls - replace with actual data fetching
      await new Promise(resolve => setTimeout(resolve, 1000));

      setHealthMetrics({
        total_customers: 2847,
        avg_health_score: 72.5,
        health_distribution: {
          healthy: 1965,
          at_risk: 623,
          critical: 259
        },
        trending_metrics: {
          improving: 1142,
          stable: 1389,
          declining: 316
        },
        segment_health: [
          { segment: 'Champions', avg_score: 94.2, customer_count: 421, risk_level: 'low' },
          { segment: 'Loyal Customers', avg_score: 81.7, customer_count: 892, risk_level: 'low' },
          { segment: 'Potential Loyalists', avg_score: 67.3, customer_count: 612, risk_level: 'medium' },
          { segment: 'At Risk', avg_score: 41.8, customer_count: 487, risk_level: 'high' },
          { segment: 'Cannot Lose Them', avg_score: 38.5, customer_count: 203, risk_level: 'critical' }
        ]
      });

      setCustomerHealthScores([
        {
          user_id: 'user_001',
          overall_score: 85.2,
          risk_level: 'low',
          component_scores: {
            engagement: 88,
            usage: 82,
            value: 90,
            support: 95,
            retention_likelihood: 87
          },
          trend: 'improving',
          last_updated: new Date(),
          key_insights: [
            'High engagement with premium features',
            'Consistent usage patterns',
            'Low support burden'
          ],
          recommended_actions: [
            { action: 'Introduce advanced features', priority: 'medium', impact: 0.15 },
            { action: 'Gather success story', priority: 'low', impact: 0.05 }
          ]
        },
        {
          user_id: 'user_002',
          overall_score: 34.7,
          risk_level: 'critical',
          component_scores: {
            engagement: 22,
            usage: 15,
            value: 45,
            support: 28,
            retention_likelihood: 25
          },
          trend: 'declining',
          last_updated: new Date(),
          key_insights: [
            'Severe engagement decline',
            'Multiple support issues',
            'Low feature adoption'
          ],
          recommended_actions: [
            { action: 'Immediate personal outreach', priority: 'high', impact: 0.45 },
            { action: 'Offer migration assistance', priority: 'high', impact: 0.35 },
            { action: 'Provide training session', priority: 'medium', impact: 0.25 }
          ]
        }
      ]);

      setRetentionImpact({
        health_score_ranges: [
          { range: '90-100', retention_rate: 0.96, customer_count: 324, avg_ltv: 2890 },
          { range: '80-89', retention_rate: 0.89, customer_count: 612, avg_ltv: 2340 },
          { range: '70-79', retention_rate: 0.78, customer_count: 891, avg_ltv: 1820 },
          { range: '60-69', retention_rate: 0.63, customer_count: 534, avg_ltv: 1450 },
          { range: '50-59', retention_rate: 0.45, customer_count: 312, avg_ltv: 980 },
          { range: '0-49', retention_rate: 0.21, customer_count: 174, avg_ltv: 520 }
        ],
        improvement_impact: {
          score_increase: 10,
          retention_improvement: 0.15,
          revenue_impact: 125000
        }
      });

    } catch (error) {
      console.error('Error loading health data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#EF4444';
    return '#DC2626';
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Customer Health Score Dashboard</h2>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Health Score Dashboard</h2>
          <p className="text-gray-600">Monitor customer health metrics and retention indicators</p>
        </div>
        <Button onClick={loadHealthData}>
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold">{healthMetrics?.total_customers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <HeartHandshake className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Health Score</p>
                <p className="text-2xl font-bold">{healthMetrics?.avg_health_score}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Healthy Customers</p>
                <p className="text-2xl font-bold">{healthMetrics?.health_distribution.healthy}</p>
                <p className="text-xs text-gray-500">
                  {((healthMetrics?.health_distribution.healthy || 0) / (healthMetrics?.total_customers || 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">At Risk</p>
                <p className="text-2xl font-bold text-red-600">
                  {(healthMetrics?.health_distribution.at_risk || 0) + (healthMetrics?.health_distribution.critical || 0)}
                </p>
                <p className="text-xs text-gray-500">
                  {(((healthMetrics?.health_distribution.at_risk || 0) + (healthMetrics?.health_distribution.critical || 0)) / (healthMetrics?.total_customers || 1) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="individual">Individual Scores</TabsTrigger>
          <TabsTrigger value="impact">Retention Impact</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Health Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Health Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Healthy (80+)', value: healthMetrics?.health_distribution.healthy, fill: '#10B981' },
                        { name: 'At Risk (40-79)', value: healthMetrics?.health_distribution.at_risk, fill: '#F59E0B' },
                        { name: 'Critical (<40)', value: healthMetrics?.health_distribution.critical, fill: '#EF4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Trend Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Health Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span>Improving</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{healthMetrics?.trending_metrics.improving}</span>
                      <div className="w-24">
                        <Progress
                          value={(healthMetrics?.trending_metrics.improving || 0) / (healthMetrics?.total_customers || 1) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-gray-600" />
                      <span>Stable</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{healthMetrics?.trending_metrics.stable}</span>
                      <div className="w-24">
                        <Progress
                          value={(healthMetrics?.trending_metrics.stable || 0) / (healthMetrics?.total_customers || 1) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span>Declining</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">{healthMetrics?.trending_metrics.declining}</span>
                      <div className="w-24">
                        <Progress
                          value={(healthMetrics?.trending_metrics.declining || 0) / (healthMetrics?.total_customers || 1) * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="segments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segment Health Analysis</CardTitle>
              <CardDescription>Average health scores by customer segment</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={healthMetrics?.segment_health}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="avg_score" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {healthMetrics?.segment_health.map((segment) => (
              <Card key={segment.segment}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{segment.segment}</h4>
                      <p className="text-sm text-gray-600">{segment.customer_count} customers</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-semibold" style={{ color: getHealthColor(segment.avg_score) }}>
                          {segment.avg_score.toFixed(1)}
                        </p>
                        <p className="text-xs text-gray-500">Avg Score</p>
                      </div>
                      <Badge className={getRiskBadgeColor(segment.risk_level)}>
                        {segment.risk_level}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <div className="space-y-4">
            {customerHealthScores.map((customer) => (
              <Card key={customer.user_id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold">Customer {customer.user_id}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getRiskBadgeColor(customer.risk_level)}>
                          {customer.risk_level} risk
                        </Badge>
                        {getTrendIcon(customer.trend)}
                        <span className="text-sm text-gray-600">{customer.trend}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: getHealthColor(customer.overall_score) }}>
                        {customer.overall_score.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-600">Overall Score</p>
                    </div>
                  </div>

                  {/* Component Scores */}
                  <div className="grid gap-3 grid-cols-5 mb-4">
                    {Object.entries(customer.component_scores).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="w-12 h-12 mx-auto mb-1 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                             style={{ backgroundColor: getHealthColor(value) }}>
                          {value}
                        </div>
                        <p className="text-xs text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                      </div>
                    ))}
                  </div>

                  {/* Key Insights */}
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Key Insights:</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {customer.key_insights.map((insight, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Actions */}
                  <div>
                    <h5 className="font-medium mb-2">Recommended Actions:</h5>
                    <div className="space-y-2">
                      {customer.recommended_actions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm">{action.action}</span>
                          <div className="flex items-center space-x-2">
                            <Badge variant={action.priority === 'high' ? 'destructive' : action.priority === 'medium' ? 'default' : 'secondary'}>
                              {action.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">+{(action.impact * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Score vs Retention Correlation</CardTitle>
              <CardDescription>Impact of health scores on customer retention and LTV</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={retentionImpact?.health_score_ranges.map(range => ({
                  healthScore: range.range,
                  retentionRate: range.retention_rate * 100,
                  avgLtv: range.avg_ltv,
                  customerCount: range.customer_count
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="healthScore" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => [
                      name === 'retentionRate' ? `${value}%` : `$${value}`,
                      name === 'retentionRate' ? 'Retention Rate' : 'Avg LTV'
                    ]}
                  />
                  <Scatter name="Retention vs LTV" dataKey="retentionRate" fill="#3B82F6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Retention by Health Score Range</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {retentionImpact?.health_score_ranges.map((range) => (
                    <div key={range.range} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{range.range}</span>
                        <p className="text-sm text-gray-600">{range.customer_count} customers</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{(range.retention_rate * 100).toFixed(1)}%</p>
                        <p className="text-sm text-gray-600">${range.avg_ltv} LTV</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Impact Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div>
                      <p className="font-medium">Score Increase</p>
                      <p className="text-sm text-gray-600">Average improvement potential</p>
                    </div>
                    <p className="text-xl font-bold text-green-600">
                      +{retentionImpact?.improvement_impact.score_increase}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div>
                      <p className="font-medium">Retention Improvement</p>
                      <p className="text-sm text-gray-600">Expected retention lift</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600">
                      +{(retentionImpact?.improvement_impact.retention_improvement || 0 * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                    <div>
                      <p className="font-medium">Revenue Impact</p>
                      <p className="text-sm text-gray-600">Annual revenue potential</p>
                    </div>
                    <p className="text-xl font-bold text-yellow-600">
                      ${retentionImpact?.improvement_impact.revenue_impact.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Score Trends Over Time</CardTitle>
              <CardDescription>Historical health score evolution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={[
                  { month: 'Jan', avg_score: 68.2, healthy: 1234, at_risk: 567, critical: 123 },
                  { month: 'Feb', avg_score: 69.8, healthy: 1345, at_risk: 534, critical: 112 },
                  { month: 'Mar', avg_score: 71.2, healthy: 1456, at_risk: 523, critical: 98 },
                  { month: 'Apr', avg_score: 70.9, healthy: 1567, at_risk: 543, critical: 105 },
                  { month: 'May', avg_score: 72.1, healthy: 1678, at_risk: 534, critical: 89 },
                  { month: 'Jun', avg_score: 72.5, healthy: 1789, at_risk: 523, critical: 67 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg_score" stroke="#3B82F6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Health Distribution Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={[
                  { month: 'Jan', healthy: 65, at_risk: 28, critical: 7 },
                  { month: 'Feb', healthy: 67, at_risk: 26, critical: 7 },
                  { month: 'Mar', healthy: 69, at_risk: 25, critical: 6 },
                  { month: 'Apr', healthy: 68, at_risk: 26, critical: 6 },
                  { month: 'May', healthy: 70, at_risk: 24, critical: 6 },
                  { month: 'Jun', healthy: 72, at_risk: 23, critical: 5 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Area type="monotone" dataKey="healthy" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="at_risk" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                  <Area type="monotone" dataKey="critical" stackId="1" stroke="#EF4444" fill="#EF4444" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}