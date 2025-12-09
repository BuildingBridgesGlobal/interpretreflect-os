-- Production Safe Sync Migration V3
-- Drop ALL existing policies first, then recreate

-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- Organization members policies
DROP POLICY IF EXISTS "Users can read their org memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can view own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can view org members" ON organization_members;
DROP POLICY IF EXISTS "Allow insert for service role" ON organization_members;
DROP POLICY IF EXISTS "Users can update own membership" ON organization_members;
DROP POLICY IF EXISTS "Users can delete own membership" ON organization_members;

-- Assignments policies
DROP POLICY IF EXISTS "Users can manage their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can select their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can insert their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can update their assignments" ON assignments;
DROP POLICY IF EXISTS "Users can delete their assignments" ON assignments;

-- ============================================
-- ADD MISSING COLUMNS
-- ============================================
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time TIME;

CREATE INDEX IF NOT EXISTS idx_assignments_completed ON assignments(completed);

-- ============================================
-- CREATE SIMPLE RLS POLICIES
-- ============================================

-- Organization members - simple policies
CREATE POLICY "org_members_select" ON organization_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "org_members_insert" ON organization_members
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "org_members_update" ON organization_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "org_members_delete" ON organization_members
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- Assignments - simple policies
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

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON organization_members TO service_role;
GRANT ALL ON assignments TO service_role;
GRANT ALL ON organizations TO service_role;
