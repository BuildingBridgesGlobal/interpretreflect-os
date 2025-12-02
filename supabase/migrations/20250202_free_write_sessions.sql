-- ============================================================================
-- FREE WRITE SESSIONS
-- Tracks unstructured emotional processing sessions with Elya
-- Enables pattern recognition and theme tracking over time
-- ============================================================================

-- Create free_write_sessions table
CREATE TABLE IF NOT EXISTS free_write_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session context
    initial_feeling VARCHAR(20), -- The mood they checked in with (if any)
    session_date DATE DEFAULT CURRENT_DATE,

    -- Session content (stored for theme analysis)
    message_count INTEGER DEFAULT 0,

    -- AI-detected themes (populated by Elya after session)
    detected_themes JSONB DEFAULT '[]'::jsonb, -- Array of theme strings
    emotional_arc VARCHAR(50), -- 'processing', 'releasing', 'exploring', 'resolving'

    -- Session metadata
    duration_seconds INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_free_write_sessions_user_id ON free_write_sessions(user_id);
CREATE INDEX idx_free_write_sessions_date ON free_write_sessions(session_date DESC);
CREATE INDEX idx_free_write_sessions_feeling ON free_write_sessions(initial_feeling);
CREATE INDEX idx_free_write_sessions_themes ON free_write_sessions USING GIN(detected_themes);

-- Enable Row Level Security
ALTER TABLE free_write_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own sessions
CREATE POLICY "Users can view their own free write sessions"
    ON free_write_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own free write sessions"
    ON free_write_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own free write sessions"
    ON free_write_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own free write sessions"
    ON free_write_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_free_write_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER free_write_sessions_updated_at
    BEFORE UPDATE ON free_write_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_free_write_sessions_updated_at();

-- Create a view for wellness insights that includes free write themes
CREATE OR REPLACE VIEW wellness_insights AS
SELECT
    wc.user_id,
    wc.feeling,
    wc.created_at as checkin_date,
    wc.notes as checkin_notes,
    fws.id as free_write_session_id,
    fws.detected_themes,
    fws.emotional_arc,
    fws.message_count as free_write_messages
FROM wellness_checkins wc
LEFT JOIN free_write_sessions fws
    ON wc.user_id = fws.user_id
    AND DATE(wc.created_at) = fws.session_date
ORDER BY wc.created_at DESC;

COMMENT ON TABLE free_write_sessions IS 'Tracks unstructured emotional processing sessions for theme recognition';
COMMENT ON VIEW wellness_insights IS 'Combined view of wellness check-ins and free write session themes';
