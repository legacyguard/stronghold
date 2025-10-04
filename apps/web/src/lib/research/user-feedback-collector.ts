import { supabase } from '@/lib/supabase';
import { BehaviorTracker } from '@/lib/monitoring/behavior-tracker';

interface FeedbackSubmission {
  rating: number;
  feedback: string;
  feedback_type: 'general' | 'usability' | 'feature_request' | 'bug_report' | 'satisfaction';
  page_url: string;
  feature_context?: string;
  categories?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

interface UserInterview {
  user_id: string;
  scheduled_at: Date;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  interview_type: 'user_journey' | 'feature_feedback' | 'satisfaction' | 'onboarding';
  duration_minutes?: number;
  notes?: string;
  key_insights?: string[];
  pain_points?: string[];
  suggestions?: string[];
}

interface SurveyResponse {
  survey_id: string;
  user_id: string;
  responses: Record<string, any>;
  completion_time_seconds: number;
  submitted_at: Date;
}

export class UserFeedbackCollector {
  /**
   * Submit user feedback
   */
  static async submitFeedback(
    userId: string,
    feedback: FeedbackSubmission
  ): Promise<{ success: boolean; feedback_id?: string; error?: string }> {
    try {
      // Analyze sentiment if not provided
      if (!feedback.sentiment) {
        feedback.sentiment = this.analyzeSentiment(feedback.feedback);
      }

      // Auto-categorize if not provided
      if (!feedback.categories || feedback.categories.length === 0) {
        feedback.categories = this.categorizeFeedback(feedback.feedback, feedback.feedback_type);
      }

      const { data, error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          rating: feedback.rating,
          feedback: feedback.feedback,
          feedback_type: feedback.feedback_type,
          page_url: feedback.page_url,
          feature_context: feedback.feature_context,
          sentiment: feedback.sentiment,
          categories: feedback.categories,
          priority: this.calculatePriority(feedback.rating, feedback.sentiment, feedback.feedback_type)
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error submitting feedback:', error);
        return { success: false, error: error.message };
      }

      // Track feedback submission
      BehaviorTracker.trackUserAction('feedback_submitted', userId, {
        feedback_type: feedback.feedback_type,
        rating: feedback.rating,
        sentiment: feedback.sentiment,
        page_url: feedback.page_url
      });

      return { success: true, feedback_id: data.id };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Schedule user interview
   */
  static async scheduleInterview(
    userId: string,
    interviewType: UserInterview['interview_type'],
    scheduledAt: Date,
    notes?: string
  ): Promise<{ success: boolean; interview_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_interviews')
        .insert({
          user_id: userId,
          interview_type: interviewType,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
          notes
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error scheduling interview:', error);
        return { success: false, error: error.message };
      }

      // Track interview scheduling
      BehaviorTracker.trackUserAction('interview_scheduled', userId, {
        interview_type: interviewType,
        scheduled_at: scheduledAt.toISOString()
      });

      return { success: true, interview_id: data.id };
    } catch (error) {
      console.error('Error scheduling interview:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Submit survey response
   */
  static async submitSurveyResponse(
    userId: string,
    surveyId: string,
    responses: Record<string, any>,
    completionTimeSeconds: number
  ): Promise<{ success: boolean; response_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .insert({
          survey_id: surveyId,
          user_id: userId,
          responses,
          completion_time_seconds: completionTimeSeconds,
          submitted_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error submitting survey response:', error);
        return { success: false, error: error.message };
      }

      // Track survey completion
      BehaviorTracker.trackUserAction('survey_completed', userId, {
        survey_id: surveyId,
        completion_time: completionTimeSeconds,
        response_count: Object.keys(responses).length
      });

      return { success: true, response_id: data.id };
    } catch (error) {
      console.error('Error submitting survey response:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get user feedback summary
   */
  static async getFeedbackSummary(days: number = 30): Promise<{
    total_feedback: number;
    average_rating: number;
    sentiment_breakdown: Record<string, number>;
    category_breakdown: Record<string, number>;
    recent_feedback: any[];
  }> {
    try {
      const { data: feedback, error } = await supabase
        .from('user_feedback')
        .select('*')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!feedback || feedback.length === 0) {
        return {
          total_feedback: 0,
          average_rating: 0,
          sentiment_breakdown: {},
          category_breakdown: {},
          recent_feedback: []
        };
      }

      // Calculate metrics
      const totalFeedback = feedback.length;
      const averageRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / totalFeedback;

      // Sentiment breakdown
      const sentimentBreakdown = feedback.reduce((acc: Record<string, number>, f) => {
        const sentiment = f.sentiment || 'neutral';
        acc[sentiment] = (acc[sentiment] || 0) + 1;
        return acc;
      }, {});

      // Category breakdown
      const categoryBreakdown = feedback.reduce((acc: Record<string, number>, f) => {
        if (f.categories && Array.isArray(f.categories)) {
          f.categories.forEach((category: string) => {
            acc[category] = (acc[category] || 0) + 1;
          });
        }
        return acc;
      }, {});

      return {
        total_feedback: totalFeedback,
        average_rating: Math.round(averageRating * 10) / 10,
        sentiment_breakdown: sentimentBreakdown,
        category_breakdown: categoryBreakdown,
        recent_feedback: feedback.slice(0, 10) // Last 10 feedback items
      };
    } catch (error) {
      console.error('Error getting feedback summary:', error);
      return {
        total_feedback: 0,
        average_rating: 0,
        sentiment_breakdown: {},
        category_breakdown: {},
        recent_feedback: []
      };
    }
  }

  /**
   * Create user research surveys
   */
  static async createSurvey(
    title: string,
    description: string,
    questions: Array<{
      id: string;
      type: 'rating' | 'text' | 'multiple_choice' | 'checkbox';
      question: string;
      options?: string[];
      required: boolean;
    }>,
    targetAudience?: {
      user_segments?: string[];
      min_usage_days?: number;
      features_used?: string[];
    }
  ): Promise<{ success: boolean; survey_id?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .insert({
          title,
          description,
          questions,
          target_audience: targetAudience,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating survey:', error);
        return { success: false, error: error.message };
      }

      return { success: true, survey_id: data.id };
    } catch (error) {
      console.error('Error creating survey:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get user research insights
   */
  static async getResearchInsights(): Promise<{
    user_satisfaction: {
      current_score: number;
      trend: 'up' | 'down' | 'stable';
      insights: string[];
    };
    feature_feedback: {
      most_requested: string[];
      pain_points: string[];
      success_stories: string[];
    };
    user_journey: {
      common_drop_off_points: string[];
      successful_paths: string[];
      completion_rates: Record<string, number>;
    };
  }> {
    try {
      // Get recent feedback for analysis
      const { data: recentFeedback } = await supabase
        .from('user_feedback')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Get previous month for comparison
      const { data: previousFeedback } = await supabase
        .from('user_feedback')
        .select('*')
        .gte('created_at', new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString())
        .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // Analyze satisfaction trends
      const currentScore = recentFeedback?.length
        ? recentFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / recentFeedback.length
        : 0;

      const previousScore = previousFeedback?.length
        ? previousFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / previousFeedback.length
        : 0;

      const trend = currentScore > previousScore + 0.2 ? 'up'
        : currentScore < previousScore - 0.2 ? 'down'
        : 'stable';

      // Extract insights from feedback
      const insights = this.extractInsights(recentFeedback || []);
      const featureFeedback = this.analyzeFeatureFeedback(recentFeedback || []);

      // Get user journey data from analytics
      const journeyData = await this.analyzeUserJourneys();

      return {
        user_satisfaction: {
          current_score: Math.round(currentScore * 10) / 10,
          trend,
          insights
        },
        feature_feedback: featureFeedback,
        user_journey: journeyData
      };
    } catch (error) {
      console.error('Error getting research insights:', error);
      return {
        user_satisfaction: {
          current_score: 0,
          trend: 'stable',
          insights: []
        },
        feature_feedback: {
          most_requested: [],
          pain_points: [],
          success_stories: []
        },
        user_journey: {
          common_drop_off_points: [],
          successful_paths: [],
          completion_rates: {}
        }
      };
    }
  }

  // Helper methods

  /**
   * Analyze sentiment of feedback text
   */
  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['dobré', 'výborné', 'skvelé', 'užitočné', 'jednoduché', 'rýchle', 'pomohlo', 'páči'];
    const negativeWords = ['zlé', 'horšie', 'zložité', 'pomalé', 'neviem', 'nefunguje', 'problém', 'chyba'];

    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pos => word.includes(pos))).length;
    const negativeCount = words.filter(word => negativeWords.some(neg => word.includes(neg))).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Categorize feedback automatically
   */
  private static categorizeFeedback(text: string, type: string): string[] {
    const categories: string[] = [];

    // Add type as primary category
    categories.push(type);

    // Analyze text for additional categories
    const lowercaseText = text.toLowerCase();

    if (lowercaseText.includes('testament') || lowercaseText.includes('dedič')) {
      categories.push('will_generation');
    }
    if (lowercaseText.includes('dokument') || lowercaseText.includes('súbor')) {
      categories.push('document_management');
    }
    if (lowercaseText.includes('mobiln') || lowercaseText.includes('telefón')) {
      categories.push('mobile_experience');
    }
    if (lowercaseText.includes('rýchlos') || lowercaseText.includes('pomal')) {
      categories.push('performance');
    }
    if (lowercaseText.includes('navigáci') || lowercaseText.includes('menu')) {
      categories.push('navigation');
    }

    return Array.from(new Set(categories)); // Remove duplicates
  }

  /**
   * Calculate feedback priority
   */
  private static calculatePriority(
    rating: number,
    sentiment: string,
    type: string
  ): 'low' | 'medium' | 'high' | 'urgent' {
    if (type === 'bug_report') return 'high';
    if (rating <= 2 && sentiment === 'negative') return 'urgent';
    if (rating <= 3 && sentiment === 'negative') return 'high';
    if (type === 'feature_request' && rating >= 4) return 'medium';
    return 'low';
  }

  /**
   * Extract key insights from feedback
   */
  private static extractInsights(feedback: any[]): string[] {
    const insights: string[] = [];

    // Analyze common themes
    const commonWords = this.getCommonWords(feedback.map(f => f.feedback).join(' '));

    if (commonWords.includes('zložité') || commonWords.includes('komplikované')) {
      insights.push('Používatelia považujú niektoré funkcie za príliš zložité');
    }

    if (commonWords.includes('pomalé') || commonWords.includes('čakanie')) {
      insights.push('Výkonnosť aplikácie je problematická pre používateľov');
    }

    if (commonWords.includes('užitočné') || commonWords.includes('pomohlo')) {
      insights.push('Používatelia oceňujú hodnotu aplikácie');
    }

    const avgRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0) / feedback.length;
    if (avgRating >= 4) {
      insights.push('Celková spokojnosť používateľov je vysoká');
    } else if (avgRating <= 2) {
      insights.push('Celková spokojnosť používateľov je nízka - potrebné okamžité zlepšenia');
    }

    return insights;
  }

  /**
   * Analyze feature-specific feedback
   */
  private static analyzeFeatureFeedback(feedback: any[]): {
    most_requested: string[];
    pain_points: string[];
    success_stories: string[];
  } {
    const mostRequested: string[] = [];
    const painPoints: string[] = [];
    const successStories: string[] = [];

    feedback.forEach(f => {
      if (f.feedback_type === 'feature_request') {
        mostRequested.push(f.feedback);
      } else if (f.sentiment === 'negative') {
        painPoints.push(f.feedback);
      } else if (f.sentiment === 'positive' && f.rating >= 4) {
        successStories.push(f.feedback);
      }
    });

    return {
      most_requested: mostRequested.slice(0, 5),
      pain_points: painPoints.slice(0, 5),
      success_stories: successStories.slice(0, 5)
    };
  }

  /**
   * Analyze user journeys from analytics data
   */
  private static async analyzeUserJourneys(): Promise<{
    common_drop_off_points: string[];
    successful_paths: string[];
    completion_rates: Record<string, number>;
  }> {
    try {
      // This would be implemented with actual analytics data
      // For now, return mock data structure
      return {
        common_drop_off_points: ['will_generator_step_3', 'payment_form', 'document_upload'],
        successful_paths: ['/dashboard → /will-generator → /review → /complete'],
        completion_rates: {
          'will_generation': 0.65,
          'onboarding': 0.78,
          'document_upload': 0.82
        }
      };
    } catch (error) {
      return {
        common_drop_off_points: [],
        successful_paths: [],
        completion_rates: {}
      };
    }
  }

  /**
   * Get common words from text
   */
  private static getCommonWords(text: string): string[] {
    const words = text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['ktoré', 'však', 'alebo', 'takže', 'potom'].includes(word));

    const wordCount = words.reduce((acc: Record<string, number>, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
}