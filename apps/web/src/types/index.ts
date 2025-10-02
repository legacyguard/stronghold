// Phase 5 Core Types - Centralized type definitions for MVP features

// === USER MANAGEMENT ===
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;

  // Location
  country_code: string;
  jurisdiction: string;
  timezone: string;
  language_preference: string;

  // Subscription
  subscription_tier: 'free' | 'premium' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'trial';
  subscription_expires_at?: string;

  // Family relationships
  is_family_owner: boolean;
  family_owner_id?: string;

  // Privacy & Security
  privacy_settings: UserPrivacySettings;
  security_settings: UserSecuritySettings;

  // Onboarding & UI
  onboarding_completed: boolean;
  onboarding_step: number;
  ui_preferences: UserUIPreferences;

  // Metadata
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface UserPrivacySettings {
  profile_visibility: 'private' | 'family' | 'public';
  allow_family_invitations: boolean;
  allow_emergency_access: boolean;
  data_sharing_consent: boolean;
  marketing_consent: boolean;
}

export interface UserSecuritySettings {
  two_factor_enabled: boolean;
  backup_codes_generated: boolean;
  emergency_access_enabled: boolean;
  session_timeout_minutes: number;
  ip_restrictions_enabled: boolean;
  allowed_ip_ranges?: string[];
}

export interface UserUIPreferences {
  theme: 'light' | 'dark' | 'system';
  sidebar_collapsed: boolean;
  dashboard_layout: 'grid' | 'list';
  notifications_enabled: boolean;
  sound_enabled: boolean;
  timezone_display: 'local' | 'utc';
}

// === DOCUMENT MANAGEMENT ===
export interface Document {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  document_type: DocumentType;
  file_url?: string;
  file_name?: string;
  file_size?: number;
  mime_type?: string;

  // AI-powered categorization
  category: DocumentCategory;
  subcategory?: string;
  tags: string[];
  confidence_score?: number; // AI categorization confidence

  // Legal significance
  is_legal_document: boolean;
  legal_significance: 'none' | 'low' | 'medium' | 'high' | 'critical';
  requires_witnesses: boolean;
  expiration_date?: string;

  // Access control
  visibility: 'private' | 'family' | 'guardian' | 'executor';
  shared_with_members: string[]; // member IDs

  // Processing status
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_analysis?: DocumentAIAnalysis;

  // Versioning
  version: number;
  parent_document_id?: string;
  is_current_version: boolean;

  created_at: string;
  updated_at: string;
}

export type DocumentType =
  | 'will'
  | 'power_of_attorney'
  | 'medical_directive'
  | 'trust_document'
  | 'insurance_policy'
  | 'property_deed'
  | 'financial_account'
  | 'identification'
  | 'medical_record'
  | 'contract'
  | 'certificate'
  | 'other';

export type DocumentCategory =
  | 'legal_essential'      // Závety, plné moci
  | 'legal_supporting'     // Podporné právne dokumenty
  | 'financial'           // Finančné dokumenty
  | 'medical'             // Zdravotné záznamy
  | 'property'            // Majetkové dokumenty
  | 'identity'            // Doklady totožnosti
  | 'insurance'           // Poisťovne
  | 'personal'            // Osobné dokumenty
  | 'family'              // Rodinné dokumenty
  | 'uncategorized';      // Nezaradené

export interface DocumentAIAnalysis {
  extracted_text?: string;
  key_entities: Array<{
    entity: string;
    type: 'person' | 'organization' | 'location' | 'date' | 'amount' | 'other';
    confidence: number;
  }>;
  important_dates: Array<{
    date: string;
    description: string;
    type: 'expiration' | 'effective' | 'signature' | 'other';
  }>;
  action_items: Array<{
    action: string;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
  }>;
  legal_warnings?: string[];
  language_detected: string;
  pages_count?: number;
  processing_time_ms: number;
}

// === GUARDIAN SYSTEM ===
export interface Guardian {
  id: string;
  user_id: string;
  guardian_name: string;
  guardian_email: string;
  guardian_phone?: string;
  relationship: GuardianRelationship;

  // Invitation & Status
  invitation_status: 'pending' | 'accepted' | 'declined' | 'revoked';
  invitation_token?: string;
  token_expires_at?: string;
  accepted_at?: string;

  // Permissions & Access
  access_level: GuardianAccessLevel;
  permissions: GuardianPermissions;
  emergency_priority: number; // 1 = highest priority

  // Emergency activation
  can_trigger_emergency: boolean;
  emergency_activation_method: 'email' | 'sms' | 'both';

  // Documents they can access
  accessible_documents: string[]; // document IDs

  // Metadata
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type GuardianRelationship =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'friend'
  | 'lawyer'
  | 'financial_advisor'
  | 'executor'
  | 'trustee'
  | 'other';

export type GuardianAccessLevel =
  | 'emergency_only'    // Iba v núdzových situáciách
  | 'limited'          // Obmedzený prístup
  | 'standard'         // Štandardný prístup
  | 'full';            // Plný prístup

export interface GuardianPermissions {
  view_documents: boolean;
  download_documents: boolean;
  receive_updates: boolean;
  trigger_emergency_protocol: boolean;
  access_emergency_contacts: boolean;
  view_family_tree: boolean;
  receive_milestone_notifications: boolean;
}

// === WILL GENERATOR ===
export interface WillDocument {
  id: string;
  user_id: string;
  title: string;
  jurisdiction: string; // SK, CZ, etc.

  // Will content
  testator_info: TestatorInfo;
  beneficiaries: Beneficiary[];
  assets: Asset[];
  special_instructions: SpecialInstruction[];
  guardianship_provisions?: GuardianshipProvision[];

  // Legal compliance
  witness_requirements: WitnessRequirement[];
  notarization_required: boolean;
  legal_template_version: string;

  // Status
  draft_status: 'draft' | 'review' | 'finalized' | 'executed';
  completion_percentage: number;

  // PDF generation
  pdf_generated: boolean;
  pdf_url?: string;
  pdf_generated_at?: string;

  // Validation
  validation_status: 'pending' | 'valid' | 'warnings' | 'invalid';
  validation_issues: ValidationIssue[];

  created_at: string;
  updated_at: string;
}

export interface TestatorInfo {
  full_name: string;
  date_of_birth: string;
  place_of_birth: string;
  address: Address;
  id_number: string;
  id_type: 'passport' | 'id_card' | 'other';
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  spouse_name?: string;
  children_names?: string[];
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  address?: Address;
  inheritance_percentage?: number;
  specific_assets?: string[];
  conditions?: string[];
  backup_beneficiary?: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  description: string;
  estimated_value?: number;
  currency: string;
  location?: string;
  ownership_details?: string;
  assigned_to_beneficiary?: string;
  special_instructions?: string;
}

export type AssetType =
  | 'real_estate'
  | 'bank_account'
  | 'investment'
  | 'vehicle'
  | 'jewelry'
  | 'artwork'
  | 'business_interest'
  | 'intellectual_property'
  | 'personal_property'
  | 'other';

export interface Address {
  street: string;
  city: string;
  postal_code: string;
  country: string;
  region?: string;
}

export interface SpecialInstruction {
  id: string;
  type: 'funeral' | 'burial' | 'executor' | 'guardian' | 'trust' | 'charity' | 'other';
  instruction: string;
  priority: 'low' | 'medium' | 'high';
}

export interface GuardianshipProvision {
  minor_child_name: string;
  guardian_name: string;
  alternate_guardian_name?: string;
  special_instructions?: string;
}

export interface WitnessRequirement {
  witness_name?: string;
  witness_address?: Address;
  signature_date?: string;
  is_satisfied: boolean;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  field: string;
  message: string;
  suggestion?: string;
}

// === TIME CAPSULE SYSTEM ===
export interface TimeCapsule {
  id: string;
  user_id: string;
  title: string;
  description?: string;

  // Content
  message_content: string;
  attachments: TimeCapsuleAttachment[];

  // Delivery configuration
  trigger_type: 'date' | 'milestone' | 'emergency' | 'manual';
  trigger_config: TimeCapsuleTrigger;

  // Recipients
  recipients: TimeCapsuleRecipient[];

  // Status
  status: 'draft' | 'scheduled' | 'delivered' | 'cancelled';
  created_at: string;
  scheduled_for?: string;
  delivered_at?: string;

  // Privacy
  is_encrypted: boolean;
  encryption_key_hint?: string;
}

export interface TimeCapsuleAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
}

export interface TimeCapsuleTrigger {
  // Date-based trigger
  specific_date?: string;

  // Milestone-based trigger
  milestone_type?: 'birthday' | 'anniversary' | 'graduation' | 'marriage' | 'custom';
  milestone_person?: string;
  milestone_age?: number;

  // Emergency trigger
  emergency_contact_id?: string;

  // Manual trigger
  manual_release_key?: string;
}

export interface TimeCapsuleRecipient {
  id: string;
  recipient_type: 'family_member' | 'guardian' | 'external';
  recipient_name: string;
  recipient_email: string;
  delivery_method: 'email' | 'sms' | 'both';
  message_preview?: string;
}

// === SOFIA AI ASSISTANT ===
export interface SofiaConversation {
  id: string;
  user_id: string;
  title: string;

  // Conversation metadata
  conversation_type: 'onboarding' | 'will_help' | 'legal_advice' | 'family_guidance' | 'emergency_help';
  context: SofiaContext;

  // Messages
  messages: SofiaMessage[];

  // State management
  is_active: boolean;
  last_activity_at: string;
  total_tokens_used: number;

  created_at: string;
  updated_at: string;
}

export interface SofiaMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;

  // AI metadata
  tokens_used?: number;
  response_time_ms?: number;
  confidence_score?: number;

  // Attachments
  attachments?: Array<{
    type: 'document' | 'image' | 'link';
    url: string;
    description: string;
  }>;

  // Actions taken
  actions?: Array<{
    type: 'document_analysis' | 'will_suggestion' | 'calendar_event' | 'notification';
    result: any;
  }>;
}

export interface SofiaContext {
  current_task?: string;
  user_goals: string[];
  mentioned_documents: string[];
  mentioned_family_members: string[];
  conversation_stage: 'greeting' | 'discovery' | 'guidance' | 'completion';
  user_tier: 'free' | 'premium' | 'enterprise';
  language: string;
  timezone: string;
}

// === SUBSCRIPTION & BILLING ===
export interface Subscription {
  id: string;
  user_id: string;
  tier: 'free' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'trial' | 'past_due';

  // Billing
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;

  // Usage tracking
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;

  // Payment
  payment_method?: PaymentMethod;
  last_payment_at?: string;
  next_payment_at?: string;

  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  documents_stored: number;
  ai_messages_used: number;
  pdf_generations: number;
  family_members: number;
  guardians_added: number;
  time_capsules_created: number;
}

export interface SubscriptionLimits {
  max_documents: number;
  max_ai_messages_per_month: number;
  max_pdf_generations_per_month: number;
  max_family_members: number;
  max_guardians: number;
  max_time_capsules: number;
  sofia_ai_access: boolean;
  will_generator_access: boolean;
  emergency_protocols: boolean;
  priority_support: boolean;
}

export interface PaymentMethod {
  type: 'card' | 'bank_transfer' | 'paypal';
  last_four?: string;
  expires_at?: string;
  brand?: string;
}

// === DASHBOARD & ANALYTICS ===
export interface DashboardData {
  user: UserProfile;
  subscription: Subscription;

  // Counts
  total_documents: number;
  total_family_members: number;
  total_guardians: number;
  pending_tasks: number;

  // Recent activity
  recent_documents: Document[];
  recent_conversations: SofiaConversation[];
  upcoming_milestones: Array<{
    title: string;
    date: string;
    type: string;
  }>;

  // Insights
  completion_score: number; // Overall profile completion %
  security_score: number;   // Security setup completion %
  legal_readiness_score: number; // Legal documents readiness %

  // Quick actions
  suggested_actions: Array<{
    title: string;
    description: string;
    action_type: string;
    priority: 'low' | 'medium' | 'high';
    url?: string;
  }>;
}

// === API REQUEST/RESPONSE TYPES ===
export interface CreateDocumentRequest {
  title: string;
  description?: string;
  document_type: DocumentType;
  visibility: 'private' | 'family' | 'guardian' | 'executor';
  file?: File;
}

export interface InviteGuardianRequest {
  guardian_name: string;
  guardian_email: string;
  guardian_phone?: string;
  relationship: GuardianRelationship;
  access_level: GuardianAccessLevel;
  emergency_priority: number;
  can_trigger_emergency: boolean;
  notes?: string;
}

export interface UpdateUserProfileRequest {
  full_name?: string;
  phone?: string;
  date_of_birth?: string;
  country_code?: string;
  timezone?: string;
  language_preference?: string;
  privacy_settings?: Partial<UserPrivacySettings>;
  security_settings?: Partial<UserSecuritySettings>;
  ui_preferences?: Partial<UserUIPreferences>;
}

export interface SofiaMessageRequest {
  conversation_id?: string;
  message: string;
  context?: Partial<SofiaContext>;
  attachments?: Array<{
    type: 'document_id' | 'file_upload';
    data: string;
  }>;
}

// === UTILITY TYPES ===
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// === FEATURE FLAGS ===
export interface FeatureFlags {
  sofia_ai_enabled: boolean;
  will_generator_enabled: boolean;
  time_capsules_enabled: boolean;
  emergency_protocols_enabled: boolean;
  family_collaboration_enabled: boolean;
  pdf_generation_enabled: boolean;
  document_ai_analysis_enabled: boolean;
  premium_features_enabled: boolean;
}

// Export all types
export * from '../lib/emergency/types';
export * from '../lib/family/types';