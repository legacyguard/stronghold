export interface EmergencyContact {
  id: string;
  user_id: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  relationship: string;
  priority_order: number;
  contact_method: 'email' | 'sms' | 'both';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmergencyTrigger {
  id: string;
  user_id: string;
  trigger_type: 'inactivity' | 'manual' | 'health_check' | 'scheduled';
  trigger_name: string;
  description?: string;

  // Configuration
  config: {
    // For inactivity triggers
    inactivity_days?: number;
    check_frequency_hours?: number;

    // For health check triggers
    health_check_url?: string;
    expected_response?: string;

    // For scheduled triggers
    scheduled_date?: string;

    // General settings
    escalation_delay_hours?: number;
    require_confirmation?: boolean;
  };

  is_active: boolean;
  last_check_at?: string;
  next_check_at?: string;
  created_at: string;
  updated_at: string;
}

export interface EmergencyActivation {
  id: string;
  user_id: string;
  trigger_id: string;
  activation_type: 'triggered' | 'manual' | 'test';
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'failed';

  // Timing
  triggered_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  completed_at?: string;

  // Escalation
  escalation_level: number;
  max_escalation_level: number;
  next_escalation_at?: string;

  // Cancellation
  cancellation_token?: string;
  cancellation_expires_at?: string;

  // Metadata
  metadata: {
    trigger_details?: any;
    escalation_log?: Array<{
      level: number;
      timestamp: string;
      contacts_notified: string[];
      method: string;
      success: boolean;
    }>;
    cancellation_attempts?: Array<{
      timestamp: string;
      ip_address?: string;
      user_agent?: string;
      success: boolean;
    }>;
  };

  created_at: string;
  updated_at: string;
}

export interface EmergencyNotification {
  id: string;
  activation_id: string;
  contact_id: string;
  escalation_level: number;

  notification_type: 'initial' | 'escalation' | 'confirmation' | 'cancellation';
  delivery_method: 'email' | 'sms';

  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

  // Content
  subject?: string;
  message_content: string;
  template_used?: string;

  // Delivery tracking
  sent_at?: string;
  delivered_at?: string;
  failed_at?: string;
  failure_reason?: string;

  // Response tracking
  opened_at?: string;
  clicked_at?: string;

  created_at: string;
  updated_at: string;
}

export interface EmergencyTemplate {
  id: string;
  user_id: string;
  template_name: string;
  template_type: 'initial_alert' | 'escalation' | 'confirmation_request' | 'final_notice' | 'cancellation';

  // Multi-language support
  language: string;

  // Content
  email_subject?: string;
  email_body: string;
  sms_body?: string;

  // Template variables available
  available_variables: string[];

  is_default: boolean;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

export interface EmergencySettings {
  id: string;
  user_id: string;

  // Global settings
  is_system_active: boolean;
  default_language: string;
  timezone: string;

  // Default escalation settings
  default_escalation_delay_hours: number;
  max_escalation_levels: number;
  require_manual_confirmation: boolean;

  // Notification preferences
  notification_methods: ('email' | 'sms')[];
  quiet_hours_start?: string; // HH:MM format
  quiet_hours_end?: string;   // HH:MM format
  respect_quiet_hours: boolean;

  // Security settings
  cancellation_grace_period_minutes: number;
  require_ip_verification: boolean;
  allowed_ip_ranges?: string[];

  // Integration settings
  webhook_url?: string;
  api_key_hash?: string;

  created_at: string;
  updated_at: string;
}

// Request/Response types for API
export interface CreateEmergencyContactRequest {
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  relationship: string;
  priority_order: number;
  contact_method: 'email' | 'sms' | 'both';
}

export interface CreateEmergencyTriggerRequest {
  trigger_type: 'inactivity' | 'manual' | 'health_check' | 'scheduled';
  trigger_name: string;
  description?: string;
  config: EmergencyTrigger['config'];
}

export interface UpdateEmergencySettingsRequest {
  is_system_active?: boolean;
  default_language?: string;
  timezone?: string;
  default_escalation_delay_hours?: number;
  max_escalation_levels?: number;
  require_manual_confirmation?: boolean;
  notification_methods?: ('email' | 'sms')[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  respect_quiet_hours?: boolean;
  cancellation_grace_period_minutes?: number;
  require_ip_verification?: boolean;
  allowed_ip_ranges?: string[];
  webhook_url?: string;
}

export interface EmergencyDashboardData {
  settings: EmergencySettings;
  contacts: EmergencyContact[];
  triggers: EmergencyTrigger[];
  recentActivations: EmergencyActivation[];
  systemStatus: {
    is_active: boolean;
    last_health_check: string;
    next_scheduled_check: string;
    pending_activations: number;
    total_contacts: number;
    active_triggers: number;
  };
}