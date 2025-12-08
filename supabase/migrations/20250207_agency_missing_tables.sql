-- ============================================================================
-- AGENCY MISSING TABLES MIGRATION
-- Creates the 3 tables referenced in API code but missing from schema
-- ============================================================================

-- ============================================================================
-- 1. AGENCY ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agency_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT,
  location TEXT,
  description TEXT,
  assignment_type TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  prep_required BOOLEAN DEFAULT TRUE,
  debrief_required BOOLEAN DEFAULT TRUE,
  prep_materials JSONB DEFAULT '[]',
  notes_for_interpreters TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agency_assignments_org ON agency_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_assignments_start_time ON agency_assignments(start_time);

-- ============================================================================
-- 2. AGENCY ASSIGNMENT INTERPRETERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS agency_assignment_interpreters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES agency_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'support', 'shadow', 'lead')),
  prep_started_at TIMESTAMPTZ,
  prep_completed_at TIMESTAMPTZ,
  debrief_started_at TIMESTAMPTZ,
  debrief_completed_at TIMESTAMPTZ,
  interpreter_assignment_id UUID,
  invitation_status TEXT DEFAULT 'assigned' CHECK (invitation_status IN ('assigned', 'accepted', 'declined')),
  responded_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_aai_assignment ON agency_assignment_interpreters(assignment_id);
CREATE INDEX IF NOT EXISTS idx_aai_user ON agency_assignment_interpreters(user_id);

-- ============================================================================
-- 3. ORGANIZATION INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'interpreter' CHECK (role IN ('interpreter', 'manager', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  invitation_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  personal_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_org_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON organization_invitations(email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_org_invitations_unique_pending
  ON organization_invitations(organization_id, email)
  WHERE status = 'pending';

-- ============================================================================
-- 4. ADD COLUMNS TO ASSIGNMENTS TABLE
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assignments') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'agency_assignment_id') THEN
      ALTER TABLE assignments ADD COLUMN agency_assignment_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'assignments' AND column_name = 'created_by_agency') THEN
      ALTER TABLE assignments ADD COLUMN created_by_agency BOOLEAN DEFAULT FALSE;
    END IF;
  END IF;
END;
$$;

-- ============================================================================
-- 5. ENABLE RLS
-- ============================================================================
ALTER TABLE agency_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_assignment_interpreters ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS POLICIES
-- ============================================================================

-- agency_assignments
DROP POLICY IF EXISTS "Org admins can manage agency assignments" ON agency_assignments;
CREATE POLICY "Org admins can manage agency assignments"
  ON agency_assignments FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = agency_assignments.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.status = 'active'
  ));

DROP POLICY IF EXISTS "Assigned interpreters can view their agency assignments" ON agency_assignments;
CREATE POLICY "Assigned interpreters can view their agency assignments"
  ON agency_assignments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agency_assignment_interpreters aai
    WHERE aai.assignment_id = agency_assignments.id AND aai.user_id = auth.uid()
  ));

-- agency_assignment_interpreters
DROP POLICY IF EXISTS "Org admins can manage assignment interpreters" ON agency_assignment_interpreters;
CREATE POLICY "Org admins can manage assignment interpreters"
  ON agency_assignment_interpreters FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agency_assignments aa
    JOIN organization_members om ON om.organization_id = aa.organization_id
    WHERE aa.id = agency_assignment_interpreters.assignment_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.status = 'active'
  ));

DROP POLICY IF EXISTS "Interpreters can view their own assignment records" ON agency_assignment_interpreters;
CREATE POLICY "Interpreters can view their own assignment records"
  ON agency_assignment_interpreters FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Interpreters can update their own assignment status" ON agency_assignment_interpreters;
CREATE POLICY "Interpreters can update their own assignment status"
  ON agency_assignment_interpreters FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Team members can see each other" ON agency_assignment_interpreters;
CREATE POLICY "Team members can see each other"
  ON agency_assignment_interpreters FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM agency_assignment_interpreters my_record
    WHERE my_record.assignment_id = agency_assignment_interpreters.assignment_id
      AND my_record.user_id = auth.uid()
  ));

-- organization_invitations
DROP POLICY IF EXISTS "Org admins can manage invitations" ON organization_invitations;
CREATE POLICY "Org admins can manage invitations"
  ON organization_invitations FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = organization_invitations.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager')
      AND om.status = 'active'
  ));

DROP POLICY IF EXISTS "Users can view invitations to their email" ON organization_invitations;
CREATE POLICY "Users can view invitations to their email"
  ON organization_invitations FOR SELECT TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can respond to their invitations" ON organization_invitations;
CREATE POLICY "Users can respond to their invitations"
  ON organization_invitations FOR UPDATE TO authenticated
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================================================
-- 7. GRANTS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON agency_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agency_assignment_interpreters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_invitations TO authenticated;
