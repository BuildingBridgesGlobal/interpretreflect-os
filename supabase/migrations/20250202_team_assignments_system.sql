-- ============================================================================
-- TEAM ASSIGNMENTS & COLLABORATION SYSTEM
-- ============================================================================
-- Features:
-- 1. Extend assignments with team-related columns and status
-- 2. Team membership table with invitation flow + RLS
-- 3. Team prep room + prep messages with RLS
-- 4. Debrief + reflections with granular visibility + RLS
-- 5. Assignment resources with RLS
-- 6. Auto-create prep room trigger
-- 7. Auto-add creator as team lead trigger
-- ============================================================================

-- ============================================================================
-- PHASE 1: Extend assignments table with team columns
-- ============================================================================

-- Add team-related columns to assignments (safe IF NOT EXISTS via DO block)
DO $$
BEGIN
  -- is_team_assignment flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'is_team_assignment'
  ) THEN
    ALTER TABLE assignments ADD COLUMN is_team_assignment BOOLEAN DEFAULT false;
  END IF;

  -- team_size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'team_size'
  ) THEN
    ALTER TABLE assignments ADD COLUMN team_size INTEGER DEFAULT 1;
  END IF;

  -- team_status for tracking team workflow
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'team_status'
  ) THEN
    ALTER TABLE assignments ADD COLUMN team_status TEXT DEFAULT 'pending';
  END IF;

  -- prep_room_id reference (will be set by trigger)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'prep_room_id'
  ) THEN
    ALTER TABLE assignments ADD COLUMN prep_room_id UUID;
  END IF;

  -- location_type (in_person, virtual, hybrid)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'location_type'
  ) THEN
    ALTER TABLE assignments ADD COLUMN location_type TEXT DEFAULT 'in_person';
  END IF;

  -- end_time for duration calculation
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'end_time'
  ) THEN
    ALTER TABLE assignments ADD COLUMN end_time TIME;
  END IF;

  -- consumer_info (who we're interpreting for)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'consumer_info'
  ) THEN
    ALTER TABLE assignments ADD COLUMN consumer_info TEXT;
  END IF;

  -- contact_info (agency/coordinator contact)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'assignments' AND column_name = 'contact_info'
  ) THEN
    ALTER TABLE assignments ADD COLUMN contact_info TEXT;
  END IF;
END $$;

-- Add constraint for team_status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_team_status'
  ) THEN
    ALTER TABLE assignments ADD CONSTRAINT valid_team_status
      CHECK (team_status IS NULL OR team_status IN ('pending', 'team_forming', 'prep_in_progress', 'ready', 'in_progress', 'completed', 'debriefing'));
  END IF;
END $$;

-- Add constraint for location_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_assignment_location_type'
  ) THEN
    ALTER TABLE assignments ADD CONSTRAINT valid_assignment_location_type
      CHECK (location_type IS NULL OR location_type IN ('in_person', 'virtual', 'hybrid'));
  END IF;
END $$;

-- Index for team assignments
CREATE INDEX IF NOT EXISTS idx_assignments_is_team ON assignments(is_team_assignment) WHERE is_team_assignment = true;
CREATE INDEX IF NOT EXISTS idx_assignments_team_status ON assignments(team_status);

-- ============================================================================
-- PHASE 2: Team Members table
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role and status
  role TEXT NOT NULL DEFAULT 'member', -- 'lead', 'member'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  -- Team communication preferences
  notes TEXT, -- Personal notes about this assignment
  prep_completed BOOLEAN DEFAULT false,
  prep_completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id, user_id)
);

-- Add constraint for role values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_team_member_role'
  ) THEN
    ALTER TABLE team_members ADD CONSTRAINT valid_team_member_role
      CHECK (role IN ('lead', 'member'));
  END IF;
END $$;

-- Add constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_team_member_status'
  ) THEN
    ALTER TABLE team_members ADD CONSTRAINT valid_team_member_status
      CHECK (status IN ('pending', 'accepted', 'declined'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_assignment ON team_members(assignment_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
DROP POLICY IF EXISTS "Team members can view their team" ON team_members;
CREATE POLICY "Team members can view their team" ON team_members
  FOR SELECT TO authenticated
  USING (
    -- Can see if you're on the team
    user_id = auth.uid()
    OR
    -- Can see if you're the assignment owner
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_members.assignment_id
      AND a.user_id = auth.uid()
    )
    OR
    -- Can see if you're also a team member on this assignment
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.assignment_id = team_members.assignment_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Assignment owners can add team members" ON team_members;
CREATE POLICY "Assignment owners can add team members" ON team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_members.assignment_id
      AND a.user_id = auth.uid()
    )
    OR
    -- Team leads can also add members
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.assignment_id = team_members.assignment_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'lead'
      AND tm.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can update their own membership" ON team_members;
CREATE POLICY "Users can update their own membership" ON team_members
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR
    -- Assignment owners can update any membership
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_members.assignment_id
      AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assignment owners can remove team members" ON team_members;
CREATE POLICY "Assignment owners can remove team members" ON team_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_members.assignment_id
      AND a.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PHASE 3: Team Prep Rooms
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_prep_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,

  -- Room settings
  name TEXT,
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prep_rooms_assignment ON team_prep_rooms(assignment_id);

-- Enable RLS
ALTER TABLE team_prep_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Team members can view prep rooms" ON team_prep_rooms;
CREATE POLICY "Team members can view prep rooms" ON team_prep_rooms
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_prep_rooms.assignment_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.assignment_id = a.id
          AND tm.user_id = auth.uid()
          AND tm.status = 'accepted'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Assignment owners can create prep rooms" ON team_prep_rooms;
CREATE POLICY "Assignment owners can create prep rooms" ON team_prep_rooms
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_prep_rooms.assignment_id
      AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Assignment owners can update prep rooms" ON team_prep_rooms;
CREATE POLICY "Assignment owners can update prep rooms" ON team_prep_rooms
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = team_prep_rooms.assignment_id
      AND a.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PHASE 4: Prep Messages (Chat in prep room)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prep_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prep_room_id UUID NOT NULL REFERENCES team_prep_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Message content
  content TEXT NOT NULL CHECK (LENGTH(content) <= 4000),
  message_type TEXT DEFAULT 'text', -- 'text', 'resource', 'checklist', 'system'

  -- For resource/checklist types
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Edit tracking
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for message_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_prep_message_type'
  ) THEN
    ALTER TABLE prep_messages ADD CONSTRAINT valid_prep_message_type
      CHECK (message_type IN ('text', 'resource', 'checklist', 'system'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prep_messages_room ON prep_messages(prep_room_id);
CREATE INDEX IF NOT EXISTS idx_prep_messages_sender ON prep_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_prep_messages_created ON prep_messages(created_at DESC);

-- Enable RLS
ALTER TABLE prep_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Team members can view prep messages" ON prep_messages;
CREATE POLICY "Team members can view prep messages" ON prep_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_prep_rooms pr
      JOIN assignments a ON a.id = pr.assignment_id
      WHERE pr.id = prep_messages.prep_room_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.assignment_id = a.id
          AND tm.user_id = auth.uid()
          AND tm.status = 'accepted'
        )
      )
    )
    AND is_deleted = false
  );

DROP POLICY IF EXISTS "Team members can send prep messages" ON prep_messages;
CREATE POLICY "Team members can send prep messages" ON prep_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM team_prep_rooms pr
      JOIN assignments a ON a.id = pr.assignment_id
      WHERE pr.id = prep_messages.prep_room_id
      AND (
        a.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.assignment_id = a.id
          AND tm.user_id = auth.uid()
          AND tm.status = 'accepted'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can edit their own messages" ON prep_messages;
CREATE POLICY "Users can edit their own messages" ON prep_messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid());

-- ============================================================================
-- PHASE 5: Debriefs table (enhanced)
-- ============================================================================

-- Check if debriefs table exists, if not create it
CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Debrief content
  summary TEXT,
  went_well TEXT,
  challenges TEXT,
  lessons_learned TEXT,

  -- Ratings (1-5 scale)
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),

  -- Team debrief specific
  is_team_debrief BOOLEAN DEFAULT false,
  team_dynamics TEXT,

  -- Visibility
  visibility TEXT DEFAULT 'private', -- 'private', 'team', 'mentor', 'public'

  -- Status
  status TEXT DEFAULT 'draft', -- 'draft', 'completed'
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(assignment_id, user_id)
);

-- Add constraint for visibility values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_debrief_visibility'
  ) THEN
    ALTER TABLE debriefs ADD CONSTRAINT valid_debrief_visibility
      CHECK (visibility IN ('private', 'team', 'mentor', 'public'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_debriefs_assignment ON debriefs(assignment_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_user ON debriefs(user_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_visibility ON debriefs(visibility);

-- Enable RLS
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for debriefs
DROP POLICY IF EXISTS "Users can view their own debriefs" ON debriefs;
CREATE POLICY "Users can view their own debriefs" ON debriefs
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR
    -- Team members can see 'team' visibility debriefs
    (
      visibility = 'team'
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.assignment_id = debriefs.assignment_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
      )
    )
    OR
    -- Public debriefs (for community feature)
    visibility = 'public'
  );

DROP POLICY IF EXISTS "Users can create their own debriefs" ON debriefs;
CREATE POLICY "Users can create their own debriefs" ON debriefs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own debriefs" ON debriefs;
CREATE POLICY "Users can update their own debriefs" ON debriefs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own debriefs" ON debriefs;
CREATE POLICY "Users can delete their own debriefs" ON debriefs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- PHASE 6: Reflections (granular debrief components)
-- ============================================================================

CREATE TABLE IF NOT EXISTS reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debrief_id UUID NOT NULL REFERENCES debriefs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Reflection content
  reflection_type TEXT NOT NULL, -- 'skill', 'decision', 'moment', 'growth'
  title TEXT,
  content TEXT NOT NULL,

  -- Skill tagging (for skills page integration)
  related_skills TEXT[] DEFAULT '{}',

  -- Visibility (inherits from debrief but can be more restrictive)
  visibility TEXT DEFAULT 'private',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for reflection_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_reflection_type'
  ) THEN
    ALTER TABLE reflections ADD CONSTRAINT valid_reflection_type
      CHECK (reflection_type IN ('skill', 'decision', 'moment', 'growth', 'challenge', 'win'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reflections_debrief ON reflections(debrief_id);
CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_reflections_type ON reflections(reflection_type);

-- Enable RLS
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own reflections" ON reflections;
CREATE POLICY "Users can view their own reflections" ON reflections
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      visibility IN ('team', 'public')
      AND EXISTS (
        SELECT 1 FROM debriefs d
        JOIN team_members tm ON tm.assignment_id = d.assignment_id
        WHERE d.id = reflections.debrief_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
      )
    )
  );

DROP POLICY IF EXISTS "Users can create their own reflections" ON reflections;
CREATE POLICY "Users can create their own reflections" ON reflections
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reflections" ON reflections;
CREATE POLICY "Users can update their own reflections" ON reflections
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reflections" ON reflections;
CREATE POLICY "Users can delete their own reflections" ON reflections
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- PHASE 7: Assignment Resources
-- ============================================================================

CREATE TABLE IF NOT EXISTS assignment_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Resource details
  resource_type TEXT NOT NULL, -- 'link', 'document', 'vocabulary', 'note', 'checklist'
  title TEXT NOT NULL,
  content TEXT, -- URL for links, text for notes, JSON for vocab/checklist
  description TEXT,

  -- For file uploads (future)
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,

  -- Visibility
  visibility TEXT DEFAULT 'team', -- 'private', 'team'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint for resource_type values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_resource_type'
  ) THEN
    ALTER TABLE assignment_resources ADD CONSTRAINT valid_resource_type
      CHECK (resource_type IN ('link', 'document', 'vocabulary', 'note', 'checklist', 'image'));
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resources_assignment ON assignment_resources(assignment_id);
CREATE INDEX IF NOT EXISTS idx_resources_added_by ON assignment_resources(added_by);
CREATE INDEX IF NOT EXISTS idx_resources_type ON assignment_resources(resource_type);

-- Enable RLS
ALTER TABLE assignment_resources ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Team members can view assignment resources" ON assignment_resources;
CREATE POLICY "Team members can view assignment resources" ON assignment_resources
  FOR SELECT TO authenticated
  USING (
    -- Owner can see all
    added_by = auth.uid()
    OR
    -- Assignment owner can see all
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_resources.assignment_id
      AND a.user_id = auth.uid()
    )
    OR
    -- Team members can see team-visible resources
    (
      visibility = 'team'
      AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.assignment_id = assignment_resources.assignment_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
      )
    )
  );

DROP POLICY IF EXISTS "Users can add resources to their assignments" ON assignment_resources;
CREATE POLICY "Users can add resources to their assignments" ON assignment_resources
  FOR INSERT TO authenticated
  WITH CHECK (
    added_by = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM assignments a
        WHERE a.id = assignment_resources.assignment_id
        AND a.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.assignment_id = assignment_resources.assignment_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'accepted'
      )
    )
  );

DROP POLICY IF EXISTS "Users can update their own resources" ON assignment_resources;
CREATE POLICY "Users can update their own resources" ON assignment_resources
  FOR UPDATE TO authenticated
  USING (added_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own resources" ON assignment_resources;
CREATE POLICY "Users can delete their own resources" ON assignment_resources
  FOR DELETE TO authenticated
  USING (
    added_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM assignments a
      WHERE a.id = assignment_resources.assignment_id
      AND a.user_id = auth.uid()
    )
  );

-- ============================================================================
-- PHASE 8: Update assignments RLS for team access
-- ============================================================================

-- Drop existing policies and recreate with team access
DROP POLICY IF EXISTS "Users can view their own assignments" ON assignments;
CREATE POLICY "Users can view their own assignments" ON assignments
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.assignment_id = assignments.id
      AND tm.user_id = auth.uid()
      AND tm.status IN ('pending', 'accepted')
    )
  );

-- Keep insert policy as-is (only owner creates)
DROP POLICY IF EXISTS "Users can insert their own assignments" ON assignments;
CREATE POLICY "Users can insert their own assignments" ON assignments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update policy allows team leads to update certain fields
DROP POLICY IF EXISTS "Users can update their own assignments" ON assignments;
CREATE POLICY "Users can update their own assignments" ON assignments
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.assignment_id = assignments.id
      AND tm.user_id = auth.uid()
      AND tm.role = 'lead'
      AND tm.status = 'accepted'
    )
  );

-- Delete only by owner
DROP POLICY IF EXISTS "Users can delete their own assignments" ON assignments;
CREATE POLICY "Users can delete their own assignments" ON assignments
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- PHASE 9: Triggers
-- ============================================================================

-- Trigger: Auto-create prep room when is_team_assignment becomes true
CREATE OR REPLACE FUNCTION create_prep_room_on_team_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if is_team_assignment is true and no prep room exists
  IF NEW.is_team_assignment = true AND NEW.prep_room_id IS NULL THEN
    INSERT INTO team_prep_rooms (assignment_id, name)
    VALUES (NEW.id, 'Team Prep Room')
    ON CONFLICT (assignment_id) DO NOTHING
    RETURNING id INTO NEW.prep_room_id;

    -- If insert succeeded, get the ID
    IF NEW.prep_room_id IS NULL THEN
      SELECT id INTO NEW.prep_room_id
      FROM team_prep_rooms
      WHERE assignment_id = NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_create_prep_room ON assignments;
CREATE TRIGGER auto_create_prep_room
  BEFORE UPDATE ON assignments
  FOR EACH ROW
  WHEN (NEW.is_team_assignment = true AND OLD.is_team_assignment = false)
  EXECUTE FUNCTION create_prep_room_on_team_assignment();

-- Also trigger on insert if is_team_assignment is true
DROP TRIGGER IF EXISTS auto_create_prep_room_insert ON assignments;
CREATE TRIGGER auto_create_prep_room_insert
  BEFORE INSERT ON assignments
  FOR EACH ROW
  WHEN (NEW.is_team_assignment = true)
  EXECUTE FUNCTION create_prep_room_on_team_assignment();

-- Trigger: Auto-add creator as team lead
CREATE OR REPLACE FUNCTION add_creator_as_team_lead()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_team_assignment = true THEN
    INSERT INTO team_members (assignment_id, user_id, role, status, invited_by, responded_at)
    VALUES (NEW.id, NEW.user_id, 'lead', 'accepted', NEW.user_id, NOW())
    ON CONFLICT (assignment_id, user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_add_team_lead ON assignments;
CREATE TRIGGER auto_add_team_lead
  AFTER INSERT ON assignments
  FOR EACH ROW
  WHEN (NEW.is_team_assignment = true)
  EXECUTE FUNCTION add_creator_as_team_lead();

-- Also when updating to team assignment
DROP TRIGGER IF EXISTS auto_add_team_lead_on_update ON assignments;
CREATE TRIGGER auto_add_team_lead_on_update
  AFTER UPDATE ON assignments
  FOR EACH ROW
  WHEN (NEW.is_team_assignment = true AND OLD.is_team_assignment = false)
  EXECUTE FUNCTION add_creator_as_team_lead();

-- Trigger: Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS team_members_updated_at ON team_members;
CREATE TRIGGER team_members_updated_at
  BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS team_prep_rooms_updated_at ON team_prep_rooms;
CREATE TRIGGER team_prep_rooms_updated_at
  BEFORE UPDATE ON team_prep_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS prep_messages_updated_at ON prep_messages;
CREATE TRIGGER prep_messages_updated_at
  BEFORE UPDATE ON prep_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS debriefs_updated_at ON debriefs;
CREATE TRIGGER debriefs_updated_at
  BEFORE UPDATE ON debriefs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS reflections_updated_at ON reflections;
CREATE TRIGGER reflections_updated_at
  BEFORE UPDATE ON reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS assignment_resources_updated_at ON assignment_resources;
CREATE TRIGGER assignment_resources_updated_at
  BEFORE UPDATE ON assignment_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 10: Helper Functions
-- ============================================================================

-- Function to check if user is on a team
CREATE OR REPLACE FUNCTION is_team_member(p_assignment_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM team_members
    WHERE assignment_id = p_assignment_id
    AND user_id = p_user_id
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team member count
CREATE OR REPLACE FUNCTION get_team_size(p_assignment_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER FROM team_members
    WHERE assignment_id = p_assignment_id
    AND status = 'accepted'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE team_members IS 'Team membership for collaborative assignments with invitation workflow';
COMMENT ON TABLE team_prep_rooms IS 'Prep rooms for team assignments - one per assignment';
COMMENT ON TABLE prep_messages IS 'Chat messages within team prep rooms';
COMMENT ON TABLE debriefs IS 'Post-assignment reflections and debriefs';
COMMENT ON TABLE reflections IS 'Granular reflection entries linked to debriefs';
COMMENT ON TABLE assignment_resources IS 'Shared resources (links, vocab, notes) for assignments';
