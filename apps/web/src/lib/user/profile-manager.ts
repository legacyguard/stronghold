import { supabase } from '@/lib/supabase';
import {
  UserProfile,
  UpdateUserProfileRequest,
  UserPrivacySettings,
  UserSecuritySettings,
  UserUIPreferences,
  APIResponse
} from '@/types';

export class UserProfileManager {
  /**
   * Get complete user profile with all settings
   */
  static async getProfile(userId: string): Promise<APIResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          privacy_settings,
          security_settings,
          ui_preferences
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return { success: false, error: 'Failed to fetch profile' };
    }
  }

  /**
   * Update user profile with validation
   */
  static async updateProfile(
    userId: string,
    updates: UpdateUserProfileRequest
  ): Promise<APIResponse<UserProfile>> {
    try {
      // Validate updates
      const validationResult = this.validateProfileUpdates(updates);
      if (!validationResult.success) {
        return validationResult;
      }

      // Prepare update object
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Handle nested settings updates
      if (updates.privacy_settings) {
        updateData.privacy_settings = updates.privacy_settings;
      }
      if (updates.security_settings) {
        updateData.security_settings = updates.security_settings;
      }
      if (updates.ui_preferences) {
        updateData.ui_preferences = updates.ui_preferences;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  /**
   * Initialize user profile for new users
   */
  static async initializeProfile(
    userId: string,
    email: string,
    initialData?: Partial<UserProfile>
  ): Promise<APIResponse<UserProfile>> {
    try {
      const defaultProfile: Partial<UserProfile> = {
        id: userId,
        email,
        country_code: 'SK',
        jurisdiction: 'SK',
        timezone: 'Europe/Bratislava',
        language_preference: 'sk',
        subscription_tier: 'free',
        subscription_status: 'active',
        is_family_owner: true,
        onboarding_completed: false,
        onboarding_step: 1,
        privacy_settings: this.getDefaultPrivacySettings(),
        security_settings: this.getDefaultSecuritySettings(),
        ui_preferences: this.getDefaultUIPreferences(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...initialData
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) {
        console.error('Error initializing user profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error initializing profile:', error);
      return { success: false, error: 'Failed to initialize profile' };
    }
  }

  /**
   * Update privacy settings
   */
  static async updatePrivacySettings(
    userId: string,
    settings: Partial<UserPrivacySettings>
  ): Promise<APIResponse<UserPrivacySettings>> {
    try {
      // Get current settings
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return { success: false, error: 'Failed to fetch current settings' };
      }

      const updatedSettings = {
        ...currentProfile.data.privacy_settings,
        ...settings
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          privacy_settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('privacy_settings')
        .single();

      if (error) {
        console.error('Error updating privacy settings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.privacy_settings };
    } catch (error) {
      console.error('Unexpected error updating privacy settings:', error);
      return { success: false, error: 'Failed to update privacy settings' };
    }
  }

  /**
   * Update security settings
   */
  static async updateSecuritySettings(
    userId: string,
    settings: Partial<UserSecuritySettings>
  ): Promise<APIResponse<UserSecuritySettings>> {
    try {
      // Get current settings
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return { success: false, error: 'Failed to fetch current settings' };
      }

      const updatedSettings = {
        ...currentProfile.data.security_settings,
        ...settings
      };

      // Validate security settings
      if (settings.ip_restrictions_enabled && !settings.allowed_ip_ranges?.length) {
        return {
          success: false,
          error: 'IP restrictions require at least one allowed IP range'
        };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          security_settings: updatedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('security_settings')
        .single();

      if (error) {
        console.error('Error updating security settings:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.security_settings };
    } catch (error) {
      console.error('Unexpected error updating security settings:', error);
      return { success: false, error: 'Failed to update security settings' };
    }
  }

  /**
   * Update UI preferences
   */
  static async updateUIPreferences(
    userId: string,
    preferences: Partial<UserUIPreferences>
  ): Promise<APIResponse<UserUIPreferences>> {
    try {
      // Get current preferences
      const currentProfile = await this.getProfile(userId);
      if (!currentProfile.success || !currentProfile.data) {
        return { success: false, error: 'Failed to fetch current preferences' };
      }

      const updatedPreferences = {
        ...currentProfile.data.ui_preferences,
        ...preferences
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ui_preferences: updatedPreferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('ui_preferences')
        .single();

      if (error) {
        console.error('Error updating UI preferences:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.ui_preferences };
    } catch (error) {
      console.error('Unexpected error updating UI preferences:', error);
      return { success: false, error: 'Failed to update UI preferences' };
    }
  }

  /**
   * Update onboarding progress
   */
  static async updateOnboardingProgress(
    userId: string,
    step: number,
    completed: boolean = false
  ): Promise<APIResponse<{ step: number, completed: boolean }>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          onboarding_step: step,
          onboarding_completed: completed,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select('onboarding_step, onboarding_completed')
        .single();

      if (error) {
        console.error('Error updating onboarding progress:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          step: data.onboarding_step,
          completed: data.onboarding_completed
        }
      };
    } catch (error) {
      console.error('Unexpected error updating onboarding:', error);
      return { success: false, error: 'Failed to update onboarding progress' };
    }
  }

  /**
   * Get user's subscription info
   */
  static async getSubscriptionInfo(userId: string): Promise<APIResponse<{
    tier: string;
    status: string;
    expires_at?: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('subscription_tier, subscription_status, subscription_expires_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription info:', error);
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          tier: data.subscription_tier,
          status: data.subscription_status,
          expires_at: data.subscription_expires_at
        }
      };
    } catch (error) {
      console.error('Unexpected error fetching subscription:', error);
      return { success: false, error: 'Failed to fetch subscription info' };
    }
  }

  /**
   * Check if user can access premium features
   */
  static async canAccessPremiumFeatures(userId: string): Promise<boolean> {
    try {
      const subscriptionInfo = await this.getSubscriptionInfo(userId);
      if (!subscriptionInfo.success || !subscriptionInfo.data) return false;

      const { tier, status } = subscriptionInfo.data;
      return (tier === 'premium' || tier === 'enterprise') && status === 'active';
    } catch (error) {
      console.error('Error checking premium access:', error);
      return false;
    }
  }

  /**
   * Validate profile updates
   */
  private static validateProfileUpdates(updates: UpdateUserProfileRequest): APIResponse {
    // Email validation
    if (updates.full_name && updates.full_name.trim().length < 2) {
      return { success: false, error: 'Full name must be at least 2 characters long' };
    }

    // Phone validation
    if (updates.phone && !/^\+?[\d\s\-\(\)]+$/.test(updates.phone)) {
      return { success: false, error: 'Invalid phone number format' };
    }

    // Date of birth validation
    if (updates.date_of_birth) {
      const birthDate = new Date(updates.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();

      if (age < 13 || age > 120) {
        return { success: false, error: 'Invalid date of birth' };
      }
    }

    // Country code validation
    if (updates.country_code && !/^[A-Z]{2}$/.test(updates.country_code)) {
      return { success: false, error: 'Invalid country code format' };
    }

    return { success: true };
  }

  /**
   * Get default privacy settings
   */
  private static getDefaultPrivacySettings(): UserPrivacySettings {
    return {
      profile_visibility: 'private',
      allow_family_invitations: true,
      allow_emergency_access: true,
      data_sharing_consent: false,
      marketing_consent: false
    };
  }

  /**
   * Get default security settings
   */
  private static getDefaultSecuritySettings(): UserSecuritySettings {
    return {
      two_factor_enabled: false,
      backup_codes_generated: false,
      emergency_access_enabled: true,
      session_timeout_minutes: 480, // 8 hours
      ip_restrictions_enabled: false
    };
  }

  /**
   * Get default UI preferences
   */
  private static getDefaultUIPreferences(): UserUIPreferences {
    return {
      theme: 'system',
      sidebar_collapsed: false,
      dashboard_layout: 'grid',
      notifications_enabled: true,
      sound_enabled: true,
      timezone_display: 'local'
    };
  }

  /**
   * Delete user profile (GDPR compliance)
   */
  static async deleteProfile(userId: string): Promise<APIResponse> {
    try {
      // Note: In production, this should archive data rather than hard delete
      // for legal and audit purposes

      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        console.error('Error deleting user profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Profile deleted successfully' };
    } catch (error) {
      console.error('Unexpected error deleting profile:', error);
      return { success: false, error: 'Failed to delete profile' };
    }
  }

  /**
   * Export user data (GDPR compliance)
   */
  static async exportUserData(userId: string): Promise<APIResponse<any>> {
    try {
      // Get all user data from various tables
      const [profile, documents, guardians, conversations] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('id', userId),
        supabase.from('documents').select('*').eq('user_id', userId),
        supabase.from('guardians').select('*').eq('user_id', userId),
        supabase.from('sofia_conversations').select('*').eq('user_id', userId)
      ]);

      const exportData = {
        profile: profile.data,
        documents: documents.data,
        guardians: guardians.data,
        conversations: conversations.data,
        exported_at: new Date().toISOString()
      };

      return { success: true, data: exportData };
    } catch (error) {
      console.error('Error exporting user data:', error);
      return { success: false, error: 'Failed to export user data' };
    }
  }
}