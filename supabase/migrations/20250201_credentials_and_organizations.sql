-- Organizations and Credentials System
-- Migration: 20250201_credentials_and_organizations

-- Create organizations table for agencies
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  subscription_tier TEXT DEFAULT 'basic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add organization_id to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization lookups
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);

-- Create credentials table
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  credential_type TEXT NOT NULL, -- 'NIC', 'State License', 'CDI', 'BEI', etc.
  credential_name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  file_url TEXT, -- Supabase Storage URL
  status TEXT DEFAULT 'active', -- 'active', 'expiring_soon', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure status is one of the allowed values
  CONSTRAINT credentials_status_check CHECK (status IN ('active', 'expiring_soon', 'expired'))
);

-- Create indexes for credentials
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_organization_id ON credentials(organization_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);
CREATE INDEX IF NOT EXISTS idx_credentials_expiration_date ON credentials(expiration_date);

-- Create function to automatically set organization_id from user's profile
CREATE OR REPLACE FUNCTION set_credential_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate organization_id from the user's profile
  SELECT organization_id INTO NEW.organization_id
  FROM profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set organization_id on credential insert
CREATE TRIGGER set_credential_organization_trigger
BEFORE INSERT ON credentials
FOR EACH ROW
EXECUTE FUNCTION set_credential_organization();

-- Create function to automatically update credential status based on expiration
CREATE OR REPLACE FUNCTION update_credential_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expiration_date IS NOT NULL THEN
    IF NEW.expiration_date < CURRENT_DATE THEN
      NEW.status := 'expired';
    ELSIF NEW.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN
      NEW.status := 'expiring_soon';
    ELSE
      NEW.status := 'active';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update status on insert/update
CREATE TRIGGER update_credential_status_trigger
BEFORE INSERT OR UPDATE OF expiration_date ON credentials
FOR EACH ROW
EXECUTE FUNCTION update_credential_status();

-- Create function to get all credentials for an organization (for admin dashboard)
CREATE OR REPLACE FUNCTION get_organization_credentials(org_id UUID)
RETURNS TABLE (
  credential_id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  credential_type TEXT,
  credential_name TEXT,
  issue_date DATE,
  expiration_date DATE,
  status TEXT,
  file_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS credential_id,
    c.user_id,
    p.full_name AS user_name,
    p.email AS user_email,
    c.credential_type,
    c.credential_name,
    c.issue_date,
    c.expiration_date,
    c.status,
    c.file_url
  FROM credentials c
  INNER JOIN profiles p ON c.user_id = p.id
  WHERE c.organization_id = org_id
  ORDER BY
    CASE c.status
      WHEN 'expired' THEN 1
      WHEN 'expiring_soon' THEN 2
      WHEN 'active' THEN 3
    END,
    c.expiration_date ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_organization_credentials TO authenticated;

-- Create function to get credential stats for an organization
CREATE OR REPLACE FUNCTION get_organization_credential_stats(org_id UUID)
RETURNS TABLE (
  total_credentials BIGINT,
  active_count BIGINT,
  expiring_soon_count BIGINT,
  expired_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_credentials,
    COUNT(*) FILTER (WHERE status = 'active') AS active_count,
    COUNT(*) FILTER (WHERE status = 'expiring_soon') AS expiring_soon_count,
    COUNT(*) FILTER (WHERE status = 'expired') AS expired_count
  FROM credentials
  WHERE organization_id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_organization_credential_stats TO authenticated;

-- RLS Policies

-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Admins can view their own organization
CREATE POLICY "Admins can view their organization"
ON organizations FOR SELECT
USING (admin_user_id = auth.uid());

-- Admins can update their organization
CREATE POLICY "Admins can update their organization"
ON organizations FOR UPDATE
USING (admin_user_id = auth.uid());

-- Enable RLS on credentials
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;

-- Users can view their own credentials
CREATE POLICY "Users can view their own credentials"
ON credentials FOR SELECT
USING (user_id = auth.uid());

-- Users can insert their own credentials
CREATE POLICY "Users can insert their own credentials"
ON credentials FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update their own credentials
CREATE POLICY "Users can update their own credentials"
ON credentials FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete their own credentials
CREATE POLICY "Users can delete their own credentials"
ON credentials FOR DELETE
USING (user_id = auth.uid());

-- Admins can view all credentials in their organization
CREATE POLICY "Admins can view organization credentials"
ON credentials FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
    AND profiles.organization_id = credentials.organization_id
  )
);

-- Comments for clarity
COMMENT ON TABLE organizations IS 'Agencies and organizations that purchase InterpretReflect for their teams';
COMMENT ON TABLE credentials IS 'Professional credentials (certifications, licenses) for interpreters';
COMMENT ON COLUMN credentials.status IS 'Auto-calculated based on expiration_date: active, expiring_soon (within 90 days), or expired';
COMMENT ON FUNCTION get_organization_credentials IS 'Returns all credentials for an organization with user details, sorted by status and expiration';
COMMENT ON FUNCTION get_organization_credential_stats IS 'Returns credential count statistics for an organization dashboard';
