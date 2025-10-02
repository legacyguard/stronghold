'use server';

import { createClient } from '@/lib/supabase/server';
import { FamilyCalendarEvent, FamilyMilestone } from '@/lib/family/types';
import { revalidatePath } from 'next/cache';

export async function createCalendarEvent(
  event: Omit<FamilyCalendarEvent, 'id' | 'family_owner_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; event?: FamilyCalendarEvent; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: newEvent, error } = await supabase
      .from('family_calendar_events')
      .insert({
        ...event,
        family_owner_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating calendar event:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family/calendar');
    return { success: true, event: newEvent };
  } catch (err) {
    console.error('Unexpected error creating calendar event:', err);
    return { success: false, error: 'Failed to create calendar event' };
  }
}

export async function getCalendarEvents(): Promise<{
  success: boolean;
  events?: FamilyCalendarEvent[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: events, error } = await supabase
      .from('family_calendar_events')
      .select('*')
      .eq('family_owner_id', user.id)
      .order('start_at', { ascending: true });

    if (error) {
      console.error('Error fetching calendar events:', error);
      return { success: false, error: error.message };
    }

    return { success: true, events: events || [] };
  } catch (err) {
    console.error('Unexpected error fetching calendar events:', err);
    return { success: false, error: 'Failed to fetch calendar events' };
  }
}

export async function updateCalendarEvent(
  eventId: string,
  updates: Partial<FamilyCalendarEvent>
): Promise<{ success: boolean; event?: FamilyCalendarEvent; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const allowedUpdates = {
      title: updates.title,
      description: updates.description,
      event_type: updates.event_type,
      start_at: updates.start_at,
      end_at: updates.end_at,
      organizer_user_id: updates.organizer_user_id,
      attendee_member_ids: updates.attendee_member_ids,
      related_document_id: updates.related_document_id,
      related_milestone_id: updates.related_milestone_id,
      updated_at: new Date().toISOString()
    };

    const { data: updatedEvent, error } = await supabase
      .from('family_calendar_events')
      .update(allowedUpdates)
      .eq('id', eventId)
      .eq('family_owner_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating calendar event:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family/calendar');
    return { success: true, event: updatedEvent };
  } catch (err) {
    console.error('Unexpected error updating calendar event:', err);
    return { success: false, error: 'Failed to update calendar event' };
  }
}

export async function deleteCalendarEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('family_calendar_events')
      .delete()
      .eq('id', eventId)
      .eq('family_owner_id', user.id);

    if (error) {
      console.error('Error deleting calendar event:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family/calendar');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting calendar event:', err);
    return { success: false, error: 'Failed to delete calendar event' };
  }
}

export async function createMilestone(
  milestone: Omit<FamilyMilestone, 'id' | 'family_owner_id' | 'created_at' | 'updated_at'>
): Promise<{ success: boolean; milestone?: FamilyMilestone; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: newMilestone, error } = await supabase
      .from('family_milestones')
      .insert({
        ...milestone,
        family_owner_id: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating milestone:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family/milestones');
    return { success: true, milestone: newMilestone };
  } catch (err) {
    console.error('Unexpected error creating milestone:', err);
    return { success: false, error: 'Failed to create milestone' };
  }
}

export async function getMilestones(): Promise<{
  success: boolean;
  milestones?: FamilyMilestone[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: milestones, error } = await supabase
      .from('family_milestones')
      .select('*')
      .eq('family_owner_id', user.id)
      .order('due_at', { ascending: true });

    if (error) {
      console.error('Error fetching milestones:', error);
      return { success: false, error: error.message };
    }

    return { success: true, milestones: milestones || [] };
  } catch (err) {
    console.error('Unexpected error fetching milestones:', err);
    return { success: false, error: 'Failed to fetch milestones' };
  }
}

export async function updateMilestone(
  milestoneId: string,
  updates: Partial<FamilyMilestone>
): Promise<{ success: boolean; milestone?: FamilyMilestone; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const allowedUpdates = {
      title: updates.title,
      description: updates.description,
      milestone_type: updates.milestone_type,
      due_at: updates.due_at,
      beneficiary_member_id: updates.beneficiary_member_id,
      status: updates.status,
      completed_at: updates.completed_at,
      completed_by: updates.completed_by,
      updated_at: new Date().toISOString()
    };

    const { data: updatedMilestone, error } = await supabase
      .from('family_milestones')
      .update(allowedUpdates)
      .eq('id', milestoneId)
      .eq('family_owner_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating milestone:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family/milestones');
    return { success: true, milestone: updatedMilestone };
  } catch (err) {
    console.error('Unexpected error updating milestone:', err);
    return { success: false, error: 'Failed to update milestone' };
  }
}

export async function deleteMilestone(
  milestoneId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('family_milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('family_owner_id', user.id);

    if (error) {
      console.error('Error deleting milestone:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family/milestones');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting milestone:', err);
    return { success: false, error: 'Failed to delete milestone' };
  }
}