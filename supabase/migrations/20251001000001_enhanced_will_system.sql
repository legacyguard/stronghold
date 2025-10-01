-- Enhanced Will Generation System - Production Database Schema
-- Migration: 20251001000001_enhanced_will_system.sql

-- Create custom types
CREATE TYPE jurisdiction_enum AS ENUM ('SK', 'CZ', 'AT', 'DE', 'PL');
CREATE TYPE will_type_enum AS ENUM ('holographic', 'witnessed', 'notarized', 'public');
CREATE TYPE trust_level_enum AS ENUM ('Bronze', 'Silver', 'Gold', 'Platinum');
CREATE TYPE user_tier_enum AS ENUM ('free', 'paid', 'family_edition');
CREATE TYPE collaboration_role_enum AS ENUM ('guardian', 'executor', 'heir', 'emergency_contact', 'observer');
CREATE TYPE invitation_status_enum AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- Core will documents table
CREATE TABLE will_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL,
  jurisdiction jurisdiction_enum NOT NULL,
  document_type will_type_enum NOT NULL,
  content text,
  metadata jsonb DEFAULT '{}',
  is_final boolean DEFAULT false,
  version integer DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  archived_at timestamptz
);

-- Trust seals for document validation
CREATE TABLE trust_seals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid REFERENCES will_documents(id) ON DELETE CASCADE,
  level trust_level_enum NOT NULL,
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  validations jsonb NOT NULL DEFAULT '{}',
  digital_signature text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  valid_until timestamptz DEFAULT (now() + interval '365 days'),
  revoked_at timestamptz,
  UNIQUE(document_id) -- One trust seal per document
);

-- AI usage tracking for cost monitoring
CREATE TABLE ai_usage_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_type varchar(50) NOT NULL,
  tokens_used integer NOT NULL,
  cost_usd decimal(10,4) NOT NULL,
  model_used varchar(50) NOT NULL,
  request_data jsonb DEFAULT '{}',
  response_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Partnership analytics for external redirects
CREATE TABLE partnership_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id varchar(100) NOT NULL,
  click_type varchar(50) NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  trust_seal_level trust_level_enum,
  referral_context varchar(100),
  user_agent text,
  ip_address inet,
  clicked_at timestamptz DEFAULT now()
);

-- User profiles with tier information
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier user_tier_enum DEFAULT 'free',
  display_name varchar(255),
  preferred_jurisdiction jurisdiction_enum,
  language_code varchar(5) DEFAULT 'sk',
  subscription_starts_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Family collaboration system
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) NOT NULL,
  role collaboration_role_enum NOT NULL,
  relationship varchar(100),
  permissions jsonb DEFAULT '{}',
  invitation_status invitation_status_enum DEFAULT 'pending',
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  emergency_access_enabled boolean DEFAULT false,
  UNIQUE(family_owner_id, email)
);

-- Emergency access triggers
CREATE TABLE emergency_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  triggered_by_member_id uuid REFERENCES family_members(id) ON DELETE SET NULL,
  trigger_type varchar(50) NOT NULL, -- 'dead_mans_switch', 'manual_trigger', 'scheduled'
  triggered_at timestamptz DEFAULT now(),
  documents_shared uuid[] DEFAULT '{}',
  notification_sent_to uuid[] DEFAULT '{}',
  resolved_at timestamptz,
  resolution_notes text
);

-- Document sharing and permissions
CREATE TABLE document_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES will_documents(id) ON DELETE CASCADE,
  shared_by_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_member_id uuid REFERENCES family_members(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{"read": true, "comment": false, "edit": false}',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Content management for legal updates
CREATE TABLE jurisdiction_content_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction jurisdiction_enum NOT NULL,
  update_type varchar(50) NOT NULL, -- 'template', 'validation_rules', 'legal_requirements'
  version varchar(20) NOT NULL,
  content_hash varchar(64) NOT NULL,
  update_description text,
  applied_at timestamptz DEFAULT now(),
  effective_from timestamptz DEFAULT now(),
  created_by varchar(100) DEFAULT 'system'
);

-- System audit logs
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action varchar(100) NOT NULL,
  resource_type varchar(50) NOT NULL,
  resource_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_will_documents_user_id ON will_documents(user_id);
CREATE INDEX idx_will_documents_jurisdiction ON will_documents(jurisdiction);
CREATE INDEX idx_will_documents_created_at ON will_documents(created_at DESC);

CREATE INDEX idx_trust_seals_document_id ON trust_seals(document_id);
CREATE INDEX idx_trust_seals_user_id ON trust_seals(user_id);
CREATE INDEX idx_trust_seals_level ON trust_seals(level);

CREATE INDEX idx_ai_usage_user_id_date ON ai_usage_tracking(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_operation_type ON ai_usage_tracking(operation_type);

CREATE INDEX idx_partnership_analytics_partner_id ON partnership_analytics(partner_id);
CREATE INDEX idx_partnership_analytics_clicked_at ON partnership_analytics(clicked_at DESC);

CREATE INDEX idx_family_members_owner_id ON family_members(family_owner_id);
CREATE INDEX idx_family_members_status ON family_members(invitation_status);

CREATE INDEX idx_emergency_access_owner_id ON emergency_access_events(family_owner_id);
CREATE INDEX idx_emergency_access_triggered_at ON emergency_access_events(triggered_at DESC);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_will_documents_updated_at BEFORE UPDATE ON will_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE will_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_seals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for will_documents
CREATE POLICY "Users can view their own documents" ON will_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" ON will_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" ON will_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" ON will_documents
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for trust_seals
CREATE POLICY "Users can view their own trust seals" ON trust_seals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert trust seals" ON trust_seals
    FOR INSERT WITH CHECK (true);

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for family_members
CREATE POLICY "Family owners can manage their family members" ON family_members
    FOR ALL USING (auth.uid() = family_owner_id);

CREATE POLICY "Members can view their family invitations" ON family_members
    FOR SELECT USING (auth.uid() = member_user_id);

CREATE POLICY "Members can update their own invitations" ON family_members
    FOR UPDATE USING (auth.uid() = member_user_id);

-- RLS Policies for ai_usage_tracking
CREATE POLICY "Users can view their own AI usage" ON ai_usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for document_shares
CREATE POLICY "Document shares viewable by owner and shared member" ON document_shares
    FOR SELECT USING (
        auth.uid() = shared_by_user_id OR
        auth.uid() = (SELECT member_user_id FROM family_members WHERE id = shared_with_member_id)
    );

-- Insert default user tier for all existing users
INSERT INTO user_profiles (id, tier)
SELECT id, 'free'
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Create function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, tier)
  VALUES (new.id, 'free');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create view for user documents with trust seals
CREATE VIEW user_documents_with_trust_seals AS
SELECT
    wd.*,
    ts.level as trust_seal_level,
    ts.confidence_score,
    ts.issued_at as trust_seal_issued_at,
    ts.valid_until as trust_seal_valid_until
FROM will_documents wd
LEFT JOIN trust_seals ts ON wd.id = ts.document_id AND ts.revoked_at IS NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Comments for documentation
COMMENT ON TABLE will_documents IS 'Core will documents with versioning and metadata';
COMMENT ON TABLE trust_seals IS 'Digital trust seals for document validation and confidence scoring';
COMMENT ON TABLE ai_usage_tracking IS 'Track AI API usage for cost monitoring and budget alerts';
COMMENT ON TABLE partnership_analytics IS 'Analytics for external legal partner redirects';
COMMENT ON TABLE family_members IS 'Family collaboration system with role-based permissions';
COMMENT ON TABLE emergency_access_events IS 'Emergency access triggers and dead mans switch events';