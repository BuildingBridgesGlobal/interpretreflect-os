-- ============================================================================
-- SEED DATA: Module 1.4 "Grounding Techniques for Interpreters"
-- Nervous System Management (NSM) Series
-- ============================================================================

-- ============================================================================
-- 1. INSERT ELYA PROMPT SET FOR MODULE 1.4
-- ============================================================================

INSERT INTO elya_prompt_sets (
    set_code,
    module_code,
    description,
    prompts
) VALUES (
    'nsm-1-4-reflection',
    'nsm-1-4',
    'Reflection prompts for Module 1.4: Grounding Techniques for Interpreters',
    '[
        {
            "order": 1,
            "type": "opening",
            "prompt_text": "Which of those five techniques do you think would work best for YOU? There''s no right answer — it depends on your body and your typical interpreting setup.",
            "awaits_response": true,
            "follow_up_logic": "Listen for their reasoning. Some people are more body-oriented (feet, thumb press), others more breath-oriented (slow exhale), others more cognitive (name three things). Validate their choice."
        },
        {
            "order": 2,
            "type": "deepening",
            "prompt_text": "Great choice. I''m curious — what drew you to that one? Was it something about how your body responds, or more about what feels practical in your work setting?",
            "awaits_response": true,
            "follow_up_logic": "This helps them understand their own regulation preferences. Body-based vs. cognitive vs. breath-based approaches. This self-knowledge is valuable."
        },
        {
            "order": 3,
            "type": "closing",
            "prompt_text": "Perfect. Here''s your micro-challenge: Use your chosen technique at least once during your next three assignments. Not because you''re dysregulated — just to practice so it''s automatic when you need it. Deal? 🤝",
            "awaits_response": true,
            "follow_up_logic": "Get explicit commitment. The key insight is practicing when calm so it''s available when stressed. Module 1.5 shifts to recovery BETWEEN assignments."
        }
    ]'::jsonb
) ON CONFLICT (set_code) DO NOTHING;

-- ============================================================================
-- 2. UPDATE MODULE 1.4 WITH FULL CONTENT
-- ============================================================================

UPDATE skill_modules SET
    title = 'Grounding Techniques for Interpreters',
    subtitle = 'Invisible regulation tools you can use mid-assignment',
    description = 'Learn discrete, in-the-moment grounding techniques you can use during assignments without anyone noticing.',
    duration_minutes = 5,
    ecci_domain = 'Self-Management',
    order_in_series = 4,

    -- CONTENT_CONCEPT (Quick Concept - 1 min)
    content_concept = '{
        "section_title": "Quick Concept",
        "duration_minutes": 1,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Grounding That No One Sees"
            },
            {
                "type": "paragraph",
                "text": "Grounding brings your attention back to the present moment when your nervous system starts to drift outside your window. The challenge for interpreters? You need techniques that are completely invisible to clients and don''t interrupt your work."
            },
            {
                "type": "paragraph",
                "text": "The techniques in this module are designed specifically for interpreting contexts — you can use them while signing, voicing, or processing. They take seconds, not minutes. And the best technique is simply the one you''ll actually use."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Key Principle:** Practice these when you DON''T need them so they''re automatic when you do. Regulation skills are like muscle memory — they need repetition before high-stakes moments."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**ECCI Connection:** Self-Management means having tools ready before you need them. Effective interpreters don''t just react to dysregulation — they proactively maintain their window of tolerance."
            }
        ]
    }'::jsonb,

    -- CONTENT_PRACTICE (Micro-Practice - 2.5 min)
    content_practice = '{
        "section_title": "Micro-Practice",
        "duration_minutes": 2.5,
        "content_blocks": [
            {
                "type": "heading",
                "text": "The Interpreter''s Grounding Toolkit"
            },
            {
                "type": "paragraph",
                "text": "Read through each technique, then select the 1-2 that feel most natural for your body and your typical interpreting setup."
            },
            {
                "type": "subheading",
                "text": "🦶 Feet on Floor (5 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Press your feet firmly into the ground. Notice the sensation of support beneath you. Feel the solidity of the floor holding you up."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Interpreter Note:** Works while signing or voicing. Completely invisible. Particularly effective for VRS interpreters who sit for long periods. **Best for:** Quick reset, feeling ungrounded or floaty."
            },
            {
                "type": "subheading",
                "text": "🌬️ Slow Exhale (10 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Inhale normally, then exhale for twice as long as your inhale. A 4-count inhale, 8-count exhale works well. This directly activates your parasympathetic nervous system."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Interpreter Note:** Can do between turns or during brief pauses. Connects to the BREATHE Protocol for deeper regulation work. **Best for:** Feeling activated, racing heart, anxiety rising."
            },
            {
                "type": "subheading",
                "text": "👀 Peripheral Vision (5 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Soften your gaze slightly and notice the edges of your vision without moving your eyes. Allow your visual field to expand rather than tunnel."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Interpreter Note:** Particularly useful in VRS when you feel tunnel vision setting in. Shifts you from stress-narrowed focus to open awareness. **Best for:** Tunnel vision, hyperfocus, feeling trapped."
            },
            {
                "type": "subheading",
                "text": "👍 Thumb Press (3 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Press your thumb firmly into your palm, thigh, or the arm of your chair. Focus on the sensation of pressure. Release and notice the difference."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Interpreter Note:** Completely invisible. Can do with non-dominant hand while signing. Provides immediate sensory grounding. **Best for:** Feeling disconnected, dissociating, checked out."
            },
            {
                "type": "subheading",
                "text": "🔢 Name Three Things (10 seconds)"
            },
            {
                "type": "paragraph",
                "text": "Silently name three things you can see right now. Or three sounds you can hear. This anchors your mind to the present moment."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Interpreter Note:** Best used during brief pauses or before an assignment starts. Mental exercise that doesn''t require any physical movement. **Best for:** Racing thoughts, anticipatory anxiety, mental overwhelm."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Reflection:** Which 1-2 techniques do you want to practice this week? There''s no right answer — it depends on your body, your typical interpreting setup, and what feels natural to you."
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
                "text": "Your Micro-Challenge: Practice Before You Need It"
            },
            {
                "type": "paragraph",
                "text": "Here''s your challenge: Use your chosen technique at least once during your next three assignments. Not because you''re dysregulated — just to practice so it becomes automatic when you actually need it."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**The Goal:** Move from reactive regulation (using techniques only when you''re already outside your window) to proactive regulation (maintaining your window throughout the assignment)."
            },
            {
                "type": "subheading",
                "text": "Your 3-Assignment Practice Plan"
            },
            {
                "type": "bullet_list",
                "items": [
                    "**Assignment 1:** Use your technique once, even if you feel fine",
                    "**Assignment 2:** Notice if you remember to use it without prompting",
                    "**Assignment 3:** Try using it at the START of the assignment as a preventive measure"
                ]
            },
            {
                "type": "paragraph",
                "text": "After your three assignments, notice: Did proactive grounding affect your overall regulation? Many interpreters find that starting grounded helps them stay grounded."
            },
            {
                "type": "callout",
                "style": "next_step",
                "text": "**Going Deeper: BREATHE Protocol** — The Slow Exhale technique is the foundation of the BREATHE Protocol, a more comprehensive regulation framework available in your Wellness tools. When you have more than 10 seconds, BREATHE offers a complete reset sequence."
            },
            {
                "type": "subheading",
                "text": "Reflect with Elya"
            },
            {
                "type": "paragraph",
                "text": "Ready to choose your techniques and commit to practicing? Click below to reflect with Elya."
            }
        ]
    }'::jsonb,

    elya_prompt_set_id = (SELECT id FROM elya_prompt_sets WHERE set_code = 'nsm-1-4-reflection'),
    is_active = true,
    attribution_text = 'Content adapted from "Nervous System Management for Interpreters" by Naomi Sheneman and the CATIE Center at St. Catherine University (Dive In Project, US DOE Grant #H160D210003). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). BREATHE Protocol © Building Bridges Global. Adapted for InterpretReflect by Building Bridges Global.',
    source_content_url = 'https://www.katiecenter.org',
    updated_at = NOW()
WHERE module_code = 'nsm-1-4';
