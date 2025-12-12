import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch hashtag suggestions or trending hashtags
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query")?.trim();
    const trending = searchParams.get("trending") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");

    if (trending) {
      // Get trending hashtags from the last 7 days
      const { data: trendingHashtags, error: trendingError } = await supabase.rpc(
        "get_trending_hashtags",
        { p_limit: limit }
      );

      if (trendingError) {
        console.error("Error fetching trending hashtags:", trendingError);
        return NextResponse.json(
          { error: "Failed to fetch trending hashtags", details: trendingError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        hashtags: (trendingHashtags || []).map((h: any) => ({
          id: h.id,
          name: h.name,
          post_count: h.post_count,
          is_trending: true
        }))
      });
    }

    if (query) {
      // Search hashtags by prefix
      const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, "");

      const { data: hashtags, error: searchError } = await supabase
        .from("hashtags")
        .select("id, name, usage_count")
        .eq("is_archived", false)
        .ilike("normalized_name", `${normalizedQuery}%`)
        .order("usage_count", { ascending: false })
        .limit(limit);

      if (searchError) {
        console.error("Error searching hashtags:", searchError);
        return NextResponse.json(
          { error: "Failed to search hashtags", details: searchError.message },
          { status: 500 }
        );
      }

      // Check if any of these are currently trending
      const { data: trendingNow } = await supabase.rpc("get_trending_hashtags", { p_limit: 10 });
      const trendingIds = new Set((trendingNow || []).map((h: any) => h.id));

      return NextResponse.json({
        hashtags: (hashtags || []).map(h => ({
          id: h.id,
          name: h.name,
          usage_count: h.usage_count,
          is_trending: trendingIds.has(h.id)
        }))
      });
    }

    // No query - return popular hashtags
    const { data: popularHashtags, error: popularError } = await supabase
      .from("hashtags")
      .select("id, name, usage_count")
      .eq("is_archived", false)
      .order("usage_count", { ascending: false })
      .limit(limit);

    if (popularError) {
      console.error("Error fetching popular hashtags:", popularError);
      return NextResponse.json(
        { error: "Failed to fetch hashtags", details: popularError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hashtags: (popularHashtags || []).map(h => ({
        id: h.id,
        name: h.name,
        usage_count: h.usage_count,
        is_trending: false
      }))
    });

  } catch (error: any) {
    console.error("Hashtags fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
