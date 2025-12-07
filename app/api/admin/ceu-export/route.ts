import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Super admin emails - only these can access this endpoint
const SUPER_ADMIN_EMAILS = [
  "maddox@interpretreflect.com",
  "admin@interpretreflect.com",
  "sarah@interpretreflect.com",
];

async function verifyAdminAccess(req: NextRequest): Promise<{ authorized: boolean; userId?: string; email?: string }> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false };
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { authorized: false };
  }

  const userEmail = user.email?.toLowerCase() || "";
  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(userEmail);

  if (!isSuperAdmin) {
    // Check for admin role in profile
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const hasAdminRole = (profile as any)?.role === "admin" || (profile as any)?.role === "super_admin";
    if (!hasAdminRole) {
      return { authorized: false };
    }
  }

  return { authorized: true, userId: user.id, email: userEmail };
}

/**
 * GET /api/admin/ceu-export
 * Export CEU certificates in RID batch upload format
 *
 * Query params:
 * - start_date: YYYY-MM-DD (required)
 * - end_date: YYYY-MM-DD (required)
 * - format: "csv" | "json" (default: csv)
 * - activity_number: optional RID activity number to include in export
 */
export async function GET(req: NextRequest) {
  try {
    const { authorized, email } = await verifyAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const format = searchParams.get("format") || "csv";
    const activityNumber = searchParams.get("activity_number") || "";

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "start_date and end_date are required (YYYY-MM-DD format)" },
        { status: 400 }
      );
    }

    // Fetch certificates within date range with user profile info
    const { data: certificates, error } = await supabaseAdmin
      .from("ceu_certificates")
      .select(`
        id,
        certificate_number,
        title,
        ceu_value,
        rid_category,
        rid_subcategory,
        rid_activity_type,
        sponsor_number,
        completed_at,
        issued_at,
        assessment_score,
        user_id,
        profiles!inner (
          id,
          full_name,
          email,
          rid_member_number
        )
      `)
      .eq("status", "active")
      .gte("issued_at", `${startDate}T00:00:00`)
      .lte("issued_at", `${endDate}T23:59:59`)
      .order("issued_at", { ascending: true });

    if (error) {
      console.error("Error fetching certificates:", error);
      return NextResponse.json(
        { error: "Failed to fetch certificates" },
        { status: 500 }
      );
    }

    if (!certificates || certificates.length === 0) {
      if (format === "json") {
        return NextResponse.json({
          success: true,
          count: 0,
          certificates: [],
          message: "No certificates found in the specified date range",
        });
      }
      return new NextResponse("No certificates found in the specified date range", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // Format for RID batch upload
    // RID typically requires: RID Number, Last Name, First Name, Activity Number, CEU Value, Completion Date
    const ridRecords = certificates.map((cert: any) => {
      const profile = cert.profiles;
      const fullName = profile?.full_name || "Unknown";
      const nameParts = fullName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || nameParts[0] || "";

      return {
        rid_member_number: profile?.rid_member_number || "",
        last_name: lastName,
        first_name: firstName,
        email: profile?.email || "",
        activity_number: activityNumber,
        activity_title: cert.title,
        ceu_value: cert.ceu_value,
        rid_category: cert.rid_category,
        rid_subcategory: cert.rid_subcategory || "",
        completion_date: new Date(cert.completed_at || cert.issued_at).toLocaleDateString("en-US"),
        certificate_number: cert.certificate_number,
        sponsor_number: cert.sponsor_number || "2309",
        assessment_score: cert.assessment_score || "",
      };
    });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        count: ridRecords.length,
        export_date: new Date().toISOString(),
        date_range: { start: startDate, end: endDate },
        exported_by: email,
        certificates: ridRecords,
      });
    }

    // Generate CSV
    const csvHeaders = [
      "RID Member Number",
      "Last Name",
      "First Name",
      "Email",
      "Activity Number",
      "Activity Title",
      "CEU Value",
      "RID Category",
      "RID Subcategory",
      "Completion Date",
      "Certificate Number",
      "Sponsor Number",
      "Assessment Score",
    ];

    const csvRows = ridRecords.map((record: any) => [
      record.rid_member_number,
      record.last_name,
      record.first_name,
      record.email,
      record.activity_number,
      `"${record.activity_title.replace(/"/g, '""')}"`,
      record.ceu_value,
      record.rid_category,
      record.rid_subcategory,
      record.completion_date,
      record.certificate_number,
      record.sponsor_number,
      record.assessment_score,
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map((row: any[]) => row.join(",")),
    ].join("\n");

    const filename = `RID_CEU_Export_${startDate}_to_${endDate}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("CEU export error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/ceu-export
 * Get summary statistics for CEU reporting
 */
export async function POST(req: NextRequest) {
  try {
    const { authorized } = await verifyAdminAccess(req);
    if (!authorized) {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { action, start_date, end_date } = body;

    if (action === "summary") {
      // Get summary stats for the date range
      const { data: certificates, error } = await supabaseAdmin
        .from("ceu_certificates")
        .select("ceu_value, rid_category, user_id")
        .eq("status", "active")
        .gte("issued_at", `${start_date}T00:00:00`)
        .lte("issued_at", `${end_date}T23:59:59`);

      if (error) {
        console.error("Error fetching summary:", error);
        return NextResponse.json(
          { error: "Failed to fetch summary" },
          { status: 500 }
        );
      }

      const uniqueUsers = new Set(certificates?.map((c: any) => c.user_id) || []);
      const totalCEUs = certificates?.reduce((sum: number, c: any) => sum + parseFloat(c.ceu_value || 0), 0) || 0;

      const byCategory = {
        "Professional Studies": 0,
        "PPO": 0,
        "General Studies": 0,
      };

      certificates?.forEach((c: any) => {
        const category = c.rid_category as keyof typeof byCategory;
        if (category in byCategory) {
          byCategory[category] += parseFloat(c.ceu_value || 0);
        }
      });

      // Get count of users missing RID numbers
      const { count: missingRidCount } = await supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .in("id", Array.from(uniqueUsers))
        .or("rid_member_number.is.null,rid_member_number.eq.");

      return NextResponse.json({
        success: true,
        summary: {
          date_range: { start: start_date, end: end_date },
          total_certificates: certificates?.length || 0,
          unique_participants: uniqueUsers.size,
          total_ceus: Math.round(totalCEUs * 100) / 100,
          by_category: byCategory,
          missing_rid_numbers: missingRidCount || 0,
        },
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("CEU export action error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
