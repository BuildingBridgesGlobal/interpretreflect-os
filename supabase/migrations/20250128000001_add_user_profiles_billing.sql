-- Add User Profiles with Subscription & Student Fields
-- Migration: 20250128000001_add_user_profiles_billing

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,

  -- Subscription fields
  subscription_tier TEXT CHECK (subscription_tier IN ('trial', 'basic', 'pro')) DEFAULT 'trial',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly')),
  subscription_status TEXT CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')) DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,

  -- Student/discount fields
  is_student BOOLEAN DEFAULT false,
  student_verified_at TIMESTAMPTZ,
  student_email TEXT, -- .edu email for verification
  is_new_interpreter BOOLEAN DEFAULT false, -- first 2 years discount
  certification_date DATE, -- to calculate new interpreter status

  -- Stripe fields
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,

  -- Onboarding data (from wizard)
  roles TEXT[], -- array of roles selected
  role_other TEXT,
  years_experience TEXT,
  settings TEXT[], -- array of settings selected
  settings_other TEXT,
  typical_workload TEXT,
  current_challenges TEXT[],
  challenges_other TEXT,
  what_brought_you TEXT,
  what_brought_you_other TEXT,
  primary_goal TEXT CHECK (primary_goal IN ('burnout', 'recovery', 'growth', 'season')),
  current_practices TEXT[],
  weekly_summary_opt_in BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_is_student ON profiles(is_student);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier_status ON profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_student_verified ON profiles(is_student, student_verified_at) WHERE is_student = true;

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile (for signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier, subscription_status, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    'trial', -- Default to trial tier
    'trialing', -- Start with trial status
    NOW() + INTERVAL '7 days' -- 7-day trial
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTION: Check if user is student-eligible
-- ============================================
CREATE OR REPLACE FUNCTION is_student_eligible(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT is_student, student_verified_at, is_new_interpreter, certification_date
  INTO profile_record
  FROM profiles
  WHERE id = profile_id;

  -- Student with verified .edu email
  IF profile_record.is_student AND profile_record.student_verified_at IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  -- New interpreter (within 2 years of certification)
  IF profile_record.is_new_interpreter AND profile_record.certification_date IS NOT NULL THEN
    IF (CURRENT_DATE - profile_record.certification_date) <= INTERVAL '2 years' THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: Auto-set user_id from auth.uid()
-- Security improvement: prevents users from writing to other users' data
-- ============================================

-- Function to set user_id automatically
CREATE OR REPLACE FUNCTION set_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to skill_goals
DROP TRIGGER IF EXISTS set_skill_goals_user_id ON skill_goals;
CREATE TRIGGER set_skill_goals_user_id
  BEFORE INSERT ON skill_goals
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_from_auth();

-- Apply to skill_assessments
DROP TRIGGER IF EXISTS set_skill_assessments_user_id ON skill_assessments;
CREATE TRIGGER set_skill_assessments_user_id
  BEFORE INSERT ON skill_assessments
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_from_auth();

-- Apply to agent_events
DROP TRIGGER IF EXISTS set_agent_events_user_id ON agent_events;
CREATE TRIGGER set_agent_events_user_id
  BEFORE INSERT ON agent_events
  FOR EACH ROW
  EXECUTE FUNCTION set_user_id_from_auth();

-- ============================================
-- RPC FUNCTION: Apply subscription update from Stripe webhook
-- ============================================
CREATE OR REPLACE FUNCTION apply_subscription_update(
  p_user_id UUID,
  p_status TEXT,
  p_tier TEXT,
  p_cycle TEXT,
  p_customer_id TEXT,
  p_subscription_id TEXT,
  p_trial_end TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    subscription_tier = p_tier,
    billing_cycle = p_cycle,
    subscription_status = p_status,
    stripe_customer_id = COALESCE(p_customer_id, stripe_customer_id),
    stripe_subscription_id = COALESCE(p_subscription_id, stripe_subscription_id),
    trial_ends_at = p_trial_end,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION apply_subscription_update TO authenticated;
