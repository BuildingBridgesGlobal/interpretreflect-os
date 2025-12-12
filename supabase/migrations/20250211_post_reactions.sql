-- Create post_reactions table for story-telling reactions
-- Reactions are mapped to post types:
-- Win → 🙌 (celebration)
-- Question → 💭 (thinking/pondering)
-- Insight → 🔥 (fire)
-- Reflection → 🫂 (solidarity)

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('celebration', 'thinking', 'fire', 'solidarity')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction_type)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON post_reactions(reaction_type);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view reactions
CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  USING (true);

-- Policy: Authenticated users can add their own reactions
CREATE POLICY "Users can add own reactions"
  ON post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
  ON post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Add reaction counts to community_posts for quick access
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS celebration_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS thinking_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fire_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS solidarity_count INTEGER DEFAULT 0;

-- Function to update reaction counts
CREATE OR REPLACE FUNCTION update_post_reaction_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    CASE NEW.reaction_type
      WHEN 'celebration' THEN
        UPDATE community_posts SET celebration_count = celebration_count + 1 WHERE id = NEW.post_id;
      WHEN 'thinking' THEN
        UPDATE community_posts SET thinking_count = thinking_count + 1 WHERE id = NEW.post_id;
      WHEN 'fire' THEN
        UPDATE community_posts SET fire_count = fire_count + 1 WHERE id = NEW.post_id;
      WHEN 'solidarity' THEN
        UPDATE community_posts SET solidarity_count = solidarity_count + 1 WHERE id = NEW.post_id;
    END CASE;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    CASE OLD.reaction_type
      WHEN 'celebration' THEN
        UPDATE community_posts SET celebration_count = GREATEST(0, celebration_count - 1) WHERE id = OLD.post_id;
      WHEN 'thinking' THEN
        UPDATE community_posts SET thinking_count = GREATEST(0, thinking_count - 1) WHERE id = OLD.post_id;
      WHEN 'fire' THEN
        UPDATE community_posts SET fire_count = GREATEST(0, fire_count - 1) WHERE id = OLD.post_id;
      WHEN 'solidarity' THEN
        UPDATE community_posts SET solidarity_count = GREATEST(0, solidarity_count - 1) WHERE id = OLD.post_id;
    END CASE;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reaction count updates
DROP TRIGGER IF EXISTS post_reaction_count_trigger ON post_reactions;
CREATE TRIGGER post_reaction_count_trigger
  AFTER INSERT OR DELETE ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION update_post_reaction_counts();

COMMENT ON TABLE post_reactions IS 'Story-telling reactions for community posts mapped to post types';
COMMENT ON COLUMN post_reactions.reaction_type IS 'Type of reaction: celebration (🙌), thinking (💭), fire (🔥), solidarity (🫂)';
