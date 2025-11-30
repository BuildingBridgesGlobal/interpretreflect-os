-- ============================================================================
-- ASSIGNMENT PARTICIPANTS - Track details about who users are interpreting for
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Participant Details
  name TEXT NOT NULL,
  role TEXT, -- 'speaker', 'deaf_participant', 'hearing_participant', 'presenter', 'panelist', etc.
  organization TEXT,
  title TEXT, -- 'CEO', 'Professor', 'Doctor', 'Attorney', etc.

  -- Research & Background (AI-generated or user-provided)
  background TEXT, -- AI research on who they are
  communication_style TEXT, -- How they communicate (fast, technical, emotional, etc.)
  key_points JSONB DEFAULT '[]'::jsonb, -- Important points about this person
  previous_experience TEXT, -- Notes from past assignments with this person
  special_considerations TEXT, -- Accommodations, preferences, etc.

  -- AI Research Metadata
  ai_researched BOOLEAN DEFAULT false,
  ai_research_date TIMESTAMPTZ,
  ai_research_summary TEXT,
  research_sources JSONB DEFAULT '[]'::jsonb, -- URLs or sources used

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_assignment_participants_assignment_id ON assignment_participants(assignment_id);
CREATE INDEX idx_assignment_participants_user_id ON assignment_participants(user_id);
CREATE INDEX idx_assignment_participants_name ON assignment_participants(name);

-- Enable RLS
ALTER TABLE assignment_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own assignment participants" ON assignment_participants;
CREATE POLICY "Users can view their own assignment participants"
  ON assignment_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own assignment participants" ON assignment_participants;
CREATE POLICY "Users can insert their own assignment participants"
  ON assignment_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own assignment participants" ON assignment_participants;
CREATE POLICY "Users can update their own assignment participants"
  ON assignment_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own assignment participants" ON assignment_participants;
CREATE POLICY "Users can delete their own assignment participants"
  ON assignment_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PARTICIPANT LIBRARY - Reusable participant profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS participant_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Core Info
  name TEXT NOT NULL,
  organization TEXT,
  title TEXT,

  -- Research & Background
  background TEXT,
  communication_style TEXT,
  key_points JSONB DEFAULT '[]'::jsonb,
  special_considerations TEXT,

  -- Usage Tracking
  times_worked_with INTEGER DEFAULT 0,
  last_assignment_date DATE,

  -- AI Research
  ai_researched BOOLEAN DEFAULT false,
  ai_research_date TIMESTAMPTZ,
  ai_research_summary TEXT,
  research_sources JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_participant_library_user_id ON participant_library(user_id);
CREATE INDEX idx_participant_library_name ON participant_library(name);

-- Enable RLS
ALTER TABLE participant_library ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own participant library" ON participant_library;
CREATE POLICY "Users can view their own participant library"
  ON participant_library FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own participants" ON participant_library;
CREATE POLICY "Users can insert their own participants"
  ON participant_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own participants" ON participant_library;
CREATE POLICY "Users can update their own participants"
  ON participant_library FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own participants" ON participant_library;
CREATE POLICY "Users can delete their own participants"
  ON participant_library FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
