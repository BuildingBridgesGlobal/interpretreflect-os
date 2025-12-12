-- ============================================
-- Community Enhancements Phase 2 Migration
-- Hashtags, Link Previews, Mentorship Requests, User Preferences
-- ============================================

-- ============================================
-- 1. NEW TABLES
-- ============================================

-- 1.1 Hashtags Table
CREATE TABLE IF NOT EXISTS hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraints separately (safe for re-runs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hashtags_name_key'
  ) THEN
    ALTER TABLE hashtags ADD CONSTRAINT hashtags_name_key UNIQUE (name);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'hashtags_normalized_name_key'
  ) THEN
    ALTER TABLE hashtags ADD CONSTRAINT hashtags_normalized_name_key UNIQUE (normalized_name);
  END IF;
END $$;

-- Indexes for hashtags
CREATE INDEX IF NOT EXISTS idx_hashtags_normalized ON hashtags(normalized_name);
CREATE INDEX IF NOT EXISTS idx_hashtags_usage ON hashtags(usage_count DESC) WHERE is_archived = false;
CREATE INDEX IF NOT EXISTS idx_hashtags_last_used ON hashtags(last_used_at DESC);

-- 1.2 Post Hashtags Junction Table
CREATE TABLE IF NOT EXISTS post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_hashtags_post_hashtag_unique'
  ) THEN
    ALTER TABLE post_hashtags ADD CONSTRAINT post_hashtags_post_hashtag_unique UNIQUE (post_id, hashtag_id);
  END IF;
END $$;

-- Indexes for post_hashtags
CREATE INDEX IF NOT EXISTS idx_post_hashtags_post ON post_hashtags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_hashtags_hashtag ON post_hashtags(hashtag_id);

-- 1.3 Link Previews Table (cache for URL metadata)
CREATE TABLE IF NOT EXISTS link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  url_hash TEXT NOT NULL,
  title TEXT,
  description TEXT,
  image_url TEXT,
  favicon_url TEXT,
  site_name TEXT,
  video_url TEXT,
  video_type TEXT CHECK (video_type IN ('youtube', 'vimeo', NULL)),
  fetch_status TEXT DEFAULT 'pending' CHECK (fetch_status IN ('pending', 'success', 'failed')),
  fetched_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'link_previews_url_key'
  ) THEN
    ALTER TABLE link_previews ADD CONSTRAINT link_previews_url_key UNIQUE (url);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'link_previews_url_hash_key'
  ) THEN
    ALTER TABLE link_previews ADD CONSTRAINT link_previews_url_hash_key UNIQUE (url_hash);
  END IF;
END $$;

-- Indexes for link_previews
CREATE INDEX IF NOT EXISTS idx_link_previews_hash ON link_previews(url_hash);
CREATE INDEX IF NOT EXISTS idx_link_previews_expires ON link_previews(expires_at) WHERE fetch_status = 'success';

-- 1.4 Post Link Previews Junction Table
CREATE TABLE IF NOT EXISTS post_link_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  link_preview_id UUID NOT NULL REFERENCES link_previews(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'post_link_previews_unique'
  ) THEN
    ALTER TABLE post_link_previews ADD CONSTRAINT post_link_previews_unique UNIQUE (post_id, link_preview_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_post_link_previews_post ON post_link_previews(post_id);

-- 1.5 Mentorship Requests Table
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  message TEXT,
  response_message TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (requester_id != mentor_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mentorship_requests_requester_mentor_unique'
  ) THEN
    ALTER TABLE mentorship_requests ADD CONSTRAINT mentorship_requests_requester_mentor_unique UNIQUE (requester_id, mentor_id);
  END IF;
END $$;

-- Indexes for mentorship_requests
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_requester ON mentorship_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);

-- 1.6 User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sidebar_collapsed BOOLEAN DEFAULT false,
  guidelines_acknowledged BOOLEAN DEFAULT false,
  guidelines_acknowledged_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_dismissed BOOLEAN DEFAULT false,
  onboarding_dismissed_at TIMESTAMPTZ,
  feed_preferences JSONB DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_preferences_user_id_key'
  ) THEN
    ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- ============================================
-- 2. MODIFICATIONS TO EXISTING TABLES
-- ============================================

-- 2.1 Add trending columns to community_posts
ALTER TABLE community_posts
  ADD COLUMN IF NOT EXISTS trending_score DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_engagement_at TIMESTAMPTZ;

-- Index for trending queries (conditional creation)
CREATE INDEX IF NOT EXISTS idx_posts_trending ON community_posts(trending_score DESC, created_at DESC);

-- 2.2 Add mentorship columns to connections
ALTER TABLE connections
  ADD COLUMN IF NOT EXISTS is_mentorship BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mentorship_started_at TIMESTAMPTZ;

-- 2.3 Add mentor fields to community_profiles
ALTER TABLE community_profiles
  ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_post_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_connection_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mentor_statement TEXT,
  ADD COLUMN IF NOT EXISTS mentor_availability TEXT DEFAULT 'available';

-- Add check constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_profiles_mentor_availability_check'
  ) THEN
    ALTER TABLE community_profiles
      ADD CONSTRAINT community_profiles_mentor_availability_check
      CHECK (mentor_availability IN ('available', 'limited', 'unavailable'));
  END IF;
END $$;

-- ============================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_link_previews ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Hashtags: Public read, authenticated write
DROP POLICY IF EXISTS "Hashtags are viewable by everyone" ON hashtags;
CREATE POLICY "Hashtags are viewable by everyone" ON hashtags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create hashtags" ON hashtags;
CREATE POLICY "Authenticated users can create hashtags" ON hashtags
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Post Hashtags: Follow post permissions
DROP POLICY IF EXISTS "Post hashtags viewable with post" ON post_hashtags;
CREATE POLICY "Post hashtags viewable with post" ON post_hashtags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = post_hashtags.post_id AND is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can tag their own posts" ON post_hashtags;
CREATE POLICY "Users can tag their own posts" ON post_hashtags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = post_hashtags.post_id AND user_id = auth.uid()
    )
  );

-- Link Previews: Public read
DROP POLICY IF EXISTS "Link previews are public" ON link_previews;
CREATE POLICY "Link previews are public" ON link_previews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create link previews" ON link_previews;
CREATE POLICY "Authenticated users can create link previews" ON link_previews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Post Link Previews
DROP POLICY IF EXISTS "Post link previews viewable with post" ON post_link_previews;
CREATE POLICY "Post link previews viewable with post" ON post_link_previews
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = post_link_previews.post_id AND is_deleted = false
    )
  );

DROP POLICY IF EXISTS "Users can add link previews to own posts" ON post_link_previews;
CREATE POLICY "Users can add link previews to own posts" ON post_link_previews
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = post_link_previews.post_id AND user_id = auth.uid()
    )
  );

-- Mentorship Requests: Participants only
DROP POLICY IF EXISTS "Users view own mentorship requests" ON mentorship_requests;
CREATE POLICY "Users view own mentorship requests" ON mentorship_requests
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "Users create mentorship requests" ON mentorship_requests;
CREATE POLICY "Users create mentorship requests" ON mentorship_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Participants update requests" ON mentorship_requests;
CREATE POLICY "Participants update requests" ON mentorship_requests
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = mentor_id);

-- User Preferences: Owner only
DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 4. DATABASE FUNCTIONS
-- ============================================

-- Function to extract and link hashtags from post content
CREATE OR REPLACE FUNCTION process_post_hashtags(
  p_post_id UUID,
  p_content TEXT
) RETURNS void AS $$
DECLARE
  v_hashtag TEXT;
  v_hashtag_id UUID;
  v_normalized TEXT;
  v_hashtags TEXT[];
BEGIN
  -- Extract hashtags using regex (max 5)
  SELECT ARRAY(
    SELECT DISTINCT lower(substring(m.tag from 2))
    FROM (
      SELECT unnest(regexp_matches(p_content, '#([a-zA-Z][a-zA-Z0-9_]{1,29})', 'g')) AS tag
    ) m
    LIMIT 5
  ) INTO v_hashtags;

  -- Clear existing hashtags for this post
  DELETE FROM post_hashtags WHERE post_id = p_post_id;

  -- Process each hashtag
  IF v_hashtags IS NOT NULL AND array_length(v_hashtags, 1) > 0 THEN
    FOREACH v_hashtag IN ARRAY v_hashtags LOOP
      v_normalized := lower(regexp_replace(v_hashtag, '[^a-z0-9]', '', 'g'));

      -- Upsert hashtag
      INSERT INTO hashtags (name, normalized_name, usage_count, last_used_at)
      VALUES (v_hashtag, v_normalized, 1, NOW())
      ON CONFLICT (normalized_name) DO UPDATE
      SET usage_count = hashtags.usage_count + 1,
          last_used_at = NOW()
      RETURNING id INTO v_hashtag_id;

      -- Link to post
      INSERT INTO post_hashtags (post_id, hashtag_id)
      VALUES (p_post_id, v_hashtag_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(
  p_likes INTEGER,
  p_comments INTEGER,
  p_created_at TIMESTAMPTZ
) RETURNS DECIMAL AS $$
DECLARE
  v_engagement DECIMAL;
  v_hours_ago DECIMAL;
  v_decay DECIMAL;
BEGIN
  -- Comments worth 2x likes
  v_engagement := COALESCE(p_likes, 0) + (COALESCE(p_comments, 0) * 2);

  -- Hours since creation
  v_hours_ago := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;

  -- Decay factor (0.1 per hour)
  v_decay := v_hours_ago * 0.1;

  -- Score with minimum 0
  RETURN GREATEST(0, v_engagement - v_decay);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get trending hashtags
CREATE OR REPLACE FUNCTION get_trending_hashtags(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  post_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.id,
    h.name,
    COUNT(ph.id) AS post_count
  FROM hashtags h
  JOIN post_hashtags ph ON ph.hashtag_id = h.id
  JOIN community_posts cp ON cp.id = ph.post_id
  WHERE cp.created_at > NOW() - INTERVAL '7 days'
    AND cp.is_deleted = false
    AND h.is_archived = false
  GROUP BY h.id, h.name
  ORDER BY post_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update trending scores (call periodically)
CREATE OR REPLACE FUNCTION update_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE community_posts
  SET trending_score = calculate_trending_score(
    likes_count,
    comments_count,
    created_at
  )
  WHERE is_deleted = false
    AND created_at > NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to archive stale hashtags
CREATE OR REPLACE FUNCTION archive_stale_hashtags()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH stale AS (
    SELECT id FROM hashtags
    WHERE last_used_at < NOW() - INTERVAL '90 days'
      AND usage_count < 5
      AND is_archived = false
  )
  UPDATE hashtags
  SET is_archived = true
  WHERE id IN (SELECT id FROM stale);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGERS
-- ============================================

-- Trigger to update user_preferences updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_timestamp();

-- Trigger to update last_engagement_at on posts when liked/commented
CREATE OR REPLACE FUNCTION update_post_engagement_time()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_posts
  SET last_engagement_at = NOW()
  WHERE id = COALESCE(NEW.post_id, OLD.post_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply trigger to post_likes if not exists
DROP TRIGGER IF EXISTS post_likes_engagement_trigger ON post_likes;
CREATE TRIGGER post_likes_engagement_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_time();

-- Apply trigger to post_comments if not exists
DROP TRIGGER IF EXISTS post_comments_engagement_trigger ON post_comments;
CREATE TRIGGER post_comments_engagement_trigger
  AFTER INSERT OR DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_engagement_time();

-- ============================================
-- 6. GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON hashtags TO authenticated;
GRANT INSERT ON hashtags TO authenticated;

GRANT SELECT, INSERT ON post_hashtags TO authenticated;
GRANT SELECT, INSERT ON link_previews TO authenticated;
GRANT SELECT, INSERT ON post_link_previews TO authenticated;
GRANT SELECT, INSERT, UPDATE ON mentorship_requests TO authenticated;
GRANT ALL ON user_preferences TO authenticated;

-- Grant service role full access
GRANT ALL ON hashtags TO service_role;
GRANT ALL ON post_hashtags TO service_role;
GRANT ALL ON link_previews TO service_role;
GRANT ALL ON post_link_previews TO service_role;
GRANT ALL ON mentorship_requests TO service_role;
GRANT ALL ON user_preferences TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
