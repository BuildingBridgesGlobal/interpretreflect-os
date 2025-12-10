"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

type MonthSummary = {
  month: string;
  month_key: string;
  month_display: string;
  total_certificates: number;
  unique_participants: number;
  total_ceus: number;
  submitted_count: number;
  pending_count: number;
  missing_rid_numbers: number;
  ps_ceus: number;
  ppo_ceus: number;
  gs_ceus: number;
};

type DeadlineAlert = {
  certificate_number: string;
  participant_name: string;
  module_title: string;
  ceu_value: number;
  issued_at: string;
  days_since_issued: number;
  days_until_deadline: number;
  deadline_status: string;
};

type Grievance = {
  id: string;
  grievance_type: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  resolution: string | null;
  user: { full_name: string; email: string };
  certificate?: { certificate_number: string; title: string };
  module?: { title: string };
};

type Certificate = {
  id: string;
  certificate_number: string;
  title: string;
  ceu_value: number;
  rid_category: string;
  activity_code: string;
  issued_at: string;
  rid_submitted_at: string | null;
  user: {
    full_name: string;
    email: string;
    rid_member_number: string | null;
    phone: string | null;
  };
};

type Evaluation = {
  id: string;
  q1_objectives_clear: number;
  q2_content_relevant: number;
  q3_applicable_to_work: number;
  q4_presenter_effective: number;
  q5_most_valuable: string | null;
  q6_suggestions: string | null;
  submitted_at: string;
  user: { full_name: string; email: string };
  module: { title: string; module_code: string };
};

type Submission = {
  id: string;
  submitted_at: string;
  period_start: string;
  period_end: string;
  record_count: number;
  total_ceu_value: number;
  confirmation_number: string | null;
  notes: string | null;
  submitted_by_user: { full_name: string; email: string };
};

type DashboardData = {
  overview: {
    total_certificates: number;
    total_participants: number;
    total_ceus: number;
    pending_submission: number;
    submitted_this_month: number;
    overdue_count: number;
  };
  deadline_alerts: DeadlineAlert[] | null;
  monthly_summary: MonthSummary[] | null;
  grievances: {
    open: number;
    in_review: number;
    resolved_this_month: number;
  };
  evaluations: {
    total: number;
    this_month: number;
    avg_rating: number;
  };
};

type SubView = "overview" | "monthly" | "deadlines" | "grievances" | "evaluations" | "submissions" | "audit";

export default function CEUAdminDashboard() {
  const [subView, setSubView] = useState<SubView>("overview");
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [monthCertificates, setMonthCertificates] = useState<Certificate[]>([]);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [grievanceFilter, setGrievanceFilter] = useState<string>("all");
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineAlert[]>([]);
  const [deadlineFilter, setDeadlineFilter] = useState<string>("all");

  // Modal states
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [resolution, setResolution] = useState("");

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    });
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (subView === "monthly") {
      loadMonthCertificates();
    } else if (subView === "grievances") {
      loadGrievances();
    } else if (subView === "evaluations") {
      loadEvaluations();
    } else if (subView === "submissions") {
      loadSubmissions();
    } else if (subView === "deadlines") {
      loadDeadlines();
    }
  }, [subView, selectedMonth, grievanceFilter, deadlineFilter]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/admin/ceu?action=dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboard(data);
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthCertificates = async () => {
    try {
      const response = await fetchWithAuth(`/api/admin/ceu?action=certificates_for_month&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setMonthCertificates(data.certificates || []);
        setMonthSummary(data.summary);
        setSelectedCertificates([]);
      }
    } catch (error) {
      console.error("Error loading month certificates:", error);
    }
  };

  const loadGrievances = async () => {
    try {
      const response = await fetchWithAuth(`/api/admin/ceu?action=grievances&status=${grievanceFilter}`);
      if (response.ok) {
        const data = await response.json();
        setGrievances(data.grievances || []);
      }
    } catch (error) {
      console.error("Error loading grievances:", error);
    }
  };

  const loadEvaluations = async () => {
    try {
      const response = await fetchWithAuth(`/api/admin/ceu?action=evaluations&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error("Error loading evaluations:", error);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/ceu?action=submission_history");
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions || []);
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  const loadDeadlines = async () => {
    try {
      const status = deadlineFilter !== "all" ? `&status=${deadlineFilter}` : "";
      const response = await fetchWithAuth(`/api/admin/ceu?action=deadline_tracking${status}`);
      if (response.ok) {
        const data = await response.json();
        setDeadlines(data.certificates || []);
      }
    } catch (error) {
      console.error("Error loading deadlines:", error);
    }
  };

  const handleSubmitToRID = async () => {
    if (selectedCertificates.length === 0) return;
    setSubmitting(true);
    try {
      const response = await fetchWithAuth("/api/admin/ceu", {
        method: "POST",
        body: JSON.stringify({
          action: "submit_to_rid",
          certificate_ids: selectedCertificates,
          batch_id: `RID-${selectedMonth}`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully marked ${result.certificates_submitted} certificates as submitted to RID.\nBatch ID: ${result.batch_id}`);
        loadMonthCertificates();
        loadDashboard();
      }
    } catch (error) {
      console.error("Error submitting to RID:", error);
      alert("Failed to mark certificates as submitted");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveGrievance = async () => {
    if (!selectedGrievance || !resolution.trim()) return;
    try {
      const response = await fetchWithAuth("/api/admin/ceu", {
        method: "POST",
        body: JSON.stringify({
          action: "resolve_grievance",
          grievance_id: selectedGrievance.id,
          resolution: resolution.trim(),
          status: "resolved",
        }),
      });

      if (response.ok) {
        setShowResolveModal(false);
        setSelectedGrievance(null);
        setResolution("");
        loadGrievances();
        loadDashboard();
      }
    } catch (error) {
      console.error("Error resolving grievance:", error);
    }
  };

  const exportCSV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({
        start_date: `${selectedMonth}-01`,
        end_date: getEndOfMonth(selectedMonth),
        format: "csv",
      });

      const response = await fetch(`/api/admin/ceu-export?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `RID_CEU_Export_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  const getEndOfMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month, 0);
    return date.toISOString().split("T")[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getMonthOptions = (): { key: string; display: string }[] => {
    const options: { key: string; display: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const display = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({ key, display });
    }
    return options;
  };

  // Copy certificate data to clipboard in RID format
  const copyToClipboard = async (cert: Certificate) => {
    const ridData = [
      `RID Member #: ${cert.user.rid_member_number || "N/A"}`,
      `Name: ${cert.user.full_name}`,
      `Email: ${cert.user.email}`,
      `Activity: ${cert.title}`,
      `Activity Code: ${cert.activity_code || "N/A"}`,
      `CEU Value: ${cert.ceu_value}`,
      `Category: ${cert.rid_category}`,
      `Completion Date: ${formatDate(cert.issued_at)}`,
      `Certificate #: ${cert.certificate_number}`,
      `Sponsor: InterpretReflect (#2309)`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(ridData);
      setCopiedId(cert.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Copy all selected certificates as tab-separated for spreadsheet paste
  const copyAllSelected = async () => {
    const headers = ["RID Member #", "Name", "Email", "Activity", "Activity Code", "CEUs", "Category", "Completion Date", "Certificate #"];
    const rows = monthCertificates
      .filter(c => selectedCertificates.includes(c.id))
      .map(c => [
        c.user.rid_member_number || "",
        c.user.full_name,
        c.user.email,
        c.title,
        c.activity_code || "",
        c.ceu_value,
        c.rid_category,
        formatDate(c.issued_at),
        c.certificate_number,
      ].join("\t"));

    const tsvData = [headers.join("\t"), ...rows].join("\n");

    try {
      await navigator.clipboard.writeText(tsvData);
      alert(`Copied ${rows.length} certificates to clipboard!\n\nPaste directly into Excel or Google Sheets.`);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "overview", label: "Overview", icon: "📊" },
          { key: "monthly", label: "Monthly Reports", icon: "📅" },
          { key: "deadlines", label: "Deadline Tracking", icon: "⏰" },
          { key: "grievances", label: "Grievances", icon: "📋" },
          { key: "evaluations", label: "Evaluations", icon: "⭐" },
          { key: "submissions", label: "Submission History", icon: "📤" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubView(tab.key as SubView)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              subView === tab.key
                ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                : "bg-slate-800/50 text-slate-400 hover:text-slate-300 border border-slate-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {subView === "overview" && dashboard && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              value={dashboard.overview.total_certificates}
              label="Total Certificates"
              color="violet"
            />
            <StatCard
              value={dashboard.overview.total_participants}
              label="Participants"
              color="blue"
            />
            <StatCard
              value={dashboard.overview.total_ceus}
              label="Total CEUs"
              color="teal"
            />
            <StatCard
              value={dashboard.overview.pending_submission}
              label="Pending RID"
              color={dashboard.overview.pending_submission > 0 ? "amber" : "emerald"}
            />
            <StatCard
              value={dashboard.overview.submitted_this_month}
              label="Submitted (Month)"
              color="emerald"
            />
            <StatCard
              value={dashboard.overview.overdue_count}
              label="Overdue"
              color={dashboard.overview.overdue_count > 0 ? "rose" : "emerald"}
            />
          </div>

          {/* Deadline Alerts */}
          {dashboard.deadline_alerts && dashboard.deadline_alerts.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-xl">⚠️</div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-400">RID Deadline Alerts</h3>
                  <p className="text-xs text-slate-400">Certificates approaching 45-day deadline</p>
                </div>
              </div>
              <div className="space-y-2">
                {dashboard.deadline_alerts.slice(0, 5).map((alert) => (
                  <div key={alert.certificate_number} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{alert.participant_name}</p>
                      <p className="text-xs text-slate-500">{alert.module_title}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        alert.deadline_status === "overdue" ? "bg-rose-500/20 text-rose-400" :
                        alert.deadline_status === "urgent" ? "bg-amber-500/20 text-amber-400" :
                        "bg-blue-500/20 text-blue-400"
                      }`}>
                        {alert.days_until_deadline < 0 ? `${Math.abs(alert.days_until_deadline)} days overdue` : `${alert.days_until_deadline} days left`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSubView("deadlines")}
                className="mt-4 text-sm text-amber-400 hover:text-amber-300"
              >
                View all deadline tracking →
              </button>
            </div>
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Grievances */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Grievances</h4>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-rose-400">{dashboard.grievances.open}</p>
                  <p className="text-xs text-slate-500">Open</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-400">{dashboard.grievances.in_review}</p>
                  <p className="text-xs text-slate-500">In Review</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{dashboard.grievances.resolved_this_month}</p>
                  <p className="text-xs text-slate-500">Resolved (Month)</p>
                </div>
              </div>
            </div>

            {/* Evaluations */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Evaluations</h4>
              <div className="flex gap-4">
                <div>
                  <p className="text-2xl font-bold text-violet-400">{dashboard.evaluations.total}</p>
                  <p className="text-xs text-slate-500">Total</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{dashboard.evaluations.this_month}</p>
                  <p className="text-xs text-slate-500">This Month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-400">{dashboard.evaluations.avg_rating || "-"}/5</p>
                  <p className="text-xs text-slate-500">Avg Rating</p>
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
              <h4 className="text-sm font-medium text-slate-300 mb-3">This Month</h4>
              {dashboard.monthly_summary && dashboard.monthly_summary[0] && (
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold text-teal-400">{dashboard.monthly_summary[0].total_certificates}</p>
                    <p className="text-xs text-slate-500">Certificates</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-violet-400">{dashboard.monthly_summary[0].total_ceus}</p>
                    <p className="text-xs text-slate-500">CEUs</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-400">{dashboard.monthly_summary[0].submitted_count}</p>
                    <p className="text-xs text-slate-500">Submitted</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RID Workflow Reminder */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">📋 Monthly RID Submission Checklist</h3>
            <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
              <li>Go to <strong>Monthly Reports</strong> and select the month</li>
              <li>Review all pending certificates - check for missing RID numbers</li>
              <li>Download the CSV for RID batch upload</li>
              <li>Upload to RID Sponsor Portal</li>
              <li>After successful upload, select certificates and click "Mark as Submitted to RID"</li>
              <li>Record confirmation number in Submission History</li>
            </ol>
          </div>

          {/* Admin Tools */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-5">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">🔧 Admin Tools</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={async () => {
                  if (!confirm("This will add/update the Virtual Synergy CEU Workshop in the database. Continue?")) return;
                  try {
                    const response = await fetchWithAuth("/api/admin/run-migration", {
                      method: "POST",
                      body: JSON.stringify({ action: "add_virtual_synergy_workshop" }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert(`Success! Virtual Synergy workshop ${result.result?.action || "processed"}.`);
                    } else {
                      alert(`Error: ${result.error}`);
                    }
                  } catch (err) {
                    alert("Failed to add workshop");
                    console.error(err);
                  }
                }}
                className="px-4 py-2 rounded-lg border border-teal-500/50 text-teal-400 hover:bg-teal-500/20 transition-colors text-sm"
              >
                Add Virtual Synergy Workshop
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetchWithAuth("/api/admin/run-migration", {
                      method: "POST",
                      body: JSON.stringify({ action: "setup_ceu_rls_and_functions" }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert(`${result.message}\n\n${result.instructions?.join('\n') || ''}`);
                    } else {
                      alert(`Error: ${result.error}`);
                    }
                  } catch (err) {
                    alert("Failed to get setup instructions");
                    console.error(err);
                  }
                }}
                className="px-4 py-2 rounded-lg border border-violet-500/50 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm"
              >
                Setup RLS & Functions
              </button>
              <button
                onClick={async () => {
                  if (!confirm("This will move NSM modules (1.1-1.6) to Quick Skills (non-CEU). Continue?")) return;
                  try {
                    const response = await fetchWithAuth("/api/admin/run-migration", {
                      method: "POST",
                      body: JSON.stringify({ action: "nsm_to_quick_skills" }),
                    });
                    const result = await response.json();
                    if (result.success) {
                      alert(`Success! ${result.updated?.length || 0} modules moved to Quick Skills.`);
                    } else {
                      alert(`Error: ${result.error}`);
                    }
                  } catch (err) {
                    alert("Failed to run migration");
                    console.error(err);
                  }
                }}
                className="px-4 py-2 rounded-lg border border-amber-500/50 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm"
              >
                Move NSM to Quick Skills
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Use these tools to manage CEU system configuration.
            </p>
          </div>
        </div>
      )}

      {/* Monthly Reports */}
      {subView === "monthly" && (
        <div className="space-y-6">
          {/* Month Selector & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {getMonthOptions().map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.display}</option>
                ))}
              </select>
              {monthSummary && (
                <div className="text-sm text-slate-400">
                  {monthSummary.total} certificates • {monthSummary.total_ceus} CEUs
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyAllSelected}
                disabled={selectedCertificates.length === 0}
                className="px-4 py-2 rounded-lg border border-violet-500/50 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy {selectedCertificates.length} to Clipboard
              </button>
              <button
                onClick={exportCSV}
                className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </button>
              <button
                onClick={handleSubmitToRID}
                disabled={selectedCertificates.length === 0 || submitting}
                className="px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {submitting ? "Processing..." : `Mark ${selectedCertificates.length} as Submitted`}
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          {monthSummary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-teal-400">{monthSummary.total}</p>
                <p className="text-xs text-slate-400">Total Certificates</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-emerald-400">{monthSummary.submitted}</p>
                <p className="text-xs text-slate-400">Submitted</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-amber-400">{monthSummary.pending}</p>
                <p className="text-xs text-slate-400">Pending</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-violet-400">{monthSummary.total_ceus}</p>
                <p className="text-xs text-slate-400">Total CEUs</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className={`text-2xl font-bold ${monthSummary.missing_rid_numbers > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {monthSummary.missing_rid_numbers}
                </p>
                <p className="text-xs text-slate-400">Missing RID #</p>
              </div>
            </div>
          )}

          {/* Certificates Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30">
                    <th className="p-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedCertificates.length === monthCertificates.filter(c => !c.rid_submitted_at).length && monthCertificates.filter(c => !c.rid_submitted_at).length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCertificates(monthCertificates.filter(c => !c.rid_submitted_at).map(c => c.id));
                          } else {
                            setSelectedCertificates([]);
                          }
                        }}
                        className="rounded border-slate-600"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Certificate</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Participant</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">RID #</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Module</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">CEUs</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Issued</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="p-3 text-center text-xs font-medium text-slate-400 uppercase">Copy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {monthCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.includes(cert.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCertificates([...selectedCertificates, cert.id]);
                            } else {
                              setSelectedCertificates(selectedCertificates.filter(id => id !== cert.id));
                            }
                          }}
                          disabled={!!cert.rid_submitted_at}
                          className="rounded border-slate-600 disabled:opacity-30"
                        />
                      </td>
                      <td className="p-3">
                        <code className="text-xs text-teal-400">{cert.certificate_number}</code>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-slate-200">{cert.user.full_name}</p>
                        <p className="text-xs text-slate-500">{cert.user.email}</p>
                      </td>
                      <td className="p-3">
                        {cert.user.rid_member_number ? (
                          <span className="text-sm text-slate-300">{cert.user.rid_member_number}</span>
                        ) : (
                          <span className="text-xs text-rose-400">Missing</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-slate-300 max-w-[200px] truncate">{cert.title}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-teal-400">{cert.ceu_value}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-400">{cert.rid_category}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-400">{formatDate(cert.issued_at)}</span>
                      </td>
                      <td className="p-3">
                        {cert.rid_submitted_at ? (
                          <span className="px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs">
                            Submitted
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-400 text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => copyToClipboard(cert)}
                          className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors group"
                          title="Copy RID data to clipboard"
                        >
                          {copiedId === cert.id ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-slate-500 group-hover:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {monthCertificates.length === 0 && (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No certificates issued in this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Tracking */}
      {subView === "deadlines" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">RID 45-Day Deadline Tracking</h3>
            <select
              value={deadlineFilter}
              onChange={(e) => setDeadlineFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
            >
              <option value="all">All Pending</option>
              <option value="overdue">Overdue</option>
              <option value="urgent">Urgent ({"<"} 14 days)</option>
              <option value="due_soon">Due Soon ({"<"} 30 days)</option>
              <option value="on_track">On Track</option>
            </select>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30">
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Certificate</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Participant</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Module</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">CEUs</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Issued</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Days Since</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Deadline</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deadlines.map((d) => (
                    <tr key={d.certificate_number} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <code className="text-xs text-teal-400">{d.certificate_number}</code>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-slate-200">{d.participant_name}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-slate-300 max-w-[200px] truncate">{d.module_title}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-teal-400">{d.ceu_value}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-xs text-slate-400">{formatDate(d.issued_at)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-300">{d.days_since_issued}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-sm font-medium ${d.days_until_deadline < 0 ? "text-rose-400" : d.days_until_deadline < 14 ? "text-amber-400" : "text-slate-300"}`}>
                          {d.days_until_deadline < 0 ? `${Math.abs(d.days_until_deadline)} overdue` : `${d.days_until_deadline} days`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          d.deadline_status === "overdue" ? "bg-rose-500/20 text-rose-400" :
                          d.deadline_status === "urgent" ? "bg-amber-500/20 text-amber-400" :
                          d.deadline_status === "due_soon" ? "bg-blue-500/20 text-blue-400" :
                          "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {d.deadline_status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {deadlines.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No certificates matching filter
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Grievances */}
      {subView === "grievances" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">CEU Grievances</h3>
            <select
              value={grievanceFilter}
              onChange={(e) => setGrievanceFilter(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="space-y-4">
            {grievances.map((g) => (
              <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        g.status === "open" ? "bg-rose-500/20 text-rose-400" :
                        g.status === "in_review" ? "bg-amber-500/20 text-amber-400" :
                        g.status === "resolved" ? "bg-emerald-500/20 text-emerald-400" :
                        "bg-slate-500/20 text-slate-400"
                      }`}>
                        {g.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500">{g.grievance_type.replace("_", " ")}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{g.user.full_name}</p>
                    <p className="text-xs text-slate-500">{g.user.email}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(g.created_at)}</span>
                </div>

                <p className="text-sm text-slate-300 mb-3">{g.description}</p>

                {g.certificate && (
                  <p className="text-xs text-slate-500 mb-3">
                    Certificate: {g.certificate.certificate_number} - {g.certificate.title}
                  </p>
                )}

                {g.resolution && (
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-3">
                    <p className="text-xs text-emerald-400 mb-1">Resolution:</p>
                    <p className="text-sm text-slate-300">{g.resolution}</p>
                  </div>
                )}

                {g.status !== "resolved" && g.status !== "closed" && (
                  <button
                    onClick={() => {
                      setSelectedGrievance(g);
                      setShowResolveModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30 transition-colors text-sm"
                  >
                    Resolve Grievance
                  </button>
                )}
              </div>
            ))}
            {grievances.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No grievances found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evaluations */}
      {subView === "evaluations" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-100">Course Evaluations</h3>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-teal-500"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.display}</option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            {evaluations.map((e) => {
              const avgRating = ((e.q1_objectives_clear + e.q2_content_relevant + e.q3_applicable_to_work + e.q4_presenter_effective) / 4).toFixed(1);
              return (
                <div key={e.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{e.user.full_name}</p>
                      <p className="text-xs text-slate-500">{e.module.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-400">{avgRating}/5</p>
                      <p className="text-xs text-slate-500">{formatDate(e.submitted_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="p-2 rounded bg-slate-800/50">
                      <p className="text-xs text-slate-500">Objectives Clear</p>
                      <p className="text-lg font-medium text-slate-200">{e.q1_objectives_clear}/5</p>
                    </div>
                    <div className="p-2 rounded bg-slate-800/50">
                      <p className="text-xs text-slate-500">Content Relevant</p>
                      <p className="text-lg font-medium text-slate-200">{e.q2_content_relevant}/5</p>
                    </div>
                    <div className="p-2 rounded bg-slate-800/50">
                      <p className="text-xs text-slate-500">Applicable</p>
                      <p className="text-lg font-medium text-slate-200">{e.q3_applicable_to_work}/5</p>
                    </div>
                    <div className="p-2 rounded bg-slate-800/50">
                      <p className="text-xs text-slate-500">Presenter Effective</p>
                      <p className="text-lg font-medium text-slate-200">{e.q4_presenter_effective}/5</p>
                    </div>
                  </div>

                  {e.q5_most_valuable && (
                    <div className="mb-2">
                      <p className="text-xs text-slate-500 mb-1">Most valuable:</p>
                      <p className="text-sm text-slate-300">{e.q5_most_valuable}</p>
                    </div>
                  )}
                  {e.q6_suggestions && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Suggestions:</p>
                      <p className="text-sm text-slate-300">{e.q6_suggestions}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {evaluations.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No evaluations for this month
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submission History */}
      {subView === "submissions" && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-100">RID Submission History</h3>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/30">
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Submitted</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Period</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Records</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Total CEUs</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Submitted By</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Confirmation #</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <span className="text-sm text-slate-300">{formatDate(s.submitted_at)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-300">{formatDate(s.period_start)} - {formatDate(s.period_end)}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm font-medium text-teal-400">{s.record_count}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-300">{s.total_ceu_value}</span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-slate-300">{s.submitted_by_user?.full_name || "Unknown"}</span>
                      </td>
                      <td className="p-3">
                        {s.confirmation_number ? (
                          <code className="text-xs text-emerald-400">{s.confirmation_number}</code>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No submissions yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Grievance Modal */}
      {showResolveModal && selectedGrievance && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Resolve Grievance</h2>
            <p className="text-sm text-slate-400 mb-4">
              From: {selectedGrievance.user.full_name}<br />
              Type: {selectedGrievance.grievance_type.replace("_", " ")}
            </p>

            <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-300">{selectedGrievance.description}</p>
            </div>

            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution details..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedGrievance(null);
                  setResolution("");
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveGrievance}
                disabled={!resolution.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 transition-colors disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label, color }: { value: number | string; label: string; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: "border-teal-500/30 bg-teal-500/10 text-teal-400",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-400",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <p className={`text-2xl font-bold ${colorClasses[color].split(" ").pop()}`}>{value}</p>
      <p className="text-xs text-slate-400 mt-1">{label}</p>
    </div>
  );
}
