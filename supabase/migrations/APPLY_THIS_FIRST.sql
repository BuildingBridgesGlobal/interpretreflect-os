-- ============================================================================
-- SAFE MIGRATION: Apply All Schema Changes
-- Created: 2025-01-29
-- Run this FIRST in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Clean up existing data (if profiles table exists)
-- ============================================================================

-- Update any non-standard subscription_tier values to 'trial'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Update 'free' to 'trial'
    UPDATE public.profiles
    SET subscription_tier = 'trial'
    WHERE subscription_tier NOT IN ('trial', 'basic', 'pro');

    -- Update null values to 'trial'
    UPDATE public.profiles
    SET subscription_tier = 'trial'
    WHERE subscription_tier IS NULL;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Create helper function for updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create/Update PROFILES table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
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
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_is_student ON public.profiles(is_student);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_tier_status ON public.profiles(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_student_verified ON public.profiles(is_student, student_verified_at) WHERE is_student = true;

-- ============================================================================
-- STEP 4: RLS POLICIES for profiles
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================================
-- STEP 5: TRIGGER - Auto-create profile on user signup
-- ============================================================================

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
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 6: TRIGGER - Update updated_at timestamp
-- ============================================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: HELPER FUNCTION - Check if user is student-eligible
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_student_eligible(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  profile_record RECORD;
BEGIN
  SELECT is_student, student_verified_at, is_new_interpreter, certification_date
  INTO profile_record
  FROM public.profiles
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

-- ============================================================================
-- STEP 8: FUNCTION - Auto-set user_id from auth.uid()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_user_id_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 9: RPC FUNCTION - Apply subscription update from Stripe webhook
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_subscription_update(
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
  UPDATE public.profiles
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

-- ============================================================================
-- STEP 10: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_update TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY (run this after to confirm)
-- ============================================================================

-- SELECT
--   'profiles table exists' AS check_name,
--   CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles')
--     THEN '✓ PASS' ELSE '✗ FAIL' END AS status
-- UNION ALL
-- SELECT
--   'handle_new_user function exists',
--   CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')
--     THEN '✓ PASS' ELSE '✗ FAIL' END
-- UNION ALL
-- SELECT
--   'apply_subscription_update function exists',
--   CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'apply_subscription_update')
--     THEN '✓ PASS' ELSE '✗ FAIL' END;
