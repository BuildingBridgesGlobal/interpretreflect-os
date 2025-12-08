import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch connection/mentorship suggestions based on ECCI gaps
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "connections"; // 'connections' or 'mentors'
    const limit = parseInt(searchParams.get("limit") || "5");

    // Get user's community profile (includes weak/strong domains)
    const { data: userProfile } = await supabase
      .from("community_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const weakDomains = userProfile?.weak_domains || [];
    const seekingMentor = userProfile?.seeking_mentor || false;

    // Get existing connections and pending requests
    const { data: existingConnections } = await supabase
      .from("connections")
      .select("requester_id, addressee_id")
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .in("status", ["accepted", "pending"]);

    const connectedUserIds = new Set([
      ...(existingConnections?.map(c => c.requester_id) || []),
      ...(existingConnections?.map(c => c.addressee_id) || [])
    ].filter(id => id !== userId));

    // Build query for suggestions
    let query = supabase
      .from("community_profiles")
      .select("*")
      .eq("is_searchable", true)
      .neq("user_id", userId);

    // If looking for mentors specifically
    if (type === 'mentors') {
      query = query.eq("open_to_mentoring", true);
    }

    const { data: profiles, error: profilesError } = await query.limit(limit * 5);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch suggestions", details: profilesError.message },
        { status: 500 }
      );
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Filter out already connected users and score suggestions
    const scoredSuggestions = profiles
      .filter(profile => !connectedUserIds.has(profile.user_id))
      .map(profile => {
        let score = 0;
        let reason = "";

        // Score based on domain matching
        const profileStrengths = profile.strong_domains || [];

        if (type === 'mentors' && weakDomains.length > 0) {
          // For mentor matching: find mentors strong in user's weak areas
          const matchingDomains = profileStrengths.filter((d: string) =>
            weakDomains.includes(d)
          );

          if (matchingDomains.length > 0) {
            score += matchingDomains.length * 30;
            reason = `Strong in ${matchingDomains[0]} - your growth area`;
          }
        } else {
          // For general connections: diverse skills and experience
          score += profile.years_experience * 2;

          if (profile.open_to_mentoring) {
            score += 10;
            reason = "Open to mentoring";
          }

          // Bonus for shared specialties
          const userSpecialties = userProfile?.specialties || [];
          const sharedSpecialties = (profile.specialties || []).filter((s: string) =>
            userSpecialties.includes(s)
          );
          if (sharedSpecialties.length > 0) {
            score += sharedSpecialties.length * 15;
            reason = `Also specializes in ${sharedSpecialties[0]}`;
          }
        }

        return {
          id: profile.id,
          user_id: profile.user_id,
          display_name: profile.display_name,
          bio: profile.bio,
          strong_domains: profile.strong_domains,
          specialties: profile.specialties,
          years_experience: profile.years_experience,
          open_to_mentoring: profile.open_to_mentoring,
          match_score: score,
          reason
        };
      })
      .filter(s => s.match_score > 0 || s.reason)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, limit);

    return NextResponse.json({
      suggestions: scoredSuggestions
    });

  } catch (error: any) {
    console.error("Suggestions fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
