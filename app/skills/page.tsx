"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function SkillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"profile" | "growth">("profile");

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

  // Mock ECCI competency data with trends and insights
  const competencies = [
    {
      domain: "Linguistic",
      level: 78,
      trend: "improving",
      change: "+5",
      insight: "Your message accuracy is strong, but your last 3 medical debriefs showed terminology gaps in cardiology",
      skills: [
        { name: "Message Accuracy", level: 82, trend: "+6" },
        { name: "Register Shifting", level: 75, trend: "+4" },
        { name: "Terminology Management", level: 77, trend: "+5" }
      ]
    },
    {
      domain: "Cultural",
      level: 65,
      trend: "stable",
      change: "+3",
      insight: "Cultural mediation is developing well. Consider more practice in community settings",
      skills: [
        { name: "Cultural Mediation", level: 68, trend: "+4" },
        { name: "Cultural Navigation", level: 63, trend: "+2" },
        { name: "Community Knowledge", level: 64, trend: "+3" }
      ]
    },
    {
      domain: "Cognitive",
      level: 82,
      trend: "improving",
      change: "+8",
      insight: "Strong multitasking capacity. Your decision making under pressure has improved significantly",
      skills: [
        { name: "Multitasking Capacity", level: 85, trend: "+9" },
        { name: "Decision Making", level: 80, trend: "+7" },
        { name: "Information Processing", level: 81, trend: "+8" }
      ]
    },
    {
      domain: "Interpersonal",
      level: 71,
      trend: "stable",
      change: "+2",
      insight: "Professional boundaries are solid. Team collaboration could benefit from more varied settings",
      skills: [
        { name: "Professional Boundaries", level: 73, trend: "+3" },
        { name: "Team Collaboration", level: 70, trend: "+1" },
        { name: "Ethical Reasoning", level: 70, trend: "+2" }
      ]
    }
  ];

  // Mock training recommendations based on debrief patterns - PURE SKILL DEVELOPMENT
  const trainingRecommendations = [
    {
      id: 1,
      title: "Medical Terminology: Cardiology Essentials",
      type: "module",
      reason: "Your last 3 medical debriefs showed terminology gaps in cardiology",
      domain: "Linguistic",
      duration: "12 min",
      ceuEligible: true,
      ceuHours: 0.2,
      priority: "high",
      progress: 0,
      skills: ["Medical Terminology", "Message Accuracy"]
    },
    {
      id: 2,
      title: "Cultural Navigation in Medical Settings",
      type: "module",
      reason: "Strengthen cultural mediation skills in healthcare contexts",
      domain: "Cultural",
      duration: "20 min",
      ceuEligible: true,
      ceuHours: 0.3,
      priority: "high",
      progress: 0,
      skills: ["Cultural Mediation", "Community Knowledge"]
    },
    {
      id: 3,
      title: "Decision Making Under Pressure",
      type: "practice",
      reason: "Build on your strong cognitive skills with real-world scenarios",
      domain: "Cognitive",
      duration: "15 min",
      ceuEligible: false,
      ceuHours: 0,
      priority: "medium",
      progress: 0,
      skills: ["Decision Making", "Information Processing"]
    },
    {
      id: 4,
      title: "Register Shifting Mastery",
      type: "practice",
      reason: "Improve linguistic flexibility across formal and informal contexts",
      domain: "Linguistic",
      duration: "18 min",
      ceuEligible: false,
      ceuHours: 0,
      priority: "medium",
      progress: 0,
      skills: ["Register Shifting"]
    },
    {
      id: 5,
      title: "Ethical Reasoning in Complex Cases",
      type: "module",
      reason: "Develop interpersonal competency through case-based learning",
      domain: "Interpersonal",
      duration: "25 min",
      ceuEligible: true,
      ceuHours: 0.4,
      priority: "low",
      progress: 60,
      skills: ["Ethical Reasoning", "Professional Boundaries"]
    }
  ];

  const getColorClasses = (domain: string) => {
    const colors: any = {
      Linguistic: { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400", progress: "bg-teal-500" },
      Cultural: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", progress: "bg-blue-500" },
      Cognitive: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", progress: "bg-purple-500" },
      Interpersonal: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", progress: "bg-amber-500" }
    };
    return colors[domain];
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "improving") return "↗";
    if (trend === "declining") return "↘";
    return "→";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Skills & Growth</h1>
          <p className="mt-1 text-sm text-slate-400">Your competency profile and personalized growth path</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800">
          {[
            { key: "profile", label: "Your ECCI Profile" },
            { key: "growth", label: "Growth Path" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                selectedTab === tab.key
                  ? "border-teal-400 text-teal-400"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === "profile" && (
          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">Overall Competency</h2>
                  <p className="text-sm text-slate-400 mt-1">Average across all ECCI domains</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-violet-400">74%</div>
                  <div className="text-sm text-emerald-400">+4.5% this month</div>
                </div>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 via-violet-500 to-amber-500 rounded-full" style={{ width: "74%" }}></div>
              </div>
            </div>

            {/* ECCI Domain Cards with Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competencies.map((comp, idx) => {
                const colors = getColorClasses(comp.domain);
                return (
                  <div key={idx} className={`rounded-xl border ${colors.border} ${colors.bg} p-6`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`text-lg font-semibold ${colors.text}`}>{comp.domain}</h3>
                          <span className="text-xl">{getTrendIcon(comp.trend)}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 italic">"{comp.insight}"</p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-2xl font-bold ${colors.text}`}>{comp.level}%</div>
                        <div className="text-xs text-emerald-400">{comp.change}</div>
                      </div>
                    </div>

                    {/* Domain Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${colors.progress} rounded-full transition-all`} style={{ width: `${comp.level}%` }}></div>
                      </div>
                    </div>

                    {/* Individual Skills */}
                    <div className="space-y-3 pt-3 border-t border-slate-700/50">
                      {comp.skills.map((skill, skillIdx) => (
                        <div key={skillIdx} className="flex items-center justify-between">
                          <span className="text-sm text-slate-300">{skill.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-100">{skill.level}%</span>
                            <span className="text-xs text-emerald-400">{skill.trend}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedTab === "growth" && (
          <div className="space-y-6">
            {/* Training Path Header */}
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <h3 className="text-lg font-semibold text-slate-100">Your Personalized Training Path</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">Based on patterns from your last 10 debriefs, here's your skill development roadmap</p>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-teal-400">5</p>
                  <p className="text-xs text-slate-400">Recommended modules</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-violet-400">1.2h</p>
                  <p className="text-xs text-slate-400">Total CEU available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">20%</p>
                  <p className="text-xs text-slate-400">Completion rate</p>
                </div>
              </div>
            </div>

            {/* Training Modules */}
            <div className="space-y-4">
              {trainingRecommendations.map((training) => {
                const colors = getColorClasses(training.domain);
                return (
                  <div key={training.id} className={`rounded-lg border p-5 ${
                    training.priority === "high"
                      ? "border-amber-500/40 bg-amber-500/10"
                      : training.progress > 0
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-800/30"
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {training.priority === "high" && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
                              High Priority
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-xs ${colors.bg} ${colors.text}`}>
                            {training.domain}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-xs">
                            {training.type === "module" ? "📚 Module" : "🎯 Practice"}
                          </span>
                          {training.ceuEligible && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-medium">
                              {training.ceuHours}h CEU
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-slate-100 mb-2">{training.title}</h4>
                        <p className="text-sm text-slate-400 mb-3">{training.reason}</p>

                        <div className="flex items-center gap-4 mb-3">
                          <p className="text-xs text-slate-500">{training.duration} • Self-paced</p>
                          {training.progress > 0 && (
                            <p className="text-xs text-emerald-400 font-medium">{training.progress}% complete</p>
                          )}
                        </div>

                        <div className="flex gap-1 flex-wrap">
                          {training.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-400 text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>

                        {/* Progress Bar */}
                        {training.progress > 0 && (
                          <div className="mt-3">
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${colors.progress} rounded-full transition-all`}
                                style={{ width: `${training.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        training.progress > 0
                          ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                          : training.priority === "high"
                          ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                          : "bg-teal-500 text-slate-950 hover:bg-teal-400"
                      }`}>
                        {training.progress > 0 ? "Continue" : "Start"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA for Community */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-slate-100">Want personalized help?</strong> Visit the <a href="/community" className="text-blue-400 hover:text-blue-300 underline">Community page</a> to connect with experienced interpreters who can mentor you through these skills.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
