-- Production Safe Sync Migration
-- This migration safely creates all required tables and policies using IF NOT EXISTS patterns
-- Safe to run on any database state

-- ============================================
-- EXTENSIONS
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (core user data)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'trial',
  billing_cycle TEXT,
  subscription_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  is_student BOOLEAN DEFAULT false,
  student_verified_at TIMESTAMPTZ,
  student_email TEXT,
  is_new_interpreter BOOLEAN DEFAULT false,
  certification_date DATE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  roles TEXT[],
  role_other TEXT,
  years_experience TEXT,
  settings TEXT[],
  settings_other TEXT,
  typical_workload TEXT,
  current_challenges TEXT[],
  challenges_other TEXT,
  what_brought_you TEXT,
  what_brought_you_other TEXT,
  primary_goal TEXT,
  current_practices TEXT[],
  weekly_summary_opt_in BOOLEAN DEFAULT false,
  organization_id UUID,
  role TEXT DEFAULT 'user',
  rid_member_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rid_member_number TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  admin_user_id UUID,
  subscription_tier TEXT DEFAULT 'basic',
  max_seats INTEGER DEFAULT 10,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'manager', 'member')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

-- ============================================
-- AGENCY INVITE CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS agency_invite_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  max_uses INTEGER DEFAULT 100,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE,
  start_time TIME,
  end_time TIME,
  location TEXT,
  client_name TEXT,
  specialty TEXT,
  status TEXT DEFAULT 'scheduled',
  user_id UUID NOT NULL,
  organization_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_date ON assignments(date);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- ============================================
-- CREDENTIALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  organization_id UUID,
  credential_type TEXT NOT NULL,
  credential_name TEXT NOT NULL,
  issuing_organization TEXT,
  issue_date DATE,
  expiration_date DATE,
  file_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON credentials(status);

-- ============================================
-- CEU CERTIFICATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ceu_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  module_code TEXT NOT NULL,
  title TEXT NOT NULL,
  ceu_value DECIMAL(3,1) NOT NULL,
  activity_code TEXT,
  completion_date DATE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  pdf_url TEXT,
  verification_url TEXT,
  rid_member_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceu_certs_user_id ON ceu_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_certs_cert_number ON ceu_certificates(certificate_number);

-- ============================================
-- CEU GRIEVANCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ceu_grievances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  grievance_type TEXT NOT NULL,
  certificate_id UUID REFERENCES ceu_certificates(id),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ceu_grievances_user_id ON ceu_grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_ceu_grievances_status ON ceu_grievances(status);

-- ============================================
-- RLS POLICIES (with safe drop/create pattern)
-- ============================================

-- PROFILES RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- ORGANIZATION MEMBERS RLS
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read their org memberships" ON organization_members;
DROP POLICY IF EXISTS "Admins can manage org members" ON organization_members;

CREATE POLICY "Users can read their org memberships" ON organization_members
FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = auth.uid()
  AND om.organization_id = organization_members.organization_id
  AND om.role IN ('owner', 'admin', 'manager')
));

CREATE POLICY "Admins can manage org members" ON organization_members
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = auth.uid()
  AND om.organization_id = organization_members.organization_id
  AND om.role IN ('owner', 'admin')
));

-- ORGANIZATIONS RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization" ON organizations
FOR SELECT TO authenticated
USING (
  admin_user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_members.organization_id = organizations.id
    AND organization_members.user_id = auth.uid()
  )
);

-- ASSIGNMENTS RLS
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their assignments" ON assignments;

CREATE POLICY "Users can manage their assignments" ON assignments
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- CREDENTIALS RLS
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their credentials" ON credentials;

CREATE POLICY "Users can manage their credentials" ON credentials
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- CEU CERTIFICATES RLS
ALTER TABLE ceu_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their certificates" ON ceu_certificates;
DROP POLICY IF EXISTS "Users can insert their certificates" ON ceu_certificates;

CREATE POLICY "Users can view their certificates" ON ceu_certificates
FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their certificates" ON ceu_certificates
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- CEU GRIEVANCES RLS
ALTER TABLE ceu_grievances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their grievances" ON ceu_grievances;

CREATE POLICY "Users can manage their grievances" ON ceu_grievances
FOR ALL TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- GRANTS
-- ============================================
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON organization_members TO authenticated;
GRANT ALL ON agency_invite_codes TO authenticated;
GRANT ALL ON assignments TO authenticated;
GRANT ALL ON credentials TO authenticated;
GRANT ALL ON ceu_certificates TO authenticated;
GRANT ALL ON ceu_grievances TO authenticated;

-- ============================================
-- AUTO-CREATE PROFILE TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier, subscription_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    'trial',
    'trialing',
    NOW() + INTERVAL '7 days'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
