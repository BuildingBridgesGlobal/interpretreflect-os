-- ============================================================================
-- Fix Monthly Credit Values and Add Credit Deduction
-- Growth: 2 credits/month (0.1 CEU = 2 workshops @ 30 min each)
-- Pro: 6 credits/month (0.3 CEU = 6 workshops @ 30 min each)
-- ============================================================================

-- Update the add_monthly_credits function with correct values
CREATE OR REPLACE FUNCTION add_monthly_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tier TEXT;
  v_credits_to_add INTEGER;
BEGIN
  -- Get user's tier
  SELECT subscription_tier INTO v_tier FROM profiles WHERE id = p_user_id;

  -- Set credits based on tier:
  -- Pro: 6 credits (0.3 CEU, ~6 workshops @ 30 min each)
  -- Growth: 2 credits (0.1 CEU, ~2 workshops @ 30 min each)
  -- Free: 0 credits
  IF v_tier = 'pro' THEN
    v_credits_to_add := 6;
  ELSIF v_tier = 'growth' THEN
    v_credits_to_add := 2;
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

-- Ensure permissions are granted
GRANT EXECUTE ON FUNCTION add_monthly_credits(uuid) TO service_role;

-- ============================================================================
-- Function to deduct a credit when a workshop is completed
-- Deducts from monthly credits first, then from top-up credits
-- Returns: true if credit was deducted, false if insufficient credits
-- ============================================================================
CREATE OR REPLACE FUNCTION deduct_workshop_credit(
  p_user_id UUID,
  p_module_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Workshop completion'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_monthly INTEGER;
  v_topup INTEGER;
  v_new_monthly INTEGER;
  v_new_topup INTEGER;
  v_credit_type TEXT;
BEGIN
  -- Get current credits
  SELECT monthly_credits, topup_credits
  INTO v_monthly, v_topup
  FROM profiles
  WHERE id = p_user_id;

  -- Check if user has any credits
  IF COALESCE(v_monthly, 0) + COALESCE(v_topup, 0) < 1 THEN
    RETURN FALSE; -- Insufficient credits
  END IF;

  -- Deduct from monthly first, then topup
  IF COALESCE(v_monthly, 0) >= 1 THEN
    v_new_monthly := v_monthly - 1;
    v_new_topup := COALESCE(v_topup, 0);
    v_credit_type := 'monthly';
  ELSE
    v_new_monthly := 0;
    v_new_topup := v_topup - 1;
    v_credit_type := 'topup';
  END IF;

  -- Update profile
  UPDATE profiles
  SET
    monthly_credits = v_new_monthly,
    topup_credits = v_new_topup,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the transaction
  INSERT INTO credit_transactions (
    user_id,
    credit_type,
    amount,
    balance_after,
    description,
    module_id
  )
  VALUES (
    p_user_id,
    v_credit_type,
    -1,
    v_new_monthly + v_new_topup,
    p_description,
    p_module_id
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_workshop_credit(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION deduct_workshop_credit(uuid, uuid, text) TO authenticated;
