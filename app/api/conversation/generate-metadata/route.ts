import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Wellness activity types for tagging
const WELLNESS_ACTIVITY_TYPES = [
  "emotional-processing",
  "boundary-setting",
  "stress-management",
  "self-care",
  "professional-development",
  "vicarious-trauma",
  "burnout-prevention",
  "conflict-resolution",
  "communication-skills",
  "ethical-decision-making",
];

// Interpreting themes for tagging
const INTERPRETING_THEMES = [
  "medical",
  "legal",
  "educational",
  "mental-health",
  "social-services",
  "business",
  "conference",
  "community",
  "VRI",
  "team-interpreting",
];

/**
 * POST /api/conversation/generate-metadata
 * Generate AI title, summary, and tags for a conversation
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationId, messages, mode } = await req.json();

    if (!conversationId || !messages || messages.length < 2) {
      return NextResponse.json(
        { error: "conversationId and messages are required" },
        { status: 400 }
      );
    }

    // Build conversation text for analysis (limit to avoid token limits)
    const conversationText = messages
      .slice(0, 20) // Limit to first 20 messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "User" : "Elya"}: ${m.content}`
      )
      .join("\n\n");

    // Generate title, summary, and tags using Claude
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Analyze this conversation between an interpreter (User) and their AI companion Elya. Generate metadata for journaling purposes.

Conversation mode: ${mode}

Conversation:
${conversationText}

Generate the following in JSON format:
1. "title": A short, emotionally descriptive title (4-8 words) that captures the main topic and emotional tone. Examples: "Processing a Tough Medical Appointment", "Boundaries with a Demanding Client", "Celebrating a Connection Moment"
2. "summary": A 1-2 sentence summary of what the user discussed or processed
3. "tags": An array of 2-5 relevant tags from these categories:
   - Interpreting settings: ${INTERPRETING_THEMES.join(", ")}
   - Wellness activities: ${WELLNESS_ACTIVITY_TYPES.join(", ")}
   - You can also add custom tags for specific themes discussed

Respond ONLY with valid JSON, no other text:
{"title": "...", "summary": "...", "tags": ["...", "..."]}`
        }
      ]
    });

    // Parse the response
    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    let metadata;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      }
      metadata = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content.text);
      // Fallback to generic metadata
      metadata = {
        title: mode === "debrief" ? "Debrief Session" :
               mode === "prep" ? "Assignment Prep" :
               mode === "free-write" ? "Free Writing" :
               "Conversation with Elya",
        summary: "A reflection session with Elya.",
        tags: [mode]
      };
    }

    // Update the conversation in the database
    const { error: updateError } = await supabaseAdmin
      .from("elya_conversations")
      .update({
        ai_title: metadata.title,
        ai_summary: metadata.summary,
        ai_tags: metadata.tags || []
      })
      .eq("id", conversationId);

    if (updateError) {
      console.error("Error updating conversation:", updateError);
      return NextResponse.json(
        { error: "Failed to update conversation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      metadata
    });

  } catch (error: any) {
    console.error("Error generating conversation metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
