-- ============================================================================
-- GOOGLE CALENDAR INTEGRATION
-- Migration: 20250207_google_calendar_integration
--
-- Enables two-way sync between InterpretReflect assignments and Google Calendar
-- ============================================================================

-- ============================================================================
-- 1. USER_CALENDAR_TOKENS - Store Google OAuth tokens per user
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_calendar_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL DEFAULT 'google' CHECK (provider IN ('google', 'outlook', 'apple')),
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    calendar_id VARCHAR(255) DEFAULT 'primary',
    calendar_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    auto_sync_enabled BOOLEAN DEFAULT true,
    sync_preferences JSONB DEFAULT '{
        "sync_new_assignments": true,
        "add_prep_reminders": true,
        "prep_reminder_minutes": 60,
        "include_team_as_attendees": true,
        "event_color": "auto"
    }'::jsonb,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_tokens_user ON user_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_active ON user_calendar_tokens(user_id, is_active) WHERE is_active = true;

ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own calendar tokens" ON user_calendar_tokens;
CREATE POLICY "Users can view own calendar tokens" ON user_calendar_tokens
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own calendar tokens" ON user_calendar_tokens;
CREATE POLICY "Users can manage own calendar tokens" ON user_calendar_tokens
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_calendar_tokens IS 'Stores OAuth tokens for calendar integrations (Google, Outlook, etc.)';


-- ============================================================================
-- 2. CALENDAR_SYNC_EVENTS - Track synced events with external calendar IDs
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL DEFAULT 'google',
    external_event_id VARCHAR(255) NOT NULL,
    external_calendar_id VARCHAR(255) DEFAULT 'primary',
    event_link TEXT,
    sync_status VARCHAR(30) DEFAULT 'synced' CHECK (sync_status IN (
        'synced', 'pending', 'failed', 'deleted', 'conflict'
    )),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified_locally TIMESTAMPTZ,
    last_modified_externally TIMESTAMPTZ,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional' CHECK (sync_direction IN (
        'to_calendar', 'from_calendar', 'bidirectional'
    )),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_assignment_sync UNIQUE (assignment_id, user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_sync_events_assignment ON calendar_sync_events(assignment_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_user ON calendar_sync_events(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_external ON calendar_sync_events(provider, external_event_id);
CREATE INDEX IF NOT EXISTS idx_sync_events_status ON calendar_sync_events(sync_status) WHERE sync_status != 'synced';

ALTER TABLE calendar_sync_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sync events" ON calendar_sync_events;
CREATE POLICY "Users can view own sync events" ON calendar_sync_events
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own sync events" ON calendar_sync_events;
CREATE POLICY "Users can manage own sync events" ON calendar_sync_events
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE calendar_sync_events IS 'Tracks which assignments are synced to external calendars';


-- ============================================================================
-- 3. CALENDAR_SYNC_LOG - Audit trail for sync operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    sync_event_id UUID REFERENCES calendar_sync_events(id) ON DELETE SET NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'create', 'update', 'delete', 'refresh_token', 'full_sync',
        'conflict_resolved', 'error', 'webhook_received'
    )),
    direction VARCHAR(20) CHECK (direction IN ('to_calendar', 'from_calendar')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    details JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_log_user ON calendar_sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_assignment ON calendar_sync_log(assignment_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON calendar_sync_log(created_at DESC);

ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sync logs" ON calendar_sync_log;
CREATE POLICY "Users can view own sync logs" ON calendar_sync_log
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage sync logs" ON calendar_sync_log;
CREATE POLICY "Service can manage sync logs" ON calendar_sync_log
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE calendar_sync_log IS 'Audit trail for all calendar sync operations';


-- ============================================================================
-- 4. ADD CALENDAR FIELDS TO ASSIGNMENTS TABLE
-- ============================================================================

-- Add google_calendar_event_id to assignments for quick lookup
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS google_calendar_synced BOOLEAN DEFAULT false;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT true;


-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's active calendar token
CREATE OR REPLACE FUNCTION get_user_calendar_token(
    p_user_id UUID,
    p_provider VARCHAR DEFAULT 'google'
) RETURNS TABLE (
    id UUID,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id VARCHAR,
    auto_sync_enabled BOOLEAN,
    sync_preferences JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.access_token,
        t.refresh_token,
        t.token_expires_at,
        t.calendar_id,
        t.auto_sync_enabled,
        t.sync_preferences
    FROM user_calendar_tokens t
    WHERE t.user_id = p_user_id
      AND t.provider = p_provider
      AND t.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to upsert calendar token
CREATE OR REPLACE FUNCTION upsert_calendar_token(
    p_user_id UUID,
    p_provider VARCHAR,
    p_access_token TEXT,
    p_refresh_token TEXT,
    p_token_expires_at TIMESTAMPTZ,
    p_calendar_id VARCHAR DEFAULT 'primary',
    p_calendar_name VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_token_id UUID;
BEGIN
    INSERT INTO user_calendar_tokens (
        user_id, provider, access_token, refresh_token,
        token_expires_at, calendar_id, calendar_name
    ) VALUES (
        p_user_id, p_provider, p_access_token, p_refresh_token,
        p_token_expires_at, p_calendar_id, p_calendar_name
    )
    ON CONFLICT (user_id, provider) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, user_calendar_tokens.refresh_token),
        token_expires_at = EXCLUDED.token_expires_at,
        calendar_id = COALESCE(EXCLUDED.calendar_id, user_calendar_tokens.calendar_id),
        calendar_name = COALESCE(EXCLUDED.calendar_name, user_calendar_tokens.calendar_name),
        is_active = true,
        updated_at = NOW()
    RETURNING id INTO v_token_id;

    RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to record sync event
CREATE OR REPLACE FUNCTION record_calendar_sync(
    p_assignment_id UUID,
    p_user_id UUID,
    p_provider VARCHAR,
    p_external_event_id VARCHAR,
    p_external_calendar_id VARCHAR DEFAULT 'primary',
    p_event_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_sync_id UUID;
BEGIN
    INSERT INTO calendar_sync_events (
        assignment_id, user_id, provider, external_event_id,
        external_calendar_id, event_link, sync_status, last_synced_at
    ) VALUES (
        p_assignment_id, p_user_id, p_provider, p_external_event_id,
        p_external_calendar_id, p_event_link, 'synced', NOW()
    )
    ON CONFLICT (assignment_id, user_id, provider) DO UPDATE SET
        external_event_id = EXCLUDED.external_event_id,
        event_link = EXCLUDED.event_link,
        sync_status = 'synced',
        last_synced_at = NOW(),
        error_message = NULL,
        retry_count = 0,
        updated_at = NOW()
    RETURNING id INTO v_sync_id;

    -- Mark assignment as synced
    UPDATE assignments
    SET google_calendar_synced = true
    WHERE id = p_assignment_id;

    RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to get unsynced assignments for a user
CREATE OR REPLACE FUNCTION get_unsynced_assignments(
    p_user_id UUID,
    p_provider VARCHAR DEFAULT 'google'
) RETURNS TABLE (
    id UUID,
    title TEXT,
    assignment_type TEXT,
    "date" DATE,
    "time" TIME,
    duration_minutes INTEGER,
    timezone TEXT,
    location_details TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.title,
        a.assignment_type,
        a."date",
        a."time",
        a.duration_minutes,
        a.timezone,
        a.location_details,
        a.description
    FROM assignments a
    WHERE a.user_id = p_user_id
      AND a.calendar_sync_enabled = true
      AND a.status != 'cancelled'
      AND a."date" >= CURRENT_DATE
      AND NOT EXISTS (
          SELECT 1 FROM calendar_sync_events cse
          WHERE cse.assignment_id = a.id
            AND cse.user_id = p_user_id
            AND cse.provider = p_provider
            AND cse.sync_status = 'synced'
      )
    ORDER BY a."date", a."time";
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 6. TRIGGER: Auto-mark assignments for sync when created
-- ============================================================================

CREATE OR REPLACE FUNCTION check_auto_sync_on_assignment()
RETURNS TRIGGER AS $$
DECLARE
    v_user_has_calendar BOOLEAN;
    v_auto_sync BOOLEAN;
BEGIN
    -- Check if user has active calendar with auto-sync enabled
    SELECT EXISTS (
        SELECT 1 FROM user_calendar_tokens
        WHERE user_id = NEW.user_id
          AND is_active = true
          AND auto_sync_enabled = true
    ) INTO v_user_has_calendar;

    -- If auto-sync is enabled, we could trigger a sync here
    -- For now, just ensure the flag is set
    IF v_user_has_calendar AND NEW.calendar_sync_enabled IS NULL THEN
        NEW.calendar_sync_enabled := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_auto_sync ON assignments;
CREATE TRIGGER trg_check_auto_sync
    BEFORE INSERT ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION check_auto_sync_on_assignment();


-- ============================================================================
-- 7. ASSIGNMENT TYPE TO GOOGLE CALENDAR COLOR MAPPING
-- ============================================================================

-- Google Calendar color IDs: 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo,
-- 5=Banana, 6=Tangerine, 7=Peacock, 8=Graphite, 9=Blueberry, 10=Basil, 11=Tomato

CREATE OR REPLACE FUNCTION get_calendar_color_for_type(p_assignment_type TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_assignment_type
        WHEN 'Medical' THEN 11      -- Tomato (red - urgent/medical)
        WHEN 'Legal' THEN 3         -- Grape (purple - formal/legal)
        WHEN 'Educational' THEN 10  -- Basil (green - learning)
        WHEN 'VRS' THEN 7           -- Peacock (teal - communication)
        WHEN 'VRI' THEN 9           -- Blueberry (blue - tech/remote)
        WHEN 'Community' THEN 5     -- Banana (yellow - community)
        WHEN 'Mental Health' THEN 1 -- Lavender (calming)
        WHEN 'Conference' THEN 6    -- Tangerine (orange - events)
        ELSE 8                      -- Graphite (neutral)
    END;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- DONE! Google Calendar integration tables are ready.
-- ============================================================================
