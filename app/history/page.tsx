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
    { id: 1, title: "Legal Deposition", type: "Legal", date: "Jan 25, 2025", duration: "3h", debriefed: true, prepCompleted: true, journaled: true },
    { id: 2, title: "Medical Cardiology Consult", type: "Medical", date: "Jan 22, 2025", duration: "2h", debriefed: false, prepCompleted: true, journaled: false },
    { id: 3, title: "Educational IEP Meeting", type: "Educational", date: "Jan 18, 2025", duration: "1.5h", debriefed: true, prepCompleted: true, journaled: false },
    { id: 4, title: "VRS Call", type: "VRS", date: "Jan 15, 2025", duration: "45min", debriefed: true, prepCompleted: false, journaled: true },
    { id: 5, title: "Mental Health Intake", type: "Mental Health", date: "Jan 12, 2025", duration: "1h", debriefed: true, prepCompleted: true, journaled: true },
    { id: 6, title: "Medical Oncology", type: "Medical", date: "Jan 8, 2025", duration: "2.5h", debriefed: true, prepCompleted: true, journaled: false },
    { id: 7, title: "Legal Court Hearing", type: "Legal", date: "Jan 5, 2025", duration: "4h", debriefed: true, prepCompleted: true, journaled: true },
    { id: 8, title: "Community Event", type: "Community", date: "Jan 2, 2025", duration: "3h", debriefed: false, prepCompleted: false, journaled: false }
  ];

  const filteredAssignments = filter === "all"
    ? assignments
    : assignments.filter(a => a.type === filter);

  const assignmentTypes = ["all", "Medical", "Legal", "Educational", "VRS", "Mental Health", "Community"];

  const getTypeColor = (type: string) => {
    const colors: any = {
      "Medical": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
      "Legal": "text-rose-400 bg-rose-500/10 border-rose-500/30",
      "Educational": "text-amber-400 bg-amber-500/10 border-amber-500/30",
      "VRS": "text-purple-400 bg-purple-500/10 border-purple-500/30",
      "Mental Health": "text-blue-400 bg-blue-500/10 border-blue-500/30",
      "Community": "text-teal-400 bg-teal-500/10 border-teal-500/30"
    };
    return colors[type] || "text-slate-400 bg-slate-800/50 border-slate-700";
  };

  const getCardColor = (type: string) => {
    const colors: any = {
      "Medical": "border-2 border-emerald-500/60 bg-slate-900/50",
      "Legal": "border-2 border-rose-500/60 bg-slate-900/50",
      "Educational": "border-2 border-amber-500/60 bg-slate-900/50",
      "VRS": "border-2 border-purple-500/60 bg-slate-900/50",
      "Mental Health": "border-2 border-blue-500/60 bg-slate-900/50",
      "Community": "border-2 border-teal-500/60 bg-slate-900/50"
    };
    return colors[type] || "border-2 border-slate-700 bg-slate-900/50";
  };

  const getFilterButtonColor = (type: string, isActive: boolean) => {
    return isActive
      ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
      : "bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600";
  };

  // Summary stats
  const totalAssignments = assignments.length;
  const debriefedCount = assignments.filter(a => a.debriefed).length;
  const journaledCount = assignments.filter(a => a.journaled).length;
  const completedCount = assignments.filter(a => a.debriefed && a.journaled).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">
            Assignment History
          </h1>
          <p className="mt-1 text-sm text-slate-400">Track your assignments and professional development</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-2xl font-bold text-slate-200">{totalAssignments}</p>
            <p className="text-sm text-slate-400">Total assignments</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-2xl font-bold text-slate-200">{debriefedCount}</p>
            <p className="text-sm text-slate-400">Debriefed</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-2xl font-bold text-slate-200">{journaledCount}</p>
            <p className="text-sm text-slate-400">Journaled</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-4">
            <p className="text-2xl font-bold text-slate-200">{completedCount}</p>
            <p className="text-sm text-slate-400">Fully reflected</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {assignmentTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${getFilterButtonColor(type, filter === type)}`}
            >
              {type === "all" ? "All Types" : type}
            </button>
          ))}
        </div>

        {/* Assignment List */}
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className={`rounded-2xl p-6 transition-all shadow-lg ${getCardColor(assignment.type)}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-50">{assignment.title}</h3>
                    <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(assignment.type)}`}>
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
                        <span className="text-emerald-400 font-medium">✓ Prepped</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!assignment.debriefed && (
                    <button className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-sm font-semibold border border-teal-500/30 transition-all">
                      Debrief
                    </button>
                  )}
                  {!assignment.journaled && (
                    <button className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-semibold border border-purple-500/30 transition-all">
                      Journal
                    </button>
                  )}
                  {assignment.debriefed && assignment.journaled && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-semibold text-emerald-400">Fully Reflected</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-700/50">
                <button className="px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-all">
                  View Details
                </button>
                {assignment.debriefed && (
                  <button className="px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-all">
                    View Debrief
                  </button>
                )}
                {assignment.journaled && (
                  <button className="px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-300 text-sm font-medium border border-slate-700 transition-all">
                    View Journal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Reflection Insights */}
        <div className="mt-6 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100 mb-2">Build Your Reflection Practice</h3>
              <p className="text-sm text-slate-400 mb-4">Regular debriefing and journaling helps you grow as an interpreter. {completedCount} of {totalAssignments} assignments fully reflected on.</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-teal-400"></div>
                  <span className="text-slate-300">Debrief = Process the assignment</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span className="text-slate-300">Journal = Capture insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
