-- ============================================================================
-- CEU DATA: Modules 1.3-1.6
-- Learning objectives and assessments for remaining NSM modules
-- ============================================================================

-- ============================================================================
-- MODULE 1.3: Co-Regulation in Interpreting
-- Duration: 8 min content + 5 min reflection + 3 min assessment = 16 min = 0.027 CEU
-- ============================================================================

UPDATE skill_modules SET
    ceu_value = 0.027,
    rid_category = 'Professional Studies',
    ceu_eligible = true,
    learning_objectives = '[
        {
            "id": "lo-1-3-1",
            "objective": "Define co-regulation and explain how nervous systems influence each other in interpreting settings",
            "rid_verb": "define",
            "measurable": true
        },
        {
            "id": "lo-1-3-2",
            "objective": "Identify common co-regulation scenarios in medical, legal, educational, and VRS interpreting",
            "rid_verb": "identify",
            "measurable": true
        },
        {
            "id": "lo-1-3-3",
            "objective": "Recognize personal patterns of emotional absorption or shutdown during high-emotion assignments",
            "rid_verb": "recognize",
            "measurable": true
        },
        {
            "id": "lo-1-3-4",
            "objective": "Apply the concept of an emotional boundary that breathes to maintain presence without absorption",
            "rid_verb": "apply",
            "measurable": true
        }
    ]'::jsonb,
    assessment_questions = '[
        {
            "id": "q1",
            "question": "What is co-regulation in the context of interpreting?",
            "options": [
                {"id": "a", "text": "A formal protocol for managing interpreter schedules"},
                {"id": "b", "text": "The automatic process by which nervous systems influence each other"},
                {"id": "c", "text": "A technique for improving ASL vocabulary"},
                {"id": "d", "text": "A method for billing interpreting services"}
            ],
            "correct_answer": "b",
            "explanation": "Co-regulation refers to how nervous systems are contagious - we automatically respond to and influence the emotional states of others around us."
        },
        {
            "id": "q2",
            "question": "According to the module, co-regulation works:",
            "options": [
                {"id": "a", "text": "Only when you consciously choose to engage"},
                {"id": "b", "text": "Only from client to interpreter"},
                {"id": "c", "text": "Both ways - you absorb and transmit emotional states"},
                {"id": "d", "text": "Only in medical interpreting settings"}
            ],
            "correct_answer": "c",
            "explanation": "Co-regulation is bidirectional - you absorb the emotional states around you AND transmit your own state to others. A regulated interpreter can help calm a room."
        },
        {
            "id": "q3",
            "question": "What is an emotional boundary that breathes?",
            "options": [
                {"id": "a", "text": "A breathing exercise done before assignments"},
                {"id": "b", "text": "Being cold and disconnected from clients"},
                {"id": "c", "text": "Being present and empathetic without absorbing emotions"},
                {"id": "d", "text": "A physical barrier between interpreter and client"}
            ],
            "correct_answer": "c",
            "explanation": "An emotional boundary that breathes means being grounded enough to witness emotion without drowning in it - present and empathetic, but not absorbing everything."
        },
        {
            "id": "q4",
            "question": "Which of the following is NOT identified as a common co-regulation scenario?",
            "options": [
                {"id": "a", "text": "Medical appointment with an anxious patient"},
                {"id": "b", "text": "Legal setting with an angry defendant"},
                {"id": "c", "text": "Routine equipment testing call"},
                {"id": "d", "text": "Mental health session with a client in crisis"}
            ],
            "correct_answer": "c",
            "explanation": "High co-regulation demands occur in emotionally charged situations like medical, legal, educational IEPs, VRS calls with grieving callers, and mental health crises - not routine technical calls."
        },
        {
            "id": "q5",
            "question": "When an interpreter notices they are absorbing a clients anxiety, they should:",
            "options": [
                {"id": "a", "text": "Immediately end the assignment"},
                {"id": "b", "text": "Try to fix the clients emotional state"},
                {"id": "c", "text": "Use grounding techniques to maintain their own regulation"},
                {"id": "d", "text": "Pretend the emotion does not exist"}
            ],
            "correct_answer": "c",
            "explanation": "Breaking the co-regulation loop requires conscious awareness and using grounding techniques. The goal is to maintain your own regulation while remaining present - not to fix, flee, or ignore."
        }
    ]'::jsonb,
    assessment_pass_threshold = 80
WHERE module_code = 'nsm-1-3';

-- ============================================================================
-- MODULE 1.4: Grounding Techniques for Interpreters
-- Duration: 5 min content + 5 min reflection + 3 min assessment = 13 min = 0.022 CEU
-- ============================================================================

UPDATE skill_modules SET
    ceu_value = 0.022,
    rid_category = 'Professional Studies',
    ceu_eligible = true,
    learning_objectives = '[
        {
            "id": "lo-1-4-1",
            "objective": "Identify five discrete grounding techniques suitable for use during interpreting assignments",
            "rid_verb": "identify",
            "measurable": true
        },
        {
            "id": "lo-1-4-2",
            "objective": "Explain why practicing regulation techniques when calm improves access during stress",
            "rid_verb": "explain",
            "measurable": true
        },
        {
            "id": "lo-1-4-3",
            "objective": "Select appropriate grounding techniques based on personal body response and work context",
            "rid_verb": "select",
            "measurable": true
        },
        {
            "id": "lo-1-4-4",
            "objective": "Apply the principle of proactive versus reactive regulation in interpreting practice",
            "rid_verb": "apply",
            "measurable": true
        }
    ]'::jsonb,
    assessment_questions = '[
        {
            "id": "q1",
            "question": "What is the key principle for building effective grounding skills?",
            "options": [
                {"id": "a", "text": "Only use techniques when you are already dysregulated"},
                {"id": "b", "text": "Practice techniques when calm so they are automatic when needed"},
                {"id": "c", "text": "Use the most complex technique available"},
                {"id": "d", "text": "Avoid using techniques during assignments"}
            ],
            "correct_answer": "b",
            "explanation": "Regulation skills are like muscle memory - they need repetition before high-stakes moments. Practicing when calm makes techniques automatic when stress occurs."
        },
        {
            "id": "q2",
            "question": "The Slow Exhale technique works by:",
            "options": [
                {"id": "a", "text": "Increasing oxygen to the brain"},
                {"id": "b", "text": "Directly activating the parasympathetic nervous system"},
                {"id": "c", "text": "Building muscle strength"},
                {"id": "d", "text": "Improving lung capacity over time"}
            ],
            "correct_answer": "b",
            "explanation": "Exhaling for longer than you inhale (like a 4-count inhale, 8-count exhale) directly activates your parasympathetic nervous system, shifting you from activation to calm."
        },
        {
            "id": "q3",
            "question": "Which grounding technique is recommended for feeling disconnected or dissociating?",
            "options": [
                {"id": "a", "text": "Peripheral Vision"},
                {"id": "b", "text": "Name Three Things"},
                {"id": "c", "text": "Thumb Press"},
                {"id": "d", "text": "Slow Exhale"}
            ],
            "correct_answer": "c",
            "explanation": "Thumb Press provides immediate sensory grounding through physical pressure, which is particularly effective when feeling disconnected, dissociating, or checked out."
        },
        {
            "id": "q4",
            "question": "The difference between proactive and reactive regulation is:",
            "options": [
                {"id": "a", "text": "Proactive costs more money than reactive"},
                {"id": "b", "text": "Reactive maintains the window; proactive responds to crisis"},
                {"id": "c", "text": "Proactive maintains the window; reactive responds only when outside it"},
                {"id": "d", "text": "There is no meaningful difference"}
            ],
            "correct_answer": "c",
            "explanation": "Proactive regulation means maintaining your window of tolerance throughout an assignment. Reactive regulation only kicks in when you are already outside your window - which is often too late."
        },
        {
            "id": "q5",
            "question": "Why is Peripheral Vision particularly useful for VRS interpreters?",
            "options": [
                {"id": "a", "text": "It improves sign language recognition"},
                {"id": "b", "text": "It shifts from stress-narrowed focus to open awareness when tunnel vision sets in"},
                {"id": "c", "text": "It reduces eye strain from screens"},
                {"id": "d", "text": "It is required by VRS company policies"}
            ],
            "correct_answer": "b",
            "explanation": "Peripheral Vision helps counter tunnel vision and hyperfocus by shifting from stress-narrowed focus to open awareness - particularly useful during long VRS sessions."
        }
    ]'::jsonb,
    assessment_pass_threshold = 80
WHERE module_code = 'nsm-1-4';

-- ============================================================================
-- MODULE 1.5: Recovery Between Assignments
-- Duration: 6 min content + 5 min reflection + 3 min assessment = 14 min = 0.023 CEU
-- ============================================================================

UPDATE skill_modules SET
    ceu_value = 0.023,
    rid_category = 'Professional Studies',
    ceu_eligible = true,
    learning_objectives = '[
        {
            "id": "lo-1-5-1",
            "objective": "Explain the recovery debt concept and its impact on interpreter burnout",
            "rid_verb": "explain",
            "measurable": true
        },
        {
            "id": "lo-1-5-2",
            "objective": "Identify activities that count as genuine nervous system recovery versus continued activation",
            "rid_verb": "identify",
            "measurable": true
        },
        {
            "id": "lo-1-5-3",
            "objective": "Apply recovery audit questions to assess personal recovery patterns",
            "rid_verb": "apply",
            "measurable": true
        },
        {
            "id": "lo-1-5-4",
            "objective": "Select one sustainable micro-recovery practice appropriate for their work context",
            "rid_verb": "select",
            "measurable": true
        }
    ]'::jsonb,
    assessment_questions = '[
        {
            "id": "q1",
            "question": "According to the recovery debt concept, your nervous system is like:",
            "options": [
                {"id": "a", "text": "A muscle that gets stronger with constant use"},
                {"id": "b", "text": "A bank account where assignments are withdrawals and recovery is deposits"},
                {"id": "c", "text": "A battery that never needs recharging"},
                {"id": "d", "text": "A computer that can be reset instantly"}
            ],
            "correct_answer": "b",
            "explanation": "The recovery debt concept compares your nervous system to a bank account - demanding assignments are withdrawals, recovery is deposits. Running a deficit too long leads to burnout."
        },
        {
            "id": "q2",
            "question": "Which of the following does NOT count as genuine nervous system recovery?",
            "options": [
                {"id": "a", "text": "Intentional breathing or body scan"},
                {"id": "b", "text": "Scrolling social media"},
                {"id": "c", "text": "Brief walk outside"},
                {"id": "d", "text": "Silence after high-language-demand work"}
            ],
            "correct_answer": "b",
            "explanation": "Scrolling social media keeps your nervous system activated rather than allowing recovery. Genuine recovery includes intentional breathing, movement, sensory reset, mental clearing, and silence."
        },
        {
            "id": "q3",
            "question": "For VRS interpreters, even how much intentional recovery between calls can make a difference?",
            "options": [
                {"id": "a", "text": "At least 15 minutes"},
                {"id": "b", "text": "60-90 seconds"},
                {"id": "c", "text": "30 minutes minimum"},
                {"id": "d", "text": "Recovery is not possible between VRS calls"}
            ],
            "correct_answer": "b",
            "explanation": "Even 60-90 seconds of intentional recovery between VRS calls can make a significant difference over a shift, despite the rapid call turnover in VRS environments."
        },
        {
            "id": "q4",
            "question": "What is the recommended approach to building recovery habits?",
            "options": [
                {"id": "a", "text": "Overhaul your entire schedule immediately"},
                {"id": "b", "text": "Wait until you feel burned out to make changes"},
                {"id": "c", "text": "Start with one small, consistent practice you can realistically add"},
                {"id": "d", "text": "Take a week off work each month"}
            ],
            "correct_answer": "c",
            "explanation": "You do not need to overhaul your entire schedule. Starting with one small, consistent recovery practice you can realistically add is more sustainable than dramatic changes."
        },
        {
            "id": "q5",
            "question": "What happens when interpreters stack assignments back-to-back without recovery?",
            "options": [
                {"id": "a", "text": "Their skills improve from constant practice"},
                {"id": "b", "text": "Each assignment starts from a more depleted baseline"},
                {"id": "c", "text": "Nothing - the nervous system does not need recovery"},
                {"id": "d", "text": "They earn more money with no downsides"}
            ],
            "correct_answer": "b",
            "explanation": "When assignments are stacked without recovery, stress accumulates and each assignment starts from a slightly more depleted baseline than the last, eventually leading to burnout."
        }
    ]'::jsonb,
    assessment_pass_threshold = 80
WHERE module_code = 'nsm-1-5';

-- ============================================================================
-- MODULE 1.6: Building Nervous System Resilience (CAPSTONE)
-- Duration: 8 min content + 5 min reflection + 3 min assessment = 16 min = 0.027 CEU
-- ============================================================================

UPDATE skill_modules SET
    ceu_value = 0.027,
    rid_category = 'Professional Studies',
    ceu_eligible = true,
    learning_objectives = '[
        {
            "id": "lo-1-6-1",
            "objective": "Explain that resilience is a developable capacity rather than a fixed trait",
            "rid_verb": "explain",
            "measurable": true
        },
        {
            "id": "lo-1-6-2",
            "objective": "Identify the three pillars of interpreter resilience: Awareness, Regulation, and Recovery",
            "rid_verb": "identify",
            "measurable": true
        },
        {
            "id": "lo-1-6-3",
            "objective": "Apply the personal resilience inventory to assess strengths and growth areas",
            "rid_verb": "apply",
            "measurable": true
        },
        {
            "id": "lo-1-6-4",
            "objective": "Select one specific 30-day focus practice based on self-assessment results",
            "rid_verb": "select",
            "measurable": true
        }
    ]'::jsonb,
    assessment_questions = '[
        {
            "id": "q1",
            "question": "According to the module, resilience is:",
            "options": [
                {"id": "a", "text": "A fixed personality trait you are born with"},
                {"id": "b", "text": "Something only certain people can develop"},
                {"id": "c", "text": "A capacity that can be developed with consistent practice"},
                {"id": "d", "text": "Unrelated to interpreting success"}
            ],
            "correct_answer": "c",
            "explanation": "Resilience is not a fixed trait - it is a capacity that can be developed with consistent practice. Your window of tolerance can expand, recovery can get faster, and awareness can become automatic."
        },
        {
            "id": "q2",
            "question": "What are the three pillars of interpreter resilience?",
            "options": [
                {"id": "a", "text": "Speed, Accuracy, and Vocabulary"},
                {"id": "b", "text": "Awareness, Regulation, and Recovery"},
                {"id": "c", "text": "Education, Certification, and Experience"},
                {"id": "d", "text": "Medical, Legal, and Educational interpreting"}
            ],
            "correct_answer": "b",
            "explanation": "The three pillars of interpreter resilience are Awareness (knowing your patterns), Regulation (having in-the-moment tools), and Recovery (building sustainable rhythms)."
        },
        {
            "id": "q3",
            "question": "The power of one principle suggests:",
            "options": [
                {"id": "a", "text": "Try to implement all new practices at once for maximum benefit"},
                {"id": "b", "text": "Choose one specific practice and commit to it for 30 days"},
                {"id": "c", "text": "Work alone without peer support"},
                {"id": "d", "text": "Focus on only one assignment type"}
            ],
            "correct_answer": "b",
            "explanation": "The power of one means consistency with one thing beats inconsistency with five. Choosing a single practice that would make the biggest difference and committing to it for 30 days is more effective."
        },
        {
            "id": "q4",
            "question": "Which statement best describes what the resilience inventory measures?",
            "options": [
                {"id": "a", "text": "Your interpreting accuracy score"},
                {"id": "b", "text": "Your strengths and growth areas across the three pillars"},
                {"id": "c", "text": "How many CEUs you have earned"},
                {"id": "d", "text": "Your years of interpreting experience"}
            ],
            "correct_answer": "b",
            "explanation": "The resilience inventory helps you rate yourself across Awareness, Regulation, and Recovery to identify which pillar feels strongest and which needs the most attention."
        },
        {
            "id": "q5",
            "question": "An example of a specific, actionable 30-day focus is:",
            "options": [
                {"id": "a", "text": "Be more resilient"},
                {"id": "b", "text": "Use grounding techniques"},
                {"id": "c", "text": "Use feet-on-floor once per assignment"},
                {"id": "d", "text": "Try to be better"}
            ],
            "correct_answer": "c",
            "explanation": "Vague goals like be more resilient or use grounding techniques are not actionable. A specific focus like use feet-on-floor once per assignment is measurable and achievable."
        }
    ]'::jsonb,
    assessment_pass_threshold = 80
WHERE module_code = 'nsm-1-6';

-- ============================================================================
-- UPDATE SERIES TOTAL CEU VALUE
-- Sum of all 6 modules: 0.025 + 0.023 + 0.027 + 0.022 + 0.023 + 0.027 = 0.147 CEU
-- ============================================================================

UPDATE skill_series SET
    total_ceu_value = 0.147
WHERE series_code = 'nsm';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM skill_modules
    WHERE module_code LIKE 'nsm-1-%'
    AND ceu_eligible = true
    AND learning_objectives IS NOT NULL
    AND assessment_questions IS NOT NULL;

    RAISE NOTICE 'CEU-eligible NSM modules with objectives and assessments: %', v_count;

    IF v_count = 6 THEN
        RAISE NOTICE 'All 6 NSM modules are now CEU-ready!';
    ELSE
        RAISE WARNING 'Expected 6 CEU-ready modules, found %', v_count;
    END IF;
END $$;
