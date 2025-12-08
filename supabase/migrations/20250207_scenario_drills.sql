-- ============================================================================
-- SCENARIO DRILLS SYSTEM
-- Migration: 20250207_scenario_drills
--
-- Interactive branching scenario drills for interpreter skill development
-- Timed decision-making with pressure simulation and Elya debrief integration
-- ============================================================================

-- ============================================================================
-- 1. SCENARIO_DRILLS - Master table for drill scenarios
-- ============================================================================

CREATE TABLE IF NOT EXISTS scenario_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identification
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),

    -- Categorization
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'medical', 'legal', 'educational', 'mental_health',
        'community', 'conference', 'vrs', 'vri', 'business'
    )),
    difficulty_base VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (difficulty_base IN (
        'practice', 'standard', 'pressure', 'expert'
    )),

    -- ECCI Framework Focus Areas (primary skills being assessed)
    ecci_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- e.g., ["linguistic_accuracy", "role_space_management", "cultural_competence"]

    -- The scenario content as structured JSON
    scenario_data JSONB NOT NULL,
    -- Structure: {
    --   setup: { context, characters, setting },
    --   decision_points: [{ id, scene, options: [{ id, text, consequences, next_point }] }],
    --   branches: { branch_id: [decision_points...] },
    --   endings: { ending_id: { description, score_adjustments } }
    -- }

    -- Timer settings per difficulty (seconds)
    timer_settings JSONB NOT NULL DEFAULT '{
        "practice": 45,
        "standard": 25,
        "pressure": 15,
        "expert": 10
    }'::jsonb,

    -- Scoring rubric
    scoring_rubric JSONB NOT NULL DEFAULT '{
        "categories": [
            "linguistic_accuracy",
            "role_space_management",
            "equipartial_fidelity",
            "interaction_management",
            "cultural_competence"
        ],
        "max_score_per_category": 20,
        "total_max_score": 100
    }'::jsonb,

    -- Metadata
    estimated_duration_minutes INTEGER DEFAULT 10,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scenario_drills_category ON scenario_drills(category);
CREATE INDEX IF NOT EXISTS idx_scenario_drills_published ON scenario_drills(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_scenario_drills_featured ON scenario_drills(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_scenario_drills_slug ON scenario_drills(slug);

COMMENT ON TABLE scenario_drills IS 'Master table for interactive branching scenario drills';


-- ============================================================================
-- 2. USER_SCENARIO_ATTEMPTS - Track user attempts and scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_scenario_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenario_drills(id) ON DELETE CASCADE,

    -- Attempt settings
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN (
        'practice', 'standard', 'pressure', 'expert'
    )),

    -- Path taken through scenario
    decisions_made JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Array of: { decision_point_id, option_chosen, time_taken_ms, timed_out }

    -- Consequences accumulated
    consequence_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- e.g., { "maria_guarded": true, "dr_chen_trusts": false }

    -- Final scores by category
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { "linguistic_accuracy": 18, "role_space_management": 15, ... }

    total_score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 100,
    percentage_score DECIMAL(5,2),

    -- Ending reached
    ending_id VARCHAR(50),

    -- Timing data
    total_time_ms INTEGER,
    timeouts_count INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN (
        'in_progress', 'completed', 'abandoned'
    )),

    -- Elya debrief
    debrief_completed BOOLEAN DEFAULT false,
    debrief_notes JSONB,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_attempts_user ON user_scenario_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_scenario ON user_scenario_attempts(scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_user_scenario ON user_scenario_attempts(user_id, scenario_id);
CREATE INDEX IF NOT EXISTS idx_scenario_attempts_completed ON user_scenario_attempts(user_id, status) WHERE status = 'completed';

ALTER TABLE user_scenario_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own scenario attempts" ON user_scenario_attempts;
CREATE POLICY "Users can view own scenario attempts" ON user_scenario_attempts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own scenario attempts" ON user_scenario_attempts;
CREATE POLICY "Users can create own scenario attempts" ON user_scenario_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own scenario attempts" ON user_scenario_attempts;
CREATE POLICY "Users can update own scenario attempts" ON user_scenario_attempts
    FOR UPDATE USING (auth.uid() = user_id);

COMMENT ON TABLE user_scenario_attempts IS 'Tracks user attempts at scenario drills with scores and decisions';


-- ============================================================================
-- 3. USER_DRILL_PROGRESS - Track unlocked difficulties per scenario
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_drill_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenario_drills(id) ON DELETE CASCADE,

    -- Unlocked difficulties
    unlocked_difficulties JSONB NOT NULL DEFAULT '["practice"]'::jsonb,

    -- Best scores per difficulty
    best_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- { "practice": 85, "standard": 72 }

    -- Stats
    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,

    -- Timestamps
    first_played_at TIMESTAMPTZ DEFAULT NOW(),
    last_played_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_scenario_progress UNIQUE (user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_drill_progress_user ON user_drill_progress(user_id);

ALTER TABLE user_drill_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own drill progress" ON user_drill_progress;
CREATE POLICY "Users can view own drill progress" ON user_drill_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own drill progress" ON user_drill_progress;
CREATE POLICY "Users can manage own drill progress" ON user_drill_progress
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE user_drill_progress IS 'Tracks user progression and unlocked difficulties for each drill';


-- ============================================================================
-- 4. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has unlocked a difficulty level
CREATE OR REPLACE FUNCTION check_difficulty_unlock(
    p_user_id UUID,
    p_scenario_id UUID,
    p_difficulty VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_unlocked JSONB;
BEGIN
    SELECT unlocked_difficulties INTO v_unlocked
    FROM user_drill_progress
    WHERE user_id = p_user_id AND scenario_id = p_scenario_id;

    IF v_unlocked IS NULL THEN
        -- No progress record, only practice is unlocked
        RETURN p_difficulty = 'practice';
    END IF;

    RETURN v_unlocked ? p_difficulty;
END;
$$ LANGUAGE plpgsql;


-- Function to update progress after completing a drill
CREATE OR REPLACE FUNCTION update_drill_progress(
    p_user_id UUID,
    p_scenario_id UUID,
    p_difficulty VARCHAR,
    p_score INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_progress user_drill_progress%ROWTYPE;
    v_new_unlocks TEXT[] := ARRAY[]::TEXT[];
    v_current_best INTEGER;
BEGIN
    -- Get or create progress record
    INSERT INTO user_drill_progress (user_id, scenario_id)
    VALUES (p_user_id, p_scenario_id)
    ON CONFLICT (user_id, scenario_id) DO UPDATE SET
        total_attempts = user_drill_progress.total_attempts + 1,
        total_completions = user_drill_progress.total_completions + 1,
        last_played_at = NOW()
    RETURNING * INTO v_progress;

    -- Update best score for this difficulty
    v_current_best := COALESCE((v_progress.best_scores ->> p_difficulty)::INTEGER, 0);
    IF p_score > v_current_best THEN
        UPDATE user_drill_progress
        SET best_scores = jsonb_set(
            COALESCE(best_scores, '{}'::jsonb),
            ARRAY[p_difficulty],
            to_jsonb(p_score)
        )
        WHERE id = v_progress.id;
    END IF;

    -- Check for difficulty unlocks based on score thresholds
    -- Practice -> Standard: Complete any scenario at Practice
    IF p_difficulty = 'practice' AND NOT (v_progress.unlocked_difficulties ? 'standard') THEN
        UPDATE user_drill_progress
        SET unlocked_difficulties = unlocked_difficulties || '["standard"]'::jsonb
        WHERE id = v_progress.id;
        v_new_unlocks := array_append(v_new_unlocks, 'standard');
    END IF;

    -- Standard -> Pressure: 70%+ on Standard
    IF p_difficulty = 'standard' AND p_score >= 70 AND NOT (v_progress.unlocked_difficulties ? 'pressure') THEN
        UPDATE user_drill_progress
        SET unlocked_difficulties = unlocked_difficulties || '["pressure"]'::jsonb
        WHERE id = v_progress.id;
        v_new_unlocks := array_append(v_new_unlocks, 'pressure');
    END IF;

    -- Pressure -> Expert: 80%+ on Pressure
    IF p_difficulty = 'pressure' AND p_score >= 80 AND NOT (v_progress.unlocked_difficulties ? 'expert') THEN
        UPDATE user_drill_progress
        SET unlocked_difficulties = unlocked_difficulties || '["expert"]'::jsonb
        WHERE id = v_progress.id;
        v_new_unlocks := array_append(v_new_unlocks, 'expert');
    END IF;

    RETURN jsonb_build_object(
        'new_unlocks', to_jsonb(v_new_unlocks),
        'best_score_updated', p_score > v_current_best
    );
END;
$$ LANGUAGE plpgsql;


-- Function to get user's drill stats for Elya context
CREATE OR REPLACE FUNCTION get_user_drill_stats(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_drills_completed', COALESCE(SUM(total_completions), 0),
        'average_score', ROUND(AVG(
            GREATEST(
                COALESCE((best_scores->>'practice')::INTEGER, 0),
                COALESCE((best_scores->>'standard')::INTEGER, 0),
                COALESCE((best_scores->>'pressure')::INTEGER, 0),
                COALESCE((best_scores->>'expert')::INTEGER, 0)
            )
        ), 1),
        'scenarios_attempted', COUNT(*),
        'highest_difficulty_unlocked', (
            CASE
                WHEN bool_or(unlocked_difficulties ? 'expert') THEN 'expert'
                WHEN bool_or(unlocked_difficulties ? 'pressure') THEN 'pressure'
                WHEN bool_or(unlocked_difficulties ? 'standard') THEN 'standard'
                ELSE 'practice'
            END
        )
    ) INTO v_stats
    FROM user_drill_progress
    WHERE user_id = p_user_id;

    RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql;


-- Function to get recent drill attempts for Elya debrief context
CREATE OR REPLACE FUNCTION get_recent_drill_attempts(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT jsonb_agg(attempt_data)
        FROM (
            SELECT jsonb_build_object(
                'scenario_title', sd.title,
                'category', sd.category,
                'difficulty', usa.difficulty,
                'score', usa.total_score,
                'percentage', usa.percentage_score,
                'scores_breakdown', usa.scores,
                'timeouts', usa.timeouts_count,
                'ending', usa.ending_id,
                'completed_at', usa.completed_at,
                'debrief_completed', usa.debrief_completed
            ) as attempt_data
            FROM user_scenario_attempts usa
            JOIN scenario_drills sd ON sd.id = usa.scenario_id
            WHERE usa.user_id = p_user_id
              AND usa.status = 'completed'
            ORDER BY usa.completed_at DESC
            LIMIT p_limit
        ) recent
    );
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 5. TRIGGER: Update scenario play count and avg score
-- ============================================================================

CREATE OR REPLACE FUNCTION update_scenario_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE scenario_drills
        SET
            play_count = play_count + 1,
            avg_score = (
                SELECT ROUND(AVG(percentage_score), 2)
                FROM user_scenario_attempts
                WHERE scenario_id = NEW.scenario_id
                  AND status = 'completed'
            )
        WHERE id = NEW.scenario_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_scenario_stats ON user_scenario_attempts;
CREATE TRIGGER trg_update_scenario_stats
    AFTER INSERT OR UPDATE ON user_scenario_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_scenario_stats();


-- ============================================================================
-- 6. SEED DATA: "The Diagnosis" Scenario
-- ============================================================================

INSERT INTO scenario_drills (
    slug,
    title,
    subtitle,
    category,
    difficulty_base,
    ecci_focus,
    scenario_data,
    timer_settings,
    scoring_rubric,
    estimated_duration_minutes,
    is_published,
    is_featured
) VALUES (
    'the-diagnosis',
    'The Diagnosis',
    'A medical interpreting scenario exploring role boundaries and advocacy',
    'medical',
    'standard',
    '["role_space_management", "equipartial_fidelity", "cultural_competence"]'::jsonb,
    '{
        "setup": {
            "context": "You are interpreting for Maria, a 45-year-old Deaf woman, during a follow-up appointment with Dr. Chen. Maria has been experiencing fatigue and weight changes. This is the moment when test results are being delivered.",
            "characters": {
                "maria": {
                    "name": "Maria",
                    "role": "Patient",
                    "age": 45,
                    "background": "Deaf woman, ASL native, limited English literacy, works as a graphic designer"
                },
                "dr_chen": {
                    "name": "Dr. Chen",
                    "role": "Endocrinologist",
                    "background": "Experienced physician, first time working with an interpreter"
                }
            },
            "setting": "Hospital examination room, afternoon appointment"
        },
        "decision_points": [
            {
                "id": "dp1",
                "scene": "Dr. Chen says: \"The labs confirm what I suspected. You have Hashimoto''s thyroiditis. It''s an autoimmune condition where your immune system attacks your thyroid.\" Maria looks confused and signs: \"HASH-WHAT? ATTACK? MY BODY ATTACK ITSELF?\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret Maria''s response exactly, including her confusion and fingerspelling attempt",
                        "is_optimal": true,
                        "consequences": {
                            "maria_understood": true,
                            "role_maintained": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 5,
                            "equipartial_fidelity": 4,
                            "interaction_management": 4,
                            "cultural_competence": 3
                        },
                        "next_point": "dp2",
                        "feedback": "You maintained your role while conveying Maria''s genuine confusion, prompting the doctor to explain further."
                    },
                    {
                        "id": "B",
                        "text": "Interpret and add: \"She seems confused about the medical term\"",
                        "is_optimal": false,
                        "consequences": {
                            "maria_spoken_for": true,
                            "role_boundary_crossed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 1,
                            "equipartial_fidelity": 2,
                            "interaction_management": 3,
                            "cultural_competence": 2
                        },
                        "next_point": "dp2_b",
                        "feedback": "By adding your own observation, you spoke for Maria rather than letting her express herself."
                    },
                    {
                        "id": "C",
                        "text": "Explain to Maria what Hashimoto''s means before interpreting her response",
                        "is_optimal": false,
                        "consequences": {
                            "overstepped_role": true,
                            "maria_bypassed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 0,
                            "equipartial_fidelity": 1,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "dp2_c",
                        "feedback": "You took on the doctor''s role of explaining the diagnosis. Maria deserves to hear it from her physician."
                    },
                    {
                        "id": "D",
                        "text": "Ask Dr. Chen to explain in simpler terms before continuing",
                        "is_optimal": false,
                        "consequences": {
                            "advocated_prematurely": true,
                            "dr_interrupted": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 2,
                            "equipartial_fidelity": 3,
                            "interaction_management": 1,
                            "cultural_competence": 2
                        },
                        "next_point": "dp2_d",
                        "feedback": "While your intention was good, you interrupted the flow. Maria''s own expression would have prompted this naturally."
                    }
                ]
            },
            {
                "id": "dp2",
                "scene": "Dr. Chen notices Maria''s confusion and says: \"Let me explain differently. Your thyroid - this gland here in your neck - controls your energy and metabolism. Hashimoto''s means your body is slowly damaging it.\" Maria signs: \"SO... FOREVER? CURE NONE?\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret: \"So this is permanent? There''s no cure?\"",
                        "is_optimal": true,
                        "consequences": {
                            "accurate_interpretation": true,
                            "emotional_register_maintained": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 5,
                            "role_space_management": 4,
                            "equipartial_fidelity": 5,
                            "interaction_management": 4,
                            "cultural_competence": 4
                        },
                        "next_point": "dp3",
                        "feedback": "You captured both the content and emotional weight of Maria''s question."
                    },
                    {
                        "id": "B",
                        "text": "Interpret: \"Is this permanent? Is there no cure?\"",
                        "is_optimal": false,
                        "consequences": {
                            "slightly_formal": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 3,
                            "interaction_management": 4,
                            "cultural_competence": 3
                        },
                        "next_point": "dp3",
                        "feedback": "Accurate but slightly more clinical than Maria''s emotional register."
                    },
                    {
                        "id": "C",
                        "text": "Interpret: \"She wants to know if this is permanent and if there''s treatment\"",
                        "is_optimal": false,
                        "consequences": {
                            "third_person_used": true,
                            "maria_objectified": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 1,
                            "equipartial_fidelity": 1,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_c",
                        "feedback": "Third-person interpretation removes Maria''s voice from her own healthcare conversation."
                    },
                    {
                        "id": "D",
                        "text": "Soften the interpretation: \"She''s asking about long-term outlook\"",
                        "is_optimal": false,
                        "consequences": {
                            "message_sanitized": true,
                            "maria_emotions_hidden": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 0,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_d",
                        "feedback": "You filtered out Maria''s emotional response. The doctor needs to know how she''s processing this news."
                    }
                ]
            },
            {
                "id": "dp2_b",
                "scene": "Dr. Chen pauses, looks at you, then back at Maria: \"Oh, I see. Let me explain more clearly...\" He speaks more slowly, almost condescendingly. Maria frowns and signs: \"WHY HE TALK SLOW? I UNDERSTAND FINE. WORD ''HASHIMOTO'' NEW, THAT''S ALL.\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret Maria''s response directly: \"Why are you speaking slowly? I understand fine. The word ''Hashimoto'' is just new to me.\"",
                        "is_optimal": true,
                        "consequences": {
                            "maria_advocated_self": true,
                            "relationship_repairing": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 5,
                            "role_space_management": 4,
                            "equipartial_fidelity": 5,
                            "interaction_management": 4,
                            "cultural_competence": 4
                        },
                        "next_point": "dp3",
                        "feedback": "Good recovery. By interpreting Maria''s self-advocacy, you let her correct the misunderstanding."
                    },
                    {
                        "id": "B",
                        "text": "Interpret but soften: \"She says she understands, just needs the medical term clarified\"",
                        "is_optimal": false,
                        "consequences": {
                            "maria_frustration_hidden": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 3,
                            "equipartial_fidelity": 1,
                            "interaction_management": 3,
                            "cultural_competence": 2
                        },
                        "next_point": "dp3_b",
                        "feedback": "You filtered out Maria''s frustration, preventing authentic communication."
                    },
                    {
                        "id": "C",
                        "text": "Apologize to Maria: \"I''m sorry, I shouldn''t have said that about you being confused\"",
                        "is_optimal": false,
                        "consequences": {
                            "role_abandoned": true,
                            "side_conversation": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 1,
                            "interaction_management": 0,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_recovery",
                        "feedback": "Side conversations break the interpreted interaction. Address this after the appointment."
                    },
                    {
                        "id": "D",
                        "text": "Tell Dr. Chen: \"I misspoke earlier. She''s fully capable of understanding.\"",
                        "is_optimal": false,
                        "consequences": {
                            "spoke_for_maria_again": true,
                            "compounding_error": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_damaged",
                        "feedback": "You spoke about Maria again instead of interpreting her words. Let her speak for herself."
                    }
                ]
            },
            {
                "id": "dp3",
                "scene": "Dr. Chen responds: \"It''s not curable, but very manageable with daily medication. Most patients live completely normal lives.\" Maria''s face shows relief, but then she signs: \"MEDICINE EVERY DAY? HOW LONG? COST HOW-MUCH?\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret all questions: \"Daily medication? For how long? And how much will it cost?\"",
                        "is_optimal": true,
                        "consequences": {
                            "complete_interpretation": true,
                            "practical_concerns_voiced": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 5,
                            "role_space_management": 4,
                            "equipartial_fidelity": 5,
                            "interaction_management": 5,
                            "cultural_competence": 4
                        },
                        "next_point": "dp4",
                        "feedback": "You captured all of Maria''s practical concerns, including cost - a critical healthcare access issue."
                    },
                    {
                        "id": "B",
                        "text": "Interpret: \"She has questions about the medication regimen\"",
                        "is_optimal": false,
                        "consequences": {
                            "summarized_improperly": true,
                            "cost_concern_hidden": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 0,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "dp4_summary",
                        "feedback": "Summarizing removed Maria''s specific concerns, especially about cost which may affect her treatment adherence."
                    },
                    {
                        "id": "C",
                        "text": "Interpret the first two questions only, skip the cost question",
                        "is_optimal": false,
                        "consequences": {
                            "selective_interpretation": true,
                            "cost_barrier_ignored": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 3,
                            "equipartial_fidelity": 0,
                            "interaction_management": 2,
                            "cultural_competence": 0
                        },
                        "next_point": "dp4_incomplete",
                        "feedback": "Omitting the cost question could lead to Maria not filling her prescription due to financial barriers."
                    },
                    {
                        "id": "D",
                        "text": "Interpret questions and add: \"Financial concerns are common with chronic conditions\"",
                        "is_optimal": false,
                        "consequences": {
                            "added_commentary": true,
                            "role_expansion": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 1,
                            "equipartial_fidelity": 3,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "dp4",
                        "feedback": "The added commentary, while true, is your observation, not Maria''s words."
                    }
                ]
            },
            {
                "id": "dp4",
                "scene": "Dr. Chen addresses Maria''s concerns about medication. Then the nurse enters with paperwork. Dr. Chen says to the nurse: \"Get her set up with pharmacy discount programs. These patients often struggle with costs.\" He doesn''t direct this to Maria.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret Dr. Chen''s comment to Maria so she knows what''s being said about her",
                        "is_optimal": true,
                        "consequences": {
                            "transparency_maintained": true,
                            "maria_informed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 5,
                            "equipartial_fidelity": 5,
                            "interaction_management": 5,
                            "cultural_competence": 5
                        },
                        "next_point": "dp5",
                        "feedback": "Excellent. Maria deserves to know everything being said in her healthcare appointment, including side conversations."
                    },
                    {
                        "id": "B",
                        "text": "Don''t interpret since it wasn''t directed at Maria",
                        "is_optimal": false,
                        "consequences": {
                            "maria_excluded": true,
                            "paternalism_enabled": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 2,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 0
                        },
                        "next_point": "dp5_excluded",
                        "feedback": "Maria is being discussed and decisions made about her care. She has the right to this information."
                    },
                    {
                        "id": "C",
                        "text": "Interject: \"Dr. Chen, could you direct that to Maria so I can interpret?\"",
                        "is_optimal": false,
                        "consequences": {
                            "good_intent_awkward_execution": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 3,
                            "equipartial_fidelity": 4,
                            "interaction_management": 2,
                            "cultural_competence": 3
                        },
                        "next_point": "dp5_redirect",
                        "feedback": "Good advocacy instinct, but awkward execution. Interpret the comment and the doctor will naturally adjust."
                    },
                    {
                        "id": "D",
                        "text": "Wait to see if more relevant information follows",
                        "is_optimal": false,
                        "consequences": {
                            "passive_approach": true,
                            "information_gap": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 1,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "dp5_delayed",
                        "feedback": "Waiting creates information gaps. Interpret in real-time when possible."
                    }
                ]
            },
            {
                "id": "dp5",
                "scene": "The appointment is wrapping up. Dr. Chen says: \"Any other questions?\" Maria hesitates, then signs: \"TELL FAMILY HOW? THEY WORRY. MOTHER THINK DEAF MEAN SICK ALWAYS.\" She looks at you, then back at Dr. Chen.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret: \"How do I tell my family? They''ll worry. My mother already thinks being Deaf means being sick.\"",
                        "is_optimal": true,
                        "consequences": {
                            "cultural_context_included": true,
                            "complete_message": true,
                            "maria_trusted_process": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 5,
                            "role_space_management": 5,
                            "equipartial_fidelity": 5,
                            "interaction_management": 5,
                            "cultural_competence": 5
                        },
                        "next_point": "ending_optimal",
                        "feedback": "You trusted Maria and Dr. Chen to navigate this cultural complexity together. Perfect role boundaries."
                    },
                    {
                        "id": "B",
                        "text": "Interpret the question but omit the cultural context about Deaf/sick perception",
                        "is_optimal": false,
                        "consequences": {
                            "cultural_context_filtered": true,
                            "doctor_missing_info": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 3,
                            "equipartial_fidelity": 1,
                            "interaction_management": 3,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_incomplete",
                        "feedback": "The cultural context is essential for Dr. Chen to give relevant advice about family communication."
                    },
                    {
                        "id": "C",
                        "text": "Explain Deaf cultural perspectives to Dr. Chen before interpreting Maria''s question",
                        "is_optimal": false,
                        "consequences": {
                            "cultural_broker_role": true,
                            "maria_expertise_bypassed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 1,
                            "equipartial_fidelity": 2,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "ending_overstepped",
                        "feedback": "Maria is the cultural expert here. By interpreting her words fully, she educates Dr. Chen herself."
                    },
                    {
                        "id": "D",
                        "text": "Tell Maria: \"That''s not really a medical question. Maybe ask your family for support instead.\"",
                        "is_optimal": false,
                        "consequences": {
                            "gatekeeping": true,
                            "maria_silenced": true,
                            "boundary_violation": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_failed",
                        "feedback": "This is severe role overstepping. You decided what Maria should or shouldn''t ask her doctor."
                    }
                ]
            },
            {
                "id": "dp2_c",
                "scene": "Maria looks at you with surprise as you start explaining. Dr. Chen waits, looking uncertain about who should be speaking. Maria signs: \"WAIT - YOU EXPLAIN? NOT DOCTOR?\" She seems uncomfortable.",
                "options": [
                    {
                        "id": "A",
                        "text": "Stop, apologize to both parties: \"I apologize - let me interpret what the doctor said.\" Then interpret Maria''s confusion to Dr. Chen.",
                        "is_optimal": true,
                        "consequences": {
                            "recovered_from_error": true,
                            "acknowledged_mistake": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 3,
                            "equipartial_fidelity": 3,
                            "interaction_management": 3,
                            "cultural_competence": 3
                        },
                        "next_point": "dp3",
                        "feedback": "Good recovery. Acknowledging the misstep and returning to your role helps rebuild trust."
                    },
                    {
                        "id": "B",
                        "text": "Continue explaining since you already started",
                        "is_optimal": false,
                        "consequences": {
                            "doubled_down_on_error": true,
                            "role_confusion_deepened": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 0,
                            "equipartial_fidelity": 1,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Continuing down the wrong path compounds the error. Maria deserves to hear from her doctor."
                    },
                    {
                        "id": "C",
                        "text": "Interpret Maria''s question but deflect: \"She was asking me to explain further\"",
                        "is_optimal": false,
                        "consequences": {
                            "dishonest_interpretation": true,
                            "maria_misrepresented": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_failed",
                        "feedback": "Misrepresenting Maria''s words to cover your mistake is a serious ethical violation."
                    },
                    {
                        "id": "D",
                        "text": "Ignore Maria''s question and just interpret the doctor''s original explanation",
                        "is_optimal": false,
                        "consequences": {
                            "maria_concern_dismissed": true,
                            "tension_unaddressed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 1,
                            "equipartial_fidelity": 1,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_damaged",
                        "feedback": "Ignoring Maria''s valid concern creates unaddressed tension in the interaction."
                    }
                ]
            },
            {
                "id": "dp2_d",
                "scene": "Dr. Chen looks slightly annoyed at being interrupted but adjusts: \"Of course. Maria, your test shows Hashimoto''s - that means your thyroid isn''t working well. We can treat it.\" Maria nods, but signs to you: \"YOU ASK FOR ME? I CAN ASK MYSELF.\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret Maria''s response to the doctor: \"I can ask for myself.\"",
                        "is_optimal": true,
                        "consequences": {
                            "maria_self_advocated": true,
                            "interpreter_corrected": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 3,
                            "equipartial_fidelity": 4,
                            "interaction_management": 3,
                            "cultural_competence": 3
                        },
                        "next_point": "dp3",
                        "feedback": "You let Maria assert herself. This helps restore her agency in the conversation."
                    },
                    {
                        "id": "B",
                        "text": "Don''t interpret her comment, just nod and continue with the doctor''s information",
                        "is_optimal": false,
                        "consequences": {
                            "maria_silenced_again": true,
                            "pattern_of_control": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 1,
                            "equipartial_fidelity": 0,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_damaged",
                        "feedback": "Choosing not to interpret Maria''s feedback prevents her from addressing the dynamic."
                    },
                    {
                        "id": "C",
                        "text": "Apologize to Maria privately: \"Sorry, I was trying to help\"",
                        "is_optimal": false,
                        "consequences": {
                            "side_conversation": true,
                            "excludes_doctor": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 1,
                            "equipartial_fidelity": 2,
                            "interaction_management": 1,
                            "cultural_competence": 2
                        },
                        "next_point": "dp3_recovery",
                        "feedback": "Private side conversations exclude the doctor and break transparent communication."
                    },
                    {
                        "id": "D",
                        "text": "Explain to Dr. Chen: \"Deaf patients prefer direct communication without intermediary requests\"",
                        "is_optimal": false,
                        "consequences": {
                            "speaking_for_community": true,
                            "generalizing": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 1,
                            "equipartial_fidelity": 1,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "dp3_b",
                        "feedback": "Making generalizations about Deaf patients speaks over Maria. Let her express her own preferences."
                    }
                ]
            },
            {
                "id": "dp3_b",
                "scene": "The dynamic feels awkward. Dr. Chen continues with the treatment plan. Maria is quieter now, giving shorter responses. She signs: \"MEDICINE EVERY DAY. UNDERSTAND.\" She doesn''t ask any follow-up questions.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret: \"I understand. Daily medication.\"",
                        "is_optimal": true,
                        "consequences": {
                            "accurate_if_subdued": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 4,
                            "interaction_management": 3,
                            "cultural_competence": 3
                        },
                        "next_point": "dp4",
                        "feedback": "You interpreted accurately. The subdued interaction reflects the earlier choices."
                    },
                    {
                        "id": "B",
                        "text": "Interpret and add: \"Do you have any questions about the medication?\"",
                        "is_optimal": false,
                        "consequences": {
                            "adding_content": true,
                            "compensating_inappropriately": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 2,
                            "equipartial_fidelity": 2,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "dp4",
                        "feedback": "Adding your own question continues the pattern of not trusting Maria to communicate for herself."
                    },
                    {
                        "id": "C",
                        "text": "Note to Dr. Chen: \"She seems less engaged than before\"",
                        "is_optimal": false,
                        "consequences": {
                            "commenting_on_client": true,
                            "patronizing": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 0,
                            "equipartial_fidelity": 1,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Commenting on Maria''s demeanor to the doctor is not your role and is patronizing."
                    },
                    {
                        "id": "D",
                        "text": "Interpret accurately but pause to allow space for Maria to add more",
                        "is_optimal": false,
                        "consequences": {
                            "good_intent_neutral_outcome": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 3,
                            "equipartial_fidelity": 3,
                            "interaction_management": 4,
                            "cultural_competence": 3
                        },
                        "next_point": "dp4",
                        "feedback": "Pausing is appropriate, but Maria chooses not to add more. The earlier dynamic affected engagement."
                    }
                ]
            },
            {
                "id": "dp3_c",
                "scene": "Dr. Chen looks confused when you refer to Maria in third person. Maria frowns and signs: \"HE LOOK AT YOU, NOT ME. WHY?\" The doctor has shifted focus to you as the primary communicator.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret Maria''s question directly, then redirect: \"Please address Maria directly - I''m just the interpreter.\"",
                        "is_optimal": true,
                        "consequences": {
                            "course_corrected": true,
                            "educational_moment": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 4,
                            "interaction_management": 4,
                            "cultural_competence": 3
                        },
                        "next_point": "dp4",
                        "feedback": "Good recovery. You interpreted Maria''s concern and helped redirect the dynamic."
                    },
                    {
                        "id": "B",
                        "text": "Continue in third person since the pattern is already established",
                        "is_optimal": false,
                        "consequences": {
                            "pattern_reinforced": true,
                            "maria_further_marginalized": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "Continuing the problematic pattern marginalizes Maria further from her own healthcare."
                    },
                    {
                        "id": "C",
                        "text": "Tell Maria: \"Doctors sometimes do that. It''s normal.\"",
                        "is_optimal": false,
                        "consequences": {
                            "dismissive": true,
                            "normalizing_exclusion": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_failed",
                        "feedback": "Dismissing Maria''s valid concern and normalizing exclusionary behavior is harmful."
                    },
                    {
                        "id": "D",
                        "text": "Only interpret Maria''s question without addressing the eye contact issue",
                        "is_optimal": false,
                        "consequences": {
                            "incomplete_recovery": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 2,
                            "equipartial_fidelity": 3,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "dp4",
                        "feedback": "Maria''s question was interpreted, but the dynamic issue remains unaddressed."
                    }
                ]
            },
            {
                "id": "dp3_d",
                "scene": "Dr. Chen responds clinically: \"Yes, there are treatment options.\" He continues with details, but Maria''s expression suggests she''s processing more than just medical information. She signs: \"FEEL LIKE BAD NEWS HIDDEN FROM ME.\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret: \"I feel like bad news is being hidden from me.\"",
                        "is_optimal": true,
                        "consequences": {
                            "maria_feelings_voiced": true,
                            "vulnerability_shared": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 5,
                            "role_space_management": 4,
                            "equipartial_fidelity": 5,
                            "interaction_management": 4,
                            "cultural_competence": 4
                        },
                        "next_point": "dp4",
                        "feedback": "Interpreting Maria''s emotional reality allows the doctor to address her concerns directly."
                    },
                    {
                        "id": "B",
                        "text": "Interpret as: \"She wants more detailed information\"",
                        "is_optimal": false,
                        "consequences": {
                            "emotion_filtered_out": true,
                            "trust_concern_missed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 1,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "dp4_summary",
                        "feedback": "Maria expressed a feeling of distrust, not a request for details. The emotional content matters."
                    },
                    {
                        "id": "C",
                        "text": "Reassure Maria: \"He''s not hiding anything. This is just how doctors talk.\"",
                        "is_optimal": false,
                        "consequences": {
                            "dismissed_feelings": true,
                            "counselor_role": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Reassuring instead of interpreting bypasses Maria''s right to express her concerns to her doctor."
                    },
                    {
                        "id": "D",
                        "text": "Ask Dr. Chen to slow down and check in with Maria",
                        "is_optimal": false,
                        "consequences": {
                            "speaking_for_maria": true,
                            "not_interpreting_concern": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 2,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "dp4",
                        "feedback": "You advocated but didn''t interpret Maria''s actual message about feeling excluded."
                    }
                ]
            },
            {
                "id": "dp3_recovery",
                "scene": "After your side conversation, Dr. Chen looks confused about what just happened. Maria seems uncertain. Dr. Chen clears his throat: \"Should I continue explaining the treatment?\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret the doctor''s question to Maria and let her respond",
                        "is_optimal": true,
                        "consequences": {
                            "back_on_track": true,
                            "maria_decides": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 4,
                            "interaction_management": 4,
                            "cultural_competence": 3
                        },
                        "next_point": "dp4",
                        "feedback": "Returning to proper interpretation flow helps recover the session."
                    },
                    {
                        "id": "B",
                        "text": "Answer for Maria: \"Yes, please continue\"",
                        "is_optimal": false,
                        "consequences": {
                            "spoke_for_maria": true,
                            "pattern_continues": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Answering on Maria''s behalf continues the problematic pattern of speaking for her."
                    },
                    {
                        "id": "C",
                        "text": "Explain to Dr. Chen what just happened",
                        "is_optimal": false,
                        "consequences": {
                            "more_side_conversation": true,
                            "maria_further_excluded": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 1,
                            "equipartial_fidelity": 1,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_mixed",
                        "feedback": "More side conversation excludes Maria from understanding the full interaction."
                    },
                    {
                        "id": "D",
                        "text": "Ask Maria if she wants to continue or if she needs a moment",
                        "is_optimal": false,
                        "consequences": {
                            "adding_content": true,
                            "well_intentioned": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 2,
                            "equipartial_fidelity": 2,
                            "interaction_management": 3,
                            "cultural_competence": 2
                        },
                        "next_point": "dp4",
                        "feedback": "Checking in is kind but adds your own content. Interpret the doctor''s question instead."
                    }
                ]
            },
            {
                "id": "dp3_damaged",
                "scene": "The dynamic is strained. Maria has become passive, barely engaging. Dr. Chen rushes through the treatment explanation. As he finishes, Maria signs minimally: \"OKAY. UNDERSTAND.\" But her face shows frustration.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret: \"Okay. I understand.\" Match her minimal engagement accurately.",
                        "is_optimal": true,
                        "consequences": {
                            "accurate_to_situation": true,
                            "reflects_damage": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 4,
                            "interaction_management": 3,
                            "cultural_competence": 3
                        },
                        "next_point": "ending_mixed",
                        "feedback": "Accurate interpretation. The minimal engagement reflects the impact of earlier choices."
                    },
                    {
                        "id": "B",
                        "text": "Interpret and add that she seems to have more questions",
                        "is_optimal": false,
                        "consequences": {
                            "misrepresenting_again": true,
                            "imposing_assumptions": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 1,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Adding content that Maria didn''t express continues the problematic pattern."
                    },
                    {
                        "id": "C",
                        "text": "Tell Dr. Chen: \"I think she may have more questions she''s not asking\"",
                        "is_optimal": false,
                        "consequences": {
                            "analyzing_client": true,
                            "overstepping": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Analyzing Maria''s behavior to the doctor is inappropriate. Interpret, don''t analyze."
                    },
                    {
                        "id": "D",
                        "text": "Ignore her frustration and just say: \"She understands\"",
                        "is_optimal": false,
                        "consequences": {
                            "incomplete_interpretation": true,
                            "emotional_state_hidden": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 2,
                            "equipartial_fidelity": 1,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_mixed",
                        "feedback": "While you didn''t add content, the interpretation lacked the affect register of her response."
                    }
                ]
            },
            {
                "id": "dp4_summary",
                "scene": "Dr. Chen responds to your summary with general information. Maria looks frustrated and signs: \"HE NOT ANSWER MY REAL QUESTION. COST? TIME? DETAILS?\"",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret accurately: \"He didn''t answer my actual questions. How much does it cost? How long do I take it? I need details.\"",
                        "is_optimal": true,
                        "consequences": {
                            "maria_recentered": true,
                            "specific_needs_voiced": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 5,
                            "role_space_management": 4,
                            "equipartial_fidelity": 5,
                            "interaction_management": 4,
                            "cultural_competence": 4
                        },
                        "next_point": "dp5",
                        "feedback": "Good recovery. Interpreting Maria''s specific concerns helps get the conversation back on track."
                    },
                    {
                        "id": "B",
                        "text": "Summarize again: \"She has more specific questions about the medication\"",
                        "is_optimal": false,
                        "consequences": {
                            "repeated_error": true,
                            "maria_filtered_again": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 0,
                            "interaction_management": 2,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "Repeating the summarization approach continues to filter out Maria''s actual words."
                    },
                    {
                        "id": "C",
                        "text": "Ask Dr. Chen to provide more detailed answers",
                        "is_optimal": false,
                        "consequences": {
                            "advocating_instead": true,
                            "maria_words_lost": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 1,
                            "role_space_management": 2,
                            "equipartial_fidelity": 1,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "dp5_redirect",
                        "feedback": "You advocated but didn''t interpret Maria''s actual frustration and specific questions."
                    },
                    {
                        "id": "D",
                        "text": "Interpret only the questions: \"Cost? Duration? Details?\"",
                        "is_optimal": false,
                        "consequences": {
                            "emotional_context_lost": true,
                            "partial_interpretation": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 3,
                            "equipartial_fidelity": 2,
                            "interaction_management": 3,
                            "cultural_competence": 2
                        },
                        "next_point": "dp5",
                        "feedback": "The questions were conveyed but Maria''s frustration that her questions weren''t answered was omitted."
                    }
                ]
            },
            {
                "id": "dp4_incomplete",
                "scene": "Dr. Chen provides a vague timeline but doesn''t mention cost. Later, Maria gets the prescription and sees the price. She texts you afterwards: \"$300/MONTH?! WHY YOU NOT INTERPRET WHEN I ASKED ABOUT COST?\"",
                "options": [
                    {
                        "id": "A",
                        "text": "This is a post-appointment reflection. The consequence of omitting her cost question has materialized.",
                        "is_optimal": true,
                        "consequences": {
                            "consequence_realized": true,
                            "lesson_learned": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "This is the real-world consequence. Maria couldn''t advocate for financial assistance because her question wasn''t interpreted."
                    },
                    {
                        "id": "B",
                        "text": "Reply explaining why you didn''t interpret the cost question",
                        "is_optimal": false,
                        "consequences": {
                            "post_hoc_justification": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "There''s no good justification for selective interpretation of client concerns."
                    },
                    {
                        "id": "C",
                        "text": "Offer to help her contact the doctor about financial assistance",
                        "is_optimal": false,
                        "consequences": {
                            "scope_creep": true,
                            "trying_to_fix": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 1
                        },
                        "next_point": "ending_poor",
                        "feedback": "While well-intentioned, this is outside your role. The damage was done by not interpreting."
                    },
                    {
                        "id": "D",
                        "text": "Don''t respond to the text",
                        "is_optimal": false,
                        "consequences": {
                            "avoidance": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "Avoiding accountability doesn''t undo the harm of selective interpretation."
                    }
                ]
            },
            {
                "id": "dp5_excluded",
                "scene": "Maria doesn''t know about the pharmacy assistance. She leaves. Later, she struggles to afford the medication and misses doses. This affects her health outcomes.",
                "options": [
                    {
                        "id": "A",
                        "text": "This is a consequence scene showing the real-world impact of not interpreting side conversations.",
                        "is_optimal": true,
                        "consequences": {
                            "health_outcome_affected": true,
                            "information_gap_consequence": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "When interpreters don''t interpret everything in a medical setting, patients miss critical information."
                    },
                    {
                        "id": "B",
                        "text": "Consider how this could have been prevented",
                        "is_optimal": false,
                        "consequences": {
                            "reflection": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "The answer: interpret everything, including side conversations about the patient."
                    },
                    {
                        "id": "C",
                        "text": "This wasn''t the interpreter''s fault - the doctor should have addressed Maria directly",
                        "is_optimal": false,
                        "consequences": {
                            "deflecting_responsibility": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "While true, interpreters can facilitate this by interpreting everything for the patient."
                    },
                    {
                        "id": "D",
                        "text": "Acknowledge the learning opportunity",
                        "is_optimal": false,
                        "consequences": {
                            "learning": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "Every message about a patient in their presence should be interpreted."
                    }
                ]
            },
            {
                "id": "dp5_redirect",
                "scene": "Dr. Chen redirects to Maria: \"I apologize, Maria. Let me answer your questions directly.\" He provides detailed answers about cost and offers pharmacy discount information. Maria nods, seeming more satisfied.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret the apology and detailed information accurately",
                        "is_optimal": true,
                        "consequences": {
                            "communication_restored": true,
                            "maria_informed": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 4,
                            "interaction_management": 4,
                            "cultural_competence": 4
                        },
                        "next_point": "ending_good",
                        "feedback": "The interaction recovered. Your redirect helped restore direct communication."
                    },
                    {
                        "id": "B",
                        "text": "Feel relieved and just focus on accurate interpretation from here",
                        "is_optimal": false,
                        "consequences": {
                            "appropriate_recovery": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 4,
                            "role_space_management": 4,
                            "equipartial_fidelity": 4,
                            "interaction_management": 4,
                            "cultural_competence": 3
                        },
                        "next_point": "ending_good",
                        "feedback": "Good. Focus on accurate interpretation is the right approach."
                    },
                    {
                        "id": "C",
                        "text": "Thank the doctor for redirecting",
                        "is_optimal": false,
                        "consequences": {
                            "breaking_role": true,
                            "minor_issue": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 2,
                            "equipartial_fidelity": 3,
                            "interaction_management": 3,
                            "cultural_competence": 3
                        },
                        "next_point": "ending_good",
                        "feedback": "Keep the focus on Maria and the doctor''s interaction, not your relief."
                    },
                    {
                        "id": "D",
                        "text": "Add commentary about how this is proper communication",
                        "is_optimal": false,
                        "consequences": {
                            "educational_overreach": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 2,
                            "role_space_management": 1,
                            "equipartial_fidelity": 2,
                            "interaction_management": 2,
                            "cultural_competence": 2
                        },
                        "next_point": "ending_mixed",
                        "feedback": "Adding educational commentary is outside your role in this moment."
                    }
                ]
            },
            {
                "id": "dp5_delayed",
                "scene": "By the time you decide to interpret, the nurse has left with the paperwork. Maria asks: \"WHAT THAT ABOUT?\" She knows something was said but doesn''t know what.",
                "options": [
                    {
                        "id": "A",
                        "text": "Interpret now: \"They were talking about pharmacy discount programs for you\"",
                        "is_optimal": true,
                        "consequences": {
                            "late_but_interpreted": true,
                            "maria_informed_late": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 3,
                            "equipartial_fidelity": 3,
                            "interaction_management": 2,
                            "cultural_competence": 3
                        },
                        "next_point": "ending_mixed",
                        "feedback": "Better late than never. Maria deserved to know, even if the opportunity for dialogue passed."
                    },
                    {
                        "id": "B",
                        "text": "Say \"Just logistics\" to minimize",
                        "is_optimal": false,
                        "consequences": {
                            "dismissive": true,
                            "information_withheld": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 1,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "Minimizing important information is a form of gatekeeping."
                    },
                    {
                        "id": "C",
                        "text": "Ask Dr. Chen to repeat the information for Maria",
                        "is_optimal": false,
                        "consequences": {
                            "good_recovery_attempt": true,
                            "awkward_flow": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 3,
                            "role_space_management": 3,
                            "equipartial_fidelity": 4,
                            "interaction_management": 2,
                            "cultural_competence": 3
                        },
                        "next_point": "ending_mixed",
                        "feedback": "This works but creates awkwardness. Better to interpret everything in real-time."
                    },
                    {
                        "id": "D",
                        "text": "Say you didn''t catch it",
                        "is_optimal": false,
                        "consequences": {
                            "dishonest": true,
                            "avoidance": true
                        },
                        "score_impact": {
                            "linguistic_accuracy": 0,
                            "role_space_management": 0,
                            "equipartial_fidelity": 0,
                            "interaction_management": 0,
                            "cultural_competence": 0
                        },
                        "next_point": "ending_poor",
                        "feedback": "Dishonesty about what was said undermines trust and the interpreting relationship."
                    }
                ]
            }
        ],
        "endings": {
            "optimal": {
                "description": "Maria leaves feeling heard, informed, and empowered. Dr. Chen has a better understanding of Deaf patient needs. The interpretation maintained clear boundaries while enabling authentic communication.",
                "score_modifier": 5
            },
            "good": {
                "description": "The appointment concluded successfully with Maria receiving her diagnosis and treatment plan. Some communication nuances may have been lost, but the essential information was conveyed.",
                "score_modifier": 0
            },
            "incomplete": {
                "description": "Maria received the core medical information, but important cultural context was filtered out. Dr. Chen may not fully understand her family situation and the advice given may be less relevant.",
                "score_modifier": -3
            },
            "overstepped": {
                "description": "While your intentions were good, taking on the role of cultural educator bypassed Maria''s expertise about her own experience. She is fully capable of sharing her perspective when her words are interpreted faithfully.",
                "score_modifier": -5
            },
            "mixed": {
                "description": "Maria received her medical information, but the interpreter-patient-provider dynamic was strained at points. There''s room for reflection on role boundaries.",
                "score_modifier": -5
            },
            "poor": {
                "description": "The appointment was completed, but Maria''s voice was diminished by interpretation choices. Trust in the interpreting process may have been affected.",
                "score_modifier": -10
            },
            "failed": {
                "description": "Significant boundary violations occurred that undermined the interpreted interaction. Maria''s autonomy and voice were compromised. Professional development is needed.",
                "score_modifier": -20
            }
        }
    }'::jsonb,
    '{
        "practice": 45,
        "standard": 25,
        "pressure": 15,
        "expert": 10
    }'::jsonb,
    '{
        "categories": [
            {"id": "linguistic_accuracy", "label": "Linguistic Accuracy", "max": 20, "description": "Accurate message transfer between languages"},
            {"id": "role_space_management", "label": "Role-Space Management", "max": 20, "description": "Maintaining appropriate interpreter role boundaries"},
            {"id": "equipartial_fidelity", "label": "Equi-Partial Fidelity", "max": 20, "description": "Equal treatment and faithful message rendition"},
            {"id": "interaction_management", "label": "Interaction Management", "max": 20, "description": "Facilitating smooth communication flow"},
            {"id": "cultural_competence", "label": "Cultural Competence", "max": 20, "description": "Understanding and conveying cultural context"}
        ],
        "total_max_score": 100
    }'::jsonb,
    10,
    true,
    true
) ON CONFLICT (slug) DO UPDATE SET
    scenario_data = EXCLUDED.scenario_data,
    updated_at = NOW();


-- ============================================================================
-- DONE! Scenario Drills system is ready.
-- ============================================================================
