-- Agency Invite Codes System
-- Migration: 20250203_agency_invite_codes
-- Purpose: Allow admins to create invite codes for agencies after discovery calls

-- Create agency_invite_codes table
CREATE TABLE IF NOT EXISTS agency_invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  agency_admin_email TEXT, -- Optional: pre-specified email for the agency admin
  notes TEXT, -- Notes from discovery call
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure code is valid
  CONSTRAINT invite_code_length CHECK (length(code) >= 6)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agency_invite_codes_code ON agency_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_agency_invite_codes_org ON agency_invite_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_invite_codes_active ON agency_invite_codes(is_active) WHERE is_active = true;

-- Create organization_members table for tracking agency memberships
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'interpreter', -- 'owner', 'admin', 'manager', 'interpreter'
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invite_code_id UUID REFERENCES agency_invite_codes(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only be in one organization with one role
  CONSTRAINT unique_org_member UNIQUE (organization_id, user_id),
  -- Validate role values
  CONSTRAINT valid_member_role CHECK (role IN ('owner', 'admin', 'manager', 'interpreter'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_active ON organization_members(is_active) WHERE is_active = true;

-- Function to generate a readable invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Removed confusing chars like 0, O, 1, I
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate format: XXXX-XXXX (8 chars with dash)
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to validate and use an invite code
CREATE OR REPLACE FUNCTION validate_invite_code(p_code TEXT)
RETURNS TABLE (
  is_valid BOOLEAN,
  organization_id UUID,
  organization_name TEXT,
  error_message TEXT,
  invite_code_id UUID
) AS $$
DECLARE
  v_invite agency_invite_codes%ROWTYPE;
  v_org_name TEXT;
BEGIN
  -- Look up the invite code
  SELECT * INTO v_invite
  FROM agency_invite_codes
  WHERE code = UPPER(TRIM(p_code));

  -- Check if code exists
  IF v_invite IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'Invalid invite code'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if code is active
  IF NOT v_invite.is_active THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'This invite code has been deactivated'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if code has expired
  IF v_invite.expires_at < NOW() THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'This invite code has expired'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Check if code has reached max uses
  IF v_invite.current_uses >= v_invite.max_uses THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, 'This invite code has reached its maximum uses'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get organization name
  SELECT name INTO v_org_name FROM organizations WHERE id = v_invite.organization_id;

  -- Code is valid!
  RETURN QUERY SELECT true, v_invite.organization_id, v_org_name, NULL::TEXT, v_invite.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use an invite code (increment usage count)
CREATE OR REPLACE FUNCTION use_invite_code(p_code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE agency_invite_codes
  SET
    current_uses = current_uses + 1,
    updated_at = NOW()
  WHERE id = p_code_id;

  -- Automatically deactivate if max uses reached
  UPDATE agency_invite_codes
  SET is_active = false
  WHERE id = p_code_id AND current_uses >= max_uses;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Enable RLS
ALTER TABLE agency_invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Admins can view all invite codes (for their organizations or if they're a super admin)
CREATE POLICY "Admins can view invite codes"
ON agency_invite_codes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can create invite codes
CREATE POLICY "Admins can create invite codes"
ON agency_invite_codes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admins can update invite codes
CREATE POLICY "Admins can update invite codes"
ON agency_invite_codes FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Organization members can view their own organization memberships
CREATE POLICY "Users can view their own memberships"
ON organization_members FOR SELECT
USING (user_id = auth.uid());

-- Org admins/owners can view all org members
CREATE POLICY "Org admins can view all org members"
ON organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role IN ('owner', 'admin', 'manager')
    AND om.is_active = true
  )
);

-- Org admins can add members
CREATE POLICY "Org admins can add members"
ON organization_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role IN ('owner', 'admin', 'manager')
    AND om.is_active = true
  )
  OR
  -- Or if using an invite code (handled by service role)
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Org admins can update members
CREATE POLICY "Org admins can update members"
ON organization_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.user_id = auth.uid()
    AND om.organization_id = organization_members.organization_id
    AND om.role IN ('owner', 'admin')
    AND om.is_active = true
  )
);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION validate_invite_code TO authenticated;
GRANT EXECUTE ON FUNCTION use_invite_code TO authenticated;

-- Comments
COMMENT ON TABLE agency_invite_codes IS 'Invite codes generated for agencies after discovery calls';
COMMENT ON TABLE organization_members IS 'Tracks which users belong to which organizations and their roles';
COMMENT ON FUNCTION generate_invite_code IS 'Generates a human-readable invite code in XXXX-XXXX format';
COMMENT ON FUNCTION validate_invite_code IS 'Validates an invite code and returns organization details if valid';
COMMENT ON FUNCTION use_invite_code IS 'Increments the usage count for an invite code';
