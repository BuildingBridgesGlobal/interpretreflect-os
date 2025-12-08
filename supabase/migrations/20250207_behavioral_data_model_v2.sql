-- ============================================================================
-- BEHAVIORAL DATA MODEL V2 - Pattern Recognition & Human-AI Collaboration
-- ============================================================================
-- Extends the base behavioral model with:
-- 1. Detailed physiological data tracking
-- 2. Pattern observations (Elya's learned insights per user)
-- 3. Human-AI collaboration events (ECCI training data)
-- 4. User baselines (personalized thresholds)
-- 5. Privacy preferences
-- ============================================================================

-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- 1. PHYSIOLOGICAL DATA (Detailed Wearables)
-- ============================================================================
-- More granular than wearable_data_samples - supports multiple data types
-- with proper measurement periods and confidence scoring

DO $$ BEGIN
  CREATE TYPE physio_data_type AS ENUM (
    'hrv', 'resting_hr', 'sleep_duration', 'sleep_quality', 'sleep_stages',
    'activity_minutes', 'steps', 'respiratory_rate', 'body_temperature'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE physio_source AS ENUM (
    'apple_health', 'oura', 'whoop', 'garmin', 'fitbit', 'manual'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE measurement_period AS ENUM (
    'instant', 'hourly', 'daily', 'sleep_session'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS physiological_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Data source (using TEXT with CHECK for flexibility)
  source TEXT NOT NULL CHECK (source IN ('apple_health', 'oura', 'whoop', 'garmin', 'fitbit', 'manual')),
  data_type TEXT NOT NULL CHECK (data_type IN (
    'hrv', 'resting_hr', 'sleep_duration', 'sleep_quality', 'sleep_stages',
    'activity_minutes', 'steps', 'respiratory_rate', 'body_temperature'
  )),

  -- Measurement
  value DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('ms', 'bpm', 'minutes', 'score', 'steps', 'breaths_per_min', 'celsius', 'fahrenheit')),

  -- Timing
  measured_at TIMESTAMPTZ NOT NULL,
  measurement_period TEXT CHECK (measurement_period IN ('instant', 'hourly', 'daily', 'sleep_session')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,

  -- Quality
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Raw data (encrypted, user-owned)
  raw_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_physio_user_time ON physiological_data(user_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_physio_type ON physiological_data(data_type);
CREATE INDEX IF NOT EXISTS idx_physio_source ON physiological_data(source);
CREATE INDEX IF NOT EXISTS idx_physio_user_type_time ON physiological_data(user_id, data_type, measured_at DESC);

-- ============================================================================
-- 2. STRESS ACCUMULATION (Rolling Stress State)
-- ============================================================================
-- Elya's working model of user's current state across time windows

DO $$ BEGIN
  CREATE TYPE trend_direction AS ENUM ('improving', 'stable', 'declining', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE burnout_risk_level AS ENUM ('low', 'moderate', 'elevated', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS stress_accumulation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Time window
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_hours INTEGER NOT NULL CHECK (window_hours IN (24, 72, 168)),

  -- Composite scores (0-100 scale for granularity)
  stress_score DECIMAL(5,2) NOT NULL CHECK (stress_score >= 0 AND stress_score <= 100),
  recovery_score DECIMAL(5,2) CHECK (recovery_score >= 0 AND recovery_score <= 100),
  resilience_score DECIMAL(5,2) CHECK (resilience_score >= 0 AND resilience_score <= 100),

  -- Component signals (what contributed to this calculation)
  behavioral_component DECIMAL(5,2) CHECK (behavioral_component >= 0 AND behavioral_component <= 100),
  physiological_component DECIMAL(5,2) CHECK (physiological_component >= 0 AND physiological_component <= 100),
  self_report_component DECIMAL(5,2) CHECK (self_report_component >= 0 AND self_report_component <= 100),

  -- Trend indicators (using TEXT with CHECK instead of ENUM for compatibility)
  trend_direction TEXT CHECK (trend_direction IN ('improving', 'stable', 'declining', 'critical')),
  trend_velocity DECIMAL(5,2),
  days_in_current_trend INTEGER CHECK (days_in_current_trend >= 0),

  -- Risk assessment
  burnout_risk_level TEXT CHECK (burnout_risk_level IN ('low', 'moderate', 'elevated', 'high', 'critical')),
  intervention_recommended BOOLEAN DEFAULT FALSE,
  recommended_intervention TEXT,

  -- Calculation metadata
  signals_used INTEGER CHECK (signals_used >= 0),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Non-unique index (removed unique constraint to allow frequent calculations)
CREATE INDEX IF NOT EXISTS idx_accumulation_user_time ON stress_accumulation(user_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_accumulation_risk ON stress_accumulation(burnout_risk_level);
CREATE INDEX IF NOT EXISTS idx_accumulation_user_window ON stress_accumulation(user_id, window_hours, calculated_at DESC);

-- ============================================================================
-- 3. ELYA INTERVENTIONS (Proactive Outreach Tracking)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE intervention_trigger_type AS ENUM (
    'stress_threshold', 'pattern_detected', 'scheduled_checkin',
    'wearable_alert', 'inactivity', 'post_session', 'time_based'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intervention_type AS ENUM (
    'notification', 'in_app_prompt', 'breathing_suggestion',
    'reflection_prompt', 'resource_share', 'check_in_question'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_response_type AS ENUM (
    'accepted', 'dismissed', 'snoozed', 'ignored', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS elya_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Trigger
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'stress_threshold', 'pattern_detected', 'scheduled_checkin',
    'wearable_alert', 'inactivity', 'post_session', 'time_based'
  )),
  trigger_data JSONB,

  -- Intervention content
  intervention_type TEXT NOT NULL CHECK (intervention_type IN (
    'notification', 'in_app_prompt', 'breathing_suggestion',
    'reflection_prompt', 'resource_share', 'check_in_question'
  )),
  intervention_content TEXT,
  intervention_channel TEXT CHECK (intervention_channel IN ('push', 'in_app', 'email', 'sms')),

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  seen_at TIMESTAMPTZ,

  -- Response
  user_response TEXT CHECK (user_response IN ('accepted', 'dismissed', 'snoozed', 'ignored', 'completed')),
  response_at TIMESTAMPTZ,
  response_data JSONB,

  -- Outcome tracking
  stress_before DECIMAL(5,2) CHECK (stress_before >= 0 AND stress_before <= 100),
  stress_after DECIMAL(5,2) CHECK (stress_after >= 0 AND stress_after <= 100),
  intervention_helpful BOOLEAN,

  -- Learning
  intervention_effectiveness DECIMAL(3,2) CHECK (intervention_effectiveness >= 0 AND intervention_effectiveness <= 1)
);

CREATE INDEX IF NOT EXISTS idx_interventions_user_time ON elya_interventions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interventions_type ON elya_interventions(intervention_type);
CREATE INDEX IF NOT EXISTS idx_interventions_response ON elya_interventions(user_response);
CREATE INDEX IF NOT EXISTS idx_interventions_unseen ON elya_interventions(user_id) WHERE seen_at IS NULL;

-- ============================================================================
-- 4. PATTERN OBSERVATIONS (Elya's Learned Insights)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE pattern_type AS ENUM (
    'temporal', 'behavioral', 'physiological', 'contextual', 'intervention_response'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS pattern_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN (
    'temporal', 'behavioral', 'physiological', 'contextual', 'intervention_response'
  )),
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,

  -- Pattern data
  pattern_data JSONB NOT NULL,

  -- Confidence & validation
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  occurrences INTEGER DEFAULT 1 CHECK (occurrences >= 0),
  first_observed TIMESTAMPTZ DEFAULT NOW(),
  last_observed TIMESTAMPTZ DEFAULT NOW(),
  last_validated TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  user_acknowledged BOOLEAN DEFAULT FALSE,
  user_feedback TEXT CHECK (user_feedback IN ('accurate', 'sometimes', 'not_accurate')),

  -- Action implications
  suggested_interventions TEXT[],
  intervention_timing TEXT CHECK (intervention_timing IN ('preventive', 'reactive', 'scheduled')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_user ON pattern_observations(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON pattern_observations(pattern_type);
CREATE INDEX IF NOT EXISTS idx_patterns_active ON pattern_observations(user_id, is_active) WHERE is_active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_patterns_user_type_name ON pattern_observations(user_id, pattern_type, pattern_name) WHERE is_active = TRUE;

-- ============================================================================
-- 5. HUMAN-AI COLLABORATION EVENTS (ECCI Training Data)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE collaboration_event_type AS ENUM (
    'correction', 'escalation', 'validation', 'teaching_moment',
    'context_addition', 'preference_expression', 'disagreement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_type AS ENUM (
    'factual_correction', 'tone_preference', 'timing_preference',
    'context_matters', 'cultural_nuance', 'emotional_nuance',
    'professional_judgment', 'boundary_setting'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE ecci_dimension AS ENUM (
    'emotional', 'cultural', 'contextual', 'interpersonal'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS human_ai_collaboration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Event type
  event_type TEXT NOT NULL CHECK (event_type IN (
    'correction', 'escalation', 'validation', 'teaching_moment',
    'context_addition', 'preference_expression', 'disagreement'
  )),

  -- What happened
  ai_action TEXT,
  ai_reasoning JSONB,
  human_response TEXT,

  -- The learning
  lesson_type TEXT CHECK (lesson_type IN (
    'factual_correction', 'tone_preference', 'timing_preference',
    'context_matters', 'cultural_nuance', 'emotional_nuance',
    'professional_judgment', 'boundary_setting'
  )),
  lesson_content JSONB,

  -- ECCI tagging
  ecci_dimension TEXT CHECK (ecci_dimension IN ('emotional', 'cultural', 'contextual', 'interpersonal')),
  ecci_competency TEXT,

  -- Consent & privacy
  shareable_for_training BOOLEAN DEFAULT FALSE,
  anonymized_version JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_collab_user ON human_ai_collaboration_events(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_type ON human_ai_collaboration_events(event_type);
CREATE INDEX IF NOT EXISTS idx_collab_ecci ON human_ai_collaboration_events(ecci_dimension);
CREATE INDEX IF NOT EXISTS idx_collab_shareable ON human_ai_collaboration_events(shareable_for_training) WHERE shareable_for_training = TRUE;

-- ============================================================================
-- 6. USER BASELINES (Personalized Thresholds)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  metric_type TEXT NOT NULL CHECK (metric_type IN (
    'hrv', 'resting_hr', 'sleep_duration', 'stress_score',
    'session_frequency', 'reflection_depth', 'recovery_time'
  )),

  -- Baseline values
  baseline_value DECIMAL(10,2),
  baseline_min DECIMAL(10,2),
  baseline_max DECIMAL(10,2),
  standard_deviation DECIMAL(10,2),

  -- Calculation metadata
  data_points_used INTEGER CHECK (data_points_used >= 0),
  calculation_period_days INTEGER CHECK (calculation_period_days > 0),
  last_calculated TIMESTAMPTZ DEFAULT NOW(),

  -- Thresholds (personalized)
  alert_threshold_low DECIMAL(10,2),
  alert_threshold_high DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT user_baselines_unique UNIQUE (user_id, metric_type)
);

CREATE INDEX IF NOT EXISTS idx_baseline_user ON user_baselines(user_id);

-- ============================================================================
-- 7. USER DATA PREFERENCES (Privacy Controls)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_data_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Data collection
  collect_behavioral_signals BOOLEAN DEFAULT TRUE,
  collect_session_metadata BOOLEAN DEFAULT TRUE,
  collect_physiological_data BOOLEAN DEFAULT TRUE,

  -- Data use
  use_for_personalization BOOLEAN DEFAULT TRUE,
  use_for_pattern_detection BOOLEAN DEFAULT TRUE,
  share_anonymized_for_research BOOLEAN DEFAULT FALSE,
  share_for_ai_training BOOLEAN DEFAULT FALSE,

  -- Retention
  behavioral_data_retention_days INTEGER DEFAULT 365 CHECK (behavioral_data_retention_days > 0),
  physiological_data_retention_days INTEGER DEFAULT 365 CHECK (physiological_data_retention_days > 0),

  -- Export
  last_data_export TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. HELPER FUNCTIONS (with search_path hardening)
-- ============================================================================

-- Function to record a pattern observation
CREATE OR REPLACE FUNCTION record_pattern_observation(
  p_user_id UUID,
  p_pattern_type TEXT,
  p_pattern_name TEXT,
  p_pattern_description TEXT,
  p_pattern_data JSONB,
  p_confidence_score DECIMAL DEFAULT 0.5,
  p_suggested_interventions TEXT[] DEFAULT NULL,
  p_intervention_timing TEXT DEFAULT 'reactive'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_pattern_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing pattern of same type/name for user
  SELECT id INTO v_existing_id
  FROM pattern_observations
  WHERE user_id = p_user_id
    AND pattern_type = p_pattern_type
    AND pattern_name = p_pattern_name
    AND is_active = TRUE;

  IF v_existing_id IS NOT NULL THEN
    -- Update existing pattern
    UPDATE pattern_observations
    SET
      pattern_data = p_pattern_data,
      pattern_description = COALESCE(p_pattern_description, pattern_description),
      confidence_score = p_confidence_score,
      occurrences = occurrences + 1,
      last_observed = NOW(),
      suggested_interventions = COALESCE(p_suggested_interventions, suggested_interventions),
      intervention_timing = p_intervention_timing,
      updated_at = NOW()
    WHERE id = v_existing_id
    RETURNING id INTO v_pattern_id;
  ELSE
    -- Create new pattern
    INSERT INTO pattern_observations (
      user_id, pattern_type, pattern_name, pattern_description,
      pattern_data, confidence_score, suggested_interventions, intervention_timing
    ) VALUES (
      p_user_id, p_pattern_type, p_pattern_name, p_pattern_description,
      p_pattern_data, p_confidence_score, p_suggested_interventions, p_intervention_timing
    )
    RETURNING id INTO v_pattern_id;
  END IF;

  RETURN v_pattern_id;
END;
$$;

-- Revoke public access, grant only to authenticated
REVOKE ALL ON FUNCTION record_pattern_observation(UUID, TEXT, TEXT, TEXT, JSONB, DECIMAL, TEXT[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_pattern_observation(UUID, TEXT, TEXT, TEXT, JSONB, DECIMAL, TEXT[], TEXT) TO authenticated;

-- Function to record human-AI collaboration event
CREATE OR REPLACE FUNCTION record_collaboration_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_ai_action TEXT,
  p_ai_reasoning JSONB,
  p_human_response TEXT,
  p_lesson_type TEXT DEFAULT NULL,
  p_lesson_content JSONB DEFAULT NULL,
  p_ecci_dimension TEXT DEFAULT NULL,
  p_ecci_competency TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_event_id UUID;
  v_shareable BOOLEAN;
BEGIN
  -- Check user's preference for sharing
  SELECT share_for_ai_training INTO v_shareable
  FROM user_data_preferences
  WHERE user_id = p_user_id;

  INSERT INTO human_ai_collaboration_events (
    user_id, event_type, ai_action, ai_reasoning,
    human_response, lesson_type, lesson_content,
    ecci_dimension, ecci_competency, shareable_for_training
  ) VALUES (
    p_user_id, p_event_type, p_ai_action, p_ai_reasoning,
    p_human_response, p_lesson_type, p_lesson_content,
    p_ecci_dimension, p_ecci_competency, COALESCE(v_shareable, FALSE)
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION record_collaboration_event(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_collaboration_event(UUID, TEXT, TEXT, JSONB, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- Function to calculate stress accumulation
CREATE OR REPLACE FUNCTION calculate_stress_accumulation(
  p_user_id UUID,
  p_window_hours INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_accumulation_id UUID;
  v_behavioral_score DECIMAL(5,2) := 50;
  v_physio_score DECIMAL(5,2) := NULL;
  v_self_report_score DECIMAL(5,2) := NULL;
  v_composite_score DECIMAL(5,2);
  v_signal_count INTEGER := 0;
  v_window_start TIMESTAMPTZ;
  v_trend TEXT := 'stable';
  v_burnout_level TEXT := 'low';
  v_prev_score DECIMAL(5,2);
BEGIN
  v_window_start := NOW() - (p_window_hours || ' hours')::INTERVAL;

  -- Calculate behavioral component from signals
  SELECT
    COALESCE(AVG(
      CASE
        WHEN signal_type IN ('stress_indicator', 'frustration_signal', 'assignment_stress')
        THEN COALESCE(signal_value, 0)
        WHEN signal_type = 'mood_check'
        THEN 100 - COALESCE(signal_value, 50) -- Invert mood (higher mood = lower stress)
        ELSE NULL
      END
    ), 50),
    COUNT(*)
  INTO v_behavioral_score, v_signal_count
  FROM behavioral_signals
  WHERE user_id = p_user_id
    AND recorded_at >= v_window_start
    AND signal_category IN ('emotional', 'workflow');

  -- Calculate physiological component (if available)
  SELECT AVG(
    CASE
      WHEN data_type = 'hrv' THEN GREATEST(0, LEAST(100, 100 - (value / 2))) -- Lower HRV = higher stress
      WHEN data_type = 'resting_hr' THEN GREATEST(0, LEAST(100, value)) -- Higher HR = higher stress
      WHEN data_type = 'sleep_quality' THEN GREATEST(0, LEAST(100, 100 - value)) -- Lower sleep = higher stress
      ELSE NULL
    END
  )
  INTO v_physio_score
  FROM physiological_data
  WHERE user_id = p_user_id
    AND measured_at >= v_window_start;

  -- Calculate self-report component from wellness metrics
  SELECT AVG(stress_score)
  INTO v_self_report_score
  FROM daily_wellness_metrics
  WHERE user_id = p_user_id
    AND metric_date >= (v_window_start::DATE);

  -- Composite score (weighted average of available components)
  v_composite_score := GREATEST(0, LEAST(100, (
    COALESCE(v_behavioral_score, 50) * 0.4 +
    COALESCE(v_physio_score, COALESCE(v_behavioral_score, 50)) * 0.3 +
    COALESCE(v_self_report_score, COALESCE(v_behavioral_score, 50)) * 0.3
  )));

  -- Determine burnout risk level
  v_burnout_level := CASE
    WHEN v_composite_score >= 80 THEN 'critical'
    WHEN v_composite_score >= 65 THEN 'high'
    WHEN v_composite_score >= 50 THEN 'elevated'
    WHEN v_composite_score >= 35 THEN 'moderate'
    ELSE 'low'
  END;

  -- Get previous score for trend calculation
  SELECT stress_score INTO v_prev_score
  FROM stress_accumulation
  WHERE user_id = p_user_id AND window_hours = p_window_hours
  ORDER BY calculated_at DESC
  LIMIT 1;

  -- Calculate trend
  IF v_prev_score IS NOT NULL THEN
    v_trend := CASE
      WHEN v_composite_score < v_prev_score - 5 THEN 'improving'
      WHEN v_composite_score > v_prev_score + 5 THEN 'declining'
      ELSE 'stable'
    END;
  ELSE
    v_trend := 'stable';
  END IF;

  -- Insert new accumulation record
  INSERT INTO stress_accumulation (
    user_id, window_hours, stress_score,
    behavioral_component, physiological_component, self_report_component,
    trend_direction, burnout_risk_level,
    intervention_recommended, signals_used,
    confidence
  ) VALUES (
    p_user_id, p_window_hours, v_composite_score,
    v_behavioral_score, v_physio_score, v_self_report_score,
    v_trend, v_burnout_level,
    v_burnout_level IN ('high', 'critical'),
    v_signal_count,
    CASE WHEN v_signal_count >= 10 THEN 0.9 WHEN v_signal_count >= 5 THEN 0.7 ELSE 0.5 END
  )
  RETURNING id INTO v_accumulation_id;

  RETURN v_accumulation_id;
END;
$$;

REVOKE ALL ON FUNCTION calculate_stress_accumulation(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION calculate_stress_accumulation(UUID, INTEGER) TO authenticated;

-- Function to create Elya intervention
CREATE OR REPLACE FUNCTION create_elya_intervention(
  p_user_id UUID,
  p_trigger_type TEXT,
  p_trigger_data JSONB,
  p_intervention_type TEXT,
  p_intervention_content TEXT,
  p_intervention_channel TEXT DEFAULT 'in_app'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_intervention_id UUID;
  v_stress_before DECIMAL(5,2);
BEGIN
  -- Get current stress level
  SELECT stress_score INTO v_stress_before
  FROM stress_accumulation
  WHERE user_id = p_user_id
  ORDER BY calculated_at DESC
  LIMIT 1;

  INSERT INTO elya_interventions (
    user_id, trigger_type, trigger_data,
    intervention_type, intervention_content, intervention_channel,
    stress_before
  ) VALUES (
    p_user_id, p_trigger_type, p_trigger_data,
    p_intervention_type, p_intervention_content, p_intervention_channel,
    v_stress_before
  )
  RETURNING id INTO v_intervention_id;

  RETURN v_intervention_id;
END;
$$;

REVOKE ALL ON FUNCTION create_elya_intervention(UUID, TEXT, JSONB, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_elya_intervention(UUID, TEXT, JSONB, TEXT, TEXT, TEXT) TO authenticated;

-- Function to record intervention response
CREATE OR REPLACE FUNCTION record_intervention_response(
  p_intervention_id UUID,
  p_user_response TEXT,
  p_response_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE elya_interventions
  SET
    user_response = p_user_response,
    response_at = NOW(),
    response_data = p_response_data,
    seen_at = COALESCE(seen_at, NOW())
  WHERE id = p_intervention_id;
END;
$$;

REVOKE ALL ON FUNCTION record_intervention_response(UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_intervention_response(UUID, TEXT, JSONB) TO authenticated;

-- Function to update user baseline
CREATE OR REPLACE FUNCTION update_user_baseline(
  p_user_id UUID,
  p_metric_type TEXT,
  p_calculation_days INTEGER DEFAULT 30
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_baseline_id UUID;
  v_avg DECIMAL(10,2);
  v_min DECIMAL(10,2);
  v_max DECIMAL(10,2);
  v_stddev DECIMAL(10,2);
  v_count INTEGER;
BEGIN
  -- Calculate baseline from physiological data
  SELECT
    AVG(value), MIN(value), MAX(value),
    STDDEV(value), COUNT(*)
  INTO v_avg, v_min, v_max, v_stddev, v_count
  FROM physiological_data
  WHERE user_id = p_user_id
    AND data_type = p_metric_type
    AND measured_at >= NOW() - (p_calculation_days || ' days')::INTERVAL;

  IF v_count < 5 THEN
    -- Not enough data - update last_calculated to prevent repeated attempts
    UPDATE user_baselines
    SET last_calculated = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id AND metric_type = p_metric_type;
    RETURN NULL;
  END IF;

  -- Upsert baseline
  INSERT INTO user_baselines (
    user_id, metric_type, baseline_value, baseline_min, baseline_max,
    standard_deviation, data_points_used, calculation_period_days,
    alert_threshold_low, alert_threshold_high
  ) VALUES (
    p_user_id, p_metric_type, v_avg, v_min, v_max,
    v_stddev, v_count, p_calculation_days,
    v_avg - (2 * COALESCE(v_stddev, 0)),
    v_avg + (2 * COALESCE(v_stddev, 0))
  )
  ON CONFLICT ON CONSTRAINT user_baselines_unique DO UPDATE SET
    baseline_value = EXCLUDED.baseline_value,
    baseline_min = EXCLUDED.baseline_min,
    baseline_max = EXCLUDED.baseline_max,
    standard_deviation = EXCLUDED.standard_deviation,
    data_points_used = EXCLUDED.data_points_used,
    calculation_period_days = EXCLUDED.calculation_period_days,
    alert_threshold_low = EXCLUDED.alert_threshold_low,
    alert_threshold_high = EXCLUDED.alert_threshold_high,
    last_calculated = NOW(),
    updated_at = NOW()
  RETURNING id INTO v_baseline_id;

  RETURN v_baseline_id;
END;
$$;

REVOKE ALL ON FUNCTION update_user_baseline(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION update_user_baseline(UUID, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE physiological_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE stress_accumulation ENABLE ROW LEVEL SECURITY;
ALTER TABLE elya_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_ai_collaboration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data_preferences ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
DROP POLICY IF EXISTS "Users read own physiological_data" ON physiological_data;
CREATE POLICY "Users read own physiological_data" ON physiological_data
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own stress_accumulation" ON stress_accumulation;
CREATE POLICY "Users read own stress_accumulation" ON stress_accumulation
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own elya_interventions" ON elya_interventions;
CREATE POLICY "Users read own elya_interventions" ON elya_interventions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own pattern_observations" ON pattern_observations;
CREATE POLICY "Users read own pattern_observations" ON pattern_observations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own human_ai_collaboration_events" ON human_ai_collaboration_events;
CREATE POLICY "Users read own human_ai_collaboration_events" ON human_ai_collaboration_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read own user_baselines" ON user_baselines;
CREATE POLICY "Users read own user_baselines" ON user_baselines
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- User data preferences - full CRUD
DROP POLICY IF EXISTS "Users manage own user_data_preferences" ON user_data_preferences;
CREATE POLICY "Users manage own user_data_preferences" ON user_data_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can insert their own preferences
DROP POLICY IF EXISTS "Users insert own user_data_preferences" ON user_data_preferences;
CREATE POLICY "Users insert own user_data_preferences" ON user_data_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their pattern feedback
DROP POLICY IF EXISTS "Users update own pattern_observations" ON pattern_observations;
CREATE POLICY "Users update own pattern_observations" ON pattern_observations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Users can update intervention responses
DROP POLICY IF EXISTS "Users update own elya_interventions" ON elya_interventions;
CREATE POLICY "Users update own elya_interventions" ON elya_interventions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. SEED PATTERN DETECTION RULES (matching v1 schema)
-- ============================================================================

-- Add additional pattern rules using the v1 schema
INSERT INTO pattern_detection_rules (
  rule_code, rule_name, rule_description, signal_types, threshold_config,
  intervention_type, intervention_template, priority
) VALUES
  (
    'MONDAY_STRESS_SPIKE',
    'Monday Stress Spike',
    'Detect elevated stress on Mondays relative to weekly baseline',
    ARRAY['stress_indicator'],
    '{"day_of_week": 1, "stress_increase_threshold": 15}'::jsonb,
    'in_app_prompt',
    'I noticed Mondays tend to be tougher for you. Would a quick breathing exercise help start the week calmer?',
    3
  ),
  (
    'HRV_DROP_WARNING',
    'HRV Drop Warning',
    'HRV dropped significantly below personal baseline',
    ARRAY['hrv'],
    '{"threshold_type": "below_baseline", "threshold_stddev": 2}'::jsonb,
    'in_app_prompt',
    'I noticed your body might be under more stress than usual. How are you feeling?',
    2
  ),
  (
    'REFLECTION_AVOIDANCE',
    'Reflection Avoidance Pattern',
    'User starts but abandons reflections repeatedly',
    ARRAY['reflection_abandoned'],
    '{"min_occurrences": 3, "window_days": 7}'::jsonb,
    'in_app_prompt',
    'Sometimes starting is the hardest part. Would a guided 2-minute reflection feel more doable?',
    4
  ),
  (
    'EVENING_ENGAGEMENT',
    'Evening Engagement Pattern',
    'User engages more effectively in evenings',
    ARRAY['session', 'reflection'],
    '{"time_pattern": "evening", "engagement_threshold": 0.7}'::jsonb,
    'push_notification',
    'Good evening! Based on your patterns, now might be a great time for a reflection.',
    5
  ),
  (
    'POST_ASSIGNMENT_VULNERABILITY',
    'Post-Assignment Vulnerability',
    'Elevated stress detected in 24 hours following difficult assignment',
    ARRAY['assignment_logged', 'stress_indicator'],
    '{"stress_threshold": 60, "window_hours": 24}'::jsonb,
    'in_app_prompt',
    'How are you feeling after yesterday''s assignment? Sometimes it helps to talk through what happened.',
    2
  )
ON CONFLICT (rule_code) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON physiological_data TO authenticated;
GRANT SELECT ON stress_accumulation TO authenticated;
GRANT SELECT ON elya_interventions TO authenticated;
GRANT SELECT, UPDATE ON pattern_observations TO authenticated;
GRANT SELECT ON human_ai_collaboration_events TO authenticated;
GRANT SELECT ON user_baselines TO authenticated;
GRANT ALL ON user_data_preferences TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
