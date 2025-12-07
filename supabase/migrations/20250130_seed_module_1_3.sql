-- ============================================================================
-- SEED DATA: Module 1.3 "Co-Regulation in Interpreting"
-- Nervous System Management (NSM) Series
-- ============================================================================

-- ============================================================================
-- 1. INSERT ELYA PROMPT SET FOR MODULE 1.3
-- ============================================================================

INSERT INTO elya_prompt_sets (
    set_code,
    module_code,
    description,
    prompts
) VALUES (
    'nsm-1-3-reflection',
    'nsm-1-3',
    'Reflection prompts for Module 1.3: Co-Regulation in Interpreting',
    '[
        {
            "order": 1,
            "type": "opening",
            "prompt_text": "Co-regulation is one of the hidden demands of interpreting that rarely gets talked about. Think about the assignment you just recalled — if you could go back, what would you do differently to protect your own regulation while still being present for the client?",
            "awaits_response": true,
            "follow_up_logic": "Listen for their strategies or struggles. Validate the difficulty of this balance. Watch for signs they over-function or under-function in high-emotion situations."
        },
        {
            "order": 2,
            "type": "deepening",
            "prompt_text": "That''s a sophisticated insight. Many experienced interpreters learn to create what I call an ''emotional boundary that breathes'' — present and empathetic, but not absorbing everything. Does that concept resonate with your experience?",
            "awaits_response": true,
            "follow_up_logic": "Explore whether they tend toward over-absorption or emotional shutdown. Both are protective responses. Neither is wrong — just patterns to understand."
        },
        {
            "order": 3,
            "type": "application",
            "prompt_text": "Here''s something to try this week: Before your next high-emotion assignment, take 30 seconds to consciously ground yourself. Notice if staying regulated helps the overall dynamic. Would you like to set a reminder to reflect on this afterward?",
            "awaits_response": true,
            "follow_up_logic": "Offer concrete next step. If they want a reminder, note this for follow-up. Affirm that this is advanced emotional intelligence work."
        },
        {
            "order": 4,
            "type": "closing",
            "prompt_text": "You''re building real emotional intelligence here — the kind that separates sustainable interpreters from those who burn out. Module 1.4 gives you specific grounding techniques to use in the moment when you feel yourself getting pulled out of your window. 🌿",
            "awaits_response": false,
            "follow_up_logic": "Validate their growth and create anticipation for practical tools in the next module."
        }
    ]'::jsonb
) ON CONFLICT (set_code) DO NOTHING;

-- ============================================================================
-- 2. UPDATE MODULE 1.3 WITH FULL CONTENT
-- ============================================================================

UPDATE skill_modules SET
    title = 'Co-Regulation in Interpreting',
    subtitle = 'Nervous systems are contagious — learn to stay grounded',
    description = 'Understand how nervous systems affect each other and develop awareness of the regulatory dynamics in your interpreting work.',
    duration_minutes = 8,
    ecci_domain = 'Social Awareness',
    order_in_series = 3,

    -- CONTENT_CONCEPT (Quick Concept - 2.5 min)
    content_concept = '{
        "section_title": "Quick Concept",
        "duration_minutes": 2.5,
        "content_blocks": [
            {
                "type": "heading",
                "text": "Nervous Systems Are Contagious"
            },
            {
                "type": "paragraph",
                "text": "Here's something they don't teach in ITP: Nervous systems are contagious. When you walk into a room with an anxious client, a frustrated provider, or a grieving family member, your nervous system automatically responds to theirs. This is called co-regulation — and it's one of the biggest unacknowledged demands of interpreting work."
            },
            {
                "type": "paragraph",
                "text": "Co-regulation works both ways. You absorb the emotional states around you, AND you transmit your own state to others. A regulated interpreter can actually help calm a tense room. An unregulated interpreter can escalate tension without saying a word."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**The Co-Regulation Loop:** Client emotion → Your nervous system responds → Your state affects client → Loop continues. Breaking the loop requires conscious awareness."
            },
            {
                "type": "subheading",
                "text": "Common Co-Regulation Scenarios"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Medical appointment with an anxious patient awaiting test results",
                    "Legal setting with an angry defendant who feels unheard",
                    "Educational IEP with a frustrated parent advocating for their child",
                    "VRS call with a grieving caller sharing difficult news",
                    "Mental health session with a client in crisis"
                ]
            },
            {
                "type": "paragraph",
                "text": "In each of these scenarios, the interpreter isn't just processing language — they're navigating intense emotional currents while trying to maintain their own regulation. This is skilled emotional labor, and it deserves recognition."
            },
            {
                "type": "callout",
                "style": "insight",
                "text": "**ECCI Connection:** Social Awareness includes recognizing not just what others are feeling, but how their emotional states affect your own nervous system in real-time."
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
                "text": "Co-Regulation Awareness Exercise"
            },
            {
                "type": "paragraph",
                "text": "Recall a recent assignment where emotions were running high. Take a moment to really remember the situation, then work through these reflection questions."
            },
            {
                "type": "subheading",
                "text": "Question 1: What was the client''s primary emotional state?"
            },
            {
                "type": "paragraph",
                "text": "Examples: anxious, angry, sad, frustrated, fearful, overwhelmed, shut down"
            },
            {
                "type": "subheading",
                "text": "Question 2: How did their emotional state affect YOUR body?"
            },
            {
                "type": "paragraph",
                "text": "Notice: Where did you feel tension? Did your breathing change? What happened to your heart rate? Did you have an urge to fix, flee, or freeze?"
            },
            {
                "type": "subheading",
                "text": "Question 3: Did you find yourself trying to ''fix'' their emotion or stay neutral?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "I tried to calm/fix/help beyond my role",
                    "I maintained professional neutrality",
                    "I absorbed their emotion without realizing",
                    "I shut down emotionally to protect myself"
                ]
            },
            {
                "type": "subheading",
                "text": "Question 4: What happened to your window of tolerance?"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Stayed in my window throughout",
                    "Got pushed above (activated, anxious)",
                    "Got pushed below (numb, checked out)",
                    "Fluctuated in and out"
                ]
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Reflection:** What does this tell you about your co-regulation patterns? Are you more prone to over-absorbing or shutting down?"
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
                "text": "The Emotional Boundary That Breathes"
            },
            {
                "type": "paragraph",
                "text": "Many experienced interpreters develop what we call an ''emotional boundary that breathes'' — present and empathetic, but not absorbing. This isn''t about being cold or disconnected. It''s about being grounded enough in your own regulation that you can witness emotion without drowning in it."
            },
            {
                "type": "callout",
                "style": "practice_tip",
                "text": "**Pre-Assignment Grounding:** Before your next high-emotion assignment, take 30 seconds to consciously ground yourself. Feel your feet on the floor, take one slow breath, and silently set the intention: ''I can be present without absorbing.''"
            },
            {
                "type": "subheading",
                "text": "Your Practice This Week"
            },
            {
                "type": "bullet_list",
                "items": [
                    "Identify one upcoming assignment that might have high co-regulation demands",
                    "Before that assignment, do the 30-second grounding practice",
                    "Afterward, notice: Did staying regulated affect the overall dynamic?",
                    "No judgment either way — just observe and learn"
                ]
            },
            {
                "type": "callout",
                "style": "next_step",
                "text": "**Remember:** Your regulation is not selfish. A regulated interpreter serves everyone in the room better."
            },
            {
                "type": "subheading",
                "text": "Reflect with Elya"
            },
            {
                "type": "paragraph",
                "text": "Ready to explore your co-regulation patterns? Click below to reflect with Elya about what you've discovered."
            }
        ]
    }'::jsonb,

    elya_prompt_set_id = (SELECT id FROM elya_prompt_sets WHERE set_code = 'nsm-1-3-reflection'),
    is_active = true,
    attribution_text = 'Content adapted from "Nervous System Management for Interpreters" by Naomi Sheneman and the CATIE Center at St. Catherine University (Dive In Project, US DOE Grant #H160D210003). Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0). Adapted for InterpretReflect by Building Bridges Global.',
    source_content_url = 'https://www.katiecenter.org',
    updated_at = NOW()
WHERE module_code = 'nsm-1-3';
