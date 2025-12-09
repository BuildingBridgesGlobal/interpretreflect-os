import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch conversations for a user, or messages for a specific conversation
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversation_id");

    // If conversation_id provided, fetch messages for that conversation
    if (conversationId) {
      // Verify user is a participant
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", conversationId)
        .eq("user_id", userId)
        .is("left_at", null)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: "Not a participant of this conversation" },
          { status: 403 }
        );
      }

      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select(`
          *,
          sender:community_profiles!messages_sender_id_fkey(
            display_name
          )
        `)
        .eq("conversation_id", conversationId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error("Error fetching messages:", messagesError);
        return NextResponse.json(
          { error: "Failed to fetch messages", details: messagesError.message },
          { status: 500 }
        );
      }

      // Update last_read_at for this user
      await supabase
        .from("conversation_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      return NextResponse.json({ messages: messages || [] });
    }

    // Otherwise, fetch all conversations for user
    const { data: participations, error: partError } = await supabase
      .from("conversation_participants")
      .select(`
        conversation_id,
        last_read_at,
        is_admin,
        conversations!inner(
          id,
          is_group,
          group_name,
          conversation_type,
          assignment_id,
          created_at,
          updated_at
        )
      `)
      .eq("user_id", userId)
      .is("left_at", null)
      .order("conversations(updated_at)", { ascending: false });

    if (partError) {
      console.error("Error fetching participations:", partError);
      return NextResponse.json(
        { error: "Failed to fetch conversations", details: partError.message },
        { status: 500 }
      );
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Build conversation list with participants and unread counts
    const conversationsWithDetails = await Promise.all(
      participations.map(async (part: any) => {
        const conv = part.conversations;

        // Get all participants for this conversation
        const { data: allParticipants } = await supabase
          .from("conversation_participants")
          .select(`
            user_id,
            is_admin,
            community_profiles!inner(
              display_name
            )
          `)
          .eq("conversation_id", conv.id)
          .is("left_at", null);

        // Get the last message
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .eq("is_deleted", false)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("sender_id", userId)
          .gt("created_at", part.last_read_at || "1970-01-01")
          .eq("is_deleted", false);

        // For DMs, get the other participant
        const otherParticipants = allParticipants?.filter(p => p.user_id !== userId) || [];

        // Get assignment details if this is a teaming conversation
        let assignment: { id: string; title: string; date: string; time: string; setting: string; location_type: string; assignment_type: string } | null = null;
        if (conv.assignment_id) {
          const { data: assignmentData } = await supabase
            .from("assignments")
            .select("id, title, date, time, setting, location_type, assignment_type")
            .eq("id", conv.assignment_id)
            .single();
          assignment = assignmentData;
        }

        return {
          id: conv.id,
          is_group: conv.is_group,
          group_name: conv.group_name,
          conversation_type: conv.conversation_type || "personal",
          assignment_id: conv.assignment_id || null,
          assignment: assignment,
          participants: otherParticipants.map((p: any) => ({
            user_id: p.user_id,
            display_name: p.community_profiles?.display_name || "Unknown",
            is_admin: p.is_admin
          })),
          last_message_at: lastMessage?.created_at || conv.created_at,
          last_message_content: lastMessage?.content || null,
          unread_count: unreadCount || 0,
          updated_at: conv.updated_at
        };
      })
    );

    // Sort by last message time
    conversationsWithDetails.sort((a, b) =>
      new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );

    return NextResponse.json({
      conversations: conversationsWithDetails
    });

  } catch (error: any) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Send a new message or create a conversation
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const sender_id = user!.id;

    const body = await req.json();
    const {
      recipient_id, // For DMs
      conversation_id, // For existing conversations
      content,
      // For creating group chats
      create_group,
      group_name,
      member_ids
    } = body;

    // Creating a new group chat
    if (create_group) {
      if (!member_ids || !Array.isArray(member_ids) || member_ids.length === 0) {
        return NextResponse.json(
          { error: "member_ids array is required for group creation" },
          { status: 400 }
        );
      }

      if (member_ids.length + 1 > 8) { // +1 for creator
        return NextResponse.json(
          { error: "Group cannot have more than 8 members" },
          { status: 400 }
        );
      }

      // Verify all members are connected to sender
      for (const memberId of member_ids) {
        const { data: connection } = await supabase
          .from("connections")
          .select("id")
          .eq("status", "accepted")
          .or(`and(requester_id.eq.${sender_id},addressee_id.eq.${memberId}),and(requester_id.eq.${memberId},addressee_id.eq.${sender_id})`)
          .single();

        if (!connection) {
          return NextResponse.json(
            { error: `Not connected with user ${memberId}` },
            { status: 400 }
          );
        }
      }

      // Create group conversation
      const { data: newConv, error: convError } = await supabase
        .from("conversations")
        .insert({
          is_group: true,
          group_name: group_name || "Group Chat",
          created_by: sender_id
        })
        .select()
        .single();

      if (convError) {
        console.error("Error creating group:", convError);
        return NextResponse.json(
          { error: "Failed to create group", details: convError.message },
          { status: 500 }
        );
      }

      // Add creator as admin
      await supabase
        .from("conversation_participants")
        .insert({
          conversation_id: newConv.id,
          user_id: sender_id,
          is_admin: true
        });

      // Add all members
      for (const memberId of member_ids) {
        await supabase
          .from("conversation_participants")
          .insert({
            conversation_id: newConv.id,
            user_id: memberId,
            is_admin: false
          });
      }

      return NextResponse.json({
        success: true,
        conversation_id: newConv.id,
        is_group: true
      });
    }

    // Sending a message to existing conversation
    if (conversation_id && content) {
      // Verify sender is a participant
      const { data: participant } = await supabase
        .from("conversation_participants")
        .select("*")
        .eq("conversation_id", conversation_id)
        .eq("user_id", sender_id)
        .is("left_at", null)
        .single();

      if (!participant) {
        return NextResponse.json(
          { error: "Not a participant of this conversation" },
          { status: 403 }
        );
      }

      // Insert message
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id,
          sender_id,
          content
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error sending message:", messageError);
        return NextResponse.json(
          { error: "Failed to send message", details: messageError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message
      });
    }

    // Starting a new DM
    if (recipient_id) {
      if (!content) {
        return NextResponse.json(
          { error: "content is required for new DM" },
          { status: 400 }
        );
      }

      // Verify users are connected
      const { data: connection } = await supabase
        .from("connections")
        .select("id")
        .eq("status", "accepted")
        .or(`and(requester_id.eq.${sender_id},addressee_id.eq.${recipient_id}),and(requester_id.eq.${recipient_id},addressee_id.eq.${sender_id})`)
        .single();

      if (!connection) {
        return NextResponse.json(
          { error: "Must be connected to send messages" },
          { status: 403 }
        );
      }

      // Check for existing DM conversation
      const { data: existingParticipations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", sender_id)
        .is("left_at", null);

      let existingConvId: string | null = null;

      if (existingParticipations) {
        for (const part of existingParticipations) {
          // Check if this conversation is a DM with the recipient
          const { data: conv } = await supabase
            .from("conversations")
            .select("id, is_group")
            .eq("id", part.conversation_id)
            .eq("is_group", false)
            .single();

          if (conv) {
            // Check if recipient is in this conversation
            const { data: recipientPart } = await supabase
              .from("conversation_participants")
              .select("id")
              .eq("conversation_id", conv.id)
              .eq("user_id", recipient_id)
              .is("left_at", null)
              .single();

            if (recipientPart) {
              // Check participant count (should be exactly 2 for DM)
              const { count } = await supabase
                .from("conversation_participants")
                .select("*", { count: "exact", head: true })
                .eq("conversation_id", conv.id)
                .is("left_at", null);

              if (count === 2) {
                existingConvId = conv.id;
                break;
              }
            }
          }
        }
      }

      let conversationId: string;

      if (existingConvId) {
        conversationId = existingConvId;
      } else {
        // Create new DM conversation
        const { data: newConv, error: convError } = await supabase
          .from("conversations")
          .insert({
            is_group: false,
            created_by: sender_id
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating DM conversation:", convError);
          return NextResponse.json(
            { error: "Failed to create conversation", details: convError.message },
            { status: 500 }
          );
        }

        conversationId = newConv.id;

        // Add both participants
        await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversationId, user_id: sender_id, is_admin: true },
            { conversation_id: conversationId, user_id: recipient_id, is_admin: true }
          ]);
      }

      // Insert the message
      const { data: message, error: messageError } = await supabase
        .from("messages")
        .insert({
          conversation_id: conversationId,
          sender_id,
          content
        })
        .select()
        .single();

      if (messageError) {
        console.error("Error sending message:", messageError);
        return NextResponse.json(
          { error: "Failed to send message", details: messageError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        conversation_id: conversationId,
        message
      });
    }

    return NextResponse.json(
      { error: "Invalid request - provide conversation_id, recipient_id, or create_group" },
      { status: 400 }
    );

  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update group (rename, add members, leave group)
export async function PUT(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const user_id = user!.id;

    const body = await req.json();
    const {
      conversation_id,
      action, // 'rename', 'add_member', 'leave', 'remove_member'
      group_name,
      member_id
    } = body;

    if (!conversation_id || !action) {
      return NextResponse.json(
        { error: "conversation_id and action are required" },
        { status: 400 }
      );
    }

    // Verify user is a participant
    const { data: userPart } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversation_id)
      .eq("user_id", user_id)
      .is("left_at", null)
      .single();

    if (!userPart) {
      return NextResponse.json(
        { error: "Not a participant of this conversation" },
        { status: 403 }
      );
    }

    // Verify it's a group conversation
    const { data: conv } = await supabase
      .from("conversations")
      .select("is_group")
      .eq("id", conversation_id)
      .single();

    if (!conv?.is_group && action !== 'leave') {
      return NextResponse.json(
        { error: "This action is only available for group chats" },
        { status: 400 }
      );
    }

    switch (action) {
      case 'rename':
        if (!userPart.is_admin) {
          return NextResponse.json(
            { error: "Only admins can rename the group" },
            { status: 403 }
          );
        }
        await supabase
          .from("conversations")
          .update({ group_name })
          .eq("id", conversation_id);
        break;

      case 'add_member':
        if (!userPart.is_admin) {
          return NextResponse.json(
            { error: "Only admins can add members" },
            { status: 403 }
          );
        }
        if (!member_id) {
          return NextResponse.json(
            { error: "member_id is required" },
            { status: 400 }
          );
        }

        // Check group size
        const { count: currentCount } = await supabase
          .from("conversation_participants")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conversation_id)
          .is("left_at", null);

        if ((currentCount || 0) >= 8) {
          return NextResponse.json(
            { error: "Group is at maximum capacity (8 members)" },
            { status: 400 }
          );
        }

        // Verify connection
        const { data: conn } = await supabase
          .from("connections")
          .select("id")
          .eq("status", "accepted")
          .or(`and(requester_id.eq.${user_id},addressee_id.eq.${member_id}),and(requester_id.eq.${member_id},addressee_id.eq.${user_id})`)
          .single();

        if (!conn) {
          return NextResponse.json(
            { error: "You must be connected to add this member" },
            { status: 400 }
          );
        }

        await supabase
          .from("conversation_participants")
          .insert({
            conversation_id,
            user_id: member_id,
            is_admin: false
          });
        break;

      case 'leave':
        await supabase
          .from("conversation_participants")
          .update({ left_at: new Date().toISOString() })
          .eq("conversation_id", conversation_id)
          .eq("user_id", user_id);
        break;

      case 'remove_member':
        if (!userPart.is_admin) {
          return NextResponse.json(
            { error: "Only admins can remove members" },
            { status: 403 }
          );
        }
        if (!member_id) {
          return NextResponse.json(
            { error: "member_id is required" },
            { status: 400 }
          );
        }
        await supabase
          .from("conversation_participants")
          .update({ left_at: new Date().toISOString() })
          .eq("conversation_id", conversation_id)
          .eq("user_id", member_id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Update conversation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
