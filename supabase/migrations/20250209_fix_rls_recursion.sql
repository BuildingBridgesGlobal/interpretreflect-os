-- ============================================
-- FIX RLS INFINITE RECURSION
-- ============================================
-- The "Org admins can view member assignments" policy on assignments
-- queries organization_members, which has its own RLS policies.
-- This causes infinite recursion. Fix by dropping the problematic policy.

-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Org admins can view member assignments" ON assignments;
DROP POLICY IF EXISTS "Org admins can view member debriefs" ON debriefs;

-- Ensure simple user-based policies exist for assignments
DROP POLICY IF EXISTS "assignments_select" ON assignments;
DROP POLICY IF EXISTS "assignments_insert" ON assignments;
DROP POLICY IF EXISTS "assignments_update" ON assignments;
DROP POLICY IF EXISTS "assignments_delete" ON assignments;

CREATE POLICY "assignments_select" ON assignments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "assignments_insert" ON assignments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assignments_update" ON assignments
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "assignments_delete" ON assignments
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- For org admin access to member data, create a SECURITY DEFINER function
-- This bypasses RLS and avoids recursion
CREATE OR REPLACE FUNCTION get_org_member_assignments(org_id UUID)
RETURNS SETOF assignments
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.*
  FROM assignments a
  WHERE a.organization_id = org_id;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_org_member_assignments(UUID) TO authenticated;

COMMENT ON FUNCTION get_org_member_assignments IS 'Returns all assignments for an organization - use for agency admin dashboards';
