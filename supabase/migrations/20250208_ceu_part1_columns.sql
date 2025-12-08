-- PART 1: Add columns only
-- Run this FIRST in Supabase Dashboard SQL Editor
-- Make sure to stop your dev server before running

ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);
ALTER TABLE skill_modules ADD COLUMN IF NOT EXISTS instructor_credentials VARCHAR(255);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS instructor_name VARCHAR(255);
ALTER TABLE ceu_certificates ADD COLUMN IF NOT EXISTS instructor_credentials VARCHAR(255);
