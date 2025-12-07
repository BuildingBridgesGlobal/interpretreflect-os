-- ============================================================================
-- CEU (Continuing Education Unit) SYSTEM
-- RID Sponsor #2309 - InterpretReflect CEU Infrastructure
-- Effective: December 1, 2025 (aligned with RID's new "Studies of Healthy Minds and Bodies" category)
-- ============================================================================

-- ============================================================================
-- 1. ADD CEU FIELDS TO SKILL_MODULES
-- ============================================================================

-- Add CEU-related columns to skill_modules
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS ceu_value DECIMAL(5,3);
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS rid_category VARCHAR(50);
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS learning_objectives JSONB;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS assessment_questions JSONB;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS assessment_pass_threshold INTEGER DEFAULT 80;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS ceu_eligible BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN skill_modules.ceu_value IS 'CEU value for this module (10 hours = 1.0 CEU, so 1 hour = 0.1 CEU)';
COMMENT ON COLUMN skill_modules.rid_category IS 'RID CEU category: Professional Studies, PPO, General Studies';
COMMENT ON COLUMN skill_modules.learning_objectives IS 'Array of measurable learning objectives using RID terminology';
COMMENT ON COLUMN skill_modules.assessment_questions IS 'Array of assessment questions with options and correct answers';
COMMENT ON COLUMN skill_modules.assessment_pass_threshold IS 'Minimum percentage to pass assessment (default 80%)';
COMMENT ON COLUMN skill_modules.ceu_eligible IS 'Whether this module can award CEUs (requires objectives + assessment)';

-- ============================================================================
-- 2. ADD CEU FIELDS TO SKILL_SERIES
-- ============================================================================

ALTER TABLE skill_series ADD COLUMN IF NOT EXISTS total_ceu_value DECIMAL(4,2);
ALTER TABLE skill_series ADD COLUMN IF NOT EXISTS rid_category VARCHAR(50);
ALTER TABLE skill_series ADD COLUMN IF NOT EXISTS series_learning_objectives JSONB;

COMMENT ON COLUMN skill_series.total_ceu_value IS 'Total CEU value for completing entire series';
COMMENT ON COLUMN skill_series.rid_category IS 'Primary RID category for this series';

-- ============================================================================
-- 3. CEU CERTIFICATES TABLE
-- Stores issued certificates for completed modules/series
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What was completed
    module_id UUID REFERENCES skill_modules(id) ON DELETE SET NULL,
    series_id UUID REFERENCES skill_series(id) ON DELETE SET NULL,

    -- Certificate details
    certificate_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT,

    -- CEU details
    ceu_value DECIMAL(5,3) NOT NULL,
    rid_category VARCHAR(50) NOT NULL,

    -- Learning objectives achieved (copied at time of issue for record-keeping)
    learning_objectives_achieved JSONB NOT NULL,

    -- Assessment results
    assessment_score INTEGER,
    assessment_passed BOOLEAN DEFAULT true,

    -- Completion tracking
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ NOT NULL,
    time_spent_minutes INTEGER,

    -- Certificate metadata
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    issued_by VARCHAR(100) DEFAULT 'InterpretReflect',
    sponsor_number VARCHAR(20) DEFAULT '2309',

    -- For RID reporting
    rid_activity_type VARCHAR(50) DEFAULT 'SIA', -- Sponsor Initiated Activity
    reporting_period_start DATE,
    reporting_period_end DATE,

    -- Certificate status
    status VARCHAR(20) DEFAULT 'active', -- active, revoked, expired
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure either module or series is set
    CONSTRAINT certificate_has_source CHECK (module_id IS NOT NULL OR series_id IS NOT NULL)
);

-- ============================================================================
-- 4. USER CEU SUMMARY TABLE
-- Aggregated CEU tracking per user per certification cycle
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_ceu_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Certification cycle (RID uses 4-year cycles)
    cycle_start_date DATE NOT NULL,
    cycle_end_date DATE NOT NULL,

    -- CEU totals by category
    professional_studies_earned DECIMAL(4,2) DEFAULT 0,
    professional_studies_required DECIMAL(4,2) DEFAULT 6.0,

    ppo_earned DECIMAL(4,2) DEFAULT 0,
    ppo_required DECIMAL(4,2) DEFAULT 1.0,

    general_studies_earned DECIMAL(4,2) DEFAULT 0,
    general_studies_max DECIMAL(4,2) DEFAULT 2.0, -- Can only count up to 2.0 General Studies

    -- Total
    total_earned DECIMAL(4,2) DEFAULT 0,
    total_required DECIMAL(4,2) DEFAULT 8.0,

    -- Compliance tracking
    is_compliant BOOLEAN DEFAULT false,
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, cycle_start_date)
);

-- ============================================================================
-- 5. MODULE ASSESSMENT ATTEMPTS TABLE
-- Tracks user attempts at module assessments
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,

    -- Attempt details
    attempt_number INTEGER DEFAULT 1,
    answers JSONB NOT NULL, -- User's answers
    score INTEGER NOT NULL, -- Percentage score
    passed BOOLEAN NOT NULL,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent_seconds INTEGER,

    -- If passed, link to certificate
    certificate_id UUID REFERENCES ceu_certificates(id) ON DELETE SET NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. ADD ASSESSMENT FIELDS TO USER_MODULE_PROGRESS
-- ============================================================================

ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS assessment_completed BOOLEAN DEFAULT false;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS assessment_score INTEGER;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS assessment_passed BOOLEAN;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS assessment_attempts INTEGER DEFAULT 0;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES ceu_certificates(id);

-- ============================================================================
-- 7. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ceu_certificates_user ON ceu_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_module ON ceu_certificates(module_id);
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_series ON ceu_certificates(series_id);
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_number ON ceu_certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_issued ON ceu_certificates(issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_category ON ceu_certificates(rid_category);

CREATE INDEX IF NOT EXISTS idx_user_ceu_summary_user ON user_ceu_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ceu_summary_cycle ON user_ceu_summary(cycle_start_date, cycle_end_date);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user ON module_assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_module ON module_assessment_attempts(module_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ceu_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ceu_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
CREATE POLICY "Users can view own certificates"
    ON ceu_certificates FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can view their own CEU summary
CREATE POLICY "Users can view own CEU summary"
    ON user_ceu_summary FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CEU summary"
    ON user_ceu_summary FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CEU summary"
    ON user_ceu_summary FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can view their own assessment attempts
CREATE POLICY "Users can view own assessment attempts"
    ON module_assessment_attempts FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment attempts"
    ON module_assessment_attempts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_sequence INTEGER;
    v_number TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(certificate_number FROM 9) AS INTEGER)
    ), 0) + 1
    INTO v_sequence
    FROM ceu_certificates
    WHERE certificate_number LIKE 'IR-' || v_year || '-%';

    -- Format: IR-YYYY-NNNNNN (e.g., IR-2025-000001)
    v_number := 'IR-' || v_year || '-' || LPAD(v_sequence::TEXT, 6, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate CEU value from duration
-- RID Standard: 10 contact hours = 1.0 CEU, so 1 hour = 0.1 CEU
CREATE OR REPLACE FUNCTION calculate_ceu_value(duration_minutes INTEGER)
RETURNS DECIMAL(5,3) AS $$
BEGIN
    -- RID: 10 hours = 1.0 CEU, so 1 hour = 0.1 CEU, so 1 minute = 0.1/60 = 0.00167 CEU
    -- Round to nearest 0.001 CEU
    RETURN ROUND((duration_minutes::DECIMAL / 60) * 0.1 * 1000) / 1000;
END;
$$ LANGUAGE plpgsql;

-- Function to update user CEU summary after certificate issued
CREATE OR REPLACE FUNCTION update_user_ceu_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_cycle_start DATE;
    v_cycle_end DATE;
BEGIN
    -- Determine current RID cycle (simplified: calendar year for now)
    -- In production, this would use the user's actual RID certification dates
    v_cycle_start := DATE_TRUNC('year', NEW.issued_at)::DATE;
    v_cycle_end := (DATE_TRUNC('year', NEW.issued_at) + INTERVAL '1 year' - INTERVAL '1 day')::DATE;

    -- Insert or update user's CEU summary for this cycle
    INSERT INTO user_ceu_summary (
        user_id,
        cycle_start_date,
        cycle_end_date,
        professional_studies_earned,
        ppo_earned,
        general_studies_earned,
        total_earned
    )
    VALUES (
        NEW.user_id,
        v_cycle_start,
        v_cycle_end,
        CASE WHEN NEW.rid_category = 'Professional Studies' THEN NEW.ceu_value ELSE 0 END,
        CASE WHEN NEW.rid_category = 'PPO' THEN NEW.ceu_value ELSE 0 END,
        CASE WHEN NEW.rid_category = 'General Studies' THEN NEW.ceu_value ELSE 0 END,
        NEW.ceu_value
    )
    ON CONFLICT (user_id, cycle_start_date) DO UPDATE SET
        professional_studies_earned = user_ceu_summary.professional_studies_earned +
            CASE WHEN NEW.rid_category = 'Professional Studies' THEN NEW.ceu_value ELSE 0 END,
        ppo_earned = user_ceu_summary.ppo_earned +
            CASE WHEN NEW.rid_category = 'PPO' THEN NEW.ceu_value ELSE 0 END,
        general_studies_earned = user_ceu_summary.general_studies_earned +
            CASE WHEN NEW.rid_category = 'General Studies' THEN NEW.ceu_value ELSE 0 END,
        total_earned = user_ceu_summary.total_earned + NEW.ceu_value,
        is_compliant = (
            (user_ceu_summary.professional_studies_earned +
                CASE WHEN NEW.rid_category = 'Professional Studies' THEN NEW.ceu_value ELSE 0 END) >= 6.0
            AND
            (user_ceu_summary.ppo_earned +
                CASE WHEN NEW.rid_category = 'PPO' THEN NEW.ceu_value ELSE 0 END) >= 1.0
            AND
            (user_ceu_summary.total_earned + NEW.ceu_value) >= 8.0
        ),
        last_calculated_at = NOW(),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update CEU summary when certificate is issued
DROP TRIGGER IF EXISTS trigger_update_ceu_summary ON ceu_certificates;
CREATE TRIGGER trigger_update_ceu_summary
AFTER INSERT ON ceu_certificates
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION update_user_ceu_summary();

-- ============================================================================
-- 10. UPDATE EXISTING MODULES WITH CEU DATA
-- Module 1.1: Understanding Your Nervous System
-- ============================================================================

UPDATE skill_modules SET
    ceu_value = 0.025, -- 7 min content + 5 min reflection + 3 min assessment = 15 min = 0.025 CEU (RID: 10 hrs = 1 CEU)
    rid_category = 'Professional Studies',
    ceu_eligible = true,
    learning_objectives = '[
        {
            "id": "lo-1-1-1",
            "objective": "Identify the two branches of the autonomic nervous system and their roles in stress response",
            "rid_verb": "identify",
            "measurable": true
        },
        {
            "id": "lo-1-1-2",
            "objective": "Recognize physical indicators of sympathetic and parasympathetic activation in your own body",
            "rid_verb": "recognize",
            "measurable": true
        },
        {
            "id": "lo-1-1-3",
            "objective": "Explain the connection between nervous system awareness and interpreting quality",
            "rid_verb": "explain",
            "measurable": true
        },
        {
            "id": "lo-1-1-4",
            "objective": "Apply a body scan technique to assess your nervous system state before assignments",
            "rid_verb": "apply",
            "measurable": true
        }
    ]'::jsonb,
    assessment_questions = '[
        {
            "id": "q1",
            "question": "Which branch of the autonomic nervous system activates when you need energy and quick response?",
            "options": [
                {"id": "a", "text": "Parasympathetic (Brake Pedal)"},
                {"id": "b", "text": "Sympathetic (Gas Pedal)"},
                {"id": "c", "text": "Central nervous system"},
                {"id": "d", "text": "Peripheral nervous system"}
            ],
            "correct_answer": "b",
            "explanation": "The sympathetic nervous system activates when you need energy, focus, or quick response - heart rate up, muscles tense, ready to act.",
            "learning_objective_id": "lo-1-1-1"
        },
        {
            "id": "q2",
            "question": "What physical signs might indicate your sympathetic system is activated?",
            "options": [
                {"id": "a", "text": "Slow breathing and relaxed muscles"},
                {"id": "b", "text": "Feeling sleepy and calm"},
                {"id": "c", "text": "Tense shoulders, racing heart, and rapid breathing"},
                {"id": "d", "text": "Yawning and feeling peaceful"}
            ],
            "correct_answer": "c",
            "explanation": "Tense shoulders, racing heart, and rapid breathing are classic signs of sympathetic activation - your body preparing for action.",
            "learning_objective_id": "lo-1-1-2"
        },
        {
            "id": "q3",
            "question": "According to the ECCI Model, why is self-awareness considered a core competency for interpreters?",
            "options": [
                {"id": "a", "text": "It helps you interpret faster"},
                {"id": "b", "text": "You cannot manage what you do not notice"},
                {"id": "c", "text": "It makes clients trust you more"},
                {"id": "d", "text": "It is required by RID"}
            ],
            "correct_answer": "b",
            "explanation": "Self-awareness is foundational because you cannot regulate or manage your responses if you are not aware of them in the first place.",
            "learning_objective_id": "lo-1-1-3"
        },
        {
            "id": "q4",
            "question": "What is the primary goal of the body scan check-in technique?",
            "options": [
                {"id": "a", "text": "To immediately change your nervous system state"},
                {"id": "b", "text": "To diagnose medical conditions"},
                {"id": "c", "text": "To notice and observe your current state without judgment"},
                {"id": "d", "text": "To prepare your notes for the assignment"}
            ],
            "correct_answer": "c",
            "explanation": "The body scan is about awareness, not change. The goal is simply to notice your current state - you cannot regulate what you do not notice.",
            "learning_objective_id": "lo-1-1-4"
        },
        {
            "id": "q5",
            "question": "Problems with nervous system regulation can occur when:",
            "options": [
                {"id": "a", "text": "You stay in sympathetic mode too long"},
                {"id": "b", "text": "You cannot access sympathetic mode when needed"},
                {"id": "c", "text": "You do not notice which mode you are in"},
                {"id": "d", "text": "All of the above"}
            ],
            "correct_answer": "d",
            "explanation": "All three situations can cause problems: chronic sympathetic activation leads to burnout, inability to activate leads to flatness, and lack of awareness prevents any regulation.",
            "learning_objective_id": "lo-1-1-1"
        }
    ]'::jsonb,
    assessment_pass_threshold = 80
WHERE module_code = 'nsm-1-1';

-- ============================================================================
-- 11. UPDATE MODULE 1.2 WITH CEU DATA
-- ============================================================================

UPDATE skill_modules SET
    ceu_value = 0.023, -- 6 min content + 5 min reflection + 3 min assessment = 14 min = 0.023 CEU (RID: 10 hrs = 1 CEU)
    rid_category = 'Professional Studies',
    ceu_eligible = true,
    learning_objectives = '[
        {
            "id": "lo-1-2-1",
            "objective": "Define the window of tolerance concept and its relevance to interpreting performance",
            "rid_verb": "define",
            "measurable": true
        },
        {
            "id": "lo-1-2-2",
            "objective": "Identify signs of hyperarousal (above window) and hypoarousal (below window) in yourself",
            "rid_verb": "identify",
            "measurable": true
        },
        {
            "id": "lo-1-2-3",
            "objective": "Recognize patterns in which assignment types push you outside your window",
            "rid_verb": "recognize",
            "measurable": true
        },
        {
            "id": "lo-1-2-4",
            "objective": "Apply real-time window assessment before interpreting assignments",
            "rid_verb": "apply",
            "measurable": true
        }
    ]'::jsonb,
    assessment_questions = '[
        {
            "id": "q1",
            "question": "When you are INSIDE your window of tolerance, you can:",
            "options": [
                {"id": "a", "text": "Only focus on one thing at a time"},
                {"id": "b", "text": "Think clearly, stay present, and respond flexibly"},
                {"id": "c", "text": "Work faster than usual"},
                {"id": "d", "text": "Ignore emotional content completely"}
            ],
            "correct_answer": "b",
            "explanation": "Inside your window of tolerance, you can think clearly, stay present, and respond flexibly - the optimal state for interpreting.",
            "learning_objective_id": "lo-1-2-1"
        },
        {
            "id": "q2",
            "question": "Signs that you may be ABOVE your window (hyperarousal) include:",
            "options": [
                {"id": "a", "text": "Feeling numb and disconnected"},
                {"id": "b", "text": "Brain fog and feeling checked out"},
                {"id": "c", "text": "Racing thoughts, anxiety, and difficulty focusing"},
                {"id": "d", "text": "Feeling sleepy during assignments"}
            ],
            "correct_answer": "c",
            "explanation": "Hyperarousal (above the window) is characterized by racing thoughts, anxiety, overwhelm, and difficulty focusing.",
            "learning_objective_id": "lo-1-2-2"
        },
        {
            "id": "q3",
            "question": "Your window of tolerance size:",
            "options": [
                {"id": "a", "text": "Is fixed and cannot change"},
                {"id": "b", "text": "Varies day to day and can be expanded with practice"},
                {"id": "c", "text": "Only shrinks as you get older"},
                {"id": "d", "text": "Is the same for all interpreters"}
            ],
            "correct_answer": "b",
            "explanation": "Your window size is not fixed - it varies day to day based on circumstances and can be expanded through awareness and regulation practice.",
            "learning_objective_id": "lo-1-2-1"
        },
        {
            "id": "q4",
            "question": "The goal of real-time window assessment is to:",
            "options": [
                {"id": "a", "text": "Always stay perfectly calm"},
                {"id": "b", "text": "Know where you are so you can make informed choices"},
                {"id": "c", "text": "Avoid difficult assignments"},
                {"id": "d", "text": "Report your state to your agency"}
            ],
            "correct_answer": "b",
            "explanation": "The goal is not to always be in your window (unrealistic) but to KNOW where you are so you can make informed choices about preparation and recovery.",
            "learning_objective_id": "lo-1-2-4"
        }
    ]'::jsonb,
    assessment_pass_threshold = 80
WHERE module_code = 'nsm-1-2';

-- ============================================================================
-- 12. UPDATE NSM SERIES WITH CEU DATA
-- ============================================================================

UPDATE skill_series SET
    total_ceu_value = 0.15, -- 6 modules x ~0.025 CEU each = ~0.15 CEU for completing full series
    rid_category = 'Professional Studies',
    series_learning_objectives = '[
        {
            "objective": "Develop awareness and understanding of the impact of emotions on thinking and decision-making during interpreting",
            "rid_category_alignment": "Studies of Healthy Minds and Bodies"
        },
        {
            "objective": "Identify indicators of emotional distress and nervous system dysregulation",
            "rid_category_alignment": "Studies of Healthy Minds and Bodies"
        },
        {
            "objective": "Explore the management of emotional wellness in interpreting environments",
            "rid_category_alignment": "Studies of Healthy Minds and Bodies"
        },
        {
            "objective": "Develop a personal nervous system regulation plan for professional practice",
            "rid_category_alignment": "Studies of Healthy Minds and Bodies"
        }
    ]'::jsonb
WHERE series_code = 'nsm';
