-- Create elya_conversations table for persisting Elya chat sessions
-- This allows users to continue conversations across sessions

CREATE TABLE IF NOT EXISTS public.elya_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mode TEXT NOT NULL DEFAULT 'chat' CHECK (mode IN ('chat', 'prep', 'debrief', 'research', 'patterns', 'free-write')),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    message_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_elya_conversations_user_id ON public.elya_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_elya_conversations_user_active ON public.elya_conversations(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_elya_conversations_assignment ON public.elya_conversations(assignment_id);
CREATE INDEX IF NOT EXISTS idx_elya_conversations_updated ON public.elya_conversations(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.elya_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON public.elya_conversations
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own conversations
CREATE POLICY "Users can insert own conversations" ON public.elya_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations" ON public.elya_conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations" ON public.elya_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.elya_conversations IS 'Stores Elya AI co-pilot conversation history with mode and assignment context';
