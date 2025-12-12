"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import { motion } from "framer-motion";
import CEUGrievanceForm from "@/components/CEUGrievanceForm";

interface CEUSummary {
  professional_studies_earned: number;
  professional_studies_required: number;
  ppo_earned: number;
  ppo_required: number;
  general_studies_earned: number;
  general_studies_max: number;
  total_earned: number;
  total_required: number;
  is_compliant: boolean;
}

interface Certificate {
  id: string;
  certificate_number: string;
  title: string;
  description: string;
  ceu_value: number;
  rid_category: string;
  rid_subcategory?: string;
  knowledge_level?: "little_none" | "some" | "extensive";
  learning_objectives_achieved: any[];
  assessment_score: number | null;
  completed_at: string;
  issued_at: string;
  time_spent_minutes: number;
  rid_member_number?: string;
  presenter?: string;
  skill_modules?: {
    module_code: string;
    title: string;
  };
  skill_series?: {
    series_code: string;
    title: string;
  };
}

interface ModuleProgress {
  id: string;
  status: string;
  completed_at: string | null;
  assessment_completed: boolean;
  assessment_score: number | null;
  assessment_passed: boolean | null;
  certificate_id: string | null;
  skill_modules: {
    id: string;
    module_code: string;
    title: string;
    duration_minutes: number;
    ceu_value: number | null;
    rid_category: string | null;
    ceu_eligible: boolean;
    learning_objectives: any[] | null;
    assessment_questions: any[] | null;
    assessment_pass_threshold: number;
  };
}

interface CycleInfo {
  start: string;
  end: string;
  year: number;
}

interface Workshop {
  id: string;
  module_code: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  duration_minutes: number;
  ceu_value: number | null;
  rid_category: string | null;
  ceu_eligible: boolean;
  series?: {
    title: string;
    series_code: string;
  };
}

export default function CEUDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CEUSummary | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress[]>([]);
  const [availableCEUs, setAvailableCEUs] = useState(0);
  const [cycle, setCycle] = useState<CycleInfo | null>(null);
  const [selectedTab, setSelectedTab] = useState<"overview" | "workshops" | "certificates" | "progress" | "credits">("overview");
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [userTier, setUserTier] = useState<string>("free"); // Default to free
  const [tierChecked, setTierChecked] = useState(false);
  const [availableWorkshops, setAvailableWorkshops] = useState<Workshop[]>([]);
  const [credits, setCredits] = useState<{ monthly: number; topup: number; total: number; reset_at?: string }>({
    monthly: 0,
    topup: 0,
    total: 0,
  });
  const [showGrievanceForm, setShowGrievanceForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadCEUData();
  }, []);

  const loadCEUData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }

      // Store user ID for grievance form
      setUserId(session.user.id);

      // Check user's subscription tier
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", session.user.id)
        .single();

      // Debug: log the actual tier value
      console.log("[CEU Page] Profile data:", profile);
      console.log("[CEU Page] Profile error:", profileError);
      console.log("[CEU Page] Subscription tier:", profile?.subscription_tier);

      // Default to free if no tier found (safer - blocks access)
      const tier = profile?.subscription_tier || "free";
      setUserTier(tier);
      setTierChecked(true);

      // Fetch credit balance for Growth and Pro users (both get monthly credits)
      if (tier === "pro" || tier === "growth") {
        try {
          const creditsResponse = await fetch("/api/ceu?action=credits", {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          });
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            setCredits(creditsData.credits);
          }
          // Also load billing history for pro/growth users
          try {
            const { data: historyData, error: historyError } = await (supabase as any)
              .from("credit_transactions")
              .select("*")
              .eq("user_id", session.user.id)
              .order("created_at", { ascending: false })
              .limit(10);

            if (!historyError && historyData) {
              setBillingHistory(historyData);
            }
          } catch (historyErr) {
            console.error("Error loading billing history:", historyErr);
          }
          setLoadingHistory(false);
        } catch (err) {
          console.error("Error fetching credits:", err);
          setLoadingHistory(false);
        }
      } else {
        setLoadingHistory(false);
      }

      // Fetch available CEU workshops (only 30+ min content qualifies for CEUs)
      // Short modules (<30 min) are now "Quick Skills" and don't appear here
      const { data: workshops } = await supabase
        .from("skill_modules")
        .select(`
          id,
          module_code,
          title,
          subtitle,
          description,
          duration_minutes,
          ceu_value,
          rid_category,
          ceu_eligible,
          skill_series:series_id (
            title,
            series_code
          )
        `)
        .eq("ceu_eligible", true)
        .eq("is_active", true)
        .gte("duration_minutes", 30) // Only workshops 30+ minutes qualify for CEUs
        .order("module_code", { ascending: true });

      if (workshops) {
        setAvailableWorkshops(workshops as unknown as Workshop[]);
      }

      // If not pro or growth, don't load full CEU data (they'll see the upgrade prompt with workshops)
      if (tier !== "pro" && tier !== "growth") {
        console.log("[CEU Page] User is free tier, showing upgrade prompt");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/ceu?action=summary", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load CEU data");
      }

      const data = await response.json();
      setSummary(data.summary);
      setCertificates(data.certificates || []);
      setModuleProgress(data.moduleProgress || []);
      setAvailableCEUs(data.availableCEUs || 0);
      setCycle(data.cycle);
    } catch (error) {
      console.error("Error loading CEU data:", error);
      // On error, default to blocking (safer)
      setUserTier("basic");
      setTierChecked(true);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (earned: number, required: number) => {
    return Math.min(100, Math.round((earned / required) * 100));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle top-up purchase
  const handleTopUp = async (packageName: string) => {
    setLoadingCheckout(`topup-${packageName}`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoadingCheckout(null);
      return;
    }

    try {
      const response = await fetch("/api/credits/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ package: packageName }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Top-up error:", error);
    } finally {
      setLoadingCheckout(null);
    }
  };

  const downloadCertificate = (cert: Certificate) => {
    // Generate printable certificate
    const certWindow = window.open("", "_blank");
    if (!certWindow) return;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>CEU Certificate - ${cert.certificate_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600&display=swap');

    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px;
      background: #f8fafc;
    }

    .certificate {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border: 3px solid #0d9488;
      border-radius: 8px;
      padding: 60px;
      position: relative;
    }

    .certificate::before {
      content: '';
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      bottom: 10px;
      border: 1px solid #99f6e4;
      border-radius: 4px;
      pointer-events: none;
    }

    .header {
      text-align: center;
      margin-bottom: 40px;
    }

    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 8px;
    }

    .logo span {
      color: #0d9488;
    }

    .subtitle {
      color: #64748b;
      font-size: 14px;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    .main-title {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      color: #0f172a;
      text-align: center;
      margin: 40px 0 20px;
    }

    .cert-number {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      margin-bottom: 30px;
    }

    .details {
      background: #f0fdfa;
      border-radius: 8px;
      padding: 24px;
      margin: 30px 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      color: #64748b;
      font-size: 14px;
    }

    .detail-value {
      color: #0f172a;
      font-weight: 600;
      font-size: 14px;
    }

    .ceu-badge {
      text-align: center;
      margin: 30px 0;
    }

    .ceu-value {
      display: inline-block;
      background: linear-gradient(135deg, #0d9488, #14b8a6);
      color: white;
      font-size: 48px;
      font-weight: 700;
      padding: 20px 40px;
      border-radius: 12px;
    }

    .ceu-label {
      color: #64748b;
      font-size: 14px;
      margin-top: 8px;
    }

    .objectives {
      margin: 30px 0;
    }

    .objectives-title {
      font-weight: 600;
      color: #0f172a;
      margin-bottom: 12px;
    }

    .objective-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 8px 0;
      color: #475569;
      font-size: 14px;
    }

    .objective-check {
      color: #0d9488;
      flex-shrink: 0;
    }

    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }

    .sponsor-info {
      color: #64748b;
      font-size: 12px;
    }

    .verification {
      margin-top: 20px;
      color: #94a3b8;
      font-size: 11px;
    }

    @media print {
      body { padding: 0; background: white; }
      .certificate { border: 2px solid #0d9488; }
    }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="header">
      <div class="logo">Interpret<span>Reflect</span></div>
      <div class="subtitle">Continuing Education Certificate</div>
    </div>

    <h1 class="main-title">${cert.title}</h1>
    <div class="cert-number">Certificate #${cert.certificate_number}</div>
    ${cert.rid_member_number ? `<div class="rid-member" style="text-align: center; color: #64748b; font-size: 14px; margin-bottom: 20px;">RID Member #${cert.rid_member_number}</div>` : ''}

    <div class="ceu-badge">
      <div class="ceu-value">${cert.ceu_value}</div>
      <div class="ceu-label">CEU${cert.ceu_value !== 1 ? 's' : ''} Earned - ${cert.rid_category}${cert.rid_subcategory ? ` (${cert.rid_subcategory})` : ''}</div>
      ${cert.knowledge_level ? `<div class="knowledge-level" style="color: #64748b; font-size: 12px; margin-top: 8px;">Knowledge Level: ${cert.knowledge_level === 'little_none' ? 'Little/None' : cert.knowledge_level === 'some' ? 'Some' : 'Extensive'}</div>` : ''}
    </div>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Completed</span>
        <span class="detail-value">${formatDate(cert.completed_at)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Time Invested</span>
        <span class="detail-value">${cert.time_spent_minutes} minutes</span>
      </div>
      ${cert.assessment_score ? `
      <div class="detail-row">
        <span class="detail-label">Assessment Score</span>
        <span class="detail-value">${cert.assessment_score}%</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">RID Activity Type</span>
        <span class="detail-value">Sponsor Initiated Activity (SIA)</span>
      </div>
    </div>

    ${cert.learning_objectives_achieved && cert.learning_objectives_achieved.length > 0 ? `
    <div class="objectives">
      <div class="objectives-title">Learning Objectives Achieved</div>
      ${cert.learning_objectives_achieved.map((obj: any) => `
        <div class="objective-item">
          <span class="objective-check">✓</span>
          <span>${obj.objective}</span>
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="presenter" style="text-align: center; margin: 30px 0; padding: 20px; background: #f0fdfa; border-radius: 8px;">
      <p style="color: #64748b; font-size: 12px; margin-bottom: 4px;">Presenter</p>
      <p style="color: #0f172a; font-weight: 600; font-size: 16px;">${cert.presenter || 'Sarah Wheeler, MA'}</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 4px;">InterpretReflect</p>
    </div>

    <div class="footer">
      <div class="sponsor-info">
        <strong>RID CMP Sponsor #2309</strong><br>
        InterpretReflect by Building Bridges Global
      </div>
      <div class="verification">
        This certificate verifies completion of professional development activities.<br>
        Date of Completion: ${formatDate(cert.completed_at || cert.issued_at)} | Certificate ID: ${cert.certificate_number}
      </div>
    </div>
  </div>

  <script>window.print();</script>
</body>
</html>
    `;

    certWindow.document.write(html);
    certWindow.document.close();
  };

  if (loading || !tierChecked) {
    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-teal-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for Free users only
  // Growth and Pro users have access to CEU workshops
  if (userTier !== "pro" && userTier !== "growth") {
    console.log("[CEU Page Render] Blocking free tier user:", userTier);

    // Calculate total available CEUs from workshops
    const totalAvailableCEUs = availableWorkshops.reduce((sum, w) => sum + (w.ceu_value || 0), 0);

    return (
      <div className="min-h-screen bg-slate-950 relative overflow-hidden">
        <NavBar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-100 mb-2">CEU Dashboard</h1>
            <p className="text-slate-400">
              Track your continuing education units for your RID certification cycle
            </p>
          </div>

          {/* Locked Progress Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 relative overflow-hidden min-h-[200px]">
              {/* Blur overlay */}
              <div className="absolute inset-0 backdrop-blur-sm bg-slate-950/70 z-10 flex items-center justify-center p-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
                    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">CEU Progress Tracking</h3>
                  <p className="text-slate-400 text-xs mb-3">Upgrade to Pro to track your RID certification progress</p>
                  <button
                    onClick={() => router.push("/settings?tab=billing")}
                    className="px-5 py-2 bg-teal-400 hover:bg-teal-300 text-slate-950 text-sm font-semibold rounded-lg transition-all"
                  >
                    Unlock with Pro
                  </button>
                </div>
              </div>

              {/* Blurred background content (for visual effect) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40">
                <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
                  <p className="text-2xl font-bold text-teal-400">0.00</p>
                  <p className="text-xs text-slate-300 mt-1">of 8.0 CEUs</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full" />
                </div>
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                  <p className="text-2xl font-bold text-violet-400">0.00</p>
                  <p className="text-xs text-slate-300 mt-1">of 6.0 Prof. Studies</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full" />
                </div>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                  <p className="text-2xl font-bold text-amber-400">0.00</p>
                  <p className="text-xs text-slate-300 mt-1">of 1.0 PPO</p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full" />
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                  <p className="text-2xl font-bold text-blue-400">0</p>
                  <p className="text-xs text-slate-300 mt-1">Certificates</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Available Workshops Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Available CEU Workshops</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {availableWorkshops.length} workshops • {totalAvailableCEUs.toFixed(2)} total CEUs available
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30">
                <span className="text-xs font-bold text-teal-400">RID</span>
                <span className="text-xs text-slate-400">Sponsor #2309</span>
              </div>
            </div>

            {/* Workshop Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {availableWorkshops.map((workshop, index) => (
                <motion.div
                  key={workshop.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="group rounded-xl border border-slate-700 bg-slate-900/50 p-5 hover:border-teal-500/30 transition-all relative overflow-hidden"
                >
                  {/* Lock badge */}
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>

                  {/* CEU Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">
                      {workshop.ceu_value?.toFixed(2) || "0.00"} CEU
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      workshop.rid_category === "Professional Studies"
                        ? "bg-violet-500/20 text-violet-400"
                        : workshop.rid_category === "PPO"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {workshop.rid_category === "Professional Studies" ? "Prof. Studies" : workshop.rid_category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-slate-100 mb-1 pr-10">
                    {workshop.title} <span className="text-slate-400 font-normal">({workshop.duration_minutes} min)</span>
                  </h3>
                  {workshop.subtitle && (
                    <p className="text-xs text-slate-500 mb-2">{workshop.subtitle}</p>
                  )}

                  {/* Description */}
                  <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                    {workshop.description || "Interactive workshop with assessment"}
                  </p>

                  {/* Meta */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {workshop.duration_minutes} min
                    </span>
                    <span>{workshop.module_code}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                    <button
                      onClick={() => router.push("/settings?tab=billing")}
                      className="px-4 py-2 bg-teal-400 text-slate-950 text-sm font-semibold rounded-lg hover:bg-teal-300 transition-all"
                    >
                      Upgrade to Access
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* No workshops - Coming Soon state */}
            {availableWorkshops.length === 0 && (
              <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 p-8 md:p-12 text-center">
                {/* Animated gradient orb background */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-teal-500/5 blur-3xl animate-pulse" />
                  </div>

                  {/* Icon */}
                  <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-violet-500/20 border border-teal-500/30 flex items-center justify-center">
                    <svg className="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Text */}
                  <h3 className="text-2xl font-bold text-slate-100 mb-3">CEU Workshops Coming Soon</h3>
                  <p className="text-slate-400 text-base max-w-lg mx-auto mb-6 leading-relaxed">
                    We're preparing RID-approved workshops with professional video content, comprehensive assessments, and official certificates.
                  </p>

                  {/* Features preview */}
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                      <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-slate-300">RID Approved</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-slate-300">Assessments</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-xs text-slate-300">Certificates</span>
                    </div>
                  </div>

                  {/* RID Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <span className="text-sm font-bold text-teal-400">RID</span>
                    <span className="text-sm text-slate-400">CMP Sponsor #2309</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Sticky Upgrade CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-violet-500/10 p-6"
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100 mb-1">
                  Unlock All CEU Workshops
                </h2>
                <p className="text-slate-400 text-sm">
                  <span className="text-2xl font-bold text-teal-400">$30</span>
                  <span className="text-slate-500">/month</span>
                  <span className="text-slate-400 ml-2">• 0.2 RID CEUs/month (2 hrs of workshops) • Track RID compliance</span>
                </p>
              </div>
              <button
                onClick={() => router.push("/settings?tab=billing")}
                className="px-8 py-3 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-lg transition-all shadow-lg shadow-teal-400/20"
              >
                Upgrade to Pro
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Need more? Pro members can purchase extra credits: $5/2, $8/4, or $14/8 credits
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <NavBar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">CEU Dashboard</h1>
            <p className="text-slate-400">
              Track your continuing education units for your RID certification cycle
              {cycle && ` (${cycle.year})`}
            </p>
          </div>
          <button
            onClick={() => setShowGrievanceForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:text-slate-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Report Issue
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-teal-400">
                {summary?.total_earned.toFixed(1) || "0.0"}
              </p>
              {cycle && (
                <div className="text-right">
                  <p className="text-xs text-slate-400">Due</p>
                  <p className="text-sm font-medium text-teal-300">
                    {new Date(cycle.end).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-slate-300 mt-1">
              of {summary?.total_required || 8.0} CEUs
            </p>
            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all"
                style={{
                  width: `${getProgressPercentage(
                    summary?.total_earned || 0,
                    summary?.total_required || 8
                  )}%`,
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-5"
          >
            <p className="text-3xl font-bold text-violet-400">
              {summary?.professional_studies_earned.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-slate-300 mt-1">
              of {summary?.professional_studies_required || 6.0} Prof. Studies
            </p>
            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all"
                style={{
                  width: `${getProgressPercentage(
                    summary?.professional_studies_earned || 0,
                    summary?.professional_studies_required || 6
                  )}%`,
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"
          >
            <p className="text-3xl font-bold text-amber-400">
              {summary?.ppo_earned.toFixed(2) || "0.00"}
            </p>
            <p className="text-sm text-slate-300 mt-1">
              of {summary?.ppo_required || 1.0} PPO
            </p>
            <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${getProgressPercentage(
                    summary?.ppo_earned || 0,
                    summary?.ppo_required || 1
                  )}%`,
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5"
          >
            <p className="text-3xl font-bold text-blue-400">{certificates.length}</p>
            <p className="text-sm text-slate-300 mt-1">Certificates Earned</p>
            {availableCEUs > 0 && (
              <p className="text-xs text-emerald-400 mt-2">
                +{availableCEUs.toFixed(2)} CEUs available to claim
              </p>
            )}
          </motion.div>
        </div>

        {/* Compliance Status */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`rounded-xl border p-6 mb-8 ${
              summary.is_compliant
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-slate-600 bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-4">
              {summary.is_compliant ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-400">Cycle Requirements Met</h3>
                    <p className="text-sm text-slate-300">
                      You've completed all CEU requirements for this certification cycle.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">In Progress</h3>
                    <p className="text-sm text-slate-400">
                      Keep learning! You need{" "}
                      <span className="text-teal-400 font-medium">
                        {Math.max(0, (summary.total_required || 8) - (summary.total_earned || 0)).toFixed(2)} more CEUs
                      </span>{" "}
                      to complete this cycle.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-800 pb-2 overflow-x-auto">
          {(["overview", "workshops", "certificates", "progress", "credits"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedTab === tab
                  ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "overview" && "Overview"}
              {tab === "workshops" && `Workshops (${availableWorkshops.length})`}
              {tab === "certificates" && `Certificates (${certificates.length})`}
              {tab === "progress" && "Module Progress"}
              {tab === "credits" && "Buy Credits"}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === "overview" && (
          <div className="space-y-6">
            {/* RID Requirements Breakdown */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                RID Certification Requirements
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Professional Studies</p>
                    <p className="text-xs text-slate-500">Required: 6.0 CEUs minimum</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-violet-400">
                      {summary?.professional_studies_earned.toFixed(2)} / 6.00
                    </p>
                    <p className={`text-xs ${
                      (summary?.professional_studies_earned || 0) >= 6 ? "text-emerald-400" : "text-slate-500"
                    }`}>
                      {(summary?.professional_studies_earned || 0) >= 6 ? "Complete" : `${(6 - (summary?.professional_studies_earned || 0)).toFixed(2)} remaining`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Power, Privilege & Oppression (PPO)</p>
                    <p className="text-xs text-slate-500">Required: 1.0 CEU minimum</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-400">
                      {summary?.ppo_earned.toFixed(2)} / 1.00
                    </p>
                    <p className={`text-xs ${
                      (summary?.ppo_earned || 0) >= 1 ? "text-emerald-400" : "text-slate-500"
                    }`}>
                      {(summary?.ppo_earned || 0) >= 1 ? "Complete" : `${(1 - (summary?.ppo_earned || 0)).toFixed(2)} remaining`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                  <div>
                    <p className="text-sm font-medium text-slate-200">General Studies</p>
                    <p className="text-xs text-slate-500">Maximum: 2.0 CEUs can count</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-400">
                      {Math.min(summary?.general_studies_earned || 0, 2).toFixed(2)} / 2.00
                    </p>
                    <p className="text-xs text-slate-500">
                      {(summary?.general_studies_earned || 0) > 2
                        ? `${((summary?.general_studies_earned || 0) - 2).toFixed(2)} excess (won't count)`
                        : "Optional category"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-lg bg-teal-500/10 border border-teal-500/30">
                <p className="text-sm text-slate-300">
                  <span className="font-semibold text-teal-400">New for Dec 2025:</span> InterpretReflect modules qualify for the new
                  "Studies of Healthy Minds and Bodies" category under Professional Studies. This content directly addresses
                  emotional wellness management in interpreting work.
                </p>
              </div>
            </div>

            {/* Recent Certificates */}
            {certificates.length > 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Recent Certificates</h3>
                <div className="space-y-3">
                  {certificates.slice(0, 3).map((cert) => (
                    <div
                      key={cert.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer"
                      onClick={() => setSelectedCertificate(cert)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                          <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{cert.title}</p>
                          <p className="text-xs text-slate-500">{formatDate(cert.issued_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-teal-400">{cert.ceu_value}</p>
                        <p className="text-xs text-slate-500">CEU</p>
                      </div>
                    </div>
                  ))}
                </div>
                {certificates.length > 3 && (
                  <button
                    onClick={() => setSelectedTab("certificates")}
                    className="w-full mt-4 py-2 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                  >
                    View all {certificates.length} certificates →
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {selectedTab === "workshops" && (
          <div className="space-y-6">
            {/* Credit Balance Info */}
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-teal-400">{credits.total}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      Credits Available
                      {credits.monthly > 0 && <span className="text-slate-400"> ({credits.monthly} monthly{credits.topup > 0 ? ` + ${credits.topup} top-up` : ""})</span>}
                    </p>
                    <p className="text-xs text-slate-400">1 credit = 30 min (0.05 CEU) • 2 credits = 60 min (0.1 CEU)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Need more?</p>
                  <button
                    onClick={() => router.push("/settings?tab=billing")}
                    className="text-xs text-teal-400 hover:text-teal-300"
                  >
                    Buy credits →
                  </button>
                </div>
              </div>
            </div>

            {/* Growth tier upsell - show banner to upgrade for more credits */}
            {userTier === "growth" && (
              <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-100">
                      Want more CEU workshops?
                    </p>
                    <p className="text-xs text-slate-400">
                      Upgrade to Pro for 6 credits/month (0.3 CEUs) instead of 2 credits
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/settings?tab=billing")}
                    className="px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            )}

            {/* Workshop count info */}
            {availableWorkshops.length > 0 && (
              <div className="text-sm text-slate-400">
                {availableWorkshops.length} CEU workshop{availableWorkshops.length !== 1 ? "s" : ""} available
              </div>
            )}

            {/* Workshop Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableWorkshops.map((workshop) => {
                // Check if user has progress on this workshop
                const progress = moduleProgress.find(p => p.skill_modules?.module_code === workshop.module_code);
                const isCompleted = progress?.status === "completed";
                const isInProgress = progress?.status === "in_progress";
                const hasCertificate = progress?.certificate_id;

                return (
                  <div
                    key={workshop.id}
                    className={`rounded-xl border p-5 transition-all cursor-pointer hover:border-teal-500/50 ${
                      hasCertificate
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : isCompleted
                        ? "border-teal-500/30 bg-teal-500/5"
                        : isInProgress
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-slate-700 bg-slate-900/50"
                    }`}
                    onClick={() => router.push(`/ceu/workshop/${workshop.module_code}`)}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-bold">
                          {workshop.ceu_value?.toFixed(2) || "0.00"} CEU
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          workshop.rid_category === "Professional Studies"
                            ? "bg-violet-500/20 text-violet-400"
                            : workshop.rid_category === "PPO"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {workshop.rid_category === "Professional Studies" ? "Prof. Studies" : workshop.rid_category}
                        </span>
                      </div>
                      {hasCertificate && (
                        <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                          Certified
                        </span>
                      )}
                      {isCompleted && !hasCertificate && (
                        <span className="px-2 py-1 rounded-full bg-teal-500/20 text-teal-400 text-xs font-medium">
                          Completed
                        </span>
                      )}
                      {isInProgress && (
                        <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                          In Progress
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-slate-100 mb-1">
                      {workshop.title} <span className="text-slate-400 font-normal">({workshop.duration_minutes} min)</span>
                    </h3>
                    {workshop.subtitle && (
                      <p className="text-xs text-slate-500 mb-2">{workshop.subtitle}</p>
                    )}

                    {/* Description */}
                    <p className="text-sm text-slate-400 line-clamp-2 mb-3">
                      {workshop.description || "Interactive workshop with assessment"}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {workshop.duration_minutes} min
                        </span>
                        <span>{workshop.module_code}</span>
                      </div>
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* No workshops - Coming Soon state */}
            {availableWorkshops.length === 0 && (
              <div className="rounded-2xl border border-teal-500/20 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/30 p-8 md:p-12 text-center">
                {/* Animated gradient orb background */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-teal-500/5 blur-3xl animate-pulse" />
                  </div>

                  {/* Icon */}
                  <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-teal-500/20 to-violet-500/20 border border-teal-500/30 flex items-center justify-center">
                    <svg className="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Text */}
                  <h3 className="text-2xl font-bold text-slate-100 mb-3">CEU Workshops Coming Soon</h3>
                  <p className="text-slate-400 text-base max-w-lg mx-auto mb-6 leading-relaxed">
                    We're preparing RID-approved workshops with professional video content, comprehensive assessments, and official certificates. You'll be notified when new workshops are available.
                  </p>

                  {/* Features preview */}
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                      <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-xs text-slate-300">RID Approved</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs text-slate-300">Assessments</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700">
                      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-xs text-slate-300">Certificates</span>
                    </div>
                  </div>

                  {/* RID Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30">
                    <span className="text-sm font-bold text-teal-400">RID</span>
                    <span className="text-sm text-slate-400">CMP Sponsor #2309</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {selectedTab === "certificates" && (
          <div className="space-y-4">
            {certificates.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Certificates Yet</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Complete CEU workshops and pass assessments to earn certificates.
                </p>
                <button
                  onClick={() => setSelectedTab("workshops")}
                  className="px-4 py-2 bg-teal-500 text-slate-950 font-medium rounded-lg hover:bg-teal-400 transition-colors"
                >
                  Browse Workshops
                </button>
              </div>
            ) : (
              certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-slate-100">{cert.title}</h4>
                        <p className="text-sm text-slate-400 mt-1">{cert.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <span className="text-xs text-slate-500">
                            #{cert.certificate_number}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatDate(cert.issued_at)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            cert.rid_category === "Professional Studies"
                              ? "bg-violet-500/20 text-violet-400"
                              : cert.rid_category === "PPO"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}>
                            {cert.rid_category}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-teal-400">{cert.ceu_value}</p>
                      <p className="text-xs text-slate-500">CEUs</p>
                      <button
                        onClick={() => downloadCertificate(cert)}
                        className="mt-3 px-3 py-1 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700 transition-colors"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === "progress" && (
          <div className="space-y-4">
            {moduleProgress.length === 0 ? (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center">
                <p className="text-slate-400">No module progress yet. Start your first Skills Training module!</p>
                <button
                  onClick={() => router.push("/skills")}
                  className="mt-4 px-4 py-2 bg-teal-500 text-slate-950 font-medium rounded-lg hover:bg-teal-400 transition-colors"
                >
                  Browse Modules
                </button>
              </div>
            ) : (
              moduleProgress.map((progress) => {
                const module = progress.skill_modules;
                return (
                  <div
                    key={progress.id}
                    className="rounded-xl border border-slate-700 bg-slate-900/50 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          progress.status === "completed" && progress.certificate_id
                            ? "bg-emerald-500/20"
                            : progress.status === "completed"
                            ? "bg-teal-500/20"
                            : progress.status === "in_progress"
                            ? "bg-amber-500/20"
                            : "bg-slate-800"
                        }`}>
                          {progress.status === "completed" && progress.certificate_id ? (
                            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : progress.status === "completed" ? (
                            <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : progress.status === "in_progress" ? (
                            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">{module.title}</p>
                          <p className="text-xs text-slate-500">
                            {module.module_code} • {module.duration_minutes} min
                            {module.ceu_eligible && module.ceu_value && (
                              <span className="text-teal-400"> • {module.ceu_value} CEU</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {progress.certificate_id ? (
                          <span className="text-xs px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">
                            Certificate Earned
                          </span>
                        ) : progress.status === "completed" && module.assessment_questions ? (
                          progress.assessment_passed ? (
                            <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded-full">
                              Ready to Claim CEU
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                              Assessment Required
                            </span>
                          )
                        ) : progress.status === "completed" ? (
                          <span className="text-xs px-2 py-1 bg-teal-500/20 text-teal-400 rounded-full">
                            Completed
                          </span>
                        ) : progress.status === "in_progress" ? (
                          <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                            In Progress
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-slate-700 text-slate-400 rounded-full">
                            Not Started
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Credits Tab */}
        {selectedTab === "credits" && (
          <div className="space-y-6">
            {/* Current Credits Card */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Your CEU Credits</h3>
                  <p className="text-sm text-slate-400">Use credits to access RID-approved workshops</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Monthly</p>
                  <p className="text-2xl font-bold text-amber-400">{credits.monthly}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/50">
                  <p className="text-xs text-slate-400">Top-Up</p>
                  <p className="text-2xl font-bold text-teal-400">{credits.topup}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-slate-800/50 border border-amber-500/30">
                  <p className="text-xs text-slate-400">Total</p>
                  <p className="text-2xl font-bold text-white">{credits.total}</p>
                </div>
              </div>

              {/* Monthly Credit Counter with Reset Date */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-slate-200">Monthly Credits</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-amber-400">{credits.monthly}</span>
                    <span className="text-sm text-slate-400">/{userTier === "pro" ? "6" : "2"}</span>
                    <span className="text-xs text-slate-500 ml-1">remaining</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(credits.monthly / (userTier === "pro" ? 6 : 2)) * 100}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    {userTier === "pro" ? "Pro Plan: 6 credits/month" : "Growth Plan: 2 credits/month"}
                  </span>
                  {credits.reset_at && (() => {
                    // Calculate the next reset date from the last reset
                    const lastReset = new Date(credits.reset_at);
                    const now = new Date();
                    const nextReset = new Date(lastReset);

                    // Keep adding months until we're in the future
                    while (nextReset <= now) {
                      nextReset.setMonth(nextReset.getMonth() + 1);
                    }

                    return (
                      <span className="text-amber-400/80 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Resets {nextReset.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                Monthly credits refresh on your billing date. Top-up credits never expire.
              </p>

              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-1">Credit Value</p>
                <p className="text-sm text-slate-300">1 credit = 30 min (0.05 CEU) • 2 credits = 60 min (0.1 CEU)</p>
              </div>
            </div>

            {/* Top-Up Packages */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Buy More Credits</h3>
              <p className="text-sm text-slate-400 mb-6">Top-up credits never expire and can be used anytime.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => handleTopUp("small")}
                  disabled={loadingCheckout !== null}
                  className="p-5 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-teal-500/50 hover:bg-slate-800 transition-all text-center disabled:opacity-50"
                >
                  <p className="text-3xl font-bold text-teal-400">2</p>
                  <p className="text-sm text-slate-400 mb-2">credits</p>
                  <p className="text-lg font-semibold text-slate-200">$15</p>
                  <p className="text-xs text-slate-500 mt-1">0.1 CEU value</p>
                  {loadingCheckout === "topup-small" && (
                    <p className="text-xs text-teal-400 mt-2">Processing...</p>
                  )}
                </button>

                <button
                  onClick={() => handleTopUp("medium")}
                  disabled={loadingCheckout !== null}
                  className="p-5 rounded-xl border border-teal-500/50 bg-teal-500/10 hover:bg-teal-500/20 transition-all text-center relative disabled:opacity-50"
                >
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-teal-500 text-white text-xs font-medium rounded-full">
                    10% Off
                  </span>
                  <p className="text-3xl font-bold text-teal-400">4</p>
                  <p className="text-sm text-slate-400 mb-2">credits</p>
                  <p className="text-lg font-semibold text-slate-200">$27</p>
                  <p className="text-xs text-slate-500 mt-1">0.2 CEU value</p>
                  {loadingCheckout === "topup-medium" && (
                    <p className="text-xs text-teal-400 mt-2">Processing...</p>
                  )}
                </button>

                <button
                  onClick={() => handleTopUp("large")}
                  disabled={loadingCheckout !== null}
                  className="p-5 rounded-xl border border-violet-500/50 bg-violet-500/10 hover:bg-violet-500/20 transition-all text-center relative disabled:opacity-50"
                >
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-violet-500 text-white text-xs font-medium rounded-full">
                    20% Off
                  </span>
                  <p className="text-3xl font-bold text-violet-400">8</p>
                  <p className="text-sm text-slate-400 mb-2">credits</p>
                  <p className="text-lg font-semibold text-slate-200">$48</p>
                  <p className="text-xs text-slate-500 mt-1">0.4 CEU value</p>
                  {loadingCheckout === "topup-large" && (
                    <p className="text-xs text-violet-400 mt-2">Processing...</p>
                  )}
                </button>
              </div>
            </div>

            {/* Credit History */}
            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Credit History</h3>
              {loadingHistory ? (
                <div className="text-center py-4 text-slate-400">Loading...</div>
              ) : billingHistory.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No credit transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {billingHistory.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          tx.amount > 0 ? "bg-emerald-500/20" : "bg-rose-500/20"
                        }`}>
                          {tx.amount > 0 ? (
                            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-slate-200">{tx.description}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-sm font-medium ${tx.amount > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {tx.amount > 0 ? "+" : ""}{tx.amount} credits
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upgrade Prompt for Growth Tier (to get more credits) */}
            {userTier === "growth" && (
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Want More Monthly Credits?</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Upgrade to Pro for 6 monthly credits (0.3 CEUs) instead of 2 credits.
                </p>
                <button
                  onClick={() => router.push("/settings?tab=billing")}
                  className="px-4 py-2 rounded-lg bg-violet-500 text-white font-medium hover:bg-violet-400 transition-colors text-sm"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        )}

        {/* RID Sponsor Info */}
        <div className="mt-8 p-4 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
              <span className="text-teal-400 font-bold text-sm">RID</span>
            </div>
            <div>
              <p className="text-sm text-slate-300">
                <span className="font-semibold">InterpretReflect is RID CEU Sponsor #2309</span>
              </p>
              <p className="text-xs text-slate-500">
                CEUs earned here are automatically tracked and can be reported to RID for your certification maintenance.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Grievance Form Modal */}
      {showGrievanceForm && userId && (
        <CEUGrievanceForm
          userId={userId}
          onClose={() => setShowGrievanceForm(false)}
          onSuccess={() => {
            // Could show a toast notification here
          }}
        />
      )}
    </div>
  );
}
