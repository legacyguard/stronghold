import { createClient } from '@supabase/supabase-js';
import { AnalyticsTracker } from '@/lib/analytics/tracker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type FeedbackType = 'bug_report' | 'feature_request' | 'general' | 'usability' | 'performance';
export type FeedbackStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface UserFeedback {
  id: string;
  user_id?: string;
  feedback_type: FeedbackType;
  subject: string;
  message: string;
  rating?: number;
  page_path?: string;
  metadata: Record<string, any>;
  status: FeedbackStatus;
  assigned_to?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackSubmission {
  type: FeedbackType;
  subject: string;
  message: string;
  rating?: number;
  email?: string;
  includeSystemInfo?: boolean;
  metadata?: Record<string, any>;
}

export interface FeedbackStats {
  totalFeedback: number;
  byType: Record<FeedbackType, number>;
  byStatus: Record<FeedbackStatus, number>;
  averageRating: number;
  responseTime: {
    average: number;
    median: number;
  };
  satisfactionTrend: Array<{
    date: string;
    rating: number;
    count: number;
  }>;
}

export class FeedbackManager {
  private static getCurrentUserId(): string | null {
    // This would be integrated with your auth system
    return null; // For now, allowing anonymous feedback
  }

  private static getSystemInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onlineStatus: navigator.onLine,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    };
  }

  static async submitFeedback(feedback: FeedbackSubmission): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const userId = this.getCurrentUserId();

      // Validate required fields
      if (!feedback.subject.trim() || !feedback.message.trim()) {
        return { success: false, error: 'Subject and message are required' };
      }

      // Prepare feedback data
      const feedbackData = {
        user_id: userId,
        feedback_type: feedback.type,
        subject: feedback.subject.trim(),
        message: feedback.message.trim(),
        rating: feedback.rating,
        page_path: window.location.pathname,
        metadata: {
          email: feedback.email,
          systemInfo: feedback.includeSystemInfo ? this.getSystemInfo() : null,
          sessionId: sessionStorage.getItem('session_id'),
          ...feedback.metadata
        },
        status: 'open' as FeedbackStatus
      };

      // Submit to database
      const { data, error } = await supabase
        .from('user_feedback')
        .insert(feedbackData)
        .select('id')
        .single();

      if (error) {
        console.error('Failed to submit feedback:', error);

        // Fallback to local storage
        this.saveToLocalStorage(feedbackData);

        return { success: false, error: 'Failed to submit feedback. Saved locally for retry.' };
      }

      // Track feedback submission
      await AnalyticsTracker.track('user_action', 'feedback_submitted', userId || undefined, {
        feedback_type: feedback.type,
        page_path: window.location.pathname,
        has_rating: !!feedback.rating,
        has_email: !!feedback.email
      });

      return { success: true, id: data.id };

    } catch (error) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  private static saveToLocalStorage(feedbackData: any): void {
    try {
      const stored = localStorage.getItem('stronghold_feedback_queue') || '[]';
      const feedbackQueue = JSON.parse(stored);

      feedbackQueue.push({
        ...feedbackData,
        queued_at: new Date().toISOString()
      });

      // Keep only last 20 feedback items
      if (feedbackQueue.length > 20) {
        feedbackQueue.splice(0, feedbackQueue.length - 20);
      }

      localStorage.setItem('stronghold_feedback_queue', JSON.stringify(feedbackQueue));
    } catch (error) {
      console.error('Failed to save feedback to localStorage:', error);
    }
  }

  static async processQueuedFeedback(): Promise<void> {
    try {
      const stored = localStorage.getItem('stronghold_feedback_queue');
      if (!stored) return;

      const feedbackQueue = JSON.parse(stored);
      if (feedbackQueue.length === 0) return;

      // Try to upload queued feedback
      const successfulUploads: number[] = [];

      for (let i = 0; i < feedbackQueue.length; i++) {
        const feedbackData = feedbackQueue[i];

        try {
          const { error } = await supabase
            .from('user_feedback')
            .insert({
              ...feedbackData,
              metadata: {
                ...feedbackData.metadata,
                queued: true,
                queued_at: feedbackData.queued_at
              }
            });

          if (!error) {
            successfulUploads.push(i);
          }
        } catch (uploadError) {
          console.error('Failed to upload queued feedback:', uploadError);
          break; // Stop processing if still having connection issues
        }
      }

      // Remove successfully uploaded items
      if (successfulUploads.length > 0) {
        const remainingFeedback = feedbackQueue.filter((_: any, index: number) => !successfulUploads.includes(index));
        localStorage.setItem('stronghold_feedback_queue', JSON.stringify(remainingFeedback));
      }

    } catch (error) {
      console.error('Failed to process feedback queue:', error);
    }
  }

  static async getFeedbackStats(days: number = 30): Promise<FeedbackStats> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('feedback_type, status, rating, created_at, resolved_at')
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalFeedback = data?.length || 0;
      const byType: Record<FeedbackType, number> = {
        bug_report: 0,
        feature_request: 0,
        general: 0,
        usability: 0,
        performance: 0
      };
      const byStatus: Record<FeedbackStatus, number> = {
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0
      };

      let totalRating = 0;
      let ratingCount = 0;
      const responseTimes: number[] = [];
      const dailyRatings: Record<string, { total: number; count: number }> = {};

      data?.forEach(feedback => {
        // Count by type
        byType[feedback.feedback_type as FeedbackType] = (byType[feedback.feedback_type as FeedbackType] || 0) + 1;

        // Count by status
        byStatus[feedback.status as FeedbackStatus] = (byStatus[feedback.status as FeedbackStatus] || 0) + 1;

        // Calculate ratings
        if (feedback.rating) {
          totalRating += feedback.rating;
          ratingCount++;

          // Daily ratings for trend
          const date = new Date(feedback.created_at).toISOString().split('T')[0];
          if (!dailyRatings[date]) {
            dailyRatings[date] = { total: 0, count: 0 };
          }
          dailyRatings[date].total += feedback.rating;
          dailyRatings[date].count++;
        }

        // Calculate response time
        if (feedback.resolved_at) {
          const responseTime = new Date(feedback.resolved_at).getTime() - new Date(feedback.created_at).getTime();
          responseTimes.push(responseTime / (1000 * 60 * 60)); // Convert to hours
        }
      });

      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      // Calculate response time stats
      responseTimes.sort((a, b) => a - b);
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
      const medianResponseTime = responseTimes.length > 0
        ? responseTimes[Math.floor(responseTimes.length / 2)]
        : 0;

      // Calculate satisfaction trend
      const satisfactionTrend = Object.entries(dailyRatings).map(([date, { total, count }]) => ({
        date,
        rating: total / count,
        count
      })).sort((a, b) => a.date.localeCompare(b.date));

      return {
        totalFeedback,
        byType,
        byStatus,
        averageRating,
        responseTime: {
          average: averageResponseTime,
          median: medianResponseTime
        },
        satisfactionTrend
      };

    } catch (error) {
      console.error('Failed to get feedback stats:', error);
      return {
        totalFeedback: 0,
        byType: {
          bug_report: 0,
          feature_request: 0,
          general: 0,
          usability: 0,
          performance: 0
        },
        byStatus: {
          open: 0,
          in_progress: 0,
          resolved: 0,
          closed: 0
        },
        averageRating: 0,
        responseTime: { average: 0, median: 0 },
        satisfactionTrend: []
      };
    }
  }

  static async getUserFeedback(userId: string, limit: number = 10): Promise<UserFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Failed to get user feedback:', error);
      return [];
    }
  }

  static async updateFeedbackStatus(
    feedbackId: string,
    status: FeedbackStatus,
    assignedTo?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      if (status === 'resolved' || status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('user_feedback')
        .update(updateData)
        .eq('id', feedbackId);

      return !error;

    } catch (error) {
      console.error('Failed to update feedback status:', error);
      return false;
    }
  }

  // Initialize feedback system
  static initialize(): void {
    // Process any queued feedback on initialization
    this.processQueuedFeedback();

    // Set up periodic queue processing
    setInterval(() => {
      this.processQueuedFeedback();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  // Helper methods for common feedback patterns
  static async reportBug(description: string, steps?: string, severity?: 'low' | 'medium' | 'high' | 'critical'): Promise<{ success: boolean; id?: string; error?: string }> {
    const subject = `Bug Report: ${description.substring(0, 50)}...`;
    const message = `Description: ${description}${steps ? `\n\nSteps to reproduce:\n${steps}` : ''}`;

    return this.submitFeedback({
      type: 'bug_report',
      subject,
      message,
      includeSystemInfo: true,
      metadata: { severity }
    });
  }

  static async requestFeature(title: string, description: string, priority?: 'low' | 'medium' | 'high'): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.submitFeedback({
      type: 'feature_request',
      subject: `Feature Request: ${title}`,
      message: description,
      metadata: { priority }
    });
  }

  static async rateExperience(rating: number, comment?: string): Promise<{ success: boolean; id?: string; error?: string }> {
    return this.submitFeedback({
      type: 'general',
      subject: `User Rating: ${rating}/5`,
      message: comment || `User rated their experience ${rating} out of 5 stars.`,
      rating,
      metadata: { experienceRating: true }
    });
  }
}