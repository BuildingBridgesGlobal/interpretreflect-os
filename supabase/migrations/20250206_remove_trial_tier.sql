-- Remove Trial Tier - Convert to Basic/Pro only model
-- Migration: 20250206_remove_trial_tier

-- ============================================
-- 1. MIGRATE EXISTING DATA FIRST (before constraints)
-- ============================================

-- Convert all 'trial' users to 'basic'
UPDATE profiles
SET subscription_tier = 'basic'
WHERE subscription_tier = 'trial' OR subscription_tier IS NULL;

-- Convert 'trialing' status to 'active'
UPDATE profiles
SET subscription_status = 'active'
WHERE subscription_status = 'trialing' OR subscription_status IS NULL;

-- ============================================
-- 2. DROP OLD CONSTRAINTS
-- ============================================

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

-- ============================================
-- 3. ADD NEW CONSTRAINTS (after data is clean)
-- ============================================

ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('basic', 'pro'));

ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('active', 'canceled', 'past_due'));

-- ============================================
-- 3. SET NEW DEFAULTS
-- ============================================

-- Change default tier from 'trial' to 'basic'
ALTER TABLE profiles ALTER COLUMN subscription_tier SET DEFAULT 'basic';

-- Change default status from 'trialing' to 'active'
ALTER TABLE profiles ALTER COLUMN subscription_status SET DEFAULT 'active';

-- ============================================
-- 4. UPDATE HANDLE_NEW_USER TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, subscription_tier, subscription_status)
  VALUES (
    NEW.id,
    NEW.email,
    'basic',  -- Default to free basic tier
    'active'  -- Active status (no trial)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. UPDATE RPC FUNCTION (optional trial_end param still accepted for Stripe compatibility)
-- ============================================

CREATE OR REPLACE FUNCTION apply_subscription_update(
  p_user_id UUID,
  p_status TEXT,
  p_tier TEXT,
  p_cycle TEXT,
  p_customer_id TEXT,
  p_subscription_id TEXT,
  p_trial_end TIMESTAMPTZ DEFAULT NULL  -- Keep for Stripe webhook compatibility, but ignored
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
    -- trial_ends_at is no longer used, but keep the column for now
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE profiles IS 'User profiles with two-tier model: Basic (Free) and Pro ($30/mo)';
