import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Verify the user from the Authorization header
 * Returns the user ID if valid, null otherwise
 */
async function verifyAuthAndGetUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user.id;
}

/**
 * GET /api/agency
 * Get agency dashboard data for an organization
 * SECURITY: Uses session token, not client-provided user_id
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("report");

    // SECURITY: Get user ID from verified session token, NOT from request params
    const userId = await verifyAuthAndGetUser(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - valid session required" },
        { status: 401 }
      );
    }

    // Verify user is an agency admin for THEIR organization
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select(`
        organization_id,
        role,
        organizations (
          id,
          name,
          subscription_tier
        )
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("role", ["admin", "owner", "manager"])
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: "Not authorized to access agency data" },
        { status: 403 }
      );
    }

    const orgId = membership.organization_id;

    // Get all team members - SECURITY: Only from the admin's own organization
    const { data: members } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, role, joined_at, is_active")
      .eq("organization_id", orgId)
      .eq("is_active", true);

    if (!members) {
      return NextResponse.json({
        success: true,
        organization: membership.organizations,
        teamMembers: [],
        credentials: [],
        stats: {
          totalMembers: 0,
          activeCredentials: 0,
          expiringSoon: 0,
          expired: 0,
          avgPrepRate: 0,
          avgDebriefRate: 0,
        },
      });
    }

    const userIds = members.map((m) => m.user_id);

    // Get profiles for all members
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, avatar_url, created_at")
      .in("id", userIds);

    // Get all credentials for team members
    const { data: credentials } = await (supabaseAdmin as any)
      .from("credentials")
      .select("*")
      .in("user_id", userIds)
      .order("expiration_date", { ascending: true });

    // Calculate credential stats
    const now = new Date();
    const credentialStats = {
      active: 0,
      expiringSoon: 0,
      expired: 0,
    };

    const processedCredentials = (credentials || []).map((cred: any) => {
      let status: "active" | "expiring_soon" | "expired" = "active";
      if (cred.expiration_date) {
        const expDate = new Date(cred.expiration_date);
        const daysUntilExpiry = Math.ceil(
          (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilExpiry < 0) {
          status = "expired";
          credentialStats.expired++;
        } else if (daysUntilExpiry <= 90) {
          status = "expiring_soon";
          credentialStats.expiringSoon++;
        } else {
          credentialStats.active++;
        }
      } else {
        credentialStats.active++;
      }

      // Find member profile
      const profile = profiles?.find((p) => p.id === cred.user_id);

      return {
        ...cred,
        status,
        memberName: profile?.full_name || "Unknown",
        memberEmail: profile?.email || "",
      };
    });

    // Get activity stats for each member
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: allAssignments } = await supabaseAdmin
      .from("assignments")
      .select("user_id, completed, debrief_completed")
      .in("user_id", userIds)
      .gte("date", monthStart.toISOString().split("T")[0]);

    // Calculate team averages
    let totalPrepRate = 0;
    let totalDebriefRate = 0;
    let membersWithAssignments = 0;

    const memberStats = members.map((member) => {
      const memberAssignments =
        allAssignments?.filter((a) => a.user_id === member.user_id) || [];
      const total = memberAssignments.length;
      const completed = memberAssignments.filter((a: any) => a.completed).length;
      const debriefed = memberAssignments.filter(
        (a: any) => a.debrief_completed
      ).length;

      const prepRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      const debriefRate = total > 0 ? Math.round((debriefed / total) * 100) : 0;

      if (total > 0) {
        totalPrepRate += prepRate;
        totalDebriefRate += debriefRate;
        membersWithAssignments++;
      }

      const profile = profiles?.find((p) => p.id === member.user_id);

      return {
        ...member,
        profile: profile || {
          full_name: "Unknown",
          email: "",
          avatar_url: null,
          created_at: "",
        },
        activity: {
          assignmentsThisMonth: total,
          prepCompletionRate: prepRate,
          debriefCompletionRate: debriefRate,
        },
        credentials: processedCredentials.filter(
          (c) => c.user_id === member.user_id
        ),
      };
    });

    const avgPrepRate =
      membersWithAssignments > 0
        ? Math.round(totalPrepRate / membersWithAssignments)
        : 0;
    const avgDebriefRate =
      membersWithAssignments > 0
        ? Math.round(totalDebriefRate / membersWithAssignments)
        : 0;

    // If requesting a specific report format
    if (reportType === "credentials-csv") {
      const csvRows = [
        [
          "Interpreter Name",
          "Email",
          "Credential Type",
          "Credential Name",
          "Issuing Organization",
          "Issue Date",
          "Expiration Date",
          "Status",
        ].join(","),
      ];

      processedCredentials.forEach((cred) => {
        csvRows.push(
          [
            `"${cred.memberName}"`,
            `"${cred.memberEmail}"`,
            `"${cred.credential_type || ""}"`,
            `"${cred.credential_name || ""}"`,
            `"${cred.issuing_organization || ""}"`,
            cred.issue_date || "",
            cred.expiration_date || "",
            cred.status,
          ].join(",")
        );
      });

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="credentials-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    if (reportType === "roster-csv") {
      const csvRows = [
        [
          "Name",
          "Email",
          "Role",
          "Joined Date",
          "Assignments This Month",
          "Prep Rate",
          "Debrief Rate",
          "Active Credentials",
          "Expiring Credentials",
          "Expired Credentials",
        ].join(","),
      ];

      memberStats.forEach((member) => {
        const activeCreds = member.credentials.filter(
          (c: any) => c.status === "active"
        ).length;
        const expiringCreds = member.credentials.filter(
          (c: any) => c.status === "expiring_soon"
        ).length;
        const expiredCreds = member.credentials.filter(
          (c: any) => c.status === "expired"
        ).length;

        csvRows.push(
          [
            `"${member.profile.full_name}"`,
            `"${member.profile.email}"`,
            member.role,
            member.joined_at?.split("T")[0] || "",
            member.activity.assignmentsThisMonth,
            `${member.activity.prepCompletionRate}%`,
            `${member.activity.debriefCompletionRate}%`,
            activeCreds,
            expiringCreds,
            expiredCreds,
          ].join(",")
        );
      });

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="roster-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      organization: membership.organizations,
      teamMembers: memberStats,
      credentials: processedCredentials,
      stats: {
        totalMembers: members.length,
        activeCredentials: credentialStats.active,
        expiringSoon: credentialStats.expiringSoon,
        expired: credentialStats.expired,
        avgPrepRate,
        avgDebriefRate,
        totalAssignmentsThisMonth:
          allAssignments?.length || 0,
      },
    });
  } catch (error: any) {
    console.error("Agency data fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agency
 * Create an organization or send invitations
 * SECURITY: Uses session token, not client-provided user_id
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Get user ID from verified session token, NOT from request body
    const userId = await verifyAuthAndGetUser(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - valid session required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, ...data } = body;

    // Verify user is an agency admin for THEIR organization
    const { data: membership } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("role", ["admin", "owner", "manager"])
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: "Not authorized - must be organization admin" },
        { status: 403 }
      );
    }

    if (action === "invite") {
      const { email, role = "member" } = data;

      if (!email) {
        return NextResponse.json(
          { error: "email is required for invitations" },
          { status: 400 }
        );
      }

      // Check if already invited
      const { data: existing } = await supabaseAdmin
        .from("organization_invitations")
        .select("id")
        .eq("organization_id", membership.organization_id)
        .eq("email", email.toLowerCase())
        .eq("status", "pending")
        .single();

      if (existing) {
        return NextResponse.json(
          { error: "Invitation already sent to this email" },
          { status: 400 }
        );
      }

      // Check if already a member
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", email.toLowerCase())
        .single();

      if (existingProfile) {
        const { data: existingMember } = await supabaseAdmin
          .from("organization_members")
          .select("id")
          .eq("organization_id", membership.organization_id)
          .eq("user_id", existingProfile.id)
          .single();

        if (existingMember) {
          return NextResponse.json(
            { error: "User is already a member of this organization" },
            { status: 400 }
          );
        }
      }

      // Create invitation
      const { data: invitation, error: inviteError } = await supabaseAdmin
        .from("organization_invitations")
        .insert({
          organization_id: membership.organization_id,
          email: email.toLowerCase(),
          role,
          status: "pending",
          invited_by: userId,
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Error creating invitation:", inviteError);
        return NextResponse.json(
          { error: "Failed to create invitation" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        invitation,
        message: `Invitation sent to ${email}`,
      });
    }

    if (action === "remove_member") {
      const { member_id } = data;

      if (!member_id) {
        return NextResponse.json(
          { error: "member_id is required" },
          { status: 400 }
        );
      }

      // SECURITY: Can only remove members from YOUR organization
      const { error: removeError } = await supabaseAdmin
        .from("organization_members")
        .update({
          is_active: false,
          left_at: new Date().toISOString(),
        })
        .eq("id", member_id)
        .eq("organization_id", membership.organization_id);

      if (removeError) {
        console.error("Error removing member:", removeError);
        return NextResponse.json(
          { error: "Failed to remove member" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Member removed from organization",
      });
    }

    if (action === "update_member_role") {
      const { member_id, new_role } = data;

      if (!member_id || !new_role) {
        return NextResponse.json(
          { error: "member_id and new_role are required" },
          { status: 400 }
        );
      }

      const validRoles = ["owner", "admin", "manager", "member"];
      if (!validRoles.includes(new_role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      // SECURITY: Can only update roles within YOUR organization
      const { error: updateError } = await supabaseAdmin
        .from("organization_members")
        .update({ role: new_role })
        .eq("id", member_id)
        .eq("organization_id", membership.organization_id);

      if (updateError) {
        console.error("Error updating member role:", updateError);
        return NextResponse.json(
          { error: "Failed to update member role" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Member role updated",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Agency action error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
