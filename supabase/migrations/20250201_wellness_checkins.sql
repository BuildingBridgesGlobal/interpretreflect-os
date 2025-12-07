-- ============================================================================
-- Wellness Check-ins System
-- Tracks user emotional wellness and patterns over time
-- ============================================================================

-- Create wellness_checkins table
CREATE TABLE IF NOT EXISTS wellness_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Check-in data
    feeling VARCHAR(20) NOT NULL CHECK (feeling IN ('energized', 'calm', 'okay', 'drained', 'overwhelmed')),

    -- Context data (optional)
    hours_worked_this_week INTEGER,
    rest_days_this_month INTEGER,
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_feeling CHECK (
        feeling IN ('energized', 'calm', 'okay', 'drained', 'overwhelmed')
    )
);

-- Create indexes
CREATE INDEX idx_wellness_checkins_user_id ON wellness_checkins(user_id);
CREATE INDEX idx_wellness_checkins_created_at ON wellness_checkins(created_at DESC);
CREATE INDEX idx_wellness_checkins_user_date ON wellness_checkins(user_id, created_at DESC);
CREATE INDEX idx_wellness_checkins_feeling ON wellness_checkins(feeling);

-- Enable Row Level Security
ALTER TABLE wellness_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own check-ins"
    ON wellness_checkins FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own check-ins"
    ON wellness_checkins FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own check-ins"
    ON wellness_checkins FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own check-ins"
    ON wellness_checkins FOR DELETE
    USING (auth.uid() = user_id);

-- Create a view for wellness statistics
CREATE OR REPLACE VIEW wellness_stats AS
SELECT
    user_id,
    DATE(created_at) as check_in_date,
    COUNT(*) as total_checkins,
    COUNT(CASE WHEN feeling = 'energized' THEN 1 END) as energized_count,
    COUNT(CASE WHEN feeling = 'calm' THEN 1 END) as calm_count,
    COUNT(CASE WHEN feeling = 'okay' THEN 1 END) as okay_count,
    COUNT(CASE WHEN feeling = 'drained' THEN 1 END) as drained_count,
    COUNT(CASE WHEN feeling = 'overwhelmed' THEN 1 END) as overwhelmed_count,
    AVG(hours_worked_this_week) as avg_hours_worked,
    AVG(rest_days_this_month) as avg_rest_days
FROM wellness_checkins
GROUP BY user_id, DATE(created_at);

COMMENT ON TABLE wellness_checkins IS 'User wellness check-ins tracking emotional state and work patterns';
COMMENT ON VIEW wellness_stats IS 'Aggregated wellness statistics per user per day';
