-- ============================================================================
-- BEHAVIORAL DATA MODEL FOR HUMAN PERFORMANCE TRACKING
-- Migration: 20250207_behavioral_data_model
--
-- This schema enables:
--   1. Session tracking (app usage patterns)
--   2. Stress accumulation detection
--   3. Cognitive load signals
--   4. Proactive Elya intervention triggers
--   5. Wearables data integration (Phase 1: Apple Watch)
--   6. Closed-loop feedback system
--
-- Design Philosophy:
--   - Capture behavioral signals passively
--   - Detect patterns before burnout
--   - Enable proactive (not reactive) support
--   - Foundation for brain/body/behavior closed-loop
-- ============================================================================


-- ############################################################################
-- PART 1: SESSION TRACKING
-- ############################################################################

-- Track user sessions for engagement and pattern analysis
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Session identification
    session_token VARCHAR(64) UNIQUE,
    device_type VARCHAR(30) CHECK (device_type IN ('web', 'mobile', 'pwa', 'watch', 'tablet')),
    platform VARCHAR(50),  -- 'iOS', 'Android', 'Windows', 'macOS', 'Chrome', etc.
    app_version VARCHAR(20),

    -- Entry context
    entry_trigger VARCHAR(50) DEFAULT 'user_initiated' CHECK (entry_trigger IN (
        'user_initiated',      -- User opened app themselves
        'notification',        -- Clicked a push notification
        'email_link',          -- Clicked link in email
        'elya_prompt',         -- Elya proactively reached out
        'calendar_reminder',   -- Pre-assignment reminder
        'wearable_trigger',    -- Stress detected on watch
        'deep_link',           -- External deep link
        'scheduled'            -- Scheduled check-in
    )),
    entry_source VARCHAR(100),  -- Specific source details
    entry_context JSONB DEFAULT '{}'::jsonb,  -- Additional context

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    idle_time_seconds INTEGER DEFAULT 0,
    active_time_seconds INTEGER,

    -- Engagement metrics
    tools_accessed TEXT[] DEFAULT '{}',  -- ['burnout_gauge', 'elya_chat', 'journal']
    pages_visited TEXT[] DEFAULT '{}',
    features_used JSONB DEFAULT '{}'::jsonb,

    -- Session outcomes
    reflections_completed INTEGER DEFAULT 0,
    conversations_started INTEGER DEFAULT 0,
    assignments_logged INTEGER DEFAULT 0,
    wellness_checks INTEGER DEFAULT 0,

    -- Session quality signals
    was_interrupted BOOLEAN DEFAULT false,
    interruption_reason VARCHAR(100),
    user_mood_start INTEGER CHECK (user_mood_start BETWEEN 1 AND 5),
    user_mood_end INTEGER CHECK (user_mood_end BETWEEN 1 AND 5),
    session_quality_score INTEGER CHECK (session_quality_score BETWEEN 1 AND 10),

    -- Technical
    ip_hash VARCHAR(64),  -- Hashed for privacy
    user_agent TEXT,
    timezone VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON user_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_entry_trigger ON user_sessions(entry_trigger);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, ended_at) WHERE ended_at IS NULL;

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" ON user_sessions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own sessions" ON user_sessions;
CREATE POLICY "Users can manage own sessions" ON user_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- ############################################################################
-- PART 2: BEHAVIORAL SIGNALS (Micro-events)
-- ############################################################################

-- High-frequency behavioral signals for pattern detection
CREATE TABLE IF NOT EXISTS behavioral_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,

    -- Signal classification
    signal_type VARCHAR(50) NOT NULL CHECK (signal_type IN (
        -- Engagement signals
        'page_view', 'feature_click', 'scroll_depth', 'time_on_page',
        -- Emotional signals
        'mood_check', 'stress_indicator', 'energy_level', 'frustration_signal',
        -- Cognitive signals
        'focus_duration', 'task_switch', 'response_latency', 'decision_hesitation',
        -- Communication signals
        'message_sentiment', 'conversation_length', 'topic_shift',
        -- Physical signals (wearables)
        'heart_rate', 'hrv', 'activity_level', 'sleep_quality', 'stress_score',
        -- Workflow signals
        'assignment_stress', 'prep_engagement', 'debrief_depth'
    )),
    signal_category VARCHAR(30) NOT NULL CHECK (signal_category IN (
        'engagement', 'emotional', 'cognitive', 'communication', 'physical', 'workflow'
    )),

    -- Signal data
    signal_value DECIMAL(10,4),  -- Numeric value if applicable
    signal_label VARCHAR(100),   -- Categorical value if applicable
    signal_metadata JSONB DEFAULT '{}'::jsonb,

    -- Context
    context_page VARCHAR(100),
    context_feature VARCHAR(100),
    context_assignment_id UUID,

    -- Timing
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    server_received_at TIMESTAMPTZ DEFAULT NOW(),

    -- Source
    source VARCHAR(30) DEFAULT 'app' CHECK (source IN ('app', 'wearable', 'calendar', 'external', 'inferred'))
);

-- Partitioned indexes for high-volume queries
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_user_time ON behavioral_signals(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_type ON behavioral_signals(signal_type, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_category ON behavioral_signals(signal_category, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_behavioral_signals_session ON behavioral_signals(session_id);

ALTER TABLE behavioral_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own signals" ON behavioral_signals;
CREATE POLICY "Users can view own signals" ON behavioral_signals FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can manage signals" ON behavioral_signals;
CREATE POLICY "Service can manage signals" ON behavioral_signals FOR ALL USING (true) WITH CHECK (true);


-- ############################################################################
-- PART 3: STRESS ACCUMULATION TRACKING
-- ############################################################################

-- Daily stress/wellness aggregates for trend detection
CREATE TABLE IF NOT EXISTS daily_wellness_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,

    -- Stress indicators (0-100 scale)
    stress_score INTEGER CHECK (stress_score BETWEEN 0 AND 100),
    stress_trend VARCHAR(20) CHECK (stress_trend IN ('improving', 'stable', 'worsening', 'critical')),
    stress_sources JSONB DEFAULT '[]'::jsonb,  -- ['workload', 'difficult_assignment', 'personal']

    -- Energy/capacity
    energy_level INTEGER CHECK (energy_level BETWEEN 0 AND 100),
    cognitive_load INTEGER CHECK (cognitive_load BETWEEN 0 AND 100),
    emotional_capacity INTEGER CHECK (emotional_capacity BETWEEN 0 AND 100),

    -- Burnout risk (composite)
    burnout_risk_score INTEGER CHECK (burnout_risk_score BETWEEN 0 AND 100),
    burnout_risk_level VARCHAR(20) CHECK (burnout_risk_level IN ('low', 'moderate', 'elevated', 'high', 'critical')),
    burnout_risk_factors JSONB DEFAULT '[]'::jsonb,

    -- Recovery indicators
    recovery_activities INTEGER DEFAULT 0,  -- Count of wellness/grounding activities
    sleep_quality INTEGER CHECK (sleep_quality BETWEEN 0 AND 100),  -- From wearable
    rest_periods INTEGER DEFAULT 0,

    -- Work metrics
    assignments_count INTEGER DEFAULT 0,
    difficult_assignments INTEGER DEFAULT 0,
    total_interpreting_hours DECIMAL(4,2) DEFAULT 0,
    debriefs_completed INTEGER DEFAULT 0,

    -- Engagement with platform
    elya_conversations INTEGER DEFAULT 0,
    reflections_written INTEGER DEFAULT 0,
    wellness_tools_used TEXT[] DEFAULT '{}',

    -- Calculation metadata
    data_completeness INTEGER CHECK (data_completeness BETWEEN 0 AND 100),  -- % of expected data points
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_version VARCHAR(10) DEFAULT 'v1',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_daily_metrics UNIQUE (user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_wellness_user ON daily_wellness_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_wellness_date ON daily_wellness_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_wellness_user_date ON daily_wellness_metrics(user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_wellness_burnout ON daily_wellness_metrics(burnout_risk_level) WHERE burnout_risk_level IN ('elevated', 'high', 'critical');

ALTER TABLE daily_wellness_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own metrics" ON daily_wellness_metrics;
CREATE POLICY "Users can view own metrics" ON daily_wellness_metrics FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can manage metrics" ON daily_wellness_metrics;
CREATE POLICY "Service can manage metrics" ON daily_wellness_metrics FOR ALL USING (true) WITH CHECK (true);


-- ############################################################################
-- PART 4: PROACTIVE INTERVENTION SYSTEM
-- ############################################################################

-- Elya proactive intervention triggers and tracking
CREATE TABLE IF NOT EXISTS proactive_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Trigger information
    trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN (
        'stress_threshold',        -- Stress score exceeded threshold
        'burnout_risk',            -- Burnout risk elevated
        'pattern_detected',        -- Negative pattern identified
        'absence_detected',        -- User hasn't engaged in X days
        'pre_assignment',          -- Upcoming difficult assignment
        'post_assignment',         -- After interpreting, no debrief
        'wearable_alert',          -- Wearable detected stress
        'sleep_deficit',           -- Poor sleep pattern
        'workload_spike',          -- Sudden increase in assignments
        'mood_decline',            -- Declining mood trend
        'anniversary',             -- Difficult date (trauma anniversary)
        'scheduled_checkin'        -- Regular wellness check
    )),
    trigger_source VARCHAR(50),  -- What data triggered this
    trigger_data JSONB DEFAULT '{}'::jsonb,  -- Data that triggered intervention
    trigger_confidence DECIMAL(3,2) CHECK (trigger_confidence BETWEEN 0 AND 1),

    -- Intervention details
    intervention_type VARCHAR(50) NOT NULL CHECK (intervention_type IN (
        'push_notification',
        'email',
        'in_app_prompt',
        'elya_conversation_start',
        'wellness_tool_suggestion',
        'grounding_exercise',
        'rest_reminder',
        'assignment_prep_prompt',
        'debrief_prompt',
        'celebration',
        'resource_share'
    )),
    intervention_content TEXT,
    intervention_tone VARCHAR(30) CHECK (intervention_tone IN (
        'gentle', 'supportive', 'urgent', 'celebratory', 'curious', 'grounding'
    )),

    -- Priority and timing
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),  -- 1=highest
    scheduled_for TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    -- Status tracking
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'sent', 'delivered', 'opened', 'engaged', 'dismissed', 'expired', 'suppressed'
    )),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    engaged_at TIMESTAMPTZ,

    -- Outcome
    user_response VARCHAR(50),  -- 'accepted', 'deferred', 'dismissed', 'engaged_fully'
    engagement_duration_seconds INTEGER,
    outcome_rating INTEGER CHECK (outcome_rating BETWEEN 1 AND 5),  -- User feedback
    was_helpful BOOLEAN,

    -- Suppression rules
    suppressed_by UUID REFERENCES proactive_interventions(id),  -- If superseded
    suppression_reason VARCHAR(100),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interventions_user ON proactive_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON proactive_interventions(status);
CREATE INDEX IF NOT EXISTS idx_interventions_pending ON proactive_interventions(user_id, status, scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_interventions_trigger ON proactive_interventions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_interventions_created ON proactive_interventions(created_at DESC);

ALTER TABLE proactive_interventions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own interventions" ON proactive_interventions;
CREATE POLICY "Users can view own interventions" ON proactive_interventions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can manage interventions" ON proactive_interventions;
CREATE POLICY "Service can manage interventions" ON proactive_interventions FOR ALL USING (true) WITH CHECK (true);


-- ############################################################################
-- PART 5: WEARABLES INTEGRATION (Apple Watch Phase 1)
-- ############################################################################

-- User wearable connections
CREATE TABLE IF NOT EXISTS user_wearable_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Device info
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('apple_watch', 'fitbit', 'garmin', 'oura', 'whoop', 'other')),
    device_model VARCHAR(100),
    device_os_version VARCHAR(20),

    -- Connection status
    is_connected BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    sync_frequency_minutes INTEGER DEFAULT 15,

    -- Permissions granted
    permissions_granted JSONB DEFAULT '{}'::jsonb,  -- {'heart_rate': true, 'sleep': true, 'activity': true}

    -- HealthKit/Health Connect tokens (encrypted)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Sync settings
    auto_sync_enabled BOOLEAN DEFAULT true,
    background_sync_enabled BOOLEAN DEFAULT true,
    stress_alerts_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_wearable UNIQUE (user_id, device_type)
);

CREATE INDEX IF NOT EXISTS idx_wearable_connections_user ON user_wearable_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_connections_active ON user_wearable_connections(user_id, is_connected) WHERE is_connected = true;

ALTER TABLE user_wearable_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wearables" ON user_wearable_connections;
CREATE POLICY "Users can manage own wearables" ON user_wearable_connections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);


-- Wearable data samples (high-frequency)
CREATE TABLE IF NOT EXISTS wearable_data_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id UUID REFERENCES user_wearable_connections(id) ON DELETE SET NULL,

    -- Sample type
    sample_type VARCHAR(50) NOT NULL CHECK (sample_type IN (
        'heart_rate', 'heart_rate_variability', 'resting_heart_rate',
        'steps', 'active_energy', 'exercise_minutes',
        'sleep_analysis', 'sleep_stage', 'time_in_bed',
        'stress_level', 'respiratory_rate', 'blood_oxygen',
        'mindfulness_minutes', 'stand_hours'
    )),

    -- Sample data
    value DECIMAL(10,4) NOT NULL,
    unit VARCHAR(20),  -- 'bpm', 'ms', 'steps', 'kcal', 'minutes', 'percent'

    -- Timing
    sample_start TIMESTAMPTZ NOT NULL,
    sample_end TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Context
    source_device VARCHAR(50),
    activity_type VARCHAR(50),  -- 'resting', 'walking', 'exercise', 'sleep'

    -- Quality
    data_quality VARCHAR(20) CHECK (data_quality IN ('high', 'medium', 'low', 'estimated')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition by month for performance (wearable data is HIGH volume)
CREATE INDEX IF NOT EXISTS idx_wearable_samples_user_time ON wearable_data_samples(user_id, sample_start DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_samples_type ON wearable_data_samples(sample_type, sample_start DESC);
CREATE INDEX IF NOT EXISTS idx_wearable_samples_user_type ON wearable_data_samples(user_id, sample_type, sample_start DESC);

ALTER TABLE wearable_data_samples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wearable data" ON wearable_data_samples;
CREATE POLICY "Users can view own wearable data" ON wearable_data_samples FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can manage wearable data" ON wearable_data_samples;
CREATE POLICY "Service can manage wearable data" ON wearable_data_samples FOR ALL USING (true) WITH CHECK (true);


-- ############################################################################
-- PART 6: PATTERN DETECTION RULES
-- ############################################################################

-- Configurable pattern detection rules for triggering interventions
CREATE TABLE IF NOT EXISTS pattern_detection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Rule identification
    rule_code VARCHAR(50) NOT NULL UNIQUE,
    rule_name VARCHAR(200) NOT NULL,
    rule_description TEXT,

    -- Rule configuration
    signal_types TEXT[] NOT NULL,  -- Which signals to monitor
    detection_window_hours INTEGER DEFAULT 24,  -- Time window for pattern
    threshold_config JSONB NOT NULL,  -- Rule-specific thresholds

    -- Intervention to trigger
    intervention_type VARCHAR(50) NOT NULL,
    intervention_template TEXT,
    intervention_tone VARCHAR(30) DEFAULT 'supportive',

    -- Rule behavior
    priority INTEGER DEFAULT 3,
    cooldown_hours INTEGER DEFAULT 24,  -- Min time between triggers for same user
    max_daily_triggers INTEGER DEFAULT 3,

    -- Targeting
    applies_to_tiers TEXT[] DEFAULT ARRAY['free', 'growth', 'pro'],

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default pattern rules
INSERT INTO pattern_detection_rules (rule_code, rule_name, rule_description, signal_types, threshold_config, intervention_type, intervention_template) VALUES
('STRESS_SPIKE', 'Sudden Stress Increase', 'Detects rapid increase in stress indicators',
 ARRAY['stress_indicator', 'heart_rate', 'hrv'],
 '{"stress_increase_percent": 30, "min_readings": 3}'::jsonb,
 'in_app_prompt',
 'I noticed you might be feeling more stressed than usual. Would you like to try a grounding exercise together?'),

('BURNOUT_WARNING', 'Burnout Risk Elevated', 'Burnout risk score exceeds safe threshold',
 ARRAY['burnout_risk_score'],
 '{"threshold": 70, "trend_days": 3}'::jsonb,
 'elya_conversation_start',
 'Hey, I''ve been thinking about you. Your recent patterns suggest you might be running on empty. Can we chat about how you''re really doing?'),

('ABSENCE_CHECK', 'Extended Absence', 'User hasn''t engaged in several days',
 ARRAY['session'],
 '{"absence_days": 5, "prior_active_days": 7}'::jsonb,
 'push_notification',
 'Haven''t seen you in a while. Just checking in - how are you holding up?'),

('POST_ASSIGNMENT_DEBRIEF', 'No Debrief After Assignment', 'User logged assignment but no reflection',
 ARRAY['assignment_logged', 'reflection'],
 '{"hours_since_assignment": 4, "assignment_difficulty_min": 3}'::jsonb,
 'in_app_prompt',
 'I see you finished that assignment. Sometimes it helps to process what happened. Want to debrief together?'),

('SLEEP_DEFICIT', 'Poor Sleep Pattern', 'Multiple nights of poor sleep detected',
 ARRAY['sleep_quality', 'sleep_analysis'],
 '{"poor_nights": 3, "threshold_hours": 6}'::jsonb,
 'wellness_tool_suggestion',
 'Your sleep has been rough lately. That affects everything. Would you like some wind-down suggestions?'),

('MOOD_DECLINE', 'Declining Mood Trend', 'Consistent downward mood trend',
 ARRAY['mood_check', 'user_mood_end'],
 '{"decline_days": 5, "trend_slope": -0.5}'::jsonb,
 'elya_conversation_start',
 'I''ve noticed things have felt heavier lately. I''m here if you want to talk through what''s going on.')

ON CONFLICT (rule_code) DO NOTHING;


-- ############################################################################
-- PART 7: HELPER FUNCTIONS
-- ############################################################################

-- Function to record a session start
CREATE OR REPLACE FUNCTION start_user_session(
    p_user_id UUID,
    p_device_type VARCHAR DEFAULT 'web',
    p_entry_trigger VARCHAR DEFAULT 'user_initiated',
    p_entry_source VARCHAR DEFAULT NULL,
    p_entry_context JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_session_token VARCHAR(64);
BEGIN
    -- Generate unique session token
    v_session_token := encode(gen_random_bytes(32), 'hex');

    -- End any existing active sessions for this user
    UPDATE user_sessions
    SET ended_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    WHERE user_id = p_user_id AND ended_at IS NULL;

    -- Create new session
    INSERT INTO user_sessions (
        user_id, session_token, device_type, entry_trigger, entry_source, entry_context
    ) VALUES (
        p_user_id, v_session_token, p_device_type, p_entry_trigger, p_entry_source, p_entry_context
    ) RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end a session
CREATE OR REPLACE FUNCTION end_user_session(
    p_session_id UUID,
    p_tools_accessed TEXT[] DEFAULT '{}',
    p_reflections_completed INTEGER DEFAULT 0,
    p_user_mood_end INTEGER DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE user_sessions SET
        ended_at = NOW(),
        duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
        tools_accessed = p_tools_accessed,
        reflections_completed = p_reflections_completed,
        user_mood_end = p_user_mood_end
    WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a behavioral signal
CREATE OR REPLACE FUNCTION record_behavioral_signal(
    p_user_id UUID,
    p_signal_type VARCHAR,
    p_signal_category VARCHAR,
    p_signal_value DECIMAL DEFAULT NULL,
    p_signal_label VARCHAR DEFAULT NULL,
    p_signal_metadata JSONB DEFAULT '{}'::jsonb,
    p_session_id UUID DEFAULT NULL,
    p_context_page VARCHAR DEFAULT NULL,
    p_source VARCHAR DEFAULT 'app'
) RETURNS UUID AS $$
DECLARE
    v_signal_id UUID;
BEGIN
    INSERT INTO behavioral_signals (
        user_id, session_id, signal_type, signal_category,
        signal_value, signal_label, signal_metadata,
        context_page, source
    ) VALUES (
        p_user_id, p_session_id, p_signal_type, p_signal_category,
        p_signal_value, p_signal_label, p_signal_metadata,
        p_context_page, p_source
    ) RETURNING id INTO v_signal_id;

    RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate daily wellness metrics
CREATE OR REPLACE FUNCTION calculate_daily_wellness(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    v_stress_score INTEGER;
    v_energy_level INTEGER;
    v_burnout_risk INTEGER;
    v_assignments_count INTEGER;
BEGIN
    -- Calculate stress from signals
    SELECT COALESCE(AVG(signal_value), 50)::INTEGER INTO v_stress_score
    FROM behavioral_signals
    WHERE user_id = p_user_id
    AND signal_type = 'stress_indicator'
    AND recorded_at::DATE = p_date;

    -- Get assignment count
    SELECT COUNT(*) INTO v_assignments_count
    FROM assignments
    WHERE user_id = p_user_id
    AND date::DATE = p_date;

    -- Calculate burnout risk (simplified formula)
    v_burnout_risk := LEAST(100, v_stress_score + (v_assignments_count * 5));

    -- Upsert daily metrics
    INSERT INTO daily_wellness_metrics (
        user_id, metric_date, stress_score, burnout_risk_score,
        burnout_risk_level, assignments_count, calculated_at
    ) VALUES (
        p_user_id, p_date, v_stress_score, v_burnout_risk,
        CASE
            WHEN v_burnout_risk >= 80 THEN 'critical'
            WHEN v_burnout_risk >= 60 THEN 'high'
            WHEN v_burnout_risk >= 40 THEN 'elevated'
            WHEN v_burnout_risk >= 20 THEN 'moderate'
            ELSE 'low'
        END,
        v_assignments_count, NOW()
    )
    ON CONFLICT (user_id, metric_date) DO UPDATE SET
        stress_score = EXCLUDED.stress_score,
        burnout_risk_score = EXCLUDED.burnout_risk_score,
        burnout_risk_level = EXCLUDED.burnout_risk_level,
        assignments_count = EXCLUDED.assignments_count,
        calculated_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check and create proactive interventions
CREATE OR REPLACE FUNCTION check_intervention_triggers(p_user_id UUID)
RETURNS TABLE (intervention_id UUID, rule_code VARCHAR, intervention_type VARCHAR) AS $$
DECLARE
    v_rule RECORD;
    v_should_trigger BOOLEAN;
    v_intervention_id UUID;
    v_last_trigger TIMESTAMPTZ;
BEGIN
    -- Check each active rule
    FOR v_rule IN SELECT * FROM pattern_detection_rules WHERE is_active = true
    LOOP
        -- Check cooldown
        SELECT MAX(created_at) INTO v_last_trigger
        FROM proactive_interventions
        WHERE user_id = p_user_id
        AND trigger_type = v_rule.rule_code
        AND created_at > NOW() - (v_rule.cooldown_hours || ' hours')::INTERVAL;

        IF v_last_trigger IS NOT NULL THEN
            CONTINUE;  -- Still in cooldown
        END IF;

        -- Rule-specific trigger logic would go here
        -- For now, using simplified check based on daily metrics
        v_should_trigger := false;

        IF v_rule.rule_code = 'BURNOUT_WARNING' THEN
            SELECT burnout_risk_score >= 70 INTO v_should_trigger
            FROM daily_wellness_metrics
            WHERE user_id = p_user_id AND metric_date = CURRENT_DATE;
        END IF;

        IF v_should_trigger THEN
            INSERT INTO proactive_interventions (
                user_id, trigger_type, trigger_source, intervention_type,
                intervention_content, intervention_tone, priority
            ) VALUES (
                p_user_id, v_rule.rule_code, 'pattern_detection', v_rule.intervention_type,
                v_rule.intervention_template, v_rule.intervention_tone, v_rule.priority
            ) RETURNING id INTO v_intervention_id;

            RETURN QUERY SELECT v_intervention_id, v_rule.rule_code, v_rule.intervention_type;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT ON user_sessions TO authenticated;
GRANT SELECT ON behavioral_signals TO authenticated;
GRANT SELECT ON daily_wellness_metrics TO authenticated;
GRANT SELECT ON proactive_interventions TO authenticated;
GRANT SELECT ON user_wearable_connections TO authenticated;
GRANT SELECT ON wearable_data_samples TO authenticated;
GRANT SELECT ON pattern_detection_rules TO authenticated;

GRANT EXECUTE ON FUNCTION start_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION end_user_session TO authenticated;
GRANT EXECUTE ON FUNCTION record_behavioral_signal TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_daily_wellness TO service_role;
GRANT EXECUTE ON FUNCTION check_intervention_triggers TO service_role;


-- ############################################################################
-- DONE! Behavioral Data Model Ready for Human Performance Tracking
-- ############################################################################
