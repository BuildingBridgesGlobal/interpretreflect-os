-- ============================================
-- COMMENT LIKES TABLE
-- ============================================
-- Allows users to like comments (similar to post_likes)

CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

-- Enable RLS
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view likes, users manage their own
DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON comment_likes;
CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own comment likes" ON comment_likes;
CREATE POLICY "Users can manage own comment likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);
