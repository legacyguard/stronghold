-- Phase 5 Core Database Schema
-- Enhanced user profiles, documents, guardians, and Sofia AI

-- =====================================================
-- USER PROFILES TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,

  -- Location & Jurisdiction
  country_code TEXT NOT NULL DEFAULT 'SK',
  jurisdiction TEXT NOT NULL DEFAULT 'SK',
  timezone TEXT NOT NULL DEFAULT 'Europe/Bratislava',
  language_preference TEXT NOT NULL DEFAULT 'sk',

  -- Subscription
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'trial', 'past_due')),
  subscription_expires_at TIMESTAMP WITH TIME ZONE,

  -- Family relationships
  is_family_owner BOOLEAN NOT NULL DEFAULT true,
  family_owner_id UUID REFERENCES user_profiles(id),

  -- Privacy & Security (JSON columns for flexibility)
  privacy_settings JSONB NOT NULL DEFAULT '{
    "profile_visibility": "private",
    "allow_family_invitations": true,
    "allow_emergency_access": true,
    "data_sharing_consent": false,
    "marketing_consent": false
  }',

  security_settings JSONB NOT NULL DEFAULT '{
    "two_factor_enabled": false,
    "backup_codes_generated": false,
    "emergency_access_enabled": true,
    "session_timeout_minutes": 480,
    "ip_restrictions_enabled": false,
    "allowed_ip_ranges": []
  }',

  -- UI Preferences
  ui_preferences JSONB NOT NULL DEFAULT '{
    "theme": "system",
    "sidebar_collapsed": false,
    "dashboard_layout": "grid",
    "notifications_enabled": true,
    "sound_enabled": true,
    "timezone_display": "local"
  }',

  -- Onboarding
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- DOCUMENTS TABLE (AI-Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,

  -- Document type and categorization
  document_type TEXT NOT NULL CHECK (document_type IN (
    'will', 'power_of_attorney', 'medical_directive', 'trust_document',
    'insurance_policy', 'property_deed', 'financial_account', 'identification',
    'medical_record', 'contract', 'certificate', 'other'
  )),

  category TEXT NOT NULL DEFAULT 'uncategorized' CHECK (category IN (
    'legal_essential', 'legal_supporting', 'financial', 'medical',
    'property', 'identity', 'insurance', 'personal', 'family', 'uncategorized'
  )),

  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',

  -- File information
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,

  -- AI Analysis results
  confidence_score DECIMAL(3,2), -- AI categorization confidence 0.00-1.00
  ai_analysis JSONB DEFAULT '{}', -- Extracted text, entities, dates, etc.
  processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),

  -- Legal significance
  is_legal_document BOOLEAN NOT NULL DEFAULT false,
  legal_significance TEXT NOT NULL DEFAULT 'none' CHECK (legal_significance IN ('none', 'low', 'medium', 'high', 'critical')),
  requires_witnesses BOOLEAN NOT NULL DEFAULT false,
  expiration_date DATE,

  -- Access control
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'family', 'guardian', 'executor')),
  shared_with_members UUID[] DEFAULT '{}',

  -- Versioning
  version INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  is_current_version BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- Family members can view documents based on visibility settings
CREATE POLICY "Family can view shared documents" ON documents
  FOR SELECT USING (
    visibility != 'private' AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (family_owner_id = documents.user_id OR id = documents.user_id)
    )
  );

-- =====================================================
-- GUARDIANS TABLE (Enhanced)
-- =====================================================

CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  guardian_email TEXT NOT NULL,
  guardian_phone TEXT,

  relationship TEXT NOT NULL CHECK (relationship IN (
    'spouse', 'child', 'parent', 'sibling', 'friend', 'lawyer',
    'financial_advisor', 'executor', 'trustee', 'other'
  )),

  -- Invitation & Status
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'revoked')),
  invitation_token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,

  -- Access control
  access_level TEXT NOT NULL DEFAULT 'emergency_only' CHECK (access_level IN ('emergency_only', 'limited', 'standard', 'full')),

  permissions JSONB NOT NULL DEFAULT '{
    "view_documents": false,
    "download_documents": false,
    "receive_updates": true,
    "trigger_emergency_protocol": false,
    "access_emergency_contacts": false,
    "view_family_tree": false,
    "receive_milestone_notifications": false
  }',

  -- Emergency settings
  emergency_priority INTEGER NOT NULL DEFAULT 5 CHECK (emergency_priority BETWEEN 1 AND 10),
  can_trigger_emergency BOOLEAN NOT NULL DEFAULT false,
  emergency_activation_method TEXT NOT NULL DEFAULT 'email' CHECK (emergency_activation_method IN ('email', 'sms', 'both')),

  -- Document access
  accessible_documents UUID[] DEFAULT '{}',

  -- Metadata
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for guardians
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own guardians" ON guardians
  FOR ALL USING (auth.uid() = user_id);

-- Guardians can view their own record
CREATE POLICY "Guardians can view own record" ON guardians
  FOR SELECT USING (guardian_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- =====================================================
-- WILL DOCUMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS will_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  jurisdiction TEXT NOT NULL, -- SK, CZ, etc.

  -- Will content (stored as JSON for flexibility)
  testator_info JSONB NOT NULL DEFAULT '{}',
  beneficiaries JSONB NOT NULL DEFAULT '[]',
  assets JSONB NOT NULL DEFAULT '[]',
  special_instructions JSONB NOT NULL DEFAULT '[]',
  guardianship_provisions JSONB DEFAULT '[]',

  -- Legal compliance
  witness_requirements JSONB NOT NULL DEFAULT '[]',
  notarization_required BOOLEAN NOT NULL DEFAULT true,
  legal_template_version TEXT NOT NULL DEFAULT '1.0',

  -- Status tracking
  draft_status TEXT NOT NULL DEFAULT 'draft' CHECK (draft_status IN ('draft', 'review', 'finalized', 'executed')),
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),

  -- PDF generation
  pdf_generated BOOLEAN NOT NULL DEFAULT false,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,

  -- Validation
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'warnings', 'invalid')),
  validation_issues JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for will_documents
ALTER TABLE will_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wills" ON will_documents
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- TIME CAPSULES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,

  -- Content
  message_content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',

  -- Delivery configuration
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('date', 'milestone', 'emergency', 'manual')),
  trigger_config JSONB NOT NULL DEFAULT '{}',

  -- Recipients
  recipients JSONB NOT NULL DEFAULT '[]',

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'delivered', 'cancelled')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,

  -- Privacy
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  encryption_key_hint TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for time_capsules
ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own time capsules" ON time_capsules
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SOFIA CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sofia_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,

  -- Conversation metadata
  conversation_type TEXT NOT NULL DEFAULT 'general' CHECK (conversation_type IN (
    'onboarding', 'will_help', 'legal_advice', 'family_guidance', 'emergency_help', 'general'
  )),

  context JSONB NOT NULL DEFAULT '{
    "current_task": null,
    "user_goals": [],
    "mentioned_documents": [],
    "mentioned_family_members": [],
    "conversation_stage": "greeting",
    "user_tier": "free",
    "language": "sk",
    "timezone": "Europe/Bratislava"
  }',

  -- State management
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  total_tokens_used INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for sofia_conversations
ALTER TABLE sofia_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations" ON sofia_conversations
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- SOFIA MESSAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS sofia_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES sofia_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,

  -- AI metadata
  tokens_used INTEGER DEFAULT 0,
  response_time_ms INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2),

  -- Attachments and actions
  attachments JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for sofia_messages
ALTER TABLE sofia_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversation messages" ON sofia_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sofia_conversations
      WHERE id = sofia_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own conversation messages" ON sofia_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sofia_conversations
      WHERE id = sofia_messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'premium', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'trial', 'past_due')),

  -- Billing periods
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,

  -- Usage tracking
  usage JSONB NOT NULL DEFAULT '{
    "documents_stored": 0,
    "ai_messages_used": 0,
    "pdf_generations": 0,
    "family_members": 0,
    "guardians_added": 0,
    "time_capsules_created": 0
  }',

  -- Limits based on tier
  limits JSONB NOT NULL DEFAULT '{
    "max_documents": 5,
    "max_ai_messages_per_month": 10,
    "max_pdf_generations_per_month": 1,
    "max_family_members": 2,
    "max_guardians": 1,
    "max_time_capsules": 1,
    "sofia_ai_access": false,
    "will_generator_access": false,
    "emergency_protocols": false,
    "priority_support": false
  }',

  -- Payment info
  payment_method JSONB DEFAULT '{}',
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_payment_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_family_owner_id ON user_profiles(family_owner_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_subscription_tier ON user_profiles(subscription_tier);

-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Guardians indexes
CREATE INDEX IF NOT EXISTS idx_guardians_user_id ON guardians(user_id);
CREATE INDEX IF NOT EXISTS idx_guardians_email ON guardians(guardian_email);
CREATE INDEX IF NOT EXISTS idx_guardians_invitation_token ON guardians(invitation_token);
CREATE INDEX IF NOT EXISTS idx_guardians_invitation_status ON guardians(invitation_status);

-- Will documents indexes
CREATE INDEX IF NOT EXISTS idx_will_documents_user_id ON will_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_will_documents_jurisdiction ON will_documents(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_will_documents_draft_status ON will_documents(draft_status);

-- Time capsules indexes
CREATE INDEX IF NOT EXISTS idx_time_capsules_user_id ON time_capsules(user_id);
CREATE INDEX IF NOT EXISTS idx_time_capsules_status ON time_capsules(status);
CREATE INDEX IF NOT EXISTS idx_time_capsules_scheduled_for ON time_capsules(scheduled_for);

-- Sofia conversations indexes
CREATE INDEX IF NOT EXISTS idx_sofia_conversations_user_id ON sofia_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_sofia_conversations_is_active ON sofia_conversations(is_active);
CREATE INDEX IF NOT EXISTS idx_sofia_conversations_last_activity ON sofia_conversations(last_activity_at DESC);

-- Sofia messages indexes
CREATE INDEX IF NOT EXISTS idx_sofia_messages_conversation_id ON sofia_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_sofia_messages_created_at ON sofia_messages(created_at DESC);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_payment_at ON subscriptions(next_payment_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guardians_updated_at BEFORE UPDATE ON guardians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_will_documents_updated_at BEFORE UPDATE ON will_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_capsules_updated_at BEFORE UPDATE ON time_capsules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sofia_conversations_updated_at BEFORE UPDATE ON sofia_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user profile and subscription on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;

  -- Insert user profile
  INSERT INTO user_profiles (
    id,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_email,
    NOW(),
    NOW()
  );

  -- Insert free subscription
  INSERT INTO subscriptions (
    user_id,
    tier,
    status,
    current_period_start,
    current_period_end,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    'free',
    'active',
    NOW(),
    NOW() + INTERVAL '1 year',
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default tier limits for different subscription tiers
-- This will be used by the application to check limits

-- Create a function to get subscription limits
CREATE OR REPLACE FUNCTION get_subscription_limits(user_tier TEXT)
RETURNS JSONB AS $$
BEGIN
  CASE user_tier
    WHEN 'premium' THEN
      RETURN '{
        "max_documents": 100,
        "max_ai_messages_per_month": 200,
        "max_pdf_generations_per_month": 10,
        "max_family_members": 10,
        "max_guardians": 5,
        "max_time_capsules": 20,
        "sofia_ai_access": true,
        "will_generator_access": true,
        "emergency_protocols": true,
        "priority_support": false
      }'::JSONB;
    WHEN 'enterprise' THEN
      RETURN '{
        "max_documents": -1,
        "max_ai_messages_per_month": -1,
        "max_pdf_generations_per_month": -1,
        "max_family_members": -1,
        "max_guardians": -1,
        "max_time_capsules": -1,
        "sofia_ai_access": true,
        "will_generator_access": true,
        "emergency_protocols": true,
        "priority_support": true
      }'::JSONB;
    ELSE -- free
      RETURN '{
        "max_documents": 5,
        "max_ai_messages_per_month": 10,
        "max_pdf_generations_per_month": 1,
        "max_family_members": 2,
        "max_guardians": 1,
        "max_time_capsules": 1,
        "sofia_ai_access": false,
        "will_generator_access": false,
        "emergency_protocols": false,
        "priority_support": false
      }'::JSONB;
  END CASE;
END;
$$ LANGUAGE plpgsql;