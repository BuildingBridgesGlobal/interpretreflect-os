-- ============================================================================
-- COMMUNITY SYSTEM: Posts, Connections, Messages, Likes, Comments
-- ============================================================================

-- =====================================================
-- 1. USER PROFILES EXTENSION (public profiles)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  linkedin_url TEXT,
  open_to_mentoring BOOLEAN DEFAULT false,
  years_experience INTEGER,
  specialties TEXT[], -- ["Medical", "Legal", "Educational"]
  strong_domains TEXT[], -- ["Linguistic", "Cultural"]
  location TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. USER CONNECTIONS (follow/connection system)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);

-- =====================================================
-- 3. COMMUNITY POSTS
-- =====================================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'question', 'reflection', 'resource')),
  ecci_domains TEXT[], -- Tag posts by domain ["Linguistic", "Cultural"]
  setting_tags TEXT[], -- ["Medical", "Legal", "Educational"]
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. POST LIKES
-- =====================================================

CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =====================================================
-- 5. POST COMMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For threaded replies
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. COMMENT LIKES
-- =====================================================

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- =====================================================
-- 7. DIRECT MESSAGES
-- =====================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. CONVERSATION METADATA
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

-- =====================================================
-- 9. POST BOOKMARKS (saved posts)
-- =====================================================

CREATE TABLE IF NOT EXISTS post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_public_profiles_user_id ON user_public_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_requester ON user_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_recipient ON user_connections(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_status ON user_connections(status);

CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_ecci_domains ON community_posts USING GIN(ecci_domains);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON post_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON direct_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user_id ON post_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON post_bookmarks(post_id);

-- =====================================================
-- TRIGGERS TO UPDATE COUNTS
-- =====================================================

-- Update post likes count
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

-- Update post comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Update comment likes count
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE post_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE post_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_likes_count
AFTER INSERT OR DELETE ON comment_likes
FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- Update conversation metadata when new message
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_content = NEW.content
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_metadata
AFTER INSERT ON direct_messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_metadata();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Public profiles are readable by everyone, editable by owner
ALTER TABLE user_public_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_public_profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert their own public profile"
  ON user_public_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public profile"
  ON user_public_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Connections are viewable by participants
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their connections"
  ON user_connections FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create connection requests"
  ON user_connections FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update their connection responses"
  ON user_connections FOR UPDATE
  USING (auth.uid() = recipient_id OR auth.uid() = requester_id);

-- Posts are viewable by everyone, editable by author
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by everyone"
  ON community_posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON community_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Likes are viewable by everyone
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes are viewable by everyone"
  ON post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Comments are viewable by everyone
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON post_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Comment likes
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are viewable by everyone"
  ON comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Messages are only viewable by participants
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Conversations are viewable by participants
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Bookmarks are private to user
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks"
  ON post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
  ON post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
