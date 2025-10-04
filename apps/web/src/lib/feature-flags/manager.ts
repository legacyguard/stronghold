import { supabase } from '../supabase';

export interface FeatureFlag {
  id: string;
  flag_name: string;
  is_enabled: boolean;
  rollout_percentage: number;
  target_users: string[];
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type FeatureFlagName =
  | 'will_generation'
  | 'document_management'
  | 'emergency_contacts'
  | 'health_monitoring'
  | 'financial_tracking'
  | 'sofia_ai'
  | 'family_sharing'
  | 'advisor_network'
  | 'video_messages'
  | 'admin_dashboard';

export class FeatureFlagManager {
  private static cache = new Map<string, FeatureFlag>();
  private static lastFetch = 0;
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async isEnabled(flagName: FeatureFlagName, userId?: string): Promise<boolean> {
    try {
      const flag = await this.getFlag(flagName);

      if (!flag) {
        console.warn(`Feature flag ${flagName} not found, defaulting to false`);
        return false;
      }

      // If flag is globally disabled, return false
      if (!flag.is_enabled) {
        return false;
      }

      // If user is in target users list, enable
      if (userId && flag.target_users.includes(userId)) {
        return true;
      }

      // Check rollout percentage
      if (userId && flag.rollout_percentage > 0) {
        return this.isInRolloutGroup(flagName, userId, flag.rollout_percentage);
      }

      // If no user ID provided and flag is enabled, return true
      return flag.is_enabled && flag.rollout_percentage === 100;

    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      return this.getFallbackValue(flagName);
    }
  }

  static async getFlag(flagName: string): Promise<FeatureFlag | null> {
    // Check cache first
    if (this.cache.has(flagName) && (Date.now() - this.lastFetch) < this.CACHE_TTL) {
      return this.cache.get(flagName) || null;
    }

    // Fetch from database
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .eq('flag_name', flagName)
      .single();

    if (error) {
      console.error(`Error fetching feature flag ${flagName}:`, error);
      return null;
    }

    if (data) {
      this.cache.set(flagName, data);
      this.lastFetch = Date.now();
    }

    return data;
  }

  static async getAllFlags(): Promise<FeatureFlag[]> {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('*')
      .order('flag_name');

    if (error) {
      console.error('Error fetching all feature flags:', error);
      return [];
    }

    // Update cache
    data?.forEach(flag => {
      this.cache.set(flag.flag_name, flag);
    });
    this.lastFetch = Date.now();

    return data || [];
  }

  static async updateFlag(
    flagName: string,
    updates: Partial<Pick<FeatureFlag, 'is_enabled' | 'rollout_percentage' | 'target_users' | 'conditions'>>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update(updates)
        .eq('flag_name', flagName);

      if (error) {
        console.error(`Error updating feature flag ${flagName}:`, error);
        return false;
      }

      // Clear cache to force refresh
      this.cache.delete(flagName);
      return true;

    } catch (error) {
      console.error(`Error updating feature flag ${flagName}:`, error);
      return false;
    }
  }

  private static isInRolloutGroup(flagName: string, userId: string, percentage: number): boolean {
    // Use consistent hashing to ensure user always gets same result
    const hash = this.hashUser(userId + flagName);
    return (hash % 100) < percentage;
  }

  private static hashUser(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private static getFallbackValue(flagName: FeatureFlagName): boolean {
    // Safe defaults for core features
    const safeDefaults: Record<FeatureFlagName, boolean> = {
      will_generation: true,
      document_management: true,
      emergency_contacts: true,
      health_monitoring: false,
      financial_tracking: false,
      sofia_ai: false,
      family_sharing: false,
      advisor_network: false,
      video_messages: false,
      admin_dashboard: false
    };

    return safeDefaults[flagName] || false;
  }

  // Gradual rollout helper
  static async enableGradualRollout(
    flagName: FeatureFlagName,
    targetPercentage: number,
    stepSize: number = 10,
    intervalMinutes: number = 60
  ): Promise<void> {
    const currentFlag = await this.getFlag(flagName);
    if (!currentFlag) {
      console.error(`Flag ${flagName} not found`);
      return;
    }

    let currentPercentage = currentFlag.rollout_percentage;

    const rolloutInterval = setInterval(async () => {
      if (currentPercentage >= targetPercentage) {
        clearInterval(rolloutInterval);
        console.log(`Gradual rollout complete for ${flagName}: ${targetPercentage}%`);
        return;
      }

      currentPercentage = Math.min(currentPercentage + stepSize, targetPercentage);

      const success = await this.updateFlag(flagName, {
        is_enabled: true,
        rollout_percentage: currentPercentage
      });

      if (success) {
        console.log(`Rolled out ${flagName} to ${currentPercentage}%`);
      } else {
        console.error(`Failed to update rollout for ${flagName}`);
        clearInterval(rolloutInterval);
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Emergency kill switch
  static async emergencyDisable(flagName: FeatureFlagName, reason: string): Promise<boolean> {
    console.warn(`Emergency disable triggered for ${flagName}: ${reason}`);

    const success = await this.updateFlag(flagName, {
      is_enabled: false,
      rollout_percentage: 0
    });

    if (success) {
      // Log to audit trail
      console.error(`EMERGENCY: Disabled feature flag ${flagName} - ${reason}`);
    }

    return success;
  }

  // Client-side cache management
  static clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }

  static getCacheStatus(): { size: number; lastFetch: number; age: number } {
    return {
      size: this.cache.size,
      lastFetch: this.lastFetch,
      age: Date.now() - this.lastFetch
    };
  }
}

import React from 'react';

// React hook for feature flags
export function useFeatureFlag(flagName: FeatureFlagName, userId?: string): {
  isEnabled: boolean;
  loading: boolean;
  error: string | null;
} {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    const checkFlag = async () => {
      try {
        setLoading(true);
        setError(null);

        const enabled = await FeatureFlagManager.isEnabled(flagName, userId);

        if (mounted) {
          setIsEnabled(enabled);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsEnabled(FeatureFlagManager['getFallbackValue'](flagName));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkFlag();

    return () => {
      mounted = false;
    };
  }, [flagName, userId]);

  return { isEnabled, loading, error };
}

// React component for feature gating
export function FeatureGate({
  flagName,
  userId,
  children,
  fallback = null
}: {
  flagName: FeatureFlagName;
  userId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { isEnabled, loading } = useFeatureFlag(flagName, userId);

  if (loading) {
    return React.createElement('div', { className: 'animate-pulse bg-gray-200 rounded h-4 w-20' });
  }

  return isEnabled ? React.createElement(React.Fragment, {}, children) : React.createElement(React.Fragment, {}, fallback);
}