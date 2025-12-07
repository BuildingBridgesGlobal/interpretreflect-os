-- Seed Data: Three High-Impact Interpreter Drills
-- These target the moments where interpreters actually fail in the field

-- =====================================================
-- SUBCATEGORIES
-- =====================================================

-- Get category IDs for reference
DO $$
DECLARE
  role_mgmt_id UUID;
  ethical_id UUID;
  self_reg_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO role_mgmt_id FROM drill_categories WHERE category_code = 'role_management';
  SELECT id INTO ethical_id FROM drill_categories WHERE category_code = 'ethical_judgment';
  SELECT id INTO self_reg_id FROM drill_categories WHERE category_code = 'self_regulation';

  -- Create subcategories
  INSERT INTO drill_subcategories (category_id, subcategory_code, title, description, display_order) VALUES
  (role_mgmt_id, 'rapport_vs_role', 'Rapport vs. Role', 'Managing the boundary between connection and professional role', 1),
  (ethical_id, 'impartiality', 'Impartiality', 'Maintaining neutrality under pressure from authority figures', 1),
  (self_reg_id, 'state_recognition', 'State Recognition', 'Identifying and responding to dysregulation in real-time', 1);
END $$;

-- =====================================================
-- DRILL 1: THE EMOTIONAL PULL
-- =====================================================

INSERT INTO drills (
  subcategory_id,
  drill_code,
  drill_type,
  scenario_text,
  context_details,
  question,
  correct_answer,
  options,
  explanation,
  incorrect_feedback,
  learning_points,
  related_ecci_domain,
  difficulty_level,
  estimated_seconds,
  tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'rapport_vs_role'),
  'emotional_pull_oncology',
  'scenario_decision',
  E'You\'re interpreting an oncology appointment. The doctor has just delivered a cancer diagnosis and left the room to give the patient time to process.\n\nThe Deaf patient sits in silence for a moment, then looks at you with tears streaming down their face and signs:\n\n"I don\'t have anyone. My family doesn\'t sign. You\'re the only person who really understands me. Can you just... stay? Not as an interpreter. Just as a person who gets it?"\n\nThey reach for your hand.',
  jsonb_build_object(
    'setting', 'Medical',
    'specialty', 'Oncology',
    'appointment_stage', 'Post-diagnosis',
    'emotional_intensity', 'Very High',
    'common_failure_point', 'Taking patient''s hand, becoming friend instead of professional'
  ),
  'What do you do?',
  'C',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'A',
      'text', 'Take their hand and sit with them in silence. The appointment is essentially over, and they need human connection right now more than they need an interpreter.'
    ),
    jsonb_build_object(
      'id', 'B',
      'text', 'Gently explain that you need to maintain your professional role, but offer to interpret if they''d like to call someone or ask the nurse to come back.'
    ),
    jsonb_build_object(
      'id', 'C',
      'text', 'Acknowledge their pain warmly, let them know you see them, but explain that the most helpful thing you can do is remain in your role so you can continue to be their communication bridge — then offer to interpret for support resources.'
    ),
    jsonb_build_object(
      'id', 'D',
      'text', 'Tell them you''re so sorry but you can''t do that, and immediately go find the nurse or social worker.'
    )
  ),
  E'This is the hardest kind of boundary to hold because it feels cruel. But C does something critical: it acknowledges their humanity AND yours while explaining why staying in role actually serves them better.\n\nThe key insight: You being "just a person" to them for 10 minutes doesn\'t help them. You being their communication access for the next 20 years does. Breaking role now damages the professional relationship that allows you to keep showing up for them.\n\nC also pivots to action — interpreting for support resources. You\'re not abandoning them. You\'re redirecting your helpfulness into something sustainable.',
  jsonb_build_object(
    'A', E'This is what your heart wants to do. And in the moment, it might feel like the kind thing.\n\nBut consider: You\'ve now established yourself as a friend, not a professional. What happens next appointment when they want to talk about personal things? When they text you? When they expect you to advocate for them in ways that compromise your impartiality?\n\nYou also can\'t be their support person AND their interpreter. They need both. By collapsing into one, you\'ve actually reduced their access.',
    'B', E'B maintains the boundary but misses the human moment. "I need to maintain my professional role" sounds like you\'re hiding behind policy. It\'s technically correct but emotionally tone-deaf.\n\nThe person just received a cancer diagnosis and reached out to the one person in the room who shares their language. A clinical response here damages trust.',
    'D', E'Fleeing to get the nurse might feel like problem-solving, but it\'s actually abandonment. You\'ve left them alone in their worst moment AND made them feel like their emotional response was a problem you needed to escape.'
  ),
  jsonb_build_array(
    'This drill isn''t about knowing the "right" answer. Most interpreters can identify C as correct in a classroom.',
    'It''s about building the emotional muscle memory to actually do it when someone is crying and reaching for your hand.',
    'The boundary serves the relationship: staying professional allows you to keep being their communication access long-term.',
    'CPC Connection: Tenet 3.0 — Conduct themselves in a manner appropriate to the specific interpreting situation'
  ),
  'Relationship Management',
  2, -- Difficulty: ★★☆
  90, -- Estimated 90 seconds to read and answer
  jsonb_build_array('medical', 'boundaries', 'emotional_regulation', 'role_management', 'CPC_3.0')
;

-- =====================================================
-- DRILL 2: THE AUTHORITY PRESSURE
-- =====================================================

INSERT INTO drills (
  subcategory_id,
  drill_code,
  drill_type,
  scenario_text,
  context_details,
  question,
  correct_answer,
  options,
  explanation,
  incorrect_feedback,
  learning_points,
  related_ecci_domain,
  difficulty_level,
  estimated_seconds,
  tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'impartiality'),
  'authority_pressure_deposition',
  'scenario_decision',
  E'You\'re interpreting a deposition. During a break, the attorney who hired you pulls you aside privately and says:\n\n"Hey, you\'re doing great. Quick thing — when we go back in, the witness is going to claim he didn\'t understand the contract he signed. I know you can tell when someone\'s faking comprehension issues versus when they\'re genuine. If you notice him playing dumb, just give me a subtle signal — touch your ear or something. It would really help me know when to push harder."\n\nThe attorney seems friendly and genuinely thinks this is a reasonable request. They\'ve been respectful to you all day.',
  jsonb_build_object(
    'setting', 'Legal',
    'proceeding_type', 'Deposition',
    'power_dynamic', 'Attorney hired you and has been friendly',
    'request_type', 'Nonverbal signaling about witness credibility',
    'common_failure_point', 'Agreeing because it seems minor and you want to be hired again'
  ),
  'What do you do?',
  'C',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'A',
      'text', 'Agree to the signal. You''re not changing the interpretation itself, and noticing comprehension is part of what you do anyway. It''s a minor thing that helps the process.'
    ),
    jsonb_build_object(
      'id', 'B',
      'text', 'Say "I''m not comfortable with that" and leave it there, hoping they drop it.'
    ),
    jsonb_build_object(
      'id', 'C',
      'text', 'Explain that your role requires impartiality, and assessing the witness''s credibility — even through nonverbal signals — would compromise your neutrality and potentially the admissibility of the proceeding.'
    ),
    jsonb_build_object(
      'id', 'D',
      'text', 'Refuse and inform them you''ll need to disclose this conversation to opposing counsel.'
    )
  ),
  E'C does three things: refuses clearly, explains why in professional terms, and frames it around consequences that matter to the attorney (compromising the proceeding).\n\nNotice what C doesn\'t do: it doesn\'t moralize, lecture, or make the attorney feel stupid. They probably genuinely didn\'t realize this was a problem. Attorneys aren\'t trained on interpreter ethics.\n\nBy connecting your refusal to something they care about — case integrity — you\'ve turned a "no" into information that helps them.',
  jsonb_build_object(
    'A', E'"You\'re not changing the interpretation itself" is technically true and completely wrong.\n\nInterpreters who think they can separate "just noticing things" from "being impartial" don\'t understand impartiality. The moment you agree to signal one party about your assessment of the other, you\'ve become an agent of one side. Your credibility — and the Deaf person\'s access to fair proceedings — is compromised.\n\nAlso: if this ever came out, your career in legal interpreting is over.',
    'B', E'"I\'m not comfortable with that" is a boundary, but it\'s a weak one. It frames your refusal as a personal preference rather than a professional requirement.\n\nThis invites negotiation: "What would make you comfortable?" It also doesn\'t educate the attorney, who will probably ask the next interpreter the same thing.',
    'D', E'Disclosing to opposing counsel might be appropriate if the attorney persists after your refusal, or if the request was egregious. But as a first response to what was likely an ignorant (not malicious) request, it\'s escalation that damages the working relationship and might not be necessary.\n\nSave this option for if they push back after C.'
  ),
  jsonb_build_array(
    'The hardest part isn''t knowing what''s right — it''s that the attorney has been nice to you and you want them to hire you again.',
    'This drill builds the skill of polite, professional noncompliance — holding your ground without making enemies.',
    'Power dynamics compromise more interpreters than ethics gaps.',
    'CPC Connection: Tenet 4.0 — Demonstrate respect for consumers and colleagues; Tenet 2.0 — Professionalism, impartiality'
  ),
  'Decision Making',
  3, -- Difficulty: ★★★
  90, -- Estimated 90 seconds to read and answer
  jsonb_build_array('legal', 'impartiality', 'authority_pressure', 'professional_boundaries', 'CPC_2.0', 'CPC_4.0')
;

-- =====================================================
-- DRILL 3: THE SLOW SLIDE (TWO-PART DRILL)
-- =====================================================

INSERT INTO drills (
  subcategory_id,
  drill_code,
  drill_type,
  scenario_text,
  context_details,
  question,
  correct_answer,
  options,
  explanation,
  incorrect_feedback,
  learning_points,
  related_ecci_domain,
  difficulty_level,
  estimated_seconds,
  tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'state_recognition'),
  'slow_slide_therapy_pt1',
  'scenario_decision',
  E'You\'re interpreting a therapy session. The Deaf client is processing childhood trauma involving their Deaf family member who was also abusive. You are also a CODA.\n\nForty-five minutes into the session, you notice:\n• You interpreted something and can\'t remember what you just said\n• Your shoulders are up near your ears\n• The therapist asked a question and you had to ask for a repeat — you weren\'t tracking\n• You feel a strong pull to make the client feel better somehow\n• A thought keeps intruding: "This is just like what happened to..."\n\nThe session has 15 minutes left. You have another appointment immediately after.',
  jsonb_build_object(
    'setting', 'Mental Health',
    'session_type', 'Trauma therapy',
    'personal_trigger', 'CODA interpreting Deaf family trauma',
    'time_remaining', '15 minutes',
    'next_commitment', 'Immediate appointment after',
    'NSM_connection', 'NSM-1.2 (Window of Tolerance), NSM-1.3 (Co-Regulation)',
    'common_failure_point', 'Pushing through without recognizing dysregulation'
  ),
  'Part 1: Where are you in your window of tolerance?',
  'edge',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'hyper',
      'text', 'Above window (hyperarousal) — Racing, anxious, too activated'
    ),
    jsonb_build_object(
      'id', 'edge',
      'text', 'At the edge of window — Stressed but still functional, warning signs present'
    ),
    jsonb_build_object(
      'id', 'hypo',
      'text', 'Below window (hypoarousal) — Foggy, dissociating, checked out'
    )
  ),
  E'Let\'s look at your signals:\n• Interpreted something and can\'t remember — This is dissociative, suggests leaving window\n• Shoulders up near ears — Physical stress response, sympathetic activation\n• Had to ask for repeat — Processing capacity reduced\n• Strong pull to "help" the client — Co-regulation pressure, losing professional distance\n• "This is just like what happened to..." — Personal material activated, countertransference\n\nYou\'re not fully dissociated (you\'re still tracking enough to notice these signs). You\'re not in full hyperarousal (not racing or panicking). But you\'re at the edge, sliding toward hypoarousal, with personal content intruding.\n\nThis is the critical moment — still functional enough to act, but deteriorating.',
  jsonb_build_object(
    'hyper', 'You have some activation (shoulders up, stress response), but the primary indicators point to dissociation and reduced processing — which are hypoarousal signs. You''re sliding down, not up.',
    'hypo', 'You''re heading this direction, but you''re not fully there yet. You can still notice these signs, which means you haven''t fully left your window. You''re at the edge, which is why you can still intervene.'
  ),
  jsonb_build_array(
    'Window of tolerance isn''t binary — there''s a critical zone at the edge where you can still act.',
    'Multiple body signals together (memory gaps + physical tension + processing issues + countertransference) indicate dysregulation.',
    'The ability to notice you''re dysregulated means you haven''t fully left the window yet.',
    'This is your intervention window — still functional enough to make a choice.'
  ),
  'Self-Awareness',
  2, -- Difficulty: ★★☆
  120, -- Estimated 2 minutes to read scenario and assess
  jsonb_build_array('mental_health', 'window_of_tolerance', 'self_regulation', 'trauma', 'NSM_1.2', 'NSM_1.3', 'CPC_2.5')
;

-- Part 2 of the slow slide drill
INSERT INTO drills (
  subcategory_id,
  drill_code,
  drill_type,
  scenario_text,
  context_details,
  question,
  correct_answer,
  options,
  explanation,
  incorrect_feedback,
  learning_points,
  related_ecci_domain,
  difficulty_level,
  estimated_seconds,
  tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'state_recognition'),
  'slow_slide_therapy_pt2',
  'scenario_decision',
  E'[Continuing from Part 1]\n\nYou\'ve recognized you\'re at the edge of your window of tolerance. You\'re still functional but deteriorating, with 15 minutes left in the session and another appointment immediately after.\n\nYour warning signs:\n• Memory gaps in what you just interpreted\n• Physical stress response (shoulders up)\n• Reduced processing capacity (had to ask for repeat)\n• Pull to "help" rather than interpret\n• Personal material intruding',
  jsonb_build_object(
    'setting', 'Mental Health',
    'session_type', 'Trauma therapy',
    'regulation_state', 'At edge of window, sliding toward hypoarousal',
    'time_remaining', '15 minutes',
    'next_commitment', 'Immediate appointment after',
    'critical_choice', 'Intervene now or push through'
  ),
  'Part 2: What should you do?',
  'C',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'A',
      'text', 'Use a grounding technique (feet on floor, slow breath) and push through the last 15 minutes. You can process afterward.'
    ),
    jsonb_build_object(
      'id', 'B',
      'text', 'Let it continue but plan to decline the next appointment and take recovery time.'
    ),
    jsonb_build_object(
      'id', 'C',
      'text', 'Briefly pause, tell the therapist you need a moment, use grounding, then continue if you''ve stabilized.'
    ),
    jsonb_build_object(
      'id', 'D',
      'text', 'Interrupt to tell the therapist you need to step out, and let them decide how to proceed with the client.'
    )
  ),
  E'C recognizes that you\'re compromised but not incapacitated. It creates a small intervention (pause, ground) that might be enough to finish the session with integrity.\n\nTelling the therapist "I need a moment" is professional, not dramatic. Therapists understand regulation. They\'d rather you take 60 seconds than deliver compromised interpretation of trauma content.\n\nThe key: C includes reassessment. Ground, then evaluate. If you\'ve stabilized, continue. If not, you may need to escalate to D.\n\nIf C doesn\'t work — if you ground and realize you\'re still not okay — D is the responsible choice. Yes, it\'s disruptive. Yes, the client might feel abandoned. But a dysregulated interpreter in a trauma therapy session is worse. D is not failure. D is professional self-awareness.',
  jsonb_build_object(
    'A', E'"Push through" is the default interpreter response. It\'s also how interpreters end up crying in their cars afterward, or slowly burning out over years.\n\nFifteen minutes of compromised interpretation in a trauma therapy session can do real harm. You might miss nuance. You might unconsciously soften content. You might project your own material into word choices.\n\nAlso: your body is telling you something. Overriding it repeatedly teaches your nervous system that its signals will be ignored, making future regulation harder.',
    'B', E'Planning to recover later doesn\'t address the problem now. You\'ve identified that you\'re compromised but chosen to deliver compromised service anyway.\n\nThe next appointment is a separate issue. Right now, you\'re not fully present for THIS client.',
    'D', 'D might be necessary if C doesn''t work. But as a first step, it may be premature. Try the brief pause and grounding first — if that doesn''t stabilize you, then D becomes the right choice.'
  ),
  jsonb_build_array(
    'Most interpreter training treats regulation as "nice to have" wellness content. But regulation IS competence.',
    'An interpreter outside their window isn''t doing their job — they''re performing a simulation of their job while their processing capacity is diminished.',
    'The hardest skill: catching yourself early, when you can still do something about it.',
    'Pausing mid-session to regulate isn''t unprofessional — delivering compromised interpretation is.',
    'CPC Connection: Tenet 2.5 — Possess the professional skills and knowledge required for the specific situation'
  ),
  'Self-Management',
  2, -- Difficulty: ★★☆
  90, -- Estimated 90 seconds for part 2
  jsonb_build_array('mental_health', 'self_regulation', 'mid_session_intervention', 'grounding', 'professional_awareness', 'NSM_1.2', 'NSM_1.3', 'CPC_2.5')
;

-- =====================================================
-- LINK DRILL 3 TO NSM MODULE (if it exists)
-- =====================================================

-- This will link the slow slide drills to the NSM window of tolerance module when it exists
-- UPDATE drills
-- SET related_module_id = (SELECT id FROM skill_modules WHERE module_code = 'NSM-1.2')
-- WHERE drill_code IN ('slow_slide_therapy_pt1', 'slow_slide_therapy_pt2');
