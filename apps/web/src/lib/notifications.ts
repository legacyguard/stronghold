import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Types for notification system
export interface ExpiringDocument {
  id: string;
  file_name: string;
  user_id: string;
  created_at: string;
  days_until_expiry?: number;
  user_email?: string;
}

export interface ExpiringWill {
  id: string;
  user_id: string;
  last_updated: string;
  days_since_update: number;
  user_email?: string;
}

export interface ExpiringGuardian {
  id: string;
  user_id: string;
  guardian_email: string;
  assigned_at: string;
  days_since_assignment: number;
}

export interface NotificationResult {
  type: 'document' | 'will' | 'guardian';
  recipient_email: string;
  template: string;
  sent: boolean;
  error?: string;
}

// Email notification skeleton functions
export class NotificationService {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Document expiration notifications
  async sendDocumentExpirationNotification(document: ExpiringDocument): Promise<NotificationResult> {
    console.log(`📧 [SKELETON] Would send document expiration notification:`, {
      recipient: document.user_email,
      document_name: document.file_name,
      days_until_expiry: document.days_until_expiry
    });

    // TODO: Implement actual email sending
    // This could use:
    // - Resend (resend.com)
    // - SendGrid
    // - AWS SES
    // - Supabase Edge Functions with email provider

    return {
      type: 'document',
      recipient_email: document.user_email || 'unknown@example.com',
      template: 'document_expiration',
      sent: true // Placeholder - would be actual result
    };
  }

  // Will update reminder notifications
  async sendWillUpdateReminderNotification(will: ExpiringWill): Promise<NotificationResult> {
    console.log(`📧 [SKELETON] Would send will update reminder:`, {
      recipient: will.user_email,
      days_since_update: will.days_since_update
    });

    // TODO: Implement actual email sending

    return {
      type: 'will',
      recipient_email: will.user_email || 'unknown@example.com',
      template: 'will_update_reminder',
      sent: true
    };
  }

  // Guardian assignment expiration notifications
  async sendGuardianExpirationNotification(guardian: ExpiringGuardian): Promise<NotificationResult> {
    console.log(`📧 [SKELETON] Would send guardian expiration notification:`, {
      recipient: guardian.guardian_email,
      days_since_assignment: guardian.days_since_assignment
    });

    // TODO: Implement actual email sending

    return {
      type: 'guardian',
      recipient_email: guardian.guardian_email,
      template: 'guardian_expiration',
      sent: true
    };
  }

  // Batch notification sender
  async sendBatchNotifications(notifications: Array<ExpiringDocument | ExpiringWill | ExpiringGuardian>): Promise<NotificationResult[]> {
    const results: NotificationResult[] = [];

    for (const item of notifications) {
      try {
        let result: NotificationResult;

        if ('file_name' in item) {
          // Document notification
          result = await this.sendDocumentExpirationNotification(item as ExpiringDocument);
        } else if ('last_updated' in item) {
          // Will notification
          result = await this.sendWillUpdateReminderNotification(item as ExpiringWill);
        } else {
          // Guardian notification
          result = await this.sendGuardianExpirationNotification(item as ExpiringGuardian);
        }

        results.push(result);

        // Add delay between notifications to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error('❌ Error sending notification:', error);
        results.push({
          type: 'document', // Default type
          recipient_email: 'error@example.com',
          template: 'error',
          sent: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  // Check for expiring documents (skeleton logic)
  async findExpiringDocuments(): Promise<ExpiringDocument[]> {
    console.log('🔍 Checking for expiring documents...');

    try {
      // TODO: Implement actual expiration logic based on business rules
      // For now, simulate finding documents that might need attention

      const { data: documents, error } = await this.supabase
        .from('documents')
        .select('id, file_name, user_id, created_at')
        .limit(10);

      if (error) {
        console.error('Error fetching documents:', error);
        return [];
      }

      // Simulate expiration logic
      const expiringDocs: ExpiringDocument[] = (documents || []).map(doc => ({
        id: doc.id,
        file_name: doc.file_name,
        user_id: doc.user_id,
        created_at: doc.created_at,
        days_until_expiry: Math.floor(Math.random() * 30), // Placeholder logic
        user_email: `user-${doc.user_id}@example.com` // Placeholder email
      }));

      console.log(`📋 Found ${expiringDocs.length} documents to check for expiration`);
      return expiringDocs;

    } catch (error) {
      console.error('Error in findExpiringDocuments:', error);
      return [];
    }
  }

  // Check for wills needing updates (skeleton logic)
  async findWillsNeedingUpdate(): Promise<ExpiringWill[]> {
    console.log('🔍 Checking for wills needing updates...');

    // TODO: Implement when will table exists
    // For now return empty array

    console.log('📋 No will table implemented yet');
    return [];
  }

  // Check for expiring guardian assignments (skeleton logic)
  async findExpiringGuardians(): Promise<ExpiringGuardian[]> {
    console.log('🔍 Checking for expiring guardian assignments...');

    try {
      // Check existing guardians table (adjust fields based on actual schema)
      const { data: guardians, error } = await this.supabase
        .from('guardians')
        .select('id, user_id, email, created_at')
        .limit(10);

      if (error) {
        console.error('Error fetching guardians:', error);
        return [];
      }

      // Simulate expiration logic - guardians assigned more than 365 days ago
      const expiringGuardians: ExpiringGuardian[] = (guardians || []).map(guardian => {
        const assignedDate = new Date(guardian.created_at);
        const daysSinceAssignment = Math.floor((Date.now() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: guardian.id,
          user_id: guardian.user_id,
          guardian_email: guardian.email || `guardian-${guardian.id}@example.com`,
          assigned_at: guardian.created_at,
          days_since_assignment: daysSinceAssignment
        };
      }).filter(g => g.days_since_assignment > 30); // Placeholder: 30+ days old

      console.log(`📋 Found ${expiringGuardians.length} guardian assignments to check`);
      return expiringGuardians;

    } catch (error) {
      console.error('Error in findExpiringGuardians:', error);
      return [];
    }
  }
}

// Email templates (skeleton)
// Dead Man's Switch specific types and functions
export interface InactiveUser {
  id: string;
  email: string;
  last_sign_in_at: string | null;
  created_at: string;
  days_inactive: number;
  inactivity_level: 'warning' | 'critical' | 'emergency';
  guardians?: Guardian[];
}

export interface Guardian {
  id: string;
  user_id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface CrisisEscalation {
  user_id: string;
  user_email: string;
  days_inactive: number;
  escalation_level: 'level_1' | 'level_2' | 'level_3';
  guardians_notified: string[];
  documents_accessible: boolean;
  timestamp: string;
}

// Dead Man's Switch configuration
export const DEAD_MANS_SWITCH_CONFIG = {
  WARNING_THRESHOLD_DAYS: 30,    // Send warning after 30 days
  CRITICAL_THRESHOLD_DAYS: 60,   // Send critical alert after 60 days
  EMERGENCY_THRESHOLD_DAYS: 90,  // Trigger emergency procedures after 90 days
  MAX_INACTIVITY_DAYS: 120       // Maximum before full escalation
} as const;

// Dead Man's Switch service class
export class DeadMansSwitchService {
  private supabase;

  constructor(supabaseClient?: any) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
  }

  // Detect inactive users based on last sign-in
  async detectInactiveUsers(): Promise<InactiveUser[]> {
    console.log('🔍 Checking for inactive users...');

    try {
      // Get all users from Supabase Auth
      const { data: authUsers, error: authError } = await this.supabase.auth.admin.listUsers();

      if (authError) {
        console.error('Error fetching users:', authError);
        return [];
      }

      const now = new Date();
      const inactiveUsers: InactiveUser[] = [];

      for (const user of authUsers.users || []) {
        let daysInactive = 0;

        if (user.last_sign_in_at) {
          const lastSignIn = new Date(user.last_sign_in_at);
          daysInactive = Math.floor((now.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          // Never signed in - calculate from creation date
          const createdAt = new Date(user.created_at);
          daysInactive = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        }

        // Determine inactivity level
        let inactivityLevel: InactiveUser['inactivity_level'] = 'warning';
        if (daysInactive >= DEAD_MANS_SWITCH_CONFIG.EMERGENCY_THRESHOLD_DAYS) {
          inactivityLevel = 'emergency';
        } else if (daysInactive >= DEAD_MANS_SWITCH_CONFIG.CRITICAL_THRESHOLD_DAYS) {
          inactivityLevel = 'critical';
        }

        // Only include users who meet warning threshold
        if (daysInactive >= DEAD_MANS_SWITCH_CONFIG.WARNING_THRESHOLD_DAYS) {
          // Get guardians for this user
          const guardians = await this.getUserGuardians(user.id);

          inactiveUsers.push({
            id: user.id,
            email: user.email || 'unknown@example.com',
            last_sign_in_at: user.last_sign_in_at,
            created_at: user.created_at,
            days_inactive: daysInactive,
            inactivity_level: inactivityLevel,
            guardians
          });
        }
      }

      console.log(`📋 Found ${inactiveUsers.length} inactive users requiring attention`);
      return inactiveUsers;

    } catch (error) {
      console.error('Error in detectInactiveUsers:', error);
      return [];
    }
  }

  // Get guardians for a specific user
  async getUserGuardians(userId: string): Promise<Guardian[]> {
    try {
      const { data: guardians, error } = await this.supabase
        .from('guardians')
        .select('id, user_id, email, name, created_at')
        .eq('user_id', userId);

      if (error) {
        console.error(`Error fetching guardians for user ${userId}:`, error);
        return [];
      }

      return guardians || [];
    } catch (error) {
      console.error('Error in getUserGuardians:', error);
      return [];
    }
  }

  // Send crisis notifications to guardians
  async sendCrisisNotifications(inactiveUser: InactiveUser): Promise<NotificationResult[]> {
    console.log(`🚨 [SKELETON] Would send crisis notifications for user ${inactiveUser.email}:`, {
      days_inactive: inactiveUser.days_inactive,
      inactivity_level: inactiveUser.inactivity_level,
      guardians_count: inactiveUser.guardians?.length || 0
    });

    const results: NotificationResult[] = [];

    // Send notifications to each guardian
    for (const guardian of inactiveUser.guardians || []) {
      console.log(`📧 [SKELETON] Would notify guardian ${guardian.email} about ${inactiveUser.email}`);

      results.push({
        type: 'guardian',
        recipient_email: guardian.email,
        template: `crisis_${inactiveUser.inactivity_level}`,
        sent: true // Placeholder
      });
    }

    return results;
  }

  // Trigger escalation procedures based on inactivity level
  async triggerEscalationProcedures(inactiveUser: InactiveUser): Promise<CrisisEscalation> {
    let escalationLevel: CrisisEscalation['escalation_level'] = 'level_1';

    if (inactiveUser.inactivity_level === 'critical') {
      escalationLevel = 'level_2';
    } else if (inactiveUser.inactivity_level === 'emergency') {
      escalationLevel = 'level_3';
    }

    console.log(`⚠️ [SKELETON] Would trigger escalation ${escalationLevel} for user ${inactiveUser.email}:`, {
      days_inactive: inactiveUser.days_inactive,
      escalation_level: escalationLevel
    });

    // TODO: Implement actual escalation procedures
    // Level 1: Send warning to user + notify guardians
    // Level 2: Multiple guardian notifications + document preparation
    // Level 3: Full emergency access to documents + legal procedures

    const escalation: CrisisEscalation = {
      user_id: inactiveUser.id,
      user_email: inactiveUser.email,
      days_inactive: inactiveUser.days_inactive,
      escalation_level: escalationLevel,
      guardians_notified: inactiveUser.guardians?.map(g => g.email) || [],
      documents_accessible: escalationLevel === 'level_3',
      timestamp: new Date().toISOString()
    };

    return escalation;
  }

  // Main dead man's switch check orchestrator
  async performDeadMansSwitchCheck(): Promise<{
    inactive_users: InactiveUser[];
    notifications_sent: NotificationResult[];
    escalations_triggered: CrisisEscalation[];
  }> {
    console.log('💀 Starting comprehensive dead man\'s switch check...');

    const inactiveUsers = await this.detectInactiveUsers();
    const allNotifications: NotificationResult[] = [];
    const allEscalations: CrisisEscalation[] = [];

    for (const inactiveUser of inactiveUsers) {
      // Send crisis notifications
      const notifications = await this.sendCrisisNotifications(inactiveUser);
      allNotifications.push(...notifications);

      // Trigger escalation procedures
      const escalation = await this.triggerEscalationProcedures(inactiveUser);
      allEscalations.push(escalation);
    }

    console.log('✅ Dead man\'s switch check completed:', {
      inactive_users_found: inactiveUsers.length,
      notifications_sent: allNotifications.length,
      escalations_triggered: allEscalations.length
    });

    return {
      inactive_users: inactiveUsers,
      notifications_sent: allNotifications,
      escalations_triggered: allEscalations
    };
  }
}

export const EMAIL_TEMPLATES = {
  document_expiration: {
    subject: 'Document Expiration Reminder - LegacyGuard',
    text: 'Your document is expiring soon. Please review and update if needed.',
    html: '<p>Your document <strong>{{document_name}}</strong> is expiring in {{days}} days.</p>'
  },
  will_update_reminder: {
    subject: 'Will Update Reminder - LegacyGuard',
    text: 'Please review and update your will to ensure it reflects your current wishes.',
    html: '<p>It has been {{days}} days since your last will update. Please review.</p>'
  },
  guardian_expiration: {
    subject: 'Guardian Assignment Review - LegacyGuard',
    text: 'Please confirm your guardian assignment is still valid.',
    html: '<p>Your guardian assignment needs review after {{days}} days.</p>'
  },

  // Dead Man's Switch Templates
  crisis_warning: {
    subject: 'User Inactivity Warning - LegacyGuard Guardian Alert',
    text: 'A user you are guarding has been inactive for {{days}} days. Please check on their wellbeing.',
    html: '<p><strong>Guardian Alert:</strong> {{user_email}} has been inactive for {{days}} days. Please verify their status.</p>'
  },
  crisis_critical: {
    subject: 'CRITICAL: Extended User Inactivity - LegacyGuard Guardian Alert',
    text: 'CRITICAL: A user you are guarding has been inactive for {{days}} days. Immediate action may be required.',
    html: '<p><strong>CRITICAL ALERT:</strong> {{user_email}} has been inactive for {{days}} days. Please take immediate action to verify their status.</p>'
  },
  crisis_emergency: {
    subject: 'EMERGENCY: Dead Man\'s Switch Activated - LegacyGuard',
    text: 'EMERGENCY: Dead man\'s switch has been activated for {{user_email}} after {{days}} days of inactivity.',
    html: '<p><strong>EMERGENCY:</strong> Dead man\'s switch activated for {{user_email}} after {{days}} days. Emergency procedures are now in effect.</p>'
  },
  user_inactivity_warning: {
    subject: 'Account Inactivity Warning - LegacyGuard',
    text: 'Your account has been inactive for {{days}} days. Please sign in to prevent guardian alerts.',
    html: '<p>Your LegacyGuard account has been inactive for {{days}} days. Please sign in to prevent your guardians from being alerted.</p>'
  }
} as const;