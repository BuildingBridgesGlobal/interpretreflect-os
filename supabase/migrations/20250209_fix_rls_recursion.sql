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

-- ============================================
-- FIX TRIGGER FUNCTIONS FOR TEAM ASSIGNMENTS
-- ============================================
-- These triggers need SECURITY DEFINER to bypass RLS when inserting
-- into assignment_team_members and team_prep_rooms tables

-- Fix add_creator_as_team_lead function - needs SECURITY DEFINER
CREATE OR REPLACE FUNCTION add_creator_as_team_lead()
RETURNS TRIGGER AS $$
BEGIN
  -- Only add team lead for team assignments
  IF NEW.is_team_assignment = true THEN
    INSERT INTO assignment_team_members (assignment_id, user_id, role, is_lead, joined_at)
    VALUES (NEW.id, NEW.user_id, 'interpreter', true, NOW())
    ON CONFLICT (assignment_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix create_team_prep_room function - needs SECURITY DEFINER
CREATE OR REPLACE FUNCTION create_team_prep_room()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create prep room for team assignments
  IF NEW.is_team_assignment = true THEN
    INSERT INTO team_prep_rooms (assignment_id)
    VALUES (NEW.id)
    ON CONFLICT (assignment_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
