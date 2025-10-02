export interface FamilyMember {
  id: string;
  family_owner_id: string;
  member_user_id?: string;
  member_name: string;
  member_email: string;
  member_phone?: string;
  role: FamilyRole;
  access_level: AccessLevel;
  invitation_status: 'pending' | 'accepted' | 'declined' | 'revoked';
  invitation_token?: string;
  token_expires_at?: string;
  invited_by_user_id?: string;
  accepted_by_user_id?: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;

  // Tier restrictions (legacy, for backward compatibility)
  availableInTier?: 'free' | 'paid' | 'family_edition';

  // Legacy compatibility properties
  userId?: string;
  email?: string;
  name?: string;
  permissions?: FamilyPermissions;
  invitedAt?: Date;
  acceptedAt?: Date;
  phone?: string;
  address?: string;
  relationship?: string;
}

export type AccessLevel = 'minimal' | 'emergency' | 'health' | 'full';

export type FamilyRole =
  | 'spouse'            // Manžel/manželka
  | 'child'             // Dieťa
  | 'parent'            // Rodič
  | 'sibling'           // Súrodenec
  | 'guardian'          // Opatrovník detí
  | 'executor'          // Vykonávateľ závetu
  | 'trustee'           // Správca trustu
  | 'beneficiary'       // Beneficient
  | 'advisor'           // Poradca
  | 'heir'              // Dedič
  | 'emergency_contact' // Núdzový kontakt
  | 'witness'           // Svedok
  | 'other';            // Ostatné

export interface FamilyPermissions {
  // Document access
  viewDocuments: boolean;
  editWills: boolean;
  downloadDocuments: boolean;

  // Emergency access
  accessEmergency: boolean;
  triggerEmergencyProtocol: boolean;

  // Family coordination
  inviteMembers: boolean;
  manageCalendar: boolean;
  viewFamilyTree: boolean;

  // Administrative
  manageRoles: boolean;
  accessBilling: boolean;
}

export interface FamilyInvitation {
  id: string;
  inviterId: string;
  inviterName: string;
  inviteeEmail: string;
  role: FamilyRole;
  permissions: FamilyPermissions;
  message?: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
}

export interface EmergencyAccess {
  id: string;
  userId: string;
  triggerType: 'dead_mans_switch' | 'manual_activation' | 'family_request';
  activatedBy: string; // User ID who activated
  activatedAt: Date;

  // Configuration
  deadMansInterval: number; // days
  lastCheckIn: Date;

  // Notifications
  notifiedMembers: string[]; // User IDs
  documentsShared: string[]; // Document IDs

  // Emergency protocols
  protocols: EmergencyProtocol[];
}

export interface EmergencyProtocol {
  id: string;
  name: string;
  description: string;
  triggers: string[]; // Conditions that activate this protocol
  actions: ProtocolAction[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProtocolAction {
  type: 'notify_member' | 'share_document' | 'contact_service' | 'execute_will';
  target: string; // Member ID, document ID, service info
  delay: number; // minutes after trigger
  message?: string;
}

// Utility functions for role-based permissions
export function getDefaultPermissions(role: FamilyRole): FamilyPermissions {
  const basePermissions: FamilyPermissions = {
    viewDocuments: false,
    editWills: false,
    downloadDocuments: false,
    accessEmergency: false,
    triggerEmergencyProtocol: false,
    inviteMembers: false,
    manageCalendar: false,
    viewFamilyTree: false,
    manageRoles: false,
    accessBilling: false
  };

  switch (role) {
    case 'executor':
      return {
        ...basePermissions,
        viewDocuments: true,
        downloadDocuments: true,
        accessEmergency: true,
        triggerEmergencyProtocol: true,
        viewFamilyTree: true
      };

    case 'guardian':
      return {
        ...basePermissions,
        viewDocuments: true,
        accessEmergency: true,
        viewFamilyTree: true,
        manageCalendar: true
      };

    case 'heir':
      return {
        ...basePermissions,
        viewDocuments: true,
        viewFamilyTree: true,
        manageCalendar: true
      };

    case 'emergency_contact':
      return {
        ...basePermissions,
        accessEmergency: true,
        triggerEmergencyProtocol: true
      };

    case 'witness':
      return {
        ...basePermissions,
        viewDocuments: true
      };

    case 'advisor':
      return {
        ...basePermissions,
        viewDocuments: true,
        editWills: true,
        viewFamilyTree: true,
        manageCalendar: true
      };

    default:
      return basePermissions;
  }
}

// Family Calendar Event types
export interface FamilyCalendarEvent {
  id: string;
  family_owner_id: string;
  title: string;
  description?: string;
  event_type: 'general' | 'milestone' | 'reminder' | 'meeting' | 'deadline';
  start_at: string;
  end_at?: string;
  organizer_user_id?: string;
  attendee_member_ids: string[];
  related_document_id?: string;
  related_milestone_id?: string;
  created_at: string;
  updated_at: string;
}

// Family Milestone types
export interface FamilyMilestone {
  id: string;
  family_owner_id: string;
  title: string;
  description?: string;
  milestone_type: 'general' | 'birthday' | 'anniversary' | 'graduation' | 'inheritance' | 'custom';
  due_at?: string;
  beneficiary_member_id?: string;
  status: 'planned' | 'done' | 'skipped';
  completed_at?: string;
  completed_by?: string;
  created_at: string;
  updated_at: string;
}

// Request types for API calls
export interface FamilyInvitationRequest {
  memberName: string;
  memberEmail: string;
  memberPhone?: string;
  role: FamilyRole;
  accessLevel: AccessLevel;
  meta?: Record<string, any>;
}

export function getTierLimits(userTier: 'free' | 'paid' | 'family_edition'): {
  maxMembers: number;
  maxGuardians: number;
  emergencyAccess: boolean;
  calendarIntegration: boolean;
  milestoneTracking: boolean;
} {
  switch (userTier) {
    case 'family_edition':
      return {
        maxMembers: -1, // unlimited
        maxGuardians: -1, // unlimited
        emergencyAccess: true,
        calendarIntegration: true,
        milestoneTracking: true
      };

    case 'paid':
      return {
        maxMembers: 10,
        maxGuardians: 5,
        emergencyAccess: true,
        calendarIntegration: true,
        milestoneTracking: false
      };

    default: // free
      return {
        maxMembers: 2,
        maxGuardians: 1,
        emergencyAccess: false,
        calendarIntegration: false,
        milestoneTracking: false
      };
  }
}

export function canInviteMember(
  currentMembers: number,
  userTier: 'free' | 'paid' | 'family_edition'
): boolean {
  const limits = getTierLimits(userTier);
  return limits.maxMembers === -1 || currentMembers < limits.maxMembers;
}

export function getRoleDisplayName(role: FamilyRole, locale: string = 'sk'): string {
  const names: Partial<Record<FamilyRole, Record<string, string>>> = {
    guardian: { sk: 'Opatrovník', en: 'Guardian', cs: 'Opatrovník' },
    executor: { sk: 'Vykonávateľ', en: 'Executor', cs: 'Vykonavatel' },
    heir: { sk: 'Dedič', en: 'Heir', cs: 'Dědic' },
    emergency_contact: { sk: 'Núdzový kontakt', en: 'Emergency Contact', cs: 'Nouzový kontakt' },
    witness: { sk: 'Svedok', en: 'Witness', cs: 'Svědek' },
    advisor: { sk: 'Poradca', en: 'Advisor', cs: 'Poradce' }
  };

  return names[role]?.[locale] || names[role]?.['en'] || role;
}

export function getRoleDescription(role: FamilyRole, locale: string = 'sk'): string {
  const descriptions: Partial<Record<FamilyRole, Record<string, string>>> = {
    guardian: {
      sk: 'Osoba, ktorá sa postará o maloletých členov rodiny',
      en: 'Person who will care for minor family members',
      cs: 'Osoba, která se postará o nezletilé členy rodiny'
    },
    executor: {
      sk: 'Osoba zodpovedná za vykonanie závetu',
      en: 'Person responsible for executing the will',
      cs: 'Osoba odpovědná za vykonání závěti'
    },
    heir: {
      sk: 'Osoba, ktorá zdedí majetok alebo jeho časť',
      en: 'Person who will inherit assets or part of them',
      cs: 'Osoba, která zdědí majetek nebo jeho část'
    },
    emergency_contact: {
      sk: 'Osoba kontaktovaná v prípade núdze',
      en: 'Person to contact in case of emergency',
      cs: 'Osoba kontaktovaná v případě nouze'
    },
    witness: {
      sk: 'Svedok podpisu závetu',
      en: 'Witness to will signing',
      cs: 'Svědek podpisu závěti'
    },
    advisor: {
      sk: 'Právny alebo finančný poradca',
      en: 'Legal or financial advisor',
      cs: 'Právní nebo finanční poradce'
    }
  };

  return descriptions[role]?.[locale] || descriptions[role]?.['en'] || '';
}