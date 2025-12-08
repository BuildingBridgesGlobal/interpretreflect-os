-- ============================================================================
-- CEU COMPLIANCE FLOW - RID Audit-Ready System
-- Migration: 20250207_ceu_compliance_flow
-- ============================================================================

-- ============================================================================
-- 1. UPDATE PROFILES TABLE - Add CEU-required fields
-- ============================================================================

-- Phone number (RID requires contact info)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Certification type (CMP vs ACET distinction)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certification_type VARCHAR(20)
    CHECK (certification_type IN ('CMP', 'ACET', 'none', NULL));

-- State licenses (multi-select, stored as array)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS licensed_states TEXT[];

-- Track if user has completed CEU info form
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ceu_info_completed BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ceu_info_completed_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN profiles.phone IS 'Phone number for RID CEU records';
COMMENT ON COLUMN profiles.certification_type IS 'CMP (certified), ACET (not yet certified), or none';
COMMENT ON COLUMN profiles.licensed_states IS 'Array of US state abbreviations where interpreter holds license';
COMMENT ON COLUMN profiles.ceu_info_completed IS 'True when user has filled out CEU info gate form';

-- ============================================================================
-- 2. UPDATE USER_MODULE_PROGRESS - Add CEU tracking fields
-- ============================================================================

-- Track if user wants CEUs for this module
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS wants_ceu BOOLEAN DEFAULT true;

-- Explicit completion percentage (for 100% verification)
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS video_completion_percent INTEGER DEFAULT 0;

-- Track if video was completed (100%)
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS video_completed BOOLEAN DEFAULT false;

-- Track evaluation completion
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS evaluation_completed BOOLEAN DEFAULT false;
ALTER TABLE user_module_progress ADD COLUMN IF NOT EXISTS evaluation_id UUID;

-- Add comments
COMMENT ON COLUMN user_module_progress.wants_ceu IS 'False if user selected "I dont need CEUs"';
COMMENT ON COLUMN user_module_progress.video_completion_percent IS 'Tracked video watch percentage (must reach 100)';
COMMENT ON COLUMN user_module_progress.video_completed IS 'True when video reached 100% completion';
COMMENT ON COLUMN user_module_progress.evaluation_completed IS 'True when post-quiz evaluation submitted';

-- ============================================================================
-- 3. CREATE EVALUATIONS TABLE - RID-required post-activity evaluations
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,
    progress_id UUID REFERENCES user_module_progress(id) ON DELETE SET NULL,

    -- Standard evaluation questions (5-point Likert scale: 1-5)
    q1_objectives_clear INTEGER CHECK (q1_objectives_clear BETWEEN 1 AND 5),
    q2_content_relevant INTEGER CHECK (q2_content_relevant BETWEEN 1 AND 5),
    q3_applicable_to_work INTEGER CHECK (q3_applicable_to_work BETWEEN 1 AND 5),
    q4_presenter_effective INTEGER CHECK (q4_presenter_effective BETWEEN 1 AND 5),

    -- Open-ended feedback
    q5_most_valuable TEXT,
    q6_suggestions TEXT,

    -- Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_user ON ceu_evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_module ON ceu_evaluations(module_id);
CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_submitted ON ceu_evaluations(submitted_at DESC);

-- RLS
ALTER TABLE ceu_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
    ON ceu_evaluations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own evaluations"
    ON ceu_evaluations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE ceu_evaluations IS 'RID-required post-workshop evaluations for CEU compliance';

-- ============================================================================
-- 4. UPDATE CEU_CERTIFICATES TABLE - Add RID submission tracking
-- ============================================================================

-- Track if certificate was submitted to RID
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS submitted_to_rid BOOLEAN DEFAULT false;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_date TIMESTAMPTZ;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_batch_id UUID;

-- Activity code (required on certificates)
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50);

-- Link to evaluation
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS evaluation_id UUID REFERENCES ceu_evaluations(id);

-- Add comments
COMMENT ON COLUMN ceu_certificates.submitted_to_rid IS 'True when included in RID batch submission';
COMMENT ON COLUMN ceu_certificates.rid_submission_date IS 'When this cert was submitted to RID';
COMMENT ON COLUMN ceu_certificates.activity_code IS 'RID activity code (e.g., IR-PS-2024-001)';

-- ============================================================================
-- 5. CREATE RID_SUBMISSIONS TABLE - Audit trail for batch submissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS rid_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Submission details
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by UUID REFERENCES auth.users(id),

    -- Period covered
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- What was submitted
    record_count INTEGER NOT NULL,
    total_ceu_value DECIMAL(6,3),
    certificate_ids UUID[] NOT NULL, -- Array of certificate IDs included

    -- Archive
    csv_file_url TEXT, -- URL to stored CSV file

    -- RID confirmation
    confirmation_number VARCHAR(100),
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rid_submissions_date ON rid_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_rid_submissions_period ON rid_submissions(period_start, period_end);

-- RLS (admin only)
ALTER TABLE rid_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view RID submissions"
    ON rid_submissions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert RID submissions"
    ON rid_submissions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE rid_submissions IS 'Audit trail of batch CEU submissions to RID';

-- ============================================================================
-- 6. CREATE GRIEVANCES TABLE - RID requires grievance handling
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who filed it
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- What it's about
    certificate_id UUID REFERENCES ceu_certificates(id),
    module_id UUID REFERENCES skill_modules(id),

    -- Grievance details
    grievance_type VARCHAR(50) NOT NULL CHECK (grievance_type IN (
        'certificate_error',
        'content_complaint',
        'technical_issue',
        'ceu_not_received',
        'other'
    )),
    description TEXT NOT NULL,

    -- Resolution
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'closed')),
    resolution TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ceu_grievances_user ON ceu_grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_grievances_status ON ceu_grievances(status);
CREATE INDEX IF NOT EXISTS idx_ceu_grievances_created ON ceu_grievances(created_at DESC);

-- RLS
ALTER TABLE ceu_grievances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grievances"
    ON ceu_grievances FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grievances"
    ON ceu_grievances FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all grievances"
    ON ceu_grievances FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update grievances"
    ON ceu_grievances FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE ceu_grievances IS 'RID-required grievance tracking for CEU activities';

-- ============================================================================
-- 7. CREATE ADMIN ACTIVITY LOG - Audit trail for compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Who did it
    admin_id UUID NOT NULL REFERENCES auth.users(id),

    -- What they did
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'certificate', 'evaluation', 'grievance', etc.
    entity_id UUID,

    -- Details
    details JSONB,
    ip_address VARCHAR(45),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_action ON admin_activity_log(action);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);

-- RLS (admin only)
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
    ON admin_activity_log FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can insert activity log"
    ON admin_activity_log FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE admin_activity_log IS 'Audit trail of admin actions for RID compliance';

-- ============================================================================
-- 8. HELPER FUNCTION: Generate Activity Code
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_activity_code(
    p_category VARCHAR,
    p_module_code VARCHAR
)
RETURNS TEXT AS $$
DECLARE
    v_year TEXT;
    v_code TEXT;
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    -- Format: IR-{CATEGORY}-{YEAR}-{MODULE_CODE}
    -- Example: IR-PS-2025-NSM-1-1
    v_code := 'IR-' ||
              UPPER(SUBSTRING(p_category FROM 1 FOR 2)) || '-' ||
              v_year || '-' ||
              UPPER(p_module_code);

    RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_activity_code IS 'Generates RID activity codes for CEU certificates';

-- ============================================================================
-- 9. FUNCTION: Check if user can receive CEU certificate
-- ============================================================================

CREATE OR REPLACE FUNCTION can_issue_ceu_certificate(
    p_user_id UUID,
    p_progress_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_profile RECORD;
    v_progress RECORD;
    v_has_evaluation BOOLEAN;
BEGIN
    -- Get profile
    SELECT ceu_info_completed, rid_member_number
    INTO v_profile
    FROM profiles
    WHERE id = p_user_id;

    -- Get progress
    SELECT wants_ceu, assessment_passed, video_completed, evaluation_completed
    INTO v_progress
    FROM user_module_progress
    WHERE id = p_progress_id;

    -- Check all requirements
    RETURN (
        v_profile.ceu_info_completed = true AND
        v_progress.wants_ceu = true AND
        v_progress.assessment_passed = true AND
        (v_progress.video_completed = true OR v_progress.video_completed IS NULL) AND
        v_progress.evaluation_completed = true
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_issue_ceu_certificate IS 'Checks if all CEU requirements are met for certificate issuance';

-- ============================================================================
-- 10. VIEW: CEU Dashboard Summary (for admin)
-- ============================================================================

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

-- ============================================================================
-- 11. VIEW: Certificates Ready for RID Submission
-- ============================================================================

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

COMMENT ON VIEW ceu_ready_for_submission IS 'Certificates ready for monthly RID batch submission';

-- ============================================================================
-- 12. Add foreign key from user_module_progress to evaluations
-- ============================================================================

ALTER TABLE user_module_progress
    ADD CONSTRAINT fk_progress_evaluation
    FOREIGN KEY (evaluation_id)
    REFERENCES ceu_evaluations(id)
    ON DELETE SET NULL;
