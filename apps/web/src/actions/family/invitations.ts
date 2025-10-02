'use server';

import { createClient } from '@/lib/supabase/server';
import { FamilyInvitationRequest, FamilyMember } from '@/lib/family/types';
import { revalidatePath } from 'next/cache';

export async function createFamilyInvitation(
  invitation: FamilyInvitationRequest
): Promise<{ success: boolean; invitation?: FamilyMember; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: newInvitation, error } = await supabase
      .from('family_members')
      .insert({
        family_owner_id: user.id,
        member_name: invitation.memberName,
        member_email: invitation.memberEmail,
        member_phone: invitation.memberPhone || null,
        role: invitation.role,
        access_level: invitation.accessLevel,
        invitation_status: 'pending',
        invitation_token: crypto.randomUUID(),
        token_expires_at: expiresAt.toISOString(),
        invited_by_user_id: user.id,
        meta: invitation.meta || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family');
    return { success: true, invitation: newInvitation };
  } catch (err) {
    console.error('Unexpected error creating invitation:', err);
    return { success: false, error: 'Failed to create invitation' };
  }
}

export async function acceptFamilyInvitation(
  token: string
): Promise<{ success: boolean; member?: FamilyMember; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: result, error } = await supabase
      .rpc('accept_family_invitation', {
        token: token,
        accepting_user_id: user.id
      });

    if (error || !result) {
      console.error('Error accepting invitation:', error);
      return { success: false, error: error?.message || 'Invalid or expired invitation' };
    }

    const { data: updatedMember } = await supabase
      .from('family_members')
      .select()
      .eq('member_user_id', user.id)
      .eq('invitation_status', 'accepted')
      .single();

    revalidatePath('/dashboard/family');
    return { success: true, member: updatedMember };
  } catch (err) {
    console.error('Unexpected error accepting invitation:', err);
    return { success: false, error: 'Failed to accept invitation' };
  }
}

export async function revokeFamilyInvitation(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('family_members')
      .update({
        invitation_status: 'revoked',
        invitation_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .eq('family_owner_id', user.id);

    if (error) {
      console.error('Error revoking invitation:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error revoking invitation:', err);
    return { success: false, error: 'Failed to revoke invitation' };
  }
}

export async function getFamilyMembers(): Promise<{
  success: boolean;
  members?: FamilyMember[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: members, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_owner_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching family members:', error);
      return { success: false, error: error.message };
    }

    return { success: true, members: members || [] };
  } catch (err) {
    console.error('Unexpected error fetching family members:', err);
    return { success: false, error: 'Failed to fetch family members' };
  }
}

export async function updateFamilyMember(
  memberId: string,
  updates: Partial<FamilyMember>
): Promise<{ success: boolean; member?: FamilyMember; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const allowedUpdates = {
      member_name: updates.member_name,
      member_email: updates.member_email,
      member_phone: updates.member_phone,
      role: updates.role,
      access_level: updates.access_level,
      meta: updates.meta,
      updated_at: new Date().toISOString()
    };

    const { data: updatedMember, error } = await supabase
      .from('family_members')
      .update(allowedUpdates)
      .eq('id', memberId)
      .eq('family_owner_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating family member:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family');
    return { success: true, member: updatedMember };
  } catch (err) {
    console.error('Unexpected error updating family member:', err);
    return { success: false, error: 'Failed to update family member' };
  }
}

export async function removeFamilyMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('family_members')
      .delete()
      .eq('id', memberId)
      .eq('family_owner_id', user.id);

    if (error) {
      console.error('Error removing family member:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/family');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error removing family member:', err);
    return { success: false, error: 'Failed to remove family member' };
  }
}