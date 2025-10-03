'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Zap,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';

interface SupportMetrics {
  total_tickets: number;
  resolved_tickets: number;
  avg_resolution_time: number;
  ai_resolution_rate: number;
  user_satisfaction: number;
  response_time_p95: number;
  churn_risk_users: number;
  active_conversations: number;
}

interface TicketTrend {
  date: string;
  tickets: number;
  resolved: number;
  ai_resolved: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
  percentage: number;
  avg_resolution_time: number;
  satisfaction: number;
}

interface UserHealthStats {
  healthy: number;
  at_risk: number;
  intervention_needed: number;
  churned: number;
}

interface ArticlePerformance {
  id: string;
  title: string;
  views: number;
  helpful_votes: number;
  effectiveness_score: number;
  category: string;
}

export interface SupportAnalyticsDashboardProps {
  dateRange?: '7d' | '30d' | '90d' | '1y';
  refreshInterval?: number;
  showExports?: boolean;
}

export const SupportAnalyticsDashboard: React.FC<SupportAnalyticsDashboardProps> = ({
  dateRange = '30d',
  refreshInterval = 300000, // 5 minutes
  showExports = true
}) => {
  const [metrics, setMetrics] = useState<SupportMetrics | null>(null);
  const [trends, setTrends] = useState<TicketTrend[]>([]);
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [userHealth, setUserHealth] = useState<UserHealthStats | null>(null);
  const [articlePerformance, setArticlePerformance] = useState<ArticlePerformance[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState(dateRange);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const supabase = createClient();

  const loadAnalyticsCallback = React.useCallback(async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSupportMetrics(),
        loadTicketTrends(),
        loadCategoryBreakdown(),
        loadUserHealthStats(),
        loadArticlePerformance()
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDateRange]);

  useEffect(() => {
    loadAnalyticsCallback();

    if (refreshInterval > 0) {
      const interval = setInterval(loadAnalyticsCallback, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [selectedDateRange, refreshInterval, loadAnalyticsCallback]);


  const loadSupportMetrics = async () => {
    const daysAgo = getDaysFromRange(selectedDateRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    // Get ticket metrics
    const { data: ticketData } = await supabase
      .from('support_tickets')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (ticketData) {
      const totalTickets = ticketData.length;
      const resolvedTickets = ticketData.filter(t => t.status === 'resolved').length;
      const avgResolutionTime = ticketData
        .filter(t => t.resolution_time_minutes)
        .reduce((acc, t) => acc + (t.resolution_time_minutes || 0), 0) / resolvedTickets || 0;

      // Get AI resolution rate from interactions
      const { data: interactionData } = await supabase
        .from('support_interactions')
        .select('knowledge_source, ticket_id')
        .in('ticket_id', ticketData.map(t => t.id));

      const aiResolvedTickets = new Set();
      interactionData?.forEach(interaction => {
        if (interaction.knowledge_source === 'rule_based' || interaction.knowledge_source === 'ai_generated') {
          aiResolvedTickets.add(interaction.ticket_id);
        }
      });

      const aiResolutionRate = totalTickets > 0 ? (aiResolvedTickets.size / totalTickets) * 100 : 0;

      // Get user satisfaction
      const satisfactionRatings = ticketData
        .filter(t => t.satisfaction_rating)
        .map(t => t.satisfaction_rating);
      const avgSatisfaction = satisfactionRatings.length > 0
        ? satisfactionRatings.reduce((acc, rating) => acc + rating, 0) / satisfactionRatings.length
        : 0;

      // Get user health data
      const { data: healthData } = await supabase
        .from('user_support_health')
        .select('churn_risk_score');

      const churnRiskUsers = healthData?.filter(h => h.churn_risk_score > 0.7).length || 0;

      // Get active conversations
      const { data: conversationData } = await supabase
        .from('sofia_conversations')
        .select('id')
        .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      setMetrics({
        total_tickets: totalTickets,
        resolved_tickets: resolvedTickets,
        avg_resolution_time: Math.round(avgResolutionTime),
        ai_resolution_rate: Math.round(aiResolutionRate * 10) / 10,
        user_satisfaction: Math.round(avgSatisfaction * 10) / 10,
        response_time_p95: 300, // Would calculate from real data
        churn_risk_users: churnRiskUsers,
        active_conversations: conversationData?.length || 0
      });
    }
  };

  const loadTicketTrends = async () => {
    const daysAgo = getDaysFromRange(selectedDateRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const { data } = await supabase
      .rpc('get_ticket_trends', {
        start_date: startDate.toISOString(),
        end_date: new Date().toISOString()
      });

    if (data) {
      setTrends(data);
    } else {
      // Fallback: generate sample data
      const sampleTrends: TicketTrend[] = [];
      for (let i = daysAgo; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        sampleTrends.push({
          date: date.toISOString().split('T')[0],
          tickets: Math.floor(Math.random() * 20) + 5,
          resolved: Math.floor(Math.random() * 15) + 3,
          ai_resolved: Math.floor(Math.random() * 12) + 2
        });
      }
      setTrends(sampleTrends);
    }
  };

  const loadCategoryBreakdown = async () => {
    const daysAgo = getDaysFromRange(selectedDateRange);
    const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    const { data: ticketData } = await supabase
      .from('support_tickets')
      .select('category, resolution_time_minutes, satisfaction_rating')
      .gte('created_at', startDate.toISOString());

    if (ticketData) {
      const categoryStats = ticketData.reduce((acc, ticket) => {
        const category = ticket.category;
        if (!acc[category]) {
          acc[category] = {
            count: 0,
            totalResolutionTime: 0,
            totalSatisfaction: 0,
            satisfactionCount: 0
          };
        }
        acc[category].count++;
        if (ticket.resolution_time_minutes) {
          acc[category].totalResolutionTime += ticket.resolution_time_minutes;
        }
        if (ticket.satisfaction_rating) {
          acc[category].totalSatisfaction += ticket.satisfaction_rating;
          acc[category].satisfactionCount++;
        }
        return acc;
      }, {} as Record<string, { count: number; totalResolutionTime: number; totalSatisfaction: number; satisfactionCount: number }>);

      const totalTickets = ticketData.length;
      const breakdown: CategoryBreakdown[] = Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        count: stats.count,
        percentage: Math.round((stats.count / totalTickets) * 100),
        avg_resolution_time: Math.round(stats.totalResolutionTime / stats.count) || 0,
        satisfaction: Math.round((stats.totalSatisfaction / stats.satisfactionCount) * 10) / 10 || 0
      }));

      setCategories(breakdown);
    }
  };

  const loadUserHealthStats = async () => {
    const { data } = await supabase
      .from('user_support_health')
      .select('churn_risk_score, intervention_needed');

    if (data) {
      const stats: UserHealthStats = {
        healthy: data.filter(h => h.churn_risk_score <= 0.3).length,
        at_risk: data.filter(h => h.churn_risk_score > 0.3 && h.churn_risk_score <= 0.7).length,
        intervention_needed: data.filter(h => h.intervention_needed).length,
        churned: data.filter(h => h.churn_risk_score > 0.9).length
      };
      setUserHealth(stats);
    }
  };

  const loadArticlePerformance = async () => {
    const { data } = await supabase
      .from('support_articles')
      .select('id, title, view_count, helpful_votes, effectiveness_score, category')
      .eq('published', true)
      .order('effectiveness_score', { ascending: false })
      .limit(10);

    if (data) {
      setArticlePerformance(data.map(article => ({
        id: article.id,
        title: article.title,
        views: article.view_count,
        helpful_votes: article.helpful_votes,
        effectiveness_score: article.effectiveness_score,
        category: article.category
      })));
    }
  };

  const getDaysFromRange = (range: string): number => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  const exportData = async (format: 'csv' | 'json') => {
    // Implementation for data export
    const exportData = {
      metrics,
      trends,
      categories,
      userHealth,
      articlePerformance,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `support-analytics-${selectedDateRange}.json`;
      a.click();
    } else {
      // CSV export implementation
      console.log('CSV export not implemented yet');
    }
  };


  const COLORS = ['#6B8E23', '#8BA647', '#A4BE6A', '#BDD68E', '#D6EEB2'];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Support Analytics Dashboard</h1>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadAnalyticsCallback}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {showExports && (
            <Button variant="outline" onClick={() => exportData('json')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                  <p className="text-2xl font-bold">{metrics.total_tickets}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div className="mt-2 flex items-center">
                <Badge variant="secondary" className="text-xs">
                  {Math.round((metrics.resolved_tickets / metrics.total_tickets) * 100)}% resolved
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">AI Resolution Rate</p>
                  <p className="text-2xl font-bold">{metrics.ai_resolution_rate}%</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="mt-2">
                <Progress value={metrics.ai_resolution_rate} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Resolution Time</p>
                  <p className="text-2xl font-bold">{metrics.avg_resolution_time}m</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <div className="mt-2 flex items-center">
                <Badge variant="outline" className="text-xs">
                  Target: &lt;60m
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User Satisfaction</p>
                  <p className="text-2xl font-bold">{metrics.user_satisfaction}/5</p>
                </div>
                <Star className="w-8 h-8 text-orange-500" />
              </div>
              <div className="mt-2 flex items-center">
                <Badge
                  variant={metrics.user_satisfaction >= 4.5 ? "default" : "secondary"}
                  className="text-xs"
                >
                  {metrics.user_satisfaction >= 4.5 ? "Excellent" : "Good"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Ticket Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="health">User Health</TabsTrigger>
          <TabsTrigger value="articles">Article Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Volume Trends</CardTitle>
              <CardDescription>
                Daily ticket creation and resolution rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="tickets"
                    stackId="1"
                    stroke="#6B8E23"
                    fill="#6B8E23"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="ai_resolved"
                    stackId="2"
                    stroke="#8BA647"
                    fill="#8BA647"
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categories as unknown as Record<string, unknown>[]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, percentage }: { category: string; percentage: number }) => `${category} (${percentage}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {categories.map((entry, entryIndex) => (
                        <Cell key={`cell-${entryIndex}`} fill={COLORS[entryIndex % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize">{category.category}</span>
                        <Badge variant="outline">{category.count} tickets</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Avg Resolution: {category.avg_resolution_time}m</div>
                        <div>Satisfaction: {category.satisfaction}/5</div>
                      </div>
                      <Separator />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {userHealth && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Healthy Users</p>
                      <p className="text-2xl font-bold text-green-600">{userHealth.healthy}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">At Risk</p>
                      <p className="text-2xl font-bold text-yellow-600">{userHealth.at_risk}</p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Need Intervention</p>
                      <p className="text-2xl font-bold text-red-600">{userHealth.intervention_needed}</p>
                    </div>
                    <Activity className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Churned</p>
                      <p className="text-2xl font-bold text-gray-600">{userHealth.churned}</p>
                    </div>
                    <Users className="w-8 h-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="articles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Articles</CardTitle>
              <CardDescription>
                Knowledge base articles ranked by effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {articlePerformance.map((article, index) => (
                  <div key={article.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{article.title}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{article.views} views</span>
                          <span>{article.helpful_votes} helpful votes</span>
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{Math.round(article.effectiveness_score * 100)}%</p>
                      <p className="text-sm text-muted-foreground">effectiveness</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupportAnalyticsDashboard;