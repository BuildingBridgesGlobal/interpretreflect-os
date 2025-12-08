import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

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
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query for posts with author info from community_profiles
    let query = supabase
      .from("community_posts")
      .select(`
        *,
        author:community_profiles!community_posts_user_id_fkey(
          display_name,
          years_experience,
          strong_domains,
          open_to_mentoring
        )
      `)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postType) {
      query = query.eq("post_type", postType);
    }

    if (domain) {
      query = query.contains("ecci_domains", [domain]);
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
    const postsWithUserData = posts.map(post => {
      const postStats = statsMap.get(post.id);
      return {
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        post_type: post.post_type,
        ecci_domains: post.ecci_domains || [],
        setting_tags: post.setting_tags || [],
        is_edited: post.is_edited,
        created_at: post.created_at,
        author: post.author || {
          display_name: "Anonymous",
          years_experience: 0,
          strong_domains: [],
          open_to_mentoring: false
        },
        likes_count: postStats?.likes_count || 0,
        comments_count: postStats?.comments_count || 0,
        liked_by_user: likedPostIds.has(post.id),
        bookmarked_by_user: bookmarkedPostIds.has(post.id)
      };
    });

    return NextResponse.json({
      posts: postsWithUserData,
      has_more: posts.length === limit
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
      setting_tags = []
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
        setting_tags
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
      .select("display_name, years_experience, strong_domains, open_to_mentoring")
      .eq("user_id", user_id)
      .single();

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        author: author || {
          display_name: "Anonymous",
          years_experience: 0,
          strong_domains: [],
          open_to_mentoring: false
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
