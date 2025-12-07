-- ============================================================================
-- MIGRATION: Remove em-dashes from Module 1.1 and 1.2 content
-- Makes content feel more natural and conversational
-- ============================================================================

-- Update Module 1.1 elya prompts
UPDATE elya_prompt_sets
SET prompts = REPLACE(prompts::text, ' — ', '. ')::jsonb
WHERE set_code = 'nsm-1-1-reflection';

-- Update Module 1.1 content
UPDATE skill_modules
SET
    subtitle = REPLACE(subtitle, ' — ', '. '),
    content_concept = REPLACE(content_concept::text, ' — ', '. ')::jsonb,
    content_practice = REPLACE(content_practice::text, ' — ', '. ')::jsonb,
    content_application = REPLACE(content_application::text, ' — ', '. ')::jsonb
WHERE module_code = 'nsm-1-1';

-- Update Module 1.2 elya prompts
UPDATE elya_prompt_sets
SET prompts = REPLACE(prompts::text, ' — ', '. ')::jsonb
WHERE set_code = 'nsm-1-2-reflection';

-- Update Module 1.2 content
UPDATE skill_modules
SET
    subtitle = REPLACE(subtitle, ' — ', '. '),
    content_concept = REPLACE(content_concept::text, ' — ', '. ')::jsonb,
    content_practice = REPLACE(content_practice::text, ' — ', '. ')::jsonb,
    content_application = REPLACE(content_application::text, ' — ', '. ')::jsonb
WHERE module_code = 'nsm-1-2';

-- Update Module 1.3 elya prompts if they exist
UPDATE elya_prompt_sets
SET prompts = REPLACE(prompts::text, ' — ', '. ')::jsonb
WHERE set_code = 'nsm-1-3-reflection';

-- Update Module 1.3 content if it exists
UPDATE skill_modules
SET
    subtitle = REPLACE(subtitle, ' — ', '. '),
    content_concept = REPLACE(content_concept::text, ' — ', '. ')::jsonb,
    content_practice = REPLACE(content_practice::text, ' — ', '. ')::jsonb,
    content_application = REPLACE(content_application::text, ' — ', '. ')::jsonb
WHERE module_code = 'nsm-1-3';
