-- Family Collaboration System - Database Extensions
-- Migration: 20241002_family_collaboration_extensions
-- Description: Extends family_members table and adds calendar/milestones support

-- Extend family_members table with invitation system
ALTER TABLE family_members
ADD COLUMN IF NOT EXISTS invitation_token UUID UNIQUE,
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS invited_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS accepted_by_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS meta JSONB DEFAULT '{}';

-- Create family_calendar_events table
CREATE TABLE IF NOT EXISTS family_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'general' CHECK (event_type IN ('general', 'milestone', 'reminder', 'meeting', 'deadline')),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ,
    organizer_user_id UUID REFERENCES auth.users(id),
    attendee_member_ids UUID[] DEFAULT '{}',
    related_document_id UUID, -- References documents table if exists
    related_milestone_id UUID, -- References family_milestones.id
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create family_milestones table
CREATE TABLE IF NOT EXISTS family_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    milestone_type TEXT DEFAULT 'general' CHECK (milestone_type IN ('general', 'birthday', 'anniversary', 'graduation', 'inheritance', 'custom')),
    due_at TIMESTAMPTZ,
    beneficiary_member_id UUID REFERENCES family_members(id),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'done', 'skipped')),
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_calendar_events_owner ON family_calendar_events(family_owner_id);
CREATE INDEX IF NOT EXISTS idx_family_calendar_events_start_date ON family_calendar_events(start_at);
CREATE INDEX IF NOT EXISTS idx_family_calendar_events_organizer ON family_calendar_events(organizer_user_id);

CREATE INDEX IF NOT EXISTS idx_family_milestones_owner ON family_milestones(family_owner_id);
CREATE INDEX IF NOT EXISTS idx_family_milestones_due_date ON family_milestones(due_at);
CREATE INDEX IF NOT EXISTS idx_family_milestones_status ON family_milestones(status);
CREATE INDEX IF NOT EXISTS idx_family_milestones_beneficiary ON family_milestones(beneficiary_member_id);

CREATE INDEX IF NOT EXISTS idx_family_members_invitation_token ON family_members(invitation_token);
CREATE INDEX IF NOT EXISTS idx_family_members_invited_by ON family_members(invited_by_user_id);

-- Row Level Security (RLS) policies

-- family_calendar_events RLS
ALTER TABLE family_calendar_events ENABLE ROW LEVEL SECURITY;

-- Full access for family owner
CREATE POLICY family_calendar_events_owner_policy ON family_calendar_events
    FOR ALL USING (family_owner_id = auth.uid());

-- Read access for family members
CREATE POLICY family_calendar_events_member_policy ON family_calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_owner_id = family_calendar_events.family_owner_id
            AND fm.member_user_id = auth.uid()
            AND fm.invitation_status = 'accepted'
        )
    );

-- family_milestones RLS
ALTER TABLE family_milestones ENABLE ROW LEVEL SECURITY;

-- Full access for family owner
CREATE POLICY family_milestones_owner_policy ON family_milestones
    FOR ALL USING (family_owner_id = auth.uid());

-- Read access for family members
CREATE POLICY family_milestones_member_policy ON family_milestones
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_owner_id = family_milestones.family_owner_id
            AND fm.member_user_id = auth.uid()
            AND fm.invitation_status = 'accepted'
        )
    );

-- Update existing family_members RLS to include invitation system
-- Drop existing policies if they exist
DROP POLICY IF EXISTS family_members_owner_policy ON family_members;
DROP POLICY IF EXISTS family_members_member_policy ON family_members;

-- Recreate with invitation support
CREATE POLICY family_members_owner_policy ON family_members
    FOR ALL USING (family_owner_id = auth.uid());

-- Family members can view their own record and other accepted members
CREATE POLICY family_members_member_policy ON family_members
    FOR SELECT USING (
        member_user_id = auth.uid() OR
        (EXISTS (
            SELECT 1 FROM family_members fm
            WHERE fm.family_owner_id = family_members.family_owner_id
            AND fm.member_user_id = auth.uid()
            AND fm.invitation_status = 'accepted'
        ))
    );

-- Create function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS UUID AS $$
BEGIN
    RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql;

-- Create function to check invitation token validity
CREATE OR REPLACE FUNCTION is_invitation_token_valid(token UUID)
RETURNS BOOLEAN AS $$
DECLARE
    valid_token BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM family_members
        WHERE invitation_token = token
        AND token_expires_at > NOW()
        AND invitation_status = 'pending'
    ) INTO valid_token;

    RETURN valid_token;
END;
$$ LANGUAGE plpgsql;

-- Create function to accept invitation
CREATE OR REPLACE FUNCTION accept_family_invitation(token UUID, accepting_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_valid BOOLEAN;
    invitation_row family_members%ROWTYPE;
BEGIN
    -- Check if token is valid
    SELECT is_invitation_token_valid(token) INTO invitation_valid;

    IF NOT invitation_valid THEN
        RETURN FALSE;
    END IF;

    -- Get invitation details
    SELECT * INTO invitation_row FROM family_members
    WHERE invitation_token = token AND invitation_status = 'pending';

    -- Update invitation status
    UPDATE family_members
    SET
        invitation_status = 'accepted',
        accepted_by_user_id = accepting_user_id,
        member_user_id = accepting_user_id,
        updated_at = NOW()
    WHERE invitation_token = token;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_family_calendar_events_updated_at
    BEFORE UPDATE ON family_calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_milestones_updated_at
    BEFORE UPDATE ON family_milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON family_calendar_events TO authenticated;
GRANT ALL ON family_milestones TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION generate_invitation_token() TO authenticated;
GRANT EXECUTE ON FUNCTION is_invitation_token_valid(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_family_invitation(UUID, UUID) TO authenticated;

-- Comments for documentation
COMMENT ON TABLE family_calendar_events IS 'Family calendar events and meetings management';
COMMENT ON TABLE family_milestones IS 'Family milestones and important dates tracking';
COMMENT ON COLUMN family_members.invitation_token IS 'Secure token for family member invitations';
COMMENT ON COLUMN family_members.token_expires_at IS 'Expiration timestamp for invitation token';
COMMENT ON COLUMN family_members.meta IS 'Additional metadata for family member (JSON)';