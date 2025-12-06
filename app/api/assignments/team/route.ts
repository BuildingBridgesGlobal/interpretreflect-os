import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const supabase = supabaseAdmin;

// GET - Get team members for an assignment
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignment_id");

    if (!assignmentId) {
      return NextResponse.json(
        { error: "assignment_id is required" },
        { status: 400 }
      );
    }

    // Get team members with profile info
    const { data: teamMembers, error } = await supabase
      .from("assignment_team_members")
      .select(`
        id,
        user_id,
        role,
        status,
        invited_by,
        invited_at,
        confirmed_at,
        can_edit_assignment,
        can_invite_others
      `)
      .eq("assignment_id", assignmentId);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch team members", details: error.message },
        { status: 500 }
      );
    }

    // Enrich with profile data
    if (teamMembers && teamMembers.length > 0) {
      const userIds = teamMembers.map(m => m.user_id);

      // Get from profiles table
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      // Also get community profiles for display names
      const { data: communityProfiles } = await supabase
        .from("community_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const enrichedMembers = teamMembers.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        const communityProfile = communityProfiles?.find(p => p.user_id === member.user_id);

        return {
          ...member,
          full_name: communityProfile?.display_name || profile?.full_name || profile?.email?.split("@")[0] || "Unknown",
          email: profile?.email
        };
      });

      return NextResponse.json({
        success: true,
        teamMembers: enrichedMembers
      });
    }

    return NextResponse.json({
      success: true,
      teamMembers: []
    });
  } catch (error: any) {
    console.error("Team members fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Invite a team member to an assignment
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      assignment_id,
      user_id,
      invited_by,
      role = "team"
    } = body;

    // Validate required fields
    if (!assignment_id || !user_id || !invited_by) {
      return NextResponse.json(
        { error: "Missing required fields: assignment_id, user_id, invited_by" },
        { status: 400 }
      );
    }

    // Check if assignment exists and is a team assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from("assignments")
      .select("id, is_team_assignment, user_id")
      .eq("id", assignment_id)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // If not already a team assignment, update it
    if (!assignment.is_team_assignment) {
      await supabase
        .from("assignments")
        .update({ is_team_assignment: true, team_size: 2 })
        .eq("id", assignment_id);
    }

    // Check if user is already a team member
    const { data: existingMember } = await supabase
      .from("assignment_team_members")
      .select("id, status")
      .eq("assignment_id", assignment_id)
      .eq("user_id", user_id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a team member", existingStatus: existingMember.status },
        { status: 400 }
      );
    }

    // Create team member invitation
    const { data: teamMember, error: insertError } = await supabase
      .from("assignment_team_members")
      .insert({
        assignment_id,
        user_id,
        role,
        status: "invited",
        invited_by,
        invited_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating team member:", insertError);
      return NextResponse.json(
        { error: "Failed to invite team member", details: insertError.message },
        { status: 500 }
      );
    }

    // Update team size
    const { data: memberCount } = await supabase
      .from("assignment_team_members")
      .select("id", { count: "exact" })
      .eq("assignment_id", assignment_id);

    if (memberCount) {
      await supabase
        .from("assignments")
        .update({ team_size: memberCount.length })
        .eq("id", assignment_id);
    }

    return NextResponse.json({
      success: true,
      teamMember,
      message: "Team member invited successfully"
    });
  } catch (error: any) {
    console.error("Team member invite error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update team member status (accept/decline invitation)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      team_member_id,
      user_id,
      status, // "confirmed" or "declined"
      role
    } = body;

    if (!team_member_id || !user_id) {
      return NextResponse.json(
        { error: "Missing required fields: team_member_id, user_id" },
        { status: 400 }
      );
    }

    // Verify the team member belongs to this user
    const { data: existingMember, error: fetchError } = await supabase
      .from("assignment_team_members")
      .select("*")
      .eq("id", team_member_id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !existingMember) {
      return NextResponse.json(
        { error: "Team membership not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "confirmed") {
        updateData.confirmed_at = new Date().toISOString();
      }
    }
    if (role) {
      updateData.role = role;
    }

    const { data: updatedMember, error: updateError } = await supabase
      .from("assignment_team_members")
      .update(updateData)
      .eq("id", team_member_id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update team membership", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      teamMember: updatedMember
    });
  } catch (error: any) {
    console.error("Team member update error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove a team member from assignment
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamMemberId = searchParams.get("team_member_id");
    const removedBy = searchParams.get("removed_by");

    if (!teamMemberId || !removedBy) {
      return NextResponse.json(
        { error: "team_member_id and removed_by are required" },
        { status: 400 }
      );
    }

    // Get the team member to check permissions
    const { data: teamMember, error: fetchError } = await supabase
      .from("assignment_team_members")
      .select("*, assignments!inner(user_id)")
      .eq("id", teamMemberId)
      .single();

    if (fetchError || !teamMember) {
      return NextResponse.json(
        { error: "Team membership not found" },
        { status: 404 }
      );
    }

    // Only assignment owner or the member themselves can remove
    const assignment = (teamMember as any).assignments;
    if (assignment.user_id !== removedBy && teamMember.user_id !== removedBy) {
      return NextResponse.json(
        { error: "Not authorized to remove this team member" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("assignment_team_members")
      .delete()
      .eq("id", teamMemberId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to remove team member", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Team member removed successfully"
    });
  } catch (error: any) {
    console.error("Team member delete error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
