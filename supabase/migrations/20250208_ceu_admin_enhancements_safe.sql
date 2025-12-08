-- ============================================================================
-- CEU ADMIN ENHANCEMENTS (SAFE VERSION)
-- Run this migration when there's minimal database activity
-- ============================================================================

-- ============================================================================
-- 1. ADD INSTRUCTOR NAME TO SKILL_MODULES (IF NOT EXISTS)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'skill_modules' AND column_name = 'instructor_name'
    ) THEN
        ALTER TABLE skill_modules ADD COLUMN instructor_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'skill_modules' AND column_name = 'instructor_credentials'
    ) THEN
        ALTER TABLE skill_modules ADD COLUMN instructor_credentials VARCHAR(255);
    END IF;
END $$;

-- Default existing modules to InterpretReflect Team (only if NULL)
UPDATE skill_modules
SET instructor_name = 'InterpretReflect Professional Development Team'
WHERE instructor_name IS NULL AND ceu_eligible = true;

-- ============================================================================
-- 2. ADD INSTRUCTOR NAME TO CEU_CERTIFICATES (IF NOT EXISTS)
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ceu_certificates' AND column_name = 'instructor_name'
    ) THEN
        ALTER TABLE ceu_certificates ADD COLUMN instructor_name VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ceu_certificates' AND column_name = 'instructor_credentials'
    ) THEN
        ALTER TABLE ceu_certificates ADD COLUMN instructor_credentials VARCHAR(255);
    END IF;
END $$;

-- ============================================================================
-- 3. ADD RID DEADLINE TRACKING VIEW
-- ============================================================================

DROP VIEW IF EXISTS v_ceu_deadline_tracking CASCADE;

CREATE VIEW v_ceu_deadline_tracking AS
SELECT
    c.id,
    c.certificate_number,
    c.user_id,
    p.full_name as participant_name,
    p.email as participant_email,
    p.rid_member_number,
    c.title as module_title,
    c.ceu_value,
    c.rid_category,
    c.activity_code,
    c.completed_at,
    c.issued_at,
    c.rid_submitted_at,
    c.rid_submission_batch,
    EXTRACT(DAY FROM (NOW() - c.issued_at)) as days_since_issued,
    45 - EXTRACT(DAY FROM (NOW() - c.issued_at)) as days_until_deadline,
    CASE
        WHEN c.rid_submitted_at IS NOT NULL THEN 'submitted'
        WHEN EXTRACT(DAY FROM (NOW() - c.issued_at)) > 45 THEN 'overdue'
        WHEN EXTRACT(DAY FROM (NOW() - c.issued_at)) > 30 THEN 'urgent'
        WHEN EXTRACT(DAY FROM (NOW() - c.issued_at)) > 14 THEN 'due_soon'
        ELSE 'on_track'
    END as deadline_status
FROM ceu_certificates c
JOIN profiles p ON p.id = c.user_id
WHERE c.status = 'active'
ORDER BY c.issued_at ASC;

-- ============================================================================
-- 4. MONTHLY SUMMARY VIEW FOR RID REPORTING
-- ============================================================================

DROP VIEW IF EXISTS v_ceu_monthly_summary CASCADE;

CREATE VIEW v_ceu_monthly_summary AS
SELECT
    DATE_TRUNC('month', c.issued_at) as month,
    TO_CHAR(DATE_TRUNC('month', c.issued_at), 'YYYY-MM') as month_key,
    TO_CHAR(DATE_TRUNC('month', c.issued_at), 'Month YYYY') as month_display,
    COUNT(*) as total_certificates,
    COUNT(DISTINCT c.user_id) as unique_participants,
    SUM(c.ceu_value) as total_ceus,
    COUNT(CASE WHEN c.rid_submitted_at IS NOT NULL THEN 1 END) as submitted_count,
    COUNT(CASE WHEN c.rid_submitted_at IS NULL THEN 1 END) as pending_count,
    COUNT(CASE WHEN p.rid_member_number IS NULL THEN 1 END) as missing_rid_numbers,
    SUM(CASE WHEN c.rid_category = 'Professional Studies' THEN c.ceu_value ELSE 0 END) as ps_ceus,
    SUM(CASE WHEN c.rid_category = 'Power, Privilege & Oppression' THEN c.ceu_value ELSE 0 END) as ppo_ceus,
    SUM(CASE WHEN c.rid_category = 'General Studies' THEN c.ceu_value ELSE 0 END) as gs_ceus
FROM ceu_certificates c
JOIN profiles p ON p.id = c.user_id
WHERE c.status = 'active'
GROUP BY DATE_TRUNC('month', c.issued_at)
ORDER BY month DESC;

-- ============================================================================
-- 5. VIDEO COMPLETION ATTESTATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS video_completion_attestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,
    progress_id UUID,
    attested_at TIMESTAMPTZ DEFAULT NOW(),
    attestation_type VARCHAR(20) DEFAULT 'self_report' CHECK (attestation_type IN ('self_report', 'tracked', 'verified')),
    video_title TEXT,
    video_duration_minutes INTEGER,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_video_attestations_user ON video_completion_attestations(user_id);
CREATE INDEX IF NOT EXISTS idx_video_attestations_module ON video_completion_attestations(module_id);

-- Enable RLS
ALTER TABLE video_completion_attestations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view own attestations" ON video_completion_attestations;
DROP POLICY IF EXISTS "Users can insert own attestations" ON video_completion_attestations;

CREATE POLICY "Users can view own attestations"
    ON video_completion_attestations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attestations"
    ON video_completion_attestations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 6. GRIEVANCE TIMESTAMP TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_grievance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_grievance_updated ON ceu_grievances;
CREATE TRIGGER trigger_grievance_updated
    BEFORE UPDATE ON ceu_grievances
    FOR EACH ROW
    EXECUTE FUNCTION update_grievance_timestamp();

-- ============================================================================
-- 7. CEU ADMIN DASHBOARD FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_ceu_admin_dashboard()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'overview', (
            SELECT json_build_object(
                'total_certificates', COUNT(*),
                'total_participants', COUNT(DISTINCT user_id),
                'total_ceus', COALESCE(SUM(ceu_value), 0),
                'pending_submission', COUNT(*) FILTER (WHERE rid_submitted_at IS NULL),
                'submitted_this_month', COUNT(*) FILTER (
                    WHERE rid_submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
                ),
                'overdue_count', COUNT(*) FILTER (
                    WHERE rid_submitted_at IS NULL
                    AND issued_at < (CURRENT_DATE - INTERVAL '45 days')
                )
            )
            FROM ceu_certificates
            WHERE status = 'active'
        ),
        'deadline_alerts', (
            SELECT COALESCE(json_agg(alert ORDER BY days_until_deadline ASC), '[]'::json)
            FROM (
                SELECT
                    certificate_number,
                    participant_name,
                    module_title,
                    ceu_value,
                    issued_at,
                    days_since_issued::integer,
                    days_until_deadline::integer,
                    deadline_status
                FROM v_ceu_deadline_tracking
                WHERE rid_submitted_at IS NULL
                AND days_until_deadline <= 14
                LIMIT 10
            ) alert
        ),
        'monthly_summary', (
            SELECT COALESCE(json_agg(m ORDER BY month DESC), '[]'::json)
            FROM (
                SELECT * FROM v_ceu_monthly_summary
                LIMIT 12
            ) m
        ),
        'grievances', (
            SELECT json_build_object(
                'open', COUNT(*) FILTER (WHERE status = 'open'),
                'in_review', COUNT(*) FILTER (WHERE status = 'in_review'),
                'resolved_this_month', COUNT(*) FILTER (
                    WHERE status = 'resolved'
                    AND resolved_at >= DATE_TRUNC('month', CURRENT_DATE)
                )
            )
            FROM ceu_grievances
        ),
        'evaluations', (
            SELECT json_build_object(
                'total', COUNT(*),
                'this_month', COUNT(*) FILTER (
                    WHERE submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
                ),
                'avg_rating', ROUND(AVG(
                    (q1_objectives_clear + q2_content_relevant + q3_applicable_to_work + q4_presenter_effective) / 4.0
                )::numeric, 2)
            )
            FROM ceu_evaluations
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. RID BATCH SUBMISSION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION submit_ceu_batch_to_rid(
    p_certificate_ids UUID[],
    p_admin_id UUID,
    p_batch_id VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_batch_id VARCHAR;
    v_count INTEGER;
    v_submission_id UUID;
BEGIN
    v_batch_id := COALESCE(p_batch_id, 'RID-' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24MI'));

    UPDATE ceu_certificates
    SET
        rid_submitted_at = NOW(),
        rid_submitted_by = p_admin_id,
        rid_submission_batch = v_batch_id,
        updated_at = NOW()
    WHERE id = ANY(p_certificate_ids)
    AND rid_submitted_at IS NULL
    AND status = 'active';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Only create submission record if rid_submissions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rid_submissions') THEN
        INSERT INTO rid_submissions (
            submitted_by,
            period_start,
            period_end,
            record_count,
            total_ceu_value,
            certificate_ids,
            notes
        )
        SELECT
            p_admin_id,
            MIN(c.issued_at)::date,
            MAX(c.issued_at)::date,
            v_count,
            SUM(c.ceu_value),
            p_certificate_ids,
            p_notes
        FROM ceu_certificates c
        WHERE c.id = ANY(p_certificate_ids)
        RETURNING id INTO v_submission_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'certificates_submitted', v_count,
        'submission_id', v_submission_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
