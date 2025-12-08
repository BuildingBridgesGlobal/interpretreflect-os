import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Search for users by name, domain, specialty, or mentor status
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const domain = searchParams.get("domain");
    const specialty = searchParams.get("specialty");
    const mentorsOnly = searchParams.get("mentors_only") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build search query
    let searchQuery = supabase
      .from("community_profiles")
      .select("*")
      .eq("is_searchable", true)
      .neq("user_id", userId);

    // Text search on display_name
    if (query.trim()) {
      searchQuery = searchQuery.ilike("display_name", `%${query}%`);
    }

    // Filter by domain
    if (domain) {
      searchQuery = searchQuery.contains("strong_domains", [domain]);
    }

    // Filter by specialty
    if (specialty) {
      searchQuery = searchQuery.contains("specialties", [specialty]);
    }

    // Filter mentors only
    if (mentorsOnly) {
      searchQuery = searchQuery.eq("open_to_mentoring", true);
    }

    // Order by years of experience
    searchQuery = searchQuery
      .order("years_experience", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: profiles, error: profilesError } = await searchQuery;

    if (profilesError) {
      console.error("Error searching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to search profiles", details: profilesError.message },
        { status: 500 }
      );
    }

    // Get connection status for each result
    const userIds = profiles?.map(p => p.user_id) || [];

    const { data: connections } = await supabase
      .from("connections")
      .select("requester_id, addressee_id, status")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .or(userIds.length > 0 ? `requester_id.in.(${userIds.join(',')}),addressee_id.in.(${userIds.join(',')})` : 'id.eq.null');

    // Build a map of connection statuses
    const connectionMap = new Map<string, { status: string; isRequester: boolean }>();
    connections?.forEach(conn => {
      if (conn.requester_id === userId) {
        connectionMap.set(conn.addressee_id, { status: conn.status, isRequester: true });
      } else if (conn.addressee_id === userId) {
        connectionMap.set(conn.requester_id, { status: conn.status, isRequester: false });
      }
    });

    // Enrich profiles with connection status
    const enrichedProfiles = profiles?.map(profile => ({
      user_id: profile.user_id,
      display_name: profile.display_name,
      bio: profile.bio,
      strong_domains: profile.strong_domains || [],
      specialties: profile.specialties || [],
      years_experience: profile.years_experience,
      certifications: profile.certifications || [],
      open_to_mentoring: profile.open_to_mentoring,
      connection_status: connectionMap.get(profile.user_id)?.status || null,
      is_pending_from_me: connectionMap.get(profile.user_id)?.isRequester && connectionMap.get(profile.user_id)?.status === 'pending'
    })) || [];

    return NextResponse.json({
      profiles: enrichedProfiles,
      has_more: (profiles?.length || 0) === limit
    });

  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
