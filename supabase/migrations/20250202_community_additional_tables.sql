-- ============================================
-- COMMUNITY ADDITIONAL TABLES (SAFE - NO DROPS)
-- ============================================
-- This migration adds the remaining community tables
-- WITHOUT dropping the existing community_profiles table
-- ============================================

-- ============================================
-- CONNECTIONS (Two-way consent required)
-- ============================================
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- ============================================
-- POSTS (Text-only feed)
-- ============================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'win', 'question', 'insight', 'reflection')),
  ecci_domains TEXT[] DEFAULT '{}',
  setting_tags TEXT[] DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST LIKES
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- POST COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 1000),
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST BOOKMARKS
-- ============================================
CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- CONVERSATIONS (DMs and Group Chats)
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT false,
  group_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATION PARTICIPANTS
-- ============================================
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin BOOLEAN DEFAULT false,
  notifications_muted BOOLEAN DEFAULT false,
  UNIQUE(conversation_id, user_id)
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 2000),
  is_system_message BOOLEAN DEFAULT false,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- POST FLAGS (Community Guidelines)
-- ============================================
CREATE TABLE IF NOT EXISTS post_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'spam',
    'harassment',
    'inappropriate',
    'misinformation',
    'off_topic',
    'other'
  )),
  details TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL AND message_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL AND message_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NULL AND message_id IS NOT NULL)
  )
);

-- ============================================
-- MENTORSHIP MATCHES (AI-suggested)
-- ============================================
CREATE TABLE IF NOT EXISTS mentorship_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matching_domain TEXT NOT NULL,
  match_score DECIMAL(5,2),
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'viewed', 'connected', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(mentee_id, mentor_id, matching_domain)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);

CREATE INDEX IF NOT EXISTS idx_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON community_posts(post_type);

CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user ON post_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conv ON conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mentorship_mentee ON mentorship_suggestions(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_mentor ON mentorship_suggestions(mentor_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_suggestions ENABLE ROW LEVEL SECURITY;

-- Connections: Users can see their own connections
DROP POLICY IF EXISTS "Users can view own connections" ON connections;
CREATE POLICY "Users can view own connections" ON connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON connections;
CREATE POLICY "Users can create connection requests" ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can update connections they're part of" ON connections;
CREATE POLICY "Users can update connections they're part of" ON connections
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Posts: Everyone can view non-deleted posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON community_posts;
CREATE POLICY "Posts are viewable by everyone" ON community_posts
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Users can create posts" ON community_posts;
CREATE POLICY "Users can create posts" ON community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON community_posts;
CREATE POLICY "Users can update own posts" ON community_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Likes: Anyone can view, users manage their own
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON post_likes;
CREATE POLICY "Likes are viewable by everyone" ON post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own likes" ON post_likes;
CREATE POLICY "Users can manage own likes" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Comments: Anyone can view non-deleted, users manage their own
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON post_comments;
CREATE POLICY "Comments are viewable by everyone" ON post_comments
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON post_comments;
CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Bookmarks: Users can only see their own
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON post_bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON post_bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Conversations: Participants only
DROP POLICY IF EXISTS "Users can view conversations they're in" ON conversations;
CREATE POLICY "Users can view conversations they're in" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can update group conversations" ON conversations;
CREATE POLICY "Admins can update group conversations" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
      AND is_admin = true
      AND left_at IS NULL
    )
  );

-- Conversation Participants
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
      AND cp.left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can add participants to conversations they admin" ON conversation_participants;
CREATE POLICY "Users can add participants to conversations they admin" ON conversation_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversation_participants.conversation_id
      AND user_id = auth.uid()
      AND is_admin = true
      AND left_at IS NULL
    )
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Users can update own participation" ON conversation_participants;
CREATE POLICY "Users can update own participation" ON conversation_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages: Conversation participants only
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
      AND left_at IS NULL
    )
  );

DROP POLICY IF EXISTS "Users can edit own messages" ON messages;
CREATE POLICY "Users can edit own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Flags
DROP POLICY IF EXISTS "Users can create flags" ON post_flags;
CREATE POLICY "Users can create flags" ON post_flags
  FOR INSERT WITH CHECK (auth.uid() = flagged_by);

DROP POLICY IF EXISTS "Users can view own flags" ON post_flags;
CREATE POLICY "Users can view own flags" ON post_flags
  FOR SELECT USING (auth.uid() = flagged_by);

-- Mentorship Suggestions
DROP POLICY IF EXISTS "Users can view own mentorship suggestions" ON mentorship_suggestions;
CREATE POLICY "Users can view own mentorship suggestions" ON mentorship_suggestions
  FOR SELECT USING (auth.uid() = mentee_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Users can update own mentorship suggestions" ON mentorship_suggestions;
CREATE POLICY "Users can update own mentorship suggestions" ON mentorship_suggestions
  FOR UPDATE USING (auth.uid() = mentee_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if two users are connected
CREATE OR REPLACE FUNCTION are_users_connected(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE status = 'accepted'
    AND (
      (requester_id = user1_id AND addressee_id = user2_id)
      OR (requester_id = user2_id AND addressee_id = user1_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create DM conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_dm(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  current_user_id UUID := auth.uid();
BEGIN
  IF NOT are_users_connected(current_user_id, other_user_id) THEN
    RAISE EXCEPTION 'Users must be connected to start a conversation';
  END IF;

  SELECT c.id INTO conv_id
  FROM conversations c
  WHERE c.is_group = false
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = current_user_id AND cp1.left_at IS NULL
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = other_user_id AND cp2.left_at IS NULL
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp
    WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
  ) = 2;

  IF conv_id IS NULL THEN
    INSERT INTO conversations (is_group, created_by)
    VALUES (false, current_user_id)
    RETURNING id INTO conv_id;

    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    VALUES
      (conv_id, current_user_id, true),
      (conv_id, other_user_id, true);
  END IF;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a group chat
CREATE OR REPLACE FUNCTION create_group_chat(
  group_name_param TEXT,
  member_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
  conv_id UUID;
  current_user_id UUID := auth.uid();
  member_id UUID;
BEGIN
  IF array_length(member_ids, 1) + 1 > 8 THEN
    RAISE EXCEPTION 'Group chat cannot have more than 8 members';
  END IF;

  FOREACH member_id IN ARRAY member_ids LOOP
    IF NOT are_users_connected(current_user_id, member_id) THEN
      RAISE EXCEPTION 'All group members must be connected to you';
    END IF;
  END LOOP;

  INSERT INTO conversations (is_group, group_name, created_by)
  VALUES (true, group_name_param, current_user_id)
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
  VALUES (conv_id, current_user_id, true);

  FOREACH member_id IN ARRAY member_ids LOOP
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    VALUES (conv_id, member_id, false);
  END LOOP;

  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get post counts
CREATE OR REPLACE FUNCTION get_post_stats(post_id_param UUID)
RETURNS TABLE (likes_count BIGINT, comments_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM post_likes WHERE post_id = post_id_param) as likes_count,
    (SELECT COUNT(*) FROM post_comments WHERE post_id = post_id_param AND is_deleted = false) as comments_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(conv_id UUID, for_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  last_read TIMESTAMPTZ;
BEGIN
  SELECT last_read_at INTO last_read
  FROM conversation_participants
  WHERE conversation_id = conv_id AND user_id = for_user_id;

  IF last_read IS NULL THEN
    last_read := '1970-01-01'::TIMESTAMPTZ;
  END IF;

  RETURN (
    SELECT COUNT(*)
    FROM messages
    WHERE conversation_id = conv_id
    AND created_at > last_read
    AND sender_id != for_user_id
    AND is_deleted = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_posts_updated ON community_posts;
CREATE TRIGGER community_posts_updated
  BEFORE UPDATE ON community_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS post_comments_updated ON post_comments;
CREATE TRIGGER post_comments_updated
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS conversations_updated ON conversations;
CREATE TRIGGER conversations_updated
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS messages_updated ON messages;
CREATE TRIGGER messages_updated
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS message_updates_conversation ON messages;
CREATE TRIGGER message_updates_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- ============================================
-- VIEWS
-- ============================================

DROP VIEW IF EXISTS posts_with_details;
CREATE OR REPLACE VIEW posts_with_details AS
SELECT
  p.*,
  cp.display_name as author_name,
  cp.years_experience as author_experience,
  cp.offer_support_in as author_strong_domains,
  cp.open_to_mentoring as author_is_mentor,
  (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
  (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id AND is_deleted = false) as comments_count
FROM community_posts p
JOIN community_profiles cp ON cp.user_id = p.user_id
WHERE p.is_deleted = false;

DROP VIEW IF EXISTS conversations_summary;
CREATE OR REPLACE VIEW conversations_summary AS
SELECT
  c.id,
  c.is_group,
  c.group_name,
  c.created_at,
  c.updated_at,
  (
    SELECT content FROM messages
    WHERE conversation_id = c.id AND is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
  ) as last_message_content,
  (
    SELECT created_at FROM messages
    WHERE conversation_id = c.id AND is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
  ) as last_message_at
FROM conversations c;
