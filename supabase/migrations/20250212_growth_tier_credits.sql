-- ============================================================================
-- Fix Growth Tier Monthly Credits
-- Growth users should get 1 credit/month (0.1 CEU = 1 hour of workshops)
-- Pro users get 4 credits/month (0.3+ CEU = 3 hours of workshops)
-- ============================================================================

-- Update the add_monthly_credits function to include Growth tier
CREATE OR REPLACE FUNCTION add_monthly_credits(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_tier TEXT;
  v_credits_to_add INTEGER;
BEGIN
  -- Get user's tier
  SELECT subscription_tier INTO v_tier FROM profiles WHERE id = p_user_id;

  -- Set credits based on tier:
  -- Pro: 4 credits (0.3+ CEU, ~3 hours of workshops)
  -- Growth: 1 credit (0.1 CEU, ~1 hour of workshops)
  -- Free: 0 credits
  IF v_tier = 'pro' THEN
    v_credits_to_add := 4;
  ELSIF v_tier = 'growth' THEN
    v_credits_to_add := 1;
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
