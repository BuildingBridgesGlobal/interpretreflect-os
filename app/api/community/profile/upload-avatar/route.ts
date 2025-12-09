import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateAuth } from "@/lib/apiAuth";

const supabase = supabaseAdmin;

// POST - Upload avatar for profile
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB for avatars)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2MB" },
        { status: 400 }
      );
    }

    // Generate unique filename - use user ID as folder for easy management
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Delete old avatar if exists (clean up old files)
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload avatar", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    // Update community_profiles with new avatar URL
    const { error: updateError } = await supabase
      .from("community_profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
    });

  } catch (error: any) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove avatar
export async function DELETE(req: NextRequest) {
  try {
    // Validate authentication
    const { user, error: authError } = await validateAuth(req);
    if (authError) return authError;
    const userId = user!.id;

    // Delete all files in user's avatar folder
    const { data: existingFiles } = await supabase.storage
      .from("avatars")
      .list(userId);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      await supabase.storage.from("avatars").remove(filesToDelete);
    }

    // Update community_profiles to remove avatar URL
    const { error: updateError } = await supabase
      .from("community_profiles")
      .update({ avatar_url: null })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update profile", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully"
    });

  } catch (error: any) {
    console.error("Avatar delete error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
