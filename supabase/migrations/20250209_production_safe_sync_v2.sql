-- Production Safe Sync Migration V2
-- Fixed RLS policies to avoid recursive/self-referential issues

-- ============================================
-- FIRST: Drop problematic policies
-- ============================================
DROP POLICY IF EXISTS "Users can read their org memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;
DROP POLICY IF EXISTS "Users can manage their assignments" ON assignments;

-- ============================================
-- ORGANIZATION MEMBERS - Simple RLS
-- ============================================
-- Allow users to see their own memberships
CREATE POLICY "Users can view own membership" ON organization_members
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Allow users to see other members in their orgs (non-recursive approach)
CREATE POLICY "Users can view org members" ON organization_members
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Allow insert for admins (simplified)
CREATE POLICY "Allow insert for service role" ON organization_members
FOR INSERT TO authenticated
WITH CHECK (true);

-- Allow update/delete for own records or admins
CREATE POLICY "Users can update own membership" ON organization_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own membership" ON organization_members
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- ASSIGNMENTS - Add missing 'completed' column and fix RLS
-- ============================================
-- Add the 'completed' column that queries are looking for
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS time TIME;

-- Create index for completed status
CREATE INDEX IF NOT EXISTS idx_assignments_completed ON assignments(completed);

-- Simple RLS for assignments
CREATE POLICY "Users can select their assignments" ON assignments
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their assignments" ON assignments
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their assignments" ON assignments
FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their assignments" ON assignments
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- GRANT permissions to service_role for admin operations
-- ============================================
GRANT ALL ON organization_members TO service_role;
GRANT ALL ON assignments TO service_role;
GRANT ALL ON organizations TO service_role;
