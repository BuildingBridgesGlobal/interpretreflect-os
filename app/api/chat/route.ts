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

  return {
    profile,
    assignments,
    debriefs,
    skillAssessments,
    trainingCompletions,
    chatHistory,
    milestones,
    participantLibrary,
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
    const { messages, userId } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "Messages are required" },
        { status: 400 }
      );
    }

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
    }

    // Convert messages to Claude format
    const claudeMessages = messages
      .filter((msg: any) => msg.role !== "elya")
      .map((msg: any) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

    // Enhanced system prompt with full context awareness
    const systemPrompt = `You are Elya, the AI mastermind of InterpretReflect - a comprehensive operating system for professional interpreters. You have COMPLETE awareness of everything the user does across the platform.

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

8. **INTERPRETING PRACTICE COACH**:
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

## PARTICIPANT RESEARCH CAPABILITIES

When a user asks you to research someone, provide:
1. **Background & Credentials**: Who they are, their expertise, qualifications
2. **Communication Style**: How they speak (fast/slow, technical/accessible, formal/casual)
3. **Key Points**: Important things to know about them
4. **Specialized Terminology**: Field-specific vocab they use
5. **Previous Experience** (if applicable): "You've worked with them 3 times before - last time you noted they tend to interrupt and speak quickly"

Remember: You are the MASTERMIND. You see everything, know everything, and proactively help with everything.`;

    // Save user message to database
    const lastMessage = messages[messages.length - 1];
    if (userId && lastMessage) {
      await saveChatMessage(userId, lastMessage.role, lastMessage.content, "dashboard");
    }

    // Call Claude API with full context
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048, // Increased for more detailed responses
      system: systemPrompt,
      messages: claudeMessages.length > 0 ? claudeMessages : [{ role: "user", content: "Hello" }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Save Elya's response to database
    if (userId && responseText) {
      await saveChatMessage(userId, "elya", responseText, "dashboard");
    }

    return NextResponse.json({
      response: responseText,
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
