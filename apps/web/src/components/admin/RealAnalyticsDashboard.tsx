'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Users, Activity, AlertCircle, DollarSign } from 'lucide-react';
import { AnalyticsTracker } from '@/lib/analytics/tracker';
import { FeatureAuditor } from '@/lib/audit/feature-status';

interface DashboardMetrics {
  dailyActiveUsers: number[];
  featureAdoption: Record<string, number>;
  errorRate: number;
  pagePerformance: Record<string, number>;
  conversionRate: number;
  churnRate: number;
  revenue: {
    mrr: number;
    arpu: number;
    ltv: number;
  };
  userSatisfaction: {
    average: number;
    responses: number;
  };
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description?: string;
}

function MetricCard({ title, value, change, trend, icon, description }: MetricCardProps) {
  const getTrendColor = () => {
    if (!change) return 'text-gray-500';
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-500';
  };

  const getTrendIcon = () => {
    if (!change) return null;
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change}% vs last period
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

function FeatureStatusCard() {
  const [auditData, setAuditData] = useState({
    working: 0,
    incomplete: 0,
    missing: 0,
    broken: 0,
    total: 0
  });

  useEffect(() => {
    const status = FeatureAuditor.getOverallStatus();
    setAuditData(status);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'incomplete': return 'bg-yellow-100 text-yellow-800';
      case 'missing': return 'bg-red-100 text-red-800';
      case 'broken': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Status Audit</CardTitle>
        <CardDescription>Real implementation status vs. claims</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>Working Features</span>
            <Badge className={getStatusColor('working')}>
              {auditData.working}/{auditData.total}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Incomplete Features</span>
            <Badge className={getStatusColor('incomplete')}>
              {auditData.incomplete}/{auditData.total}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Missing Features</span>
            <Badge className={getStatusColor('missing')}>
              {auditData.missing}/{auditData.total}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span>Broken Features</span>
            <Badge className={getStatusColor('broken')}>
              {auditData.broken}/{auditData.total}
            </Badge>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-700">
              Reality Check: Only {Math.round((auditData.working / auditData.total) * 100)}% of claimed features are actually working
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RealTimeChart({ data, title }: { data: number[]; title: string }) {
  const maxValue = Math.max(...data, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40 flex items-end space-x-1">
          {data.slice(-14).map((value, index) => (
            <div
              key={index}
              className="bg-primary/20 rounded-t flex-1 min-w-[4px]"
              style={{
                height: `${(value / maxValue) * 100}%`,
                minHeight: value > 0 ? '4px' : '1px'
              }}
              title={`Day ${index + 1}: ${value}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>14 days ago</span>
          <span>Today</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function RealAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadRealMetrics();
    const interval = setInterval(loadRealMetrics, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadRealMetrics = async () => {
    try {
      setLoading(true);

      const days = parseInt(dateRange.replace('d', ''));

      // Load real metrics from analytics system
      const [
        dauData,
        featureAdoption,
        errorRate,
        pagePerformance
      ] = await Promise.all([
        AnalyticsTracker.getDailyActiveUsers(days),
        AnalyticsTracker.getFeatureAdoption(),
        AnalyticsTracker.getErrorRate(24),
        AnalyticsTracker.getPagePerformance()
      ]);

      // Calculate derived metrics
      const currentDAU = dauData[dauData.length - 1] || 0;
      const previousDAU = dauData[dauData.length - 2] || 0;
      const dauChange = previousDAU > 0 ? ((currentDAU - previousDAU) / previousDAU) * 100 : 0;

      setMetrics({
        dailyActiveUsers: dauData,
        featureAdoption,
        errorRate,
        pagePerformance,
        conversionRate: 0, // Will be calculated when we have subscription data
        churnRate: 0,
        revenue: {
          mrr: 0, // Will be calculated from real subscription data
          arpu: 0,
          ltv: 0
        },
        userSatisfaction: {
          average: 0, // Will be calculated from feedback data
          responses: 0
        }
      });

      setLastUpdated(new Date());

    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    if (!metrics) return;

    const data = {
      exported_at: new Date().toISOString(),
      date_range: dateRange,
      metrics
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stronghold_analytics_${dateRange}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Real Analytics Dashboard</h1>
          <div className="animate-pulse bg-gray-200 rounded w-20 h-8"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Real Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline">
            Export Data
          </Button>
        </div>
      </div>

      {/* Critical Status Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <div>
            <h3 className="font-semibold text-red-800">Reality Check Required</h3>
            <p className="text-sm text-red-700">
              This dashboard shows real data, not the optimistic projections from previous reports.
              Focus on building features that users actually want and will pay for.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Active Users"
          value={metrics?.dailyActiveUsers.slice(-1)[0] || 0}
          icon={<Users className="w-4 h-4" />}
          description="Real users, not page views"
        />
        <MetricCard
          title="Error Rate"
          value={`${metrics?.errorRate?.toFixed(1) || 0}%`}
          trend={(metrics?.errorRate || 0) > 5 ? 'down' : 'up'}
          icon={<AlertCircle className="w-4 h-4" />}
          description="Last 24 hours"
        />
        <MetricCard
          title="Monthly Revenue"
          value={`€${metrics?.revenue.mrr || 0}`}
          icon={<DollarSign className="w-4 h-4" />}
          description="Actual MRR, not projections"
        />
        <MetricCard
          title="Feature Adoption"
          value={`${Object.keys(metrics?.featureAdoption || {}).length}`}
          icon={<Activity className="w-4 h-4" />}
          description="Features with active users"
        />
      </div>

      {/* Charts and Detailed Views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeChart
          data={metrics?.dailyActiveUsers || []}
          title="Daily Active Users (Reality)"
        />

        <FeatureStatusCard />

        <Card>
          <CardHeader>
            <CardTitle>Feature Usage (Real Data)</CardTitle>
            <CardDescription>Users who actually used each feature</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics?.featureAdoption || {}).map(([feature, users]) => (
                <div key={feature} className="flex justify-between items-center">
                  <span className="text-sm">{feature.replace('_', ' ')}</span>
                  <Badge variant="outline">{users} users</Badge>
                </div>
              ))}
              {Object.keys(metrics?.featureAdoption || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No feature usage data yet. Start tracking user interactions.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Page Performance</CardTitle>
            <CardDescription>Average load times (ms)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics?.pagePerformance || {}).map(([page, time]) => (
                <div key={page} className="flex justify-between items-center">
                  <span className="text-sm">{page}</span>
                  <Badge variant={time > 3000 ? "destructive" : time > 1500 ? "secondary" : "default"}>
                    {Math.round(time)}ms
                  </Badge>
                </div>
              ))}
              {Object.keys(metrics?.pagePerformance || {}).length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No performance data yet. Enable page load tracking.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle>Immediate Action Items</CardTitle>
          <CardDescription>Based on real data analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(metrics?.errorRate || 0) > 5 && (
              <div className="flex items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-sm text-red-700">
                  High error rate ({(metrics?.errorRate || 0).toFixed(1)}%) - investigate server issues immediately
                </span>
              </div>
            )}

            {(metrics?.dailyActiveUsers.slice(-1)[0] || 0) < 10 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <AlertCircle className="w-4 h-4 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-700">
                  Low user activity - focus on user acquisition and retention
                </span>
              </div>
            )}

            {Object.keys(metrics?.featureAdoption || {}).length < 3 && (
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-sm text-blue-700">
                  Low feature adoption - improve onboarding and feature discovery
                </span>
              </div>
            )}

            {(metrics?.revenue.mrr || 0) === 0 && (
              <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                <AlertCircle className="w-4 h-4 text-purple-600 mr-2" />
                <span className="text-sm text-purple-700">
                  No revenue yet - implement and test pricing/payment flow
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}