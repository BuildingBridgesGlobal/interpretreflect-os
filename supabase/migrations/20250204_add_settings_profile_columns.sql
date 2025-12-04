-- Migration: Add missing columns to profiles table for User Settings page
-- Created: 2025-02-04

-- ============================================================================
-- PROFILE COLUMNS - Community Profile Tab
-- ============================================================================

-- Bio field for profile description
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- LinkedIn URL for professional networking
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Open to mentoring flag
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS open_to_mentoring BOOLEAN DEFAULT false;

-- ============================================================================
-- NOTIFICATION PREFERENCES - Preferences Tab
-- ============================================================================

-- Email notifications toggle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Weekly reports opt-in
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS weekly_reports BOOLEAN DEFAULT false;

-- Community updates toggle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS community_updates BOOLEAN DEFAULT true;

-- Training reminders toggle
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS training_reminders BOOLEAN DEFAULT true;

-- ============================================================================
-- PRIVACY SETTINGS - Privacy Tab
-- ============================================================================

-- Profile visibility: 'public', 'community', 'private'
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_visibility TEXT DEFAULT 'community'
  CHECK (profile_visibility IN ('public', 'community', 'private'));

-- Data sharing consent
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS data_sharing BOOLEAN DEFAULT false;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN profiles.bio IS 'User bio/description for community profile';
COMMENT ON COLUMN profiles.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN profiles.open_to_mentoring IS 'Whether user is available to mentor others';
COMMENT ON COLUMN profiles.email_notifications IS 'Master toggle for email notifications';
COMMENT ON COLUMN profiles.weekly_reports IS 'Opt-in for weekly progress report emails';
COMMENT ON COLUMN profiles.community_updates IS 'Receive community news and updates';
COMMENT ON COLUMN profiles.training_reminders IS 'Receive training and drill reminders';
COMMENT ON COLUMN profiles.profile_visibility IS 'Who can see this profile: public, community members only, or private';
COMMENT ON COLUMN profiles.data_sharing IS 'Consent for anonymous data usage in research';

-- ============================================================================
-- ORGANIZATION SETTINGS - Agency Dashboard Settings Tab
-- ============================================================================

-- Add settings JSONB column to organizations table for agency-specific settings
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "ceu_tracking_enabled": true,
  "prep_required_default": true,
  "debrief_required_default": true,
  "custom_fields": []
}'::jsonb;

COMMENT ON COLUMN organizations.settings IS 'Organization-level settings for agency dashboard features';
