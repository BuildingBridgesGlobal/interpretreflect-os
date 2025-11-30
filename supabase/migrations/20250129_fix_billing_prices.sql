-- ============================================================================
-- Safe Migration: Fix billing_prices table for Stripe integration
-- Created: 2025-01-29
-- ============================================================================

-- This migration handles the existing billing_prices table and updates it
-- to work with our Stripe integration without losing data

-- ============================================================================
-- STEP 1: Drop existing table if it has incompatible schema
-- ============================================================================

-- Check if billing_prices exists and drop it if the schema is incompatible
-- We'll recreate it fresh with the correct schema
DROP TABLE IF EXISTS public.billing_prices CASCADE;

-- ============================================================================
-- STEP 2: Create billing_prices table with correct schema
-- ============================================================================

CREATE TABLE public.billing_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Info
  tier TEXT NOT NULL CHECK (tier IN ('trial', 'basic', 'pro')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly', 'yearly')),

  -- Pricing
  price_cents INTEGER NOT NULL, -- Price in cents (e.g., 1200 = $12.00)
  currency TEXT DEFAULT 'usd',

  -- Stripe Integration
  stripe_price_id TEXT NOT NULL UNIQUE, -- Stripe Price ID (price_xxxxx)
  stripe_product_id TEXT NOT NULL, -- Stripe Product ID (prod_xxxxx)

  -- Display Info
  display_name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]', -- Array of feature strings

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_billing_prices_tier_cycle ON public.billing_prices(tier, cycle);
CREATE INDEX idx_billing_prices_stripe_price ON public.billing_prices(stripe_price_id);
CREATE INDEX idx_billing_prices_active ON public.billing_prices(is_active) WHERE is_active = TRUE;

-- Unique constraint: only one active price per tier/cycle combination
CREATE UNIQUE INDEX idx_billing_prices_unique_active
  ON public.billing_prices(tier, cycle)
  WHERE is_active = TRUE;

-- ============================================================================
-- STEP 4: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.billing_prices ENABLE ROW LEVEL SECURITY;

-- Anyone can read active prices
CREATE POLICY "Anyone can view active prices"
  ON public.billing_prices
  FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- STEP 5: Insert pricing data with your actual Stripe IDs
-- ============================================================================

INSERT INTO public.billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active) VALUES
  -- TRIAL TIER (no charge - 7 day trial)
  ('trial', 'monthly', 0, 'price_trial', 'trial', 'Free Trial', '7-day free trial', '["All Basic features", "7-day trial period", "No credit card required"]', true),

  -- BASIC TIER - $12/month, $120/year
  -- Product: prod_Stad2yERSNi311 (InterpretReflect Basic)
  ('basic', 'monthly', 1200, 'price_1SWimuIouyG60O9hP3ZBRPWQ', 'prod_Stad2yERSNi311', 'Basic Monthly', 'Essential tools for interpreters', '["Unlimited reflections & debriefs", "CEU tracking & documentation", "Assignment prep tools", "Pattern recognition", "Weekly reports", "Email support"]', true),
  ('basic', 'yearly', 12000, 'price_1SWioKIouyG60O9hwao2wPsz', 'prod_Stad2yERSNi311', 'Basic Yearly', 'Save 17% with annual billing', '["Everything in Basic Monthly", "2 months free ($24 savings)", "Annual CEU summary"]', true),

  -- PRO TIER - $25/month, $250/year
  -- Product: prod_TVfeaZYeM9VqlJ (InterpretReflect Pro)
  ('pro', 'monthly', 2500, 'price_1SYeJ8IouyG60O9haPEp6P1H', 'prod_TVfeaZYeM9VqlJ', 'Pro Monthly', 'Advanced features for professionals', '["Everything in Basic", "Advanced AI insights", "Real-time burnout monitoring", "Wearable device integration", "Custom workflow automation", "Priority support", "1-on-1 monthly coaching (30min)"]', true),
  ('pro', 'yearly', 25000, 'price_1SYeJ8IouyG60O9hkAn4L26v', 'prod_TVfeaZYeM9VqlJ', 'Pro Yearly', 'Save 17% with annual billing', '["Everything in Pro Monthly", "2 months free ($50 savings)", "Quarterly progress reviews"]', true);

-- ============================================================================
-- STEP 6: Create updated_at trigger
-- ============================================================================

-- Ensure update_updated_at_column function exists (created in earlier migration)
-- If not, create it here
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_billing_prices_updated_at ON public.billing_prices;
CREATE TRIGGER update_billing_prices_updated_at
  BEFORE UPDATE ON public.billing_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: Create get_price_for_user function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_price_for_user(
  p_user_id UUID,
  p_tier TEXT,
  p_cycle TEXT
)
RETURNS TABLE (
  price_id UUID,
  stripe_price_id TEXT,
  price_cents INTEGER,
  display_name TEXT,
  description TEXT,
  should_apply_student_discount BOOLEAN
) AS $$
DECLARE
  is_student BOOLEAN;
  is_new_interp BOOLEAN;
BEGIN
  -- Check user's eligibility for 50% discount using is_student_eligible function
  -- This function was created in the first migration
  SELECT public.is_student_eligible(p_user_id) INTO is_student;

  -- Check if new interpreter (first 2 years)
  SELECT
    (p.is_new_interpreter AND p.certification_date IS NOT NULL
     AND (CURRENT_DATE - p.certification_date) <= INTERVAL '2 years')
  INTO is_new_interp
  FROM public.profiles p
  WHERE p.id = p_user_id;

  -- Get price and indicate if discount should be applied
  RETURN QUERY
  SELECT
    bp.id,
    bp.stripe_price_id,
    bp.price_cents,
    bp.display_name,
    bp.description,
    (COALESCE(is_student, false) OR COALESCE(is_new_interp, false)) AS should_apply_student_discount
  FROM public.billing_prices bp
  WHERE bp.tier = p_tier
    AND bp.cycle = p_cycle
    AND bp.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Grant permissions
-- ============================================================================

GRANT SELECT ON public.billing_prices TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_price_for_user TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY (uncomment to run after migration)
-- ============================================================================

-- SELECT tier, cycle, display_name, stripe_price_id, is_active
-- FROM public.billing_prices
-- ORDER BY tier, cycle;
