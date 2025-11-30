-- Add admin role column to profiles
-- Migration: 20250131_add_admin_role

-- Add role column for system-level permissions (separate from onboarding roles array)
-- Note: IF NOT EXISTS doesn't work with ADD COLUMN in PostgreSQL, using DO block instead
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles
    ADD COLUMN role TEXT DEFAULT 'user'
    CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Create index for admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;

-- Optional: Add helpful constraint to prevent duplicate chunk indexes per document
ALTER TABLE knowledge_chunks
ADD CONSTRAINT IF NOT EXISTS knowledge_chunks_unique_per_doc
UNIQUE (document_id, chunk_index);

-- Optional: Add index for filtering active documents
CREATE INDEX IF NOT EXISTS knowledge_documents_is_active_idx
ON knowledge_documents(is_active);

-- Comments for clarity
COMMENT ON COLUMN profiles.role IS 'System-level user role for permissions (user/admin) - distinct from interpreter roles array used for onboarding';
COMMENT ON COLUMN profiles.roles IS 'Interpreter role selections from onboarding (e.g., medical, legal, conference)';
