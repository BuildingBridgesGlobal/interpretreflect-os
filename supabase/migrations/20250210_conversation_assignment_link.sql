-- Add assignment_id to conversations table for team assignment chats
-- This links a conversation to a specific assignment for teaming purposes

-- Add the assignment_id column
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL;

-- Add conversation_type to distinguish between personal and work chats
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS conversation_type TEXT DEFAULT 'personal'
CHECK (conversation_type IN ('personal', 'mentoring', 'teaming'));

-- Create index for efficient assignment-based queries
CREATE INDEX IF NOT EXISTS idx_conversations_assignment_id
ON public.conversations(assignment_id)
WHERE assignment_id IS NOT NULL;

-- Create index for conversation type queries
CREATE INDEX IF NOT EXISTS idx_conversations_type
ON public.conversations(conversation_type);

-- Comment on columns
COMMENT ON COLUMN public.conversations.assignment_id IS 'Links conversation to a team assignment for quick access to assignment details';
COMMENT ON COLUMN public.conversations.conversation_type IS 'Type of conversation: personal (DMs), mentoring, or teaming (work assignments)';
