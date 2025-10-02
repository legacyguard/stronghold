import {
  FamilyMember,
  FamilyRole,
  FamilyInvitation,
  EmergencyAccess,
  FamilyCalendarEvent,
  FamilyMilestone,
  getDefaultPermissions,
  getTierLimits,
  canInviteMember
} from './types';

export class FamilyCollaborationManager {
  private members: Map<string, FamilyMember> = new Map();
  private invitations: Map<string, FamilyInvitation> = new Map();
  private emergencyAccess: EmergencyAccess | null = null;
  private calendarEvents: Map<string, FamilyCalendarEvent> = new Map();
  private milestones: Map<string, FamilyMilestone> = new Map();

  constructor(
    private userId: string,
    private userTier: 'free' | 'paid' | 'family_edition' = 'free'
  ) {}

  // ==========================================
  // MEMBER MANAGEMENT
  // ==========================================

  /**
   * Invite a family member
   */
  async inviteMember(
    email: string,
    role: FamilyRole,
    relationship: string,
    message?: string
  ): Promise<{ success: boolean; invitationId?: string; error?: string }> {
    try {
      // Check tier limits
      const currentMemberCount = this.members.size;
      if (!canInviteMember(currentMemberCount, this.userTier)) {
        const limits = getTierLimits(this.userTier);
        return {
          success: false,
          error: `Limit ${limits.maxMembers} členov prekročený. Upgrade na vyšší tier.`
        };
      }

      // Check for duplicate invitations
      const existingInvitation = Array.from(this.invitations.values())
        .find(inv => inv.inviteeEmail === email && inv.status === 'pending');

      if (existingInvitation) {
        return {
          success: false,
          error: 'Pozvánka pre tento email už existuje'
        };
      }

      // Check if already a member
      const existingMember = Array.from(this.members.values())
        .find(member => member.email === email);

      if (existingMember) {
        return {
          success: false,
          error: 'Táto osoba je už členom rodiny'
        };
      }

      // Create invitation
      const invitation: FamilyInvitation = {
        id: crypto.randomUUID(),
        inviterId: this.userId,
        inviterName: 'User', // In production, get from user data
        inviteeEmail: email,
        role,
        permissions: getDefaultPermissions(role),
        message,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'pending',
        createdAt: new Date()
      };

      this.invitations.set(invitation.id, invitation);

      // In production: Send email invitation
      console.log('📧 Family invitation sent:', {
        to: email,
        role,
        relationship,
        invitationId: invitation.id
      });

      return {
        success: true,
        invitationId: invitation.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Neznáma chyba'
      };
    }
  }

  /**
   * Accept family invitation
   */
  async acceptInvitation(
    invitationId: string,
    accepterUserId: string,
    accepterName: string
  ): Promise<{ success: boolean; memberId?: string; error?: string }> {
    try {
      const invitation = this.invitations.get(invitationId);

      if (!invitation) {
        return { success: false, error: 'Pozvánka nenájdená' };
      }

      if (invitation.status !== 'pending') {
        return { success: false, error: 'Pozvánka už bola spracovaná' };
      }

      if (invitation.expiresAt < new Date()) {
        invitation.status = 'expired';
        return { success: false, error: 'Pozvánka expirovala' };
      }

      // Create family member
      const member: FamilyMember = {
        id: crypto.randomUUID(),
        family_owner_id: this.userId,
        member_user_id: accepterUserId,
        member_name: accepterName,
        member_email: invitation.inviteeEmail,
        role: invitation.role,
        access_level: 'full',
        invitation_status: 'accepted',
        invited_by_user_id: this.userId,
        accepted_by_user_id: accepterUserId,
        meta: { permissions: invitation.permissions },
        created_at: invitation.createdAt.toISOString(),
        updated_at: new Date().toISOString(),
        availableInTier: this.userTier
      };

      this.members.set(member.id, member);
      invitation.status = 'accepted';

      console.log('✅ Family member added:', member);

      return {
        success: true,
        memberId: member.id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Neznáma chyba'
      };
    }
  }

  /**
   * Remove family member
   */
  async removeMember(memberId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const member = this.members.get(memberId);

      if (!member) {
        return { success: false, error: 'Člen nenájdený' };
      }

      this.members.delete(memberId);

      // Remove from emergency access if configured
      if (this.emergencyAccess) {
        this.emergencyAccess.notifiedMembers = this.emergencyAccess.notifiedMembers
          .filter(id => id !== member.userId);
      }

      console.log('🗑️ Family member removed:', memberId);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Neznáma chyba'
      };
    }
  }

  /**
   * Update member role and permissions
   */
  async updateMemberRole(
    memberId: string,
    newRole: FamilyRole
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const member = this.members.get(memberId);

      if (!member) {
        return { success: false, error: 'Člen nenájdený' };
      }

      member.role = newRole;
      member.permissions = getDefaultPermissions(newRole);

      console.log('🔄 Member role updated:', { memberId, newRole });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Neznáma chyba'
      };
    }
  }

  // ==========================================
  // EMERGENCY ACCESS
  // ==========================================

  /**
   * Configure emergency access
   */
  configureEmergencyAccess(
    deadMansInterval: number = 30, // days
    notifiedMembers: string[] = []
  ): void {
    if (!getTierLimits(this.userTier).emergencyAccess) {
      throw new Error('Emergency access nie je dostupný v tomto tier');
    }

    this.emergencyAccess = {
      id: crypto.randomUUID(),
      userId: this.userId,
      triggerType: 'dead_mans_switch',
      activatedBy: '',
      activatedAt: new Date(),
      deadMansInterval,
      lastCheckIn: new Date(),
      notifiedMembers,
      documentsShared: [],
      protocols: []
    };

    console.log('🚨 Emergency access configured:', this.emergencyAccess);
  }

  /**
   * Check in to reset dead man's switch
   */
  checkIn(): void {
    if (this.emergencyAccess) {
      this.emergencyAccess.lastCheckIn = new Date();
      console.log('✅ Emergency check-in completed');
    }
  }

  /**
   * Manually trigger emergency protocol
   */
  triggerEmergencyProtocol(triggeredBy: string): void {
    if (this.emergencyAccess) {
      this.emergencyAccess.activatedBy = triggeredBy;
      this.emergencyAccess.activatedAt = new Date();

      // Notify all emergency contacts
      const emergencyMembers = Array.from(this.members.values())
        .filter(member => member.permissions?.accessEmergency);

      console.log('🚨 Emergency protocol triggered:', {
        triggeredBy,
        notifiedMembers: emergencyMembers.map(m => m.email)
      });

      // In production: Send emergency notifications
    }
  }

  // ==========================================
  // CALENDAR & MILESTONES
  // ==========================================

  /**
   * Add calendar event
   */
  addCalendarEvent(
    title: string,
    date: Date,
    type: 'milestone' | 'reminder' | 'meeting' | 'deadline' = 'reminder',
    attendees: string[] = []
  ): string {
    if (!getTierLimits(this.userTier).calendarIntegration) {
      throw new Error('Kalendár nie je dostupný v tomto tier');
    }

    const event: FamilyCalendarEvent = {
      id: crypto.randomUUID(),
      family_owner_id: this.userId,
      title,
      event_type: type as 'general' | 'milestone' | 'reminder' | 'meeting' | 'deadline',
      start_at: date.toISOString(),
      organizer_user_id: this.userId,
      attendee_member_ids: attendees,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.calendarEvents.set(event.id, event);

    console.log('📅 Calendar event added:', event);

    return event.id;
  }

  /**
   * Add family milestone
   */
  addMilestone(
    title: string,
    date: Date,
    type: 'birthday' | 'anniversary' | 'graduation' | 'inheritance' | 'custom' = 'custom',
    beneficiaryId?: string
  ): string {
    if (!getTierLimits(this.userTier).milestoneTracking) {
      throw new Error('Míľniky nie sú dostupné v tomto tier');
    }

    const milestone: FamilyMilestone = {
      id: crypto.randomUUID(),
      family_owner_id: this.userId,
      title,
      description: '',
      milestone_type: type as 'general' | 'birthday' | 'anniversary' | 'graduation' | 'inheritance' | 'custom',
      due_at: date.toISOString(),
      beneficiary_member_id: beneficiaryId,
      status: 'planned',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.milestones.set(milestone.id, milestone);

    console.log('🎯 Milestone added:', milestone);

    return milestone.id;
  }

  // ==========================================
  // GETTERS & UTILITIES
  // ==========================================

  getMembers(): FamilyMember[] {
    return Array.from(this.members.values());
  }

  getMembersByRole(role: FamilyRole): FamilyMember[] {
    return Array.from(this.members.values()).filter(member => member.role === role);
  }

  getPendingInvitations(): FamilyInvitation[] {
    return Array.from(this.invitations.values()).filter(inv => inv.status === 'pending');
  }

  getUpcomingEvents(days: number = 30): FamilyCalendarEvent[] {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Array.from(this.calendarEvents.values())
      .filter(event => {
        const eventDate = new Date(event.start_at);
        return eventDate <= cutoffDate && eventDate >= now;
      })
      .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
  }

  getUpcomingMilestones(days: number = 90): FamilyMilestone[] {
    const cutoffDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Array.from(this.milestones.values())
      .filter(milestone => {
        if (!milestone.due_at) return false;
        const dueDate = new Date(milestone.due_at);
        return dueDate <= cutoffDate && dueDate >= now && milestone.status === 'planned';
      })
      .sort((a, b) => {
        if (!a.due_at || !b.due_at) return 0;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });
  }

  getEmergencyStatus(): {
    configured: boolean;
    daysSinceLastCheckIn: number;
    daysUntilTrigger: number;
    status: 'safe' | 'warning' | 'critical' | 'triggered';
  } {
    if (!this.emergencyAccess) {
      return {
        configured: false,
        daysSinceLastCheckIn: 0,
        daysUntilTrigger: 0,
        status: 'safe'
      };
    }

    const daysSinceLastCheckIn = Math.floor(
      (Date.now() - this.emergencyAccess.lastCheckIn.getTime()) / (24 * 60 * 60 * 1000)
    );

    const daysUntilTrigger = this.emergencyAccess.deadMansInterval - daysSinceLastCheckIn;

    let status: 'safe' | 'warning' | 'critical' | 'triggered' = 'safe';

    if (daysUntilTrigger <= 0) {
      status = 'triggered';
    } else if (daysUntilTrigger <= 3) {
      status = 'critical';
    } else if (daysUntilTrigger <= 7) {
      status = 'warning';
    }

    return {
      configured: true,
      daysSinceLastCheckIn,
      daysUntilTrigger: Math.max(0, daysUntilTrigger),
      status
    };
  }

  getTierCapabilities(): {
    currentTier: string;
    memberLimit: number;
    emergencyAccess: boolean;
    calendarIntegration: boolean;
    milestoneTracking: boolean;
    upgradeRecommendation?: string;
  } {
    const limits = getTierLimits(this.userTier);
    const currentMemberCount = this.members.size;

    let upgradeRecommendation: string | undefined;

    if (this.userTier === 'free' && currentMemberCount >= 1) {
      upgradeRecommendation = 'Upgrade na Paid pre viac členov a emergency access';
    } else if (this.userTier === 'paid' && currentMemberCount >= 8) {
      upgradeRecommendation = 'Upgrade na Family Edition pre neobmedzených členov a pokročilé funkcie';
    }

    return {
      currentTier: this.userTier,
      memberLimit: limits.maxMembers,
      emergencyAccess: limits.emergencyAccess,
      calendarIntegration: limits.calendarIntegration,
      milestoneTracking: limits.milestoneTracking,
      upgradeRecommendation
    };
  }
}