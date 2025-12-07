-- ============================================================================
-- SEED DATA: Module 1.2 "Your Window of Tolerance"
-- Nervous System Management (NSM) Series
-- ============================================================================

-- ============================================================================
-- 1. INSERT ELYA PROMPT SET FOR MODULE 1.2
-- ============================================================================

INSERT INTO elya_prompt_sets (
    set_code,
    module_code,
    description,
    prompts
) VALUES (
    'nsm-1-2-reflection',
    'nsm-1-2',
    'Reflection prompts for Module 1.2: Your Window of Tolerance',
    '[
        {
            "order": 1,
            "type": "opening",
            "prompt_text": "Looking at your window mapping, do you notice any patterns? Are certain assignment types more likely to push you above or below your window?",
            "awaits_response": true,
            "follow_up_logic": "Listen for specific assignment types they mention (medical, legal, VRS, educational). Validate their pattern recognition."
        },
        {
            "order": 2,
            "type": "deepening",
            "prompt_text": "That''s exactly the kind of pattern recognition that builds self-management skills. Knowing your triggers means you can prepare for them. What''s one assignment type coming up this week where you might need extra regulation support?",
            "awaits_response": true,
            "follow_up_logic": "Help them think proactively about an upcoming challenge. Connect to practical preparation."
        },
        {
            "order": 3,
            "type": "closing",
            "prompt_text": "Great awareness. You''re building the skill of real-time self-assessment — knowing where you are is the first step to staying regulated. In Module 1.3, we''ll explore how other people''s nervous systems affect yours. Co-regulation is huge in interpreting. 💪",
            "awaits_response": false,
            "follow_up_logic": "Affirm their growth and preview the next module on co-regulation."
        }
    ]'::jsonb
) ON CONFLICT (set_code) DO NOTHING;

-- ============================================================================
-- 2. UPDATE MODULE 1.2 WITH FULL CONTENT
-- ============================================================================

UPDATE skill_modules SET
    title = 'Your Window of Tolerance',
    subtitle = 'Understand your optimal functioning zone',
    description = 'Understand your optimal functioning zone and recognize when you''re pushed outside it during interpreting assignments.',
    duration_minutes = 6,
    ecci_domain = 'Self-Awareness',
    order_in_series = 2,

    -- CONTENT_CONCEPT (Quick Concept - 2 min)
    content_concept = '{
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
                "text": "**⬆️ Above the Window: Hyperarousal** — Racing thoughts, anxiety, overwhelm, difficulty focusing, feeling revved up or on edge. You might interpret faster than optimal or miss nuances."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**🟢 Inside the Window: Optimal Zone** — Focused, present, flexible, able to process complex information. You can hold multiple demands simultaneously and make good decisions in the moment."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**⬇️ Below the Window: Hypoarousal** — Shutdown, numbness, disconnection, brain fog, feeling checked out. You might lose track of the message or feel like you''re on autopilot."
            },
            {
                "type": "paragraph",
                "text": "Here''s the key insight: Your window size isn''t fixed. It varies day to day, and it can be expanded with practice. Certain assignment types, client emotions, or personal circumstances can shrink your window temporarily."
            },
            {
                "type": "paragraph",
                "text": "Quality interpreting requires staying IN your window. When you''re pushed outside — either above or below — your linguistic accuracy, cultural mediation, and professional presence all suffer."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**ECCI Connection:** Self-Awareness means knowing where you are in relation to your window at any given moment. You can''t regulate what you don''t notice."
            }
        ]
    }'::jsonb,

    -- CONTENT_PRACTICE (Micro-Practice - 2 min)
    content_practice = '{
        "section_title": "Micro-Practice",
        "duration_minutes": 2,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Window Mapping Exercise"
            },
            {
                "type": "paragraph",
                "text": "Think about your last three interpreting assignments. For each one, honestly assess where you were in relation to your window of tolerance. This isn''t about judgment — it''s about building pattern recognition."
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
                    "🔴 Above window (overwhelmed, racing, anxious)",
                    "🟢 In window (focused, present, flexible)",
                    "🔵 Below window (checked out, numb, foggy)"
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
                    "🔴 Above window (overwhelmed, racing, anxious)",
                    "🟢 In window (focused, present, flexible)",
                    "🔵 Below window (checked out, numb, foggy)"
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
                    "🔴 Above window (overwhelmed, racing, anxious)",
                    "🟢 In window (focused, present, flexible)",
                    "🔵 Below window (checked out, numb, foggy)"
                ]
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Reflection:** What patterns do you notice? Are certain assignment types more likely to push you in one direction?"
            }
        ]
    }'::jsonb,

    -- CONTENT_APPLICATION (Application Bridge - 1 min)
    content_application = '{
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
                    "No need to fix anything yet — just notice"
                ]
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Growth Focus:** The goal isn''t to always be in your window — that''s not realistic. The goal is to KNOW where you are so you can make informed choices about preparation and recovery."
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
    }'::jsonb,

    elya_prompt_set_id = (SELECT id FROM elya_prompt_sets WHERE set_code = 'nsm-1-2-reflection'),
    is_active = true,
    attribution_text = 'Content adapted from "Nervous System Management for Interpreters" by Naomi Sheneman and the CATIE Center at St. Catherine University (Dive In Project, US DOE Grant #H160D210003). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Adapted for InterpretReflect by Building Bridges Global.',
    source_content_url = 'https://www.katiecenter.org',
    updated_at = NOW()
WHERE module_code = 'nsm-1-2';
