import { supabase } from '@/lib/supabase';
import { UserProfileManager } from '@/lib/user/profile-manager';
import { DocumentManager } from '@/lib/documents/document-manager';
import { GuardianManager } from '@/lib/guardians/guardian-manager';
import {
  DashboardData,
  APIResponse,
  UserProfile,
  Document,
  Guardian,
  SubscriptionUsage
} from '@/types';

export class DashboardManager {
  /**
   * Get complete dashboard data for user
   */
  static async getDashboardData(userId: string): Promise<APIResponse<DashboardData>> {
    try {
      // Fetch all data in parallel for better performance
      const [
        profileResult,
        subscriptionResult,
        documentsResult,
        guardiansResult,
        docStatsResult,
        recentActivityResult
      ] = await Promise.all([
        UserProfileManager.getProfile(userId),
        this.getSubscriptionInfo(userId),
        DocumentManager.getDocuments(userId, { limit: 5 }),
        GuardianManager.getGuardians(userId),
        DocumentManager.getDocumentStats(userId),
        this.getRecentActivity(userId)
      ]);

      // Check for any critical failures
      if (!profileResult.success) {
        return { success: false, error: 'Failed to fetch user profile' };
      }

      if (!subscriptionResult.success) {
        return { success: false, error: 'Failed to fetch subscription data' };
      }

      if (!profileResult.data) {
        return { success: false, error: 'User profile not found' };
      }

      // Calculate insights and scores
      const completionScore = this.calculateProfileCompletionScore(profileResult.data);
      const securityScore = this.calculateSecurityScore(profileResult.data);
      const legalReadinessScore = this.calculateLegalReadinessScore(
        documentsResult.data || [],
        guardiansResult.data || []
      );

      // Generate suggested actions
      const suggestedActions = this.generateSuggestedActions(
        profileResult.data,
        documentsResult.data || [],
        guardiansResult.data || [],
        subscriptionResult.data
      );

      // Get upcoming milestones
      const upcomingMilestones = await this.getUpcomingMilestones(userId);

      const dashboardData: DashboardData = {
        user: profileResult.data,
        subscription: subscriptionResult.data,
        total_documents: docStatsResult.success && docStatsResult.data ? docStatsResult.data.total : 0,
        total_family_members: 0, // TODO: Implement family members count
        total_guardians: guardiansResult.success && guardiansResult.data ? guardiansResult.data.length : 0,
        pending_tasks: suggestedActions.filter(action => action.priority === 'high').length,
        recent_documents: documentsResult.data || [],
        recent_conversations: [], // TODO: Implement Sofia conversations
        upcoming_milestones: upcomingMilestones || [],
        completion_score: completionScore,
        security_score: securityScore,
        legal_readiness_score: legalReadinessScore,
        suggested_actions: suggestedActions
      };

      return { success: true, data: dashboardData };
    } catch (error) {
      console.error('Unexpected error fetching dashboard data:', error);
      return { success: false, error: 'Failed to fetch dashboard data' };
    }
  }

  /**
   * Get user subscription with usage tracking
   */
  private static async getSubscriptionInfo(userId: string) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching subscription:', error);
      return { success: false, error: 'Failed to fetch subscription' };
    }
  }

  /**
   * Get recent user activity
   */
  private static async getRecentActivity(userId: string) {
    try {
      // This would be more complex in production, fetching from multiple tables
      // For now, we'll use documents as activity source
      const { data: documents } = await supabase
        .from('documents')
        .select('title, created_at, document_type')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: guardians } = await supabase
        .from('guardians')
        .select('guardian_name, created_at, invitation_status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);

      // Format activity items
      const activity: Array<{
        type: string;
        title: string;
        timestamp: string;
        category: string;
      }> = [];

      if (documents) {
        documents.forEach(doc => {
          activity.push({
            type: 'document',
            title: `Document "${doc.title}" uploaded`,
            timestamp: doc.created_at,
            category: doc.document_type
          });
        });
      }

      if (guardians) {
        guardians.forEach(guardian => {
          activity.push({
            type: 'guardian',
            title: `Guardian "${guardian.guardian_name}" ${guardian.invitation_status}`,
            timestamp: guardian.created_at,
            category: guardian.invitation_status
          });
        });
      }

      // Sort by timestamp and return most recent
      activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return { success: true, data: activity.slice(0, 10) };
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return { success: false, error: 'Failed to fetch recent activity' };
    }
  }

  /**
   * Calculate profile completion score
   */
  private static calculateProfileCompletionScore(profile: UserProfile): number {
    const fields = [
      profile.full_name,
      profile.phone,
      profile.date_of_birth,
      profile.country_code,
      profile.timezone,
      profile.language_preference
    ];

    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    const totalFields = fields.length;

    // Add bonus for privacy and security settings
    const privacyCompleted = Object.keys(profile.privacy_settings || {}).length > 0;
    const securityCompleted = Object.keys(profile.security_settings || {}).length > 0;

    if (privacyCompleted) completedFields;
    if (securityCompleted) completedFields;

    return Math.round((completedFields / (totalFields + 2)) * 100);
  }

  /**
   * Calculate security score
   */
  private static calculateSecurityScore(profile: UserProfile): number {
    let score = 0;
    const maxScore = 100;

    // Two-factor authentication (30 points)
    if (profile.security_settings?.two_factor_enabled) {
      score += 30;
    }

    // Backup codes generated (10 points)
    if (profile.security_settings?.backup_codes_generated) {
      score += 10;
    }

    // Emergency access enabled (20 points)
    if (profile.security_settings?.emergency_access_enabled) {
      score += 20;
    }

    // Session timeout configured (10 points)
    if (profile.security_settings?.session_timeout_minutes &&
        profile.security_settings.session_timeout_minutes < 480) {
      score += 10;
    }

    // Privacy settings configured (15 points)
    if (profile.privacy_settings?.profile_visibility === 'private') {
      score += 15;
    }

    // Marketing consent reviewed (5 points)
    if (profile.privacy_settings?.marketing_consent !== undefined) {
      score += 5;
    }

    // Data sharing consent reviewed (10 points)
    if (profile.privacy_settings?.data_sharing_consent !== undefined) {
      score += 10;
    }

    return Math.min(score, maxScore);
  }

  /**
   * Calculate legal readiness score
   */
  private static calculateLegalReadinessScore(
    documents: Document[],
    guardians: Guardian[]
  ): number {
    let score = 0;
    const maxScore = 100;

    // Critical legal documents (40 points)
    const hasWill = documents.some(doc => doc.document_type === 'will');
    const hasPowerOfAttorney = documents.some(doc => doc.document_type === 'power_of_attorney');
    const hasMedicalDirective = documents.some(doc => doc.document_type === 'medical_directive');

    if (hasWill) score += 20;
    if (hasPowerOfAttorney) score += 10;
    if (hasMedicalDirective) score += 10;

    // Guardian setup (30 points)
    const acceptedGuardians = guardians.filter(g => g.invitation_status === 'accepted');
    if (acceptedGuardians.length >= 1) score += 15;
    if (acceptedGuardians.length >= 2) score += 10;
    if (acceptedGuardians.some(g => g.can_trigger_emergency)) score += 5;

    // Document organization (20 points)
    const legalDocs = documents.filter(doc => doc.is_legal_document);
    if (legalDocs.length >= 3) score += 10;
    if (documents.some(doc => doc.legal_significance === 'critical')) score += 10;

    // Insurance and financial protection (10 points)
    const hasInsurance = documents.some(doc => doc.document_type === 'insurance_policy');
    const hasFinancial = documents.some(doc => doc.document_type === 'financial_account');

    if (hasInsurance) score += 5;
    if (hasFinancial) score += 5;

    return Math.min(score, maxScore);
  }

  /**
   * Generate contextual suggested actions
   */
  private static generateSuggestedActions(
    profile: UserProfile,
    documents: Document[],
    guardians: Guardian[],
    subscription: any
  ) {
    const actions = [];

    // Profile completion
    if (!profile.full_name) {
      actions.push({
        title: 'Complete Profile',
        description: 'Add your full name to personalize your experience',
        action_type: 'profile',
        priority: 'medium' as const,
        url: '/settings/profile'
      });
    }

    // Security improvements
    if (!profile.security_settings?.two_factor_enabled) {
      actions.push({
        title: 'Enable Two-Factor Authentication',
        description: 'Strengthen your account security with 2FA',
        action_type: 'security',
        priority: 'high' as const,
        url: '/settings/security'
      });
    }

    // Legal document creation
    const hasWill = documents.some(doc => doc.document_type === 'will');
    if (!hasWill) {
      actions.push({
        title: 'Create Your Will',
        description: 'Ensure your assets are protected and distributed according to your wishes',
        action_type: 'legal',
        priority: 'high' as const,
        url: '/will-generator'
      });
    }

    // Guardian setup
    const acceptedGuardians = guardians.filter(g => g.invitation_status === 'accepted');
    if (acceptedGuardians.length === 0) {
      actions.push({
        title: 'Add Your First Guardian',
        description: 'Invite trusted contacts to help protect your family',
        action_type: 'guardian',
        priority: 'high' as const,
        url: '/guardians'
      });
    }

    // Subscription upgrade
    if (subscription.tier === 'free' && documents.length >= 3) {
      actions.push({
        title: 'Upgrade to Premium',
        description: 'Unlock unlimited documents and advanced features',
        action_type: 'subscription',
        priority: 'medium' as const,
        url: '/settings/subscription'
      });
    }

    // Document backup
    if (documents.length > 0 && documents.filter(d => d.file_url).length === 0) {
      actions.push({
        title: 'Upload Document Files',
        description: 'Backup physical documents digitally for extra security',
        action_type: 'document',
        priority: 'medium' as const,
        url: '/vault'
      });
    }

    return actions.slice(0, 6); // Limit to 6 suggestions
  }

  /**
   * Get upcoming milestones and important dates
   */
  private static async getUpcomingMilestones(userId: string) {
    try {
      // In a full implementation, this would check:
      // - Document expiration dates
      // - Guardian invitation expirations
      // - Subscription renewal dates
      // - Family member birthdays
      // - Time capsule delivery dates

      const milestones: Array<{
        title: string;
        date: string;
        type: string;
      }> = [];

      // Check for expiring documents
      const { data: documents } = await supabase
        .from('documents')
        .select('title, expiration_date')
        .eq('user_id', userId)
        .not('expiration_date', 'is', null);

      if (documents) {
        documents.forEach(doc => {
          if (doc.expiration_date) {
            const expirationDate = new Date(doc.expiration_date);
            const now = new Date();
            const daysUntilExpiration = Math.ceil(
              (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (daysUntilExpiration <= 90 && daysUntilExpiration > 0) {
              milestones.push({
                title: `${doc.title} expires`,
                date: doc.expiration_date,
                type: 'document_expiration'
              });
            }
          }
        });
      }

      // Check for pending guardian invitations
      const { data: pendingGuardians } = await supabase
        .from('guardians')
        .select('guardian_name, token_expires_at')
        .eq('user_id', userId)
        .eq('invitation_status', 'pending');

      if (pendingGuardians) {
        pendingGuardians.forEach(guardian => {
          if (guardian.token_expires_at) {
            milestones.push({
              title: `Guardian invitation to ${guardian.guardian_name} expires`,
              date: guardian.token_expires_at,
              type: 'guardian_invitation'
            });
          }
        });
      }

      // Sort by date
      milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      return milestones.slice(0, 5); // Return next 5 milestones
    } catch (error) {
      console.error('Error fetching upcoming milestones:', error);
      return [];
    }
  }

  /**
   * Update user usage statistics
   */
  static async updateUsageStats(
    userId: string,
    usageType: keyof SubscriptionUsage,
    increment: number = 1
  ): Promise<APIResponse> {
    try {
      // Get current usage
      const { data: subscription, error: fetchError } = await supabase
        .from('subscriptions')
        .select('usage')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Update usage
      const currentUsage = subscription.usage || {};
      const updatedUsage = {
        ...currentUsage,
        [usageType]: (currentUsage[usageType] || 0) + increment
      };

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ usage: updatedUsage })
        .eq('user_id', userId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, message: 'Usage stats updated successfully' };
    } catch (error) {
      console.error('Error updating usage stats:', error);
      return { success: false, error: 'Failed to update usage stats' };
    }
  }

  /**
   * Check if user has reached usage limits
   */
  static async checkUsageLimits(
    userId: string,
    usageType: keyof SubscriptionUsage
  ): Promise<APIResponse<{ canProceed: boolean; currentUsage: number; limit: number }>> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('usage, limits, tier')
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      const currentUsage = subscription.usage?.[usageType] || 0;
      const limit = subscription.limits?.[`max_${usageType}`] || 0;

      // -1 means unlimited
      const canProceed = limit === -1 || currentUsage < limit;

      return {
        success: true,
        data: {
          canProceed,
          currentUsage,
          limit
        }
      };
    } catch (error) {
      console.error('Error checking usage limits:', error);
      return { success: false, error: 'Failed to check usage limits' };
    }
  }

  /**
   * Get dashboard insights and recommendations
   */
  static async getDashboardInsights(userId: string): Promise<APIResponse<{
    insights: Array<{
      type: 'success' | 'warning' | 'info' | 'danger';
      title: string;
      description: string;
      action?: {
        label: string;
        url: string;
      };
    }>;
  }>> {
    try {
      const dashboardResult = await this.getDashboardData(userId);
      if (!dashboardResult.success || !dashboardResult.data) {
        return { success: false, error: dashboardResult.error || 'Failed to get dashboard data' };
      }

      const dashboard = dashboardResult.data;
      const insights = [];

      // Security insights
      if (dashboard.security_score < 70) {
        insights.push({
          type: 'warning' as const,
          title: 'Security Needs Attention',
          description: `Your security score is ${dashboard.security_score}%. Consider enabling two-factor authentication.`,
          action: {
            label: 'Improve Security',
            url: '/settings/security'
          }
        });
      } else if (dashboard.security_score >= 90) {
        insights.push({
          type: 'success' as const,
          title: 'Excellent Security',
          description: `Your security score is ${dashboard.security_score}%. Your account is well protected!`
        });
      }

      // Legal readiness insights
      if (dashboard.legal_readiness_score < 50) {
        insights.push({
          type: 'danger' as const,
          title: 'Legal Protection Incomplete',
          description: `Your legal readiness score is ${dashboard.legal_readiness_score}%. Critical documents may be missing.`,
          action: {
            label: 'Create Will',
            url: '/will-generator'
          }
        });
      }

      // Guardian insights
      if (dashboard.total_guardians === 0) {
        insights.push({
          type: 'warning' as const,
          title: 'No Guardians Added',
          description: 'Add trusted contacts who can help protect your family in emergencies.',
          action: {
            label: 'Add Guardian',
            url: '/guardians'
          }
        });
      }

      // Usage insights
      const usageResult = await this.checkUsageLimits(userId, 'documents_stored');
      if (usageResult.success && usageResult.data) {
        const { currentUsage, limit } = usageResult.data;
        if (limit > 0 && currentUsage / limit > 0.8) {
          insights.push({
            type: 'info' as const,
            title: 'Storage Almost Full',
            description: `You're using ${currentUsage}/${limit} document slots. Consider upgrading.`,
            action: {
              label: 'Upgrade Plan',
              url: '/settings/subscription'
            }
          });
        }
      }

      return { success: true, data: { insights } };
    } catch (error) {
      console.error('Error generating dashboard insights:', error);
      return { success: false, error: 'Failed to generate insights' };
    }
  }
}