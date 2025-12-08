-- ============================================================================
-- ACTIVITY CODES AND RETAKE RESTRICTION SYSTEM
-- Adds per-module activity codes and 3-year retake restriction for CEU compliance
-- ============================================================================

-- ============================================================================
-- 1. ADD ACTIVITY CODE TO SKILL_MODULES
-- ============================================================================

ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50);

COMMENT ON COLUMN skill_modules.activity_code IS 'RID activity code for this module (e.g., IR-PS-001)';

-- Generate activity codes for existing modules
UPDATE skill_modules SET activity_code = 'IR-PS-' || LPAD(
    (ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 3, '0'
)
WHERE activity_code IS NULL AND ceu_eligible = true;

-- ============================================================================
-- 2. ADD ACTIVITY CODE TO CEU_CERTIFICATES
-- ============================================================================

ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50);

COMMENT ON COLUMN ceu_certificates.activity_code IS 'RID activity code copied from module at time of issuance';

-- ============================================================================
-- 3. ADD RID SUBMISSION TRACKING TO CERTIFICATES
-- ============================================================================

ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submitted_at TIMESTAMPTZ;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submitted_by UUID REFERENCES auth.users(id);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_batch VARCHAR(50);

COMMENT ON COLUMN ceu_certificates.rid_submitted_at IS 'When this certificate was submitted to RID';
COMMENT ON COLUMN ceu_certificates.rid_submitted_by IS 'Admin who submitted to RID';
COMMENT ON COLUMN ceu_certificates.rid_submission_batch IS 'Batch ID for RID submission (e.g., 2025-01, 2025-02)';

-- ============================================================================
-- 4. ADD PDF STORAGE PATH TO CERTIFICATES
-- ============================================================================

ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS pdf_storage_path TEXT;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN ceu_certificates.pdf_storage_path IS 'Supabase storage path to PDF file';
COMMENT ON COLUMN ceu_certificates.pdf_generated_at IS 'When the PDF was generated';

-- ============================================================================
-- 5. FUNCTION TO CHECK 3-YEAR RETAKE RESTRICTION
-- ============================================================================

CREATE OR REPLACE FUNCTION check_ceu_retake_eligibility(
    p_user_id UUID,
    p_module_id UUID
)
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
    -- Check for existing certificate for this module
    SELECT
        c.id,
        c.issued_at,
        c.status
    INTO v_cert
    FROM ceu_certificates c
    WHERE c.user_id = p_user_id
      AND c.module_id = p_module_id
      AND c.status = 'active'
    ORDER BY c.issued_at DESC
    LIMIT 1;

    -- No existing certificate - eligible
    IF v_cert.id IS NULL THEN
        RETURN QUERY SELECT
            true::BOOLEAN,
            'No previous certificate for this module'::TEXT,
            NULL::UUID,
            NULL::TIMESTAMPTZ,
            NULL::DATE;
        RETURN;
    END IF;

    -- Check if 3 years have passed (RID certification cycle consideration)
    IF v_cert.issued_at + INTERVAL '3 years' <= NOW() THEN
        RETURN QUERY SELECT
            true::BOOLEAN,
            'More than 3 years since last certificate - eligible for new CEU'::TEXT,
            v_cert.id,
            v_cert.issued_at,
            NULL::DATE;
        RETURN;
    END IF;

    -- Not eligible - within 3 year window
    RETURN QUERY SELECT
        false::BOOLEAN,
        'You earned CEU credit for this module within the last 3 years'::TEXT,
        v_cert.id,
        v_cert.issued_at,
        (v_cert.issued_at + INTERVAL '3 years')::DATE;
    RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_ceu_retake_eligibility IS 'Checks if user can earn CEU credit again for a module (3-year restriction)';

-- ============================================================================
-- 6. UPDATE ISSUE_CEU_CERTIFICATE FUNCTION TO INCLUDE ACTIVITY CODE
-- ============================================================================

CREATE OR REPLACE FUNCTION issue_ceu_certificate(
    p_user_id UUID,
    p_module_id UUID,
    p_series_id UUID DEFAULT NULL,
    p_assessment_score INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_certificate_id UUID;
    v_certificate_number TEXT;
    v_module RECORD;
    v_progress RECORD;
BEGIN
    -- Get module info
    SELECT * INTO v_module FROM skill_modules WHERE id = p_module_id;

    IF v_module IS NULL THEN
        RAISE EXCEPTION 'Module not found';
    END IF;

    -- Get progress info
    SELECT * INTO v_progress
    FROM user_module_progress
    WHERE user_id = p_user_id AND module_id = p_module_id;

    -- Generate certificate number
    v_certificate_number := generate_certificate_number();

    -- Insert certificate with activity code
    INSERT INTO ceu_certificates (
        user_id,
        module_id,
        series_id,
        certificate_number,
        activity_code,
        title,
        description,
        ceu_value,
        rid_category,
        rid_subcategory,
        learning_objectives_achieved,
        assessment_score,
        assessment_passed,
        started_at,
        completed_at,
        time_spent_minutes,
        rid_activity_type,
        status
    ) VALUES (
        p_user_id,
        p_module_id,
        p_series_id,
        v_certificate_number,
        v_module.activity_code,
        v_module.title,
        v_module.description,
        v_module.ceu_value,
        COALESCE(v_module.rid_category, 'Professional Studies'),
        v_module.rid_subcategory,
        COALESCE(v_module.learning_objectives, '[]'::jsonb),
        p_assessment_score,
        CASE WHEN p_assessment_score IS NOT NULL THEN true ELSE NULL END,
        v_progress.started_at,
        COALESCE(v_progress.completed_at, NOW()),
        COALESCE(v_progress.time_spent_seconds / 60, v_module.duration_minutes),
        'SIA',
        'active'
    ) RETURNING id INTO v_certificate_id;

    RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. FUNCTION TO MARK CERTIFICATES AS SUBMITTED TO RID
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_certificates_rid_submitted(
    p_certificate_ids UUID[],
    p_submitted_by UUID,
    p_batch_id VARCHAR DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_batch VARCHAR;
BEGIN
    -- Generate batch ID if not provided
    IF p_batch_id IS NULL THEN
        v_batch := TO_CHAR(NOW(), 'YYYY-MM');
    ELSE
        v_batch := p_batch_id;
    END IF;

    -- Update certificates
    UPDATE ceu_certificates
    SET
        rid_submitted_at = NOW(),
        rid_submitted_by = p_submitted_by,
        rid_submission_batch = v_batch,
        updated_at = NOW()
    WHERE id = ANY(p_certificate_ids)
      AND rid_submitted_at IS NULL;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log the action
    INSERT INTO admin_activity_log (
        admin_id,
        action_type,
        action_description,
        affected_count,
        metadata
    ) VALUES (
        p_submitted_by,
        'rid_submission',
        'Marked ' || v_count || ' certificates as submitted to RID',
        v_count,
        jsonb_build_object(
            'batch_id', v_batch,
            'certificate_ids', p_certificate_ids
        )
    );

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_certificates_rid_submitted IS 'Marks certificates as submitted to RID and logs the action';

-- ============================================================================
-- 8. VIEW FOR CERTIFICATES PENDING RID SUBMISSION
-- ============================================================================

CREATE OR REPLACE VIEW v_certificates_pending_rid AS
SELECT
    c.*,
    p.full_name as participant_name,
    p.email as participant_email,
    p.rid_member_number,
    m.activity_code as module_activity_code,
    m.module_code
FROM ceu_certificates c
JOIN profiles p ON p.id = c.user_id
LEFT JOIN skill_modules m ON m.id = c.module_id
WHERE c.status = 'active'
  AND c.rid_submitted_at IS NULL
ORDER BY c.issued_at ASC;

COMMENT ON VIEW v_certificates_pending_rid IS 'Certificates that have not yet been submitted to RID';

-- ============================================================================
-- 9. INDEX FOR FASTER RID SUBMISSION QUERIES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ceu_certificates_rid_submission
    ON ceu_certificates(rid_submitted_at)
    WHERE rid_submitted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ceu_certificates_submission_batch
    ON ceu_certificates(rid_submission_batch);

-- ============================================================================
-- 10. UPDATE EXISTING CERTIFICATES WITH ACTIVITY CODES
-- ============================================================================

UPDATE ceu_certificates c
SET activity_code = m.activity_code
FROM skill_modules m
WHERE c.module_id = m.id
  AND c.activity_code IS NULL
  AND m.activity_code IS NOT NULL;
