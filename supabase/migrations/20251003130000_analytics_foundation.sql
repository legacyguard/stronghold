-- Analytics Foundation Migration
-- Creates tables for real user metrics and tracking

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_action TEXT NOT NULL,
    page_path TEXT,
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs Table (expanded from base service)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name TEXT UNIQUE NOT NULL,
    is_enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_users TEXT[] DEFAULT '{}',
    conditions JSONB DEFAULT '{}',
    description TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Tracking Table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    current_usage INTEGER DEFAULT 0,
    usage_limit INTEGER DEFAULT -1, -- -1 means unlimited
    reset_period TEXT DEFAULT 'monthly', -- daily, weekly, monthly, yearly
    last_reset TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource_type)
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ends_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    page_path TEXT,
    user_agent TEXT,
    ip_address INET,
    metadata JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'page_load', 'api_response', 'component_render'
    metric_value NUMERIC NOT NULL, -- in milliseconds
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    feedback_type TEXT NOT NULL, -- 'bug_report', 'feature_request', 'general'
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    page_path TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON feature_flags(flag_name);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_resource_type ON usage_tracking(resource_type);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs(resolved);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_path ON performance_metrics(page_path);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON performance_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_feedback_type ON user_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);

-- Row Level Security (RLS) Policies

-- Analytics Events RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own analytics" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Audit Logs RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Feature Flags RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read feature flags" ON feature_flags
    FOR SELECT USING (true);
CREATE POLICY "Only admins can modify feature flags" ON feature_flags
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Usage Tracking RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own usage" ON usage_tracking
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own usage" ON usage_tracking
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can insert usage" ON usage_tracking
    FOR INSERT WITH CHECK (true);

-- Subscriptions RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage subscriptions" ON subscriptions
    FOR ALL WITH CHECK (true);

-- Error Logs RLS
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own errors" ON error_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert errors" ON error_logs
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage all errors" ON error_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Performance Metrics RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own metrics" ON performance_metrics
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert metrics" ON performance_metrics
    FOR INSERT WITH CHECK (true);

-- User Feedback RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all feedback" ON user_feedback
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial feature flags
INSERT INTO feature_flags (flag_name, is_enabled, rollout_percentage, description) VALUES
('will_generation', true, 100, 'Will generation wizard'),
('document_management', true, 50, 'Document management system'),
('emergency_contacts', true, 100, 'Emergency contacts feature'),
('health_monitoring', false, 0, 'Health monitoring dashboard'),
('financial_tracking', false, 0, 'Financial asset tracking'),
('sofia_ai', false, 10, 'Sofia AI assistant'),
('family_sharing', false, 0, 'Family document sharing'),
('advisor_network', false, 0, 'Professional advisor network'),
('video_messages', false, 0, 'Video message functionality'),
('admin_dashboard', true, 100, 'Admin dashboard access')
ON CONFLICT (flag_name) DO NOTHING;

-- Create functions for analytics aggregations
CREATE OR REPLACE FUNCTION get_daily_active_users(days_back INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, user_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as user_count
    FROM analytics_events
    WHERE timestamp >= (CURRENT_DATE - INTERVAL '%s days', days_back)
    AND user_id IS NOT NULL
    GROUP BY DATE(timestamp)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_feature_adoption()
RETURNS TABLE(feature_name TEXT, user_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        event_action as feature_name,
        COUNT(DISTINCT user_id) as user_count
    FROM analytics_events
    WHERE event_type = 'feature_used'
    AND timestamp >= (CURRENT_DATE - INTERVAL '30 days')
    AND user_id IS NOT NULL
    GROUP BY event_action
    ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_error_rate_24h()
RETURNS NUMERIC AS $$
DECLARE
    total_events BIGINT;
    error_events BIGINT;
BEGIN
    SELECT COUNT(*) INTO total_events
    FROM analytics_events
    WHERE timestamp >= (NOW() - INTERVAL '24 hours');

    SELECT COUNT(*) INTO error_events
    FROM error_logs
    WHERE timestamp >= (NOW() - INTERVAL '24 hours');

    IF total_events = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((error_events::NUMERIC / total_events::NUMERIC) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_feedback_updated_at
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE analytics_events IS 'Stores user interaction events for analytics';
COMMENT ON TABLE audit_logs IS 'Stores audit trail of all user actions';
COMMENT ON TABLE feature_flags IS 'Feature flag management for controlled rollouts';
COMMENT ON TABLE usage_tracking IS 'Tracks user resource usage against limits';
COMMENT ON TABLE subscriptions IS 'User subscription and plan information';
COMMENT ON TABLE error_logs IS 'Application error logging and tracking';
COMMENT ON TABLE performance_metrics IS 'Page load and performance metrics';
COMMENT ON TABLE user_feedback IS 'User feedback and support requests';