import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Like a post
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const body = await req.json();
    const { user_id } = body;
    const postId = params.postId;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

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
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    const postId = params.postId;

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

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
