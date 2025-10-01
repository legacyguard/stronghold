export interface FamilyMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: FamilyRole;
  permissions: FamilyPermissions;
  invitationStatus: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedAt: Date;
  acceptedAt?: Date;

  // Tier restrictions
  availableInTier: 'free' | 'paid' | 'family_edition';

  // Contact information
  phone?: string;
  address?: string;
  relationship: string; // e.g., "manžel/ka", "syn", "dcéra", "priateľ"
}

export type FamilyRole =
  | 'guardian'           // Opatrovník detí
  | 'executor'          // Vykonávateľ závetu
  | 'heir'              // Dedič
  | 'emergency_contact' // Núdzový kontakt
  | 'witness'           // Svedok
  | 'advisor';          // Poradca

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

export interface FamilyCalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: 'milestone' | 'reminder' | 'meeting' | 'deadline';
  date: Date;
  duration?: number; // minutes

  // Participants
  organizer: string; // User ID
  attendees: string[]; // User IDs

  // Will-related events
  relatedDocument?: string; // Document ID
  relatedMilestone?: string; // Milestone ID
}

export interface FamilyMilestone {
  id: string;
  title: string;
  description: string;
  type: 'birthday' | 'anniversary' | 'graduation' | 'inheritance' | 'custom';
  date: Date;

  // Inheritance milestones
  beneficiaryId?: string;
  assetId?: string;
  conditions?: string[];

  // Completion tracking
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
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
  const names: Record<FamilyRole, Record<string, string>> = {
    guardian: { sk: 'Opatrovník', en: 'Guardian', cs: 'Opatrovník' },
    executor: { sk: 'Vykonávateľ', en: 'Executor', cs: 'Vykonavatel' },
    heir: { sk: 'Dedič', en: 'Heir', cs: 'Dědic' },
    emergency_contact: { sk: 'Núdzový kontakt', en: 'Emergency Contact', cs: 'Nouzový kontakt' },
    witness: { sk: 'Svedok', en: 'Witness', cs: 'Svědek' },
    advisor: { sk: 'Poradca', en: 'Advisor', cs: 'Poradce' }
  };

  return names[role][locale] || names[role]['en'];
}

export function getRoleDescription(role: FamilyRole, locale: string = 'sk'): string {
  const descriptions: Record<FamilyRole, Record<string, string>> = {
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

  return descriptions[role][locale] || descriptions[role]['en'];
}