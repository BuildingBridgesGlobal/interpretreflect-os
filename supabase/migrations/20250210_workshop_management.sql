-- ============================================================================
-- CEU Workshop Management System
-- Tracks all RID sponsor requirements and workflow status for each workshop
-- Based on existing spreadsheet workflow
-- ============================================================================

-- Add workshop management fields to skill_modules
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS workshop_type VARCHAR(20) DEFAULT 'on_demand';
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS presentation_language VARCHAR(50) DEFAULT 'ASL w/ English Captions';
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS access_expiration DATE;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS live_date TIMESTAMPTZ;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(200);
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS instructor_credentials VARCHAR(200);

-- RID Sponsor workflow tracking
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS rid_activity_code VARCHAR(50);
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS rid_approved_hours DECIMAL(4,2);

-- Content & Asset URLs
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS flyer_url TEXT;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS slide_deck_url TEXT;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS google_folder_url TEXT;

-- Workflow checklist (matches spreadsheet)
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_ceu_request_form BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_flyer_generated BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_evaluation_form BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_certificate_created BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_reflection_form BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_slide_deck BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_drive_folder_complete BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_recording_uploaded BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_connected_to_slide_fill BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_submitted_to_rid BOOLEAN DEFAULT false;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS checklist_social_media_campaign BOOLEAN DEFAULT false;

-- Publishing status
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS status_notes TEXT;

-- Comments for documentation
COMMENT ON COLUMN skill_modules.workshop_type IS 'live or on_demand';
COMMENT ON COLUMN skill_modules.presentation_language IS 'e.g., ASL w/ English Captions, ASL only, English only';
COMMENT ON COLUMN skill_modules.access_expiration IS 'When on-demand access expires (null = never)';
COMMENT ON COLUMN skill_modules.rid_activity_code IS 'RID Activity Code assigned to this workshop';
COMMENT ON COLUMN skill_modules.rid_approved_hours IS 'CEU hours approved by RID (may differ from calculated)';
COMMENT ON COLUMN skill_modules.publish_status IS 'draft, pending_review, published, archived';

-- Create index for quick filtering
CREATE INDEX IF NOT EXISTS idx_skill_modules_publish_status ON skill_modules(publish_status);
CREATE INDEX IF NOT EXISTS idx_skill_modules_workshop_type ON skill_modules(workshop_type);
