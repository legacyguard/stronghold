'use server';

import { createClient } from '@/lib/supabase/server';
import { EmergencySettings, UpdateEmergencySettingsRequest } from '@/lib/emergency/types';
import { revalidatePath } from 'next/cache';

export async function getEmergencySettings(): Promise<{
  success: boolean;
  settings?: EmergencySettings;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: settings, error } = await supabase
      .from('emergency_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching emergency settings:', error);
      return { success: false, error: error.message };
    }

    if (!settings) {
      const defaultSettings = await createDefaultEmergencySettings();
      return defaultSettings;
    }

    return { success: true, settings };
  } catch (err) {
    console.error('Unexpected error fetching emergency settings:', err);
    return { success: false, error: 'Failed to fetch emergency settings' };
  }
}

export async function updateEmergencySettings(
  updates: UpdateEmergencySettingsRequest
): Promise<{ success: boolean; settings?: EmergencySettings; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data: updatedSettings, error } = await supabase
      .from('emergency_settings')
      .upsert({
        user_id: user.id,
        ...updateData
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating emergency settings:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/emergency');
    return { success: true, settings: updatedSettings };
  } catch (err) {
    console.error('Unexpected error updating emergency settings:', err);
    return { success: false, error: 'Failed to update emergency settings' };
  }
}

export async function createDefaultEmergencySettings(): Promise<{
  success: boolean;
  settings?: EmergencySettings;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const defaultSettings = {
      user_id: user.id,
      is_system_active: false,
      default_language: 'en',
      timezone: 'UTC',
      default_escalation_delay_hours: 24,
      max_escalation_levels: 3,
      require_manual_confirmation: true,
      notification_methods: ['email'],
      respect_quiet_hours: true,
      cancellation_grace_period_minutes: 60,
      require_ip_verification: false
    };

    const { data: newSettings, error } = await supabase
      .from('emergency_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) {
      console.error('Error creating default emergency settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, settings: newSettings };
  } catch (err) {
    console.error('Unexpected error creating default emergency settings:', err);
    return { success: false, error: 'Failed to create default emergency settings' };
  }
}

export async function toggleEmergencySystem(
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('emergency_settings')
      .upsert({
        user_id: user.id,
        is_system_active: isActive,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error toggling emergency system:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/emergency');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error toggling emergency system:', err);
    return { success: false, error: 'Failed to toggle emergency system' };
  }
}