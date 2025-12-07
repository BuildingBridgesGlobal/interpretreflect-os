-- ============================================================================
-- FIX: Ensure Module 1.2 (nsm-1-2) is active and has correct content
-- This migration ensures the module is visible in the UI
-- ============================================================================

-- First, make sure the module is active
UPDATE skill_modules
SET is_active = true
WHERE module_code = 'nsm-1-2';

-- Verify: This should return 1 row with is_active = true
-- SELECT module_code, title, is_active, order_in_series FROM skill_modules WHERE module_code = 'nsm-1-2';
