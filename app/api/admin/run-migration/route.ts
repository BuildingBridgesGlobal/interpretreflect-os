import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ADMIN_EMAILS = [
  "maddox@interpretreflect.com",
  "admin@interpretreflect.com",
  "sarah@interpretreflect.com",
];

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const email = user.email?.toLowerCase() || "";
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === "add_virtual_synergy_workshop") {
      // Insert Virtual Synergy CEU Workshop
      const workshopData = {
        module_code: 'CEU-2025-VS001',
        ecci_domain: 'Relationship Management',
        title: 'Virtual Synergy: Mastering Teamwork in Digital Interpreting',
        subtitle: 'Mastering virtual team dynamics for remote interpreting success',
        description: 'As interpreting increasingly occurs in digital spaces, understanding the unique dynamics of virtual teamwork is crucial. This focused 1-hour session synthesizes our series\' exploration of emotional intelligence, communication, conflict, and support, applying these principles to the distinct challenges and opportunities of remote collaboration. We will explore the core concepts needed to maintain connection, communicate clearly, navigate conflict, provide support, and optimize team synergy online.',
        duration_minutes: 60,
        ceu_value: 0.10,
        rid_category: 'Professional Studies',
        ceu_eligible: true,
        is_active: true,
        video_url: 'https://player.vimeo.com/video/1093410263',
        instructor_name: 'Sarah Wheeler',
        instructor_credentials: 'M.Ed., M.S.',
        workshop_type: 'on_demand',
        presentation_language: 'ASL w/ English Captions',
        assessment_pass_threshold: 80,
        learning_objectives: [
          { id: 1, objective: "Identify the unique communication, relational, and logistical challenges posed by virtual interpreting environments." },
          { id: 2, objective: "Understand key strategies for building trust, managing virtual communication nuances, addressing remote conflict, and fostering support online." },
          { id: 3, objective: "Identify specific considerations for effective virtual collaboration, including generational perspectives and DI/HI teaming." }
        ],
        assessment_questions: [
          {
            id: 1,
            question: "Based on what you learned in the workshop, which of the following changes represents the BIGGEST shift when moving from in-person to virtual interpreting?",
            options: [
              { letter: "A", text: "Sensory input becomes more rich and multi-dimensional" },
              { letter: "B", text: "Cognitive load decreases because of automatic processing" },
              { letter: "C", text: "Emotional cues become reduced or absent" },
              { letter: "D", text: "Professional isolation risk stays about the same" }
            ],
            correct_answer: "C",
            feedback: "Exactly! When we move online, emotional cues become reduced or absent, which is one of the most significant changes. This means we have to work harder to read the emotional landscape and stay connected."
          },
          {
            id: 2,
            question: "You're 45 minutes into a 2-hour virtual assignment and you notice you're much more exhausted than you'd typically be at this point in an in-person assignment. According to the workshop, what's the PRIMARY reason for this?",
            options: [
              { letter: "A", text: "The technology is unreliable and keeps freezing" },
              { letter: "B", text: "Virtual interpreting requires higher cognitive load because automatic processes become effortful" },
              { letter: "C", text: "You're sitting in an uncomfortable chair" },
              { letter: "D", text: "Virtual assignments are always longer than in-person ones" }
            ],
            correct_answer: "B",
            feedback: "That's right! Virtual interpreting requires higher cognitive load because things that happen automatically in person (reading body language, processing multiple sensory inputs) now require conscious effort. This is why self-care and breaks are even more critical in virtual work."
          },
          {
            id: 3,
            question: "The workshop discussed how body posture and breathwork can shift mental states. In a practical sense, how might you apply this knowledge RIGHT before starting a challenging virtual interpretation?",
            options: [
              { letter: "A", text: "Ignore your body and focus only on your screen setup" },
              { letter: "B", text: "Take a moment to ground yourself with intentional breathing and posture adjustment" },
              { letter: "C", text: "Stand up throughout the entire interpretation to maximize alertness" },
              { letter: "D", text: "Only focus on technical setup and equipment checks" }
            ],
            correct_answer: "B",
            feedback: "Beautiful! Taking even 30 seconds to ground yourself with intentional breathing and checking your posture can shift your mental state and prepare you for the cognitive demands ahead. This is embodied cognition in action - your body state influences your cognitive state."
          },
          {
            id: 4,
            question: "According to the research shared in the workshop, what happens when interpreters practice mirroring body language with their team partner?",
            options: [
              { letter: "A", text: "It creates confusion and miscommunication" },
              { letter: "B", text: "It increases trust and rapport" },
              { letter: "C", text: "It has no measurable effect on the working relationship" },
              { letter: "D", text: "It only works in person, not virtually" }
            ],
            correct_answer: "B",
            feedback: "Yes! Mirroring body language increases trust and builds rapport, even in virtual settings. This is why being intentional about your presence and paying attention to your team partner's non-verbal cues matters so much."
          },
          {
            id: 5,
            question: "You're in a virtual team interpretation and you've noticed that you and your partner keep accidentally talking over each other during transitions. Based on the workshop's guidance, what's the MOST effective solution?",
            options: [
              { letter: "A", text: "Just keep doing what you're doing - it will eventually work itself out" },
              { letter: "B", text: "Implement explicit cues like chat messages or hand signals for turn-taking" },
              { letter: "C", text: "Avoid switching at all during the assignment" },
              { letter: "D", text: "Turn off your camera so you don't distract each other" }
            ],
            correct_answer: "B",
            feedback: "Exactly right! Explicit cues like chat messages or hand signals reduce interruptions and boost team satisfaction. In virtual settings, we can't rely on the subtle cues we'd use in person, so being more deliberate about turn-taking protocols really helps."
          },
          {
            id: 6,
            question: "The workshop explained that emotional dissonance risk is HIGHER in virtual settings compared to in-person. What does this mean for you as a virtual interpreter?",
            options: [
              { letter: "A", text: "You'll always feel perfectly aligned with the emotions in the assignment" },
              { letter: "B", text: "You need to be more aware of the gap between what you're feeling and what you're expressing/experiencing" },
              { letter: "C", text: "Emotional dissonance doesn't affect interpreters, only other professionals" },
              { letter: "D", text: "Virtual work eliminates all emotional challenges" }
            ],
            correct_answer: "B",
            feedback: "Yes - and this is so important for your wellbeing! Emotional dissonance is that gap between what you're genuinely feeling and what you're projecting or processing. In virtual settings, this gap can widen because we're already working harder cognitively and getting less natural emotional feedback."
          },
          {
            id: 7,
            question: "The workshop highlighted that psychological safety leads to more innovation and better performance. As a team interpreter in a virtual setting, which behavior BEST demonstrates creating psychological safety with your partner?",
            options: [
              { letter: "A", text: "Only pointing out their mistakes after the assignment ends" },
              { letter: "B", text: "Fostering open, nonjudgmental dialogue about the work and supporting each other's needs" },
              { letter: "C", text: "Never discussing anything difficult or uncomfortable" },
              { letter: "D", text: "Competing to see who can interpret longer without a break" }
            ],
            correct_answer: "B",
            feedback: "Beautiful! Psychological safety means creating space where both team members can be honest, vulnerable, and supportive without fear of judgment. This is especially crucial in virtual work where we can't read each other as easily."
          },
          {
            id: 8,
            question: "You notice your team partner's energy seems really low during a virtual assignment - their voice sounds flat and they seem to be struggling more than usual. According to the workshop's guidance on virtual synergy, what's the BEST immediate response?",
            options: [
              { letter: "A", text: "Ignore it and focus on your own work" },
              { letter: "B", text: "Call them out publicly in the chat" },
              { letter: "C", text: "Offer to take a longer turn or check in supportively (via chat or after) to see if they need anything" },
              { letter: "D", text: "Report them to the agency immediately" }
            ],
            correct_answer: "C",
            feedback: "Yes! Recognizing when team members need support and responding with compassion is the heart of virtual synergy. A quick supportive message or offering to take a longer turn can make all the difference. We're in this together, even when we're miles apart."
          }
        ],
        rid_activity_code: '2309061302',
        checklist_ceu_request_form: true,
        checklist_recording_uploaded: true,
        publish_status: 'published',
        published_at: new Date().toISOString()
      };

      // Check if already exists
      const { data: existing } = await supabaseAdmin
        .from("skill_modules")
        .select("id")
        .eq("module_code", "CEU-2025-VS001")
        .single();

      let result;
      if (existing) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from("skill_modules")
          .update({ ...workshopData, updated_at: new Date().toISOString() })
          .eq("module_code", "CEU-2025-VS001")
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        result = { action: "updated", data };
      } else {
        // Insert new
        const { data, error } = await supabaseAdmin
          .from("skill_modules")
          .insert(workshopData)
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
        result = { action: "inserted", data };
      }

      return NextResponse.json({
        success: true,
        message: "Virtual Synergy workshop added successfully",
        result
      });
    }

    if (action === "setup_ceu_rls_and_functions") {
      // Note: RLS policies and functions need to be run via Supabase SQL Editor
      // or through the migration system. This endpoint provides instructions.
      return NextResponse.json({
        success: true,
        message: "To set up CEU RLS and automation functions, run the migration file in Supabase SQL Editor.",
        instructions: [
          "1. Go to Supabase Dashboard > SQL Editor",
          "2. Open supabase/migrations/20250210_ceu_rls_and_functions.sql",
          "3. Run the SQL to enable RLS policies and create automation functions",
          "4. This will set up: RLS on all CEU tables, auto-certificate generation, deadline tracking"
        ]
      });
    }

    if (action === "nsm_to_quick_skills") {
      // Mark NSM modules as non-CEU
      const { data: updateResult, error: updateError } = await supabaseAdmin
        .from("skill_modules")
        .update({
          ceu_eligible: false,
          ceu_value: null,
          rid_category: null,
          updated_at: new Date().toISOString(),
        })
        .or("module_code.like.NSM-%,module_code.like.1.%")
        .select("id, module_code, title");

      if (updateError) {
        console.error("Update error:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Update series
      const { error: seriesError } = await supabaseAdmin
        .from("skill_series")
        .update({
          total_ceu_value: null,
          rid_category: null,
          updated_at: new Date().toISOString(),
        })
        .or("series_code.eq.NSM,title.ilike.%Nervous System%");

      if (seriesError) {
        console.error("Series update error:", seriesError);
      }

      return NextResponse.json({
        success: true,
        message: "NSM modules marked as Quick Skills (non-CEU)",
        updated: updateResult,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
