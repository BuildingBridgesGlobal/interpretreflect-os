import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch user's mentorship requests
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // 'sent' | 'received' | 'all'
    const status = searchParams.get("status"); // 'pending' | 'accepted' | 'declined'

    let query = supabase
      .from("mentorship_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by type
    if (type === "sent") {
      query = query.eq("requester_id", userId);
    } else if (type === "received") {
      query = query.eq("mentor_id", userId);
    } else {
      query = query.or(`requester_id.eq.${userId},mentor_id.eq.${userId}`);
    }

    // Filter by status
    if (status) {
      query = query.eq("status", status);
    }

    const { data: requests, error: requestsError } = await query;

    if (requestsError) {
      console.error("Error fetching mentorship requests:", requestsError);
      return NextResponse.json(
        { error: "Failed to fetch mentorship requests", details: requestsError.message },
        { status: 500 }
      );
    }

    if (!requests || requests.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    // Get profiles for all involved users
    const userIds = [...new Set([
      ...requests.map(r => r.requester_id),
      ...requests.map(r => r.mentor_id)
    ])];

    const { data: profiles } = await supabase
      .from("community_profiles")
      .select("user_id, display_name, avatar_url, years_experience")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Format response
    const formattedRequests = requests.map(req => {
      const requesterProfile = profileMap.get(req.requester_id);
      const mentorProfile = profileMap.get(req.mentor_id);

      return {
        id: req.id,
        status: req.status,
        message: req.message,
        response_message: req.response_message,
        requested_at: req.requested_at,
        responded_at: req.responded_at,
        requester: requesterProfile ? {
          user_id: req.requester_id,
          display_name: requesterProfile.display_name,
          avatar_url: requesterProfile.avatar_url,
          years_experience: requesterProfile.years_experience
        } : null,
        mentor: mentorProfile ? {
          user_id: req.mentor_id,
          display_name: mentorProfile.display_name,
          avatar_url: mentorProfile.avatar_url,
          years_experience: mentorProfile.years_experience
        } : null,
        is_sent_by_me: req.requester_id === userId
      };
    });

    return NextResponse.json({ requests: formattedRequests });

  } catch (error: any) {
    console.error("Mentorship requests fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create mentorship request
export async function POST(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { mentor_id, message } = body;

    if (!mentor_id) {
      return NextResponse.json(
        { error: "mentor_id is required" },
        { status: 400 }
      );
    }

    if (mentor_id === userId) {
      return NextResponse.json(
        { error: "You cannot request mentorship from yourself" },
        { status: 400 }
      );
    }

    // Check if mentor exists and is open to mentoring
    const { data: mentorProfile, error: profileError } = await supabase
      .from("community_profiles")
      .select("user_id, open_to_mentoring, mentor_availability")
      .eq("user_id", mentor_id)
      .single();

    if (profileError || !mentorProfile) {
      return NextResponse.json(
        { error: "Mentor not found" },
        { status: 404 }
      );
    }

    if (!mentorProfile.open_to_mentoring) {
      return NextResponse.json(
        { error: "This user is not accepting mentorship requests" },
        { status: 400 }
      );
    }

    if (mentorProfile.mentor_availability === "unavailable") {
      return NextResponse.json(
        { error: "This mentor is currently unavailable" },
        { status: 400 }
      );
    }

    // Check if request already exists
    const { data: existingRequest } = await supabase
      .from("mentorship_requests")
      .select("id, status")
      .eq("requester_id", userId)
      .eq("mentor_id", mentor_id)
      .single();

    if (existingRequest) {
      if (existingRequest.status === "pending") {
        return NextResponse.json(
          { error: "You already have a pending request with this mentor" },
          { status: 400 }
        );
      }
      if (existingRequest.status === "accepted") {
        return NextResponse.json(
          { error: "You are already in a mentorship with this mentor" },
          { status: 400 }
        );
      }
    }

    // Create the request
    const { data: request, error: createError } = await supabase
      .from("mentorship_requests")
      .insert({
        requester_id: userId,
        mentor_id,
        message: message?.slice(0, 500) || null,
        requested_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating mentorship request:", createError);
      return NextResponse.json(
        { error: "Failed to create mentorship request", details: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request
    });

  } catch (error: any) {
    console.error("Mentorship request creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Accept or decline mentorship request
export async function PUT(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { request_id, action, response_message } = body;

    if (!request_id) {
      return NextResponse.json(
        { error: "request_id is required" },
        { status: 400 }
      );
    }

    if (!action || !["accept", "decline", "cancel"].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'accept', 'decline', or 'cancel'" },
        { status: 400 }
      );
    }

    // Get the request
    const { data: request, error: fetchError } = await supabase
      .from("mentorship_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (fetchError || !request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    // Verify permissions
    if (action === "cancel") {
      // Only requester can cancel
      if (request.requester_id !== userId) {
        return NextResponse.json(
          { error: "Only the requester can cancel this request" },
          { status: 403 }
        );
      }
    } else {
      // Only mentor can accept/decline
      if (request.mentor_id !== userId) {
        return NextResponse.json(
          { error: "Only the mentor can accept or decline this request" },
          { status: 403 }
        );
      }
    }

    if (request.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot ${action} a request that is already ${request.status}` },
        { status: 400 }
      );
    }

    // Update the request
    const newStatus = action === "accept" ? "accepted" : action === "decline" ? "declined" : "cancelled";

    const { data: updatedRequest, error: updateError } = await supabase
      .from("mentorship_requests")
      .update({
        status: newStatus,
        response_message: response_message?.slice(0, 500) || null,
        responded_at: new Date().toISOString()
      })
      .eq("id", request_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating mentorship request:", updateError);
      return NextResponse.json(
        { error: "Failed to update mentorship request", details: updateError.message },
        { status: 500 }
      );
    }

    // If accepted, create or update connection with mentorship flag
    if (action === "accept") {
      // Check if connection exists
      const { data: existingConnection } = await supabase
        .from("connections")
        .select("*")
        .or(`and(user_id.eq.${request.requester_id},friend_id.eq.${request.mentor_id}),and(user_id.eq.${request.mentor_id},friend_id.eq.${request.requester_id})`)
        .single();

      if (existingConnection) {
        // Update existing connection
        await supabase
          .from("connections")
          .update({
            is_mentorship: true,
            mentorship_started_at: new Date().toISOString(),
            status: "accepted"
          })
          .eq("id", existingConnection.id);
      } else {
        // Create new connection with mentorship
        await supabase
          .from("connections")
          .insert({
            user_id: request.requester_id,
            friend_id: request.mentor_id,
            status: "accepted",
            is_mentorship: true,
            mentorship_started_at: new Date().toISOString()
          });
      }
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest
    });

  } catch (error: any) {
    console.error("Mentorship request update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
