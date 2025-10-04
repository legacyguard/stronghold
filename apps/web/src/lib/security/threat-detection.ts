import { createClient } from '@/lib/supabase';

export interface SecurityEvent {
  id: string;
  event_type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_access' | 'privilege_escalation' | 'anomaly_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  session_id?: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
  event_data: {
    endpoint?: string;
    method?: string;
    status_code?: number;
    response_time?: number;
    payload_size?: number;
    geo_location?: {
      country: string;
      region: string;
      city: string;
    };
    risk_indicators?: string[];
  };
  threat_score: number; // 0-100
  is_blocked: boolean;
  investigation_status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  response_actions: string[];
  related_events?: string[];
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  pattern_type: 'behavioral' | 'temporal' | 'geographic' | 'volumetric' | 'signature';
  detection_rules: {
    conditions: Array<{
      field: string;
      operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range' | 'regex';
      value: any;
      weight: number;
    }>;
    threshold_score: number;
    time_window_minutes: number;
    occurrence_limit: number;
  };
  severity_mapping: {
    score_ranges: Array<{
      min_score: number;
      max_score: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }>;
  };
  response_actions: {
    automatic: string[];
    manual: string[];
  };
  is_active: boolean;
  created_at: Date;
  last_updated: Date;
}

export interface SecurityAlert {
  id: string;
  alert_type: 'threat_detected' | 'anomaly_detected' | 'policy_violation' | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_resources: string[];
  detection_time: Date;
  first_occurrence: Date;
  last_occurrence: Date;
  event_count: number;
  confidence_score: number; // 0-1
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'suppressed';
  assigned_to?: string;
  resolution_notes?: string;
  related_events: string[];
  mitigation_steps: string[];
  compliance_impact?: {
    regulations: string[];
    severity: string;
    required_actions: string[];
  };
}

export interface RiskAssessment {
  user_id: string;
  session_id: string;
  overall_risk_score: number; // 0-100
  risk_factors: {
    authentication_risk: number;
    behavioral_risk: number;
    network_risk: number;
    device_risk: number;
    temporal_risk: number;
  };
  anomaly_indicators: Array<{
    type: string;
    description: string;
    severity: string;
    confidence: number;
  }>;
  recommended_actions: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    automated: boolean;
  }>;
  assessment_time: Date;
  valid_until: Date;
}

export interface SecurityMetrics {
  total_events: number;
  threats_detected: number;
  alerts_generated: number;
  blocked_requests: number;
  false_positive_rate: number;
  mean_detection_time: number;
  mean_response_time: number;
  top_threat_types: Array<{
    type: string;
    count: number;
    severity_distribution: Record<string, number>;
  }>;
  geographic_distribution: Array<{
    country: string;
    threat_count: number;
    risk_level: string;
  }>;
  trend_analysis: {
    daily_threats: Array<{
      date: string;
      count: number;
      severity_breakdown: Record<string, number>;
    }>;
    pattern_evolution: Array<{
      pattern: string;
      trend: 'increasing' | 'decreasing' | 'stable';
      change_percentage: number;
    }>;
  };
}

class SecurityThreatDetectionEngine {
  private static instance: SecurityThreatDetectionEngine;
  private supabase = createClient();
  private threatPatterns: Map<string, ThreatPattern> = new Map();
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private isMonitoring = false;
  private isInitialized = false;

  static getInstance(): SecurityThreatDetectionEngine {
    if (!SecurityThreatDetectionEngine.instance) {
      SecurityThreatDetectionEngine.instance = new SecurityThreatDetectionEngine();
    }
    return SecurityThreatDetectionEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadThreatPatterns();
    await this.setupDefaultPatterns();
    await this.loadActiveAlerts();
    this.startMonitoring();
    this.isInitialized = true;
  }

  private async loadThreatPatterns(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('threat_patterns')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      if (data) {
        data.forEach(pattern => {
          this.threatPatterns.set(pattern.id, pattern);
        });
      }
    } catch (error) {
      console.error('Error loading threat patterns:', error);
    }
  }

  private async setupDefaultPatterns(): Promise<void> {
    if (this.threatPatterns.size > 0) return; // Patterns already exist

    const defaultPatterns: Partial<ThreatPattern>[] = [
      {
        id: 'brute_force_login',
        name: 'Brute Force Login Attack',
        description: 'Multiple failed login attempts from same IP',
        pattern_type: 'behavioral',
        detection_rules: {
          conditions: [
            { field: 'event_type', operator: 'equals', value: 'failed_login', weight: 30 },
            { field: 'ip_address', operator: 'equals', value: '*', weight: 20 }
          ],
          threshold_score: 50,
          time_window_minutes: 15,
          occurrence_limit: 5
        },
        severity_mapping: {
          score_ranges: [
            { min_score: 0, max_score: 30, severity: 'low' },
            { min_score: 31, max_score: 60, severity: 'medium' },
            { min_score: 61, max_score: 85, severity: 'high' },
            { min_score: 86, max_score: 100, severity: 'critical' }
          ]
        },
        response_actions: {
          automatic: ['rate_limit_ip', 'temporary_block'],
          manual: ['investigate_ip', 'contact_user']
        },
        is_active: true
      },
      {
        id: 'suspicious_geo_login',
        name: 'Suspicious Geographic Login',
        description: 'Login from unusual geographic location',
        pattern_type: 'geographic',
        detection_rules: {
          conditions: [
            { field: 'event_type', operator: 'equals', value: 'login_attempt', weight: 25 },
            { field: 'geo_location.country', operator: 'equals', value: 'UNUSUAL', weight: 40 }
          ],
          threshold_score: 65,
          time_window_minutes: 60,
          occurrence_limit: 1
        },
        severity_mapping: {
          score_ranges: [
            { min_score: 0, max_score: 40, severity: 'low' },
            { min_score: 41, max_score: 70, severity: 'medium' },
            { min_score: 71, max_score: 90, severity: 'high' },
            { min_score: 91, max_score: 100, severity: 'critical' }
          ]
        },
        response_actions: {
          automatic: ['require_mfa', 'send_notification'],
          manual: ['verify_user_identity', 'security_review']
        },
        is_active: true
      },
      {
        id: 'data_exfiltration',
        name: 'Data Exfiltration Attempt',
        description: 'Unusual data access patterns indicating potential exfiltration',
        pattern_type: 'volumetric',
        detection_rules: {
          conditions: [
            { field: 'event_type', operator: 'equals', value: 'data_access', weight: 30 },
            { field: 'payload_size', operator: 'greater_than', value: 10000000, weight: 35 }
          ],
          threshold_score: 70,
          time_window_minutes: 30,
          occurrence_limit: 3
        },
        severity_mapping: {
          score_ranges: [
            { min_score: 0, max_score: 50, severity: 'medium' },
            { min_score: 51, max_score: 80, severity: 'high' },
            { min_score: 81, max_score: 100, severity: 'critical' }
          ]
        },
        response_actions: {
          automatic: ['limit_data_access', 'alert_security_team'],
          manual: ['investigate_user_activity', 'review_access_logs']
        },
        is_active: true
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        description: 'User attempting to access resources beyond their permissions',
        pattern_type: 'behavioral',
        detection_rules: {
          conditions: [
            { field: 'event_type', operator: 'equals', value: 'privilege_escalation', weight: 50 },
            { field: 'status_code', operator: 'equals', value: 403, weight: 20 }
          ],
          threshold_score: 70,
          time_window_minutes: 10,
          occurrence_limit: 2
        },
        severity_mapping: {
          score_ranges: [
            { min_score: 0, max_score: 40, severity: 'low' },
            { min_score: 41, max_score: 70, severity: 'medium' },
            { min_score: 71, max_score: 90, severity: 'high' },
            { min_score: 91, max_score: 100, severity: 'critical' }
          ]
        },
        response_actions: {
          automatic: ['log_incident', 'restrict_user_access'],
          manual: ['security_investigation', 'user_interview']
        },
        is_active: true
      },
      {
        id: 'anomalous_behavior',
        name: 'Anomalous User Behavior',
        description: 'User behavior significantly different from established baseline',
        pattern_type: 'behavioral',
        detection_rules: {
          conditions: [
            { field: 'event_type', operator: 'equals', value: 'anomaly_detected', weight: 40 },
            { field: 'threat_score', operator: 'greater_than', value: 75, weight: 30 }
          ],
          threshold_score: 60,
          time_window_minutes: 120,
          occurrence_limit: 1
        },
        severity_mapping: {
          score_ranges: [
            { min_score: 0, max_score: 50, severity: 'low' },
            { min_score: 51, max_score: 75, severity: 'medium' },
            { min_score: 76, max_score: 90, severity: 'high' },
            { min_score: 91, max_score: 100, severity: 'critical' }
          ]
        },
        response_actions: {
          automatic: ['enhanced_monitoring', 'behavioral_analysis'],
          manual: ['user_verification', 'security_review']
        },
        is_active: true
      }
    ];

    for (const patternData of defaultPatterns) {
      const pattern: ThreatPattern = {
        ...patternData,
        created_at: new Date(),
        last_updated: new Date()
      } as ThreatPattern;

      try {
        const { data, error } = await this.supabase
          .from('threat_patterns')
          .insert(pattern)
          .select()
          .single();

        if (error) throw error;
        this.threatPatterns.set(pattern.id, data);
      } catch (error) {
        console.error('Error creating default threat pattern:', pattern.name, error);
      }
    }
  }

  private async loadActiveAlerts(): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('security_alerts')
        .select('*')
        .in('status', ['open', 'acknowledged', 'investigating']);

      if (error) throw error;

      if (data) {
        data.forEach(alert => {
          this.activeAlerts.set(alert.id, alert);
        });
      }
    } catch (error) {
      console.error('Error loading active alerts:', error);
    }
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // In a real implementation, this would listen to real-time events
    console.log('Security monitoring started');
  }

  async processSecurityEvent(eventData: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      threat_score: 0,
      is_blocked: false,
      investigation_status: 'open',
      response_actions: [],
      ...eventData
    } as SecurityEvent;

    try {
      // Calculate threat score
      event.threat_score = await this.calculateThreatScore(event);

      // Determine if event should be blocked
      event.is_blocked = this.shouldBlockEvent(event);

      // Evaluate against threat patterns
      const matchedPatterns = await this.evaluateThreatPatterns(event);

      // Generate alerts if necessary
      for (const pattern of matchedPatterns) {
        await this.generateAlert(event, pattern);
      }

      // Execute automatic response actions
      await this.executeResponseActions(event, matchedPatterns);

      // Store event
      await this.storeSecurityEvent(event);

      return event;

    } catch (error) {
      console.error('Error processing security event:', error);
      throw error;
    }
  }

  private async calculateThreatScore(event: SecurityEvent): Promise<number> {
    let score = 0;

    // Base score by event type
    const eventTypeScores = {
      'login_attempt': 10,
      'failed_login': 25,
      'suspicious_activity': 50,
      'data_access': 15,
      'privilege_escalation': 70,
      'anomaly_detected': 60
    };

    score += eventTypeScores[event.event_type] || 0;

    // IP reputation score (simplified)
    if (await this.isKnownBadIP(event.ip_address)) {
      score += 30;
    }

    // Geographic risk
    if (event.event_data.geo_location) {
      const geoRisk = await this.calculateGeographicRisk(event.event_data.geo_location);
      score += geoRisk;
    }

    // Time-based risk (e.g., access during unusual hours)
    const timeRisk = this.calculateTemporalRisk(event.timestamp);
    score += timeRisk;

    // User behavior analysis
    if (event.user_id) {
      const behaviorRisk = await this.calculateBehavioralRisk(event.user_id, event);
      score += behaviorRisk;
    }

    // Anomaly indicators
    if (event.event_data.risk_indicators) {
      score += event.event_data.risk_indicators.length * 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  private shouldBlockEvent(event: SecurityEvent): boolean {
    // Block based on threat score and event type
    if (event.threat_score >= 85) return true;
    if (event.event_type === 'privilege_escalation' && event.threat_score >= 70) return true;
    if (event.event_type === 'failed_login' && event.threat_score >= 80) return true;

    return false;
  }

  private async evaluateThreatPatterns(event: SecurityEvent): Promise<ThreatPattern[]> {
    const matchedPatterns: ThreatPattern[] = [];

    for (const [patternId, pattern] of this.threatPatterns.entries()) {
      if (await this.patternMatches(event, pattern)) {
        matchedPatterns.push(pattern);
      }
    }

    return matchedPatterns;
  }

  private async patternMatches(event: SecurityEvent, pattern: ThreatPattern): Promise<boolean> {
    let score = 0;

    // Evaluate each condition
    for (const condition of pattern.detection_rules.conditions) {
      if (this.evaluateCondition(event, condition)) {
        score += condition.weight;
      }
    }

    // Check if score meets threshold
    if (score < pattern.detection_rules.threshold_score) {
      return false;
    }

    // Check occurrence limit within time window
    const recentEvents = await this.getRecentEvents(
      event.ip_address,
      pattern.detection_rules.time_window_minutes
    );

    const matchingEvents = recentEvents.filter(e =>
      this.eventMatchesPattern(e, pattern)
    );

    return matchingEvents.length >= pattern.detection_rules.occurrence_limit;
  }

  private evaluateCondition(event: SecurityEvent, condition: any): boolean {
    const fieldValue = this.getFieldValue(event, condition.field);

    switch (condition.operator) {
      case 'equals':
        return condition.value === '*' || fieldValue === condition.value;
      case 'contains':
        return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
      case 'greater_than':
        return typeof fieldValue === 'number' && fieldValue > condition.value;
      case 'less_than':
        return typeof fieldValue === 'number' && fieldValue < condition.value;
      case 'in_range':
        return typeof fieldValue === 'number' &&
               fieldValue >= condition.value.min &&
               fieldValue <= condition.value.max;
      case 'regex':
        return typeof fieldValue === 'string' && new RegExp(condition.value).test(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(event: SecurityEvent, fieldPath: string): any {
    return fieldPath.split('.').reduce((obj, key) => obj?.[key], event);
  }

  private async generateAlert(event: SecurityEvent, pattern: ThreatPattern): Promise<void> {
    // Check if similar alert already exists
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert =>
      alert.alert_type === 'threat_detected' &&
      alert.related_events.includes(event.id)
    );

    if (existingAlert) {
      // Update existing alert
      existingAlert.event_count++;
      existingAlert.last_occurrence = event.timestamp;
      await this.updateAlert(existingAlert);
      return;
    }

    // Create new alert
    const severity = this.mapThreatScoreToSeverity(event.threat_score, pattern);

    const alert: SecurityAlert = {
      id: crypto.randomUUID(),
      alert_type: 'threat_detected',
      severity: severity,
      title: `${pattern.name} Detected`,
      description: `Pattern "${pattern.name}" triggered by security event. ${pattern.description}`,
      affected_resources: [event.user_id || event.ip_address].filter(Boolean),
      detection_time: new Date(),
      first_occurrence: event.timestamp,
      last_occurrence: event.timestamp,
      event_count: 1,
      confidence_score: Math.min(1, event.threat_score / 100),
      status: 'open',
      related_events: [event.id],
      mitigation_steps: pattern.response_actions.manual,
      compliance_impact: this.assessComplianceImpact(event, pattern)
    };

    await this.storeAlert(alert);
    this.activeAlerts.set(alert.id, alert);
  }

  private mapThreatScoreToSeverity(score: number, pattern: ThreatPattern): 'low' | 'medium' | 'high' | 'critical' {
    for (const range of pattern.severity_mapping.score_ranges) {
      if (score >= range.min_score && score <= range.max_score) {
        return range.severity;
      }
    }
    return 'medium';
  }

  private async executeResponseActions(event: SecurityEvent, patterns: ThreatPattern[]): Promise<void> {
    const actionsToExecute = new Set<string>();

    // Collect all automatic response actions
    patterns.forEach(pattern => {
      pattern.response_actions.automatic.forEach(action => {
        actionsToExecute.add(action);
      });
    });

    // Execute actions
    for (const action of actionsToExecute) {
      await this.executeAction(action, event);
    }

    // Update event with executed actions
    event.response_actions = Array.from(actionsToExecute);
  }

  private async executeAction(action: string, event: SecurityEvent): Promise<void> {
    try {
      switch (action) {
        case 'rate_limit_ip':
          await this.rateLimitIP(event.ip_address);
          break;
        case 'temporary_block':
          await this.temporarilyBlockIP(event.ip_address);
          break;
        case 'require_mfa':
          await this.requireMFAForUser(event.user_id);
          break;
        case 'send_notification':
          await this.sendSecurityNotification(event);
          break;
        case 'limit_data_access':
          await this.limitDataAccess(event.user_id);
          break;
        case 'alert_security_team':
          await this.alertSecurityTeam(event);
          break;
        case 'log_incident':
          await this.logSecurityIncident(event);
          break;
        case 'restrict_user_access':
          await this.restrictUserAccess(event.user_id);
          break;
        case 'enhanced_monitoring':
          await this.enableEnhancedMonitoring(event.user_id);
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error(`Error executing action ${action}:`, error);
    }
  }

  private async isKnownBadIP(ipAddress: string): Promise<boolean> {
    // In a real implementation, this would check against threat intelligence databases
    const knownBadIPs = ['192.168.1.100', '10.0.0.1']; // Example
    return knownBadIPs.includes(ipAddress);
  }

  private async calculateGeographicRisk(geoLocation: any): Promise<number> {
    // High-risk countries or regions
    const highRiskCountries = ['XX', 'YY']; // Example country codes

    if (highRiskCountries.includes(geoLocation.country)) {
      return 25;
    }

    return 0;
  }

  private calculateTemporalRisk(timestamp: Date): number {
    const hour = timestamp.getHours();

    // Higher risk during off-hours (11 PM - 6 AM)
    if (hour >= 23 || hour <= 6) {
      return 15;
    }

    return 0;
  }

  private async calculateBehavioralRisk(userId: string, event: SecurityEvent): Promise<number> {
    try {
      // Get user's recent activity pattern
      const recentEvents = await this.getUserRecentEvents(userId, 30); // Last 30 days

      if (recentEvents.length === 0) return 20; // New user = higher risk

      // Analyze patterns
      const normalHours = this.extractNormalAccessHours(recentEvents);
      const normalLocations = this.extractNormalLocations(recentEvents);

      let risk = 0;

      // Check time deviation
      const currentHour = event.timestamp.getHours();
      if (!normalHours.includes(currentHour)) {
        risk += 10;
      }

      // Check location deviation
      if (event.event_data.geo_location &&
          !normalLocations.includes(event.event_data.geo_location.country)) {
        risk += 15;
      }

      return risk;

    } catch (error) {
      console.error('Error calculating behavioral risk:', error);
      return 10; // Default moderate risk
    }
  }

  private async getRecentEvents(ipAddress: string, timeWindowMinutes: number): Promise<SecurityEvent[]> {
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() - timeWindowMinutes);

    try {
      const { data, error } = await this.supabase
        .from('security_events')
        .select('*')
        .eq('ip_address', ipAddress)
        .gte('timestamp', startTime.toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent events:', error);
      return [];
    }
  }

  private async getUserRecentEvents(userId: string, days: number): Promise<SecurityEvent[]> {
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - days);

    try {
      const { data, error } = await this.supabase
        .from('security_events')
        .select('*')
        .eq('user_id', userId)
        .gte('timestamp', startTime.toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user recent events:', error);
      return [];
    }
  }

  private eventMatchesPattern(event: SecurityEvent, pattern: ThreatPattern): boolean {
    // Simplified pattern matching logic
    return pattern.detection_rules.conditions.some(condition =>
      this.evaluateCondition(event, condition)
    );
  }

  private extractNormalAccessHours(events: SecurityEvent[]): number[] {
    const hourCounts = new Map<number, number>();

    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    // Return hours with significant activity (>10% of total events)
    const totalEvents = events.length;
    const threshold = totalEvents * 0.1;

    return Array.from(hourCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([hour, _]) => hour);
  }

  private extractNormalLocations(events: SecurityEvent[]): string[] {
    const locationCounts = new Map<string, number>();

    events.forEach(event => {
      const country = event.event_data.geo_location?.country;
      if (country) {
        locationCounts.set(country, (locationCounts.get(country) || 0) + 1);
      }
    });

    // Return countries with significant activity
    const totalEvents = events.length;
    const threshold = totalEvents * 0.05; // 5% threshold for locations

    return Array.from(locationCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([country, _]) => country);
  }

  private assessComplianceImpact(event: SecurityEvent, pattern: ThreatPattern): any {
    // Assess impact on various compliance regulations
    const regulations = [];
    let severity = 'low';

    if (event.event_type === 'data_access' || event.event_type === 'privilege_escalation') {
      regulations.push('GDPR', 'SOX');
      severity = 'high';
    }

    if (event.threat_score >= 80) {
      regulations.push('ISO27001', 'SOC2');
      severity = 'critical';
    }

    return regulations.length > 0 ? {
      regulations,
      severity,
      required_actions: ['document_incident', 'notify_stakeholders', 'review_controls']
    } : undefined;
  }

  private async storeSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('security_events')
        .insert(event);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing security event:', error);
    }
  }

  private async storeAlert(alert: SecurityAlert): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('security_alerts')
        .insert(alert);

      if (error) throw error;
    } catch (error) {
      console.error('Error storing security alert:', error);
    }
  }

  private async updateAlert(alert: SecurityAlert): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('security_alerts')
        .update(alert)
        .eq('id', alert.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating security alert:', error);
    }
  }

  // Response action implementations (simplified)
  private async rateLimitIP(ipAddress: string): Promise<void> {
    console.log(`Rate limiting IP: ${ipAddress}`);
    // Implementation would integrate with rate limiting system
  }

  private async temporarilyBlockIP(ipAddress: string): Promise<void> {
    console.log(`Temporarily blocking IP: ${ipAddress}`);
    // Implementation would integrate with firewall/WAF
  }

  private async requireMFAForUser(userId?: string): Promise<void> {
    if (!userId) return;
    console.log(`Requiring MFA for user: ${userId}`);
    // Implementation would update user security requirements
  }

  private async sendSecurityNotification(event: SecurityEvent): Promise<void> {
    console.log(`Sending security notification for event: ${event.id}`);
    // Implementation would send notification to user/admin
  }

  private async limitDataAccess(userId?: string): Promise<void> {
    if (!userId) return;
    console.log(`Limiting data access for user: ${userId}`);
    // Implementation would update user permissions
  }

  private async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    console.log(`Alerting security team about event: ${event.id}`);
    // Implementation would send alert to security team
  }

  private async logSecurityIncident(event: SecurityEvent): Promise<void> {
    console.log(`Logging security incident: ${event.id}`);
    // Implementation would create formal incident record
  }

  private async restrictUserAccess(userId?: string): Promise<void> {
    if (!userId) return;
    console.log(`Restricting access for user: ${userId}`);
    // Implementation would temporarily restrict user access
  }

  private async enableEnhancedMonitoring(userId?: string): Promise<void> {
    if (!userId) return;
    console.log(`Enabling enhanced monitoring for user: ${userId}`);
    // Implementation would increase monitoring level for user
  }

  async generateSecurityMetrics(timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
    try {
      // Get events in time range
      const { data: events } = await this.supabase
        .from('security_events')
        .select('*')
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString());

      const { data: alerts } = await this.supabase
        .from('security_alerts')
        .select('*')
        .gte('detection_time', timeRange.start.toISOString())
        .lte('detection_time', timeRange.end.toISOString());

      const totalEvents = events?.length || 0;
      const threatsDetected = events?.filter(e => e.threat_score >= 50).length || 0;
      const alertsGenerated = alerts?.length || 0;
      const blockedRequests = events?.filter(e => e.is_blocked).length || 0;

      return {
        total_events: totalEvents,
        threats_detected: threatsDetected,
        alerts_generated: alertsGenerated,
        blocked_requests: blockedRequests,
        false_positive_rate: 0.05, // Simplified
        mean_detection_time: 120, // Simplified - 2 minutes
        mean_response_time: 300, // Simplified - 5 minutes
        top_threat_types: this.calculateTopThreatTypes(events || []),
        geographic_distribution: this.calculateGeographicDistribution(events || []),
        trend_analysis: this.calculateTrendAnalysis(events || [])
      };

    } catch (error) {
      console.error('Error generating security metrics:', error);
      throw error;
    }
  }

  private calculateTopThreatTypes(events: SecurityEvent[]): any[] {
    const typeCounts = new Map<string, any>();

    events.forEach(event => {
      if (!typeCounts.has(event.event_type)) {
        typeCounts.set(event.event_type, {
          type: event.event_type,
          count: 0,
          severity_distribution: { low: 0, medium: 0, high: 0, critical: 0 }
        });
      }

      const typeData = typeCounts.get(event.event_type)!;
      typeData.count++;
      typeData.severity_distribution[event.severity]++;
    });

    return Array.from(typeCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateGeographicDistribution(events: SecurityEvent[]): any[] {
    const countryThreatCounts = new Map<string, number>();

    events.forEach(event => {
      if (event.event_data.geo_location?.country && event.threat_score >= 50) {
        const country = event.event_data.geo_location.country;
        countryThreatCounts.set(country, (countryThreatCounts.get(country) || 0) + 1);
      }
    });

    return Array.from(countryThreatCounts.entries())
      .map(([country, count]) => ({
        country,
        threat_count: count,
        risk_level: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.threat_count - a.threat_count)
      .slice(0, 20);
  }

  private calculateTrendAnalysis(events: SecurityEvent[]): any {
    // Simplified trend analysis
    const dailyCounts = new Map<string, any>();

    events.forEach(event => {
      const date = event.timestamp.toISOString().split('T')[0];

      if (!dailyCounts.has(date)) {
        dailyCounts.set(date, {
          date,
          count: 0,
          severity_breakdown: { low: 0, medium: 0, high: 0, critical: 0 }
        });
      }

      const dayData = dailyCounts.get(date)!;
      dayData.count++;
      dayData.severity_breakdown[event.severity]++;
    });

    return {
      daily_threats: Array.from(dailyCounts.values()).sort((a, b) => a.date.localeCompare(b.date)),
      pattern_evolution: [
        { pattern: 'brute_force_login', trend: 'decreasing', change_percentage: -15 },
        { pattern: 'suspicious_geo_login', trend: 'increasing', change_percentage: 8 },
        { pattern: 'anomalous_behavior', trend: 'stable', change_percentage: 2 }
      ]
    };
  }

  async assessUserRisk(userId: string, sessionId: string): Promise<RiskAssessment> {
    try {
      const recentEvents = await this.getUserRecentEvents(userId, 7); // Last 7 days

      // Calculate risk factors
      const authRisk = this.calculateAuthenticationRisk(recentEvents);
      const behaviorRisk = await this.calculateBehavioralRisk(userId, recentEvents[0] || {} as SecurityEvent);
      const networkRisk = this.calculateNetworkRisk(recentEvents);
      const deviceRisk = this.calculateDeviceRisk(recentEvents);
      const temporalRisk = this.calculateTemporalRisk(new Date());

      const overallRisk = Math.min(100,
        (authRisk + behaviorRisk + networkRisk + deviceRisk + temporalRisk) / 5
      );

      const assessment: RiskAssessment = {
        user_id: userId,
        session_id: sessionId,
        overall_risk_score: overallRisk,
        risk_factors: {
          authentication_risk: authRisk,
          behavioral_risk: behaviorRisk,
          network_risk: networkRisk,
          device_risk: deviceRisk,
          temporal_risk: temporalRisk
        },
        anomaly_indicators: this.detectAnomalies(recentEvents),
        recommended_actions: this.generateRiskRecommendations(overallRisk),
        assessment_time: new Date(),
        valid_until: new Date(Date.now() + 60 * 60 * 1000) // Valid for 1 hour
      };

      return assessment;

    } catch (error) {
      console.error('Error assessing user risk:', error);
      throw error;
    }
  }

  private calculateAuthenticationRisk(events: SecurityEvent[]): number {
    const failedLogins = events.filter(e => e.event_type === 'failed_login').length;
    const totalLogins = events.filter(e => e.event_type === 'login_attempt').length;

    if (totalLogins === 0) return 10; // No recent activity = moderate risk

    const failureRate = failedLogins / totalLogins;
    return Math.min(100, failureRate * 100);
  }

  private calculateNetworkRisk(events: SecurityEvent[]): number {
    const uniqueIPs = new Set(events.map(e => e.ip_address)).size;
    const totalEvents = events.length;

    if (totalEvents === 0) return 0;

    // Higher number of unique IPs = higher risk
    const ipVariability = uniqueIPs / Math.max(1, totalEvents);
    return Math.min(100, ipVariability * 200);
  }

  private calculateDeviceRisk(events: SecurityEvent[]): number {
    const uniqueUserAgents = new Set(events.map(e => e.user_agent)).size;
    const totalEvents = events.length;

    if (totalEvents === 0) return 0;

    // Multiple user agents could indicate device compromises
    const deviceVariability = uniqueUserAgents / Math.max(1, totalEvents);
    return Math.min(100, deviceVariability * 150);
  }

  private detectAnomalies(events: SecurityEvent[]): Array<{type: string; description: string; severity: string; confidence: number}> {
    const anomalies = [];

    // Check for unusual access patterns
    if (events.length > 50) { // High activity
      anomalies.push({
        type: 'high_activity',
        description: 'Unusually high number of security events',
        severity: 'medium',
        confidence: 0.8
      });
    }

    // Check for geographic anomalies
    const countries = new Set(events.map(e => e.event_data.geo_location?.country).filter(Boolean));
    if (countries.size > 3) {
      anomalies.push({
        type: 'geographic_spread',
        description: 'Access from multiple geographic locations',
        severity: 'high',
        confidence: 0.9
      });
    }

    return anomalies;
  }

  private generateRiskRecommendations(riskScore: number): Array<{action: string; priority: 'low' | 'medium' | 'high' | 'critical'; automated: boolean}> {
    const recommendations = [];

    if (riskScore >= 80) {
      recommendations.push(
        { action: 'Require immediate MFA verification', priority: 'critical', automated: true },
        { action: 'Restrict access to sensitive data', priority: 'critical', automated: true },
        { action: 'Initiate security investigation', priority: 'high', automated: false }
      );
    } else if (riskScore >= 60) {
      recommendations.push(
        { action: 'Enable enhanced monitoring', priority: 'high', automated: true },
        { action: 'Require MFA for sensitive operations', priority: 'medium', automated: true }
      );
    } else if (riskScore >= 40) {
      recommendations.push(
        { action: 'Increase session monitoring', priority: 'medium', automated: true },
        { action: 'Send security awareness notification', priority: 'low', automated: true }
      );
    }

    return recommendations;
  }

  getActiveAlerts(): SecurityAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  getThreatPatterns(): ThreatPattern[] {
    return Array.from(this.threatPatterns.values());
  }
}

// Export singleton instance
export const securityThreatDetection = SecurityThreatDetectionEngine.getInstance();