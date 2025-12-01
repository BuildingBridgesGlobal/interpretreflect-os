-- ============================================================================
-- TEAM ASSIGNMENTS & COLLABORATION SCHEMA
-- Extends existing assignments table to support team interpreting workflows
-- ============================================================================

-- ============================================================================
-- 1. EXTEND EXISTING ASSIGNMENTS TABLE
-- ============================================================================

-- Add team-related fields to assignments
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS is_team_assignment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS location_type TEXT, -- 'virtual', 'in_person', 'hybrid'
ADD COLUMN IF NOT EXISTS location_details TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming'; -- 'upcoming', 'in_progress', 'completed', 'cancelled'

-- Update existing assignments to have proper status
UPDATE assignments SET status = 'upcoming' WHERE status IS NULL AND completed = false;
UPDATE assignments SET status = 'completed' WHERE status IS NULL AND completed = true;

-- ============================================================================
-- 2. ASSIGNMENT TEAM MEMBERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role on this assignment
  role TEXT DEFAULT 'team', -- 'lead', 'support', 'feed', 'shadow', 'mentor'

  -- Invitation flow (in-app for MVP)
  status TEXT DEFAULT 'confirmed', -- 'invited', 'confirmed', 'declined'
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,

  -- Permissions
  can_edit_assignment BOOLEAN DEFAULT false,
  can_invite_others BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id, user_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_assignment_team_user ON assignment_team_members(user_id, status);
CREATE INDEX idx_assignment_team_assignment ON assignment_team_members(assignment_id);

-- Enable RLS
ALTER TABLE assignment_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies - team members can see their assignments
DROP POLICY IF EXISTS "Users can view their team assignments" ON assignment_team_members;
CREATE POLICY "Users can view their team assignments"
  ON assignment_team_members FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = invited_by);

DROP POLICY IF EXISTS "Users can insert team members" ON assignment_team_members;
CREATE POLICY "Users can insert team members"
  ON assignment_team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = invited_by OR
    auth.uid() IN (
      SELECT user_id FROM assignment_team_members
      WHERE assignment_id = assignment_team_members.assignment_id
      AND can_invite_others = true
    )
  );

DROP POLICY IF EXISTS "Users can update their team status" ON assignment_team_members;
CREATE POLICY "Users can update their team status"
  ON assignment_team_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. TEAM PREP ROOMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_prep_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

  -- Room status
  status TEXT DEFAULT 'active', -- 'active', 'archived'

  -- Prep checklist progress (JSON)
  checklist_state JSONB DEFAULT '{}'::jsonb,

  -- Shared notes
  shared_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id)
);

-- Enable RLS
ALTER TABLE team_prep_rooms ENABLE ROW LEVEL SECURITY;

-- RLS - team members can access their prep room
DROP POLICY IF EXISTS "Team members can view prep room" ON team_prep_rooms;
CREATE POLICY "Team members can view prep room"
  ON team_prep_rooms FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

DROP POLICY IF EXISTS "Team members can update prep room" ON team_prep_rooms;
CREATE POLICY "Team members can update prep room"
  ON team_prep_rooms FOR UPDATE
  TO authenticated
  USING (
    assignment_id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

-- ============================================================================
-- 4. TEAM PREP MESSAGES (Shared Elya conversation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_prep_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_room_id UUID NOT NULL REFERENCES team_prep_rooms(id) ON DELETE CASCADE,

  -- Who said it
  user_id UUID REFERENCES auth.users(id), -- NULL = Elya
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'

  -- Content
  content TEXT NOT NULL,

  -- For threading/context
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast message retrieval
CREATE INDEX idx_prep_messages_room ON team_prep_messages(prep_room_id, created_at);

-- Enable RLS
ALTER TABLE team_prep_messages ENABLE ROW LEVEL SECURITY;

-- RLS - team members can view and create messages
DROP POLICY IF EXISTS "Team members can view prep messages" ON team_prep_messages;
CREATE POLICY "Team members can view prep messages"
  ON team_prep_messages FOR SELECT
  TO authenticated
  USING (
    prep_room_id IN (
      SELECT id FROM team_prep_rooms
      WHERE assignment_id IN (
        SELECT assignment_id FROM assignment_team_members
        WHERE user_id = auth.uid() AND status = 'confirmed'
      )
    )
  );

DROP POLICY IF EXISTS "Team members can create prep messages" ON team_prep_messages;
CREATE POLICY "Team members can create prep messages"
  ON team_prep_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    prep_room_id IN (
      SELECT id FROM team_prep_rooms
      WHERE assignment_id IN (
        SELECT assignment_id FROM assignment_team_members
        WHERE user_id = auth.uid() AND status = 'confirmed'
      )
    )
  );

-- ============================================================================
-- 5. ASSIGNMENT DEBRIEFS (Team debrief sessions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

  created_by UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'

  -- AI-generated summary after all reflections
  team_summary TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(assignment_id)
);

-- Enable RLS
ALTER TABLE assignment_debriefs ENABLE ROW LEVEL SECURITY;

-- RLS - team members can view/create debriefs
DROP POLICY IF EXISTS "Team members can view debriefs" ON assignment_debriefs;
CREATE POLICY "Team members can view debriefs"
  ON assignment_debriefs FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

DROP POLICY IF EXISTS "Team members can create debriefs" ON assignment_debriefs;
CREATE POLICY "Team members can create debriefs"
  ON assignment_debriefs FOR INSERT
  TO authenticated
  WITH CHECK (
    assignment_id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

DROP POLICY IF EXISTS "Creator can update debrief" ON assignment_debriefs;
CREATE POLICY "Creator can update debrief"
  ON assignment_debriefs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- ============================================================================
-- 6. DEBRIEF REFLECTIONS (Individual reflections within team debrief)
-- ============================================================================

CREATE TABLE IF NOT EXISTS debrief_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debrief_id UUID NOT NULL REFERENCES assignment_debriefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type of reflection
  reflection_type TEXT NOT NULL, -- 'self_assessment', 'peer_feedback', 'team_dynamics'

  -- For peer feedback: who are you giving feedback about?
  target_user_id UUID REFERENCES auth.users(id),

  -- Structured content
  content JSONB NOT NULL,
  /*
    Example structure:
    {
      "strengths": ["Clear message accuracy", "Strong cultural bridging"],
      "growth_areas": ["Could improve turn-taking"],
      "ecci_ratings": { "emotional_awareness": 4, "cultural_responsiveness": 5 },
      "notes": "Great collaboration throughout the session"
    }
  */

  -- Privacy (default: private)
  visibility TEXT DEFAULT 'private', -- 'private', 'team', 'mentor_only'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_reflections_debrief ON debrief_reflections(debrief_id);
CREATE INDEX idx_reflections_user ON debrief_reflections(user_id);

-- Enable RLS
ALTER TABLE debrief_reflections ENABLE ROW LEVEL SECURITY;

-- RLS - users can see their own reflections always, and team reflections if shared
DROP POLICY IF EXISTS "Users can view their own reflections" ON debrief_reflections;
CREATE POLICY "Users can view their own reflections"
  ON debrief_reflections FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    (visibility = 'team' AND debrief_id IN (
      SELECT id FROM assignment_debriefs
      WHERE assignment_id IN (
        SELECT assignment_id FROM assignment_team_members
        WHERE user_id = auth.uid() AND status = 'confirmed'
      )
    ))
  );

DROP POLICY IF EXISTS "Users can create their own reflections" ON debrief_reflections;
CREATE POLICY "Users can create their own reflections"
  ON debrief_reflections FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reflections" ON debrief_reflections;
CREATE POLICY "Users can update their own reflections"
  ON debrief_reflections FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- 7. ASSIGNMENT RESOURCES (Link toolkit resources to assignments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

  -- Which resource
  resource_type TEXT NOT NULL, -- 'checklist', 'script', 'guide', 'form'
  resource_key TEXT NOT NULL, -- 'virtual_team_checklist', 'pre_session_briefing', etc.

  -- Completion tracking
  completed BOOLEAN DEFAULT false,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX idx_resources_assignment ON assignment_resources(assignment_id);

-- Enable RLS
ALTER TABLE assignment_resources ENABLE ROW LEVEL SECURITY;

-- RLS - team members can view/update resources
DROP POLICY IF EXISTS "Team members can view resources" ON assignment_resources;
CREATE POLICY "Team members can view resources"
  ON assignment_resources FOR SELECT
  TO authenticated
  USING (
    assignment_id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

DROP POLICY IF EXISTS "Team members can update resources" ON assignment_resources;
CREATE POLICY "Team members can update resources"
  ON assignment_resources FOR UPDATE
  TO authenticated
  USING (
    assignment_id IN (
      SELECT assignment_id FROM assignment_team_members
      WHERE user_id = auth.uid() AND status = 'confirmed'
    )
  );

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to auto-create prep room when team assignment is created
CREATE OR REPLACE FUNCTION create_team_prep_room()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_team_assignment = true THEN
    INSERT INTO team_prep_rooms (assignment_id)
    VALUES (NEW.id)
    ON CONFLICT (assignment_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create prep room
DROP TRIGGER IF EXISTS trigger_create_prep_room ON assignments;
CREATE TRIGGER trigger_create_prep_room
  AFTER INSERT OR UPDATE OF is_team_assignment ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION create_team_prep_room();

-- Function to auto-add creator as team lead
CREATE OR REPLACE FUNCTION add_creator_as_team_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Add creator as team lead with full permissions
  INSERT INTO assignment_team_members (
    assignment_id,
    user_id,
    role,
    status,
    can_edit_assignment,
    can_invite_others,
    confirmed_at
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    'lead',
    'confirmed',
    true,
    true,
    NOW()
  )
  ON CONFLICT (assignment_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to add creator as team lead
DROP TRIGGER IF EXISTS trigger_add_creator_as_lead ON assignments;
CREATE TRIGGER trigger_add_creator_as_lead
  AFTER INSERT ON assignments
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_team_lead();

-- ============================================================================
-- 9. UPDATE EXISTING ASSIGNMENTS POLICIES
-- ============================================================================

-- Update RLS policies to support team access
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignments;
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

DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
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
