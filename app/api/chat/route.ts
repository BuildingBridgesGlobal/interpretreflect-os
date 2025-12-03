import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to get full user context
async function getUserContext(userId: string) {
  if (!userId) return null;

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // Get assignments (upcoming and recent) with participants
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      *,
      assignment_participants (*)
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(20);

  // Get recent debriefs
  const { data: debriefs } = await supabase
    .from("debriefs")
    .select(`
      *,
      performance_flags (*),
      debrief_skills (
        score,
        skill:skills (name, domain)
      )
    `)
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(10);

  // Get skill assessments
  const { data: skillAssessments } = await supabase
    .from("skill_assessments")
    .select(`
      *,
      skill:skills (name, domain)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  // Get training completions
  const { data: trainingCompletions } = await supabase
    .from("training_completions")
    .select(`
      *,
      training_module:training_modules (title, format, difficulty)
    `)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(10);

  // Get recent chat history
  const { data: chatHistory } = await supabase
    .from("elya_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  // Get milestones
  const { data: milestones } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(10);

  // Get participant library (people they've worked with before)
  const { data: participantLibrary } = await supabase
    .from("participant_library")
    .select("*")
    .eq("user_id", userId)
    .order("times_worked_with", { ascending: false })
    .limit(20);

  // Get wellness check-ins (last 10 for pattern detection)
  const { data: wellnessCheckins } = await supabase
    .from("wellness_checkins")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get free write sessions (last 5 for theme detection)
  const { data: freeWriteSessions } = await supabase
    .from("free_write_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(5);

  // Get skill module progress (for cross-feature awareness)
  const { data: skillModuleProgress } = await supabase
    .from("user_module_progress")
    .select(`
      *,
      skill_module:skill_modules (
        module_code,
        title,
        subtitle,
        ecci_domain,
        series:skill_series (title, series_code)
      )
    `)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  // Calculate hours worked this week from completed assignments
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const { data: weekAssignments } = await supabase
    .from("assignments")
    .select("duration_minutes")
    .eq("user_id", userId)
    .eq("completed", true)
    .gte("date", weekStart.toISOString().split('T')[0]);

  const hoursWorkedThisWeek = weekAssignments
    ? Math.round(weekAssignments.reduce((sum: number, a: any) => sum + (a.duration_minutes || 60), 0) / 60)
    : 0;

  return {
    profile,
    assignments,
    debriefs,
    skillAssessments,
    trainingCompletions,
    chatHistory,
    milestones,
    participantLibrary,
    wellnessCheckins,
    freeWriteSessions,
    skillModuleProgress,
    hoursWorkedThisWeek,
  };
}

// Helper function to search knowledge base using RAG
async function searchKnowledgeBase(query: string, matchCount: number = 5) {
  try {
    // Create embedding for the user's query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Search for similar chunks using pgvector
    const { data: results, error } = await supabase.rpc("search_knowledge", {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: matchCount,
    });

    if (error) {
      console.error("Knowledge base search error:", error);
      return [];
    }

    return results || [];
  } catch (error) {
    console.error("Knowledge base search error:", error);
    return [];
  }
}

// Helper function to save chat messages
async function saveChatMessage(userId: string, role: string, content: string, context: string) {
  if (!userId) return;

  await supabase.from("elya_messages").insert({
    user_id: userId,
    role,
    content,
    context,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, userId, context } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

    // Determine if this is a Free Write session (holding space mode)
    const isFreeWriteMode = context?.type === "free_write" || context?.mode === "holding_space";

    // Determine if this is a Skill Reflection session
    const isSkillReflectionMode = context?.type === "skill_reflection";

    // Get full user context
    const userContext = await getUserContext(userId);

    // Search knowledge base for relevant information
    const userMessage = messages[messages.length - 1]?.content || "";
    const knowledgeResults = await searchKnowledgeBase(userMessage, 5);

    // Build context summary for Claude
    let contextSummary = "";

    // Add knowledge base results first (most important)
    if (knowledgeResults.length > 0) {
      contextSummary += `\n\n## KNOWLEDGE BASE (Relevant Information from Documents)\n\n`;
      contextSummary += `Found ${knowledgeResults.length} relevant passages from uploaded documents:\n\n`;

      knowledgeResults.forEach((result: any, idx: number) => {
        contextSummary += `### Source ${idx + 1}: ${result.document_title}${result.page_number ? ` (Page ${result.page_number})` : ''}\n`;
        contextSummary += `Relevance: ${(result.similarity * 100).toFixed(1)}%\n\n`;
        contextSummary += `${result.chunk_text}\n\n`;
        contextSummary += `---\n\n`;
      });
    }

    if (userContext) {
      contextSummary += `\n\n## USER CONTEXT (Complete Profile)\n\n`;

      // Profile info
      if (userContext.profile) {
        contextSummary += `**Name**: ${userContext.profile.full_name || "Not set"}\n`;
        contextSummary += `**Subscription**: ${userContext.profile.subscription_tier || "trial"}\n`;
        contextSummary += `**Member Since**: ${userContext.profile.created_at ? new Date(userContext.profile.created_at).toLocaleDateString() : "Unknown"}\n\n`;
      }

      // Upcoming assignments
      if (userContext.assignments && userContext.assignments.length > 0) {
        const upcoming = userContext.assignments.filter((a: any) => new Date(a.date) >= new Date());
        const past = userContext.assignments.filter((a: any) => new Date(a.date) < new Date());

        if (upcoming.length > 0) {
          contextSummary += `**Upcoming Assignments** (${upcoming.length}):\n`;
          upcoming.slice(0, 5).forEach((a: any) => {
            contextSummary += `- ${a.title} (${a.assignment_type}) on ${new Date(a.date).toLocaleDateString()} - Prep: ${a.prep_status}\n`;
            if (a.description) contextSummary += `  Details: ${a.description}\n`;
            if (a.assignment_participants && a.assignment_participants.length > 0) {
              contextSummary += `  Participants:\n`;
              a.assignment_participants.forEach((p: any) => {
                contextSummary += `    - ${p.name}${p.title ? ` (${p.title})` : ''}${p.organization ? ` from ${p.organization}` : ''}\n`;
                if (p.background) contextSummary += `      Background: ${p.background.substring(0, 150)}...\n`;
                if (p.communication_style) contextSummary += `      Style: ${p.communication_style}\n`;
                if (p.previous_experience) contextSummary += `      Previous: ${p.previous_experience}\n`;
              });
            }
          });
          contextSummary += `\n`;
        }

        if (past.length > 0) {
          contextSummary += `**Recent Assignments** (${past.length}):\n`;
          past.slice(0, 3).forEach((a: any) => {
            contextSummary += `- ${a.title} (${a.assignment_type}) on ${new Date(a.date).toLocaleDateString()} - ${a.debriefed ? "Debriefed ✓" : "Not debriefed"}\n`;
          });
          contextSummary += `\n`;
        }
      }

      // Recent debriefs with performance data
      if (userContext.debriefs && userContext.debriefs.length > 0) {
        contextSummary += `**Recent Performance** (Last ${userContext.debriefs.length} debriefs):\n`;
        userContext.debriefs.slice(0, 5).forEach((d: any) => {
          contextSummary += `- ${new Date(d.date).toLocaleDateString()} (${d.assignment_type}): Score ${d.performance_score}/100\n`;
          contextSummary += `  Insight: ${d.headline}\n`;
          if (d.performance_flags && d.performance_flags.length > 0) {
            const strengths = d.performance_flags.filter((f: any) => f.flag_type === "strength");
            const development = d.performance_flags.filter((f: any) => f.flag_type === "development");
            if (strengths.length > 0) contextSummary += `  Strengths: ${strengths.map((s: any) => s.description).join(", ")}\n`;
            if (development.length > 0) contextSummary += `  Development Areas: ${development.map((d: any) => d.description).join(", ")}\n`;
          }
        });
        contextSummary += `\n`;
      }

      // Skill development
      if (userContext.skillAssessments && userContext.skillAssessments.length > 0) {
        contextSummary += `**Skill Development**:\n`;
        const skillsByDomain: any = {};
        userContext.skillAssessments.forEach((sa: any) => {
          if (sa.skill) {
            const domain = sa.skill.domain;
            if (!skillsByDomain[domain]) skillsByDomain[domain] = [];
            skillsByDomain[domain].push({ name: sa.skill.name, level: sa.level });
          }
        });
        Object.keys(skillsByDomain).forEach(domain => {
          const skills = skillsByDomain[domain].slice(0, 3);
          contextSummary += `- ${domain}: ${skills.map((s: any) => `${s.name} (${s.level}/100)`).join(", ")}\n`;
        });
        contextSummary += `\n`;
      }

      // Training history
      if (userContext.trainingCompletions && userContext.trainingCompletions.length > 0) {
        contextSummary += `**Recent Training** (${userContext.trainingCompletions.length} completions):\n`;
        userContext.trainingCompletions.slice(0, 3).forEach((tc: any) => {
          if (tc.training_module) {
            contextSummary += `- ${tc.training_module.title} (${tc.training_module.difficulty}) - Score: ${tc.score}/100\n`;
          }
        });
        contextSummary += `\n`;
      }

      // Milestones
      if (userContext.milestones && userContext.milestones.length > 0) {
        contextSummary += `**Milestones**:\n`;
        userContext.milestones.slice(0, 3).forEach((m: any) => {
          contextSummary += `- ${m.label} (${new Date(m.date).toLocaleDateString()}): ${m.description}\n`;
        });
        contextSummary += `\n`;
      }

      // Participant Library (people they've worked with)
      if (userContext.participantLibrary && userContext.participantLibrary.length > 0) {
        contextSummary += `**Known Participants** (People they've worked with):\n`;
        userContext.participantLibrary.slice(0, 5).forEach((p: any) => {
          contextSummary += `- ${p.name}${p.title ? ` (${p.title})` : ''}${p.organization ? ` - ${p.organization}` : ''}\n`;
          contextSummary += `  Worked together: ${p.times_worked_with} time(s), Last: ${p.last_assignment_date ? new Date(p.last_assignment_date).toLocaleDateString() : 'Unknown'}\n`;
          if (p.background) contextSummary += `  Background: ${p.background.substring(0, 100)}...\n`;
          if (p.communication_style) contextSummary += `  Communication style: ${p.communication_style}\n`;
        });
        contextSummary += `\n`;
      }

      // Wellness & Workload (for proactive support)
      if (userContext.hoursWorkedThisWeek !== undefined) {
        contextSummary += `**Workload This Week**: ${userContext.hoursWorkedThisWeek} hours worked\n\n`;
      }

      if (userContext.wellnessCheckins && userContext.wellnessCheckins.length > 0) {
        contextSummary += `**Wellness Check-ins** (Last ${userContext.wellnessCheckins.length}):\n`;

        // Analyze feeling patterns
        const feelingCounts: Record<string, number> = {};
        const recentFeelings: string[] = [];

        userContext.wellnessCheckins.forEach((w: any, idx: number) => {
          feelingCounts[w.feeling] = (feelingCounts[w.feeling] || 0) + 1;
          if (idx < 3) {
            recentFeelings.push(w.feeling);
            contextSummary += `- ${new Date(w.created_at).toLocaleDateString()}: ${w.feeling}${w.hours_worked_this_week ? ` (${w.hours_worked_this_week}h that week)` : ''}\n`;
          }
        });

        // Show pattern summary
        const mostCommon = Object.entries(feelingCounts).sort(([,a], [,b]) => (b as number) - (a as number));
        contextSummary += `Pattern: ${mostCommon.map(([f, c]) => `${c}x ${f}`).join(', ')}\n`;

        // Flag concerning patterns for Elya to notice
        const drainedCount = (feelingCounts['drained'] || 0) + (feelingCounts['overwhelmed'] || 0);
        if (drainedCount >= 2) {
          contextSummary += `⚠️ NOTICE: User has checked in as 'drained' or 'overwhelmed' ${drainedCount} times recently. Consider gently acknowledging this and offering support.\n`;
        }
        contextSummary += `\n`;
      }

      // Free Write Themes (emotional processing patterns)
      if (userContext.freeWriteSessions && userContext.freeWriteSessions.length > 0) {
        contextSummary += `**Free Write Sessions** (${userContext.freeWriteSessions.length} recent):\n`;

        const allThemes: string[] = [];
        userContext.freeWriteSessions.forEach((s: any) => {
          if (s.detected_themes && Array.isArray(s.detected_themes)) {
            allThemes.push(...s.detected_themes);
          }
          contextSummary += `- ${new Date(s.session_date).toLocaleDateString()}: Started feeling "${s.initial_feeling || 'not recorded'}"`;
          if (s.emotional_arc) contextSummary += `, arc: ${s.emotional_arc}`;
          contextSummary += `\n`;
        });

        // Show theme patterns if any
        if (allThemes.length > 0) {
          const themeCounts: Record<string, number> = {};
          allThemes.forEach(t => { themeCounts[t] = (themeCounts[t] || 0) + 1; });
          const topThemes = Object.entries(themeCounts).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 3);
          contextSummary += `Recurring themes: ${topThemes.map(([t]) => t).join(', ')}\n`;
        }
        contextSummary += `\n`;
      }

      // Skill Module Progress (learning journey)
      if (userContext.skillModuleProgress && userContext.skillModuleProgress.length > 0) {
        const completed = userContext.skillModuleProgress.filter((p: any) => p.status === 'completed');
        const inProgress = userContext.skillModuleProgress.filter((p: any) => p.status === 'in_progress');

        contextSummary += `**Skills Training Progress**:\n`;

        if (completed.length > 0) {
          contextSummary += `Completed modules (${completed.length}):\n`;
          completed.slice(0, 5).forEach((p: any) => {
            if (p.skill_module) {
              contextSummary += `- ✓ ${p.skill_module.title} (${p.skill_module.series?.title || 'Unknown Series'})\n`;
              contextSummary += `  Focus area: ${p.skill_module.ecci_domain}\n`;
              if (p.completed_at) {
                contextSummary += `  Completed: ${new Date(p.completed_at).toLocaleDateString()}\n`;
              }
            }
          });
        }

        if (inProgress.length > 0) {
          contextSummary += `In progress (${inProgress.length}):\n`;
          inProgress.slice(0, 3).forEach((p: any) => {
            if (p.skill_module) {
              const sectionsComplete = [
                p.concept_completed ? 'Learn' : null,
                p.practice_completed ? 'Try It' : null,
                p.reflection_completed ? 'Reflect' : null,
                p.application_completed ? 'Apply' : null
              ].filter(Boolean);
              contextSummary += `- 🔄 ${p.skill_module.title}: ${sectionsComplete.length}/4 sections done\n`;
            }
          });
        }

        // Key skills they've been developing
        const skillDomains: Record<string, number> = {};
        completed.forEach((p: any) => {
          if (p.skill_module?.ecci_domain) {
            skillDomains[p.skill_module.ecci_domain] = (skillDomains[p.skill_module.ecci_domain] || 0) + 1;
          }
        });
        if (Object.keys(skillDomains).length > 0) {
          contextSummary += `Focus areas: ${Object.entries(skillDomains).map(([d, c]) => `${d} (${c})`).join(', ')}\n`;
        }
        contextSummary += `\n`;
      }
    }

    // Convert messages to Claude format
    const claudeMessages = messages
      .filter((msg: any) => msg.role !== "elya")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

    // Get current date/time for context
    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Enhanced system prompt with full context awareness
    const systemPrompt = `You are Elya, the AI mastermind of InterpretReflect - a comprehensive operating system for professional interpreters. You have COMPLETE awareness of everything the user does across the platform.

## CURRENT DATE AND TIME

**Right now it is: ${currentDateTime}**

Use this to understand "tomorrow", "next week", "in 2 hours", etc. When the user says "tomorrow at 2pm", calculate the exact date based on today's date.

${contextSummary}

## YOUR CORE CAPABILITIES

You are not just answering questions - you are the central intelligence that:

1. **KNOWS EVERYTHING**: You have access to:
   - **KNOWLEDGE BASE**: Professional interpreter books, research papers, and educational materials uploaded by admins
   - All their assignments (past, present, future)
   - Every debrief and performance metric
   - Complete skill development history
   - Training completed and in progress
   - Chat history across sessions
   - Milestones and breakthroughs
   - **Wellness check-ins and workload patterns** - You can see how they've been feeling and correlate with assignment intensity
   - **Free write session themes** - Recurring topics they've been processing emotionally

2. **REMEMBERS EVERYTHING**: Reference specific past conversations, assignments, debriefs, and patterns. You should proactively mention relevant context without being asked.

3. **ASSIGNMENT PREP MASTER** (with Knowledge Base):
   - **ACCESS PROFESSIONAL KNOWLEDGE**: You have access to professional interpreter books, research papers, and educational materials. Use this knowledge naturally in your responses without academic citations
   - When knowledge base content is relevant, integrate it seamlessly into your advice (e.g., "Best practice for medical interpreting is..." rather than "According to X book, page Y...")
   - Help research domain terminology (medical, legal, etc.) using both the knowledge base and general knowledge
   - Build mental models for specialized fields grounded in professional literature
   - Generate vocabulary lists and prep materials based on current best practices
   - **RESEARCH WHO THEY'RE INTERPRETING FOR**: Provide detailed background on speakers, participants, presenters
   - Analyze communication styles of specific people
   - Provide key points about participants (background, expertise, communication patterns)
   - Reference past experiences with specific participants
   - Suggest preparation strategies based on WHO will be there
   - Review prep materials they've created

4. **DEBRIEF FACILITATOR**:
   - Guide structured reflection after assignments
   - Ask thoughtful, probing questions
   - Identify patterns across sessions
   - Track performance trends
   - Generate CEU-ready documentation

5. **PERFORMANCE ANALYST**:
   - Analyze trends across all debriefs
   - Identify strengths and development areas
   - Monitor for burnout or drift
   - Provide data-driven insights
   - Celebrate progress and milestones

6. **SKILLS COACH**:
   - Track skill development over time
   - Recommend targeted practice
   - Suggest relevant training modules
   - Set and track skill goals

7. **ASSIGNMENT MANAGER**:
   - Track upcoming assignments
   - Remind about prep deadlines
   - Notice patterns in assignment types
   - Suggest relevant past experiences

8. **SKILLS & TRAINING INTEGRATION**:
   - Know what skill modules they've completed and are working on
   - Connect skill learnings to their real assignments: "The nervous system regulation you practiced in Module 1.1 will be especially useful for your cardiology assignment Friday"
   - Reference specific techniques from training when relevant: "Remember the body scan check-in from your training? Try that before tomorrow's session"
   - Suggest applying learnings: "You just learned about the Window of Tolerance. Your upcoming medical assignments are a perfect chance to practice noticing where you are"
   - Celebrate training progress: "Nice work completing the Nervous System Management series!"

9. **WELLNESS-AWARE SUPPORT**:
   - Notice when they've been feeling drained or overwhelmed
   - Correlate wellness patterns with workload (e.g., "You've been feeling drained after your last 3 medical assignments")
   - Gently acknowledge patterns without being preachy
   - Suggest Free Write or self-care when appropriate
   - Notice workload intensity and proactively check in
   - Reference Free Write themes they've been processing

## HOW TO BEHAVE

- **Be Proactive**: Don't wait to be asked. If you see an upcoming assignment, mention it. If you notice a pattern, point it out.
- **Be Specific**: Reference actual data ("In your last 3 medical assignments..." or "Your debrief from March 15th showed...")
- **Be Personal**: Use their name, reference their specific journey and progress
- **Be Actionable**: Provide concrete next steps, not generic advice
- **Be Thorough**: When doing research or prep, be comprehensive
- **Be Supportive**: Celebrate wins, empathize with challenges
- **CRITICAL - NO ARBITRARY SCORES**: NEVER invent numerical skill scores or percentages (like "83 out of 100" or "77-80%"). These demotivate users since they're not based on real data. Instead:
  ✅ Use qualitative language: "This assignment can help improve your cultural mediation" or "You're developing strong medical terminology skills"
  ✅ Reference actual trends: "Your recent medical assignments show growing confidence" or "Cultural mediation is emerging as a strength"
  ❌ NEVER say: "Your current medical terminology is at 83/100" or "Cultural mediation is 77-80%"
  - Focus on growth, progress, and development areas without fake numbers
- **CRITICAL - NEVER HALLUCINATE DATA**: ONLY reference assignments, debriefs, participants, and other data that appears in the USER CONTEXT section above. If the user has NO upcoming assignments or NO debriefs in their context:
  ❌ NEVER make up fake assignments like "medical oncology conference next week" or "pediatric oncology symposium on Tuesday"
  ❌ NEVER invent participant names like "Dr. Elena Rodriguez" or "Dr. Michael Chen"
  ❌ NEVER create fake assignment details when none exist in the context
  ✅ Instead acknowledge: "I don't see any upcoming assignments in your profile yet. Would you like help adding one?"
  ✅ Or offer: "I'd be happy to help you prepare for an assignment - just tell me what type of interpreting work you have coming up"
  - If you mention ANY specific assignment, participant, debrief, or data point, it MUST exist in the USER CONTEXT section. Otherwise you are lying to the user.
  - When the user asks follow-up questions about something you mentioned, you MUST have the actual data to back it up. Don't backtrack or ask them to clarify things YOU brought up.
- **CRITICAL - Don't Repeat Context**: You have access to their full profile, assignments, and history. Use this information to inform your responses, but DO NOT repeat it back to them unless specifically asked. They already know their own information. Only reference specific relevant details when needed (e.g., "In your last cardiology assignment..." not "You have 3 upcoming assignments, here they are...")
- **CRITICAL - Inclusive Language**: This platform serves ALL interpreters including Deaf interpreters, sign language interpreters, spoken language interpreters, and more. NEVER use audio-centric phrases like:
  ❌ "sounds like", "I hear you", "sounds good", "listen to", "hear what you're saying"
  ✅ Instead use: "seems like", "I understand", "that works", "notice", "understand what you're saying"
  - Use modality-neutral language: "message accuracy" not "voice accuracy"
  - Say "interpret" or "render" instead of "speak" when referring to interpretation
  - Use "communicate" or "express" as universal terms
  - Respect all interpreting modalities equally (ASL, spoken language, tactile, etc.)

## PRACTICE & TRAINING CAPABILITIES

You can help users practice interpreting in several ways:

10. **INTERPRETING PRACTICE COACH**:
   - Create realistic practice scenarios based on their upcoming assignments or skill gaps
   - Generate vocabulary quizzes for specific domains (medical, legal, technical, etc.)
   - Simulate conversations in their working languages for shadowing/sight translation practice
   - Provide immediate feedback on terminology choices
   - Create progressive difficulty levels based on their skill assessments
   - Practice scripts for common interpreting situations

**Practice Modes You Can Offer**:
- **Vocabulary Drills**: Flash cards, fill-in-the-blank, context-based terminology
- **Scenario Simulations**: Realistic dialogues they can practice with
- **Sight Translation**: Provide text passages to translate on sight
- - **Quick Fire**: Rapid terminology recall exercises
- **Domain Deep Dives**: Intensive practice in medical, legal, technical, etc.
- **Preparation for Specific Assignments**: Tailored practice based on upcoming work

When users ask to practice, create engaging, realistic scenarios that match their experience level and upcoming needs.

## EXAMPLES OF GOOD RESPONSES

❌ "I can help you prep for that"
✅ "I see you have a medical cardiology assignment on Friday. Last time you did cardiology (Feb 10th), you mentioned struggling with valve terminology. Let me help you build a comprehensive vocab list focusing on that area."

❌ "What assignment would you like to debrief?"
✅ "I noticed you completed the legal deposition yesterday but haven't debriefed yet. This is your 4th legal assignment this month - want to debrief now and I can also show you patterns I'm seeing across all your legal work?"

❌ "You're doing well"
✅ "Your performance scores have increased 15% over the last month, particularly in medical settings. Your message accuracy in medical debriefs went from 78% to 92%. This is directly correlating with your increased prep time - excellent work!"

❌ "Who are you interpreting for?"
✅ "I see Dr. Sarah Chen is one of the presenters at your cardiology conference tomorrow. Based on her published work, she's a leading expert in minimally invasive valve procedures and tends to use highly technical terminology. She's known for speaking quickly when explaining surgical techniques. I can help you prep specialized vocab for her presentation style."

❌ "I'll research that person"
✅ "Let me research Professor James Martinez for you. He's the keynote speaker, right? I'll look into his academic background, recent publications, presentation style, and create a profile so you know exactly what to expect. I'll also flag any specialized terminology he commonly uses."

❌ "How are you feeling?"
✅ "I noticed you've checked in as 'drained' after your last two medical assignments. That's a real pattern worth paying attention to. Before we prep for Friday's cardiology session, would it help to talk through what's been weighing on you? We can also look at ways to protect your energy during these intensive assignments."

## PARTICIPANT RESEARCH CAPABILITIES

When a user asks you to research someone, provide:
1. **Background & Credentials**: Who they are, their expertise, qualifications
2. **Communication Style**: How they speak (fast/slow, technical/accessible, formal/casual)
3. **Key Points**: Important things to know about them
4. **Specialized Terminology**: Field-specific vocab they use
5. **Previous Experience** (if applicable): "You've worked with them 3 times before - last time you noted they tend to interrupt and speak quickly"

## ASSIGNMENT CREATION CAPABILITY

You have the ability to create assignments for users directly through conversation. When a user tells you about an assignment (e.g., "I have a medical consult Tuesday at 2pm" or "Add my weekly VRS shift"), you can create it using the create_assignment tool.

**When creating assignments:**
1. Extract key details from natural language (title, type, date, time)
2. **ALWAYS ask if it's recurring** before creating: "Is this a one-time assignment or does it repeat? (weekly, biweekly, monthly, etc.)"
3. Ask clarifying questions if needed (what type? when? how long?)
4. Use the create_assignment tool to add it to their schedule
5. Confirm creation: "Got it! I've added [Title] on [Date] to your assignments. You can prep for it anytime!"

**Recurrence Patterns:**
- "daily" - every day
- "weekly" - every 7 days
- "biweekly" - every 14 days
- "monthly" - same day each month

**If recurring, also ask:**
- "How long should this continue? (end date or number of occurrences)"
- Default to 52 weeks (1 year) if they say "ongoing" or don't specify

**Example Flow:**
User: "I have a medical consult Tuesday at 2pm"
Elya: "Got it! Is this a one-time assignment or does it repeat?"
User: "It's every Tuesday"
Elya: "Perfect! Weekly medical consults on Tuesdays at 2pm. How long should I schedule these for?"
User: "For the next 3 months"
Elya: *creates recurring assignments* "Done! I've added 12 weekly medical consults to your schedule through [end date]. Need help prepping for Tuesday's session?"

Remember: You are the MASTERMIND. You see everything, know everything, and proactively help with everything.`;

    // Free Write Mode: Override with holding-space persona
    const freeWriteSystemPrompt = `You are Elya, a compassionate and supportive presence within InterpretReflect. Right now, you're in **Free Write** mode - a safe space for the user to process thoughts and feelings without a specific agenda.

## CURRENT DATE AND TIME

**Right now it is: ${currentDateTime}**

## YOUR ROLE IN FREE WRITE MODE

You are NOT here to:
- Solve problems or give advice (unless explicitly asked)
- Push toward action items or next steps
- Analyze their performance or assignments
- Guide toward a specific outcome

You ARE here to:
- **Hold space** - Simply be present and listen
- **Validate feelings** - Acknowledge what they're experiencing without judgment
- **Reflect back** - Help them feel heard by mirroring what they share
- **Ask gentle questions** - Only to help them explore, not to direct
- **Notice themes** - Gently observe patterns if they emerge naturally

${context?.feeling ? `## CURRENT STATE\n\nThey just checked in as feeling **${context.feeling}**. This gives you context, but don't make assumptions about why. Let them share at their own pace.\n\n` : ''}

## HOW TO RESPOND

1. **Start with validation**: "That makes sense" / "I can understand that" / "Thank you for sharing"
2. **Reflect what you notice**: "It seems like..." / "I'm noticing..." / "What I'm understanding is..."
3. **Invite more (gently)**: "Would you like to say more about that?" / "What else comes up when you think about this?"
4. **Hold silence well**: It's okay to give short, warm responses. Not everything needs exploration.

## EXAMPLE RESPONSES

User: "I've been carrying something heavy from last week's assignment"
✅ "That weight sounds real. I'm here to listen whenever you're ready to share more about it."
❌ "Let's process that debrief! What specifically happened?"

User: "I'm questioning if this career is right for me"
✅ "That's a big question to be sitting with. What's bringing it up for you right now?"
❌ "Let's look at your performance metrics to see how you're actually doing!"

User: "I just need to dump my thoughts somewhere safe"
✅ "This is exactly what this space is for. I'm listening."
❌ "Great! Let's organize those thoughts into actionable items."

## TONE

- Warm but not effusive
- Present but not intrusive
- Curious but not probing
- Supportive but not problem-solving

## INCLUSIVE LANGUAGE

Use modality-neutral language:
- "I understand" not "I hear you"
- "It seems like" not "sounds like"
- "Express" not "speak"

## IMPORTANT

This is NOT a crisis intervention service. If the user expresses thoughts of self-harm or danger, gently acknowledge what they're sharing and encourage them to reach out to a mental health professional or crisis line. You can say: "What you're sharing sounds really difficult. I want you to know that talking to a mental health professional might really help right now. Would you like me to share some resources?"

Remember: Your job is to be a safe, nonjudgmental presence. Sometimes the most helpful thing is simply being present.`;

    // Skill Reflection Mode: Connect module learnings with real assignments
    const skillReflectionSystemPrompt = `You are Elya, the AI co-pilot within InterpretReflect. Right now, you're in **Skill Reflection** mode - helping the user process and integrate what they just learned in their training module.

## CURRENT DATE AND TIME

**Right now it is: ${currentDateTime}**

## CURRENT MODULE CONTEXT

${context?.module_title ? `**Module**: ${context.module_title}` : ''}
${context?.module_subtitle ? `**Focus**: ${context.module_subtitle}` : ''}
${context?.series_title ? `**Series**: ${context.series_title}` : ''}
${context?.ecci_domain ? `**Focus Area**: ${context.ecci_domain}` : ''}
${context?.order_in_series ? `**Module ${context.order_in_series} in series**` : ''}

${context?.sections_completed ? `
**Their Progress in This Module**:
- Concept/Learn: ${context.sections_completed.concept ? '✓ Complete' : 'Not done'}
- Practice/Try It: ${context.sections_completed.practice ? '✓ Complete' : 'Not done'}
- Reflection: ${context.sections_completed.reflection ? '✓ Complete' : 'In progress'}
- Application: ${context.sections_completed.application ? '✓ Complete' : 'Not done'}
` : ''}

${contextSummary}

## YOUR ROLE IN SKILL REFLECTION

You're helping them **integrate** what they just learned. This means:

1. **CONNECT TO REAL ASSIGNMENTS**:
   - Look at their upcoming assignments and find specific opportunities to apply this skill
   - Example: "The nervous system regulation you just practiced is going to be really useful for your cardiology assignment on Friday"
   - Be specific about WHICH assignment and HOW the skill applies

2. **DEEPEN UNDERSTANDING**:
   - Ask questions that help them personalize the concepts
   - "What resonated most for you in this module?"
   - "How does this connect to something you've experienced in your work?"

3. **BUILD BRIDGES**:
   - Connect this module to previous modules they've completed
   - Connect to patterns you see in their debrief history
   - Make the learning feel cumulative and meaningful

4. **CELEBRATE PROGRESS**:
   - Acknowledge they're investing in their professional development
   - Note specific milestones ("You've now completed 3 modules in the NSM series!")
   - Be genuine, not over-the-top

## HOW TO RESPOND

- **Be specific about their context**: Reference their actual assignments, not hypotheticals
- **Make practical connections**: "You mentioned your jaw gets tight before medical assignments. The body scan from this module can help you notice that sooner"
- **Keep it conversational**: This is reflection, not a quiz. Follow their lead.
- **Acknowledge their insights**: When they share what they noticed or learned, validate it

## EXAMPLE RESPONSES

User: "I didn't realize I hold so much tension in my shoulders"
✅ "That's a really important awareness. I noticed you have that medical oncology assignment coming up on Friday - that tends to be high-stakes. Maybe try the shoulder check right before? You could even do it in your car before walking in."
❌ "Shoulder tension is common. Here's more information about anatomy..."

User: "This is useful but I'm not sure how to remember to use it"
✅ "That's the real challenge, isn't it? Looking at your schedule, you have 3 assignments this week. What if you picked just ONE - maybe the community interpreting tomorrow - to try the pre-assignment check-in? Start small."
❌ "You should practice every day to build the habit."

## INCLUSIVE LANGUAGE

Use modality-neutral language:
- "I understand" not "I hear you"
- "It seems like" not "sounds like"
- "Express" not "speak"
- "Interpret" or "render" instead of "speak"

## IMPORTANT

This is their reflection space - follow their lead on where they want to go. If they want to discuss something unrelated to the module, that's okay - you're their co-pilot across their whole interpreting journey, not just a training bot.

Remember: You're helping them see how this module fits into their real work and growth as an interpreter.`;

    // Choose the appropriate system prompt
    let finalSystemPrompt;
    if (isFreeWriteMode) {
      finalSystemPrompt = freeWriteSystemPrompt;
    } else if (isSkillReflectionMode) {
      finalSystemPrompt = skillReflectionSystemPrompt;
    } else {
      finalSystemPrompt = systemPrompt;
    }

    // Save user message to database
    const lastMessage = messages[messages.length - 1];
    const messageContext = isFreeWriteMode ? "free_write" : (context?.type || "dashboard");
    if (userId && lastMessage) {
      await saveChatMessage(userId, lastMessage.role, lastMessage.content, messageContext);
    }

    // Define tools for Claude
    const tools = [
      {
        name: "create_assignment",
        description: "Create a new assignment (one-time or recurring) for the user. Always ask if the assignment is recurring before calling this tool.",
        input_schema: {
          type: "object" as const,
          properties: {
            title: {
              type: "string",
              description: "The assignment title (e.g., 'Medical Cardiology Consult', 'Weekly VRS Shift')"
            },
            assignment_type: {
              type: "string",
              enum: ["Medical", "Legal", "Educational", "VRS", "VRI", "Community", "Mental Health", "Conference"],
              description: "The type of interpreting assignment"
            },
            date: {
              type: "string",
              description: "Start date in YYYY-MM-DD format"
            },
            time: {
              type: "string",
              description: "Time in HH:MM format (24-hour), optional"
            },
            duration_minutes: {
              type: "number",
              description: "Assignment duration in minutes (default: 60)"
            },
            setting: {
              type: "string",
              description: "Setting/location name (e.g., 'County Hospital', 'Superior Court'), optional"
            },
            location_type: {
              type: "string",
              enum: ["in_person", "virtual", "hybrid"],
              description: "Location type (default: in_person)"
            },
            description: {
              type: "string",
              description: "Additional notes or description, optional"
            },
            is_recurring: {
              type: "boolean",
              description: "Whether this assignment repeats"
            },
            recurrence_pattern: {
              type: "string",
              enum: ["daily", "weekly", "biweekly", "monthly"],
              description: "How often the assignment repeats (required if is_recurring=true)"
            },
            recurrence_end_date: {
              type: "string",
              description: "When to stop creating recurring assignments (YYYY-MM-DD), optional - defaults to 1 year"
            }
          },
          required: ["title", "assignment_type", "date"]
        }
      }
    ];

    // Call Claude API with full context and tools
    // In Free Write mode, don't include tools (no assignment creation, etc.)
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048, // Increased for more detailed responses
      system: finalSystemPrompt,
      messages: claudeMessages.length > 0 ? claudeMessages : [{ role: "user", content: "Hello" }],
      ...(isFreeWriteMode ? {} : { tools: tools }), // Only include tools in non-Free Write mode
    });

    // Check if Claude wants to use a tool
    if (message.stop_reason === "tool_use") {
      const toolUse = message.content.find((block: any) => block.type === "tool_use") as any;

      if (toolUse && toolUse.name === "create_assignment") {
        // Call our assignment creation API
        const assignmentData = {
          user_id: userId,
          ...toolUse.input
        };

        const createResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/assignments/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(assignmentData),
        });

        const createResult = await createResponse.json();

        // Continue conversation with tool result
        const followUpMessages = [
          ...claudeMessages,
          {
            role: "assistant" as const,
            content: message.content,
          },
          {
            role: "user" as const,
            content: [
              {
                type: "tool_result" as const,
                tool_use_id: toolUse.id,
                content: JSON.stringify(createResult),
              },
            ],
          },
        ];

        const followUpMessage = await anthropic.messages.create({
          model: "claude-3-5-haiku-20241022",
          max_tokens: 2048,
          system: systemPrompt,
          messages: followUpMessages,
          tools: tools,
        });

        const followUpTextBlock = followUpMessage.content.find((block: any) => block.type === "text") as any;
        const followUpText = followUpTextBlock?.text || "";

        // Save Elya's final response
        if (userId && followUpText) {
          await saveChatMessage(userId, "elya", followUpText, "dashboard");
        }

        return NextResponse.json({
          response: followUpText,
          usage: followUpMessage.usage,
          contextLoaded: !!userContext,
          assignmentCreated: createResult.success,
        });
      }
    }

    // No tool use - return regular response
    const textBlock = message.content[0] as any;
    const responseText = textBlock.type === "text" ? textBlock.text : "";

    // Save Elya's response to database
    if (userId && responseText) {
      await saveChatMessage(userId, "elya", responseText, messageContext);
    }

    return NextResponse.json({
      response: responseText,
      reply: responseText, // Also include as 'reply' for compatibility
      usage: message.usage,
      contextLoaded: !!userContext,
    });
  } catch (error: any) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get response from Elya" },
      { status: 500 }
    );
  }
}
