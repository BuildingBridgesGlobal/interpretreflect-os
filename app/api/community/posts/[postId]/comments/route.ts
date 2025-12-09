import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// GET - Fetch comments for a post (with nested replies, likes, sorted by most liked)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    // Fetch all comments for this post (non-deleted)
    const { data: comments, error: commentsError } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return NextResponse.json(
        { error: "Failed to fetch comments", details: commentsError.message },
        { status: 500 }
      );
    }

    if (!comments || comments.length === 0) {
      return NextResponse.json({ comments: [] });
    }

    // Fetch author profiles separately
    const authorIds = [...new Set(comments.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from("community_profiles")
      .select("user_id, display_name, years_experience, avatar_url")
      .in("user_id", authorIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Get comment IDs for fetching likes
    const commentIds = comments.map(c => c.id);

    // Fetch likes counts for all comments
    let likesCountMap = new Map<string, number>();
    let userLikedCommentsSet = new Set<string>();

    try {
      // Get like counts per comment
      const { data: likeCounts } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      if (likeCounts) {
        // Count likes per comment
        likeCounts.forEach((like: { comment_id: string }) => {
          const count = likesCountMap.get(like.comment_id) || 0;
          likesCountMap.set(like.comment_id, count + 1);
        });
      }

      // Get user's likes
      const { data: userLikes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", userId)
        .in("comment_id", commentIds);

      if (userLikes) {
        userLikes.forEach((like: { comment_id: string }) => {
          userLikedCommentsSet.add(like.comment_id);
        });
      }
    } catch (likesError) {
      // comment_likes table might not exist yet - continue without likes
      console.log("Comment likes table may not exist yet:", likesError);
    }

    // Transform comments with author info and likes
    const commentsWithData = comments.map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      is_edited: comment.is_edited,
      created_at: comment.created_at,
      author: profileMap.get(comment.user_id) || {
        display_name: "Anonymous",
        years_experience: null,
        avatar_url: null
      },
      likes_count: likesCountMap.get(comment.id) || 0,
      liked_by_user: userLikedCommentsSet.has(comment.id)
    }));

    // Organize into tree structure - top-level comments and their replies
    const topLevelComments = commentsWithData.filter(c => !c.parent_comment_id);
    const replies = commentsWithData.filter(c => c.parent_comment_id);

    // Group replies by parent
    const repliesByParent = new Map<string, typeof commentsWithData>();
    replies.forEach(reply => {
      const parentId = reply.parent_comment_id!;
      if (!repliesByParent.has(parentId)) {
        repliesByParent.set(parentId, []);
      }
      repliesByParent.get(parentId)!.push(reply);
    });

    // Sort replies by likes (most liked first)
    repliesByParent.forEach((replyList, parentId) => {
      replyList.sort((a, b) => b.likes_count - a.likes_count);
      repliesByParent.set(parentId, replyList);
    });

    // Attach replies to their parent comments
    const commentsTree = topLevelComments.map(comment => ({
      ...comment,
      replies: repliesByParent.get(comment.id) || []
    }));

    // Sort top-level comments by likes (most liked first)
    commentsTree.sort((a, b) => b.likes_count - a.likes_count);

    return NextResponse.json({
      comments: commentsTree,
      total_count: comments.length
    });

  } catch (error: any) {
    console.error("Fetch comments error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new comment or reply
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content, parent_comment_id } = body;

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Content exceeds 1000 character limit" },
        { status: 400 }
      );
    }

    // Verify the post exists
    const { data: post, error: postError } = await supabase
      .from("community_posts")
      .select("id")
      .eq("id", postId)
      .eq("is_deleted", false)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "Post not found" },
        { status: 404 }
      );
    }

    // If this is a reply, verify parent comment exists
    if (parent_comment_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from("post_comments")
        .select("id")
        .eq("id", parent_comment_id)
        .eq("post_id", postId)
        .eq("is_deleted", false)
        .single();

      if (parentError || !parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
      }
    }

    // Create the comment
    const { data: comment, error: createError } = await supabase
      .from("post_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        content,
        parent_comment_id: parent_comment_id || null
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating comment:", createError);
      return NextResponse.json(
        { error: "Failed to create comment", details: createError.message },
        { status: 500 }
      );
    }

    // Get author info
    const { data: author } = await supabase
      .from("community_profiles")
      .select("display_name, years_experience, avatar_url")
      .eq("user_id", userId)
      .single();

    return NextResponse.json({
      success: true,
      comment: {
        ...comment,
        author: author || {
          display_name: "Anonymous",
          years_experience: null,
          avatar_url: null
        },
        likes_count: 0,
        liked_by_user: false,
        replies: []
      }
    });

  } catch (error: any) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Like/unlike a comment
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { postId } = await params;
    const body = await req.json();
    const { comment_id, action } = body; // action: 'like' or 'unlike'

    if (!postId || !comment_id) {
      return NextResponse.json(
        { error: "postId and comment_id are required" },
        { status: 400 }
      );
    }

    if (!['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: "action must be 'like' or 'unlike'" },
        { status: 400 }
      );
    }

    // Verify the comment exists
    const { data: comment, error: commentError } = await supabase
      .from("post_comments")
      .select("id")
      .eq("id", comment_id)
      .eq("post_id", postId)
      .eq("is_deleted", false)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (action === 'like') {
      // Add like
      const { error: likeError } = await supabase
        .from("comment_likes")
        .insert({
          comment_id,
          user_id: userId
        });

      if (likeError) {
        // If it's a unique constraint violation, the user already liked it
        if (likeError.code === '23505') {
          return NextResponse.json({
            success: true,
            message: "Already liked",
            liked: true
          });
        }
        console.error("Error liking comment:", likeError);
        return NextResponse.json(
          { error: "Failed to like comment", details: likeError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Comment liked",
        liked: true
      });
    } else {
      // Remove like
      const { error: unlikeError } = await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", comment_id)
        .eq("user_id", userId);

      if (unlikeError) {
        console.error("Error unliking comment:", unlikeError);
        return NextResponse.json(
          { error: "Failed to unlike comment", details: unlikeError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Comment unliked",
        liked: false
      });
    }

  } catch (error: any) {
    console.error("Like/unlike comment error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete a comment (only owner can delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const { postId } = await params;
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get("comment_id");

    if (!postId || !commentId) {
      return NextResponse.json(
        { error: "postId and comment_id are required" },
        { status: 400 }
      );
    }

    // Verify the user owns this comment
    const { data: comment, error: fetchError } = await supabase
      .from("post_comments")
      .select("id, user_id")
      .eq("id", commentId)
      .eq("post_id", postId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (comment.user_id !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Soft delete the comment
    const { error: deleteError } = await supabase
      .from("post_comments")
      .update({ is_deleted: true })
      .eq("id", commentId);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete comment", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully"
    });

  } catch (error: any) {
    console.error("Delete comment error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
