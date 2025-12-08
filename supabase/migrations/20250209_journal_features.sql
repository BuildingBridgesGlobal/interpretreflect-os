-- Migration: Add Journal Features to elya_conversations
-- Adds mood tracking, AI titles, AI tags, and sentiment for the My Journal feature

-- Add mood_emoji column (FREE tier - user selects after conversation)
ALTER TABLE public.elya_conversations
ADD COLUMN IF NOT EXISTS mood_emoji TEXT CHECK (mood_emoji IN ('😤', '😢', '😐', '😊', '🌟'));

-- Add ai_title column (FREE tier - auto-generated after conversation)
ALTER TABLE public.elya_conversations
ADD COLUMN IF NOT EXISTS ai_title TEXT;

-- Add ai_tags column (GROWTH+ tier - auto-generated themes/topics)
ALTER TABLE public.elya_conversations
ADD COLUMN IF NOT EXISTS ai_tags JSONB DEFAULT '[]'::jsonb;

-- Add sentiment column (GROWTH+ tier - classified as difficult/joyful/neutral)
ALTER TABLE public.elya_conversations
ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('difficult', 'joyful', 'neutral'));

-- Add summary column for quick preview without loading full messages
ALTER TABLE public.elya_conversations
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add ended_at timestamp to track when conversation was completed
ALTER TABLE public.elya_conversations
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Create index for calendar queries (user_id + created_at for date range queries)
-- Note: Cannot use DATE(created_at) as it's not immutable
CREATE INDEX IF NOT EXISTS idx_elya_conversations_user_created_day
ON public.elya_conversations(user_id, created_at);

-- Create index for mood filtering
CREATE INDEX IF NOT EXISTS idx_elya_conversations_mood
ON public.elya_conversations(user_id, mood_emoji) WHERE mood_emoji IS NOT NULL;

-- Create index for sentiment filtering
CREATE INDEX IF NOT EXISTS idx_elya_conversations_sentiment
ON public.elya_conversations(user_id, sentiment) WHERE sentiment IS NOT NULL;

-- Comment on new columns
COMMENT ON COLUMN public.elya_conversations.mood_emoji IS 'User-selected mood after conversation: 😤😢😐😊🌟';
COMMENT ON COLUMN public.elya_conversations.ai_title IS 'AI-generated title summarizing the conversation topic and emotion';
COMMENT ON COLUMN public.elya_conversations.ai_tags IS 'AI-generated tags for themes, skills, topics (GROWTH+ feature)';
COMMENT ON COLUMN public.elya_conversations.sentiment IS 'AI-classified sentiment: difficult, joyful, or neutral (GROWTH+ feature)';
COMMENT ON COLUMN public.elya_conversations.ai_summary IS 'Brief AI-generated summary for list preview';
COMMENT ON COLUMN public.elya_conversations.ended_at IS 'Timestamp when user ended/completed the conversation';
