import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// Calculate engagement score using hybrid time decay + engagement algorithm
function calculateEngagementScore(
  reactionsCount: number,
  commentsCount: number,
  createdAt: string
): number {
  // Reactions (celebration, thinking, fire, solidarity) + comments (2x weight)
  const engagementScore = reactionsCount + (commentsCount * 2);
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const decayFactor = 0.1;
  const timeDecay = hoursAgo * decayFactor;
  return Math.max(0, engagementScore - timeDecay);
}

// GET - Fetch trending content (posts and hashtags)
export async function GET(req: NextRequest) {
  try {
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // 'posts' | 'hashtags' | 'all'
    const period = searchParams.get("period") || "week"; // 'day' | 'week' | 'month'

    // Calculate date filter based on period
    const periodDays = period === "day" ? 1 : period === "week" ? 7 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const response: {
      trending_posts?: any[];
      trending_hashtags?: any[];
    } = {};

    // Fetch trending posts
    if (type === "posts" || type === "all") {
      // Get posts from the specified period with engagement data
      const { data: posts, error: postsError } = await supabase
        .from("community_posts")
        .select("*")
        .eq("is_deleted", false)
        .gte("created_at", cutoffDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(100); // Fetch more to sort by engagement

      if (postsError) {
        console.error("Error fetching trending posts:", postsError);
        return NextResponse.json(
          { error: "Failed to fetch trending posts", details: postsError.message },
          { status: 500 }
        );
      }

      if (posts && posts.length > 0) {
        // Get author profiles
        const authorIds = [...new Set(posts.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from("community_profiles")
          .select("user_id, display_name, years_experience, avatar_url")
          .in("user_id", authorIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        // Get engagement stats for posts (reactions + comments)
        const postIds = posts.map(p => p.id);
        const statsPromises = postIds.map(async (postId) => {
          const [reactionsCount, commentsCount] = await Promise.all([
            supabase.from("post_reactions").select("id", { count: "exact", head: true }).eq("post_id", postId),
            supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", postId).eq("is_deleted", false)
          ]);
          return {
            post_id: postId,
            reactions_count: reactionsCount.count || 0,
            comments_count: commentsCount.count || 0
          };
        });

        const stats = await Promise.all(statsPromises);
        const statsMap = new Map(stats.map(s => [s.post_id, s]));

        // Get user's reactions for these posts
        const { data: userReactions } = await supabase
          .from("post_reactions")
          .select("post_id, reaction_type")
          .eq("user_id", userId)
          .in("post_id", postIds);

        const userReactionsMap = new Map<string, string[]>();
        (userReactions || []).forEach(r => {
          const existing = userReactionsMap.get(r.post_id) || [];
          existing.push(r.reaction_type);
          userReactionsMap.set(r.post_id, existing);
        });

        // Calculate engagement scores and sort
        const postsWithScores = posts.map(post => {
          const postStats = statsMap.get(post.id);
          const reactionsCount = postStats?.reactions_count || 0;
          const commentsCount = postStats?.comments_count || 0;
          const authorProfile = profileMap.get(post.user_id);

          return {
            id: post.id,
            user_id: post.user_id,
            content: post.content,
            post_type: post.post_type,
            created_at: post.created_at,
            image_url: post.image_url,
            author: authorProfile ? {
              display_name: authorProfile.display_name,
              years_experience: authorProfile.years_experience,
              avatar_url: authorProfile.avatar_url
            } : {
              display_name: "Anonymous",
              years_experience: null,
              avatar_url: null
            },
            reactions_count: reactionsCount,
            comments_count: commentsCount,
            reactions: {
              celebration_count: post.celebration_count || 0,
              thinking_count: post.thinking_count || 0,
              fire_count: post.fire_count || 0,
              solidarity_count: post.solidarity_count || 0
            },
            user_reactions: userReactionsMap.get(post.id) || [],
            engagement_score: calculateEngagementScore(reactionsCount, commentsCount, post.created_at)
          };
        });

        // Filter posts with engagement and sort by score
        const trendingPosts = postsWithScores
          .filter(p => p.engagement_score > 0)
          .sort((a, b) => b.engagement_score - a.engagement_score)
          .slice(0, 20);

        response.trending_posts = trendingPosts;
      } else {
        response.trending_posts = [];
      }
    }

    // Fetch trending hashtags
    if (type === "hashtags" || type === "all") {
      const { data: trendingHashtags, error: hashtagsError } = await supabase.rpc(
        "get_trending_hashtags",
        { p_limit: 10 }
      );

      if (hashtagsError) {
        console.error("Error fetching trending hashtags:", hashtagsError);
        return NextResponse.json(
          { error: "Failed to fetch trending hashtags", details: hashtagsError.message },
          { status: 500 }
        );
      }

      response.trending_hashtags = (trendingHashtags || []).map((h: any) => ({
        id: h.id,
        name: h.name,
        post_count: h.post_count
      }));
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Trending fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
