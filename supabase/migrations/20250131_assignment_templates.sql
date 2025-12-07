-- ============================================================================
-- Assignment Templates System
-- Allows users to save recurring assignment patterns as reusable templates
-- ============================================================================

-- Create assignment_templates table
CREATE TABLE IF NOT EXISTS assignment_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Template metadata
    template_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Assignment defaults
    assignment_type VARCHAR(50) NOT NULL,
    setting VARCHAR(200),
    location_type VARCHAR(20) DEFAULT 'in_person',
    location_details TEXT,
    duration_minutes INTEGER DEFAULT 60,
    default_title VARCHAR(200),

    -- Recurrence settings (if this template is for recurring assignments)
    is_recurring BOOLEAN DEFAULT false,
    recurrence_pattern VARCHAR(20), -- daily, weekly, biweekly, monthly

    -- Team settings
    is_team_assignment BOOLEAN DEFAULT false,
    team_size INTEGER DEFAULT 1,

    -- Usage tracking
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_recurrence_pattern CHECK (
        recurrence_pattern IS NULL OR
        recurrence_pattern IN ('daily', 'weekly', 'biweekly', 'monthly')
    ),
    CONSTRAINT valid_location_type CHECK (
        location_type IN ('in_person', 'virtual', 'hybrid')
    )
);

-- Create indexes
CREATE INDEX idx_assignment_templates_user_id ON assignment_templates(user_id);
CREATE INDEX idx_assignment_templates_type ON assignment_templates(assignment_type);
CREATE INDEX idx_assignment_templates_recurring ON assignment_templates(is_recurring);
CREATE INDEX idx_assignment_templates_times_used ON assignment_templates(times_used DESC);

-- Enable Row Level Security
ALTER TABLE assignment_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own templates"
    ON assignment_templates FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
    ON assignment_templates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
    ON assignment_templates FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
    ON assignment_templates FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_assignment_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER assignment_templates_updated_at
    BEFORE UPDATE ON assignment_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_assignment_templates_updated_at();

-- Add some sample templates for development/testing
-- These would be created by users in production
COMMENT ON TABLE assignment_templates IS 'User-created templates for quickly creating recurring or similar assignments';
