-- ============================================================================
-- ORGANIZATION DATA ISOLATION
-- Migration: 20250204_organization_data_isolation
--
-- This migration adds organization_id to all user data tables to ensure
-- complete data isolation between agencies. Each interpreter's data
-- is tagged with their organization_id, preventing cross-org data leakage.
-- ============================================================================

-- ============================================================================
-- 1. ADD organization_id TO ASSIGNMENTS TABLE
-- ============================================================================

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_organization_id ON assignments(organization_id);

-- Create trigger function to auto-populate organization_id from user's profile
CREATE OR REPLACE FUNCTION set_assignment_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate organization_id from the user's profile
  SELECT organization_id INTO NEW.organization_id
  FROM profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS set_assignment_organization_trigger ON assignments;
CREATE TRIGGER set_assignment_organization_trigger
BEFORE INSERT ON assignments
FOR EACH ROW
EXECUTE FUNCTION set_assignment_organization();

-- Backfill existing assignments with organization_id from their user's profile
UPDATE assignments a
SET organization_id = p.organization_id
FROM profiles p
WHERE a.user_id = p.id
AND a.organization_id IS NULL;

-- ============================================================================
-- 2. ADD organization_id TO DEBRIEFS TABLE
-- ============================================================================

ALTER TABLE debriefs
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_debriefs_organization_id ON debriefs(organization_id);

-- Create trigger function
CREATE OR REPLACE FUNCTION set_debrief_organization()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_debrief_organization_trigger ON debriefs;
CREATE TRIGGER set_debrief_organization_trigger
BEFORE INSERT ON debriefs
FOR EACH ROW
EXECUTE FUNCTION set_debrief_organization();

-- Backfill existing debriefs
UPDATE debriefs d
SET organization_id = p.organization_id
FROM profiles p
WHERE d.user_id = p.id
AND d.organization_id IS NULL;

-- ============================================================================
-- 3. ADD organization_id TO WELLNESS_CHECKINS TABLE
-- ============================================================================

ALTER TABLE wellness_checkins
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_wellness_checkins_organization_id ON wellness_checkins(organization_id);

CREATE OR REPLACE FUNCTION set_wellness_checkin_organization()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_wellness_checkin_organization_trigger ON wellness_checkins;
CREATE TRIGGER set_wellness_checkin_organization_trigger
BEFORE INSERT ON wellness_checkins
FOR EACH ROW
EXECUTE FUNCTION set_wellness_checkin_organization();

-- Backfill existing wellness checkins
UPDATE wellness_checkins w
SET organization_id = p.organization_id
FROM profiles p
WHERE w.user_id = p.id
AND w.organization_id IS NULL;

-- ============================================================================
-- 4. ADD organization_id TO FREE_WRITE_SESSIONS TABLE
-- ============================================================================

ALTER TABLE free_write_sessions
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_free_write_sessions_organization_id ON free_write_sessions(organization_id);

CREATE OR REPLACE FUNCTION set_free_write_organization()
RETURNS TRIGGER AS $$
BEGIN
  SELECT organization_id INTO NEW.organization_id
  FROM profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_free_write_organization_trigger ON free_write_sessions;
CREATE TRIGGER set_free_write_organization_trigger
BEFORE INSERT ON free_write_sessions
FOR EACH ROW
EXECUTE FUNCTION set_free_write_organization();

-- Backfill existing free write sessions
UPDATE free_write_sessions f
SET organization_id = p.organization_id
FROM profiles p
WHERE f.user_id = p.id
AND f.organization_id IS NULL;

-- ============================================================================
-- 5. ADD organization_id TO ELYA_CONVERSATIONS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'elya_conversations') THEN
    ALTER TABLE elya_conversations
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_elya_conversations_organization_id ON elya_conversations(organization_id);

    CREATE OR REPLACE FUNCTION set_elya_conversation_organization()
    RETURNS TRIGGER AS $func$
    BEGIN
      SELECT organization_id INTO NEW.organization_id
      FROM profiles
      WHERE id = NEW.user_id;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_elya_conversation_organization_trigger ON elya_conversations;
    CREATE TRIGGER set_elya_conversation_organization_trigger
    BEFORE INSERT ON elya_conversations
    FOR EACH ROW
    EXECUTE FUNCTION set_elya_conversation_organization();

    -- Backfill
    UPDATE elya_conversations e
    SET organization_id = p.organization_id
    FROM profiles p
    WHERE e.user_id = p.id
    AND e.organization_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 6. ADD organization_id TO USER_SKILL_PROGRESS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_skill_progress') THEN
    ALTER TABLE user_skill_progress
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_user_skill_progress_organization_id ON user_skill_progress(organization_id);

    CREATE OR REPLACE FUNCTION set_skill_progress_organization()
    RETURNS TRIGGER AS $func$
    BEGIN
      SELECT organization_id INTO NEW.organization_id
      FROM profiles
      WHERE id = NEW.user_id;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_skill_progress_organization_trigger ON user_skill_progress;
    CREATE TRIGGER set_skill_progress_organization_trigger
    BEFORE INSERT ON user_skill_progress
    FOR EACH ROW
    EXECUTE FUNCTION set_skill_progress_organization();

    -- Backfill
    UPDATE user_skill_progress u
    SET organization_id = p.organization_id
    FROM profiles p
    WHERE u.user_id = p.id
    AND u.organization_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 7. ADD organization_id TO DRILL_ATTEMPTS TABLE (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drill_attempts') THEN
    ALTER TABLE drill_attempts
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_drill_attempts_organization_id ON drill_attempts(organization_id);

    CREATE OR REPLACE FUNCTION set_drill_attempt_organization()
    RETURNS TRIGGER AS $func$
    BEGIN
      SELECT organization_id INTO NEW.organization_id
      FROM profiles
      WHERE id = NEW.user_id;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_drill_attempt_organization_trigger ON drill_attempts;
    CREATE TRIGGER set_drill_attempt_organization_trigger
    BEFORE INSERT ON drill_attempts
    FOR EACH ROW
    EXECUTE FUNCTION set_drill_attempt_organization();

    -- Backfill
    UPDATE drill_attempts d
    SET organization_id = p.organization_id
    FROM profiles p
    WHERE d.user_id = p.id
    AND d.organization_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 8. CREATE HELPER FUNCTION FOR AGENCY DATA QUERIES
-- ============================================================================

-- Function to get all user_ids for an organization (for agency dashboards)
CREATE OR REPLACE FUNCTION get_organization_user_ids(org_id UUID)
RETURNS TABLE (user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT om.user_id
  FROM organization_members om
  WHERE om.organization_id = org_id
  AND om.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_organization_user_ids TO authenticated;

-- ============================================================================
-- 9. UPDATE RLS POLICIES FOR ORGANIZATION ADMINS
-- ============================================================================

-- Allow organization admins to view assignments of their members
DROP POLICY IF EXISTS "Org admins can view member assignments" ON assignments;
CREATE POLICY "Org admins can view member assignments"
ON assignments FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('admin', 'owner', 'manager')
  )
);

-- Allow organization admins to view debriefs of their members
DROP POLICY IF EXISTS "Org admins can view member debriefs" ON debriefs;
CREATE POLICY "Org admins can view member debriefs"
ON debriefs FOR SELECT
USING (
  organization_id IN (
    SELECT om.organization_id
    FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.is_active = true
    AND om.role IN ('admin', 'owner', 'manager')
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN assignments.organization_id IS 'Organization this assignment belongs to (auto-populated from user profile)';
COMMENT ON COLUMN debriefs.organization_id IS 'Organization this debrief belongs to (auto-populated from user profile)';
COMMENT ON COLUMN wellness_checkins.organization_id IS 'Organization this checkin belongs to (auto-populated from user profile)';
COMMENT ON COLUMN free_write_sessions.organization_id IS 'Organization this session belongs to (auto-populated from user profile)';
COMMENT ON FUNCTION get_organization_user_ids IS 'Returns all active user_ids for an organization - used by agency dashboards';
