import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin-only CEU management endpoint
const ADMIN_EMAILS = [
  "maddox@interpretreflect.com",
  "admin@interpretreflect.com",
  "sarah@interpretreflect.com",
];

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyAdmin(request: NextRequest): Promise<{ userId: string; email: string } | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  const email = user.email?.toLowerCase() || "";
  const isAdmin = ADMIN_EMAILS.includes(email);

  if (!isAdmin) {
    // Check role in profiles
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return null;
    }
  }

  return { userId: user.id, email };
}

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "dashboard";

  try {
    switch (action) {
      case "dashboard": {
        // Get comprehensive dashboard data
        const { data, error } = await supabaseAdmin.rpc("get_ceu_admin_dashboard");
        if (error) throw error;
        return NextResponse.json(data);
      }

      case "monthly_summary": {
        const { data, error } = await supabaseAdmin
          .from("v_ceu_monthly_summary")
          .select("*")
          .order("month", { ascending: false })
          .limit(12);
        if (error) throw error;
        return NextResponse.json({ months: data });
      }

      case "deadline_tracking": {
        const status = searchParams.get("status"); // overdue, urgent, due_soon, on_track
        let query = supabaseAdmin
          .from("v_ceu_deadline_tracking")
          .select("*")
          .is("rid_submitted_at", null)
          .order("issued_at", { ascending: true });

        if (status) {
          query = query.eq("deadline_status", status);
        }

        const { data, error } = await query.limit(100);
        if (error) throw error;
        return NextResponse.json({ certificates: data });
      }

      case "grievances": {
        const status = searchParams.get("status");
        let query = supabaseAdmin
          .from("ceu_grievances")
          .select(`
            *,
            user:profiles!user_id(full_name, email),
            certificate:ceu_certificates!certificate_id(certificate_number, title),
            module:skill_modules!module_id(title)
          `)
          .order("created_at", { ascending: false });

        if (status && status !== "all") {
          query = query.eq("status", status);
        }

        const { data, error } = await query.limit(50);
        if (error) throw error;
        return NextResponse.json({ grievances: data });
      }

      case "evaluations": {
        const month = searchParams.get("month"); // YYYY-MM format

        // Fetch all recent evaluations (simpler and more reliable than complex date queries)
        // We use created_at for ordering since it's always populated
        const { data, error } = await supabaseAdmin
          .from("ceu_evaluations")
          .select(`
            *,
            user:profiles(full_name, email),
            module:skill_modules(title, module_code)
          `)
          .order("created_at", { ascending: false })
          .limit(500); // Fetch more to ensure we get all in the month

        if (error) {
          console.error("Error fetching evaluations:", error);
          // If table doesn't exist, return empty array instead of throwing
          if (error.code === "42P01") {
            return NextResponse.json({
              evaluations: [],
              summary: { total: 0, average_rating: 0 },
              error: "Evaluations table not found - run migrations",
            });
          }
          throw error;
        }

        // Filter client-side for the month - use submitted_at if available, else created_at
        let filteredData = data || [];
        if (month) {
          const startDate = new Date(`${month}-01T00:00:00Z`);
          const endDate = new Date(`${month}-01T00:00:00Z`);
          endDate.setMonth(endDate.getMonth() + 1);

          filteredData = filteredData.filter((e: any) => {
            // Use submitted_at if available, fallback to created_at
            const dateStr = e.submitted_at || e.created_at;
            if (!dateStr) return false;
            const evalDate = new Date(dateStr);
            return evalDate >= startDate && evalDate < endDate;
          });
        }

        // Calculate averages
        const ratings = filteredData.map((e: any) => ({
          q1: e.q1_objectives_clear || 0,
          q2: e.q2_content_relevant || 0,
          q3: e.q3_applicable_to_work || 0,
          q4: e.q4_presenter_effective || 0,
        }));

        const avgRating = ratings.length > 0
          ? ratings.reduce((sum: number, r: any) => sum + (r.q1 + r.q2 + r.q3 + r.q4) / 4, 0) / ratings.length
          : 0;

        return NextResponse.json({
          evaluations: filteredData,
          summary: {
            total: filteredData.length,
            average_rating: Math.round(avgRating * 100) / 100,
          },
        });
      }

      case "submission_history": {
        const { data, error } = await supabaseAdmin
          .from("rid_submissions")
          .select(`
            *,
            submitted_by_user:profiles!submitted_by(full_name, email)
          `)
          .order("submitted_at", { ascending: false })
          .limit(24);

        if (error) throw error;
        return NextResponse.json({ submissions: data });
      }

      case "certificates_for_month": {
        const month = searchParams.get("month"); // YYYY-MM format
        if (!month) {
          return NextResponse.json({ error: "month parameter required" }, { status: 400 });
        }

        const startDate = `${month}-01`;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);

        const { data, error } = await supabaseAdmin
          .from("ceu_certificates")
          .select(`
            *,
            user:profiles!user_id(full_name, email, rid_member_number, phone)
          `)
          .eq("status", "active")
          .gte("issued_at", startDate)
          .lt("issued_at", endDate.toISOString().split("T")[0])
          .order("issued_at", { ascending: true });

        if (error) throw error;

        // Calculate summary
        const submitted = data?.filter(c => c.rid_submitted_at) || [];
        const pending = data?.filter(c => !c.rid_submitted_at) || [];
        const missingRid = data?.filter(c => !c.user?.rid_member_number) || [];

        return NextResponse.json({
          certificates: data,
          summary: {
            total: data?.length || 0,
            submitted: submitted.length,
            pending: pending.length,
            missing_rid_numbers: missingRid.length,
            total_ceus: data?.reduce((sum, c) => sum + (c.ceu_value || 0), 0) || 0,
          },
        });
      }

      case "audit_log": {
        const { data, error } = await supabaseAdmin
          .from("admin_activity_log")
          .select(`
            *,
            admin:profiles!admin_id(full_name, email)
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        return NextResponse.json({ logs: data });
      }

      case "evaluations_export": {
        const month = searchParams.get("month"); // YYYY-MM format
        const format = searchParams.get("format") || "csv";

        // Fetch all evaluations and filter client-side for reliability
        const { data: allData, error } = await supabaseAdmin
          .from("ceu_evaluations")
          .select(`
            *,
            user:profiles(full_name, email, rid_member_number),
            module:skill_modules(title, module_code)
          `)
          .order("created_at", { ascending: true })
          .limit(1000);

        // Filter for the requested month
        let data = allData || [];
        if (month) {
          const startDate = new Date(`${month}-01T00:00:00Z`);
          const endDate = new Date(`${month}-01T00:00:00Z`);
          endDate.setMonth(endDate.getMonth() + 1);

          data = data.filter((e: any) => {
            const dateStr = e.submitted_at || e.created_at;
            if (!dateStr) return false;
            const evalDate = new Date(dateStr);
            return evalDate >= startDate && evalDate < endDate;
          });
        }

        if (error) {
          console.error("Error fetching evaluations for export:", error);
          if (error.code === "42P01") {
            return NextResponse.json({
              error: "Evaluations table not found - run migrations",
            }, { status: 500 });
          }
          throw error;
        }

        if (format === "json") {
          return NextResponse.json({
            success: true,
            count: data?.length || 0,
            month,
            evaluations: data,
          });
        }

        // Generate CSV for RID audit purposes
        const csvHeaders = [
          "Submitted Date",
          "Participant Name",
          "Email",
          "RID Member #",
          "Module Code",
          "Module Title",
          "Q1 Objectives Clear (1-5)",
          "Q2 Content Relevant (1-5)",
          "Q3 Applicable to Work (1-5)",
          "Q4 Presenter Effective (1-5)",
          "Average Rating",
          "Most Valuable",
          "Suggestions",
        ];

        const csvRows = data.map((e: any) => {
          const avgRating = (((e.q1_objectives_clear || 0) + (e.q2_content_relevant || 0) + (e.q3_applicable_to_work || 0) + (e.q4_presenter_effective || 0)) / 4).toFixed(2);
          const dateStr = e.submitted_at || e.created_at;
          return [
            dateStr ? new Date(dateStr).toLocaleDateString("en-US") : "",
            `"${(e.user?.full_name || "Unknown").replace(/"/g, '""')}"`,
            e.user?.email || "",
            e.user?.rid_member_number || "",
            e.module?.module_code || "",
            `"${(e.module?.title || "Unknown").replace(/"/g, '""')}"`,
            e.q1_objectives_clear || 0,
            e.q2_content_relevant || 0,
            e.q3_applicable_to_work || 0,
            e.q4_presenter_effective || 0,
            avgRating,
            `"${(e.q5_most_valuable || "").replace(/"/g, '""')}"`,
            `"${(e.q6_suggestions || "").replace(/"/g, '""')}"`,
          ].join(",");
        });

        const csvContent = [csvHeaders.join(","), ...csvRows].join("\n");
        const filename = `CEU_Evaluations_${month || "all"}.csv`;

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("CEU Admin API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "submit_to_rid": {
        const { certificate_ids, batch_id, notes } = body;
        if (!certificate_ids || !Array.isArray(certificate_ids) || certificate_ids.length === 0) {
          return NextResponse.json({ error: "certificate_ids required" }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin.rpc("submit_ceu_batch_to_rid", {
          p_certificate_ids: certificate_ids,
          p_admin_id: admin.userId,
          p_batch_id: batch_id || null,
          p_notes: notes || null,
        });

        if (error) throw error;
        return NextResponse.json(data);
      }

      case "resolve_grievance": {
        const { grievance_id, resolution, status } = body;
        if (!grievance_id || !resolution) {
          return NextResponse.json({ error: "grievance_id and resolution required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from("ceu_grievances")
          .update({
            status: status || "resolved",
            resolution,
            resolved_at: new Date().toISOString(),
            resolved_by: admin.userId,
          })
          .eq("id", grievance_id);

        if (error) throw error;

        // Log admin action
        await supabaseAdmin.from("admin_activity_log").insert({
          admin_id: admin.userId,
          action: "resolve_grievance",
          entity_type: "grievance",
          entity_id: grievance_id,
          details: { resolution, status },
        });

        return NextResponse.json({ success: true });
      }

      case "update_grievance_status": {
        const { grievance_id, status } = body;
        if (!grievance_id || !status) {
          return NextResponse.json({ error: "grievance_id and status required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from("ceu_grievances")
          .update({ status })
          .eq("id", grievance_id);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      case "update_module_instructor": {
        const { module_id, instructor_name, instructor_credentials } = body;
        if (!module_id || !instructor_name) {
          return NextResponse.json({ error: "module_id and instructor_name required" }, { status: 400 });
        }

        const { error } = await supabaseAdmin
          .from("skill_modules")
          .update({
            instructor_name,
            instructor_credentials: instructor_credentials || null,
          })
          .eq("id", module_id);

        if (error) throw error;

        // Log admin action
        await supabaseAdmin.from("admin_activity_log").insert({
          admin_id: admin.userId,
          action: "update_module_instructor",
          entity_type: "module",
          entity_id: module_id,
          details: { instructor_name, instructor_credentials },
        });

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("CEU Admin API POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
