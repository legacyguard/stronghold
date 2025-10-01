-- Migration for Phase 3 Part B: Emotional Core Features
-- Creates tables for Time Capsules, User Milestones, and Progress Tracking

-- Time Capsules Table
CREATE TABLE IF NOT EXISTS public.time_capsules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    message_type text CHECK (message_type IN ('text', 'audio', 'video')) DEFAULT 'text' NOT NULL,
    file_url text, -- For audio/video files stored in Supabase Storage
    delivery_date date NOT NULL,
    recipient_email text,
    recipient_name text,
    is_delivered boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Constraints
    CONSTRAINT future_delivery_date CHECK (delivery_date > CURRENT_DATE),
    CONSTRAINT valid_email CHECK (recipient_email IS NULL OR recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- User Milestones Table
CREATE TABLE IF NOT EXISTS public.user_milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    milestone_type text NOT NULL,
    milestone_title text NOT NULL,
    milestone_description text,
    is_achieved boolean DEFAULT false NOT NULL,
    achieved_at timestamp with time zone,
    points_awarded integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Prevent duplicate milestones per user
    UNIQUE(user_id, milestone_type)
);

-- User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_points integer DEFAULT 0 NOT NULL,
    documents_uploaded integer DEFAULT 0 NOT NULL,
    time_capsules_created integer DEFAULT 0 NOT NULL,
    milestones_achieved integer DEFAULT 0 NOT NULL,
    current_streak_days integer DEFAULT 0 NOT NULL,
    longest_streak_days integer DEFAULT 0 NOT NULL,
    last_activity_date date DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Legacy Garden Nodes Table (for visual progress tracking)
CREATE TABLE IF NOT EXISTS public.legacy_garden_nodes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    node_type text CHECK (node_type IN ('tree', 'flower', 'milestone_marker', 'memory_stone')) NOT NULL,
    x_position integer NOT NULL,
    y_position integer NOT NULL,
    growth_stage integer DEFAULT 1 CHECK (growth_stage BETWEEN 1 AND 5) NOT NULL,
    is_unlocked boolean DEFAULT false NOT NULL,
    unlocked_at timestamp with time zone,
    associated_milestone_id uuid REFERENCES public.user_milestones(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,

    -- Prevent overlapping nodes
    UNIQUE(user_id, x_position, y_position)
);

-- Enable Row Level Security
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_garden_nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Time Capsules
CREATE POLICY "Users can view their own time capsules" ON public.time_capsules
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time capsules" ON public.time_capsules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time capsules" ON public.time_capsules
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time capsules" ON public.time_capsules
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for User Milestones
CREATE POLICY "Users can view their own milestones" ON public.user_milestones
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own milestones" ON public.user_milestones
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own milestones" ON public.user_milestones
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for User Progress
CREATE POLICY "Users can view their own progress" ON public.user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress" ON public.user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for Legacy Garden Nodes
CREATE POLICY "Users can view their own garden nodes" ON public.legacy_garden_nodes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own garden nodes" ON public.legacy_garden_nodes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own garden nodes" ON public.legacy_garden_nodes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own garden nodes" ON public.legacy_garden_nodes
    FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_time_capsules_user_id ON public.time_capsules(user_id);
CREATE INDEX idx_time_capsules_delivery_date ON public.time_capsules(delivery_date);
CREATE INDEX idx_time_capsules_not_delivered ON public.time_capsules(delivery_date) WHERE is_delivered = false;

CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_user_milestones_type ON public.user_milestones(milestone_type);

CREATE INDEX idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX idx_user_progress_activity_date ON public.user_progress(last_activity_date);

CREATE INDEX idx_legacy_garden_user_id ON public.legacy_garden_nodes(user_id);
CREATE INDEX idx_legacy_garden_position ON public.legacy_garden_nodes(x_position, y_position);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_time_capsules_updated_at
    BEFORE UPDATE ON public.time_capsules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON public.user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user progress when user signs up
CREATE OR REPLACE FUNCTION initialize_user_progress()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically create user progress record
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION initialize_user_progress();

-- Insert default milestone types
INSERT INTO public.user_milestones (user_id, milestone_type, milestone_title, milestone_description, points_awarded)
SELECT
    auth.uid(),
    'first_document',
    'Prvý dokument nahraný',
    'Nahral si svoj prvý dokument do LegacyGuard',
    10
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, milestone_type) DO NOTHING;