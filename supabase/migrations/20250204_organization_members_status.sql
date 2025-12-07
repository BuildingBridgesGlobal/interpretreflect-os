-- Organization Members Status Enhancement
-- Migration: 20250204_organization_members_status
-- Purpose: Add status workflow, data sharing preferences, and timestamps for edge cases

-- Add status column with enum values
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add timestamp columns for tracking state changes
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS declined_at TIMESTAMPTZ;
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ;

-- Add data sharing preferences with sensible defaults
-- Share activity metrics by default, but never share actual content
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS data_sharing_preferences JSONB DEFAULT '{
  "share_prep_completion": true,
  "share_debrief_completion": true,
  "share_credential_status": true,
  "share_checkin_streaks": true,
  "share_module_progress": true
}'::jsonb;

-- Add constraint for valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_member_status'
  ) THEN
    ALTER TABLE organization_members ADD CONSTRAINT valid_member_status
      CHECK (status IN ('pending', 'active', 'declined', 'removed'));
  END IF;
END $$;

-- Create trigger function to keep is_active in sync with status
-- This maintains backwards compatibility with existing code
CREATE OR REPLACE FUNCTION sync_member_status()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_active := (NEW.status = 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_member_status_trigger ON organization_members;
CREATE TRIGGER sync_member_status_trigger
  BEFORE INSERT OR UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION sync_member_status();

-- Backfill existing records: set invited_at to created_at for existing members
UPDATE organization_members
SET invited_at = created_at
WHERE invited_at IS NULL;

-- Backfill status based on is_active for existing records
UPDATE organization_members
SET status = CASE WHEN is_active THEN 'active' ELSE 'removed' END
WHERE status IS NULL OR status = '';

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_org_members_status ON organization_members(status);

-- Helper function: Invite an interpreter to an organization
CREATE OR REPLACE FUNCTION invite_interpreter_to_org(
  p_organization_id UUID,
  p_user_id UUID,
  p_invited_by UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  membership_id UUID
) AS $$
DECLARE
  v_existing organization_members%ROWTYPE;
  v_new_id UUID;
BEGIN
  -- Check if membership already exists
  SELECT * INTO v_existing
  FROM organization_members
  WHERE organization_id = p_organization_id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    -- Handle based on current status
    CASE v_existing.status
      WHEN 'active' THEN
        RETURN QUERY SELECT false, 'Interpreter is already an active member'::TEXT, v_existing.id;
        RETURN;
      WHEN 'pending' THEN
        RETURN QUERY SELECT false, 'Invitation already pending'::TEXT, v_existing.id;
        RETURN;
      WHEN 'declined', 'removed' THEN
        -- Re-invite: update status to pending
        UPDATE organization_members
        SET status = 'pending',
            invited_at = NOW(),
            invited_by = p_invited_by,
            declined_at = NULL,
            removed_at = NULL,
            updated_at = NOW()
        WHERE id = v_existing.id;
        RETURN QUERY SELECT true, 'Re-invitation sent'::TEXT, v_existing.id;
        RETURN;
    END CASE;
  END IF;

  -- Create new membership with pending status
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    created_at,
    updated_at
  ) VALUES (
    p_organization_id,
    p_user_id,
    'interpreter',
    'pending',
    p_invited_by,
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_new_id;

  RETURN QUERY SELECT true, 'Invitation sent'::TEXT, v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Interpreter responds to invitation
CREATE OR REPLACE FUNCTION respond_to_org_invite(
  p_membership_id UUID,
  p_user_id UUID,
  p_accept BOOLEAN
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_membership organization_members%ROWTYPE;
BEGIN
  -- Get the membership
  SELECT * INTO v_membership
  FROM organization_members
  WHERE id = p_membership_id AND user_id = p_user_id;

  IF v_membership IS NULL THEN
    RETURN QUERY SELECT false, 'Invitation not found'::TEXT;
    RETURN;
  END IF;

  IF v_membership.status != 'pending' THEN
    RETURN QUERY SELECT false, 'This invitation is no longer pending'::TEXT;
    RETURN;
  END IF;

  IF p_accept THEN
    UPDATE organization_members
    SET status = 'active',
        joined_at = NOW(),
        updated_at = NOW()
    WHERE id = p_membership_id;
    RETURN QUERY SELECT true, 'You have joined the organization'::TEXT;
  ELSE
    UPDATE organization_members
    SET status = 'declined',
        declined_at = NOW(),
        updated_at = NOW()
    WHERE id = p_membership_id;
    RETURN QUERY SELECT true, 'Invitation declined'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Admin removes interpreter from organization
CREATE OR REPLACE FUNCTION remove_member_from_org(
  p_membership_id UUID,
  p_admin_user_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_membership organization_members%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  -- Get the membership
  SELECT * INTO v_membership
  FROM organization_members
  WHERE id = p_membership_id;

  IF v_membership IS NULL THEN
    RETURN QUERY SELECT false, 'Member not found'::TEXT;
    RETURN;
  END IF;

  -- Verify the requester is an admin of this organization
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE user_id = p_admin_user_id
    AND organization_id = v_membership.organization_id
    AND role IN ('owner', 'admin', 'manager')
    AND status = 'active'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'Not authorized to remove members'::TEXT;
    RETURN;
  END IF;

  -- Can't remove yourself if you're the owner
  IF v_membership.user_id = p_admin_user_id AND v_membership.role = 'owner' THEN
    RETURN QUERY SELECT false, 'Owner cannot remove themselves'::TEXT;
    RETURN;
  END IF;

  -- Remove the member
  UPDATE organization_members
  SET status = 'removed',
      removed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_membership_id;

  RETURN QUERY SELECT true, 'Member removed from organization'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Update data sharing preferences
CREATE OR REPLACE FUNCTION update_data_sharing_preferences(
  p_membership_id UUID,
  p_user_id UUID,
  p_preferences JSONB
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_membership organization_members%ROWTYPE;
BEGIN
  -- Get the membership and verify ownership
  SELECT * INTO v_membership
  FROM organization_members
  WHERE id = p_membership_id AND user_id = p_user_id;

  IF v_membership IS NULL THEN
    RETURN QUERY SELECT false, 'Membership not found'::TEXT;
    RETURN;
  END IF;

  -- Update preferences
  UPDATE organization_members
  SET data_sharing_preferences = p_preferences,
      updated_at = NOW()
  WHERE id = p_membership_id;

  RETURN QUERY SELECT true, 'Preferences updated'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION invite_interpreter_to_org TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_org_invite TO authenticated;
GRANT EXECUTE ON FUNCTION remove_member_from_org TO authenticated;
GRANT EXECUTE ON FUNCTION update_data_sharing_preferences TO authenticated;

-- Comments
COMMENT ON COLUMN organization_members.status IS 'Member status: pending (invited), active (joined), declined (rejected invite), removed (removed by admin)';
COMMENT ON COLUMN organization_members.invited_at IS 'When the invitation was sent';
COMMENT ON COLUMN organization_members.declined_at IS 'When the interpreter declined the invitation';
COMMENT ON COLUMN organization_members.removed_at IS 'When the admin removed the interpreter';
COMMENT ON COLUMN organization_members.data_sharing_preferences IS 'What data the interpreter allows the agency to see';
COMMENT ON FUNCTION invite_interpreter_to_org IS 'Invite an interpreter to an organization, handles re-invites';
COMMENT ON FUNCTION respond_to_org_invite IS 'Interpreter accepts or declines an organization invitation';
COMMENT ON FUNCTION remove_member_from_org IS 'Admin removes an interpreter from their organization';
COMMENT ON FUNCTION update_data_sharing_preferences IS 'Interpreter updates what data they share with the agency';
