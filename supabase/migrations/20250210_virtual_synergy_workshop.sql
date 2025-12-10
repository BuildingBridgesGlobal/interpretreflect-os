-- ============================================================================
-- Virtual Synergy: Mastering Teamwork in Digital Interpreting
-- RID Activity Code: 2309061302 (WRKSP113640TSIN)
-- Approved: June 13, 2025 - Valid for 1 year
-- CEU Value: 0.10 (1 hour = 0.1 CEU)
-- Category: Professional Studies (PS)
-- ============================================================================
-- PREREQUISITE: Run 20250210_workshop_management.sql FIRST to add required columns
-- ============================================================================

-- Insert the workshop into skill_modules
INSERT INTO skill_modules (
  module_code,
  ecci_domain,
  title,
  subtitle,
  description,
  duration_minutes,
  ceu_value,
  rid_category,
  ceu_eligible,
  is_active,
  video_url,
  instructor_name,
  instructor_credentials,
  workshop_type,
  presentation_language,
  assessment_pass_threshold,
  learning_objectives,
  assessment_questions,
  rid_activity_code,
  checklist_ceu_request_form,
  checklist_recording_uploaded,
  publish_status,
  published_at
) VALUES (
  'CEU-2025-VS001',
  'Relationship Management',
  'Virtual Synergy: Mastering Teamwork in Digital Interpreting',
  'Mastering virtual team dynamics for remote interpreting success',
  'As interpreting increasingly occurs in digital spaces, understanding the unique dynamics of virtual teamwork is crucial. This focused 1-hour session synthesizes our series'' exploration of emotional intelligence, communication, conflict, and support, applying these principles to the distinct challenges and opportunities of remote collaboration. We will explore the core concepts needed to maintain connection, communicate clearly, navigate conflict, provide support, and optimize team synergy online.',
  60,
  0.10,
  'Professional Studies',
  true,
  true,
  'https://player.vimeo.com/video/1093410263',
  'Sarah Wheeler',
  'M.Ed., M.S.',
  'on_demand',
  'ASL w/ English Captions',
  80,
  -- Learning Objectives (JSONB array)
  '[
    {"id": 1, "objective": "Identify the unique communication, relational, and logistical challenges posed by virtual interpreting environments."},
    {"id": 2, "objective": "Understand key strategies for building trust, managing virtual communication nuances, addressing remote conflict, and fostering support online."},
    {"id": 3, "objective": "Identify specific considerations for effective virtual collaboration, including generational perspectives and DI/HI teaming."}
  ]'::jsonb,
  -- Assessment Questions (JSONB array)
  '[
    {
      "id": 1,
      "question": "Based on what you learned in the workshop, which of the following changes represents the BIGGEST shift when moving from in-person to virtual interpreting?",
      "options": [
        {"letter": "A", "text": "Sensory input becomes more rich and multi-dimensional"},
        {"letter": "B", "text": "Cognitive load decreases because of automatic processing"},
        {"letter": "C", "text": "Emotional cues become reduced or absent"},
        {"letter": "D", "text": "Professional isolation risk stays about the same"}
      ],
      "correct_answer": "C",
      "feedback": "Exactly! When we move online, emotional cues become reduced or absent, which is one of the most significant changes. This means we have to work harder to read the emotional landscape and stay connected."
    },
    {
      "id": 2,
      "question": "You''re 45 minutes into a 2-hour virtual assignment and you notice you''re much more exhausted than you''d typically be at this point in an in-person assignment. According to the workshop, what''s the PRIMARY reason for this?",
      "options": [
        {"letter": "A", "text": "The technology is unreliable and keeps freezing"},
        {"letter": "B", "text": "Virtual interpreting requires higher cognitive load because automatic processes become effortful"},
        {"letter": "C", "text": "You''re sitting in an uncomfortable chair"},
        {"letter": "D", "text": "Virtual assignments are always longer than in-person ones"}
      ],
      "correct_answer": "B",
      "feedback": "That''s right! Virtual interpreting requires higher cognitive load because things that happen automatically in person (reading body language, processing multiple sensory inputs) now require conscious effort. This is why self-care and breaks are even more critical in virtual work."
    },
    {
      "id": 3,
      "question": "The workshop discussed how body posture and breathwork can shift mental states. In a practical sense, how might you apply this knowledge RIGHT before starting a challenging virtual interpretation?",
      "options": [
        {"letter": "A", "text": "Ignore your body and focus only on your screen setup"},
        {"letter": "B", "text": "Take a moment to ground yourself with intentional breathing and posture adjustment"},
        {"letter": "C", "text": "Stand up throughout the entire interpretation to maximize alertness"},
        {"letter": "D", "text": "Only focus on technical setup and equipment checks"}
      ],
      "correct_answer": "B",
      "feedback": "Beautiful! Taking even 30 seconds to ground yourself with intentional breathing and checking your posture can shift your mental state and prepare you for the cognitive demands ahead. This is embodied cognition in action - your body state influences your cognitive state."
    },
    {
      "id": 4,
      "question": "According to the research shared in the workshop, what happens when interpreters practice mirroring body language with their team partner?",
      "options": [
        {"letter": "A", "text": "It creates confusion and miscommunication"},
        {"letter": "B", "text": "It increases trust and rapport"},
        {"letter": "C", "text": "It has no measurable effect on the working relationship"},
        {"letter": "D", "text": "It only works in person, not virtually"}
      ],
      "correct_answer": "B",
      "feedback": "Yes! Mirroring body language increases trust and builds rapport, even in virtual settings. This is why being intentional about your presence and paying attention to your team partner''s non-verbal cues matters so much."
    },
    {
      "id": 5,
      "question": "You''re in a virtual team interpretation and you''ve noticed that you and your partner keep accidentally talking over each other during transitions. Based on the workshop''s guidance, what''s the MOST effective solution?",
      "options": [
        {"letter": "A", "text": "Just keep doing what you''re doing - it will eventually work itself out"},
        {"letter": "B", "text": "Implement explicit cues like chat messages or hand signals for turn-taking"},
        {"letter": "C", "text": "Avoid switching at all during the assignment"},
        {"letter": "D", "text": "Turn off your camera so you don''t distract each other"}
      ],
      "correct_answer": "B",
      "feedback": "Exactly right! Explicit cues like chat messages or hand signals reduce interruptions and boost team satisfaction. In virtual settings, we can''t rely on the subtle cues we''d use in person, so being more deliberate about turn-taking protocols really helps."
    },
    {
      "id": 6,
      "question": "The workshop explained that emotional dissonance risk is HIGHER in virtual settings compared to in-person. What does this mean for you as a virtual interpreter?",
      "options": [
        {"letter": "A", "text": "You''ll always feel perfectly aligned with the emotions in the assignment"},
        {"letter": "B", "text": "You need to be more aware of the gap between what you''re feeling and what you''re expressing/experiencing"},
        {"letter": "C", "text": "Emotional dissonance doesn''t affect interpreters, only other professionals"},
        {"letter": "D", "text": "Virtual work eliminates all emotional challenges"}
      ],
      "correct_answer": "B",
      "feedback": "Yes - and this is so important for your wellbeing! Emotional dissonance is that gap between what you''re genuinely feeling and what you''re projecting or processing. In virtual settings, this gap can widen because we''re already working harder cognitively and getting less natural emotional feedback."
    },
    {
      "id": 7,
      "question": "The workshop highlighted that psychological safety leads to more innovation and better performance. As a team interpreter in a virtual setting, which behavior BEST demonstrates creating psychological safety with your partner?",
      "options": [
        {"letter": "A", "text": "Only pointing out their mistakes after the assignment ends"},
        {"letter": "B", "text": "Fostering open, nonjudgmental dialogue about the work and supporting each other''s needs"},
        {"letter": "C", "text": "Never discussing anything difficult or uncomfortable"},
        {"letter": "D", "text": "Competing to see who can interpret longer without a break"}
      ],
      "correct_answer": "B",
      "feedback": "Beautiful! Psychological safety means creating space where both team members can be honest, vulnerable, and supportive without fear of judgment. This is especially crucial in virtual work where we can''t read each other as easily."
    },
    {
      "id": 8,
      "question": "You notice your team partner''s energy seems really low during a virtual assignment - their voice sounds flat and they seem to be struggling more than usual. According to the workshop''s guidance on virtual synergy, what''s the BEST immediate response?",
      "options": [
        {"letter": "A", "text": "Ignore it and focus on your own work"},
        {"letter": "B", "text": "Call them out publicly in the chat"},
        {"letter": "C", "text": "Offer to take a longer turn or check in supportively (via chat or after) to see if they need anything"},
        {"letter": "D", "text": "Report them to the agency immediately"}
      ],
      "correct_answer": "C",
      "feedback": "Yes! Recognizing when team members need support and responding with compassion is the heart of virtual synergy. A quick supportive message or offering to take a longer turn can make all the difference. We''re in this together, even when we''re miles apart."
    }
  ]'::jsonb,
  '2309061302',
  true,
  true,
  'published',
  NOW()
)
ON CONFLICT (module_code) DO UPDATE SET
  ecci_domain = EXCLUDED.ecci_domain,
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  ceu_value = EXCLUDED.ceu_value,
  rid_category = EXCLUDED.rid_category,
  ceu_eligible = EXCLUDED.ceu_eligible,
  is_active = EXCLUDED.is_active,
  video_url = EXCLUDED.video_url,
  instructor_name = EXCLUDED.instructor_name,
  instructor_credentials = EXCLUDED.instructor_credentials,
  workshop_type = EXCLUDED.workshop_type,
  presentation_language = EXCLUDED.presentation_language,
  learning_objectives = EXCLUDED.learning_objectives,
  assessment_questions = EXCLUDED.assessment_questions,
  rid_activity_code = EXCLUDED.rid_activity_code,
  assessment_pass_threshold = EXCLUDED.assessment_pass_threshold,
  checklist_ceu_request_form = EXCLUDED.checklist_ceu_request_form,
  checklist_recording_uploaded = EXCLUDED.checklist_recording_uploaded,
  publish_status = EXCLUDED.publish_status,
  updated_at = NOW();
