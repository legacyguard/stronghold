-- Cost Monitoring Tables
-- Add tables for tracking AI costs and optimization

-- Cost events table
CREATE TABLE public.cost_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature text NOT NULL,
    operation text NOT NULL,
    cost decimal(10,4) NOT NULL DEFAULT 0,
    tier text NOT NULL CHECK (tier IN ('free', 'smart', 'premium')),
    timestamp timestamptz DEFAULT now() NOT NULL,
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Cost alerts table
CREATE TABLE public.cost_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('approaching_limit', 'limit_exceeded', 'unusual_usage')),
    message text NOT NULL,
    threshold decimal(10,4) NOT NULL,
    current decimal(10,4) NOT NULL,
    acknowledged boolean DEFAULT false,
    timestamp timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- User cost limits table
CREATE TABLE public.user_cost_limits (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    daily_limit decimal(10,4) DEFAULT 1.0 NOT NULL,
    monthly_limit decimal(10,4) DEFAULT 20.0 NOT NULL,
    feature_limits jsonb DEFAULT '{}',
    auto_upgrade boolean DEFAULT false,
    updated_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Will templates table
CREATE TABLE public.will_templates (
    id text PRIMARY KEY,
    jurisdiction text NOT NULL CHECK (jurisdiction IN ('SK', 'CZ', 'EU')),
    scenario text NOT NULL CHECK (scenario IN ('single', 'married', 'children', 'business', 'complex')),
    title text NOT NULL,
    description text,
    template text NOT NULL,
    variables jsonb NOT NULL DEFAULT '[]',
    ai_enhancements jsonb DEFAULT '[]',
    estimated_time integer DEFAULT 15,
    cost_tier text NOT NULL CHECK (cost_tier IN ('free', 'smart', 'premium')),
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- User wills table
CREATE TABLE public.user_wills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    template_id text REFERENCES public.will_templates(id),
    title text NOT NULL,
    variables jsonb NOT NULL DEFAULT '{}',
    personal_info jsonb NOT NULL DEFAULT '{}',
    assets jsonb DEFAULT '[]',
    beneficiaries jsonb DEFAULT '[]',
    guardians jsonb DEFAULT '[]',
    executors jsonb DEFAULT '[]',
    special_instructions text,
    status text DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'completed', 'signed')),
    ai_reviewed boolean DEFAULT false,
    ai_review_data jsonb,
    generated_document text,
    pdf_url text,
    cost_spent decimal(10,4) DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Sofia interactions table
CREATE TABLE public.sofia_interactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    command_type text NOT NULL CHECK (command_type IN ('free', 'smart', 'premium')),
    action text NOT NULL,
    query text,
    response text,
    cost decimal(10,4) DEFAULT 0,
    cached boolean DEFAULT false,
    response_time_ms integer,
    user_satisfaction integer CHECK (user_satisfaction BETWEEN 1 AND 5),
    created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_cost_events_user_id ON public.cost_events(user_id);
CREATE INDEX idx_cost_events_timestamp ON public.cost_events(timestamp);
CREATE INDEX idx_cost_events_user_date ON public.cost_events(user_id, date_trunc('day', timestamp));

CREATE INDEX idx_cost_alerts_user_id ON public.cost_alerts(user_id);
CREATE INDEX idx_cost_alerts_acknowledged ON public.cost_alerts(acknowledged) WHERE acknowledged = false;

CREATE INDEX idx_user_wills_user_id ON public.user_wills(user_id);
CREATE INDEX idx_user_wills_status ON public.user_wills(status);

CREATE INDEX idx_sofia_interactions_user_id ON public.sofia_interactions(user_id);
CREATE INDEX idx_sofia_interactions_created_at ON public.sofia_interactions(created_at);

-- Row Level Security (RLS)
ALTER TABLE public.cost_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_cost_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.will_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sofia_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Cost events: users can only see their own
CREATE POLICY "Users can view their own cost events" ON public.cost_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cost events" ON public.cost_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Cost alerts: users can only see their own
CREATE POLICY "Users can view their own cost alerts" ON public.cost_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost alerts" ON public.cost_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- User cost limits: users can manage their own
CREATE POLICY "Users can view their own cost limits" ON public.user_cost_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own cost limits" ON public.user_cost_limits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cost limits" ON public.user_cost_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Will templates: public read access
CREATE POLICY "Will templates are publicly readable" ON public.will_templates
    FOR SELECT USING (active = true);

-- User wills: users can only access their own
CREATE POLICY "Users can view their own wills" ON public.user_wills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wills" ON public.user_wills
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wills" ON public.user_wills
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wills" ON public.user_wills
    FOR DELETE USING (auth.uid() = user_id);

-- Sofia interactions: users can only see their own
CREATE POLICY "Users can view their own sofia interactions" ON public.sofia_interactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sofia interactions" ON public.sofia_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert default will templates
INSERT INTO public.will_templates (id, jurisdiction, scenario, title, description, template, variables, estimated_time, cost_tier) VALUES
('simple_single_sk', 'SK', 'single', 'Jednoduchý závet pre slobodných', 'Základný závet pre nezdaných bez detí. Ideálny pre mladých dospelých s minimálnym majetkom.', 'ZÁVET\n\nJa, {{fullName}}, rodený/á {{birthDate}} v {{birthPlace}}...', '[]', 15, 'free'),
('family_with_children_sk', 'SK', 'children', 'Závet pre rodičov s deťmi', 'Komplexnejší závet pre rodičov, ktorý rieši opateru maloletých detí a rozdelenie majetku.', 'ZÁVET\n\nJa, {{fullName}}, rodený/á {{birthDate}}...', '[]', 30, 'free'),
('business_owner_sk', 'SK', 'business', 'Závet pre podnikateľov', 'Špecializovaný závet pre majiteľov firiem a podnikateľov s komplexnejším majetkom.', 'ZÁVET PODNIKATEĽA\n\n[Komplexná šablóna]...', '[]', 45, 'smart');

-- Functions for cost calculation
CREATE OR REPLACE FUNCTION get_user_daily_cost(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS decimal(10,4)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(SUM(cost), 0)
    FROM public.cost_events
    WHERE user_id = p_user_id
    AND date_trunc('day', timestamp) = p_date;
$$;

CREATE OR REPLACE FUNCTION get_user_monthly_cost(p_user_id uuid, p_year integer DEFAULT EXTRACT(year FROM CURRENT_DATE), p_month integer DEFAULT EXTRACT(month FROM CURRENT_DATE))
RETURNS decimal(10,4)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(SUM(cost), 0)
    FROM public.cost_events
    WHERE user_id = p_user_id
    AND EXTRACT(year FROM timestamp) = p_year
    AND EXTRACT(month FROM timestamp) = p_month;
$$;

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_cost_limits_updated_at BEFORE UPDATE ON public.user_cost_limits FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_will_templates_updated_at BEFORE UPDATE ON public.will_templates FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_wills_updated_at BEFORE UPDATE ON public.user_wills FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();