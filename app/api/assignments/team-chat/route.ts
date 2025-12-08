import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// POST - Create or get existing team chat for an assignment
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const user_id = user!.id;

    const body = await req.json();
    const { assignment_id, member_user_ids, assignment_title } = body;

    if (!assignment_id) {
      return NextResponse.json(
        { error: "assignment_id is required" },
        { status: 400 }
      );
    }

    // Check if team chat already exists for this assignment
    // We'll store the assignment_id in the group_name metadata
    const teamChatName = `Team: ${assignment_title || 'Assignment'}`;

    // Look for existing team conversation with this assignment
    const { data: existingConv } = await supabase
      .from("conversations")
      .select(`
        id,
        group_name,
        conversation_participants!inner (
          user_id
        )
      `)
      .eq("is_group", true)
      .ilike("group_name", `Team:%`)
      .limit(50);

    // Find conversation where current user is a participant and matches assignment pattern
    let teamConversationId: string | null = null;

    if (existingConv) {
      // Check if any existing team chat has all the same members
      for (const conv of existingConv) {
        const participants = (conv as any).conversation_participants || [];
        const participantIds = participants.map((p: any) => p.user_id);

        // Check if current user is in this conversation
        if (participantIds.includes(user_id)) {
          // This could be the team chat - we'll use metadata to confirm
          // For now, we'll create a new one if members don't match
          const allMembersInChat = member_user_ids?.every((id: string) =>
            participantIds.includes(id)
          );

          if (allMembersInChat && participantIds.length === (member_user_ids?.length || 0) + 1) {
            teamConversationId = conv.id;
            break;
          }
        }
      }
    }

    // If no existing team chat, create one
    if (!teamConversationId && member_user_ids && member_user_ids.length > 0) {
      // Create the group conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          is_group: true,
          group_name: teamChatName,
          created_by: user_id
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating team conversation:", convError);
        return NextResponse.json(
          { error: "Failed to create team chat", details: convError.message },
          { status: 500 }
        );
      }

      teamConversationId = newConv.id;

      // Add the creator as admin
      await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: teamConversationId,
          user_id: user_id,
          is_admin: true
        });

      // Add all team members
      for (const memberId of member_user_ids) {
        await supabase
          .from("conversation_participants")
          .insert({
            conversation_id: teamConversationId,
            user_id: memberId,
            is_admin: false
          });
      }

      // Add a system message announcing the team chat
      await supabase
        .from("messages")
        .insert({
          conversation_id: teamConversationId,
          sender_id: user_id,
          content: `Team chat created for assignment: ${assignment_title || 'New Assignment'}. Use this space to coordinate and prepare together!`,
          is_system_message: true
        });
    }

    return NextResponse.json({
      success: true,
      conversation_id: teamConversationId,
      message: teamConversationId ? "Team chat ready" : "No team members to create chat with"
    });

  } catch (error: any) {
    console.error("Team chat creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// GET - Get team chat for an assignment
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignment_id");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignment_id is required" },
        { status: 400 }
      );
    }

    // Get team members for this assignment
    const { data: teamMembers } = await supabase
      .from("assignment_team_members")
      .select("user_id")
      .eq("assignment_id", assignmentId)
      .eq("status", "confirmed");

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json({
        success: true,
        conversation_id: null,
        message: "No confirmed team members"
      });
    }

    const teamUserIds = teamMembers.map(m => m.user_id);

    // Find group conversations where all team members are participants
    const { data: conversations } = await supabase
      .from("conversations")
      .select(`
        id,
        group_name,
        conversation_participants (
          user_id
        )
      `)
      .eq("is_group", true);

    let matchingConversation: any = null;

    if (conversations) {
      for (const conv of conversations) {
        const participants = (conv as any).conversation_participants || [];
        const participantIds = participants.map((p: any) => p.user_id);

        // Check if all team members are in this conversation
        const allTeamMembersInChat = teamUserIds.every(id =>
          participantIds.includes(id)
        );

        if (allTeamMembersInChat && participantIds.includes(userId)) {
          matchingConversation = conv;
          break;
        }
      }
    }

    return NextResponse.json({
      success: true,
      conversation_id: matchingConversation?.id || null
    });

  } catch (error: any) {
    console.error("Team chat fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
