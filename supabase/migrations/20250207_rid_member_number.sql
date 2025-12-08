-- Add RID member number to profiles for CEU certificate compliance
-- ============================================================================

-- Add the RID member number column
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rid_member_number VARCHAR(20);

-- Add index for lookups
CREATE INDEX IF NOT EXISTS idx_profiles_rid_member_number
  ON profiles(rid_member_number)
  WHERE rid_member_number IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.rid_member_number IS 'RID (Registry of Interpreters for the Deaf) member number for CEU tracking';
