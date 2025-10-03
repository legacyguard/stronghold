-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('page_view', 'feature_usage', 'user_action', 'error', 'performance')),
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(type, timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- User Feedback Table
CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  feedback TEXT,
  page TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user feedback
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);

-- Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
  target_users JSONB DEFAULT '[]', -- Array of user IDs for targeted rollout
  conditions JSONB DEFAULT '{}', -- Additional conditions
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics Snapshots Table (for aggregated daily/weekly stats)
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, metric_type, metric_name)
);

-- Index for metrics snapshots
CREATE INDEX IF NOT EXISTS idx_metrics_snapshots_date_type ON metrics_snapshots(date, metric_type);

-- Subscriptions Table (for real revenue tracking)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium', 'family')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'trial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  billing_interval TEXT DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan ON subscriptions(plan);

-- Usage Tracking Table (for plan limits)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'wills', 'documents', 'emergency_contacts', 'storage_gb'
  current_usage INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  reset_date DATE, -- for monthly resets if needed
  UNIQUE(user_id, resource_type)
);

-- Index for usage tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_resource ON usage_tracking(user_id, resource_type);

-- Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Analytics events: Users can only see their own events
CREATE POLICY "Users can insert their own analytics events" ON analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own analytics events" ON analytics_events
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Admin users can see all analytics (you'll need to add admin role)
-- CREATE POLICY "Admins can view all analytics events" ON analytics_events
--   FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Audit logs: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- User feedback: Users can manage their own feedback
CREATE POLICY "Users can insert their own feedback" ON user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback" ON user_feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Feature flags: Everyone can read (for client-side flags)
CREATE POLICY "Anyone can read feature flags" ON feature_flags
  FOR SELECT USING (true);

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Usage tracking: Users can view their own usage
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, is_enabled, rollout_percentage) VALUES
  ('will_generation', true, 100),
  ('document_management', true, 100),
  ('emergency_contacts', true, 100),
  ('health_monitoring', false, 0),
  ('financial_tracking', false, 0),
  ('sofia_ai', false, 10),
  ('family_sharing', false, 0),
  ('advisor_network', false, 0),
  ('video_messages', false, 0),
  ('admin_dashboard', false, 0)
ON CONFLICT (flag_name) DO NOTHING;

-- Create function for daily metrics aggregation
CREATE OR REPLACE FUNCTION aggregate_daily_metrics(target_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void AS $$
BEGIN
  -- Daily Active Users
  INSERT INTO metrics_snapshots (date, metric_type, metric_name, value)
  SELECT
    target_date,
    'user_engagement',
    'daily_active_users',
    COUNT(DISTINCT user_id)
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
    AND user_id IS NOT NULL
  ON CONFLICT (date, metric_type, metric_name)
  DO UPDATE SET value = EXCLUDED.value;

  -- Page Views
  INSERT INTO metrics_snapshots (date, metric_type, metric_name, value)
  SELECT
    target_date,
    'user_engagement',
    'page_views',
    COUNT(*)
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
    AND type = 'page_view'
  ON CONFLICT (date, metric_type, metric_name)
  DO UPDATE SET value = EXCLUDED.value;

  -- Error Rate
  INSERT INTO metrics_snapshots (date, metric_type, metric_name, value)
  SELECT
    target_date,
    'system_health',
    'error_rate',
    ROUND(
      (COUNT(*) FILTER (WHERE type = 'error')::decimal /
       NULLIF(COUNT(*), 0) * 100), 2
    )
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
  ON CONFLICT (date, metric_type, metric_name)
  DO UPDATE SET value = EXCLUDED.value;

  -- Feature Usage
  INSERT INTO metrics_snapshots (date, metric_type, metric_name, value, metadata)
  SELECT
    target_date,
    'feature_usage',
    action,
    COUNT(DISTINCT user_id),
    jsonb_build_object('total_events', COUNT(*))
  FROM analytics_events
  WHERE DATE(timestamp) = target_date
    AND type = 'feature_usage'
    AND user_id IS NOT NULL
  GROUP BY action
  ON CONFLICT (date, metric_type, metric_name)
  DO UPDATE SET
    value = EXCLUDED.value,
    metadata = EXCLUDED.metadata;

END;
$$ LANGUAGE plpgsql;

-- Create function to clean old analytics data (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_analytics(retention_days INTEGER DEFAULT 365)
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  DELETE FROM audit_logs
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;

  -- Keep metrics snapshots longer
  DELETE FROM metrics_snapshots
  WHERE date < CURRENT_DATE - (retention_days * 2 || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;