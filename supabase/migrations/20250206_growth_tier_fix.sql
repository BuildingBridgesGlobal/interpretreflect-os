-- Fix for growth tier - update existing or insert new
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: UPDATE PROFILES TABLE
-- ============================================

-- Drop and recreate the constraint to include 'growth' and 'free'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'basic', 'free', 'growth', 'pro'));

-- Update 'basic' to 'free' for consistency with spec
UPDATE profiles SET subscription_tier = 'free' WHERE subscription_tier = 'basic';

-- Add credit tracking columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS topup_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS elya_conversations_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS elya_reset_at TIMESTAMPTZ;

-- ============================================
-- PART 2: UPDATE BILLING_PRICES TABLE
-- ============================================

ALTER TABLE billing_prices
  DROP CONSTRAINT IF EXISTS billing_prices_tier_check;

ALTER TABLE billing_prices
  ADD CONSTRAINT billing_prices_tier_check
  CHECK (tier IN ('trial', 'basic', 'free', 'growth', 'pro'));

-- Deactivate old Basic and Pro prices
UPDATE billing_prices SET is_active = false
WHERE stripe_price_id IN (
  'price_1SWimuIouyG60O9hP3ZBRPWQ',
  'price_1SWioKIouyG60O9hwao2wPsz',
  'price_1SYeJ8IouyG60O9haPEp6P1H',
  'price_1SYeJ8IouyG60O9hkAn4L26v'
);

-- Deactivate any existing growth prices first
UPDATE billing_prices SET is_active = false WHERE tier = 'growth';

-- Delete existing growth rows to allow clean insert
DELETE FROM billing_prices WHERE tier = 'growth';

-- Insert GROWTH tier prices
INSERT INTO billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active)
VALUES
  ('growth', 'monthly', 1500, 'price_1SbPRKIouyG60O9h6no1ze29', 'prod_TYWU86WhwA1VZc', 'Growth Monthly', 'Daily support for working interpreters',
   '["Unlimited Elya conversations", "Pre-assignment prep workflow", "Post-assignment debrief", "Burnout monitoring", "Wellness tracking dashboard", "AI-generated insights", "Pattern detection", "Sentiment filtering", "AI auto-tags", "Export conversation history"]'::jsonb,
   true),
  ('growth', 'yearly', 15000, 'price_1SbPRKIouyG60O9h8mKfesoT', 'prod_TYWU86WhwA1VZc', 'Growth Yearly', 'Daily support for working interpreters - Save $30/year',
   '["Everything in Growth Monthly", "Save $30/year (2 months free)"]'::jsonb,
   true);

-- Deactivate ALL existing Pro prices first
UPDATE billing_prices SET is_active = false WHERE tier = 'pro';

-- Delete existing Pro rows to allow clean insert (avoids unique constraint issues)
DELETE FROM billing_prices WHERE tier = 'pro';

-- Insert new PRO tier prices ($30/month)
INSERT INTO billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active)
VALUES
  ('pro', 'monthly', 3000, 'price_1SbPVqIouyG60O9hpGwXMiDT', 'prod_TYWYSOCveXGns1', 'Pro Monthly', 'Full professional toolkit with CEU credits',
   '["Everything in Growth", "4 CEU credits/month", "All theory videos", "All skill practice modules", "All Deep Dive case studies", "CEU certificates on completion", "RID compliance tracking", "Competency profile & growth tracking", "Priority support"]'::jsonb,
   true),
  ('pro', 'yearly', 30000, 'price_1SbPVqIouyG60O9hVnf6dnkN', 'prod_TYWYSOCveXGns1', 'Pro Yearly', 'Full professional toolkit with CEU credits - Save $60/year',
   '["Everything in Pro Monthly", "Save $60/year (2 months free)"]'::jsonb,
   true);

-- Insert FREE tier if not exists
INSERT INTO billing_prices (tier, cycle, price_cents, stripe_price_id, stripe_product_id, display_name, description, features, is_active)
VALUES
  ('free', 'monthly', 0, 'price_free_tier', 'prod_free_tier', 'Free Forever', 'Start your wellness journey with Elya',
   '["5 Elya conversations/month", "Basic mood tracking", "Conversation history", "Calendar view", "Dark/light mode", "Profile management"]'::jsonb,
   true)
ON CONFLICT (stripe_price_id) DO NOTHING;

-- ============================================
-- PART 3: CREDIT TRANSACTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credit_type TEXT NOT NULL CHECK (credit_type IN ('monthly', 'topup', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  module_id UUID,
  module_code TEXT,
  ceu_value NUMERIC(4,2),
  stripe_payment_id TEXT,
  package_name TEXT,
  package_price_cents INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date ON credit_transactions(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_transactions_stripe_payment ON credit_transactions(stripe_payment_id) WHERE stripe_payment_id IS NOT NULL;

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert credit transactions" ON credit_transactions;
CREATE POLICY "System can insert credit transactions" ON credit_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PART 4: TOP-UP PACKAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS topup_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delete and reinsert to ensure correct values
DELETE FROM topup_packages WHERE name IN ('small', 'medium', 'large');

INSERT INTO topup_packages (name, credits, price_cents, stripe_price_id, display_name, description)
VALUES
  ('small', 2, 500, 'price_1SbPcHIouyG60O9hBuq9R3M9', '2 Credits', '$2.50 per credit'),
  ('medium', 4, 800, 'price_1SbPcHIouyG60O9hmx03tY2W', '4 Credits', '$2.00 per credit - Best value'),
  ('large', 8, 1400, 'price_1SbPcHIouyG60O9hGOb2t5oS', '8 Credits', '$1.75 per credit');

-- ============================================
-- PART 5: FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION add_monthly_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tier TEXT;
  v_credits_to_add INTEGER;
BEGIN
  SELECT subscription_tier INTO v_tier FROM profiles WHERE id = p_user_id;
  IF v_tier = 'pro' THEN v_credits_to_add := 4; ELSE v_credits_to_add := 0; END IF;
  UPDATE profiles SET monthly_credits = v_credits_to_add, credits_reset_at = NOW(), updated_at = NOW() WHERE id = p_user_id;
  IF v_credits_to_add > 0 THEN
    INSERT INTO credit_transactions (user_id, credit_type, amount, balance_after, description)
    VALUES (p_user_id, 'monthly', v_credits_to_add, v_credits_to_add, 'Monthly credit refresh');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION spend_credits(p_user_id UUID, p_module_id UUID, p_credits_required INTEGER)
RETURNS JSONB AS $$
DECLARE
  v_monthly_credits INTEGER; v_topup_credits INTEGER; v_monthly_spent INTEGER := 0;
  v_topup_spent INTEGER := 0; v_remaining INTEGER; v_module_code TEXT; v_ceu_value NUMERIC(4,2);
BEGIN
  SELECT monthly_credits, topup_credits INTO v_monthly_credits, v_topup_credits FROM profiles WHERE id = p_user_id FOR UPDATE;
  SELECT module_code, ceu_value INTO v_module_code, v_ceu_value FROM skill_modules WHERE id = p_module_id;
  IF (v_monthly_credits + v_topup_credits) < p_credits_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient credits');
  END IF;
  IF v_monthly_credits >= p_credits_required THEN v_monthly_spent := p_credits_required;
  ELSE v_monthly_spent := v_monthly_credits; v_topup_spent := p_credits_required - v_monthly_credits; END IF;
  UPDATE profiles SET monthly_credits = monthly_credits - v_monthly_spent, topup_credits = topup_credits - v_topup_spent, updated_at = NOW()
  WHERE id = p_user_id RETURNING monthly_credits + topup_credits INTO v_remaining;
  INSERT INTO credit_transactions (user_id, credit_type, amount, balance_after, module_id, module_code, ceu_value, description)
  VALUES (p_user_id, CASE WHEN v_topup_spent > 0 THEN 'topup' ELSE 'monthly' END, -p_credits_required, v_remaining, p_module_id, v_module_code, v_ceu_value, 'Spent on ' || v_module_code);
  RETURN jsonb_build_object('success', true, 'credits_spent', p_credits_required, 'monthly_used', v_monthly_spent, 'topup_used', v_topup_spent, 'remaining_balance', v_remaining);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION add_topup_credits(p_user_id UUID, p_credits INTEGER, p_stripe_payment_id TEXT, p_package_name TEXT, p_price_cents INTEGER)
RETURNS JSONB AS $$
DECLARE v_new_balance INTEGER; v_existing_tx UUID;
BEGIN
  SELECT id INTO v_existing_tx FROM credit_transactions WHERE stripe_payment_id = p_stripe_payment_id LIMIT 1;
  IF v_existing_tx IS NOT NULL THEN
    SELECT topup_credits INTO v_new_balance FROM profiles WHERE id = p_user_id;
    RETURN jsonb_build_object('success', true, 'already_processed', true, 'credits_added', 0, 'new_balance', v_new_balance);
  END IF;
  UPDATE profiles SET topup_credits = topup_credits + p_credits, updated_at = NOW() WHERE id = p_user_id RETURNING topup_credits INTO v_new_balance;
  INSERT INTO credit_transactions (user_id, credit_type, amount, balance_after, stripe_payment_id, package_name, package_price_cents, description)
  VALUES (p_user_id, 'topup', p_credits, v_new_balance, p_stripe_payment_id, p_package_name, p_price_cents, 'Purchased ' || p_credits || ' credits (' || p_package_name || ' package)');
  RETURN jsonb_build_object('success', true, 'credits_added', p_credits, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION reset_elya_conversations(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET elya_conversations_this_month = 0, elya_reset_at = NOW(), updated_at = NOW() WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_elya_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE v_tier TEXT; v_count INTEGER; v_limit INTEGER; v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT subscription_tier, elya_conversations_this_month, elya_reset_at INTO v_tier, v_count, v_reset_at FROM profiles WHERE id = p_user_id;
  IF v_reset_at IS NULL OR v_reset_at < date_trunc('month', NOW()) THEN PERFORM reset_elya_conversations(p_user_id); v_count := 0; END IF;
  IF v_tier IN ('growth', 'pro') THEN v_limit := -1; ELSE v_limit := 5; END IF;
  IF v_limit != -1 AND v_count >= v_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'Monthly limit reached', 'used', v_count, 'limit', v_limit, 'upgrade_message', 'Upgrade to Growth for unlimited Elya conversations');
  END IF;
  UPDATE profiles SET elya_conversations_this_month = elya_conversations_this_month + 1, updated_at = NOW() WHERE id = p_user_id;
  RETURN jsonb_build_object('allowed', true, 'used', v_count + 1, 'limit', v_limit, 'unlimited', v_limit = -1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_my_elya_limit() RETURNS JSONB AS $$ BEGIN RETURN check_elya_limit(auth.uid()); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION spend_my_credits(p_module_id UUID, p_credits_required INTEGER) RETURNS JSONB AS $$ BEGIN RETURN spend_credits(auth.uid(), p_module_id, p_credits_required); END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: PERMISSIONS (with proper function signatures)
-- ============================================

GRANT SELECT ON credit_transactions TO authenticated;
GRANT SELECT ON topup_packages TO authenticated;

-- Service role functions (called from API routes/webhooks)
GRANT EXECUTE ON FUNCTION add_monthly_credits(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION spend_credits(uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION add_topup_credits(uuid, integer, text, text, integer) TO service_role;
GRANT EXECUTE ON FUNCTION reset_elya_conversations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION check_elya_limit(uuid) TO service_role;

-- User-facing self-guard functions (called from client)
GRANT EXECUTE ON FUNCTION check_my_elya_limit() TO authenticated;
GRANT EXECUTE ON FUNCTION spend_my_credits(uuid, integer) TO authenticated;

-- Add useful index for tier lookups
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
