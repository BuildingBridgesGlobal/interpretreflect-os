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
    const sortBy = searchParams.get("sort") || "recent"; // "recent" | "top" | "following" | "trending"
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");
    const searchQuery = searchParams.get("search")?.trim(); // Search query for content and authors
    const hashtag = searchParams.get("hashtag")?.trim(); // Filter by hashtag

    // If filtering by hashtag, get post IDs first
    let hashtagPostIds: string[] | null = null;
    if (hashtag) {
      const normalizedHashtag = hashtag.toLowerCase().replace(/[^a-z0-9]/g, "");
      const { data: hashtagData } = await supabase
        .from("hashtags")
        .select("id")
        .eq("normalized_name", normalizedHashtag)
        .single();

      if (hashtagData) {
        const { data: postHashtags } = await supabase
          .from("post_hashtags")
          .select("post_id")
          .eq("hashtag_id", hashtagData.id);
        hashtagPostIds = postHashtags?.map(ph => ph.post_id) || [];
      } else {
        // No matching hashtag found - return empty
        hashtagPostIds = [];
      }
    }

    // If searching, first find matching author IDs
    let searchAuthorIds: string[] = [];
    if (searchQuery) {
      const { data: matchingProfiles } = await supabase
        .from("community_profiles")
        .select("user_id")
        .ilike("display_name", `%${searchQuery}%`);

      searchAuthorIds = matchingProfiles?.map(p => p.user_id) || [];
    }

    // Build query for posts (without foreign key join to avoid schema cache issues)
    let query = supabase
      .from("community_posts")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false });

    // For engagement-based sorting, we'll fetch more posts and sort in memory
    // This allows for the hybrid algorithm to work properly
    if (sortBy === "top" || sortBy === "trending") {
      // Fetch more posts for proper engagement ranking
      query = query.limit(100);
      // For trending, only get posts from the last 7 days
      if (sortBy === "trending") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte("created_at", weekAgo.toISOString());
      }
    } else {
      query = query.range(offset, offset + limit - 1);
    }

    // Filter by hashtag if specified
    if (hashtagPostIds !== null) {
      if (hashtagPostIds.length === 0) {
        return NextResponse.json({ posts: [], has_more: false });
      }
      query = query.in("id", hashtagPostIds);
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

    // Apply search filter - match content OR author name
    if (searchQuery) {
      if (searchAuthorIds.length > 0) {
        // Search matches both content and author names - use OR filter
        query = query.or(`content.ilike.%${searchQuery}%,user_id.in.(${searchAuthorIds.join(",")})`);
      } else {
        // No author matches, just search content
        query = query.ilike("content", `%${searchQuery}%`);
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

    const [likesResult, bookmarksResult, reactionsResult] = await Promise.all([
      supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds),
      supabase
        .from("post_bookmarks")
        .select("post_id")
        .eq("user_id", userId)
        .in("post_id", postIds),
      supabase
        .from("post_reactions")
        .select("post_id, reaction_type")
        .eq("user_id", userId)
        .in("post_id", postIds)
    ]);

    const likedPostIds = new Set(likesResult.data?.map(l => l.post_id) || []);
    const bookmarkedPostIds = new Set(bookmarksResult.data?.map(b => b.post_id) || []);

    // Build map of user's reactions per post
    const userReactionsMap = new Map<string, string[]>();
    (reactionsResult.data || []).forEach(r => {
      const existing = userReactionsMap.get(r.post_id) || [];
      existing.push(r.reaction_type);
      userReactionsMap.set(r.post_id, existing);
    });

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
        // Story-telling reactions
        reactions: {
          celebration_count: post.celebration_count || 0,
          thinking_count: post.thinking_count || 0,
          fire_count: post.fire_count || 0,
          solidarity_count: post.solidarity_count || 0
        },
        user_reactions: userReactionsMap.get(post.id) || [],
        // Include engagement score for potential client-side use
        engagement_score: calculateEngagementScore(likesCount, commentsCount, post.created_at)
      };
    });

    // Apply engagement-based sorting for "top" and "trending" sort
    if (sortBy === "top" || sortBy === "trending") {
      // Filter out posts with 0 engagement score (old posts with no engagement)
      // These posts will still appear in "Recent" view, just not in "Top" or "Trending"
      postsWithUserData = postsWithUserData.filter(p => p.engagement_score > 0);
      // Sort by engagement score (highest first)
      postsWithUserData.sort((a, b) => b.engagement_score - a.engagement_score);
      // Apply pagination after sorting
      postsWithUserData = postsWithUserData.slice(offset, offset + limit);
    }

    // Fetch trending hashtags if trending sort is used
    let trendingHashtags: { id: string; name: string; post_count: number }[] | undefined;
    if (sortBy === "trending") {
      const { data: hashtagsData } = await supabase.rpc("get_trending_hashtags", { p_limit: 5 });
      trendingHashtags = (hashtagsData || []).map((h: any) => ({
        id: h.id,
        name: h.name,
        post_count: h.post_count
      }));
    }

    return NextResponse.json({
      posts: postsWithUserData,
      has_more: (sortBy === "top" || sortBy === "trending") ? posts.length > offset + limit : posts.length === limit,
      sort: sortBy,
      ...(trendingHashtags && { trending_hashtags: trendingHashtags })
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

    // Process hashtags from content
    try {
      await supabase.rpc("process_post_hashtags", {
        p_post_id: post.id,
        p_content: content
      });
    } catch (hashtagError) {
      console.error("Error processing hashtags:", hashtagError);
      // Don't fail the request - hashtag processing is not critical
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
        bookmarked_by_user: false,
        reactions: {
          celebration_count: 0,
          thinking_count: 0,
          fire_count: 0,
          solidarity_count: 0
        },
        user_reactions: []
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

// PATCH - Update a post (only owner can update)
export async function PATCH(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const body = await req.json();
    const { post_id, content, post_type, ecci_domains, setting_tags } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 }
      );
    }

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

    // Verify the user owns this post
    const { data: post, error: fetchError } = await supabase
      .from("community_posts")
      .select("id, user_id")
      .eq("id", post_id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    if (post.user_id !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own posts" },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: Record<string, any> = {
      content,
      is_edited: true
    };

    if (post_type) updateData.post_type = post_type;
    if (ecci_domains) updateData.ecci_domains = ecci_domains;
    if (setting_tags) updateData.setting_tags = setting_tags;

    // Update the post
    const { data: updatedPost, error: updateError } = await supabase
      .from("community_posts")
      .update(updateData)
      .eq("id", post_id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating post:", updateError);
      return NextResponse.json(
        { error: "Failed to update post", details: updateError.message },
        { status: 500 }
      );
    }

    // Re-process hashtags from updated content
    try {
      await supabase.rpc("process_post_hashtags", {
        p_post_id: post_id,
        p_content: content
      });
    } catch (hashtagError) {
      console.error("Error processing hashtags:", hashtagError);
      // Don't fail the request - hashtag processing is not critical
    }

    // Get author info
    const { data: author } = await supabase
      .from("community_profiles")
      .select("display_name, years_experience, strong_domains, open_to_mentoring, avatar_url")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      success: true,
      post: {
        ...updatedPost,
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
        }
      }
    });

  } catch (error: any) {
    console.error("Post update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
