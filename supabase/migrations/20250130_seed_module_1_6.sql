-- ============================================================================
-- SEED DATA: Module 1.6 "Building Nervous System Resilience"
-- Nervous System Management (NSM) Series - CAPSTONE MODULE
-- ============================================================================

-- ============================================================================
-- 1. INSERT ELYA PROMPT SET FOR MODULE 1.6
-- ============================================================================

INSERT INTO elya_prompt_sets (
    set_code,
    module_code,
    description,
    prompts
) VALUES (
    'nsm-1-6-reflection',
    'nsm-1-6',
    'Reflection prompts for Module 1.6: Building Nervous System Resilience',
    '[
        {
            "order": 1,
            "type": "opening",
            "prompt_text": "Looking at your resilience inventory, which pillar feels strongest right now? Which one needs the most attention?",
            "awaits_response": true,
            "follow_up_logic": "Listen for self-awareness. Most people have a clear sense of their strengths and growth areas. Validate their assessment."
        },
        {
            "order": 2,
            "type": "personalized",
            "prompt_text": "That''s honest self-assessment — which is itself an awareness skill! Here''s what I''ve noticed in our conversations through this series: You seem particularly tuned into understanding your patterns. Does that feel accurate?",
            "awaits_response": true,
            "follow_up_logic": "Offer a personalized observation based on their journey through the modules. This could reference their stress signals from 1.1, window patterns from 1.2, co-regulation tendencies from 1.3, technique preferences from 1.4, or recovery patterns from 1.5."
        },
        {
            "order": 3,
            "type": "commitment",
            "prompt_text": "As you finish this series, I want you to choose ONE thing to focus on for the next 30 days. Not everything — just one practice that would make the biggest difference. What is it?",
            "awaits_response": true,
            "follow_up_logic": "Get specific commitment. Push gently if they''re vague. ''Use grounding techniques'' is too broad — ''Use feet-on-floor once per assignment'' is actionable."
        },
        {
            "order": 4,
            "type": "closing",
            "prompt_text": "Congratulations on completing the Nervous System Management series! 🎉 Remember: This isn''t about being perfect. It''s about being aware, having tools, and building sustainability over time. I''ll check in with you about your 30-day focus next week. You''ve built real skills here. ⭐",
            "awaits_response": false,
            "follow_up_logic": "Celebrate completion. Reinforce growth mindset. Set expectation for follow-up accountability."
        }
    ]'::jsonb
) ON CONFLICT (set_code) DO NOTHING;

-- ============================================================================
-- 2. UPDATE MODULE 1.6 WITH FULL CONTENT
-- ============================================================================

UPDATE skill_modules SET
    title = 'Building Nervous System Resilience',
    subtitle = 'Create your sustainable practice for long-term career health',
    description = 'Integrate everything you''ve learned into a sustainable personal practice for long-term interpreting career health.',
    duration_minutes = 8,
    ecci_domain = 'Self-Management',
    order_in_series = 6,

    -- CONTENT_CONCEPT (Quick Concept - 2.5 min)
    content_concept = '{
        "section_title": "Quick Concept",
        "duration_minutes": 2.5,
        "content_blocks": [
            {
                "type": "heading",
                "text": "From Survival to Sustainability"
            },
            {
                "type": "paragraph",
                "text": "Here''s the most important thing to know: Resilience isn''t a fixed trait you either have or don''t. It''s a capacity that can be developed with consistent practice. Your window of tolerance can expand. Your recovery can get faster. Your awareness can become automatic."
            },
            {
                "type": "paragraph",
                "text": "Long-term interpreters who thrive — not just survive — share certain habits. They''re not superhuman. They''ve just built sustainable practices over time. This module helps you create your own sustainability plan."
            },
            {
                "type": "subheading",
                "text": "The Three Pillars of Interpreter Resilience"
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Pillar 1: Awareness** — Knowing your patterns, triggers, and early warning signs. Recognizing your window of tolerance in real-time. Understanding how co-regulation affects you."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Pillar 2: Regulation** — Having in-the-moment tools that work for YOUR body. Using them proactively, not just reactively. Managing co-regulation dynamics consciously."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Pillar 3: Recovery** — Building sustainable rhythms between assignments. Making consistent deposits to your nervous system account. Recognizing when you need deeper rest."
            },
            {
                "type": "paragraph",
                "text": "Most interpreters are stronger in one or two pillars and weaker in others. That''s normal. The goal is to identify where you need growth and focus there intentionally."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**ECCI Connection:** Self-Management is the integration of all these pillars. It''s not just knowing what to do — it''s consistently doing it, even when it''s hard."
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
                "text": "Personal Resilience Inventory"
            },
            {
                "type": "paragraph",
                "text": "Rate yourself honestly on each item. This isn''t a test — it''s a self-assessment to help you identify your growth edges. Use a scale of 1-5: 1 = Rarely true, 2 = Sometimes true, 3 = Often true, 4 = Usually true, 5 = Almost always true."
            },
            {
                "type": "subheading",
                "text": "👁️ Pillar 1: Awareness"
            },
            {
                "type": "bullet_list",
                "items": [
                    "I know my stress triggers",
                    "I recognize my early warning signs",
                    "I understand my window of tolerance"
                ]
            },
            {
                "type": "subheading",
                "text": "🎚️ Pillar 2: Regulation"
            },
            {
                "type": "bullet_list",
                "items": [
                    "I have go-to grounding techniques",
                    "I use them proactively (not just in crisis)",
                    "I manage co-regulation dynamics consciously"
                ]
            },
            {
                "type": "subheading",
                "text": "🔄 Pillar 3: Recovery"
            },
            {
                "type": "bullet_list",
                "items": [
                    "I take intentional breaks between assignments",
                    "I have sustainable weekly rhythms",
                    "I maintain energy over time (vs. boom/bust cycles)"
                ]
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Reflection:** Looking at your ratings, which pillar feels strongest? Which needs the most attention? Remember — everyone has growth edges. This is about awareness, not judgment."
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
                "text": "Your 30-Day Focus: One Thing for 30 Days"
            },
            {
                "type": "paragraph",
                "text": "You''ve covered a lot in this series: nervous system basics, window of tolerance, co-regulation, grounding techniques, and recovery. Now it''s time to choose ONE focus area for the next 30 days."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**The Power of One:** Don''t try to do everything. Choose the single practice that would make the biggest difference for you right now. Consistency with one thing beats inconsistency with five."
            },
            {
                "type": "subheading",
                "text": "How to Choose Your Focus"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Review your pillar assessment — which area scored lowest?",
                    "Choose ONE specific practice from that pillar",
                    "Commit to that practice for 30 days",
                    "Set a reminder to check in with yourself (or Elya) weekly"
                ]
            },
            {
                "type": "subheading",
                "text": "Example 30-Day Focuses"
            },
            {
                "type": "bullet_list",
                "items": [
                    "**Awareness:** Do a 30-second window check before every assignment",
                    "**Regulation:** Use my chosen grounding technique once per assignment",
                    "**Recovery:** Take 5 minutes of intentional recovery between each assignment"
                ]
            },
            {
                "type": "callout",
                "style": "next_step",
                "text": "**Congratulations!** You''ve completed the Nervous System Management series. This isn''t about being perfect — it''s about being aware, having tools, and building sustainability over time. Your future interpreting self will thank you."
            },
            {
                "type": "subheading",
                "text": "Reflect with Elya"
            },
            {
                "type": "paragraph",
                "text": "Ready to commit to your 30-day focus? Click below to reflect with Elya and celebrate completing this series!"
            }
        ]
    }'::jsonb,

    elya_prompt_set_id = (SELECT id FROM elya_prompt_sets WHERE set_code = 'nsm-1-6-reflection'),
    is_active = true,
    attribution_text = 'Content adapted from "Nervous System Management for Interpreters" by Naomi Sheneman and the CATIE Center at St. Catherine University (Dive In Project, US DOE Grant #H160D210003). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Adapted for InterpretReflect by Building Bridges Global.',
    source_content_url = 'https://www.katiecenter.org',
    updated_at = NOW()
WHERE module_code = 'nsm-1-6';
