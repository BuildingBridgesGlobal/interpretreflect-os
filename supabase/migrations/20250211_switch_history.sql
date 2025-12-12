-- Add switch_history column to assignments table for tracking interpreter switches
-- This stores an array of switch records during team interpreting sessions

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS switch_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN assignments.switch_history IS 'Array of switch records tracking interpreter rotations during live sessions';
