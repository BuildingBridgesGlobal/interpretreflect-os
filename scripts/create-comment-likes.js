const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://wjhdvjukspfgoojyloks.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaGR2anVrc3BmZ29vanlsb2tzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyMzAzNSwiZXhwIjoyMDc5Nzk5MDM1fQ.ABHJ3r9ahUS-HB0M8ojjrludAvLnZkHD52-YZtjYWtE";

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createCommentLikesTable() {
  // First, check if table already exists by trying to query it
  const { data: checkData, error: checkError } = await supabase
    .from('comment_likes')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('Table comment_likes already exists');
    return;
  }

  console.log('Table does not exist, need to create via Supabase Dashboard SQL editor');
  console.log('Please run this SQL in the Supabase Dashboard:');
  console.log(`
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user ON comment_likes(user_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comment likes are viewable by everyone" ON comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own comment likes" ON comment_likes
  FOR ALL USING (auth.uid() = user_id);
  `);
}

createCommentLikesTable();
