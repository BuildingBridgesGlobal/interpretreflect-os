-- ============================================================================
-- Fix billing_prices table - Ensure it exists and has data
-- ============================================================================

-- Drop existing table and recreate cleanly
DROP TABLE IF EXISTS public.billing_prices CASCADE;

-- Create billing_prices table
CREATE TABLE public.billing_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product Info
  tier TEXT NOT NULL CHECK (tier IN ('trial', 'basic', 'pro')),
  cycle TEXT NOT NULL CHECK (cycle IN ('monthly', 'yearly')),

  -- Pricing
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',

  -- Stripe Integration
  stripe_price_id TEXT NOT NULL UNIQUE,
  stripe_product_id TEXT NOT NULL,

  -- Display Info
  display_name TEXT NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]',

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_billing_prices_tier_cycle ON public.billing_prices(tier, cycle);
CREATE INDEX idx_billing_prices_stripe_price ON public.billing_prices(stripe_price_id);
CREATE INDEX idx_billing_prices_active ON public.billing_prices(is_active) WHERE is_active = TRUE;

-- Unique constraint: only one active price per tier/cycle combination
CREATE UNIQUE INDEX idx_billing_prices_unique_active
  ON public.billing_prices(tier, cycle)
  WHERE is_active = TRUE;

-- Insert pricing data
INSERT INTO public.billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active) VALUES
  -- TRIAL TIER
  ('trial', 'monthly', 0, 'price_trial', 'trial', 'Free Trial', '7-day free trial', '["All Basic features", "7-day trial period", "No credit card required"]', true),

  -- BASIC TIER - $12/month, $120/year
  ('basic', 'monthly', 1200, 'price_1SWimuIouyG60O9hP3ZBRPWQ', 'prod_Stad2yERSNi311', 'Basic Monthly', 'Essential tools for interpreters', '["Unlimited reflections & debriefs", "CEU tracking & documentation", "Assignment prep tools", "Pattern recognition", "Weekly reports", "Email support"]', true),
  ('basic', 'yearly', 12000, 'price_1SWioKIouyG60O9hwao2wPsz', 'prod_Stad2yERSNi311', 'Basic Yearly', 'Save 17% with annual billing', '["Everything in Basic Monthly", "2 months free ($24 savings)", "Annual CEU summary"]', true),

  -- PRO TIER - $25/month, $250/year
  ('pro', 'monthly', 2500, 'price_1SYeJ8IouyG60O9haPEp6P1H', 'prod_TVfeaZYeM9VqlJ', 'Pro Monthly', 'Advanced features for professionals', '["Everything in Basic", "Advanced AI insights", "Real-time burnout monitoring", "Wearable device integration", "Custom workflow automation", "Priority support", "1-on-1 monthly coaching (30min)"]', true),
  ('pro', 'yearly', 25000, 'price_1SYeJ8IouyG60O9hkAn4L26v', 'prod_TVfeaZYeM9VqlJ', 'Pro Yearly', 'Save 17% with annual billing', '["Everything in Pro Monthly", "2 months free ($50 savings)", "Quarterly progress reviews"]', true);

-- Enable RLS
ALTER TABLE public.billing_prices ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active prices (no authentication required)
DROP POLICY IF EXISTS "Anyone can view active prices" ON public.billing_prices;
CREATE POLICY "Anyone can view active prices"
  ON public.billing_prices
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Create updated_at trigger
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

-- Verify data was inserted
SELECT tier, cycle, display_name, stripe_price_id, price_cents, is_active
FROM public.billing_prices
ORDER BY tier, cycle;
