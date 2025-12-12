-- Create content_reports table for flagging inappropriate content
-- Subtle feature - users can report posts/comments

CREATE TABLE IF NOT EXISTS content_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment')),
  content_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  UNIQUE(reporter_user_id, content_type, content_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON content_reports(reporter_user_id);

-- Enable RLS
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can create reports"
  ON content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_user_id);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON content_reports FOR SELECT
  USING (auth.uid() = reporter_user_id);

-- Policy: Admins can view all reports (we'll add admin check later)
-- For now, only service role can manage all reports

COMMENT ON TABLE content_reports IS 'User reports for inappropriate content';
COMMENT ON COLUMN content_reports.reason IS 'Report reason: spam, harassment, inappropriate, misinformation, other';
COMMENT ON COLUMN content_reports.status IS 'Report status: pending, reviewed, resolved, dismissed';
