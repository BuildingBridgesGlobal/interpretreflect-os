-- ============================================================================
-- Fix Conversation/Messages RLS Policies
-- Uses SECURITY DEFINER function to avoid infinite recursion
-- ============================================================================

-- STEP 1: Create helper function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_conversation_ids(p_user_id UUID)
RETURNS SETOF UUID AS $$
  SELECT conversation_id
  FROM conversation_participants
  WHERE user_id = p_user_id
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_conversation_ids(UUID) TO authenticated;

-- ============================================================================
-- STEP 2: Drop existing policies
-- ============================================================================

DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations they admin" ON conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON conversation_participants;

DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view conversations they're in" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can update group conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON messages;
DROP POLICY IF EXISTS "Users can edit own messages" ON messages;

-- ============================================================================
-- STEP 3: Create conversation_participants policies
-- ============================================================================

-- SELECT: Users can see their own participation AND all participants in their conversations
CREATE POLICY "Users can view conversation participants" ON conversation_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

-- INSERT: Users can add themselves OR add others to conversations they're in
CREATE POLICY "Users can add participants to conversations" ON conversation_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

-- UPDATE: Users can only update their own participation
CREATE POLICY "Users can update own participation" ON conversation_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- STEP 4: Create conversations policies
-- ============================================================================

-- SELECT: Users can view conversations they created OR are a participant in
CREATE POLICY "Users can view conversations they're in" ON conversations
  FOR SELECT USING (
    created_by = auth.uid()
    OR id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

-- INSERT: Any authenticated user can create a conversation
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Admins can update group conversations
CREATE POLICY "Admins can update group conversations" ON conversations
  FOR UPDATE USING (
    created_by = auth.uid()
    OR id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

-- ============================================================================
-- STEP 5: Create messages policies
-- ============================================================================

-- SELECT: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

-- INSERT: Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (SELECT get_user_conversation_ids(auth.uid()))
  );

-- UPDATE: Users can edit their own messages
CREATE POLICY "Users can edit own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- ============================================================================
-- STEP 6: Grant permissions
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
