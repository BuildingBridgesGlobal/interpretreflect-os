"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function HistoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState<string>("all"); // "all", "Medical", "Legal", etc.

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

  // Mock assignment history
  const assignments = [
    { id: 1, title: "Legal Deposition", type: "Legal", date: "Jan 25, 2025", duration: "3h", debriefed: true, prepCompleted: true, score: 88 },
    { id: 2, title: "Medical Cardiology Consult", type: "Medical", date: "Jan 22, 2025", duration: "2h", debriefed: false, prepCompleted: true, score: null },
    { id: 3, title: "Educational IEP Meeting", type: "Educational", date: "Jan 18, 2025", duration: "1.5h", debriefed: true, prepCompleted: true, score: 92 },
    { id: 4, title: "VRS Call", type: "VRS", date: "Jan 15, 2025", duration: "45min", debriefed: true, prepCompleted: false, score: 75 },
    { id: 5, title: "Mental Health Intake", type: "Mental Health", date: "Jan 12, 2025", duration: "1h", debriefed: true, prepCompleted: true, score: 85 },
    { id: 6, title: "Medical Oncology", type: "Medical", date: "Jan 8, 2025", duration: "2.5h", debriefed: true, prepCompleted: true, score: 90 },
    { id: 7, title: "Legal Court Hearing", type: "Legal", date: "Jan 5, 2025", duration: "4h", debriefed: true, prepCompleted: true, score: 86 },
    { id: 8, title: "Community Event", type: "Community", date: "Jan 2, 2025", duration: "3h", debriefed: false, prepCompleted: false, score: null }
  ];

  const filteredAssignments = filter === "all"
    ? assignments
    : assignments.filter(a => a.type === filter);

  const assignmentTypes = ["all", "Medical", "Legal", "Educational", "VRS", "Mental Health", "Community"];

  const getTypeColor = (type: string) => {
    const colors: any = {
      "Medical": "text-teal-400 bg-teal-500/10 border-teal-500/30",
      "Legal": "text-violet-400 bg-violet-500/10 border-violet-500/30",
      "Educational": "text-blue-400 bg-blue-500/10 border-blue-500/30",
      "VRS": "text-purple-400 bg-purple-500/10 border-purple-500/30",
      "Mental Health": "text-rose-400 bg-rose-500/10 border-rose-500/30",
      "Community": "text-amber-400 bg-amber-500/10 border-amber-500/30"
    };
    return colors[type] || "text-slate-400 bg-slate-800/50 border-slate-700";
  };

  // Summary stats
  const totalAssignments = assignments.length;
  const debriefedCount = assignments.filter(a => a.debriefed).length;
  const avgScore = Math.round(assignments.filter(a => a.score).reduce((acc, a) => acc + (a.score || 0), 0) / assignments.filter(a => a.score).length);
  const totalCEU = 8.5; // Mock total

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Assignment History</h1>
          <p className="mt-1 text-sm text-slate-400">Track your assignments and professional development</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-2xl font-bold text-violet-400">{totalAssignments}</p>
            <p className="text-sm text-slate-400">Total assignments</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-2xl font-bold text-teal-400">{debriefedCount}</p>
            <p className="text-sm text-slate-400">Debriefed</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-2xl font-bold text-emerald-400">{avgScore}</p>
            <p className="text-sm text-slate-400">Avg performance</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <p className="text-2xl font-bold text-amber-400">{totalCEU}h</p>
            <p className="text-sm text-slate-400">CEU hours</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {assignmentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                filter === type
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                  : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600"
              }`}
            >
              {type === "all" ? "All Types" : type}
            </button>
          ))}
        </div>

        {/* Assignment List */}
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-100">{assignment.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(assignment.type)}`}>
                      {assignment.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>{assignment.date}</span>
                    <span>•</span>
                    <span>{assignment.duration}</span>
                    {assignment.prepCompleted && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400">✓ Prepped</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {assignment.debriefed && assignment.score ? (
                    <div>
                      <div className="text-2xl font-bold text-violet-400">{assignment.score}</div>
                      <div className="text-xs text-slate-400">Performance</div>
                    </div>
                  ) : (
                    <button className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm border border-amber-500/30 transition-all">
                      Debrief Now
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all">
                  View Details
                </button>
                {assignment.debriefed && (
                  <button className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all">
                    View Debrief
                  </button>
                )}
                <button className="px-3 py-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-all">
                  Download CEU
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Export Section */}
        <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Export CEU Records</h3>
              <p className="text-sm text-slate-400">Download your assignment history and CEU documentation for RID certification or program requirements.</p>
            </div>
            <button className="px-6 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium border border-blue-500/30 transition-all">
              Export PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
