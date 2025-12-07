-- ============================================================================
-- AGENCY ASSIGNMENT LINK
-- Migration: 20250204_agency_assignment_link
--
-- Adds columns to link interpreter assignments to agency-created assignments
-- ============================================================================

-- Add agency_assignment_id to link back to the agency's assignment
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS agency_assignment_id UUID REFERENCES agency_assignments(id) ON DELETE SET NULL;

-- Add flag to indicate assignment was created by agency (not self-created)
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS created_by_agency BOOLEAN DEFAULT false;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_assignments_agency_assignment_id ON assignments(agency_assignment_id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN assignments.agency_assignment_id IS 'Reference to the agency_assignment this was created from (null if self-created)';
COMMENT ON COLUMN assignments.created_by_agency IS 'True if this assignment was pushed by an agency, false if self-created by interpreter';
