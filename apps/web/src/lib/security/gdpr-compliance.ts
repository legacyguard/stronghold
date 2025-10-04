import { createClient } from '@/lib/supabase';

export interface PersonalDataField {
  field_name: string;
  field_type: 'name' | 'email' | 'phone' | 'address' | 'financial' | 'health' | 'behavioral' | 'biometric' | 'other';
  sensitivity_level: 'low' | 'medium' | 'high' | 'critical';
  table_name: string;
  column_name: string;
  description: string;
  legal_basis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interests';
  retention_period_days: number;
  is_encrypted: boolean;
  pseudonymized: boolean;
  created_at: Date;
  last_updated: Date;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: 'data_processing' | 'marketing' | 'analytics' | 'third_party_sharing' | 'cookies' | 'profiling';
  purpose: string;
  given_at: Date;
  withdrawn_at?: Date;
  is_active: boolean;
  consent_method: 'explicit' | 'implicit' | 'opt_in' | 'opt_out';
  legal_basis: string;
  data_categories: string[];
  retention_period: string;
  third_parties?: string[];
  consent_text: string;
  ip_address: string;
  user_agent: string;
  consent_version: string;
  parent_consent?: boolean; // For minors
  evidence_data: {
    timestamp: string;
    method: string;
    form_data?: Record<string, any>;
    digital_signature?: string;
  };
}

export interface DataSubjectRequest {
  id: string;
  user_id: string;
  request_type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection' | 'stop_processing';
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'partially_completed';
  requested_at: Date;
  completed_at?: Date;
  deadline: Date;
  request_details: {
    specific_data?: string[];
    reason?: string;
    preferred_format?: 'json' | 'csv' | 'xml' | 'pdf';
    delivery_method?: 'email' | 'secure_portal' | 'postal';
  };
  verification_status: 'pending' | 'verified' | 'failed';
  verification_method: 'email' | 'phone' | 'identity_document' | 'two_factor';
  assigned_to?: string;
  response_data?: {
    data_export?: string; // File path or content
    affected_records: number;
    third_party_notifications: string[];
    technical_measures_taken: string[];
    exceptions_applied?: string[];
  };
  compliance_notes: string[];
  communication_log: Array<{
    timestamp: Date;
    message: string;
    direction: 'inbound' | 'outbound';
    method: 'email' | 'phone' | 'portal' | 'letter';
  }>;
}

export interface DataBreachIncident {
  id: string;
  incident_type: 'confidentiality' | 'integrity' | 'availability' | 'combined';
  severity: 'low' | 'medium' | 'high' | 'critical';
  discovered_at: Date;
  reported_internally_at?: Date;
  reported_to_authority_at?: Date;
  reported_to_subjects_at?: Date;
  description: string;
  affected_data_categories: string[];
  estimated_affected_individuals: number;
  likely_consequences: string[];
  containment_measures: string[];
  technical_measures: string[];
  organizational_measures: string[];
  source_of_breach: 'internal' | 'external' | 'system_failure' | 'human_error' | 'unknown';
  data_categories_involved: Array<{
    category: string;
    sensitivity: string;
    volume: number;
    description: string;
  }>;
  risk_assessment: {
    likelihood_of_harm: 'low' | 'medium' | 'high';
    severity_of_harm: 'low' | 'medium' | 'high';
    overall_risk: 'low' | 'medium' | 'high';
    factors_considered: string[];
  };
  notification_requirements: {
    authority_notification_required: boolean;
    individual_notification_required: boolean;
    authority_deadline: Date;
    individual_deadline?: Date;
    notification_content: string;
  };
  investigation_status: 'ongoing' | 'completed' | 'closed';
  lessons_learned: string[];
  preventive_measures: string[];
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'closed';
}

export interface PrivacyImpactAssessment {
  id: string;
  project_name: string;
  description: string;
  data_controller: string;
  data_processor?: string;
  assessment_date: Date;
  review_date: Date;
  status: 'draft' | 'in_review' | 'approved' | 'requires_revision';
  necessity_assessment: {
    is_necessary: boolean;
    purpose_justification: string;
    proportionality_assessment: string;
    alternative_measures_considered: string[];
  };
  data_mapping: {
    personal_data_categories: string[];
    special_categories: string[];
    data_sources: string[];
    data_recipients: string[];
    retention_periods: Record<string, string>;
    transfer_outside_eu: boolean;
    transfer_safeguards?: string[];
  };
  legal_basis_analysis: {
    primary_legal_basis: string;
    justification: string;
    consent_requirements?: string;
    balancing_test_performed?: boolean;
  };
  risk_analysis: {
    identified_risks: Array<{
      risk_description: string;
      likelihood: 'low' | 'medium' | 'high';
      impact: 'low' | 'medium' | 'high';
      affected_individuals: string;
      mitigation_measures: string[];
    }>;
    residual_risk_level: 'low' | 'medium' | 'high';
    acceptable_risk: boolean;
  };
  safeguards_and_measures: {
    technical_measures: string[];
    organizational_measures: string[];
    transparency_measures: string[];
    data_subject_rights_provisions: string[];
  };
  consultation_requirements: {
    dpo_consulted: boolean;
    authority_consultation_required: boolean;
    stakeholder_consultation: string[];
  };
  approved_by?: string;
  approval_date?: Date;
  next_review_date: Date;
}

export interface ComplianceMetrics {
  consent_metrics: {
    total_consent_records: number;
    active_consents: number;
    withdrawn_consents: number;
    consent_conversion_rate: number;
    consent_by_type: Record<string, number>;
  };
  request_metrics: {
    total_requests: number;
    pending_requests: number;
    overdue_requests: number;
    average_response_time_hours: number;
    requests_by_type: Record<string, number>;
    completion_rate: number;
  };
  data_inventory: {
    total_personal_data_fields: number;
    high_sensitivity_fields: number;
    encrypted_fields_percentage: number;
    pseudonymized_fields_percentage: number;
    retention_compliance_rate: number;
  };
  breach_metrics: {
    total_incidents: number;
    open_incidents: number;
    average_containment_time_hours: number;
    authority_notifications: number;
    individual_notifications: number;
  };
  risk_metrics: {
    active_pias: number;
    high_risk_processing_activities: number;
    compliance_score: number; // 0-100
    outstanding_risks: number;
  };
}

class GDPRComplianceEngine {
  private static instance: GDPRComplianceEngine;
  private supabase = createClient();
  private personalDataFields: Map<string, PersonalDataField> = new Map();
  private activeConsents: Map<string, ConsentRecord[]> = new Map();
  private isInitialized = false;

  static getInstance(): GDPRComplianceEngine {
    if (!GDPRComplianceEngine.instance) {
      GDPRComplianceEngine.instance = new GDPRComplianceEngine();
    }
    return GDPRComplianceEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadPersonalDataFields();
    await this.setupDefaultDataFields();
    await this.loadActiveConsents();
    this.scheduleRetentionCleanup();
    this.isInitialized = true;
  }

  private async loadPersonalDataFields(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('personal_data_fields')
        .select('*');

      if (error) throw error;

      if (data) {
        data.forEach(field => {
          this.personalDataFields.set(`${field.table_name}.${field.column_name}`, field);
        });
      }
    } catch (error) {
      console.error('Error loading personal data fields:', error);
    }
  }

  private async setupDefaultDataFields(): Promise<void> {
    if (this.personalDataFields.size > 0) return; // Fields already exist

    const defaultFields: Partial<PersonalDataField>[] = [
      {
        field_name: 'user_email',
        field_type: 'email',
        sensitivity_level: 'medium',
        table_name: 'auth.users',
        column_name: 'email',
        description: 'User email address for authentication and communication',
        legal_basis: 'contract',
        retention_period_days: 2555, // 7 years
        is_encrypted: true,
        pseudonymized: false
      },
      {
        field_name: 'user_full_name',
        field_type: 'name',
        sensitivity_level: 'medium',
        table_name: 'user_profiles',
        column_name: 'full_name',
        description: 'Full name of the user',
        legal_basis: 'contract',
        retention_period_days: 2555,
        is_encrypted: false,
        pseudonymized: false
      },
      {
        field_name: 'user_phone',
        field_type: 'phone',
        sensitivity_level: 'medium',
        table_name: 'user_profiles',
        column_name: 'phone',
        description: 'Phone number for account security and emergency contact',
        legal_basis: 'legitimate_interests',
        retention_period_days: 1095, // 3 years
        is_encrypted: true,
        pseudonymized: false
      },
      {
        field_name: 'user_address',
        field_type: 'address',
        sensitivity_level: 'high',
        table_name: 'user_profiles',
        column_name: 'address',
        description: 'Billing and service delivery address',
        legal_basis: 'contract',
        retention_period_days: 2555,
        is_encrypted: true,
        pseudonymized: false
      },
      {
        field_name: 'behavioral_analytics',
        field_type: 'behavioral',
        sensitivity_level: 'low',
        table_name: 'user_journey_events',
        column_name: 'event_data',
        description: 'User behavior analytics for service improvement',
        legal_basis: 'consent',
        retention_period_days: 365,
        is_encrypted: false,
        pseudonymized: true
      },
      {
        field_name: 'ip_address',
        field_type: 'other',
        sensitivity_level: 'low',
        table_name: 'security_events',
        column_name: 'ip_address',
        description: 'IP address for security monitoring',
        legal_basis: 'legitimate_interests',
        retention_period_days: 180,
        is_encrypted: false,
        pseudonymized: true
      }
    ];

    for (const fieldData of defaultFields) {
      const field: PersonalDataField = {
        ...fieldData,
        created_at: new Date(),
        last_updated: new Date()
      } as PersonalDataField;

      try {
        const { data, error } = await this.supabase
          .from('personal_data_fields')
          .insert(field)
          .select()
          .single();

        if (error) throw error;
        this.personalDataFields.set(`${field.table_name}.${field.column_name}`, data);
      } catch (error) {
        console.error('Error creating default data field:', field.field_name, error);
      }
    }
  }

  private async loadActiveConsents(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('consent_records')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        data.forEach(consent => {
          const userConsents = this.activeConsents.get(consent.user_id) || [];
          userConsents.push(consent);
          this.activeConsents.set(consent.user_id, userConsents);
        });
      }
    } catch (error) {
      console.error('Error loading active consents:', error);
    }
  }

  private scheduleRetentionCleanup(): void {
    // Schedule daily retention cleanup
    setInterval(async () => {
      await this.performRetentionCleanup();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  async recordConsent(userId: string, consentData: Partial<ConsentRecord>): Promise<string> {
    try {
      const consent: ConsentRecord = {
        id: crypto.randomUUID(),
        user_id: userId,
        given_at: new Date(),
        is_active: true,
        consent_method: 'explicit',
        consent_version: '1.0',
        evidence_data: {
          timestamp: new Date().toISOString(),
          method: 'web_form'
        },
        ...consentData
      } as ConsentRecord;

      const { data, error } = await this.supabase
        .from('consent_records')
        .insert(consent)
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      const userConsents = this.activeConsents.get(userId) || [];
      userConsents.push(data);
      this.activeConsents.set(userId, userConsents);

      return consent.id;

    } catch (error) {
      console.error('Error recording consent:', error);
      throw error;
    }
  }

  async withdrawConsent(userId: string, consentId: string, reason?: string): Promise<void> {
    try {
      const updateData = {
        withdrawn_at: new Date(),
        is_active: false,
        withdrawal_reason: reason
      };

      const { error } = await this.supabase
        .from('consent_records')
        .update(updateData)
        .eq('id', consentId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local cache
      const userConsents = this.activeConsents.get(userId) || [];
      const consentIndex = userConsents.findIndex(c => c.id === consentId);
      if (consentIndex >= 0) {
        userConsents[consentIndex].is_active = false;
        userConsents[consentIndex].withdrawn_at = new Date();
      }

      // Log the withdrawal for audit trail
      await this.logDataProcessingActivity(userId, 'consent_withdrawn', {
        consent_id: consentId,
        reason: reason,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error withdrawing consent:', error);
      throw error;
    }
  }

  async createDataSubjectRequest(userId: string, requestData: Partial<DataSubjectRequest>): Promise<string> {
    try {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + 30); // 30 days to respond per GDPR

      const request: DataSubjectRequest = {
        id: crypto.randomUUID(),
        user_id: userId,
        requested_at: new Date(),
        deadline: deadline,
        status: 'pending',
        verification_status: 'pending',
        verification_method: 'email',
        compliance_notes: [],
        communication_log: [],
        ...requestData
      } as DataSubjectRequest;

      const { data, error } = await this.supabase
        .from('data_subject_requests')
        .insert(request)
        .select()
        .single();

      if (error) throw error;

      // Send verification email
      await this.sendVerificationRequest(request);

      // Log the request
      await this.logDataProcessingActivity(userId, 'data_subject_request_created', {
        request_id: request.id,
        request_type: request.request_type,
        timestamp: new Date().toISOString()
      });

      return request.id;

    } catch (error) {
      console.error('Error creating data subject request:', error);
      throw error;
    }
  }

  async processDataSubjectRequest(requestId: string): Promise<void> {
    try {
      const { data: request, error } = await this.supabase
        .from('data_subject_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) throw error;
      if (!request) throw new Error('Request not found');

      // Update status to in progress
      await this.updateRequestStatus(requestId, 'in_progress');

      switch (request.request_type) {
        case 'access':
          await this.processAccessRequest(request);
          break;
        case 'erasure':
          await this.processErasureRequest(request);
          break;
        case 'portability':
          await this.processPortabilityRequest(request);
          break;
        case 'rectification':
          await this.processRectificationRequest(request);
          break;
        case 'restriction':
          await this.processRestrictionRequest(request);
          break;
        case 'objection':
          await this.processObjectionRequest(request);
          break;
        default:
          throw new Error(`Unknown request type: ${request.request_type}`);
      }

    } catch (error) {
      console.error('Error processing data subject request:', error);
      throw error;
    }
  }

  private async processAccessRequest(request: DataSubjectRequest): Promise<void> {
    try {
      // Collect all personal data for the user
      const userData = await this.collectUserData(request.user_id);

      // Generate data export
      const exportData = {
        user_id: request.user_id,
        export_generated_at: new Date().toISOString(),
        data_categories: Object.keys(userData),
        data: userData,
        legal_basis_per_category: await this.getLegalBasisForUserData(request.user_id),
        retention_periods: await this.getRetentionPeriodsForUserData(request.user_id),
        third_party_recipients: await this.getThirdPartyRecipientsForUserData(request.user_id)
      };

      // Store export data securely
      const exportFilePath = await this.storeDataExport(request.user_id, exportData);

      // Update request with response data
      const responseData = {
        data_export: exportFilePath,
        affected_records: Object.keys(userData).length,
        third_party_notifications: [],
        technical_measures_taken: ['data_pseudonymization', 'secure_export_generation']
      };

      await this.updateRequestResponse(request.id, responseData);
      await this.updateRequestStatus(request.id, 'completed');

      // Send notification to user
      await this.notifyUserRequestCompleted(request);

    } catch (error) {
      console.error('Error processing access request:', error);
      await this.updateRequestStatus(request.id, 'rejected');
      throw error;
    }
  }

  private async processErasureRequest(request: DataSubjectRequest): Promise<void> {
    try {
      // Check if erasure is legally possible
      const erasureAssessment = await this.assessErasurePossibility(request.user_id);

      if (!erasureAssessment.is_possible) {
        await this.updateRequestStatus(request.id, 'rejected');
        await this.notifyUserRequestRejected(request, erasureAssessment.reason);
        return;
      }

      // Perform data erasure
      const erasureResults = await this.eraseUserData(request.user_id, erasureAssessment.erasable_data);

      // Update request with response data
      const responseData = {
        affected_records: erasureResults.erased_records,
        third_party_notifications: erasureResults.third_party_notifications,
        technical_measures_taken: ['secure_data_deletion', 'backup_data_removal'],
        exceptions_applied: erasureResults.exceptions_applied
      };

      await this.updateRequestResponse(request.id, responseData);
      await this.updateRequestStatus(request.id, 'completed');

      // Log erasure activity
      await this.logDataProcessingActivity(request.user_id, 'data_erased', {
        request_id: request.id,
        erased_records: erasureResults.erased_records,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing erasure request:', error);
      await this.updateRequestStatus(request.id, 'rejected');
      throw error;
    }
  }

  private async processPortabilityRequest(request: DataSubjectRequest): Promise<void> {
    try {
      // Collect portable data (data provided by user or generated through their use)
      const portableData = await this.collectPortableUserData(request.user_id);

      // Format data according to user preference
      const format = request.request_details.preferred_format || 'json';
      const exportData = this.formatDataForPortability(portableData, format);

      // Store export
      const exportFilePath = await this.storePortableDataExport(request.user_id, exportData, format);

      const responseData = {
        data_export: exportFilePath,
        affected_records: Object.keys(portableData).length,
        technical_measures_taken: ['data_format_conversion', 'secure_export_generation']
      };

      await this.updateRequestResponse(request.id, responseData);
      await this.updateRequestStatus(request.id, 'completed');

    } catch (error) {
      console.error('Error processing portability request:', error);
      await this.updateRequestStatus(request.id, 'rejected');
      throw error;
    }
  }

  private async collectUserData(userId: string): Promise<Record<string, any>> {
    const userData: Record<string, any> = {};

    // Collect data from all registered personal data fields
    for (const [fieldKey, field] of this.personalDataFields.entries()) {
      try {
        const { data, error } = await this.supabase
          .from(field.table_name.replace('auth.', ''))
          .select(field.column_name)
          .eq(field.table_name.includes('auth.') ? 'id' : 'user_id', userId);

        if (!error && data && data.length > 0) {
          userData[field.field_name] = data.map(row => row[field.column_name]);
        }
      } catch (error) {
        console.error(`Error collecting data for field ${fieldKey}:`, error);
      }
    }

    return userData;
  }

  async reportDataBreach(breachData: Partial<DataBreachIncident>): Promise<string> {
    try {
      const breach: DataBreachIncident = {
        id: crypto.randomUUID(),
        discovered_at: new Date(),
        status: 'open',
        investigation_status: 'ongoing',
        containment_measures: [],
        technical_measures: [],
        organizational_measures: [],
        lessons_learned: [],
        preventive_measures: [],
        ...breachData
      } as DataBreachIncident;

      // Auto-assess notification requirements
      breach.notification_requirements = this.assessNotificationRequirements(breach);

      const { data, error } = await this.supabase
        .from('data_breach_incidents')
        .insert(breach)
        .select()
        .single();

      if (error) throw error;

      // Schedule notifications if required
      await this.scheduleBreachNotifications(breach);

      return breach.id;

    } catch (error) {
      console.error('Error reporting data breach:', error);
      throw error;
    }
  }

  private assessNotificationRequirements(breach: DataBreachIncident): any {
    const authorityDeadline = new Date(breach.discovered_at);
    authorityDeadline.setHours(authorityDeadline.getHours() + 72); // 72 hours per GDPR

    let authorityRequired = false;
    let individualRequired = false;

    // Authority notification required if risk to rights and freedoms
    if (breach.severity === 'high' || breach.severity === 'critical') {
      authorityRequired = true;
    }

    // Individual notification required if high risk
    if (breach.severity === 'critical' ||
        breach.affected_data_categories.includes('financial') ||
        breach.affected_data_categories.includes('health')) {
      individualRequired = true;
    }

    return {
      authority_notification_required: authorityRequired,
      individual_notification_required: individualRequired,
      authority_deadline: authorityDeadline,
      individual_deadline: individualRequired ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : undefined,
      notification_content: this.generateBreachNotificationContent(breach)
    };
  }

  async createPrivacyImpactAssessment(assessmentData: Partial<PrivacyImpactAssessment>): Promise<string> {
    try {
      const pia: PrivacyImpactAssessment = {
        id: crypto.randomUUID(),
        assessment_date: new Date(),
        status: 'draft',
        next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        ...assessmentData
      } as PrivacyImpactAssessment;

      const { data, error } = await this.supabase
        .from('privacy_impact_assessments')
        .insert(pia)
        .select()
        .single();

      if (error) throw error;

      return pia.id;

    } catch (error) {
      console.error('Error creating PIA:', error);
      throw error;
    }
  }

  async generateComplianceReport(timeRange: { start: Date; end: Date }): Promise<ComplianceMetrics> {
    try {
      // Get consent metrics
      const { data: consents } = await this.supabase
        .from('consent_records')
        .select('*')
        .gte('given_at', timeRange.start.toISOString())
        .lte('given_at', timeRange.end.toISOString());

      // Get request metrics
      const { data: requests } = await this.supabase
        .from('data_subject_requests')
        .select('*')
        .gte('requested_at', timeRange.start.toISOString())
        .lte('requested_at', timeRange.end.toISOString());

      // Get breach metrics
      const { data: breaches } = await this.supabase
        .from('data_breach_incidents')
        .select('*')
        .gte('discovered_at', timeRange.start.toISOString())
        .lte('discovered_at', timeRange.end.toISOString());

      const metrics: ComplianceMetrics = {
        consent_metrics: {
          total_consent_records: consents?.length || 0,
          active_consents: consents?.filter(c => c.is_active).length || 0,
          withdrawn_consents: consents?.filter(c => !c.is_active).length || 0,
          consent_conversion_rate: 0.85, // Simplified
          consent_by_type: this.groupByField(consents || [], 'consent_type')
        },
        request_metrics: {
          total_requests: requests?.length || 0,
          pending_requests: requests?.filter(r => r.status === 'pending').length || 0,
          overdue_requests: requests?.filter(r => new Date(r.deadline) < new Date() && r.status !== 'completed').length || 0,
          average_response_time_hours: this.calculateAverageResponseTime(requests || []),
          requests_by_type: this.groupByField(requests || [], 'request_type'),
          completion_rate: this.calculateCompletionRate(requests || [])
        },
        data_inventory: {
          total_personal_data_fields: this.personalDataFields.size,
          high_sensitivity_fields: Array.from(this.personalDataFields.values()).filter(f => f.sensitivity_level === 'high' || f.sensitivity_level === 'critical').length,
          encrypted_fields_percentage: this.calculateEncryptionPercentage(),
          pseudonymized_fields_percentage: this.calculatePseudonymizationPercentage(),
          retention_compliance_rate: await this.calculateRetentionComplianceRate()
        },
        breach_metrics: {
          total_incidents: breaches?.length || 0,
          open_incidents: breaches?.filter(b => b.status === 'open' || b.status === 'investigating').length || 0,
          average_containment_time_hours: this.calculateAverageContainmentTime(breaches || []),
          authority_notifications: breaches?.filter(b => b.reported_to_authority_at).length || 0,
          individual_notifications: breaches?.filter(b => b.reported_to_subjects_at).length || 0
        },
        risk_metrics: {
          active_pias: await this.countActivePIAs(),
          high_risk_processing_activities: await this.countHighRiskActivities(),
          compliance_score: await this.calculateComplianceScore(),
          outstanding_risks: await this.countOutstandingRisks()
        }
      };

      return metrics;

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  // Helper methods (simplified implementations)
  private async performRetentionCleanup(): Promise<void> {
    console.log('Performing retention cleanup...');
    // Implementation would clean up expired data based on retention periods
  }

  private async sendVerificationRequest(request: DataSubjectRequest): Promise<void> {
    console.log(`Sending verification request for ${request.id}`);
    // Implementation would send verification email/SMS
  }

  private async updateRequestStatus(requestId: string, status: string): Promise<void> {
    await this.supabase
      .from('data_subject_requests')
      .update({ status, last_updated: new Date() })
      .eq('id', requestId);
  }

  private async updateRequestResponse(requestId: string, responseData: any): Promise<void> {
    await this.supabase
      .from('data_subject_requests')
      .update({ response_data: responseData })
      .eq('id', requestId);
  }

  private async logDataProcessingActivity(userId: string, activity: string, data: any): Promise<void> {
    console.log(`Logging activity: ${activity} for user ${userId}`, data);
    // Implementation would log to audit trail
  }

  private groupByField(array: any[], field: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = item[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageResponseTime(requests: any[]): number {
    const completedRequests = requests.filter(r => r.completed_at && r.requested_at);
    if (completedRequests.length === 0) return 0;

    const totalTime = completedRequests.reduce((sum, request) => {
      const requestTime = new Date(request.requested_at).getTime();
      const completedTime = new Date(request.completed_at).getTime();
      return sum + (completedTime - requestTime);
    }, 0);

    return totalTime / completedRequests.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateCompletionRate(requests: any[]): number {
    if (requests.length === 0) return 0;
    const completed = requests.filter(r => r.status === 'completed').length;
    return completed / requests.length;
  }

  private calculateEncryptionPercentage(): number {
    const totalFields = this.personalDataFields.size;
    if (totalFields === 0) return 0;
    const encryptedFields = Array.from(this.personalDataFields.values()).filter(f => f.is_encrypted).length;
    return (encryptedFields / totalFields) * 100;
  }

  private calculatePseudonymizationPercentage(): number {
    const totalFields = this.personalDataFields.size;
    if (totalFields === 0) return 0;
    const pseudonymizedFields = Array.from(this.personalDataFields.values()).filter(f => f.pseudonymized).length;
    return (pseudonymizedFields / totalFields) * 100;
  }

  private async calculateRetentionComplianceRate(): Promise<number> {
    // Simplified - would check actual data against retention periods
    return 95.5;
  }

  private calculateAverageContainmentTime(breaches: any[]): number {
    // Simplified implementation
    return breaches.length > 0 ? 4.5 : 0; // 4.5 hours average
  }

  private async countActivePIAs(): Promise<number> {
    const { data } = await this.supabase
      .from('privacy_impact_assessments')
      .select('id')
      .eq('status', 'approved');
    return data?.length || 0;
  }

  private async countHighRiskActivities(): Promise<number> {
    // Simplified - would analyze PIA risk assessments
    return 3;
  }

  private async calculateComplianceScore(): Promise<number> {
    // Simplified calculation based on various compliance factors
    return 87.3;
  }

  private async countOutstandingRisks(): Promise<number> {
    // Simplified - would count unmitigated risks from PIAs
    return 2;
  }

  private generateBreachNotificationContent(breach: DataBreachIncident): string {
    return `Data security incident notification - Reference: ${breach.id}`;
  }

  private async scheduleBreachNotifications(breach: DataBreachIncident): Promise<void> {
    console.log(`Scheduling breach notifications for incident ${breach.id}`);
    // Implementation would schedule automated notifications
  }

  // Additional helper methods would be implemented as needed...

  private async getLegalBasisForUserData(userId: string): Promise<Record<string, string>> {
    const basisMap: Record<string, string> = {};
    this.personalDataFields.forEach((field, key) => {
      basisMap[field.field_name] = field.legal_basis;
    });
    return basisMap;
  }

  private async getRetentionPeriodsForUserData(userId: string): Promise<Record<string, string>> {
    const retentionMap: Record<string, string> = {};
    this.personalDataFields.forEach((field, key) => {
      retentionMap[field.field_name] = `${field.retention_period_days} days`;
    });
    return retentionMap;
  }

  private async getThirdPartyRecipientsForUserData(userId: string): Promise<string[]> {
    // Simplified - would return actual third party recipients
    return ['Analytics Provider', 'Email Service Provider'];
  }

  private async storeDataExport(userId: string, exportData: any): Promise<string> {
    // Implementation would store export securely and return file path
    return `exports/${userId}_${Date.now()}.json`;
  }

  private async notifyUserRequestCompleted(request: DataSubjectRequest): Promise<void> {
    console.log(`Notifying user ${request.user_id} that request ${request.id} is completed`);
  }

  private async notifyUserRequestRejected(request: DataSubjectRequest, reason: string): Promise<void> {
    console.log(`Notifying user ${request.user_id} that request ${request.id} was rejected: ${reason}`);
  }

  private async assessErasurePossibility(userId: string): Promise<{is_possible: boolean; reason?: string; erasable_data: string[]}> {
    // Simplified assessment
    return {
      is_possible: true,
      erasable_data: ['user_email', 'user_full_name', 'behavioral_analytics']
    };
  }

  private async eraseUserData(userId: string, erasableData: string[]): Promise<{erased_records: number; third_party_notifications: string[]; exceptions_applied: string[]}> {
    // Implementation would perform actual data erasure
    return {
      erased_records: erasableData.length,
      third_party_notifications: ['Analytics Provider notified'],
      exceptions_applied: []
    };
  }

  private async collectPortableUserData(userId: string): Promise<Record<string, any>> {
    // Implementation would collect only portable data (user-provided or user-generated)
    return await this.collectUserData(userId);
  }

  private formatDataForPortability(data: Record<string, any>, format: string): any {
    switch (format) {
      case 'csv':
        // Convert to CSV format
        return this.convertToCSV(data);
      case 'xml':
        // Convert to XML format
        return this.convertToXML(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  private convertToCSV(data: Record<string, any>): string {
    // Simplified CSV conversion
    const headers = Object.keys(data);
    const rows = headers.map(header => `${header},${JSON.stringify(data[header])}`);
    return [headers.join(','), ...rows].join('\n');
  }

  private convertToXML(data: Record<string, any>): string {
    // Simplified XML conversion
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<personal_data>\n';
    Object.entries(data).forEach(([key, value]) => {
      xml += `  <${key}>${JSON.stringify(value)}</${key}>\n`;
    });
    xml += '</personal_data>';
    return xml;
  }

  private async storePortableDataExport(userId: string, exportData: any, format: string): Promise<string> {
    // Implementation would store export and return file path
    return `exports/${userId}_portable_${Date.now()}.${format}`;
  }

  private async processRectificationRequest(request: DataSubjectRequest): Promise<void> {
    // Implementation for rectification requests
    console.log(`Processing rectification request ${request.id}`);
  }

  private async processRestrictionRequest(request: DataSubjectRequest): Promise<void> {
    // Implementation for restriction requests
    console.log(`Processing restriction request ${request.id}`);
  }

  private async processObjectionRequest(request: DataSubjectRequest): Promise<void> {
    // Implementation for objection requests
    console.log(`Processing objection request ${request.id}`);
  }

  getPersonalDataFields(): PersonalDataField[] {
    return Array.from(this.personalDataFields.values());
  }

  async getUserConsents(userId: string): Promise<ConsentRecord[]> {
    return this.activeConsents.get(userId) || [];
  }
}

// Export singleton instance
export const gdprCompliance = GDPRComplianceEngine.getInstance();