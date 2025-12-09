import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// Calculate engagement score for a post using hybrid time decay + engagement algorithm
function calculateEngagementScore(
  likesCount: number,
  commentsCount: number,
  createdAt: string
): number {
  // Engagement weight: comments are worth 2x likes (encourage discussion)
  const engagementScore = likesCount + (commentsCount * 2);

  // Time decay: posts lose points over time
  // Using a decay factor that gives new posts a fair chance
  const hoursAgo = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  const decayFactor = 0.1; // Subtle decay - posts don't disappear quickly
  const timeDecay = hoursAgo * decayFactor;

  // Base score ensures new posts with 0 engagement still appear
  // Formula: engagement - time_decay, with minimum of 0
  const score = Math.max(0, engagementScore - timeDecay);

  return score;
}

// GET - Fetch feed posts
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const postType = searchParams.get("post_type");
    const domain = searchParams.get("domain");
    const authorId = searchParams.get("author_id"); // Filter by specific author (for "My Posts")
    const filterByAuthorIds = searchParams.get("author_ids"); // Filter by multiple authors (for "Friends Feed")
    const sortBy = searchParams.get("sort") || "recent"; // "recent" | "top" | "following"
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query for posts (without foreign key join to avoid schema cache issues)
    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // For engagement-based sorting, we'll fetch more posts and sort in memory
    // This allows for the hybrid algorithm to work properly
    if (sortBy === "top") {
      // Fetch more posts for proper engagement ranking
      query = query.limit(100);
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    if (postType) {
      query = query.eq("post_type", postType);
    }

    if (domain) {
      query = query.contains("ecci_domains", [domain]);
    }

    if (authorId) {
      query = query.eq("user_id", authorId);
    } else if (filterByAuthorIds || sortBy === "following") {
      // Filter by multiple author IDs (comma-separated)
      // For "following" sort, we use the friend IDs from the request
      const friendIds = filterByAuthorIds?.split(",").filter(id => id.trim()) || [];
      if (friendIds.length > 0) {
        query = query.in("user_id", friendIds);
      }
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 }
      );
    }

    if (!posts || posts.length === 0) {
      return NextResponse.json({ posts: [], has_more: false });
    }

    // Fetch author profiles separately
    const authorIds = [...new Set(posts.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from("community_profiles")
      .select("user_id, display_name, years_experience, strong_domains, open_to_mentoring, avatar_url")
      .in("user_id", authorIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get user's likes and bookmarks for these posts
    const postIds = posts.map(p => p.id);

    const [likesResult, bookmarksResult] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds),
      supabase
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds)
    ]);

    const likedPostIds = new Set(likesResult.data?.map(l => l.post_id) || []);
    const bookmarkedPostIds = new Set(bookmarksResult.data?.map(b => b.post_id) || []);

    // Get counts for each post
    const statsPromises = postIds.map(async (postId) => {
      const [likesCount, commentsCount] = await Promise.all([
        supabase.from("post_likes").select("id", { count: "exact", head: true }).eq("post_id", postId),
        supabase.from("post_comments").select("id", { count: "exact", head: true }).eq("post_id", postId).eq("is_deleted", false)
      ]);
      return {
        post_id: postId,
        likes_count: likesCount.count || 0,
        comments_count: commentsCount.count || 0
      };
    });

    const stats = await Promise.all(statsPromises);
    const statsMap = new Map(stats.map(s => [s.post_id, s]));

    // Combine data
    let postsWithUserData = posts.map(post => {
      const postStats = statsMap.get(post.id);
      const authorProfile = profileMap.get(post.user_id);
      const likesCount = postStats?.likes_count || 0;
      const commentsCount = postStats?.comments_count || 0;

      return {
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        post_type: post.post_type,
        ecci_domains: post.ecci_domains || [],
        setting_tags: post.setting_tags || [],
        is_edited: post.is_edited,
        created_at: post.created_at,
        image_url: post.image_url || null,
        author: authorProfile ? {
          display_name: authorProfile.display_name,
          years_experience: authorProfile.years_experience,
          strong_domains: authorProfile.strong_domains || [],
          open_to_mentoring: authorProfile.open_to_mentoring || false,
          avatar_url: authorProfile.avatar_url || null
        } : {
          display_name: "Anonymous",
          years_experience: null,
          strong_domains: [],
          open_to_mentoring: false,
          avatar_url: null
        },
        likes_count: likesCount,
        comments_count: commentsCount,
        liked_by_user: likedPostIds.has(post.id),
        bookmarked_by_user: bookmarkedPostIds.has(post.id),
        // Include engagement score for potential client-side use
        engagement_score: calculateEngagementScore(likesCount, commentsCount, post.created_at)
      };
    });

    // Apply engagement-based sorting for "top" sort
    if (sortBy === "top") {
      // Filter out posts with 0 engagement score (old posts with no engagement)
      // These posts will still appear in "Recent" view, just not in "Top"
      postsWithUserData = postsWithUserData.filter(p => p.engagement_score > 0);
      // Sort by engagement score (highest first)
      postsWithUserData.sort((a, b) => b.engagement_score - a.engagement_score);
      // Apply pagination after sorting
      postsWithUserData = postsWithUserData.slice(offset, offset + limit);
    }

    return NextResponse.json({
      posts: postsWithUserData,
      has_more: sortBy === "top" ? posts.length > offset + limit : posts.length === limit,
      sort: sortBy
    });

  } catch (error: any) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new post
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const user_id = user!.id;

    const body = await req.json();
    const {
      content,
      post_type = "general",
      ecci_domains = [],
      setting_tags = [],
      image_url = null
    } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Content exceeds 2000 character limit" },
        { status: 400 }
      );
    }

    // Create the post
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .insert({
        user_id,
        content,
        post_type,
        ecci_domains,
        setting_tags,
        image_url
      })
      .select()
      .single();

    if (postError) {
      console.error("Error creating post:", postError);
      return NextResponse.json(
        { error: "Failed to create post", details: postError.message },
        { status: 500 }
      );
    }

    // Get author info
    const { data: author } = await supabase
      .from("community_profiles")
      .select("display_name, years_experience, strong_domains, open_to_mentoring, avatar_url")
      .eq("user_id", user_id)
      .single();

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        author: author ? {
          display_name: author.display_name,
          years_experience: author.years_experience || 0,
          strong_domains: author.strong_domains || [],
          open_to_mentoring: author.open_to_mentoring || false,
          avatar_url: author.avatar_url || null
        } : {
          display_name: "Anonymous",
          years_experience: 0,
          strong_domains: [],
          open_to_mentoring: false,
          avatar_url: null
        },
        likes_count: 0,
        comments_count: 0,
        liked_by_user: false,
        bookmarked_by_user: false
      }
    });

  } catch (error: any) {
    console.error("Post creation error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a post (only owner can delete)
export async function DELETE(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("post_id");

    if (!postId) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

    // Verify the user owns this post
    const { data: post, error: fetchError } = await supabase
      .from("community_posts")
      .select("id, user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.user_id !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own posts" },
        { status: 403 }
      );
    }

    // Soft delete the post
    const { error: deleteError } = await supabase
      .from("community_posts")
      .update({ is_deleted: true })
      .eq("id", postId);

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete post", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Post deleted successfully"
    });

  } catch (error: any) {
    console.error("Post deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
