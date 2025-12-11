-- ============================================================================
-- Update Elya conversation limits: 5/month → 10/day for free users
-- Also fix the subscription_tier constraint to include 'growth'
-- ============================================================================

-- PART 1: Fix the subscription_tier constraint to include 'growth'
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_subscription_tier_check
  CHECK (subscription_tier IN ('trial', 'basic', 'free', 'growth', 'pro'));

-- PART 2: Rename column from monthly to daily tracking
-- First add new column if it doesn't exist
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS elya_conversations_today INTEGER DEFAULT 0;

-- PART 3: Update the check_elya_limit function for DAILY limits (10/day for free)
CREATE OR REPLACE FUNCTION check_elya_limit(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_limit INTEGER;
  v_reset_at TIMESTAMPTZ;
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;

  SELECT subscription_tier, elya_conversations_today, elya_reset_at
  INTO v_tier, v_count, v_reset_at
  FROM profiles
  WHERE id = p_user_id;

  -- Reset if it's a new day (check if reset_at is before today)
  IF v_reset_at IS NULL OR v_reset_at::date < v_today THEN
    UPDATE profiles
    SET elya_conversations_today = 0,
        elya_reset_at = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;
    v_count := 0;
  END IF;

  -- Set limits: Growth/Pro = unlimited, Free = 10/day
  IF v_tier IN ('growth', 'pro') THEN
    v_limit := -1;  -- unlimited
  ELSE
    v_limit := 10;  -- 10 per day for free users
  END IF;

  -- Check if limit reached
  IF v_limit != -1 AND v_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit_reached',
      'used', v_count,
      'limit', v_limit,
      'resets_at', (v_today + INTERVAL '1 day')::text
    );
  END IF;

  -- Increment counter
  UPDATE profiles
  SET elya_conversations_today = COALESCE(elya_conversations_today, 0) + 1,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'allowed', true,
    'used', COALESCE(v_count, 0) + 1,
    'limit', v_limit,
    'unlimited', v_limit = -1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 4: Update reset function for daily reset
CREATE OR REPLACE FUNCTION reset_elya_conversations(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET elya_conversations_today = 0,
      elya_reset_at = NOW(),
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 5: Wrapper function for client calls
CREATE OR REPLACE FUNCTION check_my_elya_limit()
RETURNS JSONB AS $$
BEGIN
  RETURN check_elya_limit(auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_elya_limit(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION reset_elya_conversations(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION check_my_elya_limit() TO authenticated;
