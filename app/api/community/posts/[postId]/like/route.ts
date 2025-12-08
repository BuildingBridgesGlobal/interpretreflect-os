import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// POST - Like a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const user_id = user!.id;
    const postId = params.postId;

    // Insert like (will fail if already exists due to UNIQUE constraint)
    const { error: likeError } = await supabase
      .from("post_likes")
      .insert({
        post_id: postId,
        user_id
      });

    if (likeError) {
      // Check if it's a duplicate key error (already liked)
      if (likeError.code === "23505") {
        return NextResponse.json(
          { error: "Post already liked" },
          { status: 400 }
        );
      }
      console.error("Error liking post:", likeError);
      return NextResponse.json(
        { error: "Failed to like post" },
        { status: 500 }
      );
    }

    // Get updated like count
    const { data: post } = await supabase
      .from("community_posts")
      .select("likes_count")
      .eq("id", postId)
      .single();

    return NextResponse.json({
      success: true,
      likes_count: post?.likes_count || 0
    });

  } catch (error: any) {
    console.error("Like post error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Unlike a post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;
    const postId = params.postId;

    // Delete like
    const { error: unlikeError } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (unlikeError) {
      console.error("Error unliking post:", unlikeError);
      return NextResponse.json(
        { error: "Failed to unlike post" },
        { status: 500 }
      );
    }

    // Get updated like count
    const { data: post } = await supabase
      .from("community_posts")
      .select("likes_count")
      .eq("id", postId)
      .single();

    return NextResponse.json({
      success: true,
      likes_count: post?.likes_count || 0
    });

  } catch (error: any) {
    console.error("Unlike post error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
