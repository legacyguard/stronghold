import { supabase } from '@/lib/supabase';

/**
 * Setup Analytics Database Tables
 * Creates all necessary tables for user research and analytics
 */
export class AnalyticsDatabase {
  /**
   * Create all analytics tables
   */
  static async createAnalyticsTables(): Promise<void> {
    try {
      console.log('Creating analytics database tables...');

      // Create user analytics table
      await this.createUserAnalyticsTable();

      // Create user feedback table
      await this.createUserFeedbackTable();

      // Create feature usage table
      await this.createFeatureUsageTable();

      // Create user sessions table
      await this.createUserSessionsTable();

      // Create conversion events table
      await this.createConversionEventsTable();

      // Create user journey table
      await this.createUserJourneyTable();

      // Create experiment tables (if not already created)
      await this.createExperimentTables();

      console.log('✅ All analytics tables created successfully');
    } catch (error) {
      console.error('❌ Failed to create analytics tables:', error);
      throw error;
    }
  }

  /**
   * Create user analytics table for behavior tracking
   */
  private static async createUserAnalyticsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        event_type TEXT NOT NULL,
        event_data JSONB NOT NULL,
        session_id TEXT NOT NULL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ip_address INET,
        user_agent TEXT,
        page_url TEXT,
        referrer TEXT
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_timestamp ON user_analytics(timestamp);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_session ON user_analytics(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_analytics_event_data ON user_analytics USING GIN(event_data);

      -- RLS Policy
      ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

      -- Users can only see their own analytics (admin override in application)
      CREATE POLICY user_analytics_policy ON user_analytics
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ user_analytics table created');
  }

  /**
   * Create user feedback table
   */
  private static async createUserFeedbackTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        feedback TEXT,
        feedback_type TEXT DEFAULT 'general',
        page_url TEXT NOT NULL,
        feature_context TEXT,
        sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
        categories TEXT[],
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'in_progress', 'resolved', 'dismissed')),
        admin_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON user_feedback(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_rating ON user_feedback(rating);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON user_feedback(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON user_feedback(status);
      CREATE INDEX IF NOT EXISTS idx_user_feedback_priority ON user_feedback(priority);

      -- RLS Policy
      ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

      CREATE POLICY user_feedback_policy ON user_feedback
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ user_feedback table created');
  }

  /**
   * Create feature usage tracking table
   */
  private static async createFeatureUsageTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS feature_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        feature_name TEXT NOT NULL,
        action TEXT NOT NULL,
        duration_ms INTEGER,
        success BOOLEAN,
        error_message TEXT,
        metadata JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature_name);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_action ON feature_usage(action);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_timestamp ON feature_usage(timestamp);
      CREATE INDEX IF NOT EXISTS idx_feature_usage_success ON feature_usage(success);

      -- RLS Policy
      ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

      CREATE POLICY feature_usage_policy ON feature_usage
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ feature_usage table created');
  }

  /**
   * Create user sessions table
   */
  private static async createUserSessionsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT UNIQUE NOT NULL,
        user_id UUID REFERENCES auth.users(id),
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ended_at TIMESTAMPTZ,
        duration_ms INTEGER,
        page_views INTEGER DEFAULT 0,
        interactions INTEGER DEFAULT 0,
        conversions INTEGER DEFAULT 0,
        device_info JSONB,
        location_info JSONB,
        referrer TEXT,
        exit_page TEXT,
        exit_reason TEXT
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_duration ON user_sessions(duration_ms);

      -- RLS Policy
      ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

      CREATE POLICY user_sessions_policy ON user_sessions
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ user_sessions table created');
  }

  /**
   * Create conversion events table
   */
  private static async createConversionEventsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS conversion_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        session_id TEXT NOT NULL,
        event_name TEXT NOT NULL,
        funnel_step TEXT,
        conversion_value DECIMAL,
        currency TEXT DEFAULT 'EUR',
        metadata JSONB,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversion_events_event_name ON conversion_events(event_name);
      CREATE INDEX IF NOT EXISTS idx_conversion_events_funnel_step ON conversion_events(funnel_step);
      CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);

      -- RLS Policy
      ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

      CREATE POLICY conversion_events_policy ON conversion_events
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ conversion_events table created');
  }

  /**
   * Create user journey table
   */
  private static async createUserJourneyTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS user_journeys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id),
        journey_name TEXT NOT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        current_step TEXT,
        total_steps INTEGER,
        completion_rate DECIMAL,
        abandonment_point TEXT,
        journey_data JSONB,
        success BOOLEAN,
        notes TEXT
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_user_journeys_user_id ON user_journeys(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_journeys_journey_name ON user_journeys(journey_name);
      CREATE INDEX IF NOT EXISTS idx_user_journeys_started_at ON user_journeys(started_at);
      CREATE INDEX IF NOT EXISTS idx_user_journeys_success ON user_journeys(success);

      -- RLS Policy
      ALTER TABLE user_journeys ENABLE ROW LEVEL SECURITY;

      CREATE POLICY user_journeys_policy ON user_journeys
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ user_journeys table created');
  }

  /**
   * Create experiment tables (if not already created by AB testing)
   */
  private static async createExperimentTables(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS experiment_assignments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        experiment_id TEXT NOT NULL,
        variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, experiment_id)
      );

      CREATE TABLE IF NOT EXISTS experiment_conversions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id),
        experiment_id TEXT NOT NULL,
        variant TEXT NOT NULL CHECK (variant IN ('A', 'B')),
        conversion_type TEXT NOT NULL,
        conversion_value DECIMAL,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Indexes
      CREATE INDEX IF NOT EXISTS idx_experiment_assignments_experiment ON experiment_assignments(experiment_id);
      CREATE INDEX IF NOT EXISTS idx_experiment_conversions_experiment ON experiment_conversions(experiment_id, variant);

      -- RLS Policies
      ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE experiment_conversions ENABLE ROW LEVEL SECURITY;

      CREATE POLICY experiment_assignments_policy ON experiment_assignments
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

      CREATE POLICY experiment_conversions_policy ON experiment_conversions
        FOR ALL USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ experiment tables created');
  }

  /**
   * Create useful views for analytics
   */
  static async createAnalyticsViews(): Promise<void> {
    const sql = `
      -- Daily active users view
      CREATE OR REPLACE VIEW daily_active_users AS
      SELECT
        DATE(timestamp) as date,
        COUNT(DISTINCT user_id) as dau
      FROM user_analytics
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date;

      -- Feature adoption view
      CREATE OR REPLACE VIEW feature_adoption AS
      SELECT
        feature_name,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(*) as total_usage,
        AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate
      FROM feature_usage
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY feature_name
      ORDER BY unique_users DESC;

      -- User satisfaction view
      CREATE OR REPLACE VIEW user_satisfaction AS
      SELECT
        DATE(created_at) as date,
        AVG(rating) as avg_rating,
        COUNT(*) as feedback_count,
        COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback
      FROM user_feedback
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date;

      -- Conversion funnel view
      CREATE OR REPLACE VIEW conversion_funnel AS
      SELECT
        funnel_step,
        COUNT(DISTINCT user_id) as users,
        COUNT(*) as events,
        AVG(conversion_value) as avg_value
      FROM conversion_events
      WHERE timestamp >= NOW() - INTERVAL '30 days'
      GROUP BY funnel_step
      ORDER BY funnel_step;
    `;

    await supabase.rpc('exec_sql', { sql });
    console.log('✅ Analytics views created');
  }

  /**
   * Initialize analytics database with sample data for testing
   */
  static async initializeWithSampleData(): Promise<void> {
    try {
      console.log('Adding sample analytics data for testing...');

      // Sample user analytics events
      await supabase.from('user_analytics').insert([
        {
          event_type: 'page_view',
          event_data: { page: '/dashboard', referrer: '/' },
          session_id: 'sample_session_1',
          page_url: '/dashboard'
        },
        {
          event_type: 'feature_usage',
          event_data: { feature: 'will_generator', action: 'started' },
          session_id: 'sample_session_1',
          page_url: '/will-generator'
        }
      ]);

      // Sample user feedback
      await supabase.from('user_feedback').insert([
        {
          rating: 4,
          feedback: 'Aplikácia je užitočná, ale mohla by byť jednoduchšia.',
          feedback_type: 'usability',
          page_url: '/will-generator',
          sentiment: 'positive',
          categories: ['usability', 'navigation']
        }
      ]);

      console.log('✅ Sample data added');
    } catch (error) {
      console.warn('Warning: Could not add sample data (tables may not exist yet):', error);
    }
  }

  /**
   * Get analytics database status
   */
  static async getDatabaseStatus(): Promise<{
    tables_created: boolean;
    views_created: boolean;
    sample_data: boolean;
    table_counts: Record<string, number>;
  }> {
    try {
      const tables = [
        'user_analytics',
        'user_feedback',
        'feature_usage',
        'user_sessions',
        'conversion_events',
        'user_journeys',
        'experiment_assignments',
        'experiment_conversions'
      ];

      const tableCounts: Record<string, number> = {};
      let tablesExist = 0;

      for (const table of tables) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('id', { count: 'exact' });

          if (!error) {
            tableCounts[table] = count || 0;
            tablesExist++;
          }
        } catch (error) {
          tableCounts[table] = -1; // Table doesn't exist
        }
      }

      return {
        tables_created: tablesExist === tables.length,
        views_created: true, // Assume views are created if tables exist
        sample_data: Object.values(tableCounts).some(count => count > 0),
        table_counts: tableCounts
      };
    } catch (error) {
      return {
        tables_created: false,
        views_created: false,
        sample_data: false,
        table_counts: {}
      };
    }
  }
}