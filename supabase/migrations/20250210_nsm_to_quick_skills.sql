-- ============================================================================
-- Move NSM (Nervous System Mastery) modules from CEU Workshops to Quick Skills
-- These 5-7 minute modules are valuable content but don't meet RID's
-- requirements for CEU-bearing activities (typically 30+ minutes)
-- ============================================================================

-- Mark all NSM modules (1.1 through 1.6) as non-CEU eligible
-- They remain as educational content under "Quick Skills"
UPDATE skill_modules
SET
    ceu_eligible = false,
    ceu_value = NULL,
    rid_category = NULL,
    updated_at = NOW()
WHERE module_code IN ('NSM-1.1', 'NSM-1.2', 'NSM-1.3', 'NSM-1.4', 'NSM-1.5', 'NSM-1.6')
   OR module_code LIKE '1.%';

-- Also update the series to reflect it's not CEU-bearing
UPDATE skill_series
SET
    total_ceu_value = NULL,
    rid_category = NULL,
    updated_at = NOW()
WHERE series_code = 'NSM' OR title ILIKE '%Nervous System%';

-- Add a module_type column to distinguish Quick Skills from CEU Workshops
-- This makes it easy to query and display separately
ALTER TABLE skill_modules
ADD COLUMN IF NOT EXISTS module_type VARCHAR(30) DEFAULT 'quick_skill';

COMMENT ON COLUMN skill_modules.module_type IS 'Type: quick_skill (short educational), ceu_workshop (CEU-bearing 30+ min)';

-- Set NSM modules explicitly as quick_skill type
UPDATE skill_modules
SET module_type = 'quick_skill'
WHERE module_code IN ('NSM-1.1', 'NSM-1.2', 'NSM-1.3', 'NSM-1.4', 'NSM-1.5', 'NSM-1.6')
   OR module_code LIKE '1.%';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_skill_modules_type ON skill_modules(module_type);
CREATE INDEX IF NOT EXISTS idx_skill_modules_ceu_eligible ON skill_modules(ceu_eligible);
