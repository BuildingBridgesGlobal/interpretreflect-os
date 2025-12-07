-- Add GROWTH tier and credit system
-- Migration: 20250206_growth_tier_and_credits

-- ============================================
-- UPDATE PROFILES TABLE: Add 'growth' tier and 'free' status
-- ============================================

-- Drop and recreate the constraint to include 'growth' and 'free'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'basic', 'free', 'growth', 'pro'));

-- Update 'basic' to 'free' for consistency with spec (basic = free forever)
UPDATE profiles SET subscription_tier = 'free' WHERE subscription_tier = 'basic';

-- Add credit tracking columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS topup_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS elya_conversations_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elya_reset_at TIMESTAMPTZ;

-- ============================================
-- UPDATE BILLING_PRICES TABLE: Add 'growth' tier and update pricing
-- ============================================

ALTER TABLE billing_prices
  DROP CONSTRAINT IF EXISTS billing_prices_tier_check;

ALTER TABLE billing_prices
  ADD CONSTRAINT billing_prices_tier_check
  CHECK (tier IN ('trial', 'basic', 'free', 'growth', 'pro'));

-- ============================================
-- DEACTIVATE OLD PRICES (Basic $12/mo was a paid tier, now FREE)
-- ============================================
-- Deactivate old Basic tier prices (they were $12/mo, $120/yr - now replaced by FREE $0)
UPDATE billing_prices
SET is_active = false
WHERE tier = 'basic' AND stripe_price_id IN (
  'price_1SWimuIouyG60O9hP3ZBRPWQ',  -- Basic Monthly $12
  'price_1SWioKIouyG60O9hwao2wPsz'   -- Basic Yearly $120
);

-- Deactivate old Pro tier prices (they were $25/mo, $250/yr - now $30/mo, $300/yr)
UPDATE billing_prices
SET is_active = false
WHERE tier = 'pro' AND stripe_price_id IN (
  'price_1SYeJ8IouyG60O9haPEp6P1H',  -- Pro Monthly $25
  'price_1SYeJ8IouyG60O9hkAn4L26v'   -- Pro Yearly $250
);

-- ============================================
-- INSERT NEW PRICING STRUCTURE
-- ============================================

-- FREE tier ($0 - replaces old Basic)
INSERT INTO billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active)
VALUES
  ('free', 'monthly', 0, 'price_free_tier', 'prod_free_tier', 'Free Forever', 'Start your wellness journey with Elya',
   '["5 Elya conversations/month", "Basic mood tracking", "Conversation history", "Calendar view", "Dark/light mode", "Profile management"]'::jsonb,
   true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- GROWTH tier ($15/month, $150/year)
INSERT INTO billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active)
VALUES
  ('growth', 'monthly', 1500, 'price_1SbPRKIouyG60O9h6no1ze29', 'prod_TYWU86WhwA1VZc', 'Growth Monthly', 'Daily support for working interpreters',
   '["Unlimited Elya conversations", "Pre-assignment prep workflow", "Post-assignment debrief", "Burnout monitoring", "Wellness tracking dashboard", "AI-generated insights", "Pattern detection", "Sentiment filtering", "AI auto-tags", "Export conversation history"]'::jsonb,
   true),
  ('growth', 'yearly', 15000, 'price_1SbPRKIouyG60O9h8mKfesoT', 'prod_TYWU86WhwA1VZc', 'Growth Yearly', 'Daily support for working interpreters - Save $30/year',
   '["Everything in Growth Monthly", "Save $30/year (2 months free)"]'::jsonb,
   true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- PRO tier ($30/month, $300/year) - NEW PRICING
INSERT INTO billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active)
VALUES
  ('pro', 'monthly', 3000, 'price_1SbPVqIouyG60O9hpGwXMiDT', 'prod_TYWYSOCveXGns1', 'Pro Monthly', 'Full professional toolkit with CEU credits',
   '["Everything in Growth", "4 CEU credits/month", "All theory videos", "All skill practice modules", "All Deep Dive case studies", "CEU certificates on completion", "RID compliance tracking", "Competency profile & growth tracking", "Priority support"]'::jsonb,
   true),
  ('pro', 'yearly', 30000, 'price_1SbPVqIouyG60O9hVnf6dnkN', 'prod_TYWYSOCveXGns1', 'Pro Yearly', 'Full professional toolkit with CEU credits - Save $60/year',
   '["Everything in Pro Monthly", "Save $60/year (2 months free)"]'::jsonb,
   true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- ============================================
-- CREDIT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Transaction details
  credit_type TEXT NOT NULL CHECK (credit_type IN ('monthly', 'topup', 'bonus')),
  amount INTEGER NOT NULL, -- positive = add, negative = spend
  balance_after INTEGER NOT NULL,

  -- What the credit was used for (if spending)
  module_id UUID REFERENCES skill_modules(id),
  module_code TEXT,
  ceu_value NUMERIC(4,2),

  -- Top-up purchase details (if buying)
  stripe_payment_id TEXT,
  package_name TEXT, -- 'small', 'medium', 'large'
  package_price_cents INTEGER,

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert credit transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TOP-UP PACKAGES REFERENCE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS topup_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'small', 'medium', 'large'
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert top-up packages
INSERT INTO topup_packages (name, credits, price_cents, stripe_price_id, display_name, description)
VALUES
  ('small', 2, 500, 'price_1SbPcHIouyG60O9hBuq9R3M9', '2 Credits', '$2.50 per credit'),
  ('medium', 4, 800, 'price_1SbPcHIouyG60O9hmx03tY2W', '4 Credits', '$2.00 per credit - Best value'),
  ('large', 8, 1400, 'price_1SbPcHIouyG60O9hGOb2t5oS', '8 Credits', '$1.75 per credit')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- FUNCTION: Add monthly credits on billing cycle
-- ============================================

CREATE OR REPLACE FUNCTION add_monthly_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tier TEXT;
  v_credits_to_add INTEGER;
BEGIN
  -- Get user's tier
  SELECT subscription_tier INTO v_tier FROM profiles WHERE id = p_user_id;

  -- Pro gets 4 credits, others get 0
  IF v_tier = 'pro' THEN
    v_credits_to_add := 4;
  ELSE
    v_credits_to_add := 0;
  END IF;

  -- Reset monthly credits (don't roll over) and record transaction
  UPDATE profiles
  SET
    monthly_credits = v_credits_to_add,
    credits_reset_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the transaction
  IF v_credits_to_add > 0 THEN
    INSERT INTO credit_transactions (user_id, credit_type, amount, balance_after, description)
    VALUES (p_user_id, 'monthly', v_credits_to_add, v_credits_to_add, 'Monthly credit refresh');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Spend credits on a module
-- ============================================

CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_module_id UUID,
  p_credits_required INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_monthly_credits INTEGER;
  v_topup_credits INTEGER;
  v_monthly_spent INTEGER := 0;
  v_topup_spent INTEGER := 0;
  v_remaining INTEGER;
  v_module_code TEXT;
  v_ceu_value NUMERIC(4,2);
BEGIN
  -- Lock the user's profile row to prevent double-spend from concurrent requests
  SELECT monthly_credits, topup_credits INTO v_monthly_credits, v_topup_credits
  FROM profiles WHERE id = p_user_id
  FOR UPDATE;

  -- Get module details
  SELECT module_code, ceu_value INTO v_module_code, v_ceu_value
  FROM skill_modules WHERE id = p_module_id;

  -- Check if user has enough credits
  IF (v_monthly_credits + v_topup_credits) < p_credits_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;

  -- Spend monthly credits first (use-it-or-lose-it), then top-up
  IF v_monthly_credits >= p_credits_required THEN
    v_monthly_spent := p_credits_required;
  ELSE
    v_monthly_spent := v_monthly_credits;
    v_topup_spent := p_credits_required - v_monthly_credits;
  END IF;

  -- Update balances atomically
  UPDATE profiles
  SET
    monthly_credits = monthly_credits - v_monthly_spent,
    topup_credits = topup_credits - v_topup_spent,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING monthly_credits + topup_credits INTO v_remaining;

  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id, credit_type, amount, balance_after,
    module_id, module_code, ceu_value, description
  )
  VALUES (
    p_user_id,
    CASE WHEN v_topup_spent > 0 THEN 'topup' ELSE 'monthly' END,
    -p_credits_required,
    v_remaining,
    p_module_id,
    v_module_code,
    v_ceu_value,
    'Spent on ' || v_module_code
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_spent', p_credits_required,
    'monthly_used', v_monthly_spent,
    'topup_used', v_topup_spent,
    'remaining_balance', v_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Add top-up credits
-- ============================================

CREATE OR REPLACE FUNCTION add_topup_credits(
  p_user_id UUID,
  p_credits INTEGER,
  p_stripe_payment_id TEXT,
  p_package_name TEXT,
  p_price_cents INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_new_balance INTEGER;
  v_existing_tx UUID;
BEGIN
  -- Idempotency check: prevent duplicate processing of same Stripe payment
  SELECT id INTO v_existing_tx
  FROM credit_transactions
  WHERE stripe_payment_id = p_stripe_payment_id
  LIMIT 1;

  IF v_existing_tx IS NOT NULL THEN
    -- Already processed this payment, return current balance
    SELECT topup_credits INTO v_new_balance FROM profiles WHERE id = p_user_id;
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true,
      'credits_added', 0,
      'new_balance', v_new_balance
    );
  END IF;

  -- Update topup balance atomically
  UPDATE profiles
  SET
    topup_credits = topup_credits + p_credits,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING topup_credits INTO v_new_balance;

  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id, credit_type, amount, balance_after,
    stripe_payment_id, package_name, package_price_cents, description
  )
  VALUES (
    p_user_id, 'topup', p_credits, v_new_balance,
    p_stripe_payment_id, p_package_name, p_price_cents,
    'Purchased ' || p_credits || ' credits (' || p_package_name || ' package)'
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits,
    'new_balance', v_new_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Reset Elya conversation count (monthly)
-- ============================================

CREATE OR REPLACE FUNCTION reset_elya_conversations(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    elya_conversations_this_month = 0,
    elya_reset_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Check and increment Elya conversation
-- ============================================

CREATE OR REPLACE FUNCTION check_elya_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_limit INTEGER;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Get user data
  SELECT subscription_tier, elya_conversations_this_month, elya_reset_at
  INTO v_tier, v_count, v_reset_at
  FROM profiles WHERE id = p_user_id;

  -- Check if we need to reset (new month)
  IF v_reset_at IS NULL OR v_reset_at < date_trunc('month', NOW()) THEN
    PERFORM reset_elya_conversations(p_user_id);
    v_count := 0;
  END IF;

  -- Set limit based on tier
  IF v_tier IN ('growth', 'pro') THEN
    v_limit := -1; -- Unlimited
  ELSE
    v_limit := 5; -- Free tier
  END IF;

  -- Check limit
  IF v_limit != -1 AND v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Monthly limit reached',
      'used', v_count,
      'limit', v_limit,
      'upgrade_message', 'Upgrade to Growth for unlimited Elya conversations'
    );
  END IF;

  -- Increment count
  UPDATE profiles
  SET
    elya_conversations_this_month = elya_conversations_this_month + 1,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'used', v_count + 1,
    'limit', v_limit,
    'unlimited', v_limit = -1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD AUDIT COLUMN TO CREDIT_TRANSACTIONS
-- ============================================

-- Add created_by for audit trail (defaults to current user)
ALTER TABLE credit_transactions
  ADD COLUMN IF NOT EXISTS created_by UUID DEFAULT auth.uid();

-- Add better index for user lookups with date ordering
DROP INDEX IF EXISTS idx_credit_transactions_user;
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date
  ON credit_transactions(user_id, created_at DESC);

-- Index for idempotency checks on Stripe payment ID
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment
  ON credit_transactions(stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;

-- ============================================
-- SELF-GUARD WRAPPER FUNCTIONS FOR USER-FACING OPERATIONS
-- ============================================

-- Users can only check their own Elya limit
CREATE OR REPLACE FUNCTION check_my_elya_limit()
RETURNS JSONB AS $$
BEGIN
  RETURN check_elya_limit(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can only spend their own credits
CREATE OR REPLACE FUNCTION spend_my_credits(
  p_module_id UUID,
  p_credits_required INTEGER
)
RETURNS JSONB AS $$
BEGIN
  RETURN spend_credits(auth.uid(), p_module_id, p_credits_required);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Tables
GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON topup_packages TO authenticated;

-- Admin/webhook functions (service role only - called from API routes)
GRANT EXECUTE ON FUNCTION add_monthly_credits TO service_role;
GRANT EXECUTE ON FUNCTION spend_credits TO service_role;
GRANT EXECUTE ON FUNCTION add_topup_credits TO service_role;
GRANT EXECUTE ON FUNCTION reset_elya_conversations TO service_role;
GRANT EXECUTE ON FUNCTION check_elya_limit TO service_role;

-- User-facing self-guard functions
GRANT EXECUTE ON FUNCTION check_my_elya_limit TO authenticated;
GRANT EXECUTE ON FUNCTION spend_my_credits TO authenticated;
