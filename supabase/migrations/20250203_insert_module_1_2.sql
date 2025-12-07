-- ============================================================================
-- FIX: Properly INSERT Module 1.2 with series_id
-- The original seed only did UPDATE, but the row might not exist
-- ============================================================================

-- First, insert the module if it doesn't exist
INSERT INTO skill_modules (
    module_code,
    series_id,
    title,
    subtitle,
    description,
    duration_minutes,
    ecci_domain,
    order_in_series,
    has_video,
    is_active,
    attribution_text,
    source_content_url,
    content_concept,
    content_practice,
    content_application
)
SELECT
    'nsm-1-2',
    ss.id,
    'Your Window of Tolerance',
    'Understand your optimal functioning zone',
    'Understand your optimal functioning zone and recognize when you''re pushed outside it during interpreting assignments.',
    6,
    'Self-Awareness',
    2,
    false,
    true,
    'Content adapted from "Nervous System Management for Interpreters" by Naomi Sheneman and the CATIE Center at St. Catherine University (Dive In Project, US DOE Grant #H160D210003). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Adapted for InterpretReflect by Building Bridges Global.',
    'https://www.katiecenter.org',
    '{
        "section_title": "Quick Concept",
        "duration_minutes": 2,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Your Optimal Zone for Interpreting"
            },
            {
                "type": "paragraph",
                "text": "The ''window of tolerance'' is a concept developed by Dr. Dan Siegel that describes the zone where we function at our best. When we''re inside our window, we can think clearly, stay present, and respond flexibly to whatever comes our way."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Above the Window: Hyperarousal** - Racing thoughts, anxiety, overwhelm, difficulty focusing, feeling revved up or on edge. You might interpret faster than optimal or miss nuances."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Inside the Window: Optimal Zone** - Focused, present, flexible, able to process complex information. You can hold multiple demands simultaneously and make good decisions in the moment."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Below the Window: Hypoarousal** - Shutdown, numbness, disconnection, brain fog, feeling checked out. You might lose track of the message or feel like you''re on autopilot."
            },
            {
                "type": "paragraph",
                "text": "Here''s the key insight: Your window size isn''t fixed. It varies day to day, and it can be expanded with practice. Certain assignment types, client emotions, or personal circumstances can shrink your window temporarily."
            },
            {
                "type": "paragraph",
                "text": "Quality interpreting requires staying IN your window. When you''re pushed outside - either above or below - your linguistic accuracy, cultural mediation, and professional presence all suffer."
            }
        ]
    }'::jsonb,
    '{
        "section_title": "Micro-Practice",
        "duration_minutes": 2,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Window Mapping Exercise"
            },
            {
                "type": "paragraph",
                "text": "Think about your last three interpreting assignments. For each one, honestly assess where you were in relation to your window of tolerance. This isn''t about judgment - it''s about building pattern recognition."
            },
            {
                "type": "subheading",
                "text": "Assignment 1"
            },
            {
                "type": "paragraph",
                "text": "What type of assignment was it, and where were you?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Above window (overwhelmed, racing, anxious)",
                    "In window (focused, present, flexible)",
                    "Below window (checked out, numb, foggy)"
                ]
            },
            {
                "type": "subheading",
                "text": "Assignment 2"
            },
            {
                "type": "paragraph",
                "text": "What type of assignment was it, and where were you?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Above window (overwhelmed, racing, anxious)",
                    "In window (focused, present, flexible)",
                    "Below window (checked out, numb, foggy)"
                ]
            },
            {
                "type": "subheading",
                "text": "Assignment 3"
            },
            {
                "type": "paragraph",
                "text": "What type of assignment was it, and where were you?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Above window (overwhelmed, racing, anxious)",
                    "In window (focused, present, flexible)",
                    "Below window (checked out, numb, foggy)"
                ]
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Reflection:** What patterns do you notice? Are certain assignment types more likely to push you in one direction?"
            }
        ]
    }'::jsonb,
    '{
        "section_title": "Application Bridge",
        "duration_minutes": 1,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Real-Time Window Check"
            },
            {
                "type": "paragraph",
                "text": "This week, practice a quick ''window check'' before each assignment. Ask yourself: Where am I right now? Am I in my window, above it, or below it?"
            },
            {
                "type": "subheading",
                "text": "Your Practice This Week"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Before your next 3 assignments, pause for 10 seconds",
                    "Notice your breathing, body tension, and mental state",
                    "Simply name it: ''I''m in my window'' or ''I''m running a bit above''",
                    "No need to fix anything yet - just notice"
                ]
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Growth Focus:** The goal isn''t to always be in your window - that''s not realistic. The goal is to KNOW where you are so you can make informed choices about preparation and recovery."
            },
            {
                "type": "subheading",
                "text": "Reflect with Elya"
            },
            {
                "type": "paragraph",
                "text": "Ready to explore your window patterns? Click below to reflect with Elya about what you discovered."
            }
        ]
    }'::jsonb
FROM skill_series ss
WHERE ss.series_code = 'nsm'
ON CONFLICT (module_code) DO UPDATE SET
    series_id = EXCLUDED.series_id,
    is_active = true,
    title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    description = EXCLUDED.description,
    duration_minutes = EXCLUDED.duration_minutes,
    order_in_series = EXCLUDED.order_in_series,
    content_concept = EXCLUDED.content_concept,
    content_practice = EXCLUDED.content_practice,
    content_application = EXCLUDED.content_application,
    updated_at = NOW();

-- Verify the module is now properly linked
-- SELECT sm.module_code, sm.title, sm.order_in_series, sm.is_active, ss.series_code
-- FROM skill_modules sm
-- JOIN skill_series ss ON sm.series_id = ss.id
-- WHERE sm.module_code = 'nsm-1-2';
