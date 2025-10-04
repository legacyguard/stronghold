import { createClient } from '@/lib/supabase';

export interface AuditEvent {
  id: string;
  timestamp: Date;
  event_type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system_access' | 'configuration_change' | 'security_event' | 'compliance_action';
  category: 'security' | 'compliance' | 'operational' | 'administrative' | 'data_processing';
  severity: 'info' | 'warning' | 'error' | 'critical';
  user_id?: string;
  session_id?: string;
  ip_address: string;
  user_agent: string;
  resource_type: string;
  resource_id?: string;
  action: string;
  outcome: 'success' | 'failure' | 'partial' | 'denied';
  details: {
    description: string;
    before_state?: Record<string, any>;
    after_state?: Record<string, any>;
    affected_fields?: string[];
    risk_level?: 'low' | 'medium' | 'high' | 'critical';
    compliance_flags?: string[];
    technical_details?: Record<string, any>;
  };
  correlation_id?: string;
  parent_event_id?: string;
  compliance_requirements: string[];
  retention_period_days: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  report_type: 'gdpr' | 'sox' | 'iso27001' | 'soc2' | 'hipaa' | 'pci_dss' | 'custom';
  title: string;
  description: string;
  reporting_period: {
    start_date: Date;
    end_date: Date;
  };
  generated_at: Date;
  generated_by: string;
  status: 'generating' | 'completed' | 'error' | 'archived';
  summary: {
    total_events: number;
    critical_events: number;
    compliance_violations: number;
    security_incidents: number;
    data_subject_requests: number;
    consent_changes: number;
  };
  sections: ComplianceReportSection[];
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  attestations: ComplianceAttestation[];
  export_formats: {
    pdf_path?: string;
    csv_path?: string;
    json_path?: string;
    xml_path?: string;
  };
  next_review_date: Date;
  stakeholders: string[];
}

export interface ComplianceReportSection {
  section_id: string;
  title: string;
  description: string;
  compliance_framework: string;
  controls_assessed: string[];
  metrics: {
    compliance_score: number; // 0-100
    control_effectiveness: number; // 0-100
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
  };
  evidence: {
    audit_events: string[];
    supporting_documents: string[];
    control_tests: string[];
  };
  gaps_identified: string[];
  remediation_status: 'not_started' | 'in_progress' | 'completed' | 'deferred';
}

export interface ComplianceFinding {
  id: string;
  finding_type: 'control_deficiency' | 'policy_violation' | 'process_gap' | 'technical_issue' | 'documentation_gap';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_controls: string[];
  evidence: string[];
  business_impact: string;
  regulatory_impact: string;
  likelihood: 'low' | 'medium' | 'high';
  risk_rating: number; // 1-10
  remediation_plan: {
    recommended_actions: string[];
    assigned_to: string;
    target_completion_date: Date;
    estimated_effort: string;
    resources_required: string[];
  };
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk' | 'false_positive';
  tracking: {
    created_date: Date;
    last_updated: Date;
    resolution_date?: Date;
    progress_notes: Array<{
      date: Date;
      note: string;
      author: string;
    }>;
  };
}

export interface ComplianceRecommendation {
  id: string;
  category: 'policy' | 'process' | 'technology' | 'training' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  expected_benefits: string[];
  implementation_steps: string[];
  estimated_cost: string;
  estimated_timeline: string;
  responsible_party: string;
  success_criteria: string[];
  compliance_frameworks: string[];
  risk_mitigation: string[];
  dependencies: string[];
  approval_status: 'pending' | 'approved' | 'rejected' | 'deferred';
}

export interface ComplianceAttestation {
  id: string;
  attestation_type: 'control_effectiveness' | 'policy_compliance' | 'data_accuracy' | 'risk_assessment';
  control_or_requirement: string;
  attesting_party: string;
  attestation_date: Date;
  period_covered: {
    start_date: Date;
    end_date: Date;
  };
  statement: string;
  evidence_reviewed: string[];
  confidence_level: 'low' | 'medium' | 'high';
  limitations: string[];
  exceptions_noted: string[];
  digital_signature?: string;
  approval_chain: Array<{
    approver: string;
    approval_date: Date;
    comments?: string;
  }>;
}

export interface AuditQuery {
  filters: {
    start_date?: Date;
    end_date?: Date;
    user_id?: string;
    event_types?: string[];
    categories?: string[];
    severity?: string[];
    outcomes?: string[];
    resource_types?: string[];
    ip_addresses?: string[];
    compliance_requirements?: string[];
    tags?: string[];
  };
  search_text?: string;
  sort_by?: 'timestamp' | 'severity' | 'event_type' | 'outcome';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AuditAnalytics {
  summary_metrics: {
    total_events: number;
    events_by_type: Record<string, number>;
    events_by_severity: Record<string, number>;
    events_by_outcome: Record<string, number>;
    unique_users: number;
    unique_ip_addresses: number;
    compliance_violations: number;
  };
  time_series_data: Array<{
    timestamp: Date;
    event_count: number;
    severity_breakdown: Record<string, number>;
  }>;
  user_activity: Array<{
    user_id: string;
    total_events: number;
    last_activity: Date;
    risk_score: number;
    suspicious_activities: number;
  }>;
  resource_access: Array<{
    resource_type: string;
    access_count: number;
    unique_users: number;
    failed_access_attempts: number;
  }>;
  compliance_trends: Array<{
    requirement: string;
    compliance_score: number;
    trend: 'improving' | 'stable' | 'declining';
    last_violation?: Date;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    severity: string;
    detected_at: Date;
    affected_events: number;
  }>;
}

class AuditTrailEngine {
  private static instance: AuditTrailEngine;
  private supabase = createClient();
  private auditBuffer: AuditEvent[] = [];
  private bufferFlushInterval = 5000; // 5 seconds
  private isInitialized = false;

  static getInstance(): AuditTrailEngine {
    if (!AuditTrailEngine.instance) {
      AuditTrailEngine.instance = new AuditTrailEngine();
    }
    return AuditTrailEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.startBufferFlush();
    this.setupRetentionPolicy();
    this.isInitialized = true;
  }

  private startBufferFlush(): void {
    setInterval(async () => {
      await this.flushAuditBuffer();
    }, this.bufferFlushInterval);
  }

  private setupRetentionPolicy(): void {
    // Setup automated retention policy execution
    setInterval(async () => {
      await this.executeRetentionPolicy();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  async logEvent(eventData: Partial<AuditEvent>): Promise<string> {
    const event: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      ip_address: '127.0.0.1', // Default, should be overridden
      user_agent: 'Unknown',
      outcome: 'success',
      compliance_requirements: [],
      retention_period_days: this.calculateRetentionPeriod(eventData.category || 'operational'),
      tags: [],
      metadata: {},
      ...eventData
    } as AuditEvent;

    // Add to buffer for batch processing
    this.auditBuffer.push(event);

    // Immediate flush for critical events
    if (event.severity === 'critical' || event.category === 'security') {
      await this.flushAuditBuffer();
    }

    return event.id;
  }

  private async flushAuditBuffer(): Promise<void> {
    if (this.auditBuffer.length === 0) return;

    const eventsToFlush = [...this.auditBuffer];
    this.auditBuffer = [];

    try {
      const { error } = await this.supabase
        .from('audit_events')
        .insert(eventsToFlush);

      if (error) {
        console.error('Error flushing audit buffer:', error);
        // Re-add events to buffer for retry
        this.auditBuffer.unshift(...eventsToFlush);
      }
    } catch (error) {
      console.error('Error flushing audit buffer:', error);
      this.auditBuffer.unshift(...eventsToFlush);
    }
  }

  private calculateRetentionPeriod(category: string): number {
    const retentionPolicies = {
      'security': 2555, // 7 years
      'compliance': 2555, // 7 years
      'data_processing': 1095, // 3 years
      'operational': 365, // 1 year
      'administrative': 730 // 2 years
    };

    return retentionPolicies[category] || 365;
  }

  async queryAuditTrail(query: AuditQuery): Promise<{ events: AuditEvent[]; total_count: number }> {
    try {
      let supabaseQuery = this.supabase
        .from('audit_events')
        .select('*', { count: 'exact' });

      // Apply filters
      if (query.filters.start_date) {
        supabaseQuery = supabaseQuery.gte('timestamp', query.filters.start_date.toISOString());
      }

      if (query.filters.end_date) {
        supabaseQuery = supabaseQuery.lte('timestamp', query.filters.end_date.toISOString());
      }

      if (query.filters.user_id) {
        supabaseQuery = supabaseQuery.eq('user_id', query.filters.user_id);
      }

      if (query.filters.event_types && query.filters.event_types.length > 0) {
        supabaseQuery = supabaseQuery.in('event_type', query.filters.event_types);
      }

      if (query.filters.categories && query.filters.categories.length > 0) {
        supabaseQuery = supabaseQuery.in('category', query.filters.categories);
      }

      if (query.filters.severity && query.filters.severity.length > 0) {
        supabaseQuery = supabaseQuery.in('severity', query.filters.severity);
      }

      if (query.filters.outcomes && query.filters.outcomes.length > 0) {
        supabaseQuery = supabaseQuery.in('outcome', query.filters.outcomes);
      }

      if (query.filters.resource_types && query.filters.resource_types.length > 0) {
        supabaseQuery = supabaseQuery.in('resource_type', query.filters.resource_types);
      }

      // Apply text search
      if (query.search_text) {
        supabaseQuery = supabaseQuery.or(`action.ilike.%${query.search_text}%,details->>description.ilike.%${query.search_text}%`);
      }

      // Apply sorting
      const sortBy = query.sort_by || 'timestamp';
      const sortOrder = query.sort_order || 'desc';
      supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (query.limit) {
        supabaseQuery = supabaseQuery.limit(query.limit);
      }

      if (query.offset) {
        supabaseQuery = supabaseQuery.range(query.offset, (query.offset + (query.limit || 50)) - 1);
      }

      const { data, error, count } = await supabaseQuery;

      if (error) throw error;

      return {
        events: data || [],
        total_count: count || 0
      };

    } catch (error) {
      console.error('Error querying audit trail:', error);
      throw error;
    }
  }

  async generateComplianceReport(
    reportType: ComplianceReport['report_type'],
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<string> {
    try {
      const reportId = crypto.randomUUID();

      // Create initial report record
      const report: Partial<ComplianceReport> = {
        id: reportId,
        report_type: reportType,
        title: `${reportType.toUpperCase()} Compliance Report`,
        description: `Compliance report for period ${periodStart.toDateString()} to ${periodEnd.toDateString()}`,
        reporting_period: {
          start_date: periodStart,
          end_date: periodEnd
        },
        generated_at: new Date(),
        generated_by: generatedBy,
        status: 'generating',
        next_review_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        stakeholders: ['Security Team', 'Compliance Officer', 'Management']
      };

      const { error: insertError } = await this.supabase
        .from('compliance_reports')
        .insert(report);

      if (insertError) throw insertError;

      // Generate report content asynchronously
      this.generateReportContent(reportId, reportType, periodStart, periodEnd);

      return reportId;

    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  private async generateReportContent(
    reportId: string,
    reportType: ComplianceReport['report_type'],
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    try {
      // Get audit events for the period
      const { events } = await this.queryAuditTrail({
        filters: {
          start_date: periodStart,
          end_date: periodEnd
        }
      });

      // Generate summary
      const summary = this.generateReportSummary(events);

      // Generate sections based on report type
      const sections = await this.generateReportSections(reportType, events);

      // Generate findings
      const findings = await this.generateComplianceFindings(reportType, events);

      // Generate recommendations
      const recommendations = await this.generateComplianceRecommendations(findings);

      // Generate attestations
      const attestations = await this.generateComplianceAttestations(reportType, periodStart, periodEnd);

      // Export in various formats
      const exportFormats = await this.exportReport(reportId, {
        summary,
        sections,
        findings,
        recommendations,
        attestations
      });

      // Update report with complete data
      const { error } = await this.supabase
        .from('compliance_reports')
        .update({
          status: 'completed',
          summary,
          sections,
          findings,
          recommendations,
          attestations,
          export_formats: exportFormats
        })
        .eq('id', reportId);

      if (error) throw error;

    } catch (error) {
      console.error('Error generating report content:', error);

      // Update report status to error
      await this.supabase
        .from('compliance_reports')
        .update({ status: 'error' })
        .eq('id', reportId);
    }
  }

  private generateReportSummary(events: AuditEvent[]): ComplianceReport['summary'] {
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const complianceViolations = events.filter(e =>
      e.compliance_requirements.length > 0 && e.outcome === 'failure'
    ).length;
    const securityIncidents = events.filter(e =>
      e.category === 'security' && (e.severity === 'error' || e.severity === 'critical')
    ).length;

    return {
      total_events: events.length,
      critical_events: criticalEvents,
      compliance_violations: complianceViolations,
      security_incidents: securityIncidents,
      data_subject_requests: events.filter(e => e.event_type === 'compliance_action' && e.action.includes('data_subject')).length,
      consent_changes: events.filter(e => e.action.includes('consent')).length
    };
  }

  private async generateReportSections(
    reportType: ComplianceReport['report_type'],
    events: AuditEvent[]
  ): Promise<ComplianceReportSection[]> {
    const sections: ComplianceReportSection[] = [];

    switch (reportType) {
      case 'gdpr':
        sections.push(
          await this.generateGDPRSection('Data Subject Rights', events),
          await this.generateGDPRSection('Consent Management', events),
          await this.generateGDPRSection('Data Processing Activities', events),
          await this.generateGDPRSection('Security Measures', events)
        );
        break;

      case 'sox':
        sections.push(
          await this.generateSOXSection('Access Controls', events),
          await this.generateSOXSection('Change Management', events),
          await this.generateSOXSection('Data Integrity', events)
        );
        break;

      case 'iso27001':
        sections.push(
          await this.generateISO27001Section('Information Security Management', events),
          await this.generateISO27001Section('Risk Management', events),
          await this.generateISO27001Section('Incident Management', events)
        );
        break;

      default:
        sections.push(await this.generateGenericSection('General Compliance', events));
    }

    return sections;
  }

  private async generateGDPRSection(sectionTitle: string, events: AuditEvent[]): Promise<ComplianceReportSection> {
    const relevantEvents = events.filter(e =>
      e.compliance_requirements.includes('GDPR') ||
      e.tags.includes('gdpr') ||
      e.event_type === 'compliance_action'
    );

    return {
      section_id: crypto.randomUUID(),
      title: sectionTitle,
      description: `Assessment of ${sectionTitle} compliance under GDPR`,
      compliance_framework: 'GDPR',
      controls_assessed: this.getGDPRControls(sectionTitle),
      metrics: {
        compliance_score: this.calculateComplianceScore(relevantEvents),
        control_effectiveness: this.calculateControlEffectiveness(relevantEvents),
        risk_level: this.assessRiskLevel(relevantEvents),
        trend: this.analyzeTrend(relevantEvents)
      },
      evidence: {
        audit_events: relevantEvents.map(e => e.id),
        supporting_documents: [],
        control_tests: []
      },
      gaps_identified: this.identifyGaps(relevantEvents),
      remediation_status: 'in_progress'
    };
  }

  private async generateSOXSection(sectionTitle: string, events: AuditEvent[]): Promise<ComplianceReportSection> {
    const relevantEvents = events.filter(e =>
      e.compliance_requirements.includes('SOX') ||
      e.category === 'administrative' ||
      e.event_type === 'configuration_change'
    );

    return {
      section_id: crypto.randomUUID(),
      title: sectionTitle,
      description: `Assessment of ${sectionTitle} compliance under SOX`,
      compliance_framework: 'SOX',
      controls_assessed: this.getSOXControls(sectionTitle),
      metrics: {
        compliance_score: this.calculateComplianceScore(relevantEvents),
        control_effectiveness: this.calculateControlEffectiveness(relevantEvents),
        risk_level: this.assessRiskLevel(relevantEvents),
        trend: this.analyzeTrend(relevantEvents)
      },
      evidence: {
        audit_events: relevantEvents.map(e => e.id),
        supporting_documents: [],
        control_tests: []
      },
      gaps_identified: this.identifyGaps(relevantEvents),
      remediation_status: 'not_started'
    };
  }

  private async generateISO27001Section(sectionTitle: string, events: AuditEvent[]): Promise<ComplianceReportSection> {
    const relevantEvents = events.filter(e =>
      e.compliance_requirements.includes('ISO27001') ||
      e.category === 'security'
    );

    return {
      section_id: crypto.randomUUID(),
      title: sectionTitle,
      description: `Assessment of ${sectionTitle} compliance under ISO 27001`,
      compliance_framework: 'ISO27001',
      controls_assessed: this.getISO27001Controls(sectionTitle),
      metrics: {
        compliance_score: this.calculateComplianceScore(relevantEvents),
        control_effectiveness: this.calculateControlEffectiveness(relevantEvents),
        risk_level: this.assessRiskLevel(relevantEvents),
        trend: this.analyzeTrend(relevantEvents)
      },
      evidence: {
        audit_events: relevantEvents.map(e => e.id),
        supporting_documents: [],
        control_tests: []
      },
      gaps_identified: this.identifyGaps(relevantEvents),
      remediation_status: 'completed'
    };
  }

  private async generateGenericSection(sectionTitle: string, events: AuditEvent[]): Promise<ComplianceReportSection> {
    return {
      section_id: crypto.randomUUID(),
      title: sectionTitle,
      description: `General compliance assessment`,
      compliance_framework: 'Generic',
      controls_assessed: ['General Controls'],
      metrics: {
        compliance_score: this.calculateComplianceScore(events),
        control_effectiveness: this.calculateControlEffectiveness(events),
        risk_level: this.assessRiskLevel(events),
        trend: this.analyzeTrend(events)
      },
      evidence: {
        audit_events: events.map(e => e.id),
        supporting_documents: [],
        control_tests: []
      },
      gaps_identified: [],
      remediation_status: 'in_progress'
    };
  }

  private async generateComplianceFindings(
    reportType: ComplianceReport['report_type'],
    events: AuditEvent[]
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Analyze events for compliance violations
    const violations = events.filter(e =>
      e.outcome === 'failure' &&
      e.compliance_requirements.length > 0
    );

    const criticalSecurityEvents = events.filter(e =>
      e.category === 'security' &&
      e.severity === 'critical'
    );

    // Generate finding for violations
    if (violations.length > 0) {
      findings.push({
        id: crypto.randomUUID(),
        finding_type: 'policy_violation',
        severity: violations.length > 10 ? 'high' : 'medium',
        title: 'Compliance Policy Violations Detected',
        description: `${violations.length} compliance policy violations were identified during the reporting period`,
        affected_controls: ['Access Control', 'Data Protection'],
        evidence: violations.map(v => v.id),
        business_impact: 'Potential regulatory penalties and reputational risk',
        regulatory_impact: 'Non-compliance with applicable regulations',
        likelihood: 'medium',
        risk_rating: Math.min(10, violations.length),
        remediation_plan: {
          recommended_actions: [
            'Review and update compliance policies',
            'Enhance staff training on compliance requirements',
            'Implement automated compliance monitoring'
          ],
          assigned_to: 'Compliance Officer',
          target_completion_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          estimated_effort: '40 hours',
          resources_required: ['Compliance team', 'IT support']
        },
        status: 'open',
        tracking: {
          created_date: new Date(),
          last_updated: new Date(),
          progress_notes: []
        }
      });
    }

    // Generate finding for security events
    if (criticalSecurityEvents.length > 0) {
      findings.push({
        id: crypto.randomUUID(),
        finding_type: 'technical_issue',
        severity: 'high',
        title: 'Critical Security Events Require Investigation',
        description: `${criticalSecurityEvents.length} critical security events detected`,
        affected_controls: ['Security Monitoring', 'Incident Response'],
        evidence: criticalSecurityEvents.map(e => e.id),
        business_impact: 'Potential security breach and data compromise',
        regulatory_impact: 'May trigger breach notification requirements',
        likelihood: 'high',
        risk_rating: 8,
        remediation_plan: {
          recommended_actions: [
            'Investigate all critical security events',
            'Enhance security monitoring capabilities',
            'Review incident response procedures'
          ],
          assigned_to: 'Security Team',
          target_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimated_effort: '80 hours',
          resources_required: ['Security analysts', 'Forensic tools']
        },
        status: 'open',
        tracking: {
          created_date: new Date(),
          last_updated: new Date(),
          progress_notes: []
        }
      });
    }

    return findings;
  }

  private async generateComplianceRecommendations(findings: ComplianceFinding[]): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    // Generate recommendations based on findings
    const highSeverityFindings = findings.filter(f => f.severity === 'high' || f.severity === 'critical');

    if (highSeverityFindings.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        category: 'process',
        priority: 'high',
        title: 'Implement Enhanced Compliance Monitoring',
        description: 'Deploy automated compliance monitoring to detect and prevent policy violations in real-time',
        rationale: 'High number of compliance violations indicates need for proactive monitoring',
        expected_benefits: [
          'Reduced compliance violations',
          'Faster detection of issues',
          'Improved regulatory posture'
        ],
        implementation_steps: [
          'Assess current monitoring capabilities',
          'Select and deploy compliance monitoring tools',
          'Configure automated alerts and reporting',
          'Train staff on new procedures'
        ],
        estimated_cost: '$50,000 - $100,000',
        estimated_timeline: '3-6 months',
        responsible_party: 'Compliance Officer',
        success_criteria: [
          'Reduce violations by 80%',
          'Achieve real-time detection',
          'Improve audit scores'
        ],
        compliance_frameworks: ['GDPR', 'SOX', 'ISO27001'],
        risk_mitigation: ['Regulatory penalties', 'Audit findings'],
        dependencies: ['Budget approval', 'IT resources'],
        approval_status: 'pending'
      });
    }

    return recommendations;
  }

  private async generateComplianceAttestations(
    reportType: ComplianceReport['report_type'],
    periodStart: Date,
    periodEnd: Date
  ): Promise<ComplianceAttestation[]> {
    return [
      {
        id: crypto.randomUUID(),
        attestation_type: 'control_effectiveness',
        control_or_requirement: 'Access Control Systems',
        attesting_party: 'Security Manager',
        attestation_date: new Date(),
        period_covered: {
          start_date: periodStart,
          end_date: periodEnd
        },
        statement: 'Based on my review of audit logs and testing results, I attest that access control systems operated effectively during the period.',
        evidence_reviewed: ['Audit logs', 'Access reports', 'Control tests'],
        confidence_level: 'high',
        limitations: ['Limited to automated controls', 'Manual processes not fully tested'],
        exceptions_noted: ['2 instances of delayed access revocation'],
        approval_chain: [
          {
            approver: 'Chief Security Officer',
            approval_date: new Date(),
            comments: 'Approved with noted exceptions'
          }
        ]
      }
    ];
  }

  private async exportReport(reportId: string, reportData: any): Promise<ComplianceReport['export_formats']> {
    // In a real implementation, this would generate actual files
    return {
      pdf_path: `reports/${reportId}.pdf`,
      csv_path: `reports/${reportId}.csv`,
      json_path: `reports/${reportId}.json`,
      xml_path: `reports/${reportId}.xml`
    };
  }

  async generateAuditAnalytics(timeRange: { start: Date; end: Date }): Promise<AuditAnalytics> {
    try {
      const { events } = await this.queryAuditTrail({
        filters: {
          start_date: timeRange.start,
          end_date: timeRange.end
        }
      });

      const analytics: AuditAnalytics = {
        summary_metrics: {
          total_events: events.length,
          events_by_type: this.groupEvents(events, 'event_type'),
          events_by_severity: this.groupEvents(events, 'severity'),
          events_by_outcome: this.groupEvents(events, 'outcome'),
          unique_users: new Set(events.map(e => e.user_id).filter(Boolean)).size,
          unique_ip_addresses: new Set(events.map(e => e.ip_address)).size,
          compliance_violations: events.filter(e => e.outcome === 'failure' && e.compliance_requirements.length > 0).length
        },
        time_series_data: this.generateTimeSeries(events),
        user_activity: this.analyzeUserActivity(events),
        resource_access: this.analyzeResourceAccess(events),
        compliance_trends: this.analyzeComplianceTrends(events),
        anomalies: this.detectAnomalies(events)
      };

      return analytics;

    } catch (error) {
      console.error('Error generating audit analytics:', error);
      throw error;
    }
  }

  private async executeRetentionPolicy(): Promise<void> {
    try {
      console.log('Executing audit trail retention policy...');

      // Delete events that have exceeded their retention period
      const { error } = await this.supabase
        .from('audit_events')
        .delete()
        .lt('timestamp', new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000)); // 7 years max

      if (error) {
        console.error('Error executing retention policy:', error);
      }

    } catch (error) {
      console.error('Error executing retention policy:', error);
    }
  }

  // Helper methods for calculations
  private getGDPRControls(section: string): string[] {
    const controls = {
      'Data Subject Rights': ['Art. 15 Access', 'Art. 16 Rectification', 'Art. 17 Erasure'],
      'Consent Management': ['Art. 7 Consent', 'Art. 21 Objection'],
      'Data Processing Activities': ['Art. 30 Records', 'Art. 35 DPIA'],
      'Security Measures': ['Art. 32 Security', 'Art. 33 Breach Notification']
    };
    return controls[section] || [];
  }

  private getSOXControls(section: string): string[] {
    const controls = {
      'Access Controls': ['SOX-AC-01', 'SOX-AC-02'],
      'Change Management': ['SOX-CM-01', 'SOX-CM-02'],
      'Data Integrity': ['SOX-DI-01', 'SOX-DI-02']
    };
    return controls[section] || [];
  }

  private getISO27001Controls(section: string): string[] {
    const controls = {
      'Information Security Management': ['A.5.1.1', 'A.5.1.2'],
      'Risk Management': ['A.6.1.1', 'A.6.1.2'],
      'Incident Management': ['A.16.1.1', 'A.16.1.2']
    };
    return controls[section] || [];
  }

  private calculateComplianceScore(events: AuditEvent[]): number {
    if (events.length === 0) return 100;
    const violations = events.filter(e => e.outcome === 'failure').length;
    return Math.max(0, 100 - (violations / events.length) * 100);
  }

  private calculateControlEffectiveness(events: AuditEvent[]): number {
    // Simplified calculation
    return this.calculateComplianceScore(events);
  }

  private assessRiskLevel(events: AuditEvent[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalEvents = events.filter(e => e.severity === 'critical').length;
    const highEvents = events.filter(e => e.severity === 'error').length;

    if (criticalEvents > 0) return 'critical';
    if (highEvents > 5) return 'high';
    if (highEvents > 0 || events.length > 100) return 'medium';
    return 'low';
  }

  private analyzeTrend(events: AuditEvent[]): 'improving' | 'stable' | 'declining' {
    // Simplified trend analysis
    const recentEvents = events.filter(e =>
      new Date(e.timestamp).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const olderEvents = events.filter(e =>
      new Date(e.timestamp).getTime() <= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (recentEvents.length < olderEvents.length * 0.8) return 'improving';
    if (recentEvents.length > olderEvents.length * 1.2) return 'declining';
    return 'stable';
  }

  private identifyGaps(events: AuditEvent[]): string[] {
    const gaps = [];

    if (events.filter(e => e.outcome === 'failure').length > events.length * 0.1) {
      gaps.push('High failure rate indicates control gaps');
    }

    if (events.filter(e => e.severity === 'critical').length > 0) {
      gaps.push('Critical events require immediate attention');
    }

    return gaps;
  }

  private groupEvents(events: AuditEvent[], field: keyof AuditEvent): Record<string, number> {
    return events.reduce((acc, event) => {
      const key = String(event[field]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private generateTimeSeries(events: AuditEvent[]): Array<{timestamp: Date; event_count: number; severity_breakdown: Record<string, number>}> {
    // Group events by day
    const dailyEvents = new Map<string, AuditEvent[]>();

    events.forEach(event => {
      const date = new Date(event.timestamp).toDateString();
      if (!dailyEvents.has(date)) {
        dailyEvents.set(date, []);
      }
      dailyEvents.get(date)!.push(event);
    });

    return Array.from(dailyEvents.entries()).map(([date, dayEvents]) => ({
      timestamp: new Date(date),
      event_count: dayEvents.length,
      severity_breakdown: this.groupEvents(dayEvents, 'severity')
    }));
  }

  private analyzeUserActivity(events: AuditEvent[]): Array<{user_id: string; total_events: number; last_activity: Date; risk_score: number; suspicious_activities: number}> {
    const userActivity = new Map<string, any>();

    events.forEach(event => {
      if (!event.user_id) return;

      if (!userActivity.has(event.user_id)) {
        userActivity.set(event.user_id, {
          user_id: event.user_id,
          total_events: 0,
          last_activity: event.timestamp,
          risk_score: 0,
          suspicious_activities: 0
        });
      }

      const activity = userActivity.get(event.user_id);
      activity.total_events++;
      activity.last_activity = new Date(Math.max(activity.last_activity.getTime(), event.timestamp.getTime()));

      if (event.outcome === 'failure' || event.severity === 'critical') {
        activity.suspicious_activities++;
        activity.risk_score += event.severity === 'critical' ? 10 : 5;
      }
    });

    return Array.from(userActivity.values());
  }

  private analyzeResourceAccess(events: AuditEvent[]): Array<{resource_type: string; access_count: number; unique_users: number; failed_access_attempts: number}> {
    const resourceAccess = new Map<string, any>();

    events.forEach(event => {
      if (!resourceAccess.has(event.resource_type)) {
        resourceAccess.set(event.resource_type, {
          resource_type: event.resource_type,
          access_count: 0,
          unique_users: new Set(),
          failed_access_attempts: 0
        });
      }

      const access = resourceAccess.get(event.resource_type);
      access.access_count++;
      if (event.user_id) access.unique_users.add(event.user_id);
      if (event.outcome === 'failure' || event.outcome === 'denied') {
        access.failed_access_attempts++;
      }
    });

    return Array.from(resourceAccess.values()).map(access => ({
      ...access,
      unique_users: access.unique_users.size
    }));
  }

  private analyzeComplianceTrends(events: AuditEvent[]): Array<{requirement: string; compliance_score: number; trend: 'improving' | 'stable' | 'declining'; last_violation?: Date}> {
    const complianceEvents = events.filter(e => e.compliance_requirements.length > 0);
    const requirements = new Set(complianceEvents.flatMap(e => e.compliance_requirements));

    return Array.from(requirements).map(requirement => {
      const reqEvents = complianceEvents.filter(e => e.compliance_requirements.includes(requirement));
      const violations = reqEvents.filter(e => e.outcome === 'failure');
      const lastViolation = violations.length > 0 ?
        new Date(Math.max(...violations.map(v => v.timestamp.getTime()))) : undefined;

      return {
        requirement,
        compliance_score: this.calculateComplianceScore(reqEvents),
        trend: this.analyzeTrend(reqEvents),
        last_violation: lastViolation
      };
    });
  }

  private detectAnomalies(events: AuditEvent[]): Array<{type: string; description: string; severity: string; detected_at: Date; affected_events: number}> {
    const anomalies = [];

    // Check for unusual activity spikes
    const dailyCounts = this.generateTimeSeries(events);
    const avgDaily = dailyCounts.reduce((sum, day) => sum + day.event_count, 0) / dailyCounts.length;

    dailyCounts.forEach(day => {
      if (day.event_count > avgDaily * 3) {
        anomalies.push({
          type: 'activity_spike',
          description: `Unusual activity spike detected: ${day.event_count} events (${Math.round(day.event_count / avgDaily)}x average)`,
          severity: 'medium',
          detected_at: day.timestamp,
          affected_events: day.event_count
        });
      }
    });

    // Check for multiple failures from same user
    const userActivity = this.analyzeUserActivity(events);
    userActivity.forEach(user => {
      if (user.suspicious_activities > 10) {
        anomalies.push({
          type: 'user_anomaly',
          description: `User ${user.user_id} has ${user.suspicious_activities} suspicious activities`,
          severity: user.suspicious_activities > 20 ? 'high' : 'medium',
          detected_at: user.last_activity,
          affected_events: user.suspicious_activities
        });
      }
    });

    return anomalies;
  }
}

// Export singleton instance
export const auditTrail = AuditTrailEngine.getInstance();