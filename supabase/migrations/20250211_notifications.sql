-- ============================================
-- NOTIFICATIONS SYSTEM
-- ============================================
-- Notification system for community interactions
-- - Comment on your post
-- - Reply to your comment
-- - Reactions to your posts
-- - New followers/connections
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'comment_on_post',
    'reply_to_comment',
    'reaction_on_post',
    'connection_request',
    'connection_accepted',
    'mention'
  )),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  reaction_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System can insert notifications (via triggers or service role)
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TRIGGER: Create notification when someone comments on a post
-- ============================================
CREATE OR REPLACE FUNCTION notify_post_comment()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Don't notify if commenting on your own post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_user_id, post_id, comment_id)
    VALUES (post_owner_id, 'comment_on_post', NEW.user_id, NEW.post_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_post_comment ON post_comments;
CREATE TRIGGER trigger_notify_post_comment
  AFTER INSERT ON post_comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NULL)
  EXECUTE FUNCTION notify_post_comment();

-- ============================================
-- TRIGGER: Create notification when someone replies to a comment
-- ============================================
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  parent_comment_owner_id UUID;
BEGIN
  -- Get the parent comment owner
  SELECT user_id INTO parent_comment_owner_id
  FROM post_comments
  WHERE id = NEW.parent_comment_id;

  -- Don't notify if replying to your own comment
  IF parent_comment_owner_id IS NOT NULL AND parent_comment_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_user_id, post_id, comment_id)
    VALUES (parent_comment_owner_id, 'reply_to_comment', NEW.user_id, NEW.post_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_comment_reply ON post_comments;
CREATE TRIGGER trigger_notify_comment_reply
  AFTER INSERT ON post_comments
  FOR EACH ROW
  WHEN (NEW.parent_comment_id IS NOT NULL)
  EXECUTE FUNCTION notify_comment_reply();

-- ============================================
-- TRIGGER: Create notification when someone reacts to a post
-- ============================================
CREATE OR REPLACE FUNCTION notify_post_reaction()
RETURNS TRIGGER AS $$
DECLARE
  post_owner_id UUID;
BEGIN
  -- Get the post owner
  SELECT user_id INTO post_owner_id
  FROM community_posts
  WHERE id = NEW.post_id;

  -- Don't notify if reacting to your own post
  IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_user_id, post_id, reaction_type)
    VALUES (post_owner_id, 'reaction_on_post', NEW.user_id, NEW.post_id, NEW.reaction_type);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_post_reaction ON post_reactions;
CREATE TRIGGER trigger_notify_post_reaction
  AFTER INSERT ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_reaction();

-- ============================================
-- TRIGGER: Create notification for connection requests
-- ============================================
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, actor_user_id)
    VALUES (NEW.addressee_id, 'connection_request', NEW.requester_id);
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, actor_user_id)
    VALUES (NEW.requester_id, 'connection_accepted', NEW.addressee_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_connection ON connections;
CREATE TRIGGER trigger_notify_connection
  AFTER INSERT OR UPDATE ON connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();

-- ============================================
-- HELPER FUNCTION: Get unread notification count
-- ============================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(for_user_id UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM notifications
    WHERE user_id = for_user_id
    AND is_read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE notifications IS 'User notifications for community interactions';
COMMENT ON COLUMN notifications.type IS 'Notification type: comment_on_post, reply_to_comment, reaction_on_post, connection_request, connection_accepted, mention';
