-- ============================================================================
-- ASSIGNMENTS TABLE - Track user assignments for prep and management
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assignment Details
  title TEXT NOT NULL,
  assignment_type TEXT NOT NULL, -- 'Medical', 'Legal', 'Educational', 'VRS', 'Community', 'Mental Health'
  setting TEXT,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  duration_minutes INTEGER,

  -- Prep Status
  prep_status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  prep_completed_at TIMESTAMPTZ,

  -- Assignment Content
  description TEXT,
  participants TEXT,
  special_requirements TEXT,
  vocabulary_list JSONB DEFAULT '[]'::jsonb,
  research_notes TEXT,

  -- Completion
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  debriefed BOOLEAN DEFAULT false,
  debrief_id UUID REFERENCES debriefs(id) ON DELETE SET NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_date ON assignments(date DESC);
CREATE INDEX idx_assignments_type ON assignments(assignment_type);
CREATE INDEX idx_assignments_prep_status ON assignments(prep_status);
CREATE INDEX idx_assignments_completed ON assignments(completed);

-- Enable RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignments;
CREATE POLICY "Users can view their own assignments"
  ON assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;
CREATE POLICY "Users can insert their own assignments"
  ON assignments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
CREATE POLICY "Users can update their own assignments"
  ON assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignments;
CREATE POLICY "Users can delete their own assignments"
  ON assignments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
