-- ============================================================================
-- NC HB-854 STATE COMPLIANCE SYSTEM
-- Migration: 20250207_nc_hb854_state_compliance
--
-- North Carolina House Bill 854 requires licensure for educational interpreters
-- effective October 1, 2026. This migration adds comprehensive state-level
-- CEU requirement tracking with NC-specific features.
--
-- Features:
--   1. State CEU requirements reference table
--   2. User state licenses tracking (with NC categories)
--   3. EIPA score tracking for educational interpreters
--   4. License category support (general, educational, provisional)
--   5. State compliance dashboard views
--   6. NC-specific HB-854 banner/notification system
-- ============================================================================


-- ############################################################################
-- PART 1: STATE CEU REQUIREMENTS REFERENCE TABLE
-- ############################################################################

CREATE TABLE IF NOT EXISTS state_ceu_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_code CHAR(2) NOT NULL UNIQUE,  -- US state abbreviation
    state_name VARCHAR(100) NOT NULL,
    requires_state_license BOOLEAN DEFAULT false,
    annual_ceu_requirement DECIMAL(4,2),  -- CEUs required per year
    cycle_years INTEGER DEFAULT 1,  -- Renewal cycle length
    ceu_categories JSONB DEFAULT '{}'::jsonb,  -- Category breakdown if applicable
    special_requirements TEXT,  -- State-specific notes
    regulatory_body VARCHAR(200),  -- e.g., "NC Interpreter and Transliterator Licensing Board"
    regulatory_url TEXT,
    effective_date DATE,
    last_updated DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all US states with known requirements
INSERT INTO state_ceu_requirements (state_code, state_name, requires_state_license, annual_ceu_requirement, cycle_years, special_requirements, regulatory_body, effective_date) VALUES
-- States WITH licensure requirements
('NC', 'North Carolina', true, 2.0, 1,
 'Annual license renewal. HB-854 (effective Oct 2026) adds educational interpreter licensure. EIPA 3.5+ or NCITLB-approved equivalent required for educational interpreters.',
 'NC Interpreter and Transliterator Licensing Board (NCITLB)', '2009-01-01'),
('AL', 'Alabama', true, 2.0, 2, 'Biennial renewal', 'Alabama Licensure Board for Interpreters and Transliterators', '2002-01-01'),
('KS', 'Kansas', true, 2.0, 2, 'Biennial renewal', 'Kansas Commission for the Deaf and Hard of Hearing', '2009-01-01'),
('KY', 'Kentucky', true, 2.0, 1, 'Annual renewal', 'Kentucky Board of Interpreters for the Deaf and Hard of Hearing', '2002-01-01'),
('ME', 'Maine', true, 3.0, 2, 'Biennial renewal', 'Maine Department of Professional and Financial Regulation', '2010-01-01'),
('NH', 'New Hampshire', true, 2.0, 2, 'Biennial renewal', 'NH Board of Licensing for Interpreters for the Deaf and Hard of Hearing', '2009-01-01'),
('NM', 'New Mexico', true, 2.0, 2, 'Biennial renewal', 'New Mexico Commission for Deaf and Hard of Hearing', '2003-01-01'),
('OK', 'Oklahoma', true, 2.0, 2, 'Biennial renewal', 'Oklahoma Board of Examiners of Interpreters', '2009-01-01'),
('SC', 'South Carolina', true, 2.0, 2, 'Biennial renewal', 'SC Interpreters Licensing Board', '2002-01-01'),
('TX', 'Texas', true, 2.0, 1, 'Annual renewal. BEI certification accepted.', 'TX Dept of Assistive and Rehabilitative Services', '1979-01-01'),
('VA', 'Virginia', true, 2.0, 2, 'Biennial renewal', 'Virginia Department for the Deaf and Hard of Hearing', '2002-01-01'),
('WI', 'Wisconsin', true, 2.0, 1, 'Annual renewal', 'Wisconsin Dept of Safety and Professional Services', '2010-01-01'),
-- States WITHOUT specific licensure (RID certification accepted)
('CA', 'California', false, NULL, NULL, 'No state license. RID certification or CASLI certification accepted for most settings.', NULL, NULL),
('CO', 'Colorado', false, NULL, NULL, 'No state license. Quality assurance program exists.', NULL, NULL),
('FL', 'Florida', false, NULL, NULL, 'No state license. RID certification commonly required.', NULL, NULL),
('GA', 'Georgia', false, NULL, NULL, 'No state license required.', NULL, NULL),
('IL', 'Illinois', false, NULL, NULL, 'No state license required.', NULL, NULL),
('NY', 'New York', false, NULL, NULL, 'No state license. RID certification typically required.', NULL, NULL),
('PA', 'Pennsylvania', false, NULL, NULL, 'No state license required.', NULL, NULL),
('WA', 'Washington', false, NULL, NULL, 'No state license. DSHS maintains interpreter registry.', NULL, NULL)
ON CONFLICT (state_code) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_state_ceu_requirements_code ON state_ceu_requirements(state_code);
CREATE INDEX IF NOT EXISTS idx_state_ceu_requirements_licensed ON state_ceu_requirements(requires_state_license) WHERE requires_state_license = true;

COMMENT ON TABLE state_ceu_requirements IS 'Reference table of US state CEU/licensure requirements for interpreters';


-- ############################################################################
-- PART 2: USER STATE LICENSES TABLE
-- ############################################################################

CREATE TABLE IF NOT EXISTS user_state_licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state_code CHAR(2) NOT NULL REFERENCES state_ceu_requirements(state_code),

    -- License details
    license_number VARCHAR(50),
    license_category VARCHAR(50) DEFAULT 'general' CHECK (license_category IN ('general', 'educational', 'provisional', 'temporary', 'restricted')),
    license_status VARCHAR(30) DEFAULT 'active' CHECK (license_status IN ('active', 'expiring_soon', 'expired', 'suspended', 'revoked', 'pending')),

    -- Dates
    issue_date DATE,
    expiration_date DATE,
    renewal_date DATE,  -- When renewal application is due (often before expiration)

    -- CEU tracking for this license cycle
    ceus_earned_this_cycle DECIMAL(5,2) DEFAULT 0,
    ceus_required_this_cycle DECIMAL(5,2),
    cycle_start_date DATE,
    cycle_end_date DATE,

    -- Verification
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    verification_document_url TEXT,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_state_license UNIQUE (user_id, state_code, license_category)
);

CREATE INDEX IF NOT EXISTS idx_user_state_licenses_user ON user_state_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_state_licenses_state ON user_state_licenses(state_code);
CREATE INDEX IF NOT EXISTS idx_user_state_licenses_status ON user_state_licenses(license_status);
CREATE INDEX IF NOT EXISTS idx_user_state_licenses_expiration ON user_state_licenses(expiration_date);
CREATE INDEX IF NOT EXISTS idx_user_state_licenses_category ON user_state_licenses(license_category);

ALTER TABLE user_state_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own state licenses" ON user_state_licenses;
CREATE POLICY "Users can view own state licenses"
    ON user_state_licenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own state licenses" ON user_state_licenses;
CREATE POLICY "Users can manage own state licenses"
    ON user_state_licenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all state licenses" ON user_state_licenses;
CREATE POLICY "Admins can view all state licenses"
    ON user_state_licenses FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

COMMENT ON TABLE user_state_licenses IS 'User state interpreter licenses with CEU tracking per cycle';
COMMENT ON COLUMN user_state_licenses.license_category IS 'NC categories: general, educational (HB-854), provisional';


-- ############################################################################
-- PART 3: EIPA SCORE TRACKING (NC Educational Requirement)
-- ############################################################################

-- Add EIPA columns to credentials table
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS eipa_score DECIMAL(2,1) CHECK (eipa_score >= 0 AND eipa_score <= 5.0);
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS eipa_test_date DATE;
ALTER TABLE credentials ADD COLUMN IF NOT EXISTS eipa_certificate_url TEXT;

COMMENT ON COLUMN credentials.eipa_score IS 'Educational Interpreter Performance Assessment score (0.0-5.0). NC HB-854 requires 3.5+ for educational interpreters.';
COMMENT ON COLUMN credentials.eipa_test_date IS 'Date of EIPA assessment';


-- ############################################################################
-- PART 4: NC HB-854 SPECIFIC FEATURES
-- ############################################################################

-- NC HB-854 awareness tracking - which users have acknowledged the new law
CREATE TABLE IF NOT EXISTS nc_hb854_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledgment_type VARCHAR(50) DEFAULT 'banner_dismissed' CHECK (acknowledgment_type IN ('banner_dismissed', 'eligibility_checked', 'full_read', 'signed_up_alerts')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    CONSTRAINT unique_user_hb854_ack UNIQUE (user_id, acknowledgment_type)
);

CREATE INDEX IF NOT EXISTS idx_nc_hb854_ack_user ON nc_hb854_acknowledgments(user_id);

ALTER TABLE nc_hb854_acknowledgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own HB854 acknowledgments" ON nc_hb854_acknowledgments;
CREATE POLICY "Users can view own HB854 acknowledgments"
    ON nc_hb854_acknowledgments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own HB854 acknowledgments" ON nc_hb854_acknowledgments;
CREATE POLICY "Users can insert own HB854 acknowledgments"
    ON nc_hb854_acknowledgments FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ############################################################################
-- PART 5: HELPER FUNCTIONS
-- ############################################################################

-- Function to check NC educational interpreter eligibility
CREATE OR REPLACE FUNCTION check_nc_educational_eligibility(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_eipa_score DECIMAL(2,1);
    v_has_nc_license BOOLEAN;
    v_license_category VARCHAR(50);
    v_rid_certification BOOLEAN;
    v_result JSONB;
BEGIN
    -- Get EIPA score from credentials
    SELECT eipa_score INTO v_eipa_score
    FROM credentials
    WHERE user_id = p_user_id AND eipa_score IS NOT NULL
    ORDER BY eipa_test_date DESC NULLS LAST
    LIMIT 1;

    -- Check for existing NC license
    SELECT TRUE, license_category INTO v_has_nc_license, v_license_category
    FROM user_state_licenses
    WHERE user_id = p_user_id AND state_code = 'NC' AND license_status = 'active'
    LIMIT 1;

    -- Check for RID certification (CMP or ACET)
    SELECT TRUE INTO v_rid_certification
    FROM profiles
    WHERE id = p_user_id AND certification_type IN ('CMP', 'ACET')
    LIMIT 1;

    v_result := jsonb_build_object(
        'eipa_score', v_eipa_score,
        'eipa_meets_requirement', COALESCE(v_eipa_score >= 3.5, false),
        'has_nc_license', COALESCE(v_has_nc_license, false),
        'current_license_category', v_license_category,
        'has_rid_certification', COALESCE(v_rid_certification, false),
        'hb854_effective_date', '2026-10-01',
        'eligible_for_educational', (
            COALESCE(v_eipa_score >= 3.5, false) OR
            COALESCE(v_rid_certification, false)
        ),
        'recommendation', CASE
            WHEN v_eipa_score >= 3.5 THEN 'You meet the EIPA requirement (3.5+) for NC educational interpreter licensure.'
            WHEN v_rid_certification THEN 'Your RID certification qualifies you for NC educational interpreter licensure.'
            WHEN v_eipa_score IS NOT NULL AND v_eipa_score < 3.5 THEN 'Your EIPA score (' || v_eipa_score || ') is below the 3.5 requirement. Consider retaking the assessment or pursuing RID certification.'
            ELSE 'You need either an EIPA score of 3.5+ or RID certification (CMP/ACET) to qualify for NC educational interpreter licensure under HB-854.'
        END
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update license status based on expiration
CREATE OR REPLACE FUNCTION update_state_license_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiration_date IS NOT NULL THEN
        IF NEW.expiration_date < CURRENT_DATE THEN
            NEW.license_status := 'expired';
        ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN
            NEW.license_status := 'expiring_soon';
        ELSE
            NEW.license_status := 'active';
        END IF;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_state_license_status ON user_state_licenses;
CREATE TRIGGER trg_update_state_license_status
    BEFORE INSERT OR UPDATE OF expiration_date ON user_state_licenses
    FOR EACH ROW EXECUTE FUNCTION update_state_license_status();

-- Function to get user's state compliance summary
CREATE OR REPLACE FUNCTION get_state_compliance_summary(p_user_id UUID)
RETURNS TABLE (
    state_code CHAR(2),
    state_name VARCHAR(100),
    license_number VARCHAR(50),
    license_category VARCHAR(50),
    license_status VARCHAR(30),
    expiration_date DATE,
    ceus_earned DECIMAL(5,2),
    ceus_required DECIMAL(5,2),
    ceus_remaining DECIMAL(5,2),
    cycle_end_date DATE,
    days_until_expiration INTEGER,
    requires_attention BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        usl.state_code,
        scr.state_name,
        usl.license_number,
        usl.license_category,
        usl.license_status,
        usl.expiration_date,
        usl.ceus_earned_this_cycle,
        usl.ceus_required_this_cycle,
        GREATEST(0, usl.ceus_required_this_cycle - usl.ceus_earned_this_cycle),
        usl.cycle_end_date,
        (usl.expiration_date - CURRENT_DATE)::INTEGER,
        (usl.license_status IN ('expiring_soon', 'expired') OR
         usl.ceus_earned_this_cycle < usl.ceus_required_this_cycle * 0.5)
    FROM user_state_licenses usl
    JOIN state_ceu_requirements scr ON usl.state_code = scr.state_code
    WHERE usl.user_id = p_user_id
    ORDER BY
        CASE usl.license_status
            WHEN 'expired' THEN 1
            WHEN 'expiring_soon' THEN 2
            WHEN 'active' THEN 3
            ELSE 4
        END,
        usl.expiration_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user should see NC HB-854 banner
CREATE OR REPLACE FUNCTION should_show_nc_hb854_banner(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_nc_in_states BOOLEAN;
    v_has_dismissed BOOLEAN;
BEGIN
    -- Check if user has NC in their licensed states
    SELECT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_user_id
        AND 'NC' = ANY(licensed_states)
    ) INTO v_has_nc_in_states;

    -- Also check if they have an NC license
    IF NOT v_has_nc_in_states THEN
        SELECT EXISTS (
            SELECT 1 FROM user_state_licenses
            WHERE user_id = p_user_id AND state_code = 'NC'
        ) INTO v_has_nc_in_states;
    END IF;

    -- Check if already dismissed
    SELECT EXISTS (
        SELECT 1 FROM nc_hb854_acknowledgments
        WHERE user_id = p_user_id AND acknowledgment_type = 'banner_dismissed'
    ) INTO v_has_dismissed;

    RETURN v_has_nc_in_states AND NOT v_has_dismissed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ############################################################################
-- PART 6: VIEWS FOR DASHBOARD
-- ############################################################################

-- View for NC-licensed users needing HB-854 attention
CREATE OR REPLACE VIEW v_nc_educational_interpreters AS
SELECT
    p.id AS user_id,
    p.full_name,
    p.email,
    usl.license_number,
    usl.license_category,
    usl.expiration_date,
    c.eipa_score,
    c.eipa_test_date,
    p.certification_type AS rid_certification,
    CASE
        WHEN c.eipa_score >= 3.5 THEN true
        WHEN p.certification_type IN ('CMP', 'ACET') THEN true
        ELSE false
    END AS meets_hb854_requirements
FROM profiles p
LEFT JOIN user_state_licenses usl ON p.id = usl.user_id AND usl.state_code = 'NC'
LEFT JOIN credentials c ON p.id = c.user_id AND c.eipa_score IS NOT NULL
WHERE 'NC' = ANY(p.licensed_states) OR usl.id IS NOT NULL;

-- View for state compliance dashboard
CREATE OR REPLACE VIEW v_state_compliance_overview AS
SELECT
    scr.state_code,
    scr.state_name,
    scr.requires_state_license,
    scr.annual_ceu_requirement,
    scr.regulatory_body,
    COUNT(DISTINCT usl.user_id) AS total_licensed_users,
    COUNT(DISTINCT usl.user_id) FILTER (WHERE usl.license_status = 'active') AS active_licenses,
    COUNT(DISTINCT usl.user_id) FILTER (WHERE usl.license_status = 'expiring_soon') AS expiring_soon,
    COUNT(DISTINCT usl.user_id) FILTER (WHERE usl.license_status = 'expired') AS expired_licenses
FROM state_ceu_requirements scr
LEFT JOIN user_state_licenses usl ON scr.state_code = usl.state_code
GROUP BY scr.state_code, scr.state_name, scr.requires_state_license, scr.annual_ceu_requirement, scr.regulatory_body
ORDER BY total_licensed_users DESC NULLS LAST, scr.state_name;


-- ############################################################################
-- PART 7: LINK CEUS EARNED TO STATE LICENSES
-- ############################################################################

-- Junction table to track which certificates count toward which state licenses
CREATE TABLE IF NOT EXISTS certificate_state_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES ceu_certificates(id) ON DELETE CASCADE,
    state_license_id UUID NOT NULL REFERENCES user_state_licenses(id) ON DELETE CASCADE,
    ceu_value DECIMAL(4,2) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_cert_state_credit UNIQUE (certificate_id, state_license_id)
);

CREATE INDEX IF NOT EXISTS idx_cert_state_credits_cert ON certificate_state_credits(certificate_id);
CREATE INDEX IF NOT EXISTS idx_cert_state_credits_license ON certificate_state_credits(state_license_id);

ALTER TABLE certificate_state_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own certificate state credits" ON certificate_state_credits;
CREATE POLICY "Users can view own certificate state credits"
    ON certificate_state_credits FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ceu_certificates c
            WHERE c.id = certificate_state_credits.certificate_id
            AND c.user_id = auth.uid()
        )
    );

-- Trigger to update state license CEU totals when certificate credits are applied
CREATE OR REPLACE FUNCTION update_state_license_ceu_total()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE user_state_licenses
        SET ceus_earned_this_cycle = ceus_earned_this_cycle + NEW.ceu_value,
            updated_at = NOW()
        WHERE id = NEW.state_license_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE user_state_licenses
        SET ceus_earned_this_cycle = ceus_earned_this_cycle - OLD.ceu_value,
            updated_at = NOW()
        WHERE id = OLD.state_license_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_state_license_ceu ON certificate_state_credits;
CREATE TRIGGER trg_update_state_license_ceu
    AFTER INSERT OR DELETE ON certificate_state_credits
    FOR EACH ROW EXECUTE FUNCTION update_state_license_ceu_total();


-- ############################################################################
-- GRANTS
-- ############################################################################

GRANT SELECT ON state_ceu_requirements TO authenticated;
GRANT SELECT ON user_state_licenses TO authenticated;
GRANT SELECT ON nc_hb854_acknowledgments TO authenticated;
GRANT SELECT ON certificate_state_credits TO authenticated;

GRANT EXECUTE ON FUNCTION check_nc_educational_eligibility TO authenticated;
GRANT EXECUTE ON FUNCTION get_state_compliance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION should_show_nc_hb854_banner TO authenticated;


-- ############################################################################
-- DONE! NC HB-854 State Compliance System Ready
-- ############################################################################
