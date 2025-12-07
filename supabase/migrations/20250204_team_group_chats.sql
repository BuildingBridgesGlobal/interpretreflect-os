-- ============================================
-- TEAM GROUP CHATS MIGRATION
-- ============================================
-- Adds group chat functionality to agency teams
-- When a team is created, a group conversation is automatically created
-- for all team members to communicate
-- ============================================

-- ============================================
-- 1. CREATE AGENCY TEAMS TABLE (IF NOT EXISTS)
-- ============================================
CREATE TABLE IF NOT EXISTS agency_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add conversation_id column if table exists but column doesn't
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agency_teams' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE agency_teams ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_teams_org ON agency_teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_teams_conversation ON agency_teams(conversation_id);

-- ============================================
-- 2. CREATE AGENCY TEAM MEMBERS TABLE (IF NOT EXISTS)
-- ============================================
CREATE TABLE IF NOT EXISTS agency_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES agency_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'lead', 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agency_team_members_team ON agency_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_agency_team_members_user ON agency_team_members(user_id);

-- ============================================
-- 3. ENABLE RLS
-- ============================================
ALTER TABLE agency_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_team_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RLS POLICIES FOR AGENCY TEAMS
-- ============================================

-- Drop existing policies if they exist (safe recreation)
DROP POLICY IF EXISTS "Org members can view teams" ON agency_teams;
DROP POLICY IF EXISTS "Org admins can create teams" ON agency_teams;
DROP POLICY IF EXISTS "Org admins can update teams" ON agency_teams;
DROP POLICY IF EXISTS "Org admins can delete teams" ON agency_teams;

-- Organization members can view teams in their org
CREATE POLICY "Org members can view teams" ON agency_teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agency_teams.organization_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

-- Org admins/managers can create teams
CREATE POLICY "Org admins can create teams" ON agency_teams
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agency_teams.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.is_active = true
    )
  );

-- Org admins/managers can update teams
CREATE POLICY "Org admins can update teams" ON agency_teams
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agency_teams.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.is_active = true
    )
  );

-- Org admins/managers can delete teams
CREATE POLICY "Org admins can delete teams" ON agency_teams
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = agency_teams.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.is_active = true
    )
  );

-- ============================================
-- 5. RLS POLICIES FOR TEAM MEMBERS
-- ============================================

DROP POLICY IF EXISTS "Team members can view team membership" ON agency_team_members;
DROP POLICY IF EXISTS "Org admins can manage team members" ON agency_team_members;

-- Team members and org admins can view team membership
CREATE POLICY "Team members can view team membership" ON agency_team_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM agency_teams t
      JOIN organization_members om ON om.organization_id = t.organization_id
      WHERE t.id = agency_team_members.team_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
    )
  );

-- Org admins can manage team members
CREATE POLICY "Org admins can manage team members" ON agency_team_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM agency_teams t
      JOIN organization_members om ON om.organization_id = t.organization_id
      WHERE t.id = agency_team_members.team_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.is_active = true
    )
  );

-- ============================================
-- 6. FUNCTION TO CREATE TEAM GROUP CHAT
-- ============================================

-- This function creates a group conversation for a team
-- It's called from the API after creating a team
CREATE OR REPLACE FUNCTION create_team_group_chat(
  p_team_id UUID,
  p_team_name TEXT,
  p_member_ids UUID[],
  p_created_by UUID
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_member_id UUID;
BEGIN
  -- Create the group conversation
  INSERT INTO conversations (is_group, group_name, created_by)
  VALUES (true, p_team_name || ' Team Chat', p_created_by)
  RETURNING id INTO v_conversation_id;

  -- Add the creator as admin
  INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
  VALUES (v_conversation_id, p_created_by, true);

  -- Add all team members as participants
  FOREACH v_member_id IN ARRAY p_member_ids LOOP
    IF v_member_id != p_created_by THEN
      INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
      VALUES (v_conversation_id, v_member_id, false)
      ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;
  END LOOP;

  -- Update the team with the conversation ID
  UPDATE agency_teams
  SET conversation_id = v_conversation_id
  WHERE id = p_team_id;

  -- Add a welcome system message
  INSERT INTO messages (conversation_id, sender_id, content, is_system_message)
  VALUES (
    v_conversation_id,
    p_created_by,
    'Welcome to the ' || p_team_name || ' team chat! Use this space to coordinate and communicate with your team members.',
    true
  );

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. FUNCTION TO SYNC TEAM MEMBERS WITH CHAT
-- ============================================

-- This function syncs team members with the conversation participants
-- Called when team membership changes
CREATE OR REPLACE FUNCTION sync_team_chat_members(p_team_id UUID)
RETURNS VOID AS $$
DECLARE
  v_conversation_id UUID;
  v_team_member RECORD;
BEGIN
  -- Get the conversation ID for this team
  SELECT conversation_id INTO v_conversation_id
  FROM agency_teams
  WHERE id = p_team_id;

  -- If no conversation exists, nothing to sync
  IF v_conversation_id IS NULL THEN
    RETURN;
  END IF;

  -- Add any new team members to the conversation
  FOR v_team_member IN
    SELECT user_id FROM agency_team_members WHERE team_id = p_team_id
  LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    VALUES (v_conversation_id, v_team_member.user_id, false)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END LOOP;

  -- Remove participants who are no longer team members
  -- (Mark them as left rather than deleting)
  UPDATE conversation_participants
  SET left_at = NOW()
  WHERE conversation_id = v_conversation_id
  AND user_id NOT IN (SELECT user_id FROM agency_team_members WHERE team_id = p_team_id)
  AND left_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION create_team_group_chat TO authenticated;
GRANT EXECUTE ON FUNCTION sync_team_chat_members TO authenticated;

-- ============================================
-- 9. COMMENTS
-- ============================================
COMMENT ON COLUMN agency_teams.conversation_id IS 'Reference to the group chat conversation for this team';
COMMENT ON FUNCTION create_team_group_chat IS 'Creates a group conversation for a team and adds all members as participants';
COMMENT ON FUNCTION sync_team_chat_members IS 'Syncs team membership with conversation participants when team membership changes';
