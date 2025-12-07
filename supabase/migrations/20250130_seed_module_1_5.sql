-- ============================================================================
-- SEED DATA: Module 1.5 "Recovery Between Assignments"
-- Nervous System Management (NSM) Series
-- ============================================================================

-- ============================================================================
-- 1. INSERT ELYA PROMPT SET FOR MODULE 1.5
-- ============================================================================

INSERT INTO elya_prompt_sets (
    set_code,
    module_code,
    description,
    prompts
) VALUES (
    'nsm-1-5-reflection',
    'nsm-1-5',
    'Reflection prompts for Module 1.5: Recovery Between Assignments',
    '[
        {
            "order": 1,
            "type": "opening",
            "prompt_text": "Based on your recovery audit, what''s your honest assessment? Are you making regular deposits, or running a deficit?",
            "awaits_response": true,
            "follow_up_logic": "Listen without judgment. Most interpreters run deficits without realizing it. Validate whatever they share — awareness is the first step."
        },
        {
            "order": 2,
            "type": "deepening",
            "prompt_text": "No judgment here — most interpreters run deficits without realizing it until they''re exhausted. What''s ONE small recovery practice you could realistically add between assignments? Even 5 minutes counts.",
            "awaits_response": true,
            "follow_up_logic": "Help them identify something doable, not aspirational. Better to do 2 minutes consistently than plan 15 minutes they''ll never take."
        },
        {
            "order": 3,
            "type": "application",
            "prompt_text": "I like that. Here''s the thing — this isn''t about being perfect. It''s about making more deposits than withdrawals over time. Want me to check in with you about this next week?",
            "awaits_response": true,
            "follow_up_logic": "Offer accountability without pressure. If they want a check-in, note it. Emphasize progress over perfection."
        },
        {
            "order": 4,
            "type": "closing",
            "prompt_text": "You''re almost done with the Nervous System series! 🎉 The final module is about building long-term resilience — putting all of this together into sustainable practice. You''ve built real awareness through this series.",
            "awaits_response": false,
            "follow_up_logic": "Celebrate their progress. Create anticipation for the capstone module."
        }
    ]'::jsonb
) ON CONFLICT (set_code) DO NOTHING;

-- ============================================================================
-- 2. UPDATE MODULE 1.5 WITH FULL CONTENT
-- ============================================================================

UPDATE skill_modules SET
    title = 'Recovery Between Assignments',
    subtitle = 'Build sustainable habits for nervous system deposits',
    description = 'Understand why recovery time matters and build sustainable habits for transitions between interpreting work.',
    duration_minutes = 6,
    ecci_domain = 'Self-Management',
    order_in_series = 5,

    -- CONTENT_CONCEPT (Quick Concept - 2 min)
    content_concept = '{
        "section_title": "Quick Concept",
        "duration_minutes": 2,
        "content_blocks": [
            {
                "type": "heading",
                "text": "The Recovery Debt Trap"
            },
            {
                "type": "paragraph",
                "text": "Your nervous system needs recovery time after activation. This isn''t weakness — it''s biology. When you stack assignments back-to-back without recovery, stress accumulates. Each assignment starts from a slightly more depleted baseline than the last."
            },
            {
                "type": "paragraph",
                "text": "Many interpreters run on adrenaline and don''t notice the accumulation until they crash. The goal isn''t to eliminate stress — it''s to balance activation with recovery so you can sustain your career long-term."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**The Recovery Debt Concept:** Think of your nervous system like a bank account. Each demanding assignment is a withdrawal. Recovery is a deposit. Run a deficit too long, and you hit burnout — nervous system bankruptcy with no reserves left."
            },
            {
                "type": "subheading",
                "text": "What Counts as Recovery?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Intentional breathing or body scan (even 2 minutes)",
                    "Physical movement — walk, stretch, shake it out",
                    "Sensory reset — step outside, change environment",
                    "Mental clearing — not scrolling, but actual mental rest",
                    "Social connection — brief chat with a supportive person",
                    "Silence — especially important after high-language-demand work"
                ]
            },
            {
                "type": "paragraph",
                "text": "Notice what''s NOT on this list: checking email, scrolling social media, rushing to the next thing. Those activities keep your nervous system activated rather than allowing recovery."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**VRS Interpreters:** The rapid call turnover in VRS creates unique recovery challenges. Even 60-90 seconds of intentional recovery between calls can make a significant difference over a shift."
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
                "text": "Recovery Audit"
            },
            {
                "type": "paragraph",
                "text": "Think about yesterday or your most recent work day. Answer honestly — this is for your awareness, not judgment."
            },
            {
                "type": "subheading",
                "text": "Question 1: How many interpreting assignments or calls did you have?"
            },
            {
                "type": "paragraph",
                "text": "Include all work — in-person, VRS, VRI, etc."
            },
            {
                "type": "subheading",
                "text": "Question 2: On average, how much time did you have between assignments?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "No break — back to back",
                    "Under 5 minutes",
                    "5-15 minutes",
                    "15-30 minutes",
                    "30+ minutes"
                ]
            },
            {
                "type": "subheading",
                "text": "Question 3: What did you typically do in your transition time?"
            },
            {
                "type": "paragraph",
                "text": "Be honest — scrolling counts, rushing counts, intentional rest counts."
            },
            {
                "type": "subheading",
                "text": "Question 4: How did you feel by the end of your work day?"
            },
            {
                "type": "paragraph",
                "text": "Rate from 1 (completely depleted) to 10 (energized)."
            },
            {
                "type": "subheading",
                "text": "Question 5: Did you do anything INTENTIONAL to recover between assignments?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Yes, regularly throughout the day",
                    "Sometimes, when I remembered",
                    "No, not really",
                    "No — there wasn''t time"
                ]
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**Reflection:** What does this audit reveal about your current recovery patterns?"
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
                "text": "One Small Deposit"
            },
            {
                "type": "paragraph",
                "text": "You don''t need to overhaul your entire schedule. Start with one small, consistent recovery practice you can realistically add between assignments."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Micro-Recovery Ideas (5 minutes or less):** Step outside for 60 seconds of fresh air. Do a 2-minute body scan. Stretch your shoulders and neck. Take 5 slow breaths with eyes closed. Walk to get water and drink it slowly."
            },
            {
                "type": "subheading",
                "text": "Your Recovery Practice"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Choose ONE micro-recovery practice that fits your work context",
                    "Commit to doing it at least once per work day this week",
                    "Notice how you feel at end-of-day compared to your audit baseline",
                    "No perfection required — just more deposits than before"
                ]
            },
            {
                "type": "callout",
                "style": "next_step",
                "text": "**Remember:** Recovery isn''t lazy. It''s how you sustain a long interpreting career without burning out. Every small deposit counts."
            },
            {
                "type": "subheading",
                "text": "Reflect with Elya"
            },
            {
                "type": "paragraph",
                "text": "Ready to commit to your recovery practice? Click below to reflect with Elya about your next steps."
            }
        ]
    }'::jsonb,

    elya_prompt_set_id = (SELECT id FROM elya_prompt_sets WHERE set_code = 'nsm-1-5-reflection'),
    is_active = true,
    attribution_text = 'Content adapted from "Nervous System Management for Interpreters" by Naomi Sheneman and the CATIE Center at St. Catherine University (Dive In Project, US DOE Grant #H160D210003). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Adapted for InterpretReflect by Building Bridges Global.',
    source_content_url = 'https://www.katiecenter.org',
    updated_at = NOW()
WHERE module_code = 'nsm-1-5';
