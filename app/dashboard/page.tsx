"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";
import ElyaInterface from "@/components/dashboard/ElyaInterface";
import UpgradeModal from "@/components/UpgradeModal";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [elyaPreFillMessage, setElyaPreFillMessage] = useState<string>("");

  useEffect(() => {
    const loadUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUserData(profile);
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  // Mock data - will be replaced with real queries
  const nextAssignment = {
    title: "Medical Oncology Consult",
    type: "Medical",
    date: "Tuesday, 2:00 PM",
    prepStatus: "not_started" // "not_started", "in_progress", "completed"
  };

  const recentAssignments = [
    { title: "Legal Deposition", type: "Legal", date: "Jan 25", debriefed: true },
    { title: "Medical Cardiology", type: "Medical", date: "Jan 22", debriefed: false },
    { title: "Educational IEP", type: "Educational", date: "Jan 18", debriefed: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />

      {/* Trial Banner - Sticky at top */}
      {userData?.subscription_tier === "trial" && (
        <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-purple-500/10 border-b border-teal-500/30 backdrop-blur-lg">
          <div className="container mx-auto max-w-7xl px-4 md:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-teal-300 font-semibold">FREE TRIAL</span>
                <span className="text-xs text-slate-400">
                  {userData?.trial_ends_at
                    ? `Ends ${new Date(userData.trial_ends_at).toLocaleDateString()}`
                    : "All features unlocked"}
                </span>
              </div>
              <button
                onClick={() => setShowUpgrade(true)}
                className="px-4 py-1.5 bg-teal-400 hover:bg-teal-300 text-slate-950 text-sm font-semibold rounded-lg transition-all"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout: Chat-First with Sidebar */}
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-180px)]">

          {/* MAIN AREA: ELYA CHAT (70-80% width on desktop) */}
          <div className="flex-1 lg:w-[70%] flex flex-col">
            {/* Welcome Header - Compact */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-violet-600 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
                  <span className="text-2xl font-bold text-white">E</span>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
                    Hi{userData?.full_name ? `, ${userData.full_name.split(' ')[0]}` : ''}!
                  </h1>
                  <p className="text-sm text-slate-400">I'm Elya, ready to help you prep, debrief, or practice</p>
                </div>
              </div>
            </div>

            {/* Elya Chat Interface - Takes full remaining height */}
            <div className="flex-1">
              <ElyaInterface
                userData={userData}
                preFillMessage={elyaPreFillMessage}
                onMessageSent={() => setElyaPreFillMessage("")}
              />
            </div>
          </div>

          {/* SIDEBAR: Context & Quick Actions (20-30% width on desktop) */}
          <div className="lg:w-[30%] flex flex-col gap-4 lg:mt-[88px]">

            {/* Next Assignment - Compact Card */}
            {nextAssignment && (
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-4 shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-violet-300 mb-1">UP NEXT</p>
                    <p className="text-xs text-slate-400">{nextAssignment.date}</p>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-violet-500/20 text-violet-300 text-xs font-semibold border border-violet-500/30">
                    {nextAssignment.type}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-50 mb-3">{nextAssignment.title}</h3>
                <button
                  onClick={() => setElyaPreFillMessage(`Help me prep for ${nextAssignment.title}`)}
                  className="w-full px-4 py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
                >
                  Start Prep
                </button>
              </div>
            )}

            {/* Recent Sessions - Compact List */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
              <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">Recent Sessions</h3>
              <div className="space-y-2">
                {recentAssignments.slice(0, 3).map((assignment, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-2 p-2 rounded-lg hover:bg-slate-700/30 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-100 truncate">{assignment.title}</h4>
                      <p className="text-xs text-slate-500">{assignment.date}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {assignment.debriefed ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs border border-emerald-500/30">
                          ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => setElyaPreFillMessage(`Help me debrief my ${assignment.title} assignment`)}
                          className="px-2 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs border border-amber-500/30 transition-all opacity-0 group-hover:opacity-100"
                        >
                          Debrief
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <UpgradeModal isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
}
