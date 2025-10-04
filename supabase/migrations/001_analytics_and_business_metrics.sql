-- Analytics and Business Metrics Tables
-- Migration: 001_analytics_and_business_metrics
-- Created: 2025-01-04

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ANALYTICS TABLES
-- =============================================

-- User interactions for behavior tracking
CREATE TABLE user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('click', 'scroll', 'hover', 'focus', 'blur', 'form_input', 'page_view', 'navigation', 'error_encounter')),
    element_selector TEXT,
    element_text TEXT,
    page_path TEXT NOT NULL,
    coordinates JSONB, -- {x: number, y: number}
    scroll_position JSONB, -- {x: number, y: number}
    viewport_size JSONB NOT NULL, -- {width: number, height: number}
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    duration INTEGER, -- in milliseconds
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics for general analytics tracking
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    action TEXT NOT NULL,
    feature TEXT,
    page TEXT,
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions tracking
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    page_views INTEGER DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    device_info JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT
);

-- Request logs for performance monitoring
CREATE TABLE request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    method TEXT NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_time INTEGER, -- in milliseconds
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- BUSINESS METRICS TABLES
-- =============================================

-- Subscriptions and billing
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'premium_yearly', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'unpaid')),
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking for pricing limits
CREATE TABLE user_usage (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    plan_id TEXT NOT NULL DEFAULT 'free',
    usage JSONB NOT NULL DEFAULT '{
        "wills": 0,
        "documents": 0,
        "emergency_contacts": 0,
        "storage_bytes": 0,
        "family_members": 0,
        "ai_queries": 0
    }',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Plan changes history
CREATE TABLE plan_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_plan_id TEXT,
    new_plan_id TEXT NOT NULL,
    reason TEXT,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage history for analytics
CREATE TABLE usage_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    usage JSONB NOT NULL,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FEATURE FLAGS TABLES
-- =============================================

-- Feature flags
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    user_segments TEXT[] DEFAULT '{}',
    environment TEXT DEFAULT 'all' CHECK (environment IN ('development', 'staging', 'production', 'all')),
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- User segments for feature flags
CREATE TABLE user_segments (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    segment_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, segment_name)
);

-- Feature flag usage logs
CREATE TABLE feature_flag_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    enabled BOOLEAN NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- A/B TESTING TABLES
-- =============================================

-- A/B experiments
CREATE TABLE ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    hypothesis TEXT,
    traffic_split JSONB NOT NULL, -- {"variant_a": 50, "variant_b": 50}
    target_metric TEXT NOT NULL,
    secondary_metrics TEXT[] DEFAULT '{}',
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed', 'cancelled')),
    sample_size INTEGER,
    confidence_level INTEGER DEFAULT 95,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A/B experiment variants
CREATE TABLE ab_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    is_control BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User assignments to A/B tests
CREATE TABLE ab_user_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    experiment_name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(experiment_id, user_id)
);

-- A/B test results
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID REFERENCES ab_experiments(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES ab_variants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_value NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    session_id TEXT,
    metadata JSONB DEFAULT '{}'
);

-- =============================================
-- FEEDBACK TABLES
-- =============================================

-- User feedback
CREATE TABLE user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('general', 'bug', 'feature', 'compliment', 'complaint')),
    title TEXT,
    description TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    page TEXT NOT NULL,
    browser_info JSONB DEFAULT '{}',
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    category TEXT,
    tags TEXT[] DEFAULT '{}',
    contact_email TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ALERT MANAGEMENT TABLES
-- =============================================

-- System alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
    message TEXT NOT NULL,
    action TEXT NOT NULL,
    metric TEXT,
    value NUMERIC,
    threshold NUMERIC,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert configuration
CREATE TABLE alert_config (
    id TEXT PRIMARY KEY DEFAULT 'default',
    config JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User interactions indexes
CREATE INDEX idx_user_interactions_user_id ON user_interactions(user_id);
CREATE INDEX idx_user_interactions_session_id ON user_interactions(session_id);
CREATE INDEX idx_user_interactions_event_type ON user_interactions(event_type);
CREATE INDEX idx_user_interactions_timestamp ON user_interactions(timestamp);
CREATE INDEX idx_user_interactions_page_path ON user_interactions(page_path);

-- Metrics indexes
CREATE INDEX idx_metrics_user_id ON metrics(user_id);
CREATE INDEX idx_metrics_type ON metrics(type);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX idx_metrics_feature ON metrics(feature);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_user_sessions_last_seen ON user_sessions(last_seen);

-- Request logs indexes
CREATE INDEX idx_request_logs_timestamp ON request_logs(timestamp);
CREATE INDEX idx_request_logs_status_code ON request_logs(status_code);
CREATE INDEX idx_request_logs_path ON request_logs(path);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Usage tracking indexes
CREATE INDEX idx_user_usage_plan_id ON user_usage(plan_id);

-- Feature flags indexes
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- A/B testing indexes
CREATE INDEX idx_ab_experiments_name ON ab_experiments(name);
CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_user_assignments_user_id ON ab_user_assignments(user_id);
CREATE INDEX idx_ab_user_assignments_experiment_name ON ab_user_assignments(experiment_name);
CREATE INDEX idx_ab_test_results_experiment_id ON ab_test_results(experiment_id);
CREATE INDEX idx_ab_test_results_user_id ON ab_test_results(user_id);

-- Feedback indexes
CREATE INDEX idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_user_feedback_type ON user_feedback(type);
CREATE INDEX idx_user_feedback_status ON user_feedback(status);
CREATE INDEX idx_user_feedback_priority ON user_feedback(priority);
CREATE INDEX idx_user_feedback_timestamp ON user_feedback(timestamp);

-- =============================================
-- RLS (Row Level Security) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_config ENABLE ROW LEVEL SECURITY;

-- User interactions policies
CREATE POLICY "Users can view their own interactions" ON user_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions" ON user_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Metrics policies
CREATE POLICY "Users can view their own metrics" ON metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics" ON metrics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" ON user_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" ON user_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view their own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- User usage policies
CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_usage
    FOR UPDATE USING (auth.uid() = user_id);

-- Feature flags policies (read-only for users)
CREATE POLICY "Anyone can view enabled feature flags" ON feature_flags
    FOR SELECT USING (enabled = true);

-- User feedback policies
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- A/B testing policies
CREATE POLICY "Users can view their own assignments" ON ab_user_assignments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own test results" ON ab_test_results
    FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_experiments_updated_at BEFORE UPDATE ON ab_experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at BEFORE UPDATE ON user_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    p_user_id UUID,
    p_resource TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_usage 
    SET usage = jsonb_set(
        usage, 
        ARRAY[p_resource], 
        ((COALESCE((usage->p_resource)::INTEGER, 0) + p_amount))::TEXT::JSONB
    ),
    last_updated = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement usage
CREATE OR REPLACE FUNCTION decrement_usage(
    p_user_id UUID,
    p_resource TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_usage 
    SET usage = jsonb_set(
        usage, 
        ARRAY[p_resource], 
        GREATEST(0, (COALESCE((usage->p_resource)::INTEGER, 0) - p_amount))::TEXT::JSONB
    ),
    last_updated = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset usage for specific resource
CREATE OR REPLACE FUNCTION reset_usage(
    p_user_id UUID,
    p_resource TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE user_usage 
    SET usage = jsonb_set(
        usage, 
        ARRAY[p_resource], 
        '0'::JSONB
    ),
    last_updated = NOW()
    WHERE user_id = p_user_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get time to first action
CREATE OR REPLACE FUNCTION get_time_to_first_action(
    action_type TEXT
)
RETURNS NUMERIC AS $$
DECLARE
    avg_time NUMERIC;
BEGIN
    SELECT AVG(EXTRACT(EPOCH FROM (m.timestamp - p.created_at)) / 3600) INTO avg_time
    FROM metrics m
    JOIN auth.users p ON m.user_id = p.id
    WHERE m.action = action_type
    AND m.timestamp >= (NOW() - INTERVAL '30 days');
    
    RETURN COALESCE(avg_time, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert default feature flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage, environment) VALUES
('will_generation', 'Will generation wizard', true, 100, 'all'),
('document_management', 'Document management system', true, 100, 'all'),
('emergency_contacts', 'Emergency contacts management', true, 100, 'all'),
('sofia_ai', 'Sofia AI assistant', false, 0, 'development'),
('health_monitoring', 'Health monitoring features', false, 0, 'development'),
('financial_tracking', 'Financial tracking features', false, 0, 'development'),
('family_sharing', 'Family sharing features', false, 0, 'development'),
('admin_dashboard', 'Admin analytics dashboard', true, 100, 'development');

-- Insert default alert configuration
INSERT INTO alert_config (id, config) VALUES (
    'default',
    '{
        "errorRateThreshold": 5,
        "conversionDropThreshold": 30,
        "satisfactionThreshold": 3.5,
        "churnRateThreshold": 10,
        "responseTimeThreshold": 3000
    }'
);

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE user_interactions IS 'Detailed user interaction tracking for UX analytics';
COMMENT ON TABLE metrics IS 'General metrics and events tracking';
COMMENT ON TABLE user_sessions IS 'User session management and tracking';
COMMENT ON TABLE request_logs IS 'API request logging for performance monitoring';
COMMENT ON TABLE subscriptions IS 'User subscription and billing information';
COMMENT ON TABLE user_usage IS 'Usage tracking for pricing plan limits';
COMMENT ON TABLE feature_flags IS 'Feature flag management for gradual rollouts';
COMMENT ON TABLE ab_experiments IS 'A/B testing experiment definitions';
COMMENT ON TABLE user_feedback IS 'User feedback and support requests';
COMMENT ON TABLE alerts IS 'System monitoring alerts';

-- End of migration