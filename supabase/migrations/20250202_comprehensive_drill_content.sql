-- ============================================================================
-- COMPREHENSIVE DRILL CONTENT
-- 20+ High-Quality Interpreter Training Scenarios
-- Covering all 6 categories with real-world situations
-- ============================================================================

-- =====================================================
-- ADDITIONAL SUBCATEGORIES
-- =====================================================

DO $$
DECLARE
  role_mgmt_id UUID;
  ethical_id UUID;
  self_reg_id UUID;
  situational_id UUID;
  intervention_id UUID;
  terminology_id UUID;
BEGIN
  -- Get category IDs
  SELECT id INTO role_mgmt_id FROM drill_categories WHERE category_code = 'role_management';
  SELECT id INTO ethical_id FROM drill_categories WHERE category_code = 'ethical_judgment';
  SELECT id INTO self_reg_id FROM drill_categories WHERE category_code = 'self_regulation';
  SELECT id INTO situational_id FROM drill_categories WHERE category_code = 'situational_judgment';
  SELECT id INTO intervention_id FROM drill_categories WHERE category_code = 'intervention_decisions';
  SELECT id INTO terminology_id FROM drill_categories WHERE category_code = 'terminology';

  -- Create additional subcategories (only if they don't exist)
  INSERT INTO drill_subcategories (category_id, subcategory_code, title, description, display_order) VALUES
  -- Role Management
  (role_mgmt_id, 'advocacy_boundaries', 'Advocacy Boundaries', 'Knowing when advocacy crosses into overstepping', 2),
  (role_mgmt_id, 'small_talk_navigation', 'Small Talk Navigation', 'Managing pre/post session conversations appropriately', 3),
  -- Ethical Judgment
  (ethical_id, 'confidentiality', 'Confidentiality', 'Protecting information across all contexts', 2),
  (ethical_id, 'conflicts_of_interest', 'Conflicts of Interest', 'Recognizing and managing competing interests', 3),
  -- Self-Regulation
  (self_reg_id, 'vicarious_trauma', 'Vicarious Trauma', 'Recognizing and managing secondary trauma exposure', 2),
  (self_reg_id, 'performance_anxiety', 'Performance Anxiety', 'Managing nerves in high-stakes situations', 3),
  -- Situational Judgment
  (situational_id, 'environment_assessment', 'Environment Assessment', 'Reading the room and adapting approach', 1),
  (situational_id, 'conflict_de_escalation', 'Conflict De-escalation', 'Managing tense situations professionally', 2),
  -- Intervention Decisions
  (intervention_id, 'clarification_requests', 'Clarification Requests', 'When and how to request clarification', 1),
  (intervention_id, 'cultural_mediation', 'Cultural Mediation', 'Bridging cultural gaps appropriately', 2),
  -- Terminology
  (terminology_id, 'medical_terminology', 'Medical Terminology', 'Healthcare-specific language decisions', 1),
  (terminology_id, 'legal_terminology', 'Legal Terminology', 'Legal-specific language decisions', 2)
  ON CONFLICT (subcategory_code) DO NOTHING;
END $$;

-- =====================================================
-- ETHICAL JUDGMENT DRILLS
-- =====================================================

-- Drill: The Coffee Shop Encounter
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'confidentiality'),
  'coffee_shop_encounter',
  'scenario_decision',
  E'You''re at a coffee shop on Saturday morning. Someone taps your shoulder — it''s a coworker from your day job (not interpreting).\n\n"Hey! I saw you at the hospital last week! You were with that Deaf woman in oncology, right? Is she a friend of yours? My aunt works in that department and mentioned there was an interpreter there."\n\nYour coworker seems genuinely curious and friendly. You did interpret for a Deaf patient in oncology last week.',
  jsonb_build_object(
    'setting', 'Social/Public',
    'relationship', 'Day job coworker',
    'location_of_assignment', 'Hospital oncology',
    'common_failure_point', 'Confirming details to seem friendly or avoid awkwardness'
  ),
  'How do you respond?',
  'B',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Say "Oh yes, I do interpreting work on the side! I can''t really talk about the people I work with though — privacy stuff, you know?"'),
    jsonb_build_object('id', 'B', 'text', 'Say "I do freelance interpreting sometimes, but I can''t confirm or deny being anywhere specific or working with anyone. It''s a confidentiality thing — like a doctor can''t talk about patients."'),
    jsonb_build_object('id', 'C', 'text', 'Say "You must have me confused with someone else" to protect the client''s privacy.'),
    jsonb_build_object('id', 'D', 'text', 'Change the subject without addressing the question directly.')
  ),
  E'B does several things right:\n\n1. It neither confirms nor denies — not even the location or that you were there\n2. It educates with an analogy they''ll understand (doctor-patient confidentiality)\n3. It''s friendly but firm, not evasive or awkward\n\nThe critical insight: confidentiality means you can''t even confirm that someone IS a client. The coworker already has information (saw you, aunt mentioned interpreter). Your job is to not add to it.',
  jsonb_build_object(
    'A', 'A confirms you were there and that you were with "someone." It also implies the person was Deaf (by confirming interpreting). You''ve just added information to what they already know.',
    'C', 'Lying creates its own problems. If they later confirm you were there, you''ve damaged trust AND look like you''re hiding something. You don''t need to lie — you need to not confirm.',
    'D', 'Avoiding the question entirely seems evasive and doesn''t educate. They''ll probably ask again or tell others you were "weird about it."'
  ),
  jsonb_build_array(
    'Confidentiality includes not confirming someone is a client',
    'Social situations are the most common confidentiality breach points',
    'Education with analogies helps others understand without seeming paranoid',
    'CPC Tenet 1.0 — Confidentiality'
  ),
  'Self-Management',
  2,
  75,
  jsonb_build_array('confidentiality', 'social_situations', 'CPC_1.0', 'everyday_ethics');

-- Drill: The Familiar Face
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'conflicts_of_interest'),
  'familiar_face_er',
  'scenario_decision',
  E'You arrive at the ER for an interpreting assignment. When you enter the room, you recognize the Deaf patient — it''s your neighbor''s adult child. You''ve waved to them a few times and had one brief conversation at a neighborhood BBQ.\n\nThey recognize you too and sign: "Oh! You''re the interpreter? That''s great, I feel more comfortable with someone I kind of know."\n\nThe assignment is for treatment of a sensitive condition.',
  jsonb_build_object(
    'setting', 'Medical - ER',
    'relationship', 'Acquaintance (neighbor''s child)',
    'familiarity_level', 'Minimal - waved, one brief conversation',
    'assignment_type', 'Sensitive medical condition',
    'common_failure_point', 'Staying because the client expressed preference'
  ),
  'What should you do?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Stay and interpret since they expressed comfort with you and the relationship is minimal.'),
    jsonb_build_object('id', 'B', 'text', 'Immediately recuse yourself and leave to find another interpreter.'),
    jsonb_build_object('id', 'C', 'text', 'Acknowledge the connection, explain the potential conflict, give them the choice of whether you stay or request another interpreter.'),
    jsonb_build_object('id', 'D', 'text', 'Stay but ask them to pretend they don''t know you to maintain professionalism.')
  ),
  E'C balances transparency with client autonomy.\n\nThe relationship IS minimal — you''re not close friends or family. But you will see this person again in your neighborhood. They''re dealing with a sensitive condition. You need to disclose and let THEM decide.\n\nKey points:\n• Explain what the conflict is (you''ll see each other again, might feel awkward)\n• Explain they have the right to a different interpreter\n• Accept their decision either way\n\nIf they choose you after disclosure, document it. Their informed consent matters.',
  jsonb_build_object(
    'A', 'Their comfort isn''t the only factor. Will YOU be able to maintain professional boundaries? Will running into them later be awkward? Will knowing personal medical information change the neighbor relationship? The client can''t assess all these factors — you need to disclose.',
    'B', 'Immediate recusal might be appropriate for closer relationships, but for a minimal acquaintance, it removes client choice. They might genuinely prefer you and be capable of handling the dual relationship.',
    'D', 'Pretending you don''t know each other doesn''t eliminate the conflict — it just makes everyone act weird.'
  ),
  jsonb_build_array(
    'Conflicts of interest exist on a spectrum — not all require recusal',
    'Disclosure + client choice is often the appropriate middle path',
    'Consider both directions: can YOU maintain boundaries? Will THEY feel comfortable later?',
    'CPC Tenet 2.0 — Professionalism'
  ),
  'Decision Making',
  3,
  90,
  jsonb_build_array('conflict_of_interest', 'medical', 'disclosure', 'client_autonomy', 'CPC_2.0');

-- =====================================================
-- ROLE MANAGEMENT DRILLS
-- =====================================================

-- Drill: The Advocate Trap
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'advocacy_boundaries'),
  'advocate_trap_iep',
  'scenario_decision',
  E'You''re interpreting an IEP meeting for Deaf parents. The school is recommending their Deaf child be mainstreamed without an interpreter, using an FM system and note-taker instead.\n\nYou know from professional experience that this rarely works well for Deaf students. The parents seem confused and are nodding along with the school''s recommendation.\n\nDuring a pause, the father signs to you privately: "Is this good? Should we agree?"\n\nThe school team is waiting.',
  jsonb_build_object(
    'setting', 'Educational - IEP Meeting',
    'participants', 'Deaf parents, school team',
    'decision_at_stake', 'Child''s educational access',
    'your_knowledge', 'Professional experience says this usually fails',
    'common_failure_point', 'Giving advice because you know better'
  ),
  'How do you respond to the father?',
  'B',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Sign privately: "In my experience, this usually doesn''t work well for Deaf students. You should ask more questions."'),
    jsonb_build_object('id', 'B', 'text', 'Voice to the room: "The father is asking me for my opinion. I''ll let him know I can''t advise, but perhaps he has questions for the team?"'),
    jsonb_build_object('id', 'C', 'text', 'Sign privately: "I can''t give advice. But you have the right to ask for more information or time to think about it."'),
    jsonb_build_object('id', 'D', 'text', 'Ignore the private question and wait for the meeting to continue.')
  ),
  E'B is the strongest choice because it:\n\n1. Makes the private question public (transparency)\n2. Declines the advisory role clearly\n3. Creates space for the parents to ask their OWN questions\n4. Keeps you in your lane while still serving access\n\nThe key insight: Your job isn''t to protect Deaf children from bad educational decisions. Your job is to ensure Deaf parents have EQUAL ACCESS to the decision-making process.\n\nIf they have full access and still make a choice you disagree with, that''s their right.',
  jsonb_build_object(
    'A', 'This is advocacy disguised as information. You''re using your platform as interpreter to influence a decision you have no role in. Even if you''re right, you''ve crossed from facilitator to participant.',
    'C', 'C is technically correct but keeps the exchange private. The school team doesn''t know the father is uncertain. Making it public creates space for him to ask questions without you advising.',
    'D', 'Ignoring the question leaves the father without support. He asked you because he doesn''t know what to do. You can''t advise, but you can redirect to the people who can answer.'
  ),
  jsonb_build_array(
    'Equal access means equal opportunity to make decisions — including bad ones',
    'Private side conversations often signal the client needs something — redirect appropriately',
    'Transparency about role boundaries helps everyone',
    'Your professional knowledge doesn''t give you decision-making authority'
  ),
  'Decision Making',
  4,
  100,
  jsonb_build_array('educational', 'advocacy', 'role_boundaries', 'IEP', 'CPC_3.0');

-- Drill: Pre-Appointment Chat
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'small_talk_navigation'),
  'waiting_room_chat',
  'scenario_decision',
  E'You arrive 10 minutes early for a medical appointment. The Deaf patient is already in the waiting room. After introductions, they start chatting:\n\n"So do you have kids? I have three grandkids. My daughter — the one who''s coming to this appointment — she doesn''t sign. It''s been hard. She was supposed to learn but never did. I haven''t talked to her much in years, but now I need surgery and she''s the only one who can help with recovery..."\n\nThey continue sharing family dynamics. The appointment hasn''t started yet.',
  jsonb_build_object(
    'setting', 'Medical - Pre-appointment',
    'situation', 'Waiting room conversation',
    'content', 'Personal family information',
    'time_until_appointment', '10 minutes',
    'common_failure_point', 'Engaging fully in personal conversation'
  ),
  'How do you handle this?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Engage warmly in the conversation — it''s just small talk and helps build rapport before the appointment.'),
    jsonb_build_object('id', 'B', 'text', 'Politely cut them off: "I appreciate you sharing, but I should stay neutral. Let''s wait for the appointment to start."'),
    jsonb_build_object('id', 'C', 'text', 'Listen with friendly acknowledgment but keep responses brief. When they pause, gently redirect: "It sounds like a lot is happening. Will any of this come up in today''s appointment?"'),
    jsonb_build_object('id', 'D', 'text', 'Excuse yourself to wait outside or in a different area until the appointment starts.')
  ),
  E'C threads the needle between coldness and overinvolvement.\n\nKey insight: Pre-appointment chat often contains information that WILL come up in the appointment. The daughter not signing, family tension, recovery needs — this context helps you interpret better.\n\nBut there''s a difference between receiving information and becoming a confidant. C acknowledges warmly, doesn''t overshare about yourself, and redirects to the professional context.\n\nThe question "Will any of this come up today?" also primes them to bring up important context WITH the provider, not just with you.',
  jsonb_build_object(
    'A', 'Engaging fully in personal conversation creates a relationship dynamic that''s hard to shift when the appointment starts. You''ve become a friend, not a professional. They may also share things they don''t want the provider to know.',
    'B', 'This is cold and othering. The Deaf person was just being human. Responding with "I need to stay neutral" to someone sharing about their family makes them feel like a case file, not a person.',
    'D', 'Leaving feels like rejection. You''re also missing context that could help you interpret better. Strategic warmth is possible.'
  ),
  jsonb_build_array(
    'Pre-appointment time is part of the professional encounter',
    'You can be warm without becoming a confidant',
    'Context shared before appointments often matters during appointments',
    'Redirect to professional frame without being cold'
  ),
  'Relationship Management',
  2,
  75,
  jsonb_build_array('role_management', 'boundaries', 'small_talk', 'medical', 'rapport');

-- =====================================================
-- SITUATIONAL JUDGMENT DRILLS
-- =====================================================

-- Drill: The Hostile Room
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'environment_assessment'),
  'hostile_room_custody',
  'scenario_decision',
  E'You arrive for a custody mediation. The room is tense — the Deaf parent and hearing parent are seated on opposite sides with their attorneys. When you introduce yourself, the hearing parent''s attorney says:\n\n"Great, the interpreter. Just so you know, we''ll be presenting evidence that my client has been the primary caregiver. The Deaf parent works remotely and claims to be ''available'' but our position is that''s not the same as actual caregiving."\n\nThe Deaf parent is watching you, trying to follow what''s being said. The hearing parent smirks.',
  jsonb_build_object(
    'setting', 'Legal - Custody Mediation',
    'atmosphere', 'Hostile, tense',
    'pre_meeting_comment', 'Attorney shared case strategy with interpreter',
    'power_dynamic', 'Deaf parent isolated, hearing parent has visible support',
    'common_failure_point', 'Not interpreting the pre-meeting comment'
  ),
  'What''s your first action?',
  'B',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Nod professionally and wait for the mediation to officially begin.'),
    jsonb_build_object('id', 'B', 'text', 'Interpret everything the attorney just said to the Deaf parent, then establish that everything spoken will be interpreted.'),
    jsonb_build_object('id', 'C', 'text', 'Tell the attorney: "I''m neutral and can''t hear case arguments before mediation begins. Please save that for the session."'),
    jsonb_build_object('id', 'D', 'text', 'Ask to speak with the mediator privately about the hostile atmosphere.')
  ),
  E'B immediately levels the playing field.\n\nWhat just happened: The hearing side used your arrival to make statements the Deaf parent couldn''t access. Whether intentional or not, it created information asymmetry.\n\nBy interpreting it, you:\n1. Give the Deaf parent the same information the room has\n2. Signal that everything will be interpreted (no side conversations)\n3. Don''t lecture the attorney (they may not have realized)\n4. Establish your role through action, not explanation\n\nThe smirk, the tension, the strategic comment — these are all environmental data. Your job isn''t to fix the hostility. It''s to ensure the Deaf parent has equal access to information WITHIN that hostility.',
  jsonb_build_object(
    'A', 'Waiting means the Deaf parent missed information. You''ve already allowed inequity. The mediation doesn''t "officially begin" at some magic moment — communication is happening now.',
    'C', 'This frames you as someone who can be lobbied (they tried, you refused). It also doesn''t get the information to the Deaf parent. You''re managing your own discomfort, not serving access.',
    'D', 'The hostile atmosphere isn''t your problem to solve. The mediator will manage process. Your job is communication access.'
  ),
  jsonb_build_array(
    'Interpretation begins when communication begins, not when "official" proceedings start',
    'Environmental assessment includes noticing power dynamics',
    'Action demonstrates role more effectively than explanation',
    'Your job is access, not atmosphere management'
  ),
  'Social Awareness',
  3,
  90,
  jsonb_build_array('legal', 'situational_judgment', 'power_dynamics', 'custody', 'hostile_environment');

-- Drill: Platform Failure
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'environment_assessment'),
  'platform_failure_vri',
  'scenario_decision',
  E'You''re providing VRI for a hospital admission. The video quality is poor — pixelated, with a 2-second delay. The Deaf patient is elderly and keeps asking you to repeat.\n\nThe admissions nurse is clearly frustrated and rushing. She says to the patient (not looking at the camera): "We really need to get through these questions. Can you just answer yes or no? Do you understand the consent form?"\n\nThe patient signs to you: "I can barely see you. I don''t understand what she''s asking about consent. What consent?"\n\nThe nurse is waiting impatiently.',
  jsonb_build_object(
    'setting', 'Medical - VRI Hospital Admission',
    'technical_issues', 'Poor video, 2-second delay',
    'patient', 'Elderly Deaf person',
    'provider_attitude', 'Frustrated, rushing',
    'communication_breakdown', 'Patient confused about consent',
    'common_failure_point', 'Pushing through to satisfy the provider'
  ),
  'What do you do?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Interpret the nurse''s question as asked and the patient''s response as given. The communication is happening, even if imperfect.'),
    jsonb_build_object('id', 'B', 'text', 'Tell the patient: "She''s asking if you understand the consent form for your treatment."'),
    jsonb_build_object('id', 'C', 'text', 'Stop and address the nurse: "The video quality is making communication very difficult. The patient has indicated they don''t understand what consent is being discussed. We may need to troubleshoot the technology or consider an in-person interpreter for informed consent."'),
    jsonb_build_object('id', 'D', 'text', 'Ask the nurse to slow down and repeat while you work with the patient to understand the form.')
  ),
  E'C names the actual problem: the communication access is failing, and informed consent requires actual understanding.\n\nThis isn''t about being difficult. Informed consent is a LEGAL requirement. A patient who "can barely see" the interpreter and explicitly says they don''t understand what consent is being requested cannot give informed consent. The hospital is exposed.\n\nBy naming the technical barrier AND the comprehension gap, you''re protecting:\n• The patient''s right to understand\n• The hospital''s legal compliance\n• Your own professional integrity\n\nYou''re not advocating — you''re doing your job. Effective interpretation requires functional communication access.',
  jsonb_build_object(
    'A', 'The communication is NOT happening, even imperfectly. The patient explicitly said they don''t understand. Interpreting "accurately" in a broken channel doesn''t create understanding — it creates a record that looks like communication happened.',
    'B', 'Adding explanation (what consent is being discussed) goes beyond interpretation, but the real problem is the technical barrier. Even with clarification, the patient still can''t see you well enough to receive complex medical information.',
    'D', 'Slowing down doesn''t fix pixelation and delay. You''re asking for accommodations that don''t address the actual barrier.'
  ),
  jsonb_build_array(
    'Technology failure is communication failure',
    'Informed consent requires actual comprehension, not procedural compliance',
    'Naming barriers is part of your professional role',
    'Protecting communication access protects everyone — patient, provider, institution'
  ),
  'Decision Making',
  3,
  90,
  jsonb_build_array('VRI', 'technology', 'informed_consent', 'medical', 'situational_judgment', 'elderly');

-- =====================================================
-- INTERVENTION DECISIONS DRILLS
-- =====================================================

-- Drill: The Misunderstood Diagnosis
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'clarification_requests'),
  'misunderstood_diagnosis',
  'scenario_decision',
  E'You''re interpreting a cardiology follow-up. The doctor says: "Your echocardiogram shows your ejection fraction has improved from 35% to 45%. That''s great progress."\n\nYou interpret accurately. The Deaf patient responds enthusiastically: "Oh wonderful! So my heart is back to normal now? I can stop taking the medications?"\n\nThe doctor, checking their notes, says: "Keep taking everything as prescribed. I''ll see you in three months."\n\nYou interpret this. The patient nods but looks confused. The doctor is already moving toward the door.',
  jsonb_build_object(
    'setting', 'Medical - Cardiology',
    'situation', 'Possible misunderstanding about treatment',
    'patient_statement', 'Asked if heart is normal, can stop medications',
    'doctor_response', 'Didn''t address the question directly',
    'risk', 'Patient may stop medications thinking they''re cured',
    'common_failure_point', 'Assuming the doctor heard and addressed the question'
  ),
  'What do you do?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Nothing — you interpreted accurately. If there''s a miscommunication, it''s between the doctor and patient.'),
    jsonb_build_object('id', 'B', 'text', 'Tell the patient: "I don''t think the doctor understood your question. You should ask again."'),
    jsonb_build_object('id', 'C', 'text', 'Address the doctor: "Excuse me — I want to make sure the message was clear. The patient asked whether their heart is back to normal and if they can stop medications."'),
    jsonb_build_object('id', 'D', 'text', 'After the doctor leaves, explain to the patient that 45% is still below normal and they should keep taking medications.')
  ),
  E'C intervenes to ensure communication actually happened.\n\nWhat went wrong: The patient asked a direct question with life-or-death implications. The doctor''s response ("keep taking everything") might have been an answer, or might have been a generic closing statement while distracted. The patient is visibly confused.\n\nYour intervention isn''t advocacy — it''s clarification. You''re not saying what the answer SHOULD be. You''re flagging that a question may not have been received.\n\nThe framing matters: "I want to make sure the message was clear" puts it on communication, not on the doctor''s competence. "The patient asked..." restates the question without interpretation.\n\nThis is appropriate intervention for potential message failure.',
  jsonb_build_object(
    'A', 'Technically true but professionally incomplete. Interpretation includes ensuring messages are received, not just transmitted. A question that wasn''t heard wasn''t communicated.',
    'B', 'Telling the patient to ask again puts the burden on them and implies you noticed a problem but didn''t address it. It''s also a side conversation that excludes the doctor.',
    'D', 'Providing medical information after the appointment is WAY outside your role. You don''t know if 45% means they can stop meds or not. Only the doctor knows their treatment plan.'
  ),
  jsonb_build_array(
    'Clarification requests ensure communication, not just interpretation',
    'Life-safety topics warrant extra attention to message receipt',
    'Frame interventions around communication clarity, not participant error',
    'You flag potential gaps — you don''t fill them with your own knowledge'
  ),
  'Decision Making',
  3,
  90,
  jsonb_build_array('medical', 'clarification', 'intervention', 'cardiology', 'patient_safety');

-- Drill: Cultural Gap
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'cultural_mediation'),
  'cultural_gap_directness',
  'scenario_decision',
  E'You''re interpreting a job interview. The Deaf candidate, who grew up in a Deaf residential school, responds to behavioral questions with very direct, detailed stories — including times they made mistakes and learned from them.\n\nThe hearing interviewers exchange glances after one response. You recognize what''s happening: Deaf cultural communication tends toward directness and explicit lessons, while hearing professional culture often expects more "polished" responses that minimize failures.\n\nThe candidate is highly qualified. Their direct communication style is being read as "unprofessional" by the interviewers.',
  jsonb_build_object(
    'setting', 'Employment - Job Interview',
    'cultural_dynamic', 'Deaf directness vs. hearing professional norms',
    'candidate_qualification', 'Highly qualified',
    'interviewer_perception', 'Reading directness as unprofessional',
    'common_failure_point', 'Modifying the interpretation to sound more "professional"'
  ),
  'What do you do?',
  'A',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Interpret the responses accurately, preserving the directness. The candidate''s communication style is theirs.'),
    jsonb_build_object('id', 'B', 'text', 'Slightly soften the language to match hearing professional norms — "repackage" the content without changing meaning.'),
    jsonb_build_object('id', 'C', 'text', 'Pause and explain to the interviewers that directness is valued in Deaf culture and shouldn''t be read as unprofessional.'),
    jsonb_build_object('id', 'D', 'text', 'During a break, advise the candidate to polish their responses a bit more for hearing audiences.')
  ),
  E'A is correct, even though it''s uncomfortable.\n\nThis is a genuinely hard situation. You can SEE the cultural mismatch happening. But consider:\n\n• The candidate chose how to present themselves\n• Modifying their communication style makes assumptions about what they want\n• "Cultural mediation" that changes how someone comes across is assimilation pressure\n• The candidate may have CHOSEN this style intentionally\n\nThe candidate has the right to show up as themselves and be evaluated on that basis. If they don''t get the job because of cultural mismatch, that might be information about whether this workplace would be a good fit.\n\nYour discomfort watching this happen doesn''t give you permission to "fix" it.',
  jsonb_build_object(
    'B', 'This is what many interpreters do instinctively. But "repackaging" someone''s words changes how they present. You''re making a judgment that hearing norms are correct and Deaf norms need adjustment. The candidate didn''t consent to this.',
    'C', 'Explaining Deaf culture sounds helpful but positions the candidate as someone who needs cultural explanation — as "other." It also doesn''t address whether the candidate wants their style interpreted or modified.',
    'D', 'Advising the candidate assumes you know what they want. Maybe they want to filter for employers who can handle directness. Maybe they''ve considered this and chosen their approach. It''s not your call.'
  ),
  jsonb_build_array(
    'Faithful interpretation includes preserving communication style',
    'Cultural discomfort isn''t a reason to modify interpretation',
    'The Deaf person''s right to self-presentation outweighs your comfort',
    'Mismatches may be information, not problems to solve'
  ),
  'Social Awareness',
  4,
  100,
  jsonb_build_array('cultural_mediation', 'employment', 'deaf_culture', 'interpretation_accuracy', 'self_presentation');

-- =====================================================
-- SELF-REGULATION DRILLS
-- =====================================================

-- Drill: Vicarious Trauma Response
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'vicarious_trauma'),
  'vicarious_trauma_forensic',
  'scenario_decision',
  E'You''ve been interpreting a forensic interview with a Deaf child describing abuse. The interview ended an hour ago. You''re now at home and notice:\n\n• You can''t stop thinking about specific details the child shared\n• You feel an urge to check on your own children/nieces/nephews\n• Food doesn''t sound appealing\n• You''ve been staring at your phone without doing anything for 20 minutes\n• You feel simultaneously exhausted and unable to rest\n\nYou have another assignment tomorrow morning.',
  jsonb_build_object(
    'setting', 'Post-assignment - Home',
    'assignment_type', 'Forensic interview (child abuse)',
    'time_since', '1 hour',
    'symptoms', 'Intrusive thoughts, hypervigilance, appetite loss, dissociation, fatigue',
    'upcoming_commitment', 'Assignment tomorrow',
    'common_failure_point', 'Minimizing symptoms and pushing through'
  ),
  'What should you prioritize right now?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Get some rest. You''re just tired from a hard assignment and will feel better tomorrow.'),
    jsonb_build_object('id', 'B', 'text', 'Call a friend or family member to talk through what you''re feeling.'),
    jsonb_build_object('id', 'C', 'text', 'Use grounding techniques, limit isolation, and seriously assess whether you''re fit for tomorrow''s assignment.'),
    jsonb_build_object('id', 'D', 'text', 'Distract yourself with TV or activities to stop thinking about it.')
  ),
  E'C addresses the full picture.\n\nWhat you''re experiencing is a normal trauma response to abnormal content. The symptoms you''re noticing — intrusive thoughts, hypervigilance, dissociation, appetite/sleep disruption — are your nervous system responding to threat exposure.\n\nPriorities:\n1. GROUNDING NOW: Engage your senses. Cold water, strong taste, physical movement. Get out of the freeze state.\n\n2. LIMIT ISOLATION: You don''t have to process alone. Peer support, clinical supervision, or trusted colleague. NOT detailed venting about content, but co-regulation.\n\n3. ASSESS TOMORROW: You may not be fit to interpret tomorrow, especially if the assignment is emotionally demanding. Pushing through while dysregulated harms you AND clients.\n\nThis isn''t weakness. This is professional self-awareness.',
  jsonb_build_object(
    'A', '"Just tired" minimizes a trauma response. Rest alone may not help if your nervous system is activated. You might lie awake with intrusive thoughts. And without assessment, you''ll show up tomorrow compromised.',
    'B', 'Social connection helps, but calling someone to process isn''t grounding — it might amplify the content by reviewing it. Co-regulation (presence) is different from processing (talking through).',
    'D', 'Distraction is avoidance. It might work short-term but doesn''t address the nervous system activation. The thoughts will return, often worse, when the distraction ends.'
  ),
  jsonb_build_array(
    'Trauma responses to traumatic content are normal, not weakness',
    'Grounding before processing — regulate first, make sense later',
    'Tomorrow''s fitness is a professional assessment, not a determination',
    'Co-regulation =/= venting. Presence helps, detailed review often doesn''t'
  ),
  'Self-Awareness',
  2,
  90,
  jsonb_build_array('vicarious_trauma', 'self_regulation', 'forensic', 'trauma_response', 'professional_wellness');

-- Drill: High Stakes Performance
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'performance_anxiety'),
  'high_stakes_conference',
  'scenario_decision',
  E'You''re about to interpret a keynote address at a national conference. 500 people in the audience, live-streamed. This is the biggest platform assignment you''ve had.\n\nBackstage, 10 minutes before start, you notice:\n• Your hands are shaking slightly\n• You''ve reviewed the speaker''s materials three times in the last hour\n• You keep thinking "What if I miss a key point?"\n• Your breathing is shallow\n• A colleague walks by and says "Big moment! Don''t mess it up!" (joking, but it lands wrong)\n\nYou need to walk on stage in 10 minutes.',
  jsonb_build_object(
    'setting', 'Conference - Keynote',
    'audience_size', '500+ live-streamed',
    'assignment_level', 'Career milestone',
    'time_until_start', '10 minutes',
    'physical_symptoms', 'Shaking, shallow breathing, repetitive prep',
    'mental_symptoms', 'Catastrophizing, intrusive thoughts',
    'common_failure_point', 'Trying to "calm down" or cramming more prep'
  ),
  'What''s the best use of these 10 minutes?',
  'B',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Review the materials one more time to feel more confident.'),
    jsonb_build_object('id', 'B', 'text', 'Stop reviewing. Do physiological regulation: slow exhale breathing, shake out your hands, feel your feet on the floor.'),
    jsonb_build_object('id', 'C', 'text', 'Find a quiet space and visualize yourself interpreting perfectly.'),
    jsonb_build_object('id', 'D', 'text', 'Chat with other interpreters or staff to distract from the nerves.')
  ),
  E'B addresses what''s actually happening: physiological activation.\n\nYou''ve prepared. Reviewing again won''t add knowledge — it''s anxiety management masquerading as preparation. You''re past the point where cognitive prep helps.\n\nYour body is in fight-or-flight. The shaking hands, shallow breathing, catastrophic thoughts — these are sympathetic nervous system activation. You can''t think your way out of this.\n\nPHYSIOLOGICAL INTERVENTIONS:\n• Extended exhale (longer out-breath than in-breath signals safety to your nervous system)\n• Shake hands/arms (releases tension, moves activated energy)\n• Feet on floor (grounding, signals present-moment safety)\n\nThe goal isn''t to "not be nervous." It''s to regulate enough that your skills can come through. Some activation is fine — it''s alertness. Dysregulation interferes with performance.',
  jsonb_build_object(
    'A', 'You''ve reviewed three times in the last hour. More review is anxiety behavior, not preparation. It reinforces the message that you''re not ready (you are) and keeps you in cognitive mode when you need to be in regulated body mode.',
    'C', 'Visualization can help in advance. 10 minutes before is too late — and "interpreting perfectly" sets up comparison to an ideal that might increase pressure.',
    'D', 'Distraction doesn''t regulate your nervous system. It might feel better momentarily but you''ll still walk on stage with shaking hands and shallow breath.'
  ),
  jsonb_build_array(
    'Anxiety is physiological — address the body, not just the mind',
    'Extended exhale activates parasympathetic response',
    'Preparation has a point of diminishing returns — know when to stop',
    'Some activation is adaptive — regulation =/= elimination of nerves'
  ),
  'Self-Management',
  2,
  75,
  jsonb_build_array('performance_anxiety', 'self_regulation', 'conference', 'platform', 'grounding');

-- =====================================================
-- TERMINOLOGY DRILLS
-- =====================================================

-- Drill: Medical Register Choice
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'medical_terminology'),
  'register_choice_cardiology',
  'scenario_decision',
  E'You''re interpreting a cardiology appointment. The doctor says:\n\n"You''re experiencing paroxysmal atrial fibrillation. It''s episodic, not chronic, which is good. We''ll start you on a rate control medication and an anticoagulant to prevent thromboembolic events."\n\nThe Deaf patient is a middle-aged professional who has asked clarifying questions throughout the appointment, indicating engaged comprehension.',
  jsonb_build_object(
    'setting', 'Medical - Cardiology',
    'patient_profile', 'Engaged, asking questions, professional',
    'technical_content', 'Complex medical terminology',
    'key_terms', 'paroxysmal, atrial fibrillation, anticoagulant, thromboembolic',
    'common_failure_point', 'Either over-simplifying or not registering at all'
  ),
  'How do you handle the terminology?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Interpret using the medical terms (fingerspell or use established signs), matching the doctor''s register.'),
    jsonb_build_object('id', 'B', 'text', 'Simplify: "Your heart has episodes of irregular rhythm. You''ll take medicine to control it and prevent blood clots."'),
    jsonb_build_object('id', 'C', 'text', 'Use the medical terms but with embedded expansion: "You have paroxysmal — meaning it comes and goes — atrial fibrillation..."'),
    jsonb_build_object('id', 'D', 'text', 'Interpret the technical terms, then add: "Do you want me to clarify any of those medical terms?"')
  ),
  E'C matches register while ensuring comprehension.\n\nKey insight: Register matching isn''t about the interpreter''s comfort with terminology — it''s about giving the patient access to the SAME language the doctor used.\n\nWhy this matters:\n• The patient needs to recognize these terms on medication bottles, follow-up paperwork, and future appointments\n• Over-simplification removes information the patient might want\n• Under-explaining assumes comprehension that might not exist\n\nC threads the needle: "paroxysmal — meaning it comes and goes —" gives the term AND the meaning. The patient now knows the word AND what it means.\n\nFor an engaged patient asking questions, this respects their agency while ensuring access.',
  jsonb_build_object(
    'A', 'Pure register matching gives terms but not understanding. The patient hears "thromboembolic" without knowing what it means. They might nod along but not actually understand their treatment.',
    'B', 'Over-simplification strips out information. "Blood clots" doesn''t tell them about stroke risk. "Irregular rhythm" loses the episodic vs. chronic distinction that the doctor emphasized.',
    'D', 'Asking if they want clarification after the fact requires them to admit they didn''t understand. Many patients won''t. It''s better to embed clarity than to make it a separate ask.'
  ),
  jsonb_build_array(
    'Register matching includes ensuring comprehension, not just term transfer',
    'Embedded expansion: term + brief explanation, seamlessly integrated',
    'Patient should leave knowing both the terms AND the meanings',
    'Different patients may need different levels of expansion'
  ),
  'Language Processing',
  3,
  75,
  jsonb_build_array('medical', 'terminology', 'register', 'cardiology', 'expansion');

-- Drill: Legal Term Precision
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'legal_terminology'),
  'legal_precision_plea',
  'scenario_decision',
  E'You''re interpreting at an arraignment. The judge says:\n\n"You''re being charged with assault in the second degree. How do you plead — guilty, not guilty, or no contest?"\n\nYou know that "no contest" (nolo contendere) is a specific legal plea that has different implications than guilty or not guilty. There isn''t a widely standardized ASL sign for "no contest."',
  jsonb_build_object(
    'setting', 'Legal - Arraignment',
    'critical_moment', 'Plea entry',
    'term_at_issue', 'No contest / nolo contendere',
    'challenge', 'No standardized ASL sign',
    'stakes', 'Constitutional right to understand charges and options',
    'common_failure_point', 'Using a non-standard sign that might be misunderstood'
  ),
  'How do you interpret "no contest"?',
  'D',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Fingerspell N-O C-O-N-T-E-S-T'),
    jsonb_build_object('id', 'B', 'text', 'Use a sign that means "I don''t fight/argue" since that''s the conceptual meaning'),
    jsonb_build_object('id', 'C', 'text', 'Interpret as "guilty, not guilty, or [pause] — a third option the judge can explain"'),
    jsonb_build_object('id', 'D', 'text', 'Fingerspell N-O C-O-N-T-E-S-T, then request a brief pause: "The defendant may benefit from an explanation of the plea options before responding."')
  ),
  E'D provides both accuracy and access.\n\nWhy this matters: "No contest" is a legal term of art with specific implications (can''t be used against you in civil court, but counts as conviction). Using a conceptual sign ("don''t fight") might imply something the legal term doesn''t mean.\n\nBut fingerspelling alone doesn''t ensure understanding. Many hearing defendants don''t understand "no contest" either — but they can ask. The Deaf defendant might not know they don''t understand.\n\nD does two things:\n1. Provides the accurate term (fingerspelled)\n2. Creates space for explanation by flagging to the court that clarification might help\n\nThis isn''t advocacy — it''s ensuring the Deaf defendant has the same opportunity for understanding that hearing defendants have.',
  jsonb_build_object(
    'A', 'Fingerspelling is accurate but doesn''t ensure understanding. If the defendant doesn''t know what "no contest" means, they''re making an uninformed legal decision.',
    'B', 'Conceptual interpretation of legal terms risks changing meaning. "Don''t fight" could be misunderstood. Legal terms need legal precision.',
    'C', 'Inventing a "third option" placeholder removes information. The defendant should know what the option is called, even if they need explanation.'
  ),
  jsonb_build_array(
    'Legal terms of art require precision over conceptual equivalence',
    'Accuracy + access: provide the term AND ensure understanding opportunity',
    'Requesting clarification from the court protects due process',
    'The standard: would a hearing defendant have this opportunity?'
  ),
  'Decision Making',
  4,
  90,
  jsonb_build_array('legal', 'terminology', 'precision', 'arraignment', 'due_process');

-- =====================================================
-- MORE SITUATIONAL JUDGMENT
-- =====================================================

-- Drill: The Oversharing Provider
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'conflict_de_escalation'),
  'oversharing_provider',
  'scenario_decision',
  E'You''re interpreting a routine medical appointment. While the Deaf patient steps out to provide a urine sample, the doctor turns to you and says:\n\n"Between us — I''m worried about this patient. They''ve missed several appointments, their A1C is terrible, and honestly I think they''re lying about taking their medication. I can tell you see a lot of patients. Does this seem like someone who''s compliant to you?"\n\nThe patient will return in a few minutes.',
  jsonb_build_object(
    'setting', 'Medical - During appointment',
    'situation', 'Provider sharing concerns about patient TO interpreter',
    'request', 'Asking interpreter to assess patient compliance',
    'patient_status', 'Out of room temporarily',
    'common_failure_point', 'Engaging in the conversation to be collegial'
  ),
  'How do you respond?',
  'B',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Listen but don''t respond. When the patient returns, interpret normally.'),
    jsonb_build_object('id', 'B', 'text', '"I''m not in a position to assess the patient. When they return, I''ll be interpreting everything — is there anything you''d like to discuss with them directly?"'),
    jsonb_build_object('id', 'C', 'text', '"I can''t share observations about patients. But I can tell you that Deaf patients often face healthcare barriers that affect compliance."'),
    jsonb_build_object('id', 'D', 'text', 'Let the doctor know you''ll need to inform the patient that this conversation happened.')
  ),
  E'B does three important things:\n\n1. DECLINES the role of informant/assessor clearly\n2. REDIRECTS to direct communication with the patient\n3. SIGNALS that interpretation will include everything (implicitly discouraging further private comments)\n\nWhat''s happening: The doctor sees you as a fellow healthcare professional and is trying to enlist you in case management. This is common and often not malicious — they''re frustrated and venting to someone in the room.\n\nBut your job is communication access, not patient assessment. And "between us" conversations create exactly the kind of information asymmetry that harms Deaf patients.\n\nB politely declines while opening a door: "Is there anything you''d like to discuss with them directly?" This invites the doctor to have the REAL conversation with the patient.',
  jsonb_build_object(
    'A', 'Passive listening is still participation. You''ve now heard concerns that the patient hasn''t heard. Even if you don''t respond, you know something they don''t. And the doctor thinks you''re a safe person to say these things to.',
    'C', 'Offering cultural education (Deaf patients face barriers) positions you as an educator/advocate and still engages in the conversation. It also implies the patient might have an excuse, which isn''t your assessment to make.',
    'D', 'Informing the patient this conversation happened escalates unnecessarily. The doctor said something inappropriate but not necessarily malicious. B redirects without creating conflict.'
  ),
  jsonb_build_array(
    'Providers may unconsciously treat interpreters as colleagues — redirect to your role',
    'Private conversations about patients create information asymmetry',
    'Redirect to direct communication rather than engaging in side discussions',
    '"Between us" means information the patient doesn''t have — avoid this'
  ),
  'Decision Making',
  3,
  90,
  jsonb_build_array('medical', 'role_boundaries', 'confidentiality', 'provider_communication');

-- =====================================================
-- MORE ETHICAL JUDGMENT
-- =====================================================

-- Drill: Social Media Recognition
INSERT INTO drills (
  subcategory_id, drill_code, drill_type, scenario_text, context_details,
  question, correct_answer, options, explanation, incorrect_feedback,
  learning_points, related_ecci_domain, difficulty_level, estimated_seconds, tags
)
SELECT
  (SELECT id FROM drill_subcategories WHERE subcategory_code = 'confidentiality'),
  'social_media_recognition',
  'scenario_decision',
  E'You interpreted a high-profile court case that made local news. A Deaf community member posts in a Facebook group:\n\n"Was that [your name] interpreting for the defendant in that murder trial?? I saw them on the news! So cool to see Deaf community visibility!"\n\nThe post has 15 comments, some asking if it was really you, some celebrating Deaf community representation in high-profile cases.',
  jsonb_build_object(
    'setting', 'Social Media - Public Facebook Group',
    'situation', 'Being identified from news coverage',
    'assignment_type', 'Criminal trial (high profile)',
    'community_response', 'Celebration of representation',
    'common_failure_point', 'Confirming involvement because it''s public anyway'
  ),
  'How do you respond?',
  'C',
  jsonb_build_array(
    jsonb_build_object('id', 'A', 'text', 'Confirm it was you. The trial was public and you''re on video — there''s no confidentiality to protect.'),
    jsonb_build_object('id', 'B', 'text', 'Post: "I can''t confirm or deny what assignments I take, but I appreciate the support for Deaf community representation!"'),
    jsonb_build_object('id', 'C', 'text', 'Don''t respond to the post at all. If asked directly, say you don''t discuss specific assignments.'),
    jsonb_build_object('id', 'D', 'text', 'Ask the group admin to remove the post to protect confidentiality.')
  ),
  E'C is the cleanest approach.\n\nThis situation is tricky because:\n• The trial WAS public\n• You ARE on video\n• People CAN identify you\n\nBut there''s a difference between being visible and confirming your involvement. You controlling your narrative about assignments — even public ones — maintains professional boundaries.\n\nWhy not confirm?\n• It sets a precedent that you''ll discuss assignments publicly\n• It invites questions about the case ("What was the defendant like?")\n• It connects your professional identity to specific clients in a permanent, searchable way\n\nYou don''t have to pretend you weren''t there. But you also don''t have to participate in public discussion of your assignments.',
  jsonb_build_object(
    'A', '"It''s public anyway" is how confidentiality erodes. Yes, you''re visible. But you confirming it, commenting on it, or engaging with discussion about it is different from passive visibility.',
    'B', 'This is a common response that feels balanced but actually engages with the premise. You''ve now posted in a thread about your assignment. You''re participating in the discussion.',
    'D', 'Asking for removal draws more attention and makes you look like you''re hiding something. The post isn''t about confidential information — it''s about recognizing you in public footage.'
  ),
  jsonb_build_array(
    'Visibility =/= disclosure. You can be seen without confirming.',
    'Social media engagement about assignments creates permanent record',
    'Non-response is a valid professional choice',
    'Setting precedent matters: what you confirm once, you''ll be asked to confirm again'
  ),
  'Self-Management',
  2,
  75,
  jsonb_build_array('confidentiality', 'social_media', 'public_visibility', 'professional_boundaries');

-- =====================================================
-- FINAL COUNT CHECK
-- =====================================================

-- This migration adds:
-- 3 Role Management drills (2 new)
-- 4 Ethical Judgment drills (3 new)
-- 3 Situational Judgment drills (3 new)
-- 3 Intervention Decisions drills (2 new)
-- 3 Self-Regulation drills (2 new)
-- 2 Terminology drills (2 new)

-- Combined with existing 4 drills = ~18 total high-quality scenarios
