-- ============================================================================
-- Add Emotional Intensity to Assignments
-- Tracks the emotional load of assignments for burnout tracking
-- ============================================================================

-- Add emotional_intensity column to assignments table
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS emotional_intensity TEXT
CHECK (emotional_intensity IS NULL OR emotional_intensity IN ('low', 'moderate', 'high', 'very_high'));

-- Add comment for documentation
COMMENT ON COLUMN assignments.emotional_intensity IS 'User-rated emotional intensity: low, moderate, high, very_high';

-- Create index for filtering by intensity
CREATE INDEX IF NOT EXISTS idx_assignments_emotional_intensity
ON assignments(emotional_intensity)
WHERE emotional_intensity IS NOT NULL;
