import { supabase } from '@/lib/supabase';
import {
  Guardian,
  InviteGuardianRequest,
  GuardianRelationship,
  GuardianAccessLevel,
  GuardianPermissions,
  APIResponse
} from '@/types';
import { generateSecureToken } from '@/lib/utils';

export class GuardianManager {
  /**
   * Invite a new guardian
   */
  static async inviteGuardian(
    userId: string,
    request: InviteGuardianRequest
  ): Promise<APIResponse<Guardian>> {
    try {
      // Check subscription limits
      const canInvite = await this.canInviteMoreGuardians(userId);
      if (!canInvite.success) {
        return canInvite;
      }

      // Generate invitation token
      const invitationToken = generateSecureToken();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days to accept

      // Get default permissions for access level
      const permissions = this.getDefaultPermissions(request.access_level);

      const guardianData = {
        user_id: userId,
        guardian_name: request.guardian_name,
        guardian_email: request.guardian_email,
        guardian_phone: request.guardian_phone,
        relationship: request.relationship,
        access_level: request.access_level,
        permissions,
        emergency_priority: request.emergency_priority,
        can_trigger_emergency: request.can_trigger_emergency,
        emergency_activation_method: 'email' as const,
        invitation_status: 'pending' as const,
        invitation_token: invitationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        notes: request.notes,
        accessible_documents: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('guardians')
        .insert(guardianData)
        .select()
        .single();

      if (error) {
        console.error('Error inviting guardian:', error);
        return { success: false, error: error.message };
      }

      // Send invitation email
      await this.sendInvitationEmail(data);

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error inviting guardian:', error);
      return { success: false, error: 'Failed to invite guardian' };
    }
  }

  /**
   * Get all guardians for a user
   */
  static async getGuardians(userId: string): Promise<APIResponse<Guardian[]>> {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('user_id', userId)
        .order('emergency_priority', { ascending: true });

      if (error) {
        console.error('Error fetching guardians:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching guardians:', error);
      return { success: false, error: 'Failed to fetch guardians' };
    }
  }

  /**
   * Update guardian information
   */
  static async updateGuardian(
    guardianId: string,
    userId: string,
    updates: Partial<Guardian>
  ): Promise<APIResponse<Guardian>> {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('guardians')
        .update(updateData)
        .eq('id', guardianId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating guardian:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error updating guardian:', error);
      return { success: false, error: 'Failed to update guardian' };
    }
  }

  /**
   * Accept guardian invitation
   */
  static async acceptInvitation(token: string): Promise<APIResponse<Guardian>> {
    try {
      // Find guardian by token
      const { data: guardian, error: findError } = await supabase
        .from('guardians')
        .select('*')
        .eq('invitation_token', token)
        .eq('invitation_status', 'pending')
        .single();

      if (findError || !guardian) {
        return { success: false, error: 'Invalid or expired invitation token' };
      }

      // Check if token is expired
      if (new Date() > new Date(guardian.token_expires_at!)) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Update guardian status
      const { data, error } = await supabase
        .from('guardians')
        .update({
          invitation_status: 'accepted',
          accepted_at: new Date().toISOString(),
          invitation_token: null,
          token_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', guardian.id)
        .select()
        .single();

      if (error) {
        console.error('Error accepting invitation:', error);
        return { success: false, error: error.message };
      }

      // Send notification to family owner
      await this.notifyFamilyOwner(guardian.user_id, guardian.guardian_name);

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error accepting invitation:', error);
      return { success: false, error: 'Failed to accept invitation' };
    }
  }

  /**
   * Decline guardian invitation
   */
  static async declineInvitation(token: string): Promise<APIResponse> {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .update({
          invitation_status: 'declined',
          invitation_token: null,
          token_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('invitation_token', token)
        .eq('invitation_status', 'pending');

      if (error) {
        console.error('Error declining invitation:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Invitation declined successfully' };
    } catch (error) {
      console.error('Unexpected error declining invitation:', error);
      return { success: false, error: 'Failed to decline invitation' };
    }
  }

  /**
   * Revoke guardian invitation or access
   */
  static async revokeGuardian(
    guardianId: string,
    userId: string
  ): Promise<APIResponse> {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .update({
          invitation_status: 'revoked',
          invitation_token: null,
          token_expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', guardianId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error revoking guardian:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Guardian access revoked successfully' };
    } catch (error) {
      console.error('Unexpected error revoking guardian:', error);
      return { success: false, error: 'Failed to revoke guardian access' };
    }
  }

  /**
   * Delete guardian completely
   */
  static async deleteGuardian(
    guardianId: string,
    userId: string
  ): Promise<APIResponse> {
    try {
      const { error } = await supabase
        .from('guardians')
        .delete()
        .eq('id', guardianId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting guardian:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Guardian deleted successfully' };
    } catch (error) {
      console.error('Unexpected error deleting guardian:', error);
      return { success: false, error: 'Failed to delete guardian' };
    }
  }

  /**
   * Grant document access to guardian
   */
  static async grantDocumentAccess(
    guardianId: string,
    userId: string,
    documentIds: string[]
  ): Promise<APIResponse<Guardian>> {
    try {
      // Get current guardian
      const { data: guardian, error: fetchError } = await supabase
        .from('guardians')
        .select('accessible_documents')
        .eq('id', guardianId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Merge with existing accessible documents
      const existingDocs = guardian.accessible_documents || [];
      const updatedDocs = [...new Set([...existingDocs, ...documentIds])];

      const { data, error } = await supabase
        .from('guardians')
        .update({
          accessible_documents: updatedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', guardianId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error granting document access:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error granting document access:', error);
      return { success: false, error: 'Failed to grant document access' };
    }
  }

  /**
   * Revoke document access from guardian
   */
  static async revokeDocumentAccess(
    guardianId: string,
    userId: string,
    documentIds: string[]
  ): Promise<APIResponse<Guardian>> {
    try {
      // Get current guardian
      const { data: guardian, error: fetchError } = await supabase
        .from('guardians')
        .select('accessible_documents')
        .eq('id', guardianId)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      // Remove specified documents
      const existingDocs = guardian.accessible_documents || [];
      const updatedDocs = existingDocs.filter((docId: string) => !documentIds.includes(docId));

      const { data, error } = await supabase
        .from('guardians')
        .update({
          accessible_documents: updatedDocs,
          updated_at: new Date().toISOString()
        })
        .eq('id', guardianId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error revoking document access:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error revoking document access:', error);
      return { success: false, error: 'Failed to revoke document access' };
    }
  }

  /**
   * Get guardians for emergency activation (sorted by priority)
   */
  static async getEmergencyGuardians(userId: string): Promise<APIResponse<Guardian[]>> {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('user_id', userId)
        .eq('invitation_status', 'accepted')
        .eq('can_trigger_emergency', true)
        .order('emergency_priority', { ascending: true });

      if (error) {
        console.error('Error fetching emergency guardians:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Unexpected error fetching emergency guardians:', error);
      return { success: false, error: 'Failed to fetch emergency guardians' };
    }
  }

  /**
   * Check if user can invite more guardians based on subscription
   */
  private static async canInviteMoreGuardians(userId: string): Promise<APIResponse> {
    try {
      // Get current guardian count
      const { count, error: countError } = await supabase
        .from('guardians')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .neq('invitation_status', 'revoked');

      if (countError) {
        return { success: false, error: countError.message };
      }

      // Get user subscription
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { success: false, error: profileError.message };
      }

      // Check limits based on tier
      const limits = this.getSubscriptionLimits(profile.subscription_tier);
      if (limits.maxGuardians !== -1 && (count || 0) >= limits.maxGuardians) {
        return {
          success: false,
          error: `Guardian limit reached for ${profile.subscription_tier} tier (${limits.maxGuardians} guardians)`
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error checking guardian limits:', error);
      return { success: false, error: 'Failed to check guardian limits' };
    }
  }

  /**
   * Get subscription limits for guardians
   */
  private static getSubscriptionLimits(tier: string): { maxGuardians: number } {
    switch (tier) {
      case 'premium':
        return { maxGuardians: 5 };
      case 'enterprise':
        return { maxGuardians: -1 }; // unlimited
      default: // free
        return { maxGuardians: 1 };
    }
  }

  /**
   * Get default permissions based on access level
   */
  private static getDefaultPermissions(accessLevel: GuardianAccessLevel): GuardianPermissions {
    const basePermissions: GuardianPermissions = {
      view_documents: false,
      download_documents: false,
      receive_updates: true,
      trigger_emergency_protocol: false,
      access_emergency_contacts: false,
      view_family_tree: false,
      receive_milestone_notifications: false
    };

    switch (accessLevel) {
      case 'full':
        return {
          ...basePermissions,
          view_documents: true,
          download_documents: true,
          trigger_emergency_protocol: true,
          access_emergency_contacts: true,
          view_family_tree: true,
          receive_milestone_notifications: true
        };

      case 'standard':
        return {
          ...basePermissions,
          view_documents: true,
          trigger_emergency_protocol: true,
          access_emergency_contacts: true,
          view_family_tree: true
        };

      case 'limited':
        return {
          ...basePermissions,
          view_documents: true,
          access_emergency_contacts: true
        };

      case 'emergency_only':
      default:
        return {
          ...basePermissions,
          trigger_emergency_protocol: true,
          access_emergency_contacts: true
        };
    }
  }

  /**
   * Send invitation email (placeholder - would integrate with email service)
   */
  private static async sendInvitationEmail(guardian: Guardian): Promise<void> {
    try {
      // In production, this would send actual email
      console.log(`Sending invitation email to ${guardian.guardian_email}`);
      console.log(`Invitation token: ${guardian.invitation_token}`);

      // For now, we'll create a notification record
      // This could be handled by an edge function or email service
    } catch (error) {
      console.error('Error sending invitation email:', error);
    }
  }

  /**
   * Notify family owner of accepted invitation
   */
  private static async notifyFamilyOwner(userId: string, guardianName: string): Promise<void> {
    try {
      // In production, this would send notification
      console.log(`Guardian ${guardianName} accepted invitation for user ${userId}`);
    } catch (error) {
      console.error('Error notifying family owner:', error);
    }
  }

  /**
   * Get invitation details by token (for invitation page)
   */
  static async getInvitationDetails(token: string): Promise<APIResponse<{
    guardian: Guardian;
    familyOwner: { name?: string; email: string };
  }>> {
    try {
      const { data: guardian, error: guardianError } = await supabase
        .from('guardians')
        .select('*')
        .eq('invitation_token', token)
        .eq('invitation_status', 'pending')
        .single();

      if (guardianError || !guardian) {
        return { success: false, error: 'Invalid or expired invitation' };
      }

      // Check if token is expired
      if (new Date() > new Date(guardian.token_expires_at!)) {
        return { success: false, error: 'Invitation has expired' };
      }

      // Get family owner info
      const { data: familyOwner, error: ownerError } = await supabase
        .from('user_profiles')
        .select('full_name, email')
        .eq('id', guardian.user_id)
        .single();

      if (ownerError) {
        return { success: false, error: 'Failed to fetch family owner information' };
      }

      return {
        success: true,
        data: {
          guardian,
          familyOwner: {
            name: familyOwner.full_name,
            email: familyOwner.email
          }
        }
      };
    } catch (error) {
      console.error('Unexpected error fetching invitation details:', error);
      return { success: false, error: 'Failed to fetch invitation details' };
    }
  }

  /**
   * Resend invitation email
   */
  static async resendInvitation(
    guardianId: string,
    userId: string
  ): Promise<APIResponse> {
    try {
      // Generate new token and extend expiry
      const newToken = generateSecureToken();
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);

      const { data, error } = await supabase
        .from('guardians')
        .update({
          invitation_token: newToken,
          token_expires_at: newExpiry.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', guardianId)
        .eq('user_id', userId)
        .eq('invitation_status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error resending invitation:', error);
        return { success: false, error: error.message };
      }

      // Send new invitation email
      await this.sendInvitationEmail(data);

      return { success: true, message: 'Invitation resent successfully' };
    } catch (error) {
      console.error('Unexpected error resending invitation:', error);
      return { success: false, error: 'Failed to resend invitation' };
    }
  }
}