-- Migration: Add new community_profiles fields
-- This migration adds new fields to support the updated community profile form

-- Add is_deaf_interpreter boolean field
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS is_deaf_interpreter BOOLEAN DEFAULT false;

-- Change years_experience to TEXT to support dropdown options like "1-3 years", "4-7 years", etc.
-- First, we need to handle existing data if years_experience was integer
DO $$
BEGIN
  -- Check if years_experience column exists and is integer type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_profiles'
    AND column_name = 'years_experience'
    AND data_type = 'integer'
  ) THEN
    -- Create temporary column
    ALTER TABLE community_profiles ADD COLUMN years_experience_new TEXT;

    -- Migrate existing integer values to text descriptions
    UPDATE community_profiles
    SET years_experience_new = CASE
      WHEN years_experience = 0 THEN 'New to the field'
      WHEN years_experience BETWEEN 1 AND 3 THEN '1-3 years'
      WHEN years_experience BETWEEN 4 AND 7 THEN '4-7 years'
      WHEN years_experience BETWEEN 8 AND 15 THEN '8-15 years'
      WHEN years_experience > 15 THEN '15+ years'
      ELSE NULL
    END;

    -- Drop old column and rename new one
    ALTER TABLE community_profiles DROP COLUMN years_experience;
    ALTER TABLE community_profiles RENAME COLUMN years_experience_new TO years_experience;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_profiles'
    AND column_name = 'years_experience'
  ) THEN
    -- Column doesn't exist at all, create it as TEXT
    ALTER TABLE community_profiles ADD COLUMN years_experience TEXT;
  END IF;
END $$;

-- Add new array fields for updated form structure
-- settings_work_in replaces/supplements specialties
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS settings_work_in TEXT[] DEFAULT '{}';

-- offer_support_in replaces/supplements strong_domains
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS offer_support_in TEXT[] DEFAULT '{}';

-- seeking_guidance_in replaces/supplements weak_domains
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS seeking_guidance_in TEXT[] DEFAULT '{}';

-- looking_for_mentor replaces/supplements seeking_mentor
ALTER TABLE community_profiles
ADD COLUMN IF NOT EXISTS looking_for_mentor BOOLEAN DEFAULT false;

-- Migrate existing data from old fields to new fields
UPDATE community_profiles
SET
  settings_work_in = COALESCE(specialties, '{}'),
  offer_support_in = COALESCE(strong_domains, '{}'),
  seeking_guidance_in = COALESCE(weak_domains, '{}'),
  looking_for_mentor = COALESCE(seeking_mentor, false)
WHERE settings_work_in = '{}'
  AND offer_support_in = '{}'
  AND seeking_guidance_in = '{}';

-- Add comments describing the fields
COMMENT ON COLUMN community_profiles.is_deaf_interpreter IS 'Identity marker - whether the interpreter is a Deaf Interpreter';
COMMENT ON COLUMN community_profiles.years_experience IS 'Experience level as text (e.g., "1-3 years", "4-7 years")';
COMMENT ON COLUMN community_profiles.settings_work_in IS 'Interpreter settings/specializations (public)';
COMMENT ON COLUMN community_profiles.offer_support_in IS 'Areas where interpreter can offer support to others (public)';
COMMENT ON COLUMN community_profiles.seeking_guidance_in IS 'Areas where interpreter is seeking guidance (private)';
COMMENT ON COLUMN community_profiles.looking_for_mentor IS 'Whether the interpreter is looking for a mentor';

-- Note: We keep the old fields (specialties, strong_domains, weak_domains, seeking_mentor)
-- for backward compatibility. They can be removed in a future migration after confirming
-- all data has been migrated and all code references have been updated.
