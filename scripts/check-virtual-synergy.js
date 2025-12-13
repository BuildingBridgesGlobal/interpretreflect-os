// Script to check if Virtual Synergy workshop exists and insert if needed
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('Checking for Virtual Synergy workshop...');

  // Check if workshop exists
  const { data: existing, error: checkError } = await supabase
    .from('skill_modules')
    .select('id, module_code, title, ceu_value, rid_activity_code, publish_status')
    .or('module_code.eq.CEU-2025-VS001,title.ilike.%virtual synergy%');

  if (checkError) {
    console.error('Error checking workshop:', checkError);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log('Virtual Synergy workshop already exists:');
    console.log(JSON.stringify(existing, null, 2));
    return;
  }

  console.log('Workshop not found. Inserting...');

  const workshopData = {
    module_code: 'CEU-2025-VS001',
    ecci_domain: 'Relationship Management',
    title: 'Virtual Synergy: Mastering Teamwork in Digital Interpreting',
    subtitle: 'Mastering virtual team dynamics for remote interpreting success',
    order_in_series: 1,
    module_type: 'ceu_workshop',
    attribution_text: 'Content created by Building Bridges Global for The Interpreter School.',
    source_content_url: 'https://interpreteros.com',
    content_concept: {
      section_title: "Workshop Overview",
      content_blocks: [
        {
          text: "Virtual Team Interpreting",
          type: "heading"
        },
        {
          text: "As interpreting increasingly occurs in digital spaces, understanding the unique dynamics of virtual teamwork is crucial.",
          type: "paragraph"
        }
      ],
      duration_minutes: 60
    },
    content_practice: {
      section_title: "Key Strategies",
      content_blocks: [
        {
          text: "Apply strategies for building trust, managing virtual communication, addressing remote conflict, and fostering support in virtual team settings.",
          type: "paragraph"
        }
      ],
      duration_minutes: 0
    },
    content_application: {
      section_title: "Real-World Application",
      content_blocks: [
        {
          text: "Implement explicit turn-taking protocols, practice grounding techniques, and develop psychological safety with team partners in virtual environments.",
          type: "paragraph"
        }
      ],
      duration_minutes: 0
    },
    description: 'As interpreting increasingly occurs in digital spaces, understanding the unique dynamics of virtual teamwork is crucial. This focused 1-hour session synthesizes our series\' exploration of emotional intelligence, communication, conflict, and support, applying these principles to the distinct challenges and opportunities of remote collaboration. We will explore the core concepts needed to maintain connection, communicate clearly, navigate conflict, provide support, and optimize team synergy online.',
    duration_minutes: 60,
    ceu_value: 0.10,
    rid_category: 'Professional Studies',
    ceu_eligible: true,
    is_active: true,
    has_video: true,
    video_url: 'https://player.vimeo.com/video/1093410263',
    instructor_name: 'Sarah Wheeler',
    instructor_credentials: 'M.Ed., M.S.',
    workshop_type: 'on_demand',
    presentation_language: 'ASL w/ English Captions',
    assessment_pass_threshold: 80,
    learning_objectives: [
      {id: 1, rid_verb: "identify", objective: "Identify the unique communication, relational, and logistical challenges posed by virtual interpreting environments.", measurable: true},
      {id: 2, rid_verb: "understand", objective: "Understand key strategies for building trust, managing virtual communication nuances, addressing remote conflict, and fostering support online.", measurable: true},
      {id: 3, rid_verb: "identify", objective: "Identify specific considerations for effective virtual collaboration, including generational perspectives and DI/HI teaming.", measurable: true}
    ],
    assessment_questions: [
      {
        id: 1,
        question: "Based on what you learned in the workshop, which of the following changes represents the BIGGEST shift when moving from in-person to virtual interpreting?",
        options: [
          {id: "a", text: "Sensory input becomes more rich and multi-dimensional"},
          {id: "b", text: "Cognitive load decreases because of automatic processing"},
          {id: "c", text: "Emotional cues become reduced or absent"},
          {id: "d", text: "Professional isolation risk stays about the same"}
        ],
        correct_answer: "c",
        explanation: "Exactly! When we move online, emotional cues become reduced or absent, which is one of the most significant changes. This means we have to work harder to read the emotional landscape and stay connected."
      },
      {
        id: 2,
        question: "You're 45 minutes into a 2-hour virtual assignment and you notice you're much more exhausted than you'd typically be at this point in an in-person assignment. According to the workshop, what's the PRIMARY reason for this?",
        options: [
          {id: "a", text: "The technology is unreliable and keeps freezing"},
          {id: "b", text: "Virtual interpreting requires higher cognitive load because automatic processes become effortful"},
          {id: "c", text: "You're sitting in an uncomfortable chair"},
          {id: "d", text: "Virtual assignments are always longer than in-person ones"}
        ],
        correct_answer: "b",
        explanation: "That's right! Virtual interpreting requires higher cognitive load because things that happen automatically in person (reading body language, processing multiple sensory inputs) now require conscious effort."
      },
      {
        id: 3,
        question: "The workshop discussed how body posture and breathwork can shift mental states. In a practical sense, how might you apply this knowledge RIGHT before starting a challenging virtual interpretation?",
        options: [
          {id: "a", text: "Ignore your body and focus only on your screen setup"},
          {id: "b", text: "Take a moment to ground yourself with intentional breathing and posture adjustment"},
          {id: "c", text: "Stand up throughout the entire interpretation to maximize alertness"},
          {id: "d", text: "Only focus on technical setup and equipment checks"}
        ],
        correct_answer: "b",
        explanation: "Beautiful! Taking even 30 seconds to ground yourself with intentional breathing and checking your posture can shift your mental state and prepare you for the cognitive demands ahead."
      },
      {
        id: 4,
        question: "According to the research shared in the workshop, what happens when interpreters practice mirroring body language with their team partner?",
        options: [
          {id: "a", text: "It creates confusion and miscommunication"},
          {id: "b", text: "It increases trust and rapport"},
          {id: "c", text: "It has no measurable effect on the working relationship"},
          {id: "d", text: "It only works in person, not virtually"}
        ],
        correct_answer: "b",
        explanation: "Yes! Mirroring body language increases trust and builds rapport, even in virtual settings."
      },
      {
        id: 5,
        question: "You're in a virtual team interpretation and you've noticed that you and your partner keep accidentally talking over each other during transitions. Based on the workshop's guidance, what's the MOST effective solution?",
        options: [
          {id: "a", text: "Just keep doing what you're doing - it will eventually work itself out"},
          {id: "b", text: "Implement explicit cues like chat messages or hand signals for turn-taking"},
          {id: "c", text: "Avoid switching at all during the assignment"},
          {id: "d", text: "Turn off your camera so you don't distract each other"}
        ],
        correct_answer: "b",
        explanation: "Exactly right! Explicit cues like chat messages or hand signals reduce interruptions and boost team satisfaction."
      },
      {
        id: 6,
        question: "The workshop explained that emotional dissonance risk is HIGHER in virtual settings compared to in-person. What does this mean for you as a virtual interpreter?",
        options: [
          {id: "a", text: "You'll always feel perfectly aligned with the emotions in the assignment"},
          {id: "b", text: "You need to be more aware of the gap between what you're feeling and what you're expressing/experiencing"},
          {id: "c", text: "Emotional dissonance doesn't affect interpreters, only other professionals"},
          {id: "d", text: "Virtual work eliminates all emotional challenges"}
        ],
        correct_answer: "b",
        explanation: "Yes - and this is so important for your wellbeing! Emotional dissonance is that gap between what you're genuinely feeling and what you're projecting or processing."
      },
      {
        id: 7,
        question: "The workshop highlighted that psychological safety leads to more innovation and better performance. As a team interpreter in a virtual setting, which behavior BEST demonstrates creating psychological safety with your partner?",
        options: [
          {id: "a", text: "Only pointing out their mistakes after the assignment ends"},
          {id: "b", text: "Fostering open, nonjudgmental dialogue about the work and supporting each other's needs"},
          {id: "c", text: "Never discussing anything difficult or uncomfortable"},
          {id: "d", text: "Competing to see who can interpret longer without a break"}
        ],
        correct_answer: "b",
        explanation: "Beautiful! Psychological safety means creating space where both team members can be honest, vulnerable, and supportive without fear of judgment."
      },
      {
        id: 8,
        question: "You notice your team partner's energy seems really low during a virtual assignment - their voice sounds flat and they seem to be struggling more than usual. According to the workshop's guidance on virtual synergy, what's the BEST immediate response?",
        options: [
          {id: "a", text: "Ignore it and focus on your own work"},
          {id: "b", text: "Call them out publicly in the chat"},
          {id: "c", text: "Offer to take a longer turn or check in supportively (via chat or after) to see if they need anything"},
          {id: "d", text: "Report them to the agency immediately"}
        ],
        correct_answer: "c",
        explanation: "Yes! Recognizing when team members need support and responding with compassion is the heart of virtual synergy."
      }
    ],
    rid_activity_code: '2309061302',
    checklist_ceu_request_form: true,
    checklist_recording_uploaded: true,
    publish_status: 'published',
    published_at: new Date().toISOString()
  };

  const { data: inserted, error: insertError } = await supabase
    .from('skill_modules')
    .insert(workshopData)
    .select();

  if (insertError) {
    console.error('Error inserting workshop:', insertError);
    process.exit(1);
  }

  console.log('Successfully inserted Virtual Synergy workshop:');
  console.log(JSON.stringify(inserted, null, 2));
}

main().catch(console.error);
