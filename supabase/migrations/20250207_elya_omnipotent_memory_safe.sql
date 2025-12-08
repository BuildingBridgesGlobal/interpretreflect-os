-- ============================================================================
-- ELYA OMNIPOTENT MEMORY SYSTEM (SAFE VERSION)
-- Migration: 20250207_elya_omnipotent_memory_safe
--
-- This version is idempotent - safe to run multiple times.
-- Uses IF NOT EXISTS and DROP IF EXISTS where needed.
-- ============================================================================

-- ============================================================================
-- 1. ELYA_USER_MEMORIES - Persistent facts learned about the user
-- ============================================================================

CREATE TABLE IF NOT EXISTS elya_user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN (
        'personal_fact', 'work_preference', 'skill_strength', 'skill_challenge',
        'goal', 'learning_style', 'communication_pref', 'emotional_pattern',
        'career_milestone', 'relationship', 'preference', 'context'
    )),
    memory_key VARCHAR(100) NOT NULL,
    memory_value TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),
    source_type VARCHAR(30) DEFAULT 'conversation' CHECK (source_type IN (
        'conversation', 'debrief', 'assignment', 'wellness', 'training', 'explicit'
    )),
    source_id UUID,
    times_reinforced INTEGER DEFAULT 1,
    last_reinforced_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_elya_memories_user ON elya_user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_elya_memories_user_type ON elya_user_memories(user_id, memory_type);
CREATE INDEX IF NOT EXISTS idx_elya_memories_user_active ON elya_user_memories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_elya_memories_key ON elya_user_memories(user_id, memory_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_elya_memories_unique ON elya_user_memories(user_id, memory_key) WHERE is_active = true;

ALTER TABLE elya_user_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memories" ON elya_user_memories;
CREATE POLICY "Users can view own memories" ON elya_user_memories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage memories" ON elya_user_memories;
CREATE POLICY "Service can manage memories" ON elya_user_memories FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_user_memories IS 'Persistent facts Elya learns about each user across all interactions';


-- ============================================================================
-- 2. ELYA_SKILL_OBSERVATIONS - Track where users struggle/excel
-- ============================================================================

CREATE TABLE IF NOT EXISTS elya_skill_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_domain VARCHAR(100) NOT NULL,
    skill_concept VARCHAR(200) NOT NULL,
    observation_type VARCHAR(30) NOT NULL CHECK (observation_type IN (
        'struggle', 'strength', 'interest', 'improvement', 'recurring_issue', 'breakthrough'
    )),
    evidence TEXT NOT NULL,
    severity INTEGER DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN (
        'debrief', 'training_attempt', 'conversation', 'assignment_prep', 'wellness', 'assessment'
    )),
    source_id UUID,
    occurrence_count INTEGER DEFAULT 1,
    first_observed_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_obs_user ON elya_skill_observations(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_obs_user_type ON elya_skill_observations(user_id, observation_type);
CREATE INDEX IF NOT EXISTS idx_skill_obs_domain ON elya_skill_observations(user_id, skill_domain);
CREATE INDEX IF NOT EXISTS idx_skill_obs_unresolved ON elya_skill_observations(user_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_skill_obs_recent ON elya_skill_observations(user_id, last_observed_at DESC);

ALTER TABLE elya_skill_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own observations" ON elya_skill_observations;
CREATE POLICY "Users can view own observations" ON elya_skill_observations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage observations" ON elya_skill_observations;
CREATE POLICY "Service can manage observations" ON elya_skill_observations FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_skill_observations IS 'Tracks where users struggle or excel for proactive recommendations';


-- ============================================================================
-- 3. ELYA_RECOMMENDATIONS - Proactive content suggestions
-- ============================================================================

CREATE TABLE IF NOT EXISTS elya_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
        'skill_module', 'drill', 'wellness_action', 'prep_action', 'debrief_reflection',
        'resource', 'mentor_connection', 'practice_scenario', 'break', 'celebration'
    )),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    based_on_observations UUID[],
    based_on_memories UUID[],
    reasoning TEXT,
    target_type VARCHAR(50),
    target_id UUID,
    target_url TEXT,
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    relevance_score DECIMAL(3,2) DEFAULT 0.8,
    show_after TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'shown', 'accepted', 'dismissed', 'completed', 'expired'
    )),
    shown_at TIMESTAMPTZ,
    shown_in VARCHAR(50),
    response_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON elya_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON elya_recommendations(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON elya_recommendations(user_id, priority DESC, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON elya_recommendations(user_id, recommendation_type);

ALTER TABLE elya_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own recommendations" ON elya_recommendations;
CREATE POLICY "Users can view own recommendations" ON elya_recommendations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recommendation status" ON elya_recommendations;
CREATE POLICY "Users can update own recommendation status" ON elya_recommendations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage recommendations" ON elya_recommendations;
CREATE POLICY "Service can manage recommendations" ON elya_recommendations FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_recommendations IS 'Proactive recommendations Elya generates based on user patterns';


-- ============================================================================
-- 4. ELYA_GROWTH_TIMELINE - Track user evolution over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS elya_growth_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'first_assignment', 'first_debrief', 'skill_breakthrough', 'module_completed',
        'series_completed', 'ceu_earned', 'certification_milestone', 'performance_improvement',
        'new_domain_started', 'mentor_matched', 'wellness_improvement', 'streak_achieved',
        'challenge_overcome', 'goal_achieved', 'reflection_insight'
    )),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    significance INTEGER DEFAULT 3 CHECK (significance BETWEEN 1 AND 5),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    metadata JSONB,
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_timeline_user ON elya_growth_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_growth_timeline_date ON elya_growth_timeline(user_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_growth_timeline_type ON elya_growth_timeline(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_growth_timeline_significant ON elya_growth_timeline(user_id, significance DESC);

ALTER TABLE elya_growth_timeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own timeline" ON elya_growth_timeline;
CREATE POLICY "Users can view own timeline" ON elya_growth_timeline FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage timeline" ON elya_growth_timeline;
CREATE POLICY "Service can manage timeline" ON elya_growth_timeline FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_growth_timeline IS 'Significant moments in each users professional growth journey';


-- ============================================================================
-- 5. MODULE SKILL MAPPINGS - Connect modules to skills they address
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_skill_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,
    skill_domain VARCHAR(100) NOT NULL,
    skill_concept VARCHAR(200) NOT NULL,
    effectiveness INTEGER DEFAULT 3 CHECK (effectiveness BETWEEN 1 AND 5),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_module_skills_module ON module_skill_mappings(module_id);
CREATE INDEX IF NOT EXISTS idx_module_skills_domain ON module_skill_mappings(skill_domain);
CREATE INDEX IF NOT EXISTS idx_module_skills_concept ON module_skill_mappings(skill_concept);
CREATE INDEX IF NOT EXISTS idx_module_skills_lookup ON module_skill_mappings(skill_domain, skill_concept);

ALTER TABLE module_skill_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view module skills" ON module_skill_mappings;
CREATE POLICY "Anyone can view module skills" ON module_skill_mappings FOR SELECT USING (true);

COMMENT ON TABLE module_skill_mappings IS 'Maps which skills each training module addresses';


-- ============================================================================
-- 6. SEED INITIAL MODULE SKILL MAPPINGS (only if not already seeded)
-- ============================================================================

INSERT INTO module_skill_mappings (module_id, skill_domain, skill_concept, effectiveness, is_primary)
SELECT
    id,
    'nervous_system_regulation',
    CASE module_code
        WHEN 'NSM-1-1' THEN 'self_awareness_body_signals'
        WHEN 'NSM-1-2' THEN 'identifying_window_of_tolerance'
        WHEN 'NSM-1-3' THEN 'self_regulation_techniques'
        WHEN 'NSM-1-4' THEN 'grounding_techniques'
        WHEN 'NSM-1-5' THEN 'pre_assignment_centering'
        WHEN 'NSM-1-6' THEN 'recovery_and_reset'
        ELSE 'nervous_system_general'
    END,
    5,
    true
FROM skill_modules
WHERE module_code LIKE 'NSM-%'
  AND NOT EXISTS (
    SELECT 1 FROM module_skill_mappings msm
    WHERE msm.module_id = skill_modules.id
      AND msm.skill_domain = 'nervous_system_regulation'
  );

INSERT INTO module_skill_mappings (module_id, skill_domain, skill_concept, effectiveness, is_primary)
SELECT id, 'burnout_prevention', 'recognizing_stress_signals', 4, false
FROM skill_modules
WHERE module_code IN ('NSM-1-1', 'NSM-1-2')
  AND NOT EXISTS (
    SELECT 1 FROM module_skill_mappings msm
    WHERE msm.module_id = skill_modules.id
      AND msm.skill_domain = 'burnout_prevention'
  );

INSERT INTO module_skill_mappings (module_id, skill_domain, skill_concept, effectiveness, is_primary)
SELECT id, 'assignment_preparation', 'mental_readiness', 4, false
FROM skill_modules
WHERE module_code IN ('NSM-1-4', 'NSM-1-5')
  AND NOT EXISTS (
    SELECT 1 FROM module_skill_mappings msm
    WHERE msm.module_id = skill_modules.id
      AND msm.skill_domain = 'assignment_preparation'
  );


-- ============================================================================
-- 7. HELPER FUNCTIONS (CREATE OR REPLACE is already idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_user_memory(
    p_user_id UUID,
    p_memory_type VARCHAR(50),
    p_memory_key VARCHAR(100),
    p_memory_value TEXT,
    p_confidence DECIMAL DEFAULT 1.0,
    p_source_type VARCHAR(30) DEFAULT 'conversation',
    p_source_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_memory_id UUID;
BEGIN
    UPDATE elya_user_memories
    SET
        memory_value = p_memory_value,
        confidence = GREATEST(confidence, p_confidence),
        times_reinforced = times_reinforced + 1,
        last_reinforced_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND memory_key = p_memory_key
      AND is_active = true
    RETURNING id INTO v_memory_id;

    IF v_memory_id IS NULL THEN
        INSERT INTO elya_user_memories (
            user_id, memory_type, memory_key, memory_value,
            confidence, source_type, source_id
        ) VALUES (
            p_user_id, p_memory_type, p_memory_key, p_memory_value,
            p_confidence, p_source_type, p_source_id
        )
        RETURNING id INTO v_memory_id;
    END IF;

    RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION record_skill_observation(
    p_user_id UUID,
    p_skill_domain VARCHAR(100),
    p_skill_concept VARCHAR(200),
    p_observation_type VARCHAR(30),
    p_evidence TEXT,
    p_severity INTEGER DEFAULT 3,
    p_source_type VARCHAR(30) DEFAULT 'conversation',
    p_source_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_observation_id UUID;
    v_existing_id UUID;
BEGIN
    SELECT id INTO v_existing_id
    FROM elya_skill_observations
    WHERE user_id = p_user_id
      AND skill_domain = p_skill_domain
      AND skill_concept = p_skill_concept
      AND observation_type = p_observation_type
      AND is_resolved = false
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        UPDATE elya_skill_observations
        SET
            occurrence_count = occurrence_count + 1,
            last_observed_at = NOW(),
            evidence = evidence || E'\n---\n' || p_evidence,
            severity = GREATEST(severity, p_severity)
        WHERE id = v_existing_id
        RETURNING id INTO v_observation_id;
    ELSE
        INSERT INTO elya_skill_observations (
            user_id, skill_domain, skill_concept, observation_type,
            evidence, severity, source_type, source_id
        ) VALUES (
            p_user_id, p_skill_domain, p_skill_concept, p_observation_type,
            p_evidence, p_severity, p_source_type, p_source_id
        )
        RETURNING id INTO v_observation_id;
    END IF;

    RETURN v_observation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION find_modules_for_skill_gap(
    p_skill_domain VARCHAR(100),
    p_skill_concept VARCHAR(200) DEFAULT NULL
) RETURNS TABLE (
    module_id UUID,
    module_code VARCHAR(20),
    module_title TEXT,
    series_title TEXT,
    effectiveness INTEGER,
    is_primary BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm.id,
        sm.module_code,
        sm.title,
        ss.title AS series_title,
        msm.effectiveness,
        msm.is_primary
    FROM module_skill_mappings msm
    JOIN skill_modules sm ON msm.module_id = sm.id
    LEFT JOIN skill_series ss ON sm.series_id = ss.id
    WHERE msm.skill_domain = p_skill_domain
      AND (p_skill_concept IS NULL OR msm.skill_concept = p_skill_concept)
    ORDER BY msm.is_primary DESC, msm.effectiveness DESC;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION get_user_recommendations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    id UUID,
    recommendation_type VARCHAR(50),
    title VARCHAR(200),
    description TEXT,
    reasoning TEXT,
    priority INTEGER,
    target_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.recommendation_type,
        r.title,
        r.description,
        r.reasoning,
        r.priority,
        r.target_url
    FROM elya_recommendations r
    WHERE r.user_id = p_user_id
      AND r.status = 'active'
      AND (r.show_after IS NULL OR r.show_after <= NOW())
      AND (r.expires_at IS NULL OR r.expires_at > NOW())
    ORDER BY r.priority DESC, r.relevance_score DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION record_growth_event(
    p_user_id UUID,
    p_event_type VARCHAR(50),
    p_title VARCHAR(200),
    p_description TEXT DEFAULT NULL,
    p_significance INTEGER DEFAULT 3,
    p_related_entity_type VARCHAR(50) DEFAULT NULL,
    p_related_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO elya_growth_timeline (
        user_id, event_type, title, description,
        significance, related_entity_type, related_entity_id, metadata
    ) VALUES (
        p_user_id, p_event_type, p_title, p_description,
        p_significance, p_related_entity_type, p_related_entity_id, p_metadata
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- 8. TRIGGERS (drop first to avoid duplicates)
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_record_module_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_module_title TEXT;
    v_series_title TEXT;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        SELECT sm.title, ss.title
        INTO v_module_title, v_series_title
        FROM skill_modules sm
        LEFT JOIN skill_series ss ON sm.series_id = ss.id
        WHERE sm.id = NEW.module_id;

        PERFORM record_growth_event(
            NEW.user_id,
            'module_completed',
            'Completed: ' || v_module_title,
            'Finished module in ' || COALESCE(v_series_title, 'training'),
            3,
            'skill_module',
            NEW.module_id,
            jsonb_build_object(
                'module_id', NEW.module_id,
                'series_title', v_series_title,
                'assessment_score', NEW.assessment_score
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_module_completion ON user_module_progress;
CREATE TRIGGER trg_record_module_completion
    AFTER INSERT OR UPDATE ON user_module_progress
    FOR EACH ROW
    EXECUTE FUNCTION auto_record_module_completion();


CREATE OR REPLACE FUNCTION auto_record_ceu_earned()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        PERFORM record_growth_event(
            NEW.user_id,
            'ceu_earned',
            'Earned ' || NEW.ceu_value || ' CEU: ' || NEW.title,
            'Certificate #' || NEW.certificate_number,
            4,
            'ceu_certificate',
            NEW.id,
            jsonb_build_object(
                'certificate_number', NEW.certificate_number,
                'ceu_value', NEW.ceu_value,
                'rid_category', NEW.rid_category
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_ceu_earned ON ceu_certificates;
CREATE TRIGGER trg_record_ceu_earned
    AFTER INSERT ON ceu_certificates
    FOR EACH ROW
    EXECUTE FUNCTION auto_record_ceu_earned();


-- ============================================================================
-- DONE! Elya now has omnipotent memory.
-- ============================================================================
