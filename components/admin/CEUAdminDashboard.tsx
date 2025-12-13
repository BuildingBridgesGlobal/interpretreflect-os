"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

// Types
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

type Evaluation = {
  id: string;
  q1_objectives_clear: number;
  q2_content_relevant: number;
  q3_applicable_to_work: number;
  q4_presenter_effective: number;
  q5_most_valuable: string | null;
  q6_suggestions: string | null;
  submitted_at: string;
  created_at: string;
  user: { full_name: string; email: string };
  module: { title: string; module_code: string };
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

type DashboardStats = {
  totalCertificates: number;
  totalCEUs: number;
  pendingSubmission: number;
  overdueCount: number;
  openGrievances: number;
  avgRating: number;
};

type Tab = "submissions" | "compliance" | "analytics";

export default function CEUAdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("submissions");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // Submissions tab state
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [monthSummary, setMonthSummary] = useState<any>(null);
  const [selectedCertificates, setSelectedCertificates] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Compliance tab state
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineAlert[]>([]);
  const [grievanceFilter, setGrievanceFilter] = useState<string>("open");

  // Analytics tab state
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);

  // Modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [resolution, setResolution] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Load initial data
  useEffect(() => {
    loadDashboardStats();
  }, []);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === "submissions") {
      loadCertificates();
    } else if (activeTab === "compliance") {
      loadGrievances();
      loadDeadlines();
    } else if (activeTab === "analytics") {
      loadEvaluations();
    }
  }, [activeTab, selectedMonth, grievanceFilter]);

  const loadDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/api/admin/ceu?action=dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalCertificates: data.overview?.total_certificates || 0,
          totalCEUs: data.overview?.total_ceus || 0,
          pendingSubmission: data.overview?.pending_submission || 0,
          overdueCount: data.overview?.overdue_count || 0,
          openGrievances: data.grievances?.open || 0,
          avgRating: data.evaluations?.avg_rating || 0,
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCertificates = async () => {
    try {
      const response = await fetchWithAuth(`/api/admin/ceu?action=certificates_for_month&month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
        setMonthSummary(data.summary);
        setSelectedCertificates([]);
      }
    } catch (error) {
      console.error("Error loading certificates:", error);
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

  const loadDeadlines = async () => {
    try {
      const response = await fetchWithAuth("/api/admin/ceu?action=deadline_tracking&status=urgent");
      if (response.ok) {
        const data = await response.json();
        setDeadlines(data.certificates || []);
      }
    } catch (error) {
      console.error("Error loading deadlines:", error);
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

  const handleMarkSubmitted = async () => {
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
        alert(`Marked ${result.certificates_submitted || selectedCertificates.length} certificates as submitted.`);
        loadCertificates();
        loadDashboardStats();
      }
    } catch (error) {
      console.error("Error:", error);
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
        loadDashboardStats();
      }
    } catch (error) {
      console.error("Error resolving grievance:", error);
    }
  };

  const exportCSV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const [year, month] = selectedMonth.split("-").map(Number);
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];
      const params = new URLSearchParams({
        start_date: `${selectedMonth}-01`,
        end_date: endDate,
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

  const exportEvaluationsCSV = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`/api/admin/ceu?action=evaluations_export&month=${selectedMonth}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CEU_Evaluations_${selectedMonth}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting evaluations:", error);
    }
  };

  const copyToClipboard = async (cert: Certificate) => {
    const data = [
      cert.user.rid_member_number || "",
      cert.user.full_name,
      cert.user.email,
      cert.title,
      cert.activity_code || "",
      cert.ceu_value,
      cert.rid_category,
      formatDate(cert.issued_at),
      cert.certificate_number,
    ].join("\t");
    try {
      await navigator.clipboard.writeText(data);
      setCopiedId(cert.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const copyAllSelected = async () => {
    const headers = ["RID #", "Name", "Email", "Activity", "Code", "CEUs", "Category", "Date", "Certificate #"];
    const rows = certificates
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
      alert(`Copied ${rows.length} certificates. Paste into Excel/Sheets.`);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Generate month options from platform launch (Dec 2025) through current month
  // This creates a rolling history that grows over time - you can always access old data
  const getMonthOptions = () => {
    const options: { key: string; display: string }[] = [];
    const now = new Date();
    const startDate = new Date(2025, 11, 1); // December 2025 - platform launch

    // Generate months from current month backwards to start date
    let current = new Date(now.getFullYear(), now.getMonth(), 1);
    while (current >= startDate) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
      const display = current.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      options.push({ key, display });
      current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    }
    return options;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 border-teal-500/30 border-t-teal-500 animate-spin" />
      </div>
    );
  }

  const pendingCerts = certificates.filter(c => !c.rid_submitted_at);

  return (
    <div className="space-y-6">
      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat
          value={stats?.pendingSubmission || 0}
          label="Pending RID"
          alert={stats?.pendingSubmission ? stats.pendingSubmission > 0 : false}
        />
        <QuickStat
          value={stats?.overdueCount || 0}
          label="Overdue"
          alert={stats?.overdueCount ? stats.overdueCount > 0 : false}
          alertColor="rose"
        />
        <QuickStat
          value={stats?.openGrievances || 0}
          label="Open Grievances"
        />
        <QuickStat
          value={stats?.avgRating ? `${stats.avgRating}/5` : "-"}
          label="Avg Rating"
        />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <nav className="flex gap-1">
          {[
            { key: "submissions" as Tab, label: "RID Submissions" },
            { key: "compliance" as Tab, label: "Compliance" },
            { key: "analytics" as Tab, label: "Evaluations" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-teal-500 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
              {tab.key === "compliance" && (stats?.openGrievances || 0) > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-rose-500/20 text-rose-400 rounded">
                  {stats?.openGrievances}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* TAB: RID Submissions */}
      {activeTab === "submissions" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {getMonthOptions().map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.display}</option>
                ))}
              </select>
              {monthSummary && (
                <span className="text-sm text-slate-500">
                  {monthSummary.pending} pending / {monthSummary.total} total
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyAllSelected}
                disabled={selectedCertificates.length === 0}
                className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Copy ({selectedCertificates.length})
              </button>
              <button
                onClick={exportCSV}
                className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Export CSV
              </button>
              <button
                onClick={handleMarkSubmitted}
                disabled={selectedCertificates.length === 0 || submitting}
                className="px-3 py-2 text-sm rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "..." : `Mark Submitted (${selectedCertificates.length})`}
              </button>
            </div>
          </div>

          {/* Certificates Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="p-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedCertificates.length === pendingCerts.length && pendingCerts.length > 0}
                        onChange={(e) => {
                          setSelectedCertificates(e.target.checked ? pendingCerts.map(c => c.id) : []);
                        }}
                        className="rounded border-slate-600"
                      />
                    </th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Participant</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">RID #</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Workshop</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">CEUs</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="p-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="p-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className={`hover:bg-slate-800/30 ${cert.rid_submitted_at ? "opacity-60" : ""}`}>
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedCertificates.includes(cert.id)}
                          onChange={(e) => {
                            setSelectedCertificates(e.target.checked
                              ? [...selectedCertificates, cert.id]
                              : selectedCertificates.filter(id => id !== cert.id)
                            );
                          }}
                          disabled={!!cert.rid_submitted_at}
                          className="rounded border-slate-600 disabled:opacity-30"
                        />
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-200">{cert.user.full_name}</p>
                        <p className="text-xs text-slate-500">{cert.user.email}</p>
                      </td>
                      <td className="p-3">
                        {cert.user.rid_member_number ? (
                          <span className="text-slate-300">{cert.user.rid_member_number}</span>
                        ) : (
                          <span className="text-rose-400 text-xs">Missing</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-slate-300 max-w-[200px] truncate" title={cert.title}>{cert.title}</p>
                        <p className="text-xs text-slate-500">{cert.rid_category}</p>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-teal-400">{cert.ceu_value}</span>
                      </td>
                      <td className="p-3 text-slate-400">{formatDate(cert.issued_at)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cert.rid_submitted_at
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {cert.rid_submitted_at ? "Submitted" : "Pending"}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => copyToClipboard(cert)}
                          className="p-1.5 rounded hover:bg-slate-700"
                          title="Copy to clipboard"
                        >
                          {copiedId === cert.id ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {certificates.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500">
                        No certificates for this month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Compliance */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          {/* Deadline Alerts */}
          {deadlines.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <h3 className="text-sm font-semibold text-amber-400 mb-3">
                Urgent: {deadlines.length} certificates approaching 45-day deadline
              </h3>
              <div className="space-y-2">
                {deadlines.slice(0, 5).map((d) => (
                  <div key={d.certificate_number} className="flex items-center justify-between p-2 rounded bg-slate-900/50">
                    <div>
                      <p className="text-sm text-slate-200">{d.participant_name}</p>
                      <p className="text-xs text-slate-500">{d.module_title}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      d.deadline_status === "overdue" ? "bg-rose-500/20 text-rose-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>
                      {d.days_until_deadline < 0
                        ? `${Math.abs(d.days_until_deadline)}d overdue`
                        : `${d.days_until_deadline}d left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grievances */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Grievances</h3>
              <select
                value={grievanceFilter}
                onChange={(e) => setGrievanceFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100"
              >
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="resolved">Resolved</option>
                <option value="all">All</option>
              </select>
            </div>

            <div className="space-y-3">
              {grievances.map((g) => (
                <div key={g.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        g.status === "open" ? "bg-rose-500/20 text-rose-400" :
                        g.status === "in_review" ? "bg-amber-500/20 text-amber-400" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {g.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500">{g.grievance_type.replace("_", " ")}</span>
                    </div>
                    <span className="text-xs text-slate-500">{formatDate(g.created_at)}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">{g.user.full_name}</p>
                  <p className="text-sm text-slate-400 mb-3">{g.description}</p>

                  {g.resolution && (
                    <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 mb-3">
                      <p className="text-xs text-emerald-400">Resolution: {g.resolution}</p>
                    </div>
                  )}

                  {g.status !== "resolved" && g.status !== "closed" && (
                    <button
                      onClick={() => { setSelectedGrievance(g); setShowResolveModal(true); }}
                      className="px-3 py-1.5 rounded text-sm bg-teal-500/20 text-teal-400 hover:bg-teal-500/30"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
              {grievances.length === 0 && (
                <p className="text-center py-8 text-slate-500">No grievances</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-100"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.display}</option>
              ))}
            </select>
            <button
              onClick={exportEvaluationsCSV}
              className="px-3 py-2 text-sm rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Export Evaluations CSV
            </button>
          </div>

          {/* Summary */}
          {evaluations.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-teal-400">{evaluations.length}</p>
                <p className="text-xs text-slate-400">Evaluations</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-violet-400">
                  {(evaluations.reduce((sum, e) =>
                    sum + (e.q1_objectives_clear + e.q2_content_relevant + e.q3_applicable_to_work + e.q4_presenter_effective) / 4, 0
                  ) / evaluations.length).toFixed(1)}/5
                </p>
                <p className="text-xs text-slate-400">Avg Rating</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-emerald-400">
                  {evaluations.filter(e => e.q5_most_valuable).length}
                </p>
                <p className="text-xs text-slate-400">With Feedback</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-2xl font-bold text-amber-400">
                  {evaluations.filter(e => e.q6_suggestions).length}
                </p>
                <p className="text-xs text-slate-400">With Suggestions</p>
              </div>
            </div>
          )}

          {/* Evaluations List */}
          <div className="space-y-3">
            {evaluations.map((e) => {
              const avgRating = ((e.q1_objectives_clear + e.q2_content_relevant + e.q3_applicable_to_work + e.q4_presenter_effective) / 4).toFixed(1);
              return (
                <div key={e.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-200">{e.user?.full_name || "Unknown"}</p>
                      <p className="text-xs text-slate-500">{e.module?.title || "Unknown Module"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-400">{avgRating}/5</p>
                      <p className="text-xs text-slate-500">{formatDate(e.submitted_at || e.created_at)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-2">
                    <MiniRating label="Objectives" value={e.q1_objectives_clear} />
                    <MiniRating label="Relevant" value={e.q2_content_relevant} />
                    <MiniRating label="Applicable" value={e.q3_applicable_to_work} />
                    <MiniRating label="Presenter" value={e.q4_presenter_effective} />
                  </div>

                  {e.q5_most_valuable && (
                    <p className="text-sm text-slate-400 mt-2">
                      <span className="text-slate-500">Most valuable:</span> {e.q5_most_valuable}
                    </p>
                  )}
                  {e.q6_suggestions && (
                    <p className="text-sm text-slate-400 mt-1">
                      <span className="text-slate-500">Suggestions:</span> {e.q6_suggestions}
                    </p>
                  )}
                </div>
              );
            })}
            {evaluations.length === 0 && (
              <p className="text-center py-8 text-slate-500">No evaluations for this month</p>
            )}
          </div>
        </div>
      )}

      {/* Resolve Grievance Modal */}
      {showResolveModal && selectedGrievance && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-slate-100 mb-4">Resolve Grievance</h2>
            <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <p className="text-sm text-slate-400 mb-1">{selectedGrievance.user.full_name} - {selectedGrievance.grievance_type}</p>
              <p className="text-sm text-slate-300">{selectedGrievance.description}</p>
            </div>
            <textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Enter resolution..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResolveModal(false); setSelectedGrievance(null); setResolution(""); }}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleResolveGrievance}
                disabled={!resolution.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 font-medium hover:bg-teal-400 disabled:opacity-50"
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

// Helper Components
function QuickStat({ value, label, alert = false, alertColor = "amber" }: {
  value: number | string;
  label: string;
  alert?: boolean;
  alertColor?: "amber" | "rose";
}) {
  const colors = {
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    rose: "border-rose-500/30 bg-rose-500/10 text-rose-400",
    default: "border-slate-700 bg-slate-800/50 text-slate-300",
  };
  const colorClass = alert ? colors[alertColor] : colors.default;

  return (
    <div className={`rounded-lg border p-3 ${colorClass}`}>
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
    </div>
  );
}

function MiniRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center p-1.5 rounded bg-slate-800/50">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium text-slate-200">{value || 0}</p>
    </div>
  );
}
