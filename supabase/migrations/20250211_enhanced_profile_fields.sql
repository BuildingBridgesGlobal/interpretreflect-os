-- ============================================
-- ENHANCED COMMUNITY PROFILE FIELDS
-- ============================================
-- Adding crucial interpreter professional info:
-- - Certifications (RID, NIC, etc.)
-- - Work settings (VRS, K-12, higher ed, etc.)
-- - Location/availability
-- - Bio/about section
-- - Languages worked
-- ============================================

-- Add professional certifications field (expanded options)
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS interpreter_certifications TEXT[] DEFAULT '{}';

-- Add work settings field (where they work)
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS work_settings TEXT[] DEFAULT '{}';

-- Add location info
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS location_city TEXT;

ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS location_state TEXT;

ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS location_country TEXT DEFAULT 'United States';

-- Add availability status
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available'
  CHECK (availability_status IN ('available', 'limited', 'not_available', 'freelance_only', 'staff_only'));

-- Add timezone
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add languages worked (source/target languages)
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS languages_worked TEXT[] DEFAULT ARRAY['ASL', 'English'];

-- Add about/headline section
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS headline TEXT;

-- Add professional background
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS professional_background TEXT;

-- Add education/training
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS education TEXT;

-- Add ITP program (Interpreter Training Program)
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS itp_program TEXT;

-- Add graduation year
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS graduation_year INTEGER;

-- Add current employer (optional)
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS current_employer TEXT;

-- Add website/portfolio link
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add LinkedIn profile
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add visibility settings for sensitive fields
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true;

ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS show_employer BOOLEAN DEFAULT false;

-- Migrate existing certifications data if any
UPDATE community_profiles
SET interpreter_certifications = certifications
WHERE interpreter_certifications = '{}'
  AND certifications != '{}'
  AND certifications IS NOT NULL;

-- Comments for new fields
COMMENT ON COLUMN community_profiles.interpreter_certifications IS 'Interpreter certifications: RID CI, RID CT, NIC, NIC Advanced, NIC Master, BEI, EIPA, CDI, SC:L, etc.';
COMMENT ON COLUMN community_profiles.work_settings IS 'Work settings: VRS, VRI, K-12, Higher Ed, Medical, Legal, Mental Health, Conference, Community, etc.';
COMMENT ON COLUMN community_profiles.location_city IS 'City of residence';
COMMENT ON COLUMN community_profiles.location_state IS 'State/province of residence';
COMMENT ON COLUMN community_profiles.availability_status IS 'Work availability: available, limited, not_available, freelance_only, staff_only';
COMMENT ON COLUMN community_profiles.languages_worked IS 'Languages worked with (e.g., ASL, English, Spanish, PSE)';
COMMENT ON COLUMN community_profiles.headline IS 'Professional headline/tagline (e.g., "RID Certified Interpreter | Medical & Legal Specialist")';
COMMENT ON COLUMN community_profiles.professional_background IS 'Brief professional background/about section';
COMMENT ON COLUMN community_profiles.education IS 'Educational background';
COMMENT ON COLUMN community_profiles.itp_program IS 'Interpreter Training Program attended';
COMMENT ON COLUMN community_profiles.graduation_year IS 'Year of ITP graduation';
COMMENT ON COLUMN community_profiles.current_employer IS 'Current employer (optional, privacy-controlled)';
COMMENT ON COLUMN community_profiles.website_url IS 'Personal website or portfolio URL';
COMMENT ON COLUMN community_profiles.linkedin_url IS 'LinkedIn profile URL';

-- Create index for location-based searches
CREATE INDEX IF NOT EXISTS idx_community_profiles_location ON community_profiles(location_state, location_city);

-- Create index for certification searches
CREATE INDEX IF NOT EXISTS idx_community_profiles_certifications ON community_profiles USING GIN(interpreter_certifications);

-- Create index for work settings searches
CREATE INDEX IF NOT EXISTS idx_community_profiles_work_settings ON community_profiles USING GIN(work_settings);
