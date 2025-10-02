// Time Capsule Manager
// Scheduled message delivery and digital legacy preservation

import { createClient } from '@/lib/supabase';
import { generateLegalNoticePDF } from '@/lib/pdf/pdf-generator';
import type { UserProfile } from '@/types';

export interface TimeCapsule {
  id: string;
  user_id: string;
  title: string;
  content_type: 'message' | 'document' | 'multimedia' | 'instructions';
  content: string;
  attachments?: TimeCapsuleAttachment[];

  // Delivery settings
  delivery_method: 'email' | 'guardian_notification' | 'legal_notice' | 'social_media';
  recipient_type: 'specific_person' | 'guardian_network' | 'public' | 'family_member';
  recipient_details: RecipientDetails;

  // Trigger conditions
  trigger_type: 'date_based' | 'event_based' | 'dead_mans_switch' | 'guardian_activated';
  trigger_date?: string;
  trigger_event?: string;
  dead_mans_switch_days?: number;

  // Content settings
  jurisdiction: string;
  language: string;
  privacy_level: 'private' | 'family_only' | 'guardian_access' | 'public';
  requires_legal_notice: boolean;

  // Status
  status: 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
  created_at: string;
  scheduled_for?: string;
  sent_at?: string;

  // Metadata
  metadata: {
    word_count: number;
    estimated_delivery_date?: string;
    legal_compliance_checked: boolean;
    encryption_enabled: boolean;
    backup_recipients?: string[];
  };
}

export interface TimeCapsuleAttachment {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  description?: string;
  requires_special_handling: boolean;
}

export interface RecipientDetails {
  primary_recipient_name: string;
  primary_recipient_email?: string;
  primary_recipient_phone?: string;
  primary_recipient_relationship: string;

  backup_recipients?: BackupRecipient[];
  guardian_group_id?: string;

  delivery_instructions?: string;
  special_requirements?: string;
}

export interface BackupRecipient {
  name: string;
  email?: string;
  phone?: string;
  relationship: string;
  delivery_delay_days: number;
}

export interface TimeCapsuleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'personal' | 'business' | 'legal' | 'family' | 'medical';
  content_template: string;
  default_trigger_type: string;
  default_delivery_method: string;
  jurisdiction_specific: boolean;
  requires_legal_review: boolean;
}

export interface DeliveryResult {
  success: boolean;
  delivery_method: string;
  delivered_at: string;
  recipient_confirmed: boolean;
  legal_notice_generated: boolean;
  errors: string[];
  tracking_id?: string;
}

export interface TimeCapsuleAnalytics {
  total_capsules: number;
  scheduled_capsules: number;
  delivered_capsules: number;
  failed_deliveries: number;
  upcoming_deliveries: TimeCapsule[];
  delivery_success_rate: number;
}

export class TimeCapsuleManager {
  private supabase;

  constructor() {
    this.supabase = createClient();
  }

  /**
   * Create new time capsule
   */
  async createTimeCapsule(user_id: string, capsule_data: Partial<TimeCapsule>): Promise<TimeCapsule> {
    const capsule: Partial<TimeCapsule> = {
      user_id,
      status: 'draft',
      created_at: new Date().toISOString(),
      metadata: {
        word_count: this.countWords(capsule_data.content || ''),
        legal_compliance_checked: false,
        encryption_enabled: false,
        ...capsule_data.metadata
      },
      ...capsule_data
    };

    // Calculate estimated delivery date
    if (capsule.trigger_type === 'date_based' && capsule.trigger_date) {
      capsule.scheduled_for = capsule.trigger_date;
      capsule.metadata!.estimated_delivery_date = capsule.trigger_date;
    } else if (capsule.trigger_type === 'dead_mans_switch' && capsule.dead_mans_switch_days) {
      const delivery_date = new Date();
      delivery_date.setDate(delivery_date.getDate() + capsule.dead_mans_switch_days);
      capsule.metadata!.estimated_delivery_date = delivery_date.toISOString();
    }

    // Validate legal requirements
    if (capsule.requires_legal_notice) {
      const legal_validation = await this.validateLegalRequirements(capsule);
      capsule.metadata!.legal_compliance_checked = legal_validation.compliant;
    }

    const { data, error } = await this.supabase
      .from('time_capsules')
      .insert(capsule)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create time capsule: ${error.message}`);
    }

    return data;
  }

  /**
   * Schedule time capsule for delivery
   */
  async scheduleTimeCapsule(capsule_id: string, user_id: string): Promise<void> {
    const { data: capsule, error: fetch_error } = await this.supabase
      .from('time_capsules')
      .select('*')
      .eq('id', capsule_id)
      .eq('user_id', user_id)
      .single();

    if (fetch_error || !capsule) {
      throw new Error('Time capsule not found');
    }

    if (capsule.status !== 'draft') {
      throw new Error('Only draft capsules can be scheduled');
    }

    // Validate content and recipients
    const validation = await this.validateTimeCapsule(capsule);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Update status to scheduled
    const updates: Partial<TimeCapsule> = {
      status: 'scheduled'
    };

    // Set scheduled delivery date based on trigger type
    if (capsule.trigger_type === 'date_based' && capsule.trigger_date) {
      updates.scheduled_for = capsule.trigger_date;
    } else if (capsule.trigger_type === 'dead_mans_switch') {
      // Dead man's switch starts counting from now
      const switch_date = new Date();
      switch_date.setDate(switch_date.getDate() + (capsule.dead_mans_switch_days || 30));
      updates.scheduled_for = switch_date.toISOString();
    }

    const { error: update_error } = await this.supabase
      .from('time_capsules')
      .update(updates)
      .eq('id', capsule_id)
      .eq('user_id', user_id);

    if (update_error) {
      throw new Error(`Failed to schedule time capsule: ${update_error.message}`);
    }

    // Create delivery job (this would integrate with a job queue system)
    await this.createDeliveryJob(capsule_id, updates.scheduled_for!);
  }

  /**
   * Process time capsule delivery
   */
  async deliverTimeCapsule(capsule_id: string): Promise<DeliveryResult> {
    const { data: capsule, error } = await this.supabase
      .from('time_capsules')
      .select('*')
      .eq('id', capsule_id)
      .single();

    if (error || !capsule) {
      return {
        success: false,
        delivery_method: 'unknown',
        delivered_at: new Date().toISOString(),
        recipient_confirmed: false,
        legal_notice_generated: false,
        errors: ['Time capsule not found']
      };
    }

    try {
      let delivery_result: DeliveryResult;

      switch (capsule.delivery_method) {
        case 'email':
          delivery_result = await this.deliverViaEmail(capsule);
          break;
        case 'guardian_notification':
          delivery_result = await this.deliverViaGuardians(capsule);
          break;
        case 'legal_notice':
          delivery_result = await this.deliverViaLegalNotice(capsule);
          break;
        case 'social_media':
          delivery_result = await this.deliverViaSocialMedia(capsule);
          break;
        default:
          throw new Error(`Unsupported delivery method: ${capsule.delivery_method}`);
      }

      // Update capsule status
      await this.supabase
        .from('time_capsules')
        .update({
          status: delivery_result.success ? 'sent' : 'failed',
          sent_at: delivery_result.success ? delivery_result.delivered_at : null
        })
        .eq('id', capsule_id);

      // Log delivery attempt
      await this.logDeliveryAttempt(capsule_id, delivery_result);

      return delivery_result;

    } catch (error) {
      const error_result: DeliveryResult = {
        success: false,
        delivery_method: capsule.delivery_method,
        delivered_at: new Date().toISOString(),
        recipient_confirmed: false,
        legal_notice_generated: false,
        errors: [error instanceof Error ? error.message : 'Unknown delivery error']
      };

      await this.supabase
        .from('time_capsules')
        .update({ status: 'failed' })
        .eq('id', capsule_id);

      await this.logDeliveryAttempt(capsule_id, error_result);

      return error_result;
    }
  }

  /**
   * Get user's time capsules
   */
  async getUserTimeCapsules(user_id: string, status?: string): Promise<TimeCapsule[]> {
    let query = this.supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch time capsules: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get time capsule templates
   */
  async getTimeCapsuleTemplates(category?: string, jurisdiction?: string): Promise<TimeCapsuleTemplate[]> {
    let query = this.supabase
      .from('time_capsule_templates')
      .select('*')
      .order('name');

    if (category) {
      query = query.eq('category', category);
    }

    if (jurisdiction) {
      query = query.or(`jurisdiction_specific.eq.false,jurisdiction.eq.${jurisdiction}`);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update dead man's switch
   */
  async updateDeadMansSwitch(user_id: string): Promise<void> {
    // Find all active dead man's switch capsules
    const { data: capsules, error } = await this.supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', user_id)
      .eq('trigger_type', 'dead_mans_switch')
      .eq('status', 'scheduled');

    if (error) {
      throw new Error(`Failed to fetch dead man's switch capsules: ${error.message}`);
    }

    // Reset countdown for each capsule
    for (const capsule of capsules || []) {
      const new_delivery_date = new Date();
      new_delivery_date.setDate(new_delivery_date.getDate() + (capsule.dead_mans_switch_days || 30));

      await this.supabase
        .from('time_capsules')
        .update({
          scheduled_for: new_delivery_date.toISOString(),
          metadata: {
            ...capsule.metadata,
            last_activity_update: new Date().toISOString()
          }
        })
        .eq('id', capsule.id);
    }

    // Log activity update
    await this.supabase
      .from('user_activity_log')
      .insert({
        user_id,
        activity_type: 'dead_mans_switch_reset',
        timestamp: new Date().toISOString(),
        details: { capsules_updated: capsules?.length || 0 }
      });
  }

  /**
   * Get time capsule analytics
   */
  async getTimeCapsuleAnalytics(user_id: string): Promise<TimeCapsuleAnalytics> {
    const { data: capsules, error } = await this.supabase
      .from('time_capsules')
      .select('*')
      .eq('user_id', user_id);

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    const total_capsules = capsules?.length || 0;
    const scheduled = capsules?.filter((c: TimeCapsule) => c.status === 'scheduled').length || 0;
    const delivered = capsules?.filter((c: TimeCapsule) => c.status === 'sent').length || 0;
    const failed = capsules?.filter((c: TimeCapsule) => c.status === 'failed').length || 0;

    // Get upcoming deliveries (next 30 days)
    const thirty_days_from_now = new Date();
    thirty_days_from_now.setDate(thirty_days_from_now.getDate() + 30);

    const upcoming = capsules?.filter((c: TimeCapsule) =>
      c.status === 'scheduled' &&
      c.scheduled_for &&
      new Date(c.scheduled_for) <= thirty_days_from_now
    ) || [];

    return {
      total_capsules,
      scheduled_capsules: scheduled,
      delivered_capsules: delivered,
      failed_deliveries: failed,
      upcoming_deliveries: upcoming,
      delivery_success_rate: total_capsules > 0 ? (delivered / (delivered + failed)) * 100 : 0
    };
  }

  /**
   * Validate time capsule data
   */
  private async validateTimeCapsule(capsule: TimeCapsule): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Content validation
    if (!capsule.content || capsule.content.trim().length === 0) {
      errors.push('Content is required');
    }

    if (capsule.content && capsule.content.length > 50000) {
      errors.push('Content exceeds maximum length (50,000 characters)');
    }

    // Recipient validation
    if (!capsule.recipient_details.primary_recipient_name) {
      errors.push('Primary recipient name is required');
    }

    if (capsule.delivery_method === 'email' && !capsule.recipient_details.primary_recipient_email) {
      errors.push('Email address is required for email delivery');
    }

    // Trigger validation
    if (capsule.trigger_type === 'date_based' && !capsule.trigger_date) {
      errors.push('Trigger date is required for date-based delivery');
    }

    if (capsule.trigger_type === 'dead_mans_switch' && (!capsule.dead_mans_switch_days || capsule.dead_mans_switch_days < 1)) {
      errors.push('Dead man\'s switch days must be at least 1');
    }

    // Date validation
    if (capsule.trigger_date && new Date(capsule.trigger_date) <= new Date()) {
      errors.push('Trigger date must be in the future');
    }

    // Legal validation
    if (capsule.requires_legal_notice) {
      const legal_validation = await this.validateLegalRequirements(capsule);
      if (!legal_validation.compliant) {
        errors.push(...legal_validation.issues);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate legal requirements
   */
  private async validateLegalRequirements(capsule: Partial<TimeCapsule>): Promise<{ compliant: boolean; issues: string[] }> {
    const issues: string[] = [];

    // Check jurisdiction requirements
    if (!capsule.jurisdiction) {
      issues.push('Jurisdiction must be specified for legal notices');
    }

    // Check content for legal compliance
    if (capsule.content) {
      const forbidden_content = ['threats', 'illegal instructions', 'defamatory statements'];
      const content_lower = capsule.content.toLowerCase();

      for (const forbidden of forbidden_content) {
        if (content_lower.includes(forbidden.toLowerCase())) {
          issues.push(`Content may contain prohibited material: ${forbidden}`);
        }
      }
    }

    // Check recipient requirements for legal notices
    if (capsule.delivery_method === 'legal_notice') {
      if (!capsule.recipient_details?.primary_recipient_name) {
        issues.push('Legal notice requires complete recipient information');
      }
    }

    return {
      compliant: issues.length === 0,
      issues
    };
  }

  /**
   * Deliver via email
   */
  private async deliverViaEmail(capsule: TimeCapsule): Promise<DeliveryResult> {
    // This would integrate with email service (SendGrid, etc.)
    // For now, simulate email delivery

    const email_content = this.formatEmailContent(capsule);

    // Simulate email sending
    const success = Math.random() > 0.1; // 90% success rate simulation

    return {
      success,
      delivery_method: 'email',
      delivered_at: new Date().toISOString(),
      recipient_confirmed: false, // Would be true with email confirmation
      legal_notice_generated: false,
      errors: success ? [] : ['Email delivery failed'],
      tracking_id: success ? `email_${Date.now()}` : undefined
    };
  }

  /**
   * Deliver via guardian network
   */
  private async deliverViaGuardians(capsule: TimeCapsule): Promise<DeliveryResult> {
    // Get user's guardians
    const { data: guardians, error } = await this.supabase
      .from('guardians')
      .select('*')
      .eq('user_id', capsule.user_id)
      .eq('status', 'active');

    if (error || !guardians || guardians.length === 0) {
      return {
        success: false,
        delivery_method: 'guardian_notification',
        delivered_at: new Date().toISOString(),
        recipient_confirmed: false,
        legal_notice_generated: false,
        errors: ['No active guardians found']
      };
    }

    // Notify all guardians
    const notifications = [];
    for (const guardian of guardians) {
      notifications.push(this.notifyGuardian(guardian, capsule));
    }

    const results = await Promise.allSettled(notifications);
    const successful = results.filter(r => r.status === 'fulfilled').length;

    return {
      success: successful > 0,
      delivery_method: 'guardian_notification',
      delivered_at: new Date().toISOString(),
      recipient_confirmed: false,
      legal_notice_generated: false,
      errors: successful === 0 ? ['All guardian notifications failed'] : [],
      tracking_id: successful > 0 ? `guardian_${Date.now()}` : undefined
    };
  }

  /**
   * Deliver via legal notice
   */
  private async deliverViaLegalNotice(capsule: TimeCapsule): Promise<DeliveryResult> {
    try {
      // Generate legal notice PDF
      const notice_content = this.formatLegalNoticeContent(capsule);
      const pdf_data = await generateLegalNoticePDF(
        capsule.jurisdiction,
        notice_content
      );

      // Save legal notice
      const file_name = `legal_notice_${capsule.id}_${Date.now()}.pdf`;
      const { error: upload_error } = await this.supabase.storage
        .from('legal_documents')
        .upload(file_name, pdf_data);

      if (upload_error) {
        throw new Error(`PDF upload failed: ${upload_error.message}`);
      }

      return {
        success: true,
        delivery_method: 'legal_notice',
        delivered_at: new Date().toISOString(),
        recipient_confirmed: false,
        legal_notice_generated: true,
        errors: [],
        tracking_id: `legal_${Date.now()}`
      };

    } catch (error) {
      return {
        success: false,
        delivery_method: 'legal_notice',
        delivered_at: new Date().toISOString(),
        recipient_confirmed: false,
        legal_notice_generated: false,
        errors: [error instanceof Error ? error.message : 'Legal notice generation failed']
      };
    }
  }

  /**
   * Deliver via social media (placeholder)
   */
  private async deliverViaSocialMedia(capsule: TimeCapsule): Promise<DeliveryResult> {
    // This would integrate with social media APIs
    return {
      success: false,
      delivery_method: 'social_media',
      delivered_at: new Date().toISOString(),
      recipient_confirmed: false,
      legal_notice_generated: false,
      errors: ['Social media delivery not yet implemented']
    };
  }

  /**
   * Helper methods
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private formatEmailContent(capsule: TimeCapsule): string {
    return `
Time Capsule from ${capsule.user_id}
Title: ${capsule.title}
Created: ${capsule.created_at}

${capsule.content}

---
This message was delivered via LegacyGuard Time Capsule service.
`;
  }

  private formatLegalNoticeContent(capsule: TimeCapsule): string {
    return `
LEGAL NOTICE - TIME CAPSULE DELIVERY

Date: ${new Date().toLocaleDateString()}
Capsule ID: ${capsule.id}
Created: ${new Date(capsule.created_at).toLocaleDateString()}

Recipient: ${capsule.recipient_details.primary_recipient_name}
Relationship: ${capsule.recipient_details.primary_recipient_relationship}

Title: ${capsule.title}

Content:
${capsule.content}

This document serves as official notification of the delivery of a time capsule message
as requested by the original author. This delivery was automated according to the
specified trigger conditions.

Generated by LegacyGuard Platform
Jurisdiction: ${capsule.jurisdiction}
Privacy Level: ${capsule.privacy_level}
`;
  }

  private async notifyGuardian(guardian: any, capsule: TimeCapsule): Promise<void> {
    // Create guardian notification
    await this.supabase
      .from('guardian_notifications')
      .insert({
        guardian_id: guardian.id,
        user_id: capsule.user_id,
        notification_type: 'time_capsule_delivery',
        title: `Time Capsule: ${capsule.title}`,
        content: capsule.content,
        priority: 'normal',
        requires_response: false,
        metadata: {
          time_capsule_id: capsule.id,
          trigger_type: capsule.trigger_type
        }
      });
  }

  private async createDeliveryJob(capsule_id: string, scheduled_for: string): Promise<void> {
    // This would integrate with a job queue system (Redis, BullMQ, etc.)
    // For now, just log the scheduling
    console.log(`Delivery job created for capsule ${capsule_id} at ${scheduled_for}`);
  }

  private async logDeliveryAttempt(capsule_id: string, result: DeliveryResult): Promise<void> {
    await this.supabase
      .from('time_capsule_delivery_log')
      .insert({
        time_capsule_id: capsule_id,
        delivery_method: result.delivery_method,
        success: result.success,
        delivered_at: result.delivered_at,
        errors: result.errors,
        tracking_id: result.tracking_id
      });
  }
}

// Utility functions
export function createTimeCapsuleManager(): TimeCapsuleManager {
  return new TimeCapsuleManager();
}

export async function scheduleTimeCapsuleDelivery(
  user_id: string,
  title: string,
  content: string,
  trigger_date: string,
  recipient_email: string,
  recipient_name: string
): Promise<TimeCapsule> {
  const manager = new TimeCapsuleManager();

  const capsule_data: Partial<TimeCapsule> = {
    title,
    content,
    content_type: 'message',
    delivery_method: 'email',
    recipient_type: 'specific_person',
    recipient_details: {
      primary_recipient_name: recipient_name,
      primary_recipient_email: recipient_email,
      primary_recipient_relationship: 'unspecified'
    },
    trigger_type: 'date_based',
    trigger_date,
    jurisdiction: 'SK',
    language: 'sk',
    privacy_level: 'private',
    requires_legal_notice: false
  };

  const capsule = await manager.createTimeCapsule(user_id, capsule_data);
  await manager.scheduleTimeCapsule(capsule.id, user_id);

  return capsule;
}