'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Star,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import { UserFeedbackCollector } from '@/lib/research/user-feedback-collector';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';

interface ResearchMetrics {
  total_feedback: number;
  average_rating: number;
  sentiment_breakdown: Record<string, number>;
  category_breakdown: Record<string, number>;
  recent_feedback: any[];
}

interface UserSatisfactionData {
  current_score: number;
  trend: 'up' | 'down' | 'stable';
  insights: string[];
}

interface FeatureFeedbackData {
  most_requested: string[];
  pain_points: string[];
  success_stories: string[];
}

export function UserResearchDashboard() {
  const [metrics, setMetrics] = useState<ResearchMetrics | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<UserSatisfactionData | null>(null);
  const [featureFeedback, setFeatureFeedback] = useState<FeatureFeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    loadResearchData();
  }, [timeRange]);

  const loadResearchData = async () => {
    setLoading(true);
    try {
      const [feedbackMetrics, researchInsights] = await Promise.all([
        UserFeedbackCollector.getFeedbackSummary(timeRange),
        UserFeedbackCollector.getResearchInsights()
      ]);

      setMetrics(feedbackMetrics);
      setSatisfactionData(researchInsights.user_satisfaction);
      setFeatureFeedback(researchInsights.feature_feedback);
    } catch (error) {
      console.error('Failed to load research data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#10B981';
      case 'negative': return '#EF4444';
      case 'neutral': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="w-4 h-4" />;
      case 'negative': return <ThumbsDown className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 rounded-full bg-gray-400" />;
    }
  };

  const formatRating = (rating: number) => {
    return `${rating.toFixed(1)}/5.0`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin mr-2" />
        <span>Načítavam research data...</span>
      </div>
    );
  }

  // Prepare chart data
  const sentimentChartData = metrics?.sentiment_breakdown
    ? Object.entries(metrics.sentiment_breakdown).map(([sentiment, count]) => ({
        name: sentiment === 'positive' ? 'Pozitívne' : sentiment === 'negative' ? 'Negatívne' : 'Neutrálne',
        value: count,
        color: getSentimentColor(sentiment)
      }))
    : [];

  const categoryChartData = metrics?.category_breakdown
    ? Object.entries(metrics.category_breakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([category, count]) => ({
          category: category.replace('_', ' '),
          count
        }))
    : [];

  const ratingDistribution = metrics?.recent_feedback
    ? [1, 2, 3, 4, 5].map(rating => ({
        rating: `${rating}★`,
        count: metrics.recent_feedback.filter(f => f.rating === rating).length
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Research Dashboard</h1>
          <p className="text-gray-600">Analýza používateľského feedbacku a správania</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setTimeRange(7)}>
            7 dní
          </Button>
          <Button variant="outline" onClick={() => setTimeRange(30)}>
            30 dní
          </Button>
          <Button variant="outline" onClick={() => setTimeRange(90)}>
            90 dní
          </Button>
          <Button onClick={loadResearchData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Obnoviť
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkový feedback</CardTitle>
            <MessageSquare className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_feedback || 0}</div>
            <p className="text-xs text-gray-600">za posledných {timeRange} dní</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priemerné hodnotenie</CardTitle>
            <Star className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRating(metrics?.average_rating || 0)}</div>
            <div className="flex items-center mt-1">
              {satisfactionData && getTrendIcon(satisfactionData.trend)}
              <span className="text-xs text-gray-600 ml-1">
                {satisfactionData?.trend === 'up' && 'Rastúci trend'}
                {satisfactionData?.trend === 'down' && 'Klesajúci trend'}
                {satisfactionData?.trend === 'stable' && 'Stabilný'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pozitívny sentiment</CardTitle>
            <ThumbsUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.sentiment_breakdown?.positive || 0}
            </div>
            <p className="text-xs text-gray-600">
              {metrics?.total_feedback
                ? Math.round((metrics.sentiment_breakdown.positive / metrics.total_feedback) * 100)
                : 0}% z celkového feedbacku
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritické problémy</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.recent_feedback?.filter(f => f.rating <= 2).length || 0}
            </div>
            <p className="text-xs text-gray-600">hodnotenie 1-2 hviezdy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Analysis Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribúcia hodnotení</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="rating" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Kategórie feedbacku</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={categoryChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category" type="category" width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Kľúčové poznatky</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {satisfactionData?.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Requested Features */}
        <Card>
          <CardHeader>
            <CardTitle>Najžiadanejšie funkcie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureFeedback?.most_requested.slice(0, 5).map((request, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{request}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pain Points */}
        <Card>
          <CardHeader>
            <CardTitle>Najčastejšie problémy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {featureFeedback?.pain_points.slice(0, 5).map((pain, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border-l-4 border-red-200">
                  <p className="text-sm">{pain}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Feedback */}
      <Card>
        <CardHeader>
          <CardTitle>Posledný feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.recent_feedback.slice(0, 10).map((feedback, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= feedback.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                          fill={star <= feedback.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                    <Badge variant="outline">
                      {feedback.feedback_type.replace('_', ' ')}
                    </Badge>
                    {feedback.sentiment && (
                      <div className="flex items-center space-x-1">
                        {getSentimentIcon(feedback.sentiment)}
                        <span className="text-xs capitalize">{feedback.sentiment}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(feedback.created_at).toLocaleDateString('sk-SK')}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{feedback.feedback}</p>
                {feedback.categories && feedback.categories.length > 0 && (
                  <div className="flex space-x-1 mt-2">
                    {feedback.categories.map((category: string, catIndex: number) => (
                      <Badge key={catIndex} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}