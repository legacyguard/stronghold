-- Phase 6: Advanced User Support System
-- Support tables for AI-powered user assistance

-- =====================================================
-- SUPPORT ARTICLES TABLE (Knowledge Base)
-- =====================================================

CREATE TABLE IF NOT EXISTS support_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'getting_started',
    'account_security',
    'will_generator',
    'document_management',
    'family_sharing',
    'legal_compliance',
    'billing_subscription',
    'technical_support',
    'privacy_data',
    'emergency_access'
  )),
  subcategory TEXT,

  -- Targeting and filtering
  jurisdiction TEXT CHECK (jurisdiction IN ('SK', 'CZ', 'universal')),
  user_tier TEXT[] DEFAULT ARRAY['free', 'premium', 'enterprise'],
  difficulty_level INTEGER NOT NULL DEFAULT 2 CHECK (difficulty_level BETWEEN 1 AND 5),

  -- AI Enhancement
  keywords TEXT[] NOT NULL DEFAULT '{}',
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  effectiveness_score DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (effectiveness_score BETWEEN 0 AND 1),
  view_count INTEGER NOT NULL DEFAULT 0,
  helpful_votes INTEGER NOT NULL DEFAULT 0,
  unhelpful_votes INTEGER NOT NULL DEFAULT 0,

  -- SEO and Discovery
  meta_description TEXT,
  slug TEXT UNIQUE NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT false,

  -- Content Management
  author_id UUID REFERENCES user_profiles(id),
  reviewer_id UUID REFERENCES user_profiles(id),
  version INTEGER NOT NULL DEFAULT 1,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for support_articles
ALTER TABLE support_articles ENABLE ROW LEVEL SECURITY;

-- Public read access for published articles
CREATE POLICY "Published articles are publicly readable" ON support_articles
  FOR SELECT USING (published = true);

-- Authors can manage their own articles
CREATE POLICY "Authors can manage own articles" ON support_articles
  FOR ALL USING (auth.uid() = author_id);

-- =====================================================
-- SUPPORT TICKETS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Classification
  category TEXT NOT NULL DEFAULT 'technical' CHECK (category IN ('technical', 'legal', 'billing', 'feature_request')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),

  -- AI Analysis
  sentiment_score DECIMAL(3,2) CHECK (sentiment_score BETWEEN 0 AND 1),
  complexity_score DECIMAL(3,2) CHECK (complexity_score BETWEEN 0 AND 1),
  ai_responses_count INTEGER NOT NULL DEFAULT 0,
  escalated_reason TEXT,

  -- Resolution tracking
  assigned_agent_id UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_time_minutes INTEGER,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
  resolution_notes TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tickets" ON support_tickets
  FOR ALL USING (auth.uid() = user_id);

-- Support agents can view all tickets (would be refined with agent roles)
CREATE POLICY "Support agents can view all tickets" ON support_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND (
        -- Add agent role check here when implemented
        email LIKE '%@legacyguard.%'
        OR subscription_tier = 'enterprise' -- Temporary for testing
      )
    )
  );

-- =====================================================
-- SUPPORT INTERACTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS support_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES sofia_conversations(id) ON DELETE SET NULL,

  -- Message details
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'ai', 'agent', 'system')),
  content TEXT NOT NULL,

  -- AI metadata
  confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
  response_time_ms INTEGER DEFAULT 0,
  knowledge_source TEXT CHECK (knowledge_source IN ('rule_based', 'knowledge_base', 'ai_generated')),
  tokens_used INTEGER DEFAULT 0,

  -- Attachments and actions
  attachments JSONB DEFAULT '[]',
  actions_taken JSONB DEFAULT '[]',

  -- Agent info (for human responses)
  agent_id UUID REFERENCES user_profiles(id),

  -- Feedback
  user_feedback TEXT,
  helpful_rating INTEGER CHECK (helpful_rating BETWEEN 1 AND 5),

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for support_interactions
ALTER TABLE support_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ticket interactions" ON support_interactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_interactions.ticket_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own ticket interactions" ON support_interactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_tickets
      WHERE id = support_interactions.ticket_id
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- USER SUPPORT HEALTH TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS user_support_health (
  user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Health metrics
  onboarding_completion DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (onboarding_completion BETWEEN 0 AND 1),
  feature_adoption_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (feature_adoption_score BETWEEN 0 AND 1),
  support_sentiment_avg DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (support_sentiment_avg BETWEEN 0 AND 1),

  -- Support statistics
  tickets_created INTEGER NOT NULL DEFAULT 0,
  ai_resolution_rate DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (ai_resolution_rate BETWEEN 0 AND 1),
  avg_resolution_time_hours DECIMAL(5,2) DEFAULT 0,
  satisfaction_score_avg DECIMAL(3,2) CHECK (satisfaction_score_avg BETWEEN 0 AND 1),

  -- Risk assessment
  churn_risk_score DECIMAL(3,2) NOT NULL DEFAULT 0 CHECK (churn_risk_score BETWEEN 0 AND 1),
  last_positive_interaction TIMESTAMP WITH TIME ZONE,
  intervention_needed BOOLEAN NOT NULL DEFAULT false,
  intervention_type TEXT,

  -- Activity tracking
  last_help_center_visit TIMESTAMP WITH TIME ZONE,
  help_articles_viewed INTEGER NOT NULL DEFAULT 0,
  search_queries_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for user_support_health
ALTER TABLE user_support_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own support health" ON user_support_health
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own support health" ON user_support_health
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert support health" ON user_support_health
  FOR INSERT WITH CHECK (true); -- Allow system inserts

-- =====================================================
-- SUPPORT SEARCH LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS support_search_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Search details
  query TEXT NOT NULL,
  results_count INTEGER NOT NULL DEFAULT 0,
  selected_result_id UUID REFERENCES support_articles(id),

  -- Context
  search_context JSONB DEFAULT '{}', -- user tier, page, etc.
  filters_applied JSONB DEFAULT '{}',

  -- Outcome
  found_answer BOOLEAN,
  created_ticket BOOLEAN DEFAULT false,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- RLS for support_search_log
ALTER TABLE support_search_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history" ON support_search_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can log searches" ON support_search_log
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Support articles indexes
CREATE INDEX IF NOT EXISTS idx_support_articles_category ON support_articles(category);
CREATE INDEX IF NOT EXISTS idx_support_articles_jurisdiction ON support_articles(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_support_articles_published ON support_articles(published, effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_support_articles_featured ON support_articles(featured, view_count DESC);
CREATE INDEX IF NOT EXISTS idx_support_articles_slug ON support_articles(slug);
CREATE INDEX IF NOT EXISTS idx_support_articles_keywords ON support_articles USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_support_articles_search ON support_articles USING GIN(to_tsvector('english', title || ' ' || content));

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_agent ON support_tickets(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);

-- Support interactions indexes
CREATE INDEX IF NOT EXISTS idx_support_interactions_ticket_id ON support_interactions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_interactions_conversation_id ON support_interactions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_interactions_created_at ON support_interactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_interactions_message_type ON support_interactions(message_type);

-- Search log indexes
CREATE INDEX IF NOT EXISTS idx_support_search_log_user_id ON support_search_log(user_id);
CREATE INDEX IF NOT EXISTS idx_support_search_log_created_at ON support_search_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_search_log_query ON support_search_log USING GIN(to_tsvector('english', query));

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to increment article view count
CREATE OR REPLACE FUNCTION increment_view_count(article_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE support_articles
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment article votes
CREATE OR REPLACE FUNCTION increment_vote(article_uuid UUID, vote_type TEXT)
RETURNS void AS $$
BEGIN
  IF vote_type = 'helpful_votes' THEN
    UPDATE support_articles
    SET helpful_votes = helpful_votes + 1,
        updated_at = NOW()
    WHERE id = article_uuid;
  ELSIF vote_type = 'unhelpful_votes' THEN
    UPDATE support_articles
    SET unhelpful_votes = unhelpful_votes + 1,
        updated_at = NOW()
    WHERE id = article_uuid;
  END IF;

  -- Recalculate effectiveness score
  PERFORM update_effectiveness_score(article_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update article effectiveness score
CREATE OR REPLACE FUNCTION update_effectiveness_score(article_uuid UUID)
RETURNS void AS $$
DECLARE
  total_votes INTEGER;
  helpful_ratio DECIMAL;
  view_factor DECIMAL;
  new_score DECIMAL;
BEGIN
  SELECT
    helpful_votes + unhelpful_votes,
    CASE
      WHEN (helpful_votes + unhelpful_votes) > 0
      THEN helpful_votes::DECIMAL / (helpful_votes + unhelpful_votes)
      ELSE 0.5
    END,
    LEAST(view_count::DECIMAL / 100, 1.0) -- View factor caps at 100 views
  INTO total_votes, helpful_ratio, view_factor
  FROM support_articles
  WHERE id = article_uuid;

  -- Calculate weighted effectiveness score
  -- Base: helpful ratio (0-1)
  -- Boost: view factor (0-1) with 10% weight
  -- Minimum votes needed: 5 for reliable score
  IF total_votes >= 5 THEN
    new_score = (helpful_ratio * 0.9) + (view_factor * 0.1);
  ELSE
    -- Keep default score until enough votes
    new_score = 0.5;
  END IF;

  UPDATE support_articles
  SET effectiveness_score = new_score,
      updated_at = NOW()
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-resolve tickets after interaction
CREATE OR REPLACE FUNCTION check_ticket_auto_resolution()
RETURNS TRIGGER AS $$
DECLARE
  recent_interactions INTEGER;
  ticket_age_hours INTEGER;
BEGIN
  -- Check if this is an AI interaction with high confidence
  IF NEW.message_type = 'ai' AND NEW.confidence_score >= 0.8 THEN

    -- Count recent interactions on this ticket
    SELECT COUNT(*) INTO recent_interactions
    FROM support_interactions
    WHERE ticket_id = NEW.ticket_id
    AND created_at > NOW() - INTERVAL '24 hours';

    -- Get ticket age in hours
    SELECT EXTRACT(EPOCH FROM (NOW() - created_at))/3600 INTO ticket_age_hours
    FROM support_tickets
    WHERE id = NEW.ticket_id;

    -- Auto-resolve if high confidence AI response and no recent activity
    IF recent_interactions <= 2 AND ticket_age_hours <= 72 THEN
      UPDATE support_tickets
      SET status = 'resolved',
          resolved_at = NOW(),
          resolution_time_minutes = ticket_age_hours * 60,
          resolution_notes = 'Auto-resolved by AI with high confidence response'
      WHERE id = NEW.ticket_id
      AND status = 'open';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-resolution
CREATE TRIGGER support_interaction_auto_resolve
  AFTER INSERT ON support_interactions
  FOR EACH ROW
  EXECUTE FUNCTION check_ticket_auto_resolution();

-- Function to initialize user support health
CREATE OR REPLACE FUNCTION initialize_user_support_health()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_support_health (
    user_id,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NOW(),
    NOW()
  ) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to initialize support health for new users
CREATE TRIGGER on_user_profile_support_health
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_support_health();

-- Update triggers for timestamps
CREATE TRIGGER update_support_articles_updated_at
  BEFORE UPDATE ON support_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_support_health_updated_at
  BEFORE UPDATE ON user_support_health
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL SUPPORT CONTENT
-- =====================================================

-- Insert initial support articles (will be populated by knowledge base manager)
-- This will be done programmatically via the application

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- Support analytics view
CREATE OR REPLACE VIEW support_analytics AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
  COUNT(*) FILTER (WHERE category = 'technical') as technical_tickets,
  COUNT(*) FILTER (WHERE category = 'legal') as legal_tickets,
  COUNT(*) FILTER (WHERE category = 'billing') as billing_tickets,
  AVG(resolution_time_minutes) as avg_resolution_time,
  AVG(satisfaction_rating) as avg_satisfaction
FROM support_tickets
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Article performance view
CREATE OR REPLACE VIEW article_performance AS
SELECT
  id,
  title,
  category,
  view_count,
  helpful_votes,
  unhelpful_votes,
  effectiveness_score,
  CASE
    WHEN (helpful_votes + unhelpful_votes) > 0
    THEN helpful_votes::DECIMAL / (helpful_votes + unhelpful_votes)
    ELSE 0
  END as helpfulness_ratio,
  created_at,
  updated_at
FROM support_articles
WHERE published = true
ORDER BY effectiveness_score DESC, view_count DESC;

-- User support health summary
CREATE OR REPLACE VIEW user_support_summary AS
SELECT
  up.id as user_id,
  up.email,
  up.subscription_tier,
  ush.onboarding_completion,
  ush.feature_adoption_score,
  ush.support_sentiment_avg,
  ush.tickets_created,
  ush.churn_risk_score,
  ush.intervention_needed,
  ush.last_positive_interaction
FROM user_profiles up
LEFT JOIN user_support_health ush ON up.id = ush.user_id;

-- Grant permissions for views
GRANT SELECT ON support_analytics TO authenticated;
GRANT SELECT ON article_performance TO authenticated;
GRANT SELECT ON user_support_summary TO authenticated;