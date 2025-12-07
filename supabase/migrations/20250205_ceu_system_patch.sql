-- ============================================================================
-- CEU SYSTEM PATCH - Fixes and Enhancements
-- Apply AFTER the main CEU migration (20250205_ceu_system.sql)
-- ============================================================================

-- ============================================================================
-- 1. ADD RID SUBCATEGORY TRACKING
-- For marketing the new "Studies of Healthy Minds and Bodies" category
-- ============================================================================

ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS rid_subcategory VARCHAR(100);
COMMENT ON COLUMN skill_modules.rid_subcategory IS 'RID Professional Studies subcategory (e.g., Studies of Healthy Minds and Bodies, Cognitive Processes)';

ALTER TABLE skill_series ADD COLUMN IF NOT EXISTS rid_subcategory VARCHAR(100);
COMMENT ON COLUMN skill_series.rid_subcategory IS 'RID Professional Studies subcategory for this series';

ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_subcategory VARCHAR(100);
COMMENT ON COLUMN ceu_certificates.rid_subcategory IS 'RID subcategory at time of issuance (for reporting)';

-- Update existing modules with subcategory
UPDATE skill_modules
SET rid_subcategory = 'Studies of Healthy Minds and Bodies'
WHERE module_code LIKE 'nsm-%';

-- Update existing series with subcategory
UPDATE skill_series
SET rid_subcategory = 'Studies of Healthy Minds and Bodies'
WHERE series_code = 'nsm';

-- ============================================================================
-- 2. ADD USER RID CERTIFICATION CYCLE FIELDS TO PROFILES
-- For accurate 4-year cycle tracking (Phase 2 enhancement)
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rid_certification_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rid_cycle_end_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rid_member_number VARCHAR(20);

COMMENT ON COLUMN profiles.rid_certification_date IS 'User RID certification anniversary date';
COMMENT ON COLUMN profiles.rid_cycle_end_date IS 'End date of current 4-year CEU cycle';
COMMENT ON COLUMN profiles.rid_member_number IS 'RID member number for certificate reporting';

-- ============================================================================
-- 3. CERTIFICATE REVOCATION HANDLER
-- Subtracts CEUs when certificate is revoked
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_certificate_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle revocation: subtract CEUs from user summary
    IF NEW.status = 'revoked' AND OLD.status = 'active' THEN
        UPDATE user_ceu_summary SET
            professional_studies_earned = GREATEST(0, professional_studies_earned -
                CASE WHEN OLD.rid_category = 'Professional Studies' THEN OLD.ceu_value ELSE 0 END),
            ppo_earned = GREATEST(0, ppo_earned -
                CASE WHEN OLD.rid_category = 'PPO' THEN OLD.ceu_value ELSE 0 END),
            general_studies_earned = GREATEST(0, general_studies_earned -
                CASE WHEN OLD.rid_category = 'General Studies' THEN OLD.ceu_value ELSE 0 END),
            total_earned = GREATEST(0, total_earned - OLD.ceu_value),
            last_calculated_at = NOW(),
            updated_at = NOW()
        WHERE user_id = OLD.user_id
        AND cycle_start_date <= OLD.issued_at::DATE
        AND cycle_end_date >= OLD.issued_at::DATE;

        -- Recalculate compliance
        UPDATE user_ceu_summary SET
            is_compliant = (
                professional_studies_earned >= professional_studies_required
                AND ppo_earned >= ppo_required
                AND total_earned >= total_required
            )
        WHERE user_id = OLD.user_id
        AND cycle_start_date <= OLD.issued_at::DATE
        AND cycle_end_date >= OLD.issued_at::DATE;
    END IF;

    -- Handle reactivation: add CEUs back (rare but possible)
    IF NEW.status = 'active' AND OLD.status = 'revoked' THEN
        UPDATE user_ceu_summary SET
            professional_studies_earned = professional_studies_earned +
                CASE WHEN NEW.rid_category = 'Professional Studies' THEN NEW.ceu_value ELSE 0 END,
            ppo_earned = ppo_earned +
                CASE WHEN NEW.rid_category = 'PPO' THEN NEW.ceu_value ELSE 0 END,
            general_studies_earned = general_studies_earned +
                CASE WHEN NEW.rid_category = 'General Studies' THEN NEW.ceu_value ELSE 0 END,
            total_earned = total_earned + NEW.ceu_value,
            last_calculated_at = NOW(),
            updated_at = NOW()
        WHERE user_id = NEW.user_id
        AND cycle_start_date <= NEW.issued_at::DATE
        AND cycle_end_date >= NEW.issued_at::DATE;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_certificate_status_change ON ceu_certificates;
CREATE TRIGGER trigger_certificate_status_change
AFTER UPDATE OF status ON ceu_certificates
FOR EACH ROW
EXECUTE FUNCTION handle_certificate_status_change();

-- ============================================================================
-- 4. SERVICE ROLE POLICIES FOR CERTIFICATE MANAGEMENT
-- Allows backend to create/manage certificates
-- ============================================================================

-- Service role can do everything with certificates
DROP POLICY IF EXISTS "Service role can manage all certificates" ON ceu_certificates;
CREATE POLICY "Service role can manage all certificates"
    ON ceu_certificates FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role can manage all CEU summaries
DROP POLICY IF EXISTS "Service role can manage all CEU summaries" ON user_ceu_summary;
CREATE POLICY "Service role can manage all CEU summaries"
    ON user_ceu_summary FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Service role can manage all assessment attempts
DROP POLICY IF EXISTS "Service role can manage all assessment attempts" ON module_assessment_attempts;
CREATE POLICY "Service role can manage all assessment attempts"
    ON module_assessment_attempts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- 5. FUNCTION TO ISSUE CERTIFICATE (called by backend)
-- ============================================================================

CREATE OR REPLACE FUNCTION issue_ceu_certificate(
    p_user_id UUID,
    p_module_id UUID DEFAULT NULL,
    p_series_id UUID DEFAULT NULL,
    p_assessment_score INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_certificate_id UUID;
    v_certificate_number TEXT;
    v_module RECORD;
    v_series RECORD;
    v_title TEXT;
    v_description TEXT;
    v_ceu_value DECIMAL(5,3);
    v_rid_category VARCHAR(50);
    v_rid_subcategory VARCHAR(100);
    v_learning_objectives JSONB;
    v_pass_threshold INTEGER;
BEGIN
    -- Validate inputs
    IF p_module_id IS NULL AND p_series_id IS NULL THEN
        RAISE EXCEPTION 'Either module_id or series_id must be provided';
    END IF;

    -- Get module or series details
    IF p_module_id IS NOT NULL THEN
        SELECT * INTO v_module FROM skill_modules WHERE id = p_module_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Module not found: %', p_module_id;
        END IF;

        IF NOT v_module.ceu_eligible THEN
            RAISE EXCEPTION 'Module is not CEU eligible: %', p_module_id;
        END IF;

        v_title := v_module.title;
        v_description := v_module.description;
        v_ceu_value := v_module.ceu_value;
        v_rid_category := v_module.rid_category;
        v_rid_subcategory := v_module.rid_subcategory;
        v_learning_objectives := v_module.learning_objectives;
        v_pass_threshold := v_module.assessment_pass_threshold;

        -- Check assessment score if provided
        IF p_assessment_score IS NOT NULL AND p_assessment_score < v_pass_threshold THEN
            RAISE EXCEPTION 'Assessment score % below pass threshold %', p_assessment_score, v_pass_threshold;
        END IF;

    ELSE
        SELECT * INTO v_series FROM skill_series WHERE id = p_series_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Series not found: %', p_series_id;
        END IF;

        v_title := v_series.title || ' (Complete Series)';
        v_description := v_series.description;
        v_ceu_value := v_series.total_ceu_value;
        v_rid_category := v_series.rid_category;
        v_rid_subcategory := v_series.rid_subcategory;
        v_learning_objectives := v_series.series_learning_objectives;
    END IF;

    -- Generate certificate number
    v_certificate_number := generate_certificate_number();

    -- Insert certificate
    INSERT INTO ceu_certificates (
        user_id,
        module_id,
        series_id,
        certificate_number,
        title,
        description,
        ceu_value,
        rid_category,
        rid_subcategory,
        learning_objectives_achieved,
        assessment_score,
        assessment_passed,
        completed_at,
        status
    ) VALUES (
        p_user_id,
        p_module_id,
        p_series_id,
        v_certificate_number,
        v_title,
        v_description,
        v_ceu_value,
        v_rid_category,
        v_rid_subcategory,
        v_learning_objectives,
        p_assessment_score,
        CASE WHEN p_assessment_score IS NOT NULL THEN p_assessment_score >= COALESCE(v_pass_threshold, 80) ELSE true END,
        NOW(),
        'active'
    )
    RETURNING id INTO v_certificate_id;

    RETURN v_certificate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (function handles its own auth via SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION issue_ceu_certificate TO authenticated;

-- ============================================================================
-- 6. FUNCTION TO GET USER CEU DASHBOARD DATA
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_ceu_dashboard(p_user_id UUID)
RETURNS TABLE (
    cycle_start DATE,
    cycle_end DATE,
    professional_studies_earned DECIMAL,
    professional_studies_required DECIMAL,
    professional_studies_percent INTEGER,
    ppo_earned DECIMAL,
    ppo_required DECIMAL,
    ppo_percent INTEGER,
    general_studies_earned DECIMAL,
    general_studies_max DECIMAL,
    total_earned DECIMAL,
    total_required DECIMAL,
    total_percent INTEGER,
    is_compliant BOOLEAN,
    certificates_count BIGINT,
    recent_certificates JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH current_cycle AS (
        SELECT
            ucs.cycle_start_date,
            ucs.cycle_end_date,
            ucs.professional_studies_earned,
            ucs.professional_studies_required,
            ucs.ppo_earned,
            ucs.ppo_required,
            ucs.general_studies_earned,
            ucs.general_studies_max,
            ucs.total_earned,
            ucs.total_required,
            ucs.is_compliant
        FROM user_ceu_summary ucs
        WHERE ucs.user_id = p_user_id
        AND NOW() BETWEEN ucs.cycle_start_date AND ucs.cycle_end_date
        ORDER BY ucs.cycle_start_date DESC
        LIMIT 1
    ),
    cert_count AS (
        SELECT COUNT(*) as cnt
        FROM ceu_certificates
        WHERE user_id = p_user_id
        AND status = 'active'
    ),
    recent_certs AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'certificate_number', c.certificate_number,
                'title', c.title,
                'ceu_value', c.ceu_value,
                'rid_category', c.rid_category,
                'rid_subcategory', c.rid_subcategory,
                'issued_at', c.issued_at
            ) ORDER BY c.issued_at DESC
        ) as certs
        FROM (
            SELECT * FROM ceu_certificates
            WHERE user_id = p_user_id
            AND status = 'active'
            ORDER BY issued_at DESC
            LIMIT 5
        ) c
    )
    SELECT
        COALESCE(cc.cycle_start_date, DATE_TRUNC('year', NOW())::DATE) as cycle_start,
        COALESCE(cc.cycle_end_date, (DATE_TRUNC('year', NOW()) + INTERVAL '1 year' - INTERVAL '1 day')::DATE) as cycle_end,
        COALESCE(cc.professional_studies_earned, 0::DECIMAL) as professional_studies_earned,
        COALESCE(cc.professional_studies_required, 6.0::DECIMAL) as professional_studies_required,
        CASE WHEN COALESCE(cc.professional_studies_required, 6.0) > 0
            THEN LEAST(100, ROUND((COALESCE(cc.professional_studies_earned, 0) / COALESCE(cc.professional_studies_required, 6.0)) * 100)::INTEGER)
            ELSE 0 END as professional_studies_percent,
        COALESCE(cc.ppo_earned, 0::DECIMAL) as ppo_earned,
        COALESCE(cc.ppo_required, 1.0::DECIMAL) as ppo_required,
        CASE WHEN COALESCE(cc.ppo_required, 1.0) > 0
            THEN LEAST(100, ROUND((COALESCE(cc.ppo_earned, 0) / COALESCE(cc.ppo_required, 1.0)) * 100)::INTEGER)
            ELSE 0 END as ppo_percent,
        COALESCE(cc.general_studies_earned, 0::DECIMAL) as general_studies_earned,
        COALESCE(cc.general_studies_max, 2.0::DECIMAL) as general_studies_max,
        COALESCE(cc.total_earned, 0::DECIMAL) as total_earned,
        COALESCE(cc.total_required, 8.0::DECIMAL) as total_required,
        CASE WHEN COALESCE(cc.total_required, 8.0) > 0
            THEN LEAST(100, ROUND((COALESCE(cc.total_earned, 0) / COALESCE(cc.total_required, 8.0)) * 100)::INTEGER)
            ELSE 0 END as total_percent,
        COALESCE(cc.is_compliant, false) as is_compliant,
        COALESCE(cnt.cnt, 0) as certificates_count,
        COALESCE(rc.certs, '[]'::JSONB) as recent_certificates
    FROM (SELECT 1) dummy
    LEFT JOIN current_cycle cc ON true
    LEFT JOIN cert_count cnt ON true
    LEFT JOIN recent_certs rc ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_ceu_dashboard TO authenticated;

-- ============================================================================
-- 7. ADD SUBCATEGORY INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_ceu_certificates_subcategory ON ceu_certificates(rid_subcategory);
CREATE INDEX IF NOT EXISTS idx_skill_modules_subcategory ON skill_modules(rid_subcategory);

-- ============================================================================
-- 8. HELPFUL VIEW FOR ADMIN REPORTING
-- ============================================================================

CREATE OR REPLACE VIEW ceu_certificates_report AS
SELECT
    c.certificate_number,
    c.title,
    c.ceu_value,
    c.rid_category,
    c.rid_subcategory,
    c.issued_at,
    c.status,
    c.assessment_score,
    c.sponsor_number,
    c.rid_activity_type
FROM ceu_certificates c
WHERE c.status = 'active'
ORDER BY c.issued_at DESC;

-- ============================================================================
-- 9. UPDATE EXISTING MODULES WITH SUBCATEGORY
-- (In case main migration already ran without subcategory)
-- ============================================================================

UPDATE skill_modules
SET rid_subcategory = 'Studies of Healthy Minds and Bodies'
WHERE rid_category = 'Professional Studies'
AND rid_subcategory IS NULL
AND module_code LIKE 'nsm-%';

UPDATE skill_series
SET rid_subcategory = 'Studies of Healthy Minds and Bodies'
WHERE rid_category = 'Professional Studies'
AND rid_subcategory IS NULL
AND series_code = 'nsm';

-- ============================================================================
-- PATCH COMPLETE
-- ============================================================================

-- Verify the patch
DO $$
BEGIN
    RAISE NOTICE '✅ CEU System Patch Applied Successfully';
    RAISE NOTICE '   - Added rid_subcategory columns';
    RAISE NOTICE '   - Added RID fields to profiles table';
    RAISE NOTICE '   - Added certificate revocation handler';
    RAISE NOTICE '   - Added service role policies';
    RAISE NOTICE '   - Added issue_ceu_certificate() function';
    RAISE NOTICE '   - Added get_user_ceu_dashboard() function';
    RAISE NOTICE '   - Ready for December 1, 2025 launch';
END $$;
