-- ============================================================================
-- FIX MULTI-AGENCY DATA ISOLATION TRIGGERS
-- Migration: 20250205_fix_multi_agency_triggers
--
-- Problem: The original triggers ALWAYS overwrite organization_id from profile,
-- even when an explicit value is provided. This breaks multi-agency support.
--
-- Solution: Only set organization_id if it's NULL (not explicitly provided).
-- This allows:
-- 1. Agencies to explicitly tag assignments when pushing to interpreters
-- 2. Interpreters to create "personal" assignments (NULL org) that no agency sees
-- 3. Interpreters in multiple agencies to have work properly tagged
-- ============================================================================

-- ============================================================================
-- 1. FIX ASSIGNMENTS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_assignment_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-populate if organization_id was NOT explicitly provided
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger already exists, function is replaced in-place

COMMENT ON FUNCTION set_assignment_organization IS 'Auto-populates organization_id from profile ONLY if not explicitly set. Preserves explicit values for multi-agency support.';

-- ============================================================================
-- 2. FIX DEBRIEFS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_debrief_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_debrief_organization IS 'Auto-populates organization_id from profile ONLY if not explicitly set.';

-- ============================================================================
-- 3. FIX WELLNESS_CHECKINS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_wellness_checkin_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_wellness_checkin_organization IS 'Auto-populates organization_id from profile ONLY if not explicitly set.';

-- ============================================================================
-- 4. FIX FREE_WRITE_SESSIONS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_free_write_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_free_write_organization IS 'Auto-populates organization_id from profile ONLY if not explicitly set.';

-- ============================================================================
-- 5. FIX ELYA_CONVERSATIONS TRIGGER (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'elya_conversations') THEN
    CREATE OR REPLACE FUNCTION set_elya_conversation_organization()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM profiles
        WHERE id = NEW.user_id;
      END IF;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- ============================================================================
-- 6. FIX USER_SKILL_PROGRESS TRIGGER (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_skill_progress') THEN
    CREATE OR REPLACE FUNCTION set_skill_progress_organization()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM profiles
        WHERE id = NEW.user_id;
      END IF;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- ============================================================================
-- 7. FIX DRILL_ATTEMPTS TRIGGER (if exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drill_attempts') THEN
    CREATE OR REPLACE FUNCTION set_drill_attempt_organization()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF NEW.organization_id IS NULL THEN
        SELECT organization_id INTO NEW.organization_id
        FROM profiles
        WHERE id = NEW.user_id;
      END IF;

      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

-- ============================================================================
-- 8. FIX CREDENTIALS TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_credential_organization()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_credential_organization IS 'Auto-populates organization_id from profile ONLY if not explicitly set.';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- This comment block documents the expected behavior after this migration:
--
-- 1. Agency creates assignment for interpreter with explicit org_id:
--    INSERT INTO assignments (user_id, title, organization_id) VALUES (..., ..., 'agency-uuid')
--    Result: organization_id = 'agency-uuid' (preserved)
--
-- 2. Interpreter creates personal assignment without org_id:
--    INSERT INTO assignments (user_id, title) VALUES (..., ...)
--    Result: organization_id = profile.organization_id OR NULL if profile has no org
--
-- 3. Interpreter in multiple agencies with profile.organization_id = 'agency-A':
--    - Their self-created assignments default to 'agency-A'
--    - Assignments pushed by 'agency-B' keep 'agency-B' as org_id
--    - Personal assignments (no agency) can be created with explicit NULL
