-- ============================================================================
-- SEED DATA: Module 1.1 "Understanding Your Nervous System"
-- Nervous System Management (NSM) Series
-- ============================================================================

-- ============================================================================
-- 1. INSERT NERVOUS SYSTEM MANAGEMENT SERIES
-- ============================================================================

INSERT INTO skill_series (
    series_code,
    title,
    description,
    ecci_domain,
    total_modules,
    estimated_total_minutes,
    icon_emoji,
    display_order,
    is_active,
    attribution_text,
    source_url
) VALUES (
    'nsm',
    'Nervous System Management',
    'Learn to recognize and regulate your body''s stress responses for clearer, calmer interpreting. Build self-awareness skills that form the foundation of all ECCI competencies.',
    'Self-Awareness',
    6,
    42,
    '🧠',
    1,
    true,
    'Content adapted from CATIE Center materials under CC BY 4.0',
    'https://www.katiecenter.org'
) ON CONFLICT (series_code) DO NOTHING;

-- ============================================================================
-- 2. INSERT ELYA PROMPT SET FOR MODULE 1.1
-- ============================================================================

INSERT INTO elya_prompt_sets (
    set_code,
    module_code,
    description,
    prompts
) VALUES (
    'nsm-1-1-reflection',
    'nsm-1-1',
    'Reflection prompts for Module 1.1: Understanding Your Nervous System',
    '[
        {
            "order": 1,
            "type": "opening",
            "prompt_text": "You just did something powerful — you paused to listen to your body. That's the foundation of self-awareness in the ECCI Model. I'm curious about what you discovered. What physical sensations do you notice most often before or during challenging assignments?",
            "awaits_response": true,
            "follow_up_logic": "reflect_and_deepen"
        },
        {
            "order": 2,
            "type": "deepening",
            "prompt_text": "Those are important signals. When you notice [reflect their sensations back], what do you think your nervous system is trying to tell you? Is it preparing you for action, or asking you to slow down?",
            "awaits_response": true,
            "follow_up_logic": "connect_to_ecci"
        },
        {
            "order": 3,
            "type": "application",
            "prompt_text": "Here's something to try this week: Before your next assignment, take 30 seconds to check in with your body. Notice your breathing, your shoulders, your jaw. Then choose one thing — even something small, like three deep breaths — to help your nervous system feel ready. Self-awareness isn't about controlling your body; it's about partnering with it. How does that feel as a goal?",
            "awaits_response": true,
            "follow_up_logic": "encourage_and_close"
        }
    ]'::jsonb
) ON CONFLICT (set_code) DO NOTHING;

-- ============================================================================
-- 3. INSERT MODULE 1.1
-- ============================================================================

INSERT INTO skill_modules (
    module_code,
    series_id,
    title,
    subtitle,
    description,
    duration_minutes,
    ecci_domain,
    order_in_series,
    content_concept,
    content_practice,
    content_application,
    elya_prompt_set_id,
    has_video,
    video_url,
    prerequisites,
    is_active,
    attribution_text,
    source_content_url
) VALUES (
    'nsm-1-1',
    (SELECT id FROM skill_series WHERE series_code = 'nsm'),
    'Understanding Your Nervous System',
    'Your body is always communicating — learn to listen',
    'Discover how your sympathetic and parasympathetic nervous systems influence your interpreting work, and why self-awareness starts with body awareness.',
    7,
    'Self-Awareness',
    1,
    -- CONTENT_CONCEPT (Quick Concept - 2 min)
    '{
        "section_title": "Quick Concept",
        "duration_minutes": 2,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Your Nervous System is Your Interpreting Partner"
            },
            {
                "type": "paragraph",
                "text": "Your body is always responding to the world around you — even before your conscious mind catches up. As an interpreter, you work in high-stakes, emotionally complex environments. Your nervous system is designed to help you navigate those moments, but only if you know how to listen to it."
            },
            {
                "type": "subheading",
                "text": "Two Systems, One Goal"
            },
            {
                "type": "paragraph",
                "text": "Your autonomic nervous system has two branches:"
            },
            {
                "type": "bullet_list",
                "items": [
                    "**Sympathetic (Gas Pedal):** Activates when you need energy, focus, or quick response. Heart rate up, muscles tense, ready to act.",
                    "**Parasympathetic (Brake Pedal):** Activates when it's safe to rest, digest, and recover. Heart rate down, breathing slow, body calm."
                ]
            },
            {
                "type": "paragraph",
                "text": "Neither system is \"good\" or \"bad\" — they're both essential. Problems arise when:"
            },
            {
                "type": "bullet_list",
                "items": [
                    "You stay in sympathetic mode too long (chronic stress, burnout)",
                    "You can't access sympathetic mode when you need it (feeling flat, disconnected)",
                    "You don't notice which mode you're in (low self-awareness)"
                ]
            },
            {
                "type": "subheading",
                "text": "Why This Matters for Interpreters"
            },
            {
                "type": "paragraph",
                "text": "The ECCI Model identifies **Self-Awareness** as a core competency because you can't manage what you don't notice. When you're aware of your nervous system state, you can:"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Recognize early signs of overwhelm before they affect your work",
                    "Choose strategies to regulate yourself in real-time",
                    "Build resilience by knowing when to push and when to rest",
                    "Model calm presence for the people you serve"
                ]
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**ECCI Connection:** Self-awareness isn't navel-gazing. It's the foundation that allows you to show up fully, manage emotions skillfully, and interpret with integrity."
            }
        ]
    }'::jsonb,
    -- CONTENT_PRACTICE (Micro-Practice - 3 min)
    '{
        "section_title": "Micro-Practice",
        "duration_minutes": 3,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Body Scan Check-In"
            },
            {
                "type": "paragraph",
                "text": "You're going to practice noticing your nervous system in real-time. This isn't about changing anything — just observing."
            },
            {
                "type": "subheading",
                "text": "Step 1: Baseline Notice (60 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Close your eyes or soften your gaze. Take three slow breaths. Then scan your body from head to toe, noticing:"
            },
            {
                "type": "bullet_list",
                "items": [
                    "**Breath:** Fast/slow? Shallow/deep? Held or flowing?",
                    "**Heart rate:** Racing, steady, or calm?",
                    "**Muscles:** Tight jaw? Tense shoulders? Clenched hands?",
                    "**Temperature:** Warm, cold, sweaty?",
                    "**Energy:** Buzzing, flat, grounded?"
                ]
            },
            {
                "type": "paragraph",
                "text": "Don't judge what you notice. Just notice."
            },
            {
                "type": "subheading",
                "text": "Step 2: Assignment Recall (90 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Now think of an upcoming assignment — or recall a recent one that felt challenging. As you picture it, notice:"
            },
            {
                "type": "bullet_list",
                "items": [
                    "What changes in your body?",
                    "Does your breathing shift?",
                    "Do you feel your shoulders rise?",
                    "Does your heart rate pick up?"
                ]
            },
            {
                "type": "paragraph",
                "text": "This is your sympathetic system activating. It's preparing you. Notice it without trying to fix it."
            },
            {
                "type": "subheading",
                "text": "Step 3: Return (30 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Release the mental image. Take three more slow breaths. Notice if your body begins to settle. This is your parasympathetic system saying, \"You're safe right now.\""
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**What you just did:** You practiced the most important skill in nervous system regulation — awareness. You can't regulate what you don't notice."
            }
        ]
    }'::jsonb,
    -- CONTENT_APPLICATION (Application Bridge - 1 min)
    '{
        "section_title": "Application Bridge",
        "duration_minutes": 1,
        "content_blocks": [
            {
                "type": "heading",
                "text": "This Week: Your 30-Second Check-In"
            },
            {
                "type": "paragraph",
                "text": "Before your next assignment, take 30 seconds to scan your body. Notice one thing:"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Breathing pattern",
                    "Shoulder tension",
                    "Jaw tightness",
                    "Heart rate",
                    "Energy level"
                ]
            },
            {
                "type": "paragraph",
                "text": "You don't have to change it. Just notice it. That's self-awareness in action."
            },
            {
                "type": "callout",
                "style": "next_step",
                "text": "**Coming up in Module 1.2:** You'll learn practical techniques to shift your nervous system state when you need to — whether that's calming down or ramping up."
            },
            {
                "type": "subheading",
                "text": "Reflect with Elya"
            },
            {
                "type": "paragraph",
                "text": "Ready to deepen your insights? Click below to reflect on what you noticed with Elya, your AI guide."
            }
        ]
    }'::jsonb,
    (SELECT id FROM elya_prompt_sets WHERE set_code = 'nsm-1-1-reflection'),
    false,
    null,
    '[]'::jsonb,
    true,
    'Content adapted from CATIE Center materials, licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Original content © CATIE Center. Adapted for InterpretReflect by Building Bridges Global.',
    'https://www.katiecenter.org'
) ON CONFLICT (module_code) DO NOTHING;

-- ============================================================================
-- 4. INSERT PLACEHOLDER MODULES 1.2-1.6 (for series completion)
-- ============================================================================

INSERT INTO skill_modules (
    module_code,
    series_id,
    title,
    subtitle,
    description,
    duration_minutes,
    ecci_domain,
    order_in_series,
    content_concept,
    content_practice,
    content_application,
    elya_prompt_set_id,
    is_active,
    attribution_text
) VALUES
    (
        'nsm-1-2',
        (SELECT id FROM skill_series WHERE series_code = 'nsm'),
        'Regulation Techniques',
        'Tools to shift your nervous system state',
        'Learn practical, evidence-based techniques to calm activation or build energy when you need it.',
        7,
        'Self-Management',
        2,
        '{"section_title": "Quick Concept", "duration_minutes": 2, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Micro-Practice", "duration_minutes": 3, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Application Bridge", "duration_minutes": 1, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        null,
        false,
        'Content adapted from CATIE Center materials under CC BY 4.0'
    ),
    (
        'nsm-1-3',
        (SELECT id FROM skill_series WHERE series_code = 'nsm'),
        'Triggers & Patterns',
        'Identify what activates your stress response',
        'Map your personal trigger patterns and early warning signals.',
        7,
        'Self-Awareness',
        3,
        '{"section_title": "Quick Concept", "duration_minutes": 2, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Micro-Practice", "duration_minutes": 3, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Application Bridge", "duration_minutes": 1, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        null,
        false,
        'Content adapted from CATIE Center materials under CC BY 4.0'
    ),
    (
        'nsm-1-4',
        (SELECT id FROM skill_series WHERE series_code = 'nsm'),
        'Window of Tolerance',
        'Find your optimal zone for interpreting',
        'Understand your personal range of effective functioning and how to stay within it.',
        7,
        'Self-Management',
        4,
        '{"section_title": "Quick Concept", "duration_minutes": 2, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Micro-Practice", "duration_minutes": 3, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Application Bridge", "duration_minutes": 1, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        null,
        false,
        'Content adapted from CATIE Center materials under CC BY 4.0'
    ),
    (
        'nsm-1-5',
        (SELECT id FROM skill_series WHERE series_code = 'nsm'),
        'Between-Assignment Recovery',
        'Build resilience through strategic rest',
        'Learn why recovery isn't optional and how to integrate it into your routine.',
        7,
        'Self-Management',
        5,
        '{"section_title": "Quick Concept", "duration_minutes": 2, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Micro-Practice", "duration_minutes": 3, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Application Bridge", "duration_minutes": 1, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        null,
        false,
        'Content adapted from CATIE Center materials under CC BY 4.0'
    ),
    (
        'nsm-1-6',
        (SELECT id FROM skill_series WHERE series_code = 'nsm'),
        'Your Personalized Regulation Plan',
        'Create your go-to toolkit',
        'Synthesize what you've learned into a practical, personalized plan for nervous system care.',
        10,
        'Self-Management',
        6,
        '{"section_title": "Quick Concept", "duration_minutes": 2, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Micro-Practice", "duration_minutes": 3, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        '{"section_title": "Application Bridge", "duration_minutes": 1, "content_blocks": [{"type": "paragraph", "text": "Coming soon"}]}'::jsonb,
        null,
        false,
        'Content adapted from CATIE Center materials under CC BY 4.0'
    )
ON CONFLICT (module_code) DO NOTHING;
