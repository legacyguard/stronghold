-- Emergency Activation System - Database Schema
-- Migration: 20241002_emergency_activation_system
-- Description: Complete emergency system with dead man's switch functionality

-- Emergency Contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    relationship TEXT NOT NULL,
    priority_order INTEGER NOT NULL DEFAULT 1,
    contact_method TEXT DEFAULT 'email' CHECK (contact_method IN ('email', 'sms', 'both')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, contact_email),
    CHECK (priority_order > 0)
);

-- Emergency Triggers table
CREATE TABLE IF NOT EXISTS emergency_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('inactivity', 'manual', 'health_check', 'scheduled')),
    trigger_name TEXT NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    last_check_at TIMESTAMPTZ,
    next_check_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency Activations table
CREATE TABLE IF NOT EXISTS emergency_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trigger_id UUID REFERENCES emergency_triggers(id) ON DELETE SET NULL,
    activation_type TEXT DEFAULT 'triggered' CHECK (activation_type IN ('triggered', 'manual', 'test')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'failed')),

    -- Timing
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Escalation
    escalation_level INTEGER DEFAULT 1,
    max_escalation_level INTEGER DEFAULT 3,
    next_escalation_at TIMESTAMPTZ,

    -- Cancellation
    cancellation_token UUID,
    cancellation_expires_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CHECK (escalation_level > 0),
    CHECK (max_escalation_level > 0)
);

-- Emergency Notifications table
CREATE TABLE IF NOT EXISTS emergency_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activation_id UUID NOT NULL REFERENCES emergency_activations(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL,

    notification_type TEXT DEFAULT 'initial' CHECK (notification_type IN ('initial', 'escalation', 'confirmation', 'cancellation')),
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('email', 'sms')),

    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),

    -- Content
    subject TEXT,
    message_content TEXT NOT NULL,
    template_used TEXT,

    -- Delivery tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,

    -- Response tracking
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emergency Templates table
CREATE TABLE IF NOT EXISTS emergency_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('initial_alert', 'escalation', 'confirmation_request', 'final_notice', 'cancellation')),
    language TEXT DEFAULT 'en',

    -- Content
    email_subject TEXT,
    email_body TEXT NOT NULL,
    sms_body TEXT,

    -- Template variables
    available_variables TEXT[] DEFAULT ARRAY[]::TEXT[],

    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, template_name, template_type, language)
);

-- Emergency Settings table
CREATE TABLE IF NOT EXISTS emergency_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Global settings
    is_system_active BOOLEAN DEFAULT FALSE,
    default_language TEXT DEFAULT 'en',
    timezone TEXT DEFAULT 'UTC',

    -- Default escalation settings
    default_escalation_delay_hours INTEGER DEFAULT 24,
    max_escalation_levels INTEGER DEFAULT 3,
    require_manual_confirmation BOOLEAN DEFAULT TRUE,

    -- Notification preferences
    notification_methods TEXT[] DEFAULT ARRAY['email']::TEXT[],
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    respect_quiet_hours BOOLEAN DEFAULT TRUE,

    -- Security settings
    cancellation_grace_period_minutes INTEGER DEFAULT 60,
    require_ip_verification BOOLEAN DEFAULT FALSE,
    allowed_ip_ranges TEXT[],

    -- Integration settings
    webhook_url TEXT,
    api_key_hash TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id),
    CHECK (default_escalation_delay_hours > 0),
    CHECK (max_escalation_levels > 0),
    CHECK (cancellation_grace_period_minutes >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_priority ON emergency_contacts(user_id, priority_order);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON emergency_contacts(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_emergency_triggers_user ON emergency_triggers(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_triggers_type ON emergency_triggers(trigger_type);
CREATE INDEX IF NOT EXISTS idx_emergency_triggers_active ON emergency_triggers(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_triggers_next_check ON emergency_triggers(next_check_at) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_emergency_activations_user ON emergency_activations(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_activations_status ON emergency_activations(status);
CREATE INDEX IF NOT EXISTS idx_emergency_activations_next_escalation ON emergency_activations(next_escalation_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_emergency_activations_cancellation_token ON emergency_activations(cancellation_token) WHERE cancellation_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_emergency_notifications_activation ON emergency_notifications(activation_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_contact ON emergency_notifications(contact_id);
CREATE INDEX IF NOT EXISTS idx_emergency_notifications_status ON emergency_notifications(status);

CREATE INDEX IF NOT EXISTS idx_emergency_templates_user ON emergency_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_templates_type ON emergency_templates(user_id, template_type, language);

-- Row Level Security (RLS) policies

-- Emergency Contacts RLS
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_contacts_user_policy ON emergency_contacts
    FOR ALL USING (user_id = auth.uid());

-- Emergency Triggers RLS
ALTER TABLE emergency_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_triggers_user_policy ON emergency_triggers
    FOR ALL USING (user_id = auth.uid());

-- Emergency Activations RLS
ALTER TABLE emergency_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_activations_user_policy ON emergency_activations
    FOR ALL USING (user_id = auth.uid());

-- Emergency Notifications RLS (read-only for contacts via activation)
ALTER TABLE emergency_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_notifications_owner_policy ON emergency_notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM emergency_activations ea
            WHERE ea.id = emergency_notifications.activation_id
            AND ea.user_id = auth.uid()
        )
    );

-- Allow contacts to view notifications sent to them
CREATE POLICY emergency_notifications_contact_policy ON emergency_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM emergency_contacts ec
            WHERE ec.id = emergency_notifications.contact_id
            AND ec.contact_email = auth.email()
        )
    );

-- Emergency Templates RLS
ALTER TABLE emergency_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_templates_user_policy ON emergency_templates
    FOR ALL USING (user_id = auth.uid());

-- Emergency Settings RLS
ALTER TABLE emergency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY emergency_settings_user_policy ON emergency_settings
    FOR ALL USING (user_id = auth.uid());

-- Functions for emergency system

-- Generate secure cancellation token
CREATE OR REPLACE FUNCTION generate_cancellation_token()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Check if activation can be cancelled
CREATE OR REPLACE FUNCTION can_cancel_activation(activation_uuid UUID, token_provided UUID)
RETURNS BOOLEAN AS $$
DECLARE
    activation_record emergency_activations%ROWTYPE;
BEGIN
    SELECT * INTO activation_record FROM emergency_activations
    WHERE id = activation_uuid
    AND status = 'pending'
    AND cancellation_token = token_provided
    AND cancellation_expires_at > NOW();

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Cancel emergency activation
CREATE OR REPLACE FUNCTION cancel_emergency_activation(activation_uuid UUID, token_provided UUID, user_ip TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    activation_record emergency_activations%ROWTYPE;
    cancellation_metadata JSONB;
BEGIN
    -- Verify token and get activation
    SELECT * INTO activation_record FROM emergency_activations
    WHERE id = activation_uuid
    AND status = 'pending'
    AND cancellation_token = token_provided
    AND cancellation_expires_at > NOW();

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Prepare cancellation metadata
    cancellation_metadata := COALESCE(activation_record.metadata, '{}'::JSONB);
    cancellation_metadata := jsonb_set(
        cancellation_metadata,
        '{cancellation_attempts}',
        COALESCE(cancellation_metadata->'cancellation_attempts', '[]'::JSONB) ||
        jsonb_build_object(
            'timestamp', NOW(),
            'ip_address', user_ip,
            'success', true
        )
    );

    -- Update activation status
    UPDATE emergency_activations
    SET
        status = 'cancelled',
        cancelled_at = NOW(),
        metadata = cancellation_metadata,
        updated_at = NOW()
    WHERE id = activation_uuid;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Calculate next check time for triggers
CREATE OR REPLACE FUNCTION calculate_next_check(trigger_type TEXT, config JSONB)
RETURNS TIMESTAMPTZ AS $$
BEGIN
    CASE trigger_type
        WHEN 'inactivity' THEN
            RETURN NOW() + (COALESCE((config->>'check_frequency_hours')::INTEGER, 24) || ' hours')::INTERVAL;
        WHEN 'health_check' THEN
            RETURN NOW() + (COALESCE((config->>'check_frequency_hours')::INTEGER, 1) || ' hours')::INTERVAL;
        WHEN 'scheduled' THEN
            RETURN (config->>'scheduled_date')::TIMESTAMPTZ;
        ELSE
            RETURN NULL;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at timestamps
CREATE TRIGGER update_emergency_contacts_updated_at
    BEFORE UPDATE ON emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_triggers_updated_at
    BEFORE UPDATE ON emergency_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_activations_updated_at
    BEFORE UPDATE ON emergency_activations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_notifications_updated_at
    BEFORE UPDATE ON emergency_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_templates_updated_at
    BEFORE UPDATE ON emergency_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_settings_updated_at
    BEFORE UPDATE ON emergency_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON emergency_contacts TO authenticated;
GRANT ALL ON emergency_triggers TO authenticated;
GRANT ALL ON emergency_activations TO authenticated;
GRANT ALL ON emergency_notifications TO authenticated;
GRANT ALL ON emergency_templates TO authenticated;
GRANT ALL ON emergency_settings TO authenticated;

GRANT EXECUTE ON FUNCTION generate_cancellation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION can_cancel_activation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_emergency_activation(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_next_check(TEXT, JSONB) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts for family protection notifications';
COMMENT ON TABLE emergency_triggers IS 'Configurable triggers for emergency activation';
COMMENT ON TABLE emergency_activations IS 'Emergency activation instances and their status';
COMMENT ON TABLE emergency_notifications IS 'Notification delivery tracking';
COMMENT ON TABLE emergency_templates IS 'Customizable notification templates';
COMMENT ON TABLE emergency_settings IS 'User emergency system configuration';

COMMENT ON FUNCTION cancel_emergency_activation(UUID, UUID, TEXT) IS 'Cancel emergency activation with secure token verification';
COMMENT ON FUNCTION calculate_next_check(TEXT, JSONB) IS 'Calculate next check time based on trigger type and configuration';