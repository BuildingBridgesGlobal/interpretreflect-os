-- ============================================================================
-- FIX ASSIGNMENTS TABLE - Add missing columns
-- This migration adds all the missing columns to the existing assignments table
-- ============================================================================

-- Add missing columns to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS assignment_type TEXT,
ADD COLUMN IF NOT EXISTS setting TEXT,
ADD COLUMN IF NOT EXISTS date DATE,
ADD COLUMN IF NOT EXISTS time TIME,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS participants TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS vocabulary_list JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS research_notes TEXT,
ADD COLUMN IF NOT EXISTS prep_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS prep_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS debriefed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS debrief_id UUID,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add team-related fields (from team_assignments migration)
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS is_team_assignment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location_type TEXT,
ADD COLUMN IF NOT EXISTS location_details TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';

-- Update existing rows to have default values
UPDATE assignments
SET prep_status = 'pending'
WHERE prep_status IS NULL;

UPDATE assignments
SET status = 'upcoming'
WHERE status IS NULL AND completed = false;

UPDATE assignments
SET status = 'completed'
WHERE status IS NULL AND completed = true;

UPDATE assignments
SET team_size = 1
WHERE team_size IS NULL;

UPDATE assignments
SET is_team_assignment = false
WHERE is_team_assignment IS NULL;

UPDATE assignments
SET timezone = 'America/New_York'
WHERE timezone IS NULL;

-- Create indexes (DROP IF EXISTS first to avoid errors)
DROP INDEX IF EXISTS idx_assignments_user_id;
DROP INDEX IF EXISTS idx_assignments_date;
DROP INDEX IF EXISTS idx_assignments_type;
DROP INDEX IF EXISTS idx_assignments_prep_status;
DROP INDEX IF EXISTS idx_assignments_completed;

CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_date ON assignments(date DESC);
CREATE INDEX idx_assignments_type ON assignments(assignment_type);
CREATE INDEX idx_assignments_prep_status ON assignments(prep_status);
CREATE INDEX idx_assignments_completed ON assignments(completed);

-- Add foreign key constraint for debrief_id if debriefs table exists
-- This will only work if the debriefs table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'debriefs') THEN
    ALTER TABLE assignments
    DROP CONSTRAINT IF EXISTS assignments_debrief_id_fkey;

    ALTER TABLE assignments
    ADD CONSTRAINT assignments_debrief_id_fkey
    FOREIGN KEY (debrief_id) REFERENCES debriefs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignments;

CREATE POLICY "Users can view their own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

CREATE POLICY "Users can insert their own assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND can_edit_assignment = true
    )
  );

CREATE POLICY "Users can delete their own assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
