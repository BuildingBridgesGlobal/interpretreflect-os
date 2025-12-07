-- ============================================================================
-- Migration: Remove "ECCI Connection" labels from skill module content
-- Keep the domain references (Self-Awareness, Self-Management, Social Awareness)
-- but remove explicit ECCI branding as it's our proprietary framework
-- ============================================================================

-- Module 1.1: Understanding Your Nervous System
UPDATE skill_modules
SET content_concept = REPLACE(
    content_concept::text,
    '**ECCI Connection:** Self-awareness isn''t navel-gazing. It''s the foundation that allows you to show up fully, manage emotions skillfully, and interpret with integrity.',
    '**Why This Matters:** Self-awareness isn''t navel-gazing. It''s the foundation that allows you to show up fully, manage emotions skillfully, and interpret with integrity.'
)::jsonb
WHERE module_code = 'nsm-1-1';

-- Module 1.2: Your Window of Tolerance
UPDATE skill_modules
SET content_concept = REPLACE(
    content_concept::text,
    '**ECCI Connection:** Self-Awareness means knowing where you are in relation to your window at any given moment. You can''t regulate what you don''t notice.',
    '**Key Insight:** Self-Awareness means knowing where you are in relation to your window at any given moment. You can''t regulate what you don''t notice.'
)::jsonb
WHERE module_code = 'nsm-1-2';

-- Module 1.3: Co-Regulation in Interpreting
UPDATE skill_modules
SET content_concept = REPLACE(
    content_concept::text,
    '**ECCI Connection:** Social Awareness includes recognizing not just what others are feeling, but how their emotional states affect your own nervous system in real-time.',
    '**Key Insight:** Social Awareness includes recognizing not just what others are feeling, but how their emotional states affect your own nervous system in real-time.'
)::jsonb
WHERE module_code = 'nsm-1-3';

-- Module 1.4: Regulation Techniques
UPDATE skill_modules
SET content_concept = REPLACE(
    content_concept::text,
    '**ECCI Connection:** Self-Management means having tools ready before you need them. Effective interpreters don''t just react to dysregulation — they proactively maintain their window of tolerance.',
    '**Key Insight:** Self-Management means having tools ready before you need them. Effective interpreters don''t just react to dysregulation — they proactively maintain their window of tolerance.'
)::jsonb
WHERE module_code = 'nsm-1-4';

-- Module 1.6: Your Personalized Regulation Plan
UPDATE skill_modules
SET content_concept = REPLACE(
    content_concept::text,
    '**ECCI Connection:** Self-Management is the integration of all these pillars. It''s not just knowing what to do — it''s consistently doing it, even when it''s hard.',
    '**Key Insight:** Self-Management is the integration of all these skills. It''s not just knowing what to do — it''s consistently doing it, even when it''s hard.'
)::jsonb
WHERE module_code = 'nsm-1-6';

-- Also check content_practice and content_application for any ECCI references
UPDATE skill_modules
SET
    content_practice = REPLACE(content_practice::text, '**ECCI Connection:**', '**Key Insight:**')::jsonb,
    content_application = REPLACE(content_application::text, '**ECCI Connection:**', '**Key Insight:**')::jsonb
WHERE content_practice::text LIKE '%ECCI Connection%'
   OR content_application::text LIKE '%ECCI Connection%';
