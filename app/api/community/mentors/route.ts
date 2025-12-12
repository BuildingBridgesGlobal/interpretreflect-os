import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch list of mentors with filtering
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");
    const experience = searchParams.get("experience"); // '0-2' | '3-5' | '6-10' | '10+'
    const availability = searchParams.get("availability"); // 'available' | 'limited' | 'unavailable'
    const search = searchParams.get("search")?.trim();
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query for mentors
    let query = supabase
      .from("community_profiles")
      .select("*", { count: "exact" })
      .eq("open_to_mentoring", true)
      .neq("user_id", userId); // Exclude self

    // Filter by availability
    if (availability) {
      query = query.eq("mentor_availability", availability);
    } else {
      // By default, show available and limited mentors
      query = query.in("mentor_availability", ["available", "limited"]);
    }

    // Filter by specialty (check if specialty is in strong_domains array)
    if (specialty) {
      query = query.contains("strong_domains", [specialty]);
    }

    // Filter by experience range
    if (experience) {
      switch (experience) {
        case "0-2":
          query = query.in("years_experience", ["Student", "0-2 years"]);
          break;
        case "3-5":
          query = query.eq("years_experience", "3-5 years");
          break;
        case "6-10":
          query = query.eq("years_experience", "6-10 years");
          break;
        case "10+":
          query = query.eq("years_experience", "10+ years");
          break;
      }
    }

    // Search by name or bio
    if (search) {
      query = query.or(`display_name.ilike.%${search}%,bio.ilike.%${search}%`);
    }

    // Apply pagination
    query = query
      .order("profile_completion_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: mentors, error: mentorsError, count } = await query;

    if (mentorsError) {
      console.error("Error fetching mentors:", mentorsError);
      return NextResponse.json(
        { error: "Failed to fetch mentors", details: mentorsError.message },
        { status: 500 }
      );
    }

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({
        mentors: [],
        total: 0,
        has_more: false
      });
    }

    // Get connection statuses for these mentors
    const mentorIds = mentors.map(m => m.user_id);

    const { data: connections } = await supabase
      .from("connections")
      .select("user_id, friend_id, status, is_mentorship")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .in("user_id", [...mentorIds, userId])
      .in("friend_id", [...mentorIds, userId]);

    // Build connection status map
    const connectionMap = new Map<string, { status: string; is_mentorship: boolean }>();
    (connections || []).forEach(conn => {
      const mentorId = conn.user_id === userId ? conn.friend_id : conn.user_id;
      if (mentorIds.includes(mentorId)) {
        connectionMap.set(mentorId, {
          status: conn.status,
          is_mentorship: conn.is_mentorship || false
        });
      }
    });

    // Get mentorship request statuses
    const { data: mentorshipRequests } = await supabase
      .from("mentorship_requests")
      .select("mentor_id, requester_id, status")
      .or(`requester_id.eq.${userId},mentor_id.eq.${userId}`)
      .in("mentor_id", mentorIds);

    // Build mentorship request map
    const mentorshipMap = new Map<string, string>();
    (mentorshipRequests || []).forEach(req => {
      if (req.requester_id === userId) {
        mentorshipMap.set(req.mentor_id, req.status);
      }
    });

    // Format response
    const formattedMentors = mentors.map(mentor => {
      const connection = connectionMap.get(mentor.user_id);
      const mentorshipStatus = mentorshipMap.get(mentor.user_id);

      let connectionStatus: "none" | "pending" | "connected" | "mentoring" = "none";
      if (connection) {
        if (connection.is_mentorship) {
          connectionStatus = "mentoring";
        } else if (connection.status === "accepted") {
          connectionStatus = "connected";
        } else if (connection.status === "pending") {
          connectionStatus = "pending";
        }
      } else if (mentorshipStatus === "pending") {
        connectionStatus = "pending";
      } else if (mentorshipStatus === "accepted") {
        connectionStatus = "mentoring";
      }

      return {
        user_id: mentor.user_id,
        display_name: mentor.display_name,
        avatar_url: mentor.avatar_url,
        years_experience: mentor.years_experience,
        specialties: mentor.strong_domains || [],
        bio: mentor.bio,
        mentor_availability: mentor.mentor_availability || "available",
        mentor_statement: mentor.mentor_statement,
        open_to_mentoring: mentor.open_to_mentoring,
        connection_status: connectionStatus
      };
    });

    return NextResponse.json({
      mentors: formattedMentors,
      total: count || 0,
      has_more: (count || 0) > offset + limit
    });

  } catch (error: any) {
    console.error("Mentors fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
