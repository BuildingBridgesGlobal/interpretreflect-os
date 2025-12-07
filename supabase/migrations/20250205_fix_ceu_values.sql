-- ============================================================================
-- FIX CEU VALUES TO CLEAN NUMBERS
-- RID reporting requires clean values like 0.05, 0.1, 0.15, 0.2, etc.
-- Not weird decimals like 0.023 or 0.027
-- ============================================================================

-- ============================================================================
-- 1. UPDATE CALCULATE_CEU_VALUE FUNCTION
-- Round to nearest 0.05 CEU (3 minute increments)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_ceu_value(duration_minutes INTEGER)
RETURNS DECIMAL(5,3) AS $$
BEGIN
    -- RID: 10 hours = 1.0 CEU, so 1 hour = 0.1 CEU
    -- Round to nearest 0.05 CEU for clean reporting
    -- 0.05 CEU = 30 minutes, so we round to nearest 30-minute block
    RETURN ROUND((duration_minutes::DECIMAL / 60) * 0.1 * 20) / 20;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_ceu_value IS 'Calculate CEU value from minutes, rounded to nearest 0.05 CEU for clean RID reporting';

-- ============================================================================
-- 2. UPDATE MODULE CEU VALUES TO CLEAN NUMBERS
-- Using standard RID calculation: round to nearest 0.05
-- ============================================================================

-- Module 1.1: Your Window of Tolerance (~15 min → 0.05 CEU)
UPDATE skill_modules SET ceu_value = 0.05 WHERE title ILIKE '%Window of Tolerance%';

-- Module 1.2: Understanding Your Nervous System (~14 min → 0.05 CEU)
UPDATE skill_modules SET ceu_value = 0.05 WHERE title ILIKE '%Understanding Your Nervous System%';

-- Module 1.3: Co-Regulation in Interpreting (~16 min → 0.05 CEU)
UPDATE skill_modules SET ceu_value = 0.05 WHERE title ILIKE '%Co-Regulation%';

-- Module 1.4: Grounding Techniques for Interpreters (~13 min → 0.05 CEU)
UPDATE skill_modules SET ceu_value = 0.05 WHERE title ILIKE '%Grounding Techniques%';

-- Module 1.5: Recovery Between Assignments (~14 min → 0.05 CEU)
UPDATE skill_modules SET ceu_value = 0.05 WHERE title ILIKE '%Recovery Between Assignments%';

-- Module 1.6: Building Nervous System Resilience (~16 min → 0.05 CEU)
UPDATE skill_modules SET ceu_value = 0.05 WHERE title ILIKE '%Building Nervous System Resilience%';

-- ============================================================================
-- 3. UPDATE SERIES TOTAL CEU VALUES
-- ============================================================================

-- NSM Series (6 modules × 0.05 = 0.30 CEU total)
UPDATE skill_series SET total_ceu_value = 0.30 WHERE title ILIKE '%Nervous System%';

-- ============================================================================
-- 4. UPDATE ANY EXISTING CERTIFICATES TO CLEAN VALUES
-- Round all certificate ceu_values to nearest 0.05
-- ============================================================================

UPDATE ceu_certificates
SET ceu_value = ROUND(ceu_value * 20) / 20
WHERE ceu_value != ROUND(ceu_value * 20) / 20;

-- ============================================================================
-- 5. UPDATE USER CEU SUMMARIES TO CLEAN VALUES
-- ============================================================================

UPDATE user_ceu_summary
SET
    professional_studies_earned = ROUND(professional_studies_earned * 20) / 20,
    ppo_earned = ROUND(ppo_earned * 20) / 20,
    general_studies_earned = ROUND(general_studies_earned * 20) / 20,
    total_earned = ROUND(total_earned * 20) / 20
WHERE
    professional_studies_earned != ROUND(professional_studies_earned * 20) / 20
    OR ppo_earned != ROUND(ppo_earned * 20) / 20
    OR general_studies_earned != ROUND(general_studies_earned * 20) / 20
    OR total_earned != ROUND(total_earned * 20) / 20;

-- ============================================================================
-- NOTE: Standard CEU value increments for RID reporting:
-- 0.05 CEU = ~30 minutes (0.5 contact hours)
-- 0.10 CEU = ~60 minutes (1 contact hour)
-- 0.15 CEU = ~90 minutes (1.5 contact hours)
-- 0.20 CEU = ~120 minutes (2 contact hours)
-- 0.25 CEU = ~150 minutes (2.5 contact hours)
-- 0.50 CEU = ~300 minutes (5 contact hours)
-- 1.00 CEU = ~600 minutes (10 contact hours)
-- ============================================================================
