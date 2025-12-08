-- PART 1: Add ALL missing columns to tables
-- Run this FIRST in Supabase Dashboard SQL Editor

-- Add instructor columns to skill_modules
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS instructor_credentials VARCHAR(255);

-- Add instructor columns to ceu_certificates
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS instructor_credentials VARCHAR(255);

-- Add RID submission tracking columns to ceu_certificates
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submitted_at TIMESTAMPTZ;
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submitted_by UUID REFERENCES auth.users(id);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS rid_submission_batch VARCHAR(100);

-- Add activity_code if missing
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS activity_code VARCHAR(50);

-- Add updated_at if missing
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
