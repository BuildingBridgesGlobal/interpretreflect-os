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
  const [selectedTab, setSelectedTab] = useState<"overview" | "workshops" | "certificates" | "progress">("overview");
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [userTier, setUserTier] = useState<string>("free"); // Default to free
  const [tierChecked, setTierChecked] = useState(false);
  const [availableWorkshops, setAvailableWorkshops] = useState<Workshop[]>([]);
  const [credits, setCredits] = useState<{ monthly: number; topup: number; total: number }>({
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

      // Fetch credit balance for Pro users
      if (tier === "pro") {
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
        } catch (err) {
          console.error("Error fetching credits:", err);
        }
      }

      // Fetch available CEU workshops (visible to all users for FOMO)
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
        .order("module_code", { ascending: true });

      if (workshops) {
        setAvailableWorkshops(workshops as unknown as Workshop[]);
      }

      // If not pro, don't load full CEU data (they'll see the upgrade prompt with workshops)
      if (tier !== "pro") {
        console.log("[CEU Page] User is not pro, showing upgrade prompt");
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
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-teal-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Show upgrade prompt for Basic users (or any non-pro tier)
  // IMPORTANT: This MUST block anyone who is not explicitly "pro"
  if (userTier !== "pro") {
    console.log("[CEU Page Render] Blocking user with tier:", userTier);

    // Calculate total available CEUs from workshops
    const totalAvailableCEUs = availableWorkshops.reduce((sum, w) => sum + (w.ceu_value || 0), 0);

    return (
      <div className="min-h-screen bg-slate-950">
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
                    {workshop.title}
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

            {/* No workshops fallback */}
            {availableWorkshops.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center">
                <p className="text-slate-400">No workshops available yet. Check back soon!</p>
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
                  <span className="text-slate-400 ml-2">• 4 CEU credits/month • Track RID compliance</span>
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
    <div className="min-h-screen bg-slate-950">
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
            <p className="text-3xl font-bold text-teal-400">
              {summary?.total_earned.toFixed(2) || "0.00"}
            </p>
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
          {(["overview", "workshops", "certificates", "progress"] as const).map((tab) => (
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
                    <p className="text-xs text-slate-400">Use credits to access CEU workshops. Theory (0.5), Skill (1), Deep Dive (2)</p>
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
                    onClick={() => router.push(`/skills/${workshop.module_code}`)}
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
                      {workshop.title}
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

            {/* No workshops fallback */}
            {availableWorkshops.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-300 mb-2">No Workshops Available</h3>
                <p className="text-sm text-slate-500">
                  New CEU workshops are coming soon. Check back later!
                </p>
              </div>
            )}

            {/* Top-Up Credits Purchase */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100">Need more CEU credits?</h3>
                  <p className="text-sm text-slate-400 mt-1">Purchase additional credits. They never expire.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={async () => {
                      const session = await supabase.auth.getSession();
                      if (!session.data.session) return;
                      const res = await fetch("/api/credits/topup", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session.data.session.access_token}`,
                        },
                        body: JSON.stringify({ package_name: "small" }),
                      });
                      const data = await res.json();
                      if (data.checkout_url) window.location.href = data.checkout_url;
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-center hover:border-violet-500/50 transition-colors"
                  >
                    <p className="text-lg font-bold text-slate-100">$5</p>
                    <p className="text-xs text-slate-400">2 credits</p>
                    <p className="text-[10px] text-slate-500">$2.50/credit</p>
                  </button>
                  <button
                    onClick={async () => {
                      const session = await supabase.auth.getSession();
                      if (!session.data.session) return;
                      const res = await fetch("/api/credits/topup", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session.data.session.access_token}`,
                        },
                        body: JSON.stringify({ package_name: "medium" }),
                      });
                      const data = await res.json();
                      if (data.checkout_url) window.location.href = data.checkout_url;
                    }}
                    className="rounded-lg border border-violet-500/50 bg-violet-500/10 px-4 py-2 text-center hover:bg-violet-500/20 transition-colors"
                  >
                    <p className="text-lg font-bold text-violet-300">$8</p>
                    <p className="text-xs text-slate-400">4 credits</p>
                    <p className="text-[10px] text-violet-400">$2.00/credit</p>
                  </button>
                  <button
                    onClick={async () => {
                      const session = await supabase.auth.getSession();
                      if (!session.data.session) return;
                      const res = await fetch("/api/credits/topup", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${session.data.session.access_token}`,
                        },
                        body: JSON.stringify({ package_name: "large" }),
                      });
                      const data = await res.json();
                      if (data.checkout_url) window.location.href = data.checkout_url;
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-center hover:border-violet-500/50 transition-colors"
                  >
                    <p className="text-lg font-bold text-slate-100">$14</p>
                    <p className="text-xs text-slate-400">8 credits</p>
                    <p className="text-[10px] text-slate-500">$1.75/credit</p>
                  </button>
                </div>
              </div>
            </div>
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
