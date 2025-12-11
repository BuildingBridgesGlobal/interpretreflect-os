-- ============================================================================
-- Community Moderation System
-- Adds ban/suspend functionality and moderation logging
-- ============================================================================

-- PART 1: Add ban/suspend fields to community_profiles
ALTER TABLE community_profiles
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT,
  ADD COLUMN IF NOT EXISTS banned_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id);

-- Index for quick lookups of banned/suspended users
CREATE INDEX IF NOT EXISTS idx_community_profiles_banned ON community_profiles(is_banned) WHERE is_banned = true;
CREATE INDEX IF NOT EXISTS idx_community_profiles_suspended ON community_profiles(is_suspended) WHERE is_suspended = true;

-- PART 2: Create moderation actions log table
CREATE TABLE IF NOT EXISTS community_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  target_post_id UUID,
  target_comment_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('ban', 'unban', 'suspend', 'unsuspend', 'warn', 'delete_post', 'delete_comment', 'hide_post', 'restore_post')),
  reason TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_admin ON community_moderation_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_target_user ON community_moderation_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created ON community_moderation_log(created_at DESC);

-- PART 3: Create user warnings table
CREATE TABLE IF NOT EXISTS community_user_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  post_id UUID,
  comment_id UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON community_user_warnings(user_id);

-- PART 4: Function to ban a user
CREATE OR REPLACE FUNCTION ban_community_user(
  p_admin_id UUID,
  p_user_id UUID,
  p_reason TEXT
) RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_email TEXT;
BEGIN
  -- Verify admin has permission (by role OR by email)
  SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  IF v_admin_role NOT IN ('admin', 'super_admin')
     AND v_admin_email NOT IN ('maddox@interpretreflect.com', 'admin@interpretreflect.com', 'sarah@interpretreflect.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Update community profile
  UPDATE community_profiles
  SET is_banned = true,
      banned_at = NOW(),
      ban_reason = p_reason,
      banned_by = p_admin_id,
      is_suspended = false,
      suspended_at = NULL,
      suspended_until = NULL
  WHERE user_id = p_user_id;

  -- Log the action
  INSERT INTO community_moderation_log (admin_id, target_user_id, action_type, reason)
  VALUES (p_admin_id, p_user_id, 'ban', p_reason);

  RETURN jsonb_build_object('success', true, 'message', 'User banned successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 5: Function to unban a user
CREATE OR REPLACE FUNCTION unban_community_user(
  p_admin_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT 'Ban lifted'
) RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_email TEXT;
BEGIN
  -- Verify admin has permission (by role OR by email)
  SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  IF v_admin_role NOT IN ('admin', 'super_admin')
     AND v_admin_email NOT IN ('maddox@interpretreflect.com', 'admin@interpretreflect.com', 'sarah@interpretreflect.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Update community profile
  UPDATE community_profiles
  SET is_banned = false,
      banned_at = NULL,
      ban_reason = NULL,
      banned_by = NULL
  WHERE user_id = p_user_id;

  -- Log the action
  INSERT INTO community_moderation_log (admin_id, target_user_id, action_type, reason)
  VALUES (p_admin_id, p_user_id, 'unban', p_reason);

  RETURN jsonb_build_object('success', true, 'message', 'User unbanned successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 6: Function to suspend a user temporarily
CREATE OR REPLACE FUNCTION suspend_community_user(
  p_admin_id UUID,
  p_user_id UUID,
  p_reason TEXT,
  p_days INTEGER DEFAULT 7
) RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_email TEXT;
BEGIN
  -- Verify admin has permission (by role OR by email)
  SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  IF v_admin_role NOT IN ('admin', 'super_admin')
     AND v_admin_email NOT IN ('maddox@interpretreflect.com', 'admin@interpretreflect.com', 'sarah@interpretreflect.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Update community profile
  UPDATE community_profiles
  SET is_suspended = true,
      suspended_at = NOW(),
      suspended_until = NOW() + (p_days || ' days')::INTERVAL,
      suspension_reason = p_reason,
      suspended_by = p_admin_id
  WHERE user_id = p_user_id;

  -- Log the action
  INSERT INTO community_moderation_log (admin_id, target_user_id, action_type, reason, details)
  VALUES (p_admin_id, p_user_id, 'suspend', p_reason, jsonb_build_object('days', p_days));

  RETURN jsonb_build_object('success', true, 'message', 'User suspended for ' || p_days || ' days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 7: Function to check if user can participate in community
CREATE OR REPLACE FUNCTION can_user_participate(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_profile community_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM community_profiles WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'No community profile');
  END IF;

  IF v_profile.is_banned THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'banned', 'message', 'You have been banned from the community.');
  END IF;

  IF v_profile.is_suspended AND v_profile.suspended_until > NOW() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'suspended',
      'message', 'You are suspended until ' || to_char(v_profile.suspended_until, 'Mon DD, YYYY'),
      'until', v_profile.suspended_until
    );
  END IF;

  -- Auto-lift expired suspensions
  IF v_profile.is_suspended AND v_profile.suspended_until <= NOW() THEN
    UPDATE community_profiles
    SET is_suspended = false, suspended_at = NULL, suspended_until = NULL, suspension_reason = NULL
    WHERE user_id = p_user_id;
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 8: Function to issue a warning
CREATE OR REPLACE FUNCTION warn_community_user(
  p_admin_id UUID,
  p_user_id UUID,
  p_reason TEXT,
  p_post_id UUID DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_admin_role TEXT;
  v_admin_email TEXT;
  v_warning_count INTEGER;
BEGIN
  -- Verify admin has permission (by role OR by email)
  SELECT role INTO v_admin_role FROM profiles WHERE id = p_admin_id;
  SELECT email INTO v_admin_email FROM auth.users WHERE id = p_admin_id;

  IF v_admin_role NOT IN ('admin', 'super_admin')
     AND v_admin_email NOT IN ('maddox@interpretreflect.com', 'admin@interpretreflect.com', 'sarah@interpretreflect.com') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Admin access required');
  END IF;

  -- Insert warning
  INSERT INTO community_user_warnings (user_id, admin_id, reason, post_id, comment_id)
  VALUES (p_user_id, p_admin_id, p_reason, p_post_id, p_comment_id);

  -- Log the action
  INSERT INTO community_moderation_log (admin_id, target_user_id, target_post_id, target_comment_id, action_type, reason)
  VALUES (p_admin_id, p_user_id, p_post_id, p_comment_id, 'warn', p_reason);

  -- Get warning count
  SELECT COUNT(*) INTO v_warning_count FROM community_user_warnings WHERE user_id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Warning issued', 'total_warnings', v_warning_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 9: RLS Policies
ALTER TABLE community_moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_user_warnings ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
DROP POLICY IF EXISTS "Admins can view moderation logs" ON community_moderation_log;
CREATE POLICY "Admins can view moderation logs" ON community_moderation_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Only admins can insert moderation logs (via functions)
DROP POLICY IF EXISTS "Admins can insert moderation logs" ON community_moderation_log;
CREATE POLICY "Admins can insert moderation logs" ON community_moderation_log
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Users can view their own warnings, admins can view all
DROP POLICY IF EXISTS "Users can view own warnings" ON community_user_warnings;
CREATE POLICY "Users can view own warnings" ON community_user_warnings
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Only admins can insert warnings (via functions)
DROP POLICY IF EXISTS "Admins can insert warnings" ON community_user_warnings;
CREATE POLICY "Admins can insert warnings" ON community_user_warnings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- PART 10: Grant permissions
GRANT EXECUTE ON FUNCTION ban_community_user(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION unban_community_user(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_community_user(uuid, uuid, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_participate(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION warn_community_user(uuid, uuid, text, uuid, uuid) TO authenticated;

GRANT SELECT ON community_moderation_log TO authenticated;
GRANT SELECT ON community_user_warnings TO authenticated;
