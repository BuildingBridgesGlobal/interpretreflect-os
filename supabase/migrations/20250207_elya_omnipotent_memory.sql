-- ============================================================================
-- ELYA OMNIPOTENT MEMORY SYSTEM
-- Migration: 20250207_elya_omnipotent_memory
--
-- This creates a persistent memory system where Elya remembers everything
-- about each user, tracks their skill gaps, and proactively recommends content.
-- ============================================================================

-- ============================================================================
-- 1. ELYA_USER_MEMORIES - Persistent facts learned about the user
-- ============================================================================
-- Elya extracts and stores important facts from every conversation.
-- These facts persist forever and inform all future interactions.

CREATE TABLE IF NOT EXISTS elya_user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What type of memory is this?
    memory_type VARCHAR(50) NOT NULL CHECK (memory_type IN (
        'personal_fact',        -- Name, location, family, hobbies
        'work_preference',      -- Preferred assignment types, settings
        'skill_strength',       -- Areas where they excel
        'skill_challenge',      -- Areas they struggle with
        'goal',                 -- What they want to achieve
        'learning_style',       -- How they learn best
        'communication_pref',   -- How they like to be communicated with
        'emotional_pattern',    -- Recurring emotional themes
        'career_milestone',     -- Important career events
        'relationship',         -- Important people in their work life
        'preference',           -- General preferences
        'context'               -- Other important context
    )),

    -- The actual memory
    memory_key VARCHAR(100) NOT NULL,  -- Short identifier (e.g., "preferred_assignment_type")
    memory_value TEXT NOT NULL,         -- The actual information

    -- How confident are we in this memory?
    confidence DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence BETWEEN 0 AND 1),

    -- Where did this memory come from?
    source_type VARCHAR(30) DEFAULT 'conversation' CHECK (source_type IN (
        'conversation',     -- Extracted from chat
        'debrief',          -- Learned from debrief
        'assignment',       -- Inferred from assignment patterns
        'wellness',         -- From wellness check-ins
        'training',         -- From training behavior
        'explicit'          -- User explicitly stated
    )),
    source_id UUID,  -- Reference to the specific conversation/debrief/etc.

    -- Lifecycle
    times_reinforced INTEGER DEFAULT 1,  -- How many times this fact was confirmed
    last_reinforced_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast retrieval
CREATE INDEX idx_elya_memories_user ON elya_user_memories(user_id);
CREATE INDEX idx_elya_memories_user_type ON elya_user_memories(user_id, memory_type);
CREATE INDEX idx_elya_memories_user_active ON elya_user_memories(user_id, is_active);
CREATE INDEX idx_elya_memories_key ON elya_user_memories(user_id, memory_key);

-- Unique constraint: one memory per key per user
CREATE UNIQUE INDEX idx_elya_memories_unique ON elya_user_memories(user_id, memory_key) WHERE is_active = true;

-- RLS
ALTER TABLE elya_user_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON elya_user_memories
    FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert/update (Elya extracts memories server-side)
CREATE POLICY "Service can manage memories" ON elya_user_memories
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_user_memories IS 'Persistent facts Elya learns about each user across all interactions';


-- ============================================================================
-- 2. ELYA_SKILL_OBSERVATIONS - Track where users struggle/excel
-- ============================================================================
-- Elya observes skill patterns from debriefs, training, and conversations.
-- Used to proactively recommend relevant workshops and modules.

CREATE TABLE IF NOT EXISTS elya_skill_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What skill/concept is this about?
    skill_domain VARCHAR(100) NOT NULL,  -- e.g., "medical_terminology", "nervous_system_regulation"
    skill_concept VARCHAR(200) NOT NULL, -- e.g., "cardiology_terms", "pre-assignment_grounding"

    -- Observation details
    observation_type VARCHAR(30) NOT NULL CHECK (observation_type IN (
        'struggle',         -- User had difficulty here
        'strength',         -- User excels here
        'interest',         -- User expressed interest
        'improvement',      -- User showed improvement
        'recurring_issue',  -- Issue keeps coming up
        'breakthrough'      -- Major progress moment
    )),

    -- Evidence and context
    evidence TEXT NOT NULL,  -- What led to this observation
    severity INTEGER DEFAULT 3 CHECK (severity BETWEEN 1 AND 5),  -- 1=minor, 5=critical

    -- Source tracking
    source_type VARCHAR(30) NOT NULL CHECK (source_type IN (
        'debrief',
        'training_attempt',
        'conversation',
        'assignment_prep',
        'wellness',
        'assessment'
    )),
    source_id UUID,

    -- Pattern tracking
    occurrence_count INTEGER DEFAULT 1,
    first_observed_at TIMESTAMPTZ DEFAULT NOW(),
    last_observed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Resolution
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_skill_obs_user ON elya_skill_observations(user_id);
CREATE INDEX idx_skill_obs_user_type ON elya_skill_observations(user_id, observation_type);
CREATE INDEX idx_skill_obs_domain ON elya_skill_observations(user_id, skill_domain);
CREATE INDEX idx_skill_obs_unresolved ON elya_skill_observations(user_id, is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_skill_obs_recent ON elya_skill_observations(user_id, last_observed_at DESC);

-- RLS
ALTER TABLE elya_skill_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own observations" ON elya_skill_observations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage observations" ON elya_skill_observations
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_skill_observations IS 'Tracks where users struggle or excel for proactive recommendations';


-- ============================================================================
-- 3. ELYA_RECOMMENDATIONS - Proactive content suggestions
-- ============================================================================
-- Elya generates recommendations based on observations and user context.
-- These can be surfaced in the UI or mentioned in conversations.

CREATE TABLE IF NOT EXISTS elya_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What are we recommending?
    recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN (
        'skill_module',         -- A specific training module
        'drill',                -- Practice drill
        'wellness_action',      -- Wellness recommendation
        'prep_action',          -- Assignment prep suggestion
        'debrief_reflection',   -- Something to reflect on
        'resource',             -- Knowledge base resource
        'mentor_connection',    -- Connect with a mentor
        'practice_scenario',    -- Custom practice suggestion
        'break',                -- Take a break recommendation
        'celebration'           -- Celebrate an achievement
    )),

    -- The actual recommendation
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    -- What's it based on?
    based_on_observations UUID[],  -- References to elya_skill_observations
    based_on_memories UUID[],       -- References to elya_user_memories
    reasoning TEXT,                  -- Why Elya is recommending this

    -- Link to actual content
    target_type VARCHAR(50),  -- 'skill_module', 'drill', etc.
    target_id UUID,           -- ID of the specific content
    target_url TEXT,          -- Direct link if applicable

    -- Priority and timing
    priority INTEGER DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),  -- 1=low, 5=urgent
    relevance_score DECIMAL(3,2) DEFAULT 0.8,  -- How relevant is this right now

    -- When to show this
    show_after TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,  -- Recommendation may become stale

    -- Status tracking
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active',       -- Ready to show
        'shown',        -- Shown to user
        'accepted',     -- User clicked/accepted
        'dismissed',    -- User dismissed
        'completed',    -- User completed the recommended action
        'expired'       -- No longer relevant
    )),
    shown_at TIMESTAMPTZ,
    shown_in VARCHAR(50),  -- Where it was shown (chat, dashboard, etc.)
    response_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON elya_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_active ON elya_recommendations(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON elya_recommendations(user_id, priority DESC, relevance_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_type ON elya_recommendations(user_id, recommendation_type);

-- RLS
ALTER TABLE elya_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own recommendations" ON elya_recommendations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendation status" ON elya_recommendations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can manage recommendations" ON elya_recommendations
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_recommendations IS 'Proactive recommendations Elya generates based on user patterns';


-- ============================================================================
-- 4. ELYA_GROWTH_TIMELINE - Track user evolution over time
-- ============================================================================
-- A timeline of significant moments in the user's journey.
-- Helps Elya tell the story of their growth.

CREATE TABLE IF NOT EXISTS elya_growth_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What happened?
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'first_assignment',
        'first_debrief',
        'skill_breakthrough',
        'module_completed',
        'series_completed',
        'ceu_earned',
        'certification_milestone',
        'performance_improvement',
        'new_domain_started',
        'mentor_matched',
        'wellness_improvement',
        'streak_achieved',
        'challenge_overcome',
        'goal_achieved',
        'reflection_insight'
    )),

    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Significance
    significance INTEGER DEFAULT 3 CHECK (significance BETWEEN 1 AND 5),  -- 1=minor, 5=major

    -- References
    related_entity_type VARCHAR(50),
    related_entity_id UUID,

    -- Metadata
    metadata JSONB,

    -- When
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_growth_timeline_user ON elya_growth_timeline(user_id);
CREATE INDEX idx_growth_timeline_date ON elya_growth_timeline(user_id, event_date DESC);
CREATE INDEX idx_growth_timeline_type ON elya_growth_timeline(user_id, event_type);
CREATE INDEX idx_growth_timeline_significant ON elya_growth_timeline(user_id, significance DESC);

-- RLS
ALTER TABLE elya_growth_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own timeline" ON elya_growth_timeline
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can manage timeline" ON elya_growth_timeline
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE elya_growth_timeline IS 'Significant moments in each users professional growth journey';


-- ============================================================================
-- 5. MODULE SKILL MAPPINGS - Connect modules to skills they address
-- ============================================================================
-- This allows Elya to recommend specific modules for specific skill gaps.

CREATE TABLE IF NOT EXISTS module_skill_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,

    -- What skill/concept does this module address?
    skill_domain VARCHAR(100) NOT NULL,
    skill_concept VARCHAR(200) NOT NULL,

    -- How well does it address it?
    effectiveness INTEGER DEFAULT 3 CHECK (effectiveness BETWEEN 1 AND 5),  -- 1=touches on, 5=comprehensive

    -- Is this a primary focus or secondary?
    is_primary BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_module_skills_module ON module_skill_mappings(module_id);
CREATE INDEX idx_module_skills_domain ON module_skill_mappings(skill_domain);
CREATE INDEX idx_module_skills_concept ON module_skill_mappings(skill_concept);
CREATE INDEX idx_module_skills_lookup ON module_skill_mappings(skill_domain, skill_concept);

-- RLS - Public read
ALTER TABLE module_skill_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view module skills" ON module_skill_mappings
    FOR SELECT USING (true);

COMMENT ON TABLE module_skill_mappings IS 'Maps which skills each training module addresses';


-- ============================================================================
-- 6. SEED INITIAL MODULE SKILL MAPPINGS
-- ============================================================================
-- Map existing NSM modules to the skills they address

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
ON CONFLICT DO NOTHING;

-- Add secondary mappings for related skills
INSERT INTO module_skill_mappings (module_id, skill_domain, skill_concept, effectiveness, is_primary)
SELECT
    id,
    'burnout_prevention',
    'recognizing_stress_signals',
    4,
    false
FROM skill_modules
WHERE module_code IN ('NSM-1-1', 'NSM-1-2')
ON CONFLICT DO NOTHING;

INSERT INTO module_skill_mappings (module_id, skill_domain, skill_concept, effectiveness, is_primary)
SELECT
    id,
    'assignment_preparation',
    'mental_readiness',
    4,
    false
FROM skill_modules
WHERE module_code IN ('NSM-1-4', 'NSM-1-5')
ON CONFLICT DO NOTHING;


-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to add or reinforce a memory
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
    -- Try to update existing memory
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

    -- If no existing memory, insert new one
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


-- Function to record a skill observation
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
    -- Check for existing unresolved observation of same type
    SELECT id INTO v_existing_id
    FROM elya_skill_observations
    WHERE user_id = p_user_id
      AND skill_domain = p_skill_domain
      AND skill_concept = p_skill_concept
      AND observation_type = p_observation_type
      AND is_resolved = false
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing observation
        UPDATE elya_skill_observations
        SET
            occurrence_count = occurrence_count + 1,
            last_observed_at = NOW(),
            evidence = evidence || E'\n---\n' || p_evidence,
            severity = GREATEST(severity, p_severity)
        WHERE id = v_existing_id
        RETURNING id INTO v_observation_id;
    ELSE
        -- Insert new observation
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


-- Function to find modules that address a skill gap
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


-- Function to get active recommendations for a user
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


-- Function to record growth timeline event
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
-- 8. TRIGGER TO AUTO-RECORD GROWTH EVENTS
-- ============================================================================

-- When a module is completed, record it in the timeline
CREATE OR REPLACE FUNCTION auto_record_module_completion()
RETURNS TRIGGER AS $$
DECLARE
    v_module_title TEXT;
    v_series_title TEXT;
BEGIN
    -- Only trigger when status changes to 'completed'
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        -- Get module and series info
        SELECT sm.title, ss.title
        INTO v_module_title, v_series_title
        FROM skill_modules sm
        LEFT JOIN skill_series ss ON sm.series_id = ss.id
        WHERE sm.id = NEW.module_id;

        -- Record the event
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

CREATE TRIGGER trg_record_module_completion
    AFTER INSERT OR UPDATE ON user_module_progress
    FOR EACH ROW
    EXECUTE FUNCTION auto_record_module_completion();


-- When a CEU certificate is issued, record it
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

CREATE TRIGGER trg_record_ceu_earned
    AFTER INSERT ON ceu_certificates
    FOR EACH ROW
    EXECUTE FUNCTION auto_record_ceu_earned();


-- ============================================================================
-- DONE! Elya now has:
-- 1. Persistent memory of user facts and preferences
-- 2. Skill gap tracking and observation
-- 3. Proactive recommendation engine
-- 4. Growth timeline for celebrating progress
-- 5. Module-to-skill mappings for smart recommendations
-- ============================================================================
