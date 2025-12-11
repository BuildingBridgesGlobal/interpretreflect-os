-- ============================================================================
-- FIX ORGANIZATION MEMBERS RLS
-- Migration: 20250213_fix_org_members_rls
--
-- The existing RLS policies have self-referential subqueries that cause
-- infinite recursion and 500 errors. This migration replaces them with
-- simple, non-recursive policies.
-- ============================================================================

-- Drop ALL existing policies on organization_members to start fresh
DROP POLICY IF EXISTS "Users can read their org memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Allow insert for service role" ON organization_members;
DROP POLICY IF EXISTS "Users can update own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON organization_members;
DROP POLICY IF EXISTS "org_members_select" ON organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;
DROP POLICY IF EXISTS "org_members_update" ON organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;

-- Ensure RLS is enabled
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SIMPLE NON-RECURSIVE POLICIES
-- ============================================================================

-- Users can ONLY read their own membership row (no recursion possible)
CREATE POLICY "org_members_select_own" ON organization_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to insert (the app controls what gets inserted)
CREATE POLICY "org_members_insert_new" ON organization_members
FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can update their own membership
CREATE POLICY "org_members_update_own" ON organization_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

-- Users can delete their own membership
CREATE POLICY "org_members_delete_own" ON organization_members
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- CREATE SECURITY DEFINER FUNCTION FOR ADMIN LOOKUPS
-- ============================================================================

-- This function bypasses RLS to check if a user is an org admin
-- Safe because it only returns a boolean, not actual data
CREATE OR REPLACE FUNCTION is_org_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_user_id
    AND is_active = true
    AND role IN ('owner', 'admin', 'manager')
  ) INTO v_is_admin;

  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION is_org_admin(uuid) TO authenticated;

COMMENT ON FUNCTION is_org_admin IS 'Check if a user is an organization admin (bypasses RLS safely)';
