import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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
          subscription_tier,
          settings
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
    // Include membership id for remove action, status for filtering, and data_sharing_preferences
    const { data: members } = await supabaseAdmin
      .from("organization_members")
      .select("id, user_id, role, joined_at, is_active, status, removed_at, data_sharing_preferences")
      .eq("organization_id", orgId)
      .in("status", ["active", "pending"]); // Only show active and pending members by default

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
    // SECURITY: Filter by organization_id to ensure only this agency's credentials
    const { data: credentials } = await (supabaseAdmin as any)
      .from("credentials")
      .select("*")
      .in("user_id", userIds)
      .eq("organization_id", orgId)
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
    // SECURITY: Filter by BOTH user_id AND organization_id to ensure
    // we only count assignments that belong to THIS agency
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const { data: allAssignments } = await supabaseAdmin
      .from("assignments")
      .select("user_id, completed, debrief_completed, organization_id")
      .in("user_id", userIds)
      .eq("organization_id", orgId)
      .gte("date", monthStart.toISOString().split("T")[0]);

    // Calculate team averages (only including members who share their data)
    let totalPrepRate = 0;
    let totalDebriefRate = 0;
    let membersWithPrepShared = 0;
    let membersWithDebriefShared = 0;

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

      // Get interpreter's data sharing preferences for average calculation
      const prefs = (member as any).data_sharing_preferences || {
        share_prep_completion: true,
        share_debrief_completion: true,
        share_credential_status: true,
        share_checkin_streaks: true,
        share_module_progress: true,
      };

      // Only include in averages if member has assignments AND shares that data type
      if (total > 0) {
        if (prefs.share_prep_completion) {
          totalPrepRate += prepRate;
          membersWithPrepShared++;
        }
        if (prefs.share_debrief_completion) {
          totalDebriefRate += debriefRate;
          membersWithDebriefShared++;
        }
      }

      const profile = profiles?.find((p) => p.id === member.user_id);

      // Filter credentials based on share_credential_status preference
      const memberCredentials = prefs.share_credential_status
        ? processedCredentials.filter((c) => c.user_id === member.user_id)
        : []; // Return empty array if interpreter opted out

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
          // Only show prep rate if interpreter allows it
          prepCompletionRate: prefs.share_prep_completion ? prepRate : null,
          // Only show debrief rate if interpreter allows it
          debriefCompletionRate: prefs.share_debrief_completion ? debriefRate : null,
        },
        // Include preferences so frontend knows what's hidden
        dataSharing: {
          prep: prefs.share_prep_completion,
          debrief: prefs.share_debrief_completion,
          credentials: prefs.share_credential_status,
          checkins: prefs.share_checkin_streaks,
          modules: prefs.share_module_progress,
        },
        credentials: memberCredentials,
      };
    });

    const avgPrepRate =
      membersWithPrepShared > 0
        ? Math.round(totalPrepRate / membersWithPrepShared)
        : 0;
    const avgDebriefRate =
      membersWithDebriefShared > 0
        ? Math.round(totalDebriefRate / membersWithDebriefShared)
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
            member.activity.prepCompletionRate !== null ? `${member.activity.prepCompletionRate}%` : "N/A",
            member.activity.debriefCompletionRate !== null ? `${member.activity.debriefCompletionRate}%` : "N/A",
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

    // PDF Report: Credential Status Report
    if (reportType === "credentials-pdf") {
      const today = new Date();
      const org = membership.organizations as any;
      const orgName = org?.name || "Organization";

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Credential Status Report - ${orgName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #0d9488; font-size: 24px; margin-bottom: 5px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #0f172a; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tr:nth-child(even) { background: #f8fafc; }
    .status-active { color: #059669; font-weight: bold; }
    .status-expiring { color: #d97706; font-weight: bold; }
    .status-expired { color: #dc2626; font-weight: bold; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    .summary { background: #f0fdfa; border: 1px solid #99f6e4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .summary-item { display: inline-block; margin-right: 30px; }
    .summary-label { font-size: 11px; color: #64748b; }
    .summary-value { font-size: 18px; font-weight: bold; color: #0d9488; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Credential Status Report</h1>
  <div class="subtitle">${orgName} • Generated ${today.toLocaleDateString()}</div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Total Credentials</div>
      <div class="summary-value">${processedCredentials.length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Active</div>
      <div class="summary-value">${processedCredentials.filter((c: any) => c.status === "active").length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Expiring Soon</div>
      <div class="summary-value">${processedCredentials.filter((c: any) => c.status === "expiring_soon").length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Expired</div>
      <div class="summary-value">${processedCredentials.filter((c: any) => c.status === "expired").length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Interpreter</th>
        <th>Credential Type</th>
        <th>Credential Name</th>
        <th>Issuing Organization</th>
        <th>Issue Date</th>
        <th>Expiration Date</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${processedCredentials.map((cred: any) => `
        <tr>
          <td>${cred.memberName || "Unknown"}</td>
          <td>${cred.credential_type}</td>
          <td>${cred.credential_name}</td>
          <td>${cred.issuing_organization || "-"}</td>
          <td>${cred.issue_date ? new Date(cred.issue_date).toLocaleDateString() : "-"}</td>
          <td>${cred.expiration_date ? new Date(cred.expiration_date).toLocaleDateString() : "-"}</td>
          <td class="status-${cred.status === "expiring_soon" ? "expiring" : cred.status}">${cred.status === "active" ? "Active" : cred.status === "expiring_soon" ? "Expiring Soon" : "Expired"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated automatically by Interpreted. For compliance verification purposes.</p>
    <p>Report ID: CR-${Date.now()}</p>
  </div>

  <script>window.print();</script>
</body>
</html>`;

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    // PDF Report: Activity Summary Report
    if (reportType === "activity-pdf") {
      const today = new Date();
      const org = membership.organizations as any;
      const orgName = org?.name || "Organization";

      const avgPrepRate = memberStats.length > 0
        ? Math.round(memberStats.reduce((sum, m) => sum + (m.activity.prepCompletionRate ?? 0), 0) / memberStats.length)
        : 0;
      const avgDebriefRate = memberStats.length > 0
        ? Math.round(memberStats.reduce((sum, m) => sum + (m.activity.debriefCompletionRate ?? 0), 0) / memberStats.length)
        : 0;
      const totalAssignments = memberStats.reduce((sum, m) => sum + m.activity.assignmentsThisMonth, 0);

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Activity Summary Report - ${orgName}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
    h1 { color: #0d9488; font-size: 24px; margin-bottom: 5px; }
    .subtitle { color: #64748b; font-size: 14px; margin-bottom: 30px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #0f172a; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tr:nth-child(even) { background: #f8fafc; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
    .summary { background: #f0fdfa; border: 1px solid #99f6e4; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .summary-item { display: inline-block; margin-right: 30px; }
    .summary-label { font-size: 11px; color: #64748b; }
    .summary-value { font-size: 18px; font-weight: bold; color: #0d9488; }
    .rate-high { color: #059669; }
    .rate-medium { color: #d97706; }
    .rate-low { color: #dc2626; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Activity Summary Report</h1>
  <div class="subtitle">${orgName} • Generated ${today.toLocaleDateString()} • This Month</div>

  <div class="summary">
    <div class="summary-item">
      <div class="summary-label">Team Members</div>
      <div class="summary-value">${memberStats.length}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Total Assignments</div>
      <div class="summary-value">${totalAssignments}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Avg Prep Rate</div>
      <div class="summary-value">${avgPrepRate}%</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Avg Debrief Rate</div>
      <div class="summary-value">${avgDebriefRate}%</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Interpreter</th>
        <th>Email</th>
        <th>Role</th>
        <th>Assignments</th>
        <th>Prep Rate</th>
        <th>Debrief Rate</th>
      </tr>
    </thead>
    <tbody>
      ${memberStats.map((member) => `
        <tr>
          <td>${member.profile.full_name}</td>
          <td>${member.profile.email}</td>
          <td>${member.role || "member"}</td>
          <td>${member.activity.assignmentsThisMonth}</td>
          <td class="${member.activity.prepCompletionRate !== null ? (member.activity.prepCompletionRate >= 70 ? "rate-high" : member.activity.prepCompletionRate >= 40 ? "rate-medium" : "rate-low") : ""}">${member.activity.prepCompletionRate !== null ? `${member.activity.prepCompletionRate}%` : "N/A"}</td>
          <td class="${member.activity.debriefCompletionRate !== null ? (member.activity.debriefCompletionRate >= 70 ? "rate-high" : member.activity.debriefCompletionRate >= 40 ? "rate-medium" : "rate-low") : ""}">${member.activity.debriefCompletionRate !== null ? `${member.activity.debriefCompletionRate}%` : "N/A"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <div class="footer">
    <p>This report was generated automatically by Interpreted. For performance tracking and compliance purposes.</p>
    <p>Report ID: AS-${Date.now()}</p>
  </div>

  <script>window.print();</script>
</body>
</html>`;

      return new NextResponse(htmlContent, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    // Fetch agency assignments
    const { data: agencyAssignments } = await supabaseAdmin
      .from("agency_assignments")
      .select("*")
      .eq("organization_id", orgId)
      .order("start_time", { ascending: true });

    // Fetch assignment interpreters
    const assignmentIds = (agencyAssignments || []).map((a: any) => a.id);
    let assignmentInterpreters: any[] = [];
    if (assignmentIds.length > 0) {
      const { data: interpreters } = await supabaseAdmin
        .from("agency_assignment_interpreters")
        .select("assignment_id, user_id, role")
        .in("assignment_id", assignmentIds);
      assignmentInterpreters = interpreters || [];
    }

    // Build assignments with interpreter details
    const processedAssignments = (agencyAssignments || []).map((assignment: any) => {
      const interpreterLinks = assignmentInterpreters.filter(
        (i) => i.assignment_id === assignment.id
      );
      const interpreterDetails = interpreterLinks.map((link) => {
        const profile = profiles?.find((p) => p.id === link.user_id);
        return {
          user_id: link.user_id,
          name: profile?.full_name || "Unknown",
          role: link.role,
        };
      });

      return {
        ...assignment,
        assigned_interpreters: interpreterDetails,
      };
    });

    // Fetch agency teams
    const { data: agencyTeams } = await supabaseAdmin
      .from("agency_teams")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    // Fetch team members
    const teamIds = (agencyTeams || []).map((t: any) => t.id);
    let teamMembersData: any[] = [];
    if (teamIds.length > 0) {
      const { data: tMembers } = await supabaseAdmin
        .from("agency_team_members")
        .select("team_id, user_id, role")
        .in("team_id", teamIds);
      teamMembersData = tMembers || [];
    }

    // Build teams with member details
    const processedTeams = (agencyTeams || []).map((team: any) => {
      const memberLinks = teamMembersData.filter((m) => m.team_id === team.id);
      const memberDetails = memberLinks.map((link) => {
        const profile = profiles?.find((p) => p.id === link.user_id);
        return {
          user_id: link.user_id,
          name: profile?.full_name || "Unknown",
          role: link.role,
        };
      });

      return {
        ...team,
        members: memberDetails,
      };
    });

    return NextResponse.json({
      success: true,
      organization: membership.organizations,
      teamMembers: memberStats,
      credentials: processedCredentials,
      assignments: processedAssignments,
      teams: processedTeams,
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

      // Get organization details for the email
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, name")
        .eq("id", membership.organization_id)
        .single();

      if (!org) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
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

      // Send email invitation if Resend is configured
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://interpretreflect.com'}/start?org=${org.id}`;
      let emailSent = false;

      if (resend) {
        try {
          await resend.emails.send({
            from: "InterpretReflect <noreply@interpretreflect.com>",
            to: email.toLowerCase(),
            subject: `You've been invited to join ${org.name} on InterpretReflect`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #e2e8f0; padding: 40px 20px; margin: 0;">
                  <div style="max-width: 500px; margin: 0 auto;">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <h1 style="color: #f8fafc; font-size: 24px; margin: 0;">
                        Interpreter<span style="color: #2dd4bf;">OS</span>
                      </h1>
                    </div>

                    <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(45, 212, 191, 0.1)); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 16px; padding: 32px;">
                      <h2 style="color: #f8fafc; font-size: 20px; margin: 0 0 16px 0; text-align: center;">
                        You've been invited!
                      </h2>

                      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                        <strong style="color: #a78bfa;">${org.name}</strong> has invited you to join their team on InterpretReflect.
                      </p>

                      <div style="text-align: center; margin: 32px 0;">
                        <a href="${inviteUrl}" style="display: inline-block; background-color: #2dd4bf; color: #0f172a; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 14px;">
                          Accept Invitation
                        </a>
                      </div>

                      <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin: 24px 0 0 0; text-align: center;">
                        Or copy this link: <br>
                        <span style="color: #2dd4bf; word-break: break-all;">${inviteUrl}</span>
                      </p>
                    </div>

                    <div style="text-align: center; margin-top: 32px;">
                      <p style="color: #64748b; font-size: 12px; margin: 0;">
                        InterpretReflect helps interpreters prepare, reflect, and grow.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
          });
          emailSent = true;
        } catch (emailError) {
          console.error("Error sending invite email:", emailError);
          // Don't fail the invite if email fails - the link still works
        }
      }

      return NextResponse.json({
        success: true,
        invitation,
        emailSent,
        message: emailSent
          ? `Invitation email sent to ${email}`
          : `Invitation created for ${email} (email not configured - share the invite link manually)`,
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

      // First, check if this is the owner trying to remove themselves
      const { data: memberToRemove } = await supabaseAdmin
        .from("organization_members")
        .select("user_id, role")
        .eq("id", member_id)
        .eq("organization_id", membership.organization_id)
        .single();

      if (!memberToRemove) {
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      }

      // Prevent owner from removing themselves
      if (memberToRemove.user_id === userId && memberToRemove.role === "owner") {
        return NextResponse.json(
          { error: "Owner cannot remove themselves from the organization" },
          { status: 400 }
        );
      }

      // SECURITY: Can only remove members from YOUR organization
      // Use status field for soft delete (new schema), is_active stays in sync via trigger
      const { error: removeError } = await supabaseAdmin
        .from("organization_members")
        .update({
          status: "removed",
          removed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
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

    // =====================================================
    // ASSIGNMENT ACTIONS
    // =====================================================

    if (action === "create_assignment") {
      const { title, client_name, location, start_time, end_time, prep_required, debrief_required, assigned_interpreters, assignment_type, description, create_team, team_name } = data;

      if (!title || !start_time) {
        return NextResponse.json(
          { error: "title and start_time are required" },
          { status: 400 }
        );
      }

      // Validate that at least one interpreter is assigned
      if (!assigned_interpreters || assigned_interpreters.length === 0) {
        return NextResponse.json(
          { error: "At least one interpreter must be assigned" },
          { status: 400 }
        );
      }

      // Create the agency assignment (for agency dashboard tracking)
      const { data: assignment, error: assignmentError } = await supabaseAdmin
        .from("agency_assignments")
        .insert({
          organization_id: membership.organization_id,
          title,
          client_name: client_name || null,
          location: location || null,
          start_time,
          end_time: end_time || null,
          prep_required: prep_required ?? true,
          debrief_required: debrief_required ?? true,
          created_by: userId,
        })
        .select()
        .single();

      if (assignmentError) {
        console.error("Error creating assignment:", assignmentError);
        return NextResponse.json(
          { error: "Failed to create assignment" },
          { status: 500 }
        );
      }

      // Add assigned interpreters to junction table
      const interpreterRecords = assigned_interpreters.map((interpreterId: string) => ({
        assignment_id: assignment.id,
        user_id: interpreterId,
        role: "primary",
      }));

      const { error: interpreterError } = await supabaseAdmin
        .from("agency_assignment_interpreters")
        .insert(interpreterRecords);

      if (interpreterError) {
        console.error("Error assigning interpreters:", interpreterError);
      }

      // Parse date and time from start_time (ISO format or datetime-local)
      const startDateTime = new Date(start_time);
      const dateStr = startDateTime.toISOString().split('T')[0];
      const timeStr = startDateTime.toTimeString().slice(0, 5);

      // Calculate duration if end_time is provided
      let durationMinutes = 60; // default
      if (end_time) {
        const endDateTime = new Date(end_time);
        durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));
      }

      // Create individual assignments in the interpreter's assignments table
      // Each selected interpreter gets their own copy
      const interpreterAssignments = assigned_interpreters.map((interpreterId: string) => ({
        user_id: interpreterId,
        organization_id: membership.organization_id,
        agency_assignment_id: assignment.id, // Link back to agency assignment
        title,
        assignment_type: assignment_type || "Medical",
        setting: client_name || "",
        date: dateStr,
        time: timeStr,
        location_type: "in_person",
        location_details: location || "",
        duration_minutes: durationMinutes,
        description: description || "",
        is_team_assignment: assigned_interpreters.length > 1,
        team_size: assigned_interpreters.length,
        status: "upcoming",
        prep_status: "pending",
        completed: false,
        created_by_agency: true,
      }));

      const { error: individualError } = await supabaseAdmin
        .from("assignments")
        .insert(interpreterAssignments);

      if (individualError) {
        console.error("Error creating interpreter assignments:", individualError);
        // Don't fail - agency assignment was created, interpreters just won't see it yet
      }

      // Create team with group chat if requested
      let teamCreated = false;
      if (create_team && assigned_interpreters.length >= 3) {
        try {
          // Create the team
          const { data: team, error: teamError } = await supabaseAdmin
            .from("agency_teams")
            .insert({
              organization_id: membership.organization_id,
              name: team_name || `${title} Team`,
              description: `Team created for assignment: ${title}`,
              created_by: userId,
            })
            .select()
            .single();

          if (!teamError && team) {
            // Add team members
            const teamMemberRecords = assigned_interpreters.map((interpreterId: string) => ({
              team_id: team.id,
              user_id: interpreterId,
              role: "member",
            }));

            await supabaseAdmin
              .from("agency_team_members")
              .insert(teamMemberRecords);

            // Create group conversation for the team
            const { data: conversation, error: convError } = await supabaseAdmin
              .from("conversations")
              .insert({
                is_group: true,
                group_name: `${team_name || title} Team Chat`,
                created_by: userId,
              })
              .select()
              .single();

            if (!convError && conversation) {
              // Add all interpreters as participants
              const participants = assigned_interpreters.map((interpreterId: string) => ({
                conversation_id: conversation.id,
                user_id: interpreterId,
                is_admin: false,
              }));

              // Add the creator (admin) as a participant too
              participants.push({
                conversation_id: conversation.id,
                user_id: userId,
                is_admin: true,
              });

              await supabaseAdmin
                .from("conversation_participants")
                .insert(participants);

              // Update team with conversation ID
              await supabaseAdmin
                .from("agency_teams")
                .update({ conversation_id: conversation.id })
                .eq("id", team.id);

              // Add welcome message
              await supabaseAdmin
                .from("messages")
                .insert({
                  conversation_id: conversation.id,
                  sender_id: userId,
                  content: `Welcome to the ${team_name || title} team chat! This group was created for your upcoming assignment. Use this space to coordinate and communicate with your team members.`,
                  is_system_message: true,
                });

              teamCreated = true;
            }
          }
        } catch (teamErr) {
          console.error("Error creating team:", teamErr);
          // Don't fail the whole request, assignment was created successfully
        }
      }

      return NextResponse.json({
        success: true,
        assignment,
        teamCreated,
        message: teamCreated
          ? `Assignment created, sent to ${assigned_interpreters.length} interpreter(s), and team with group chat created!`
          : `Assignment created and sent to ${assigned_interpreters.length} interpreter(s)`,
      });
    }

    if (action === "update_assignment") {
      const { assignment_id, ...updateData } = data;

      if (!assignment_id) {
        return NextResponse.json(
          { error: "assignment_id is required" },
          { status: 400 }
        );
      }

      // SECURITY: Only update assignments in YOUR organization
      const { error: updateError } = await supabaseAdmin
        .from("agency_assignments")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignment_id)
        .eq("organization_id", membership.organization_id);

      if (updateError) {
        console.error("Error updating assignment:", updateError);
        return NextResponse.json(
          { error: "Failed to update assignment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Assignment updated",
      });
    }

    if (action === "delete_assignment") {
      const { assignment_id } = data;

      if (!assignment_id) {
        return NextResponse.json(
          { error: "assignment_id is required" },
          { status: 400 }
        );
      }

      // SECURITY: Only delete assignments in YOUR organization
      const { error: deleteError } = await supabaseAdmin
        .from("agency_assignments")
        .delete()
        .eq("id", assignment_id)
        .eq("organization_id", membership.organization_id);

      if (deleteError) {
        console.error("Error deleting assignment:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete assignment" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Assignment deleted",
      });
    }

    // =====================================================
    // TEAM ACTIONS
    // =====================================================

    if (action === "create_team") {
      const { name, description, members: teamMemberIds } = data;

      if (!name) {
        return NextResponse.json(
          { error: "name is required" },
          { status: 400 }
        );
      }

      // Create the team
      const { data: team, error: teamError } = await supabaseAdmin
        .from("agency_teams")
        .insert({
          organization_id: membership.organization_id,
          name,
          description: description || null,
          created_by: userId,
        })
        .select()
        .single();

      if (teamError) {
        console.error("Error creating team:", teamError);
        return NextResponse.json(
          { error: "Failed to create team" },
          { status: 500 }
        );
      }

      // Add team members if provided
      if (teamMemberIds && teamMemberIds.length > 0) {
        const memberRecords = teamMemberIds.map((memberId: string) => ({
          team_id: team.id,
          user_id: memberId,
          role: "member",
        }));

        const { error: memberError } = await supabaseAdmin
          .from("agency_team_members")
          .insert(memberRecords);

        if (memberError) {
          console.error("Error adding team members:", memberError);
          // Don't fail the whole request, team was created
        }
      }

      // Create group chat for the team
      let conversationId = null;
      try {
        // Create the group conversation
        const { data: conversation, error: convError } = await supabaseAdmin
          .from("conversations")
          .insert({
            is_group: true,
            group_name: `${name} Team Chat`,
            created_by: userId,
          })
          .select()
          .single();

        if (convError) {
          console.error("Error creating team conversation:", convError);
        } else {
          conversationId = conversation.id;

          // Add the creator as admin participant
          await supabaseAdmin
            .from("conversation_participants")
            .insert({
              conversation_id: conversationId,
              user_id: userId,
              is_admin: true,
            });

          // Add all team members as participants
          if (teamMemberIds && teamMemberIds.length > 0) {
            const participantRecords = teamMemberIds
              .filter((memberId: string) => memberId !== userId)
              .map((memberId: string) => ({
                conversation_id: conversationId,
                user_id: memberId,
                is_admin: false,
              }));

            if (participantRecords.length > 0) {
              await supabaseAdmin
                .from("conversation_participants")
                .insert(participantRecords);
            }
          }

          // Update the team with the conversation ID
          await supabaseAdmin
            .from("agency_teams")
            .update({ conversation_id: conversationId })
            .eq("id", team.id);

          // Add a welcome system message
          await supabaseAdmin
            .from("messages")
            .insert({
              conversation_id: conversationId,
              sender_id: userId,
              content: `Welcome to the ${name} team chat! Use this space to coordinate and communicate with your team members.`,
              is_system_message: true,
            });
        }
      } catch (chatError) {
        console.error("Error setting up team chat:", chatError);
        // Don't fail the team creation if chat setup fails
      }

      return NextResponse.json({
        success: true,
        team: { ...team, conversation_id: conversationId },
        message: "Team created successfully",
      });
    }

    if (action === "update_team") {
      const { team_id, name, description, members: teamMemberIds } = data;

      if (!team_id) {
        return NextResponse.json(
          { error: "team_id is required" },
          { status: 400 }
        );
      }

      // Get the team to check for conversation_id
      const { data: existingTeam } = await supabaseAdmin
        .from("agency_teams")
        .select("conversation_id, name")
        .eq("id", team_id)
        .eq("organization_id", membership.organization_id)
        .single();

      // Update team details
      const updateData: any = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      const { error: updateError } = await supabaseAdmin
        .from("agency_teams")
        .update(updateData)
        .eq("id", team_id)
        .eq("organization_id", membership.organization_id);

      if (updateError) {
        console.error("Error updating team:", updateError);
        return NextResponse.json(
          { error: "Failed to update team" },
          { status: 500 }
        );
      }

      // Update team members if provided
      if (teamMemberIds !== undefined) {
        // Remove existing members
        await supabaseAdmin
          .from("agency_team_members")
          .delete()
          .eq("team_id", team_id);

        // Add new members
        if (teamMemberIds.length > 0) {
          const memberRecords = teamMemberIds.map((memberId: string) => ({
            team_id,
            user_id: memberId,
            role: "member",
          }));

          await supabaseAdmin
            .from("agency_team_members")
            .insert(memberRecords);
        }

        // Sync conversation participants if team has a conversation
        if (existingTeam?.conversation_id) {
          try {
            // Mark removed members as left
            await supabaseAdmin
              .from("conversation_participants")
              .update({ left_at: new Date().toISOString() })
              .eq("conversation_id", existingTeam.conversation_id)
              .not("user_id", "in", `(${teamMemberIds.join(",")})`);

            // Add new members or un-leave existing ones
            for (const memberId of teamMemberIds) {
              const { data: existingParticipant } = await supabaseAdmin
                .from("conversation_participants")
                .select("id, left_at")
                .eq("conversation_id", existingTeam.conversation_id)
                .eq("user_id", memberId)
                .single();

              if (existingParticipant) {
                // Re-join if they had left
                if (existingParticipant.left_at) {
                  await supabaseAdmin
                    .from("conversation_participants")
                    .update({ left_at: null })
                    .eq("id", existingParticipant.id);
                }
              } else {
                // Add new participant
                await supabaseAdmin
                  .from("conversation_participants")
                  .insert({
                    conversation_id: existingTeam.conversation_id,
                    user_id: memberId,
                    is_admin: false,
                  });
              }
            }
          } catch (syncError) {
            console.error("Error syncing conversation participants:", syncError);
          }
        }
      }

      // Update conversation name if team name changed
      if (name !== undefined && existingTeam?.conversation_id) {
        await supabaseAdmin
          .from("conversations")
          .update({ group_name: `${name} Team Chat` })
          .eq("id", existingTeam.conversation_id);
      }

      return NextResponse.json({
        success: true,
        message: "Team updated",
      });
    }

    if (action === "delete_team") {
      const { team_id } = data;

      if (!team_id) {
        return NextResponse.json(
          { error: "team_id is required" },
          { status: 400 }
        );
      }

      // SECURITY: Only delete teams in YOUR organization
      const { error: deleteError } = await supabaseAdmin
        .from("agency_teams")
        .delete()
        .eq("id", team_id)
        .eq("organization_id", membership.organization_id);

      if (deleteError) {
        console.error("Error deleting team:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete team" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Team deleted",
      });
    }

    // =====================================================
    // SETTINGS ACTIONS
    // =====================================================

    if (action === "update_settings") {
      const { settings } = data;

      if (!settings) {
        return NextResponse.json(
          { error: "settings object is required" },
          { status: 400 }
        );
      }

      // SECURITY: Only update settings for YOUR organization
      const { error: updateError } = await supabaseAdmin
        .from("organizations")
        .update({ settings })
        .eq("id", membership.organization_id);

      if (updateError) {
        console.error("Error updating settings:", updateError);
        return NextResponse.json(
          { error: "Failed to update settings" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Settings updated",
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
