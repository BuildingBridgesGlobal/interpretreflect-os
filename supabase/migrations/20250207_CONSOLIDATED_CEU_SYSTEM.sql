-- ============================================================================
-- CONSOLIDATED CEU SYSTEM MIGRATION
-- Migration: 20250207_CONSOLIDATED_CEU_SYSTEM
--
-- This file consolidates ALL pending 20250207 migrations into one file for
-- easier application to production Supabase.
--
-- Included migrations:
--   1. 20250207_rid_member_number.sql
--   2. 20250207_ceu_compliance_flow.sql
--   3. 20250207_certificate_storage.sql
--   4. 20250207_activity_codes_and_retake.sql
--   5. 20250207_evaluations_certificate_link.sql
--   6. 20250207_elya_omnipotent_memory_safe.sql
--   7. 20250207_google_calendar_integration.sql
--   8. 20250207_scenario_drills.sql
--
-- All statements are idempotent (safe to run multiple times)
-- ============================================================================


-- ############################################################################
-- PART 1: RID MEMBER NUMBER (from 20250207_rid_member_number.sql)
-- ############################################################################

-- Add the RID member number column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rid_member_number VARCHAR(20);

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_rid_member_number
  ON profiles(rid_member_number)
  WHERE rid_member_number IS NOT NULL;

COMMENT ON COLUMN profiles.rid_member_number IS 'RID (Registry of Interpreters for the Deaf) member number for CEU tracking';


-- ############################################################################
-- PART 2: CEU COMPLIANCE FLOW (from 20250207_ceu_compliance_flow.sql)
-- ############################################################################

-- 2.1 UPDATE PROFILES TABLE - Add CEU-required fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certification_type VARCHAR(20);

-- Add constraint if it doesn't exist (wrapped in DO block for safety)
DO $$
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_certification_type_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_certification_type_check
        CHECK (certification_type IN ('CMP', 'ACET', 'none', NULL));
EXCEPTION
    WHEN others THEN NULL;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ceu_info_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ceu_info_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.phone IS 'Phone number for RID CEU records';
COMMENT ON COLUMN profiles.certification_type IS 'CMP (certified), ACET (not yet certified), or none';
COMMENT ON COLUMN profiles.licensed_states IS 'Array of US state abbreviations where interpreter holds license';
COMMENT ON COLUMN profiles.ceu_info_completed IS 'True when user has filled out CEU info gate form';

-- 2.2 UPDATE USER_MODULE_PROGRESS - Add CEU tracking fields
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS wants_ceu BOOLEAN DEFAULT true;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS video_completion_percent INTEGER DEFAULT 0;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS video_completed BOOLEAN DEFAULT false;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS evaluation_completed BOOLEAN DEFAULT false;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS evaluation_id UUID;

COMMENT ON COLUMN user_module_progress.wants_ceu IS 'False if user selected "I dont need CEUs"';
COMMENT ON COLUMN user_module_progress.video_completion_percent IS 'Tracked video watch percentage (must reach 100)';
COMMENT ON COLUMN user_module_progress.video_completed IS 'True when video reached 100% completion';
COMMENT ON COLUMN user_module_progress.evaluation_completed IS 'True when post-quiz evaluation submitted';

-- 2.3 CREATE EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS ceu_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,
    progress_id UUID REFERENCES user_module_progress(id) ON DELETE SET NULL,
    q1_objectives_clear INTEGER CHECK (q1_objectives_clear BETWEEN 1 AND 5),
    q2_content_relevant INTEGER CHECK (q2_content_relevant BETWEEN 1 AND 5),
    q3_applicable_to_work INTEGER CHECK (q3_applicable_to_work BETWEEN 1 AND 5),
    q4_presenter_effective INTEGER CHECK (q4_presenter_effective BETWEEN 1 AND 5),
    q5_most_valuable TEXT,
    q6_suggestions TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_user ON ceu_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_module ON ceu_evaluations(module_id);
CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_submitted ON ceu_evaluations(submitted_at DESC);

ALTER TABLE ceu_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own evaluations" ON ceu_evaluations;
CREATE POLICY "Users can view own evaluations"
    ON ceu_evaluations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own evaluations" ON ceu_evaluations;
CREATE POLICY "Users can insert own evaluations"
    ON ceu_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE ceu_evaluations IS 'RID-required post-workshop evaluations for CEU compliance';

-- 2.4 UPDATE CEU_CERTIFICATES TABLE - Add RID submission tracking
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS submitted_to_rid BOOLEAN DEFAULT false;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_date TIMESTAMPTZ;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_batch_id UUID;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES ceu_evaluations(id);

COMMENT ON COLUMN ceu_certificates.submitted_to_rid IS 'True when included in RID batch submission';
COMMENT ON COLUMN ceu_certificates.rid_submission_date IS 'When this cert was submitted to RID';
COMMENT ON COLUMN ceu_certificates.activity_code IS 'RID activity code (e.g., IR-PS-2024-001)';

-- 2.5 CREATE RID_SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS rid_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by UUID REFERENCES auth.users(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    record_count INTEGER NOT NULL,
    total_ceu_value DECIMAL(6,3),
    certificate_ids UUID[] NOT NULL,
    csv_file_url TEXT,
    confirmation_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rid_submissions_date ON rid_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_rid_submissions_period ON rid_submissions(period_start, period_end);

ALTER TABLE rid_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view RID submissions" ON rid_submissions;
CREATE POLICY "Admins can view RID submissions"
    ON rid_submissions FOR SELECT
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert RID submissions" ON rid_submissions;
CREATE POLICY "Admins can insert RID submissions"
    ON rid_submissions FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

COMMENT ON TABLE rid_submissions IS 'Audit trail of batch CEU submissions to RID';

-- 2.6 CREATE GRIEVANCES TABLE
CREATE TABLE IF NOT EXISTS ceu_grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_id UUID REFERENCES ceu_certificates(id),
    module_id UUID REFERENCES skill_modules(id),
    grievance_type VARCHAR(50) NOT NULL CHECK (grievance_type IN (
        'certificate_error', 'content_complaint', 'technical_issue', 'ceu_not_received', 'other'
    )),
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceu_grievances_user ON ceu_grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_grievances_status ON ceu_grievances(status);
CREATE INDEX IF NOT EXISTS idx_ceu_grievances_created ON ceu_grievances(created_at DESC);

ALTER TABLE ceu_grievances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own grievances" ON ceu_grievances;
CREATE POLICY "Users can view own grievances"
    ON ceu_grievances FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own grievances" ON ceu_grievances;
CREATE POLICY "Users can insert own grievances"
    ON ceu_grievances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all grievances" ON ceu_grievances;
CREATE POLICY "Admins can view all grievances"
    ON ceu_grievances FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can update grievances" ON ceu_grievances;
CREATE POLICY "Admins can update grievances"
    ON ceu_grievances FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

COMMENT ON TABLE ceu_grievances IS 'RID-required grievance tracking for CEU activities';

-- 2.7 CREATE ADMIN ACTIVITY LOG
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
CREATE POLICY "Admins can view activity log"
    ON admin_activity_log FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert activity log" ON admin_activity_log;
CREATE POLICY "Admins can insert activity log"
    ON admin_activity_log FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

COMMENT ON TABLE admin_activity_log IS 'Audit trail of admin actions for RID compliance';

-- 2.8 HELPER FUNCTION: Generate Activity Code
CREATE OR REPLACE FUNCTION generate_activity_code(p_category VARCHAR, p_module_code VARCHAR)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');
    RETURN 'IR-' || UPPER(SUBSTRING(p_category FROM 1 FOR 2)) || '-' || v_year || '-' || UPPER(p_module_code);
END;
$$ LANGUAGE plpgsql;

-- 2.9 FUNCTION: Check if user can receive CEU certificate
CREATE OR REPLACE FUNCTION can_issue_ceu_certificate(p_user_id UUID, p_progress_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile RECORD;
    v_progress RECORD;
BEGIN
    SELECT ceu_info_completed, rid_member_number INTO v_profile FROM profiles WHERE id = p_user_id;
    SELECT wants_ceu, assessment_passed, video_completed, evaluation_completed
    INTO v_progress FROM user_module_progress WHERE id = p_progress_id;

    RETURN (
        v_profile.ceu_info_completed = true AND
        v_progress.wants_ceu = true AND
        v_progress.assessment_passed = true AND
        (v_progress.video_completed = true OR v_progress.video_completed IS NULL) AND
        v_progress.evaluation_completed = true
    );
END;
$$ LANGUAGE plpgsql;

-- 2.10 VIEW: CEU Dashboard Summary
CREATE OR REPLACE VIEW ceu_dashboard_summary AS
SELECT
    DATE_TRUNC('month', c.completed_at) AS month,
    COUNT(*) AS total_completions,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) AS certificates_issued,
    COUNT(CASE WHEN c.submitted_to_rid = true THEN 1 END) AS submitted_to_rid,
    COUNT(CASE WHEN c.submitted_to_rid = false OR c.submitted_to_rid IS NULL THEN 1 END) AS pending_submission,
    SUM(c.ceu_value) AS total_ceu_value
FROM ceu_certificates c
GROUP BY DATE_TRUNC('month', c.completed_at)
ORDER BY month DESC;

-- 2.11 VIEW: Certificates Ready for RID Submission
CREATE OR REPLACE VIEW ceu_ready_for_submission AS
SELECT
    c.id AS certificate_id,
    c.certificate_number,
    c.activity_code,
    c.ceu_value,
    c.rid_category,
    c.completed_at,
    c.issued_at,
    p.full_name,
    p.rid_member_number,
    p.email,
    p.phone,
    p.licensed_states,
    p.certification_type,
    m.title AS module_title,
    m.module_code
FROM ceu_certificates c
JOIN profiles p ON c.user_id = p.id
LEFT JOIN skill_modules m ON c.module_id = m.id
WHERE c.status = 'active'
  AND (c.submitted_to_rid = false OR c.submitted_to_rid IS NULL)
  AND p.rid_member_number IS NOT NULL
  AND p.ceu_info_completed = true
ORDER BY c.completed_at ASC;

-- 2.12 Add FK from user_module_progress to evaluations (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_progress_evaluation' AND table_name = 'user_module_progress'
    ) THEN
        ALTER TABLE user_module_progress
            ADD CONSTRAINT fk_progress_evaluation
            FOREIGN KEY (evaluation_id)
            REFERENCES ceu_evaluations(id)
            ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;


-- ############################################################################
-- PART 3: CERTIFICATE STORAGE (from 20250207_certificate_storage.sql)
-- ############################################################################

-- Create the storage bucket for certificates (run in Supabase dashboard SQL editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificates',
    'certificates',
    false,
    5242880,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can read own certificates" ON storage.objects;
CREATE POLICY "Users can read own certificates"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'certificates'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Service role can insert certificates" ON storage.objects;
CREATE POLICY "Service role can insert certificates"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'certificates'
    AND (auth.role() = 'service_role' OR auth.uid()::TEXT = (storage.foldername(name))[1])
);

DROP POLICY IF EXISTS "Admins can read all certificates" ON storage.objects;
CREATE POLICY "Admins can read all certificates"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'certificates'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Function to get certificate PDF URL
CREATE OR REPLACE FUNCTION get_certificate_pdf_url(p_certificate_id UUID, p_expiry_seconds INTEGER DEFAULT 3600)
RETURNS TEXT AS $$
DECLARE
    v_storage_path TEXT;
    v_user_id UUID;
    v_requesting_user UUID;
BEGIN
    v_requesting_user := auth.uid();
    SELECT pdf_storage_path, user_id INTO v_storage_path, v_user_id
    FROM ceu_certificates WHERE id = p_certificate_id;

    IF v_storage_path IS NULL THEN RETURN NULL; END IF;

    IF v_requesting_user != v_user_id THEN
        IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_requesting_user AND role IN ('admin', 'super_admin')) THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    END IF;

    RETURN v_storage_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ############################################################################
-- PART 4: ACTIVITY CODES AND RETAKE (from 20250207_activity_codes_and_retake.sql)
-- ############################################################################

-- Add activity code to skill_modules
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50);
COMMENT ON COLUMN skill_modules.activity_code IS 'RID activity code for this module (e.g., IR-PS-001)';

-- Generate activity codes for existing modules (only if not set)
UPDATE skill_modules SET activity_code = 'IR-PS-' || LPAD(
    (ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0'
)
WHERE activity_code IS NULL AND ceu_eligible = true;

-- Add RID submission tracking columns
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submitted_at TIMESTAMPTZ;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submitted_by UUID REFERENCES auth.users(id);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_batch VARCHAR(50);

-- Add PDF storage columns
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

-- Function to check 3-year retake restriction
CREATE OR REPLACE FUNCTION check_ceu_retake_eligibility(p_user_id UUID, p_module_id UUID)
RETURNS TABLE (
    eligible BOOLEAN,
    reason TEXT,
    existing_certificate_id UUID,
    existing_certificate_date TIMESTAMPTZ,
    eligible_after DATE
) AS $$
DECLARE
    v_cert RECORD;
BEGIN
    SELECT c.id, c.issued_at, c.status INTO v_cert
    FROM ceu_certificates c
    WHERE c.user_id = p_user_id AND c.module_id = p_module_id AND c.status = 'active'
    ORDER BY c.issued_at DESC LIMIT 1;

    IF v_cert.id IS NULL THEN
        RETURN QUERY SELECT true::BOOLEAN, 'No previous certificate for this module'::TEXT, NULL::UUID, NULL::TIMESTAMPTZ, NULL::DATE;
        RETURN;
    END IF;

    IF v_cert.issued_at + INTERVAL '3 years' <= NOW() THEN
        RETURN QUERY SELECT true::BOOLEAN, 'More than 3 years since last certificate - eligible for new CEU'::TEXT, v_cert.id, v_cert.issued_at, NULL::DATE;
        RETURN;
    END IF;

    RETURN QUERY SELECT false::BOOLEAN, 'You earned CEU credit for this module within the last 3 years'::TEXT, v_cert.id, v_cert.issued_at, (v_cert.issued_at + INTERVAL '3 years')::DATE;
END;
$$ LANGUAGE plpgsql;

-- View for certificates pending RID submission
CREATE OR REPLACE VIEW v_certificates_pending_rid AS
SELECT c.*, p.full_name as participant_name, p.email as participant_email, p.rid_member_number, m.activity_code as module_activity_code, m.module_code
FROM ceu_certificates c
JOIN profiles p ON p.id = c.user_id
LEFT JOIN skill_modules m ON m.id = c.module_id
WHERE c.status = 'active' AND c.rid_submitted_at IS NULL
ORDER BY c.issued_at ASC;

-- Indexes for RID submission queries
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_rid_submission ON ceu_certificates(rid_submitted_at) WHERE rid_submitted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ceu_certificates_submission_batch ON ceu_certificates(rid_submission_batch);

-- Update existing certificates with activity codes
UPDATE ceu_certificates c SET activity_code = m.activity_code
FROM skill_modules m
WHERE c.module_id = m.id AND c.activity_code IS NULL AND m.activity_code IS NOT NULL;


-- ############################################################################
-- PART 5: EVALUATIONS CERTIFICATE LINK (from 20250207_evaluations_certificate_link.sql)
-- ############################################################################

ALTER TABLE ceu_evaluations ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES ceu_certificates(id);
CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_certificate ON ceu_evaluations(certificate_id);
COMMENT ON COLUMN ceu_evaluations.certificate_id IS 'The certificate issued after this evaluation was completed';


-- ############################################################################
-- PART 6: ELYA OMNIPOTENT MEMORY (from 20250207_elya_omnipotent_memory_safe.sql)
-- ############################################################################

-- 6.1 ELYA_USER_MEMORIES
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

-- 6.2 ELYA_SKILL_OBSERVATIONS
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

-- 6.3 ELYA_RECOMMENDATIONS
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
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'shown', 'accepted', 'dismissed', 'completed', 'expired')),
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

-- 6.4 ELYA_GROWTH_TIMELINE
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

-- 6.5 MODULE SKILL MAPPINGS
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

-- 6.6 Elya helper functions
CREATE OR REPLACE FUNCTION upsert_user_memory(
    p_user_id UUID, p_memory_type VARCHAR(50), p_memory_key VARCHAR(100),
    p_memory_value TEXT, p_confidence DECIMAL DEFAULT 1.0,
    p_source_type VARCHAR(30) DEFAULT 'conversation', p_source_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_memory_id UUID;
BEGIN
    UPDATE elya_user_memories SET
        memory_value = p_memory_value, confidence = GREATEST(confidence, p_confidence),
        times_reinforced = times_reinforced + 1, last_reinforced_at = NOW(), updated_at = NOW()
    WHERE user_id = p_user_id AND memory_key = p_memory_key AND is_active = true
    RETURNING id INTO v_memory_id;

    IF v_memory_id IS NULL THEN
        INSERT INTO elya_user_memories (user_id, memory_type, memory_key, memory_value, confidence, source_type, source_id)
        VALUES (p_user_id, p_memory_type, p_memory_key, p_memory_value, p_confidence, p_source_type, p_source_id)
        RETURNING id INTO v_memory_id;
    END IF;
    RETURN v_memory_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_skill_observation(
    p_user_id UUID, p_skill_domain VARCHAR(100), p_skill_concept VARCHAR(200),
    p_observation_type VARCHAR(30), p_evidence TEXT, p_severity INTEGER DEFAULT 3,
    p_source_type VARCHAR(30) DEFAULT 'conversation', p_source_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_observation_id UUID; v_existing_id UUID;
BEGIN
    SELECT id INTO v_existing_id FROM elya_skill_observations
    WHERE user_id = p_user_id AND skill_domain = p_skill_domain AND skill_concept = p_skill_concept
    AND observation_type = p_observation_type AND is_resolved = false LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        UPDATE elya_skill_observations SET
            occurrence_count = occurrence_count + 1, last_observed_at = NOW(),
            evidence = evidence || E'\n---\n' || p_evidence, severity = GREATEST(severity, p_severity)
        WHERE id = v_existing_id RETURNING id INTO v_observation_id;
    ELSE
        INSERT INTO elya_skill_observations (user_id, skill_domain, skill_concept, observation_type, evidence, severity, source_type, source_id)
        VALUES (p_user_id, p_skill_domain, p_skill_concept, p_observation_type, p_evidence, p_severity, p_source_type, p_source_id)
        RETURNING id INTO v_observation_id;
    END IF;
    RETURN v_observation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_growth_event(
    p_user_id UUID, p_event_type VARCHAR(50), p_title VARCHAR(200),
    p_description TEXT DEFAULT NULL, p_significance INTEGER DEFAULT 3,
    p_related_entity_type VARCHAR(50) DEFAULT NULL, p_related_entity_id UUID DEFAULT NULL, p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_event_id UUID;
BEGIN
    INSERT INTO elya_growth_timeline (user_id, event_type, title, description, significance, related_entity_type, related_entity_id, metadata)
    VALUES (p_user_id, p_event_type, p_title, p_description, p_significance, p_related_entity_type, p_related_entity_id, p_metadata)
    RETURNING id INTO v_event_id;
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6.7 Triggers for module completion and CEU earned
CREATE OR REPLACE FUNCTION auto_record_module_completion()
RETURNS TRIGGER AS $$
DECLARE v_module_title TEXT; v_series_title TEXT;
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        SELECT sm.title, ss.title INTO v_module_title, v_series_title
        FROM skill_modules sm LEFT JOIN skill_series ss ON sm.series_id = ss.id WHERE sm.id = NEW.module_id;
        PERFORM record_growth_event(NEW.user_id, 'module_completed', 'Completed: ' || v_module_title,
            'Finished module in ' || COALESCE(v_series_title, 'training'), 3, 'skill_module', NEW.module_id,
            jsonb_build_object('module_id', NEW.module_id, 'series_title', v_series_title, 'assessment_score', NEW.assessment_score));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_module_completion ON user_module_progress;
CREATE TRIGGER trg_record_module_completion AFTER INSERT OR UPDATE ON user_module_progress FOR EACH ROW EXECUTE FUNCTION auto_record_module_completion();

CREATE OR REPLACE FUNCTION auto_record_ceu_earned()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'active' THEN
        PERFORM record_growth_event(NEW.user_id, 'ceu_earned', 'Earned ' || NEW.ceu_value || ' CEU: ' || NEW.title,
            'Certificate #' || NEW.certificate_number, 4, 'ceu_certificate', NEW.id,
            jsonb_build_object('certificate_number', NEW.certificate_number, 'ceu_value', NEW.ceu_value, 'rid_category', NEW.rid_category));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_record_ceu_earned ON ceu_certificates;
CREATE TRIGGER trg_record_ceu_earned AFTER INSERT ON ceu_certificates FOR EACH ROW EXECUTE FUNCTION auto_record_ceu_earned();


-- ############################################################################
-- PART 7: GOOGLE CALENDAR INTEGRATION (from 20250207_google_calendar_integration.sql)
-- ############################################################################

-- 7.1 USER_CALENDAR_TOKENS
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
    sync_preferences JSONB DEFAULT '{"sync_new_assignments": true, "add_prep_reminders": true, "prep_reminder_minutes": 60, "include_team_as_attendees": true, "event_color": "auto"}'::jsonb,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_tokens_user ON user_calendar_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_tokens_active ON user_calendar_tokens(user_id, is_active) WHERE is_active = true;

ALTER TABLE user_calendar_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own calendar tokens" ON user_calendar_tokens;
CREATE POLICY "Users can view own calendar tokens" ON user_calendar_tokens FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own calendar tokens" ON user_calendar_tokens;
CREATE POLICY "Users can manage own calendar tokens" ON user_calendar_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7.2 CALENDAR_SYNC_EVENTS
CREATE TABLE IF NOT EXISTS calendar_sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL DEFAULT 'google',
    external_event_id VARCHAR(255) NOT NULL,
    external_calendar_id VARCHAR(255) DEFAULT 'primary',
    event_link TEXT,
    sync_status VARCHAR(30) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed', 'deleted', 'conflict')),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified_locally TIMESTAMPTZ,
    last_modified_externally TIMESTAMPTZ,
    sync_direction VARCHAR(20) DEFAULT 'bidirectional' CHECK (sync_direction IN ('to_calendar', 'from_calendar', 'bidirectional')),
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
CREATE POLICY "Users can view own sync events" ON calendar_sync_events FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own sync events" ON calendar_sync_events;
CREATE POLICY "Users can manage own sync events" ON calendar_sync_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7.3 CALENDAR_SYNC_LOG
CREATE TABLE IF NOT EXISTS calendar_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE SET NULL,
    sync_event_id UUID REFERENCES calendar_sync_events(id) ON DELETE SET NULL,
    action VARCHAR(30) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'refresh_token', 'full_sync', 'conflict_resolved', 'error', 'webhook_received')),
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
CREATE POLICY "Users can view own sync logs" ON calendar_sync_log FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service can manage sync logs" ON calendar_sync_log;
CREATE POLICY "Service can manage sync logs" ON calendar_sync_log FOR ALL USING (true) WITH CHECK (true);

-- 7.4 Add calendar fields to assignments
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS google_calendar_synced BOOLEAN DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS calendar_sync_enabled BOOLEAN DEFAULT true;

-- 7.5 Calendar helper functions
CREATE OR REPLACE FUNCTION upsert_calendar_token(
    p_user_id UUID, p_provider VARCHAR, p_access_token TEXT, p_refresh_token TEXT,
    p_token_expires_at TIMESTAMPTZ, p_calendar_id VARCHAR DEFAULT 'primary', p_calendar_name VARCHAR DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_token_id UUID;
BEGIN
    INSERT INTO user_calendar_tokens (user_id, provider, access_token, refresh_token, token_expires_at, calendar_id, calendar_name)
    VALUES (p_user_id, p_provider, p_access_token, p_refresh_token, p_token_expires_at, p_calendar_id, p_calendar_name)
    ON CONFLICT (user_id, provider) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, user_calendar_tokens.refresh_token),
        token_expires_at = EXCLUDED.token_expires_at,
        calendar_id = COALESCE(EXCLUDED.calendar_id, user_calendar_tokens.calendar_id),
        calendar_name = COALESCE(EXCLUDED.calendar_name, user_calendar_tokens.calendar_name),
        is_active = true, updated_at = NOW()
    RETURNING id INTO v_token_id;
    RETURN v_token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION record_calendar_sync(
    p_assignment_id UUID, p_user_id UUID, p_provider VARCHAR,
    p_external_event_id VARCHAR, p_external_calendar_id VARCHAR DEFAULT 'primary', p_event_link TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_sync_id UUID;
BEGIN
    INSERT INTO calendar_sync_events (assignment_id, user_id, provider, external_event_id, external_calendar_id, event_link, sync_status, last_synced_at)
    VALUES (p_assignment_id, p_user_id, p_provider, p_external_event_id, p_external_calendar_id, p_event_link, 'synced', NOW())
    ON CONFLICT (assignment_id, user_id, provider) DO UPDATE SET
        external_event_id = EXCLUDED.external_event_id, event_link = EXCLUDED.event_link,
        sync_status = 'synced', last_synced_at = NOW(), error_message = NULL, retry_count = 0, updated_at = NOW()
    RETURNING id INTO v_sync_id;
    UPDATE assignments SET google_calendar_synced = true WHERE id = p_assignment_id;
    RETURN v_sync_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_calendar_color_for_type(p_assignment_type TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE p_assignment_type
        WHEN 'Medical' THEN 11 WHEN 'Legal' THEN 3 WHEN 'Educational' THEN 10 WHEN 'VRS' THEN 7
        WHEN 'VRI' THEN 9 WHEN 'Community' THEN 5 WHEN 'Mental Health' THEN 1 WHEN 'Conference' THEN 6
        ELSE 8
    END;
END;
$$ LANGUAGE plpgsql;


-- ############################################################################
-- PART 8: SCENARIO DRILLS (from 20250207_scenario_drills.sql)
-- ############################################################################

-- 8.1 SCENARIO_DRILLS
CREATE TABLE IF NOT EXISTS scenario_drills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(500),
    category VARCHAR(50) NOT NULL CHECK (category IN ('medical', 'legal', 'educational', 'mental_health', 'community', 'conference', 'vrs', 'vri', 'business')),
    difficulty_base VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (difficulty_base IN ('practice', 'standard', 'pressure', 'expert')),
    ecci_focus JSONB NOT NULL DEFAULT '[]'::jsonb,
    scenario_data JSONB NOT NULL,
    timer_settings JSONB NOT NULL DEFAULT '{"practice": 45, "standard": 25, "pressure": 15, "expert": 10}'::jsonb,
    scoring_rubric JSONB NOT NULL DEFAULT '{"categories": ["linguistic_accuracy", "role_space_management", "equipartial_fidelity", "interaction_management", "cultural_competence"], "max_score_per_category": 20, "total_max_score": 100}'::jsonb,
    estimated_duration_minutes INTEGER DEFAULT 10,
    is_published BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_scenario_drills_category ON scenario_drills(category);
CREATE INDEX IF NOT EXISTS idx_scenario_drills_published ON scenario_drills(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_scenario_drills_featured ON scenario_drills(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_scenario_drills_slug ON scenario_drills(slug);

-- 8.2 USER_SCENARIO_ATTEMPTS
CREATE TABLE IF NOT EXISTS user_scenario_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenario_drills(id) ON DELETE CASCADE,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('practice', 'standard', 'pressure', 'expert')),
    decisions_made JSONB NOT NULL DEFAULT '[]'::jsonb,
    consequence_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INTEGER NOT NULL DEFAULT 0,
    max_possible_score INTEGER NOT NULL DEFAULT 100,
    percentage_score DECIMAL(5,2),
    ending_id VARCHAR(50),
    total_time_ms INTEGER,
    timeouts_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    debrief_completed BOOLEAN DEFAULT false,
    debrief_notes JSONB,
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
CREATE POLICY "Users can view own scenario attempts" ON user_scenario_attempts FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create own scenario attempts" ON user_scenario_attempts;
CREATE POLICY "Users can create own scenario attempts" ON user_scenario_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own scenario attempts" ON user_scenario_attempts;
CREATE POLICY "Users can update own scenario attempts" ON user_scenario_attempts FOR UPDATE USING (auth.uid() = user_id);

-- 8.3 USER_DRILL_PROGRESS
CREATE TABLE IF NOT EXISTS user_drill_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES scenario_drills(id) ON DELETE CASCADE,
    unlocked_difficulties JSONB NOT NULL DEFAULT '["practice"]'::jsonb,
    best_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_attempts INTEGER DEFAULT 0,
    total_completions INTEGER DEFAULT 0,
    first_played_at TIMESTAMPTZ DEFAULT NOW(),
    last_played_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_scenario_progress UNIQUE (user_id, scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_drill_progress_user ON user_drill_progress(user_id);

ALTER TABLE user_drill_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own drill progress" ON user_drill_progress;
CREATE POLICY "Users can view own drill progress" ON user_drill_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage own drill progress" ON user_drill_progress;
CREATE POLICY "Users can manage own drill progress" ON user_drill_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8.4 Drill helper functions
CREATE OR REPLACE FUNCTION update_drill_progress(p_user_id UUID, p_scenario_id UUID, p_difficulty VARCHAR, p_score INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_progress user_drill_progress%ROWTYPE;
    v_new_unlocks TEXT[] := ARRAY[]::TEXT[];
    v_current_best INTEGER;
BEGIN
    INSERT INTO user_drill_progress (user_id, scenario_id)
    VALUES (p_user_id, p_scenario_id)
    ON CONFLICT (user_id, scenario_id) DO UPDATE SET
        total_attempts = user_drill_progress.total_attempts + 1,
        total_completions = user_drill_progress.total_completions + 1,
        last_played_at = NOW()
    RETURNING * INTO v_progress;

    v_current_best := COALESCE((v_progress.best_scores ->> p_difficulty)::INTEGER, 0);
    IF p_score > v_current_best THEN
        UPDATE user_drill_progress SET best_scores = jsonb_set(COALESCE(best_scores, '{}'::jsonb), ARRAY[p_difficulty], to_jsonb(p_score)) WHERE id = v_progress.id;
    END IF;

    IF p_difficulty = 'practice' AND NOT (v_progress.unlocked_difficulties ? 'standard') THEN
        UPDATE user_drill_progress SET unlocked_difficulties = unlocked_difficulties || '["standard"]'::jsonb WHERE id = v_progress.id;
        v_new_unlocks := array_append(v_new_unlocks, 'standard');
    END IF;
    IF p_difficulty = 'standard' AND p_score >= 70 AND NOT (v_progress.unlocked_difficulties ? 'pressure') THEN
        UPDATE user_drill_progress SET unlocked_difficulties = unlocked_difficulties || '["pressure"]'::jsonb WHERE id = v_progress.id;
        v_new_unlocks := array_append(v_new_unlocks, 'pressure');
    END IF;
    IF p_difficulty = 'pressure' AND p_score >= 80 AND NOT (v_progress.unlocked_difficulties ? 'expert') THEN
        UPDATE user_drill_progress SET unlocked_difficulties = unlocked_difficulties || '["expert"]'::jsonb WHERE id = v_progress.id;
        v_new_unlocks := array_append(v_new_unlocks, 'expert');
    END IF;

    RETURN jsonb_build_object('new_unlocks', to_jsonb(v_new_unlocks), 'best_score_updated', p_score > v_current_best);
END;
$$ LANGUAGE plpgsql;

-- 8.5 Trigger for scenario stats
CREATE OR REPLACE FUNCTION update_scenario_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE scenario_drills SET
            play_count = play_count + 1,
            avg_score = (SELECT ROUND(AVG(percentage_score), 2) FROM user_scenario_attempts WHERE scenario_id = NEW.scenario_id AND status = 'completed')
        WHERE id = NEW.scenario_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_scenario_stats ON user_scenario_attempts;
CREATE TRIGGER trg_update_scenario_stats AFTER INSERT OR UPDATE ON user_scenario_attempts FOR EACH ROW EXECUTE FUNCTION update_scenario_stats();


-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT ON ceu_evaluations TO authenticated;
GRANT SELECT ON rid_submissions TO authenticated;
GRANT SELECT ON ceu_grievances TO authenticated;
GRANT SELECT ON admin_activity_log TO authenticated;
GRANT SELECT ON elya_user_memories TO authenticated;
GRANT SELECT ON elya_skill_observations TO authenticated;
GRANT SELECT ON elya_recommendations TO authenticated;
GRANT SELECT ON elya_growth_timeline TO authenticated;
GRANT SELECT ON module_skill_mappings TO authenticated;
GRANT SELECT ON user_calendar_tokens TO authenticated;
GRANT SELECT ON calendar_sync_events TO authenticated;
GRANT SELECT ON calendar_sync_log TO authenticated;
GRANT SELECT ON scenario_drills TO authenticated;
GRANT SELECT ON user_scenario_attempts TO authenticated;
GRANT SELECT ON user_drill_progress TO authenticated;


-- ############################################################################
-- DONE! All CEU system migrations have been consolidated.
-- ############################################################################
