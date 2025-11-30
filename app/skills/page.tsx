"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import NavBar from "@/components/NavBar";

export default function SkillsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<"journey" | "library">("journey");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);

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

  // Growth-oriented competency areas - NO SCORES, only growth language
  const competencyAreas = [
    {
      domain: "Linguistic Excellence",
      icon: "💬",
      color: { border: "border-teal-500/30", bg: "bg-teal-500/10", text: "text-teal-400", accent: "bg-teal-500" },
      status: "Strengthening",
      insight: "Your message accuracy is developing well. Recent assignments show growing confidence with terminology management.",
      skills: [
        { name: "Message Accuracy", status: "Growing" },
        { name: "Register Shifting", status: "Developing" },
        { name: "Terminology Management", status: "Strengthening" }
      ]
    },
    {
      domain: "Cultural Navigation",
      icon: "🌍",
      color: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-400", accent: "bg-blue-500" },
      status: "Emerging",
      insight: "You're building strong cultural mediation skills. Consider more practice in varied community settings.",
      skills: [
        { name: "Cultural Mediation", status: "Developing" },
        { name: "Cultural Navigation", status: "Building" },
        { name: "Community Knowledge", status: "Growing" }
      ]
    },
    {
      domain: "Cognitive Agility",
      icon: "🧠",
      color: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-400", accent: "bg-purple-500" },
      status: "Advancing",
      insight: "Your multitasking capacity is strong. Decision-making under pressure has improved significantly.",
      skills: [
        { name: "Multitasking Capacity", status: "Strong" },
        { name: "Decision Making", status: "Advancing" },
        { name: "Information Processing", status: "Growing" }
      ]
    },
    {
      domain: "Professional Practice",
      icon: "🤝",
      color: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400", accent: "bg-amber-500" },
      status: "Developing",
      insight: "Professional boundaries are solid. Team collaboration continues to strengthen with each assignment.",
      skills: [
        { name: "Professional Boundaries", status: "Solid" },
        { name: "Team Collaboration", status: "Building" },
        { name: "Ethical Reasoning", status: "Developing" }
      ]
    }
  ];

  // Quick Skill Builders - bite-sized learning modules
  const skillBuilders = [
    {
      id: 1,
      title: "Medical Terminology Foundations",
      category: "Linguistic Excellence",
      icon: "🏥",
      duration: "8 min",
      type: "Quick Course",
      description: "Build confidence with essential medical vocabulary and common healthcare terminology patterns.",
      topics: ["Anatomy basics", "Common procedures", "Medical abbreviations", "Patient-centered language"],
      whenToUse: "Before medical assignments or when you notice terminology gaps",
      color: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" }
    },
    {
      id: 2,
      title: "Cultural Bridging Essentials",
      category: "Cultural Navigation",
      icon: "🌉",
      duration: "10 min",
      type: "Quick Course",
      description: "Strengthen your ability to navigate cultural differences and mediate effectively across contexts.",
      topics: ["Cultural awareness", "Mediation strategies", "Context reading", "Building trust"],
      whenToUse: "When working with diverse communities or new cultural contexts",
      color: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" }
    },
    {
      id: 3,
      title: "Register Shifting Mastery",
      category: "Linguistic Excellence",
      icon: "🎭",
      duration: "12 min",
      type: "Practice Session",
      description: "Develop flexibility in moving between formal and informal language registers seamlessly.",
      topics: ["Formal vs informal", "Context clues", "Audience awareness", "Smooth transitions"],
      whenToUse: "Before assignments with varied formality levels or mixed audiences",
      color: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" }
    },
    {
      id: 4,
      title: "Decision Making Under Pressure",
      category: "Cognitive Agility",
      icon: "⚡",
      duration: "10 min",
      type: "Practice Session",
      description: "Build mental frameworks for making quick, sound decisions in high-pressure interpreting moments.",
      topics: ["Cognitive load management", "Pattern recognition", "Quick thinking", "Stress resilience"],
      whenToUse: "Before high-stakes assignments or when building confidence",
      color: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" }
    },
    {
      id: 5,
      title: "Ethical Reasoning in Practice",
      category: "Professional Practice",
      icon: "⚖️",
      duration: "15 min",
      type: "Quick Course",
      description: "Navigate complex ethical scenarios with confidence using frameworks from professional practice.",
      topics: ["Code of conduct", "Boundary management", "Conflict resolution", "Professional judgment"],
      whenToUse: "When facing ethical dilemmas or wanting to strengthen professional practice",
      color: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" }
    },
    {
      id: 6,
      title: "Team Collaboration & Communication",
      category: "Professional Practice",
      icon: "👥",
      duration: "8 min",
      type: "Quick Course",
      description: "Enhance your ability to work effectively in team settings and communicate professionally.",
      topics: ["Team dynamics", "Professional communication", "Collaboration strategies", "Conflict navigation"],
      whenToUse: "Before team assignments or to strengthen workplace relationships",
      color: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400" }
    },
    {
      id: 7,
      title: "Legal Terminology Essentials",
      category: "Linguistic Excellence",
      icon: "⚖️",
      duration: "12 min",
      type: "Quick Course",
      description: "Build foundational knowledge of legal language, court procedures, and judicial terminology.",
      topics: ["Court vocabulary", "Legal processes", "Rights & responsibilities", "Professional register"],
      whenToUse: "Before legal assignments or when entering legal interpreting",
      color: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" }
    },
    {
      id: 8,
      title: "Cognitive Load Management",
      category: "Cognitive Agility",
      icon: "🎯",
      duration: "10 min",
      type: "Practice Session",
      description: "Learn strategies to manage mental workload during complex or lengthy interpreting sessions.",
      topics: ["Mental stamina", "Focus techniques", "Energy management", "Recovery strategies"],
      whenToUse: "Before long assignments or when building endurance",
      color: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" }
    },
    {
      id: 9,
      title: "Community Settings Navigation",
      category: "Cultural Navigation",
      icon: "🏘️",
      duration: "8 min",
      type: "Quick Course",
      description: "Develop skills for interpreting effectively in community, social service, and informal settings.",
      topics: ["Community contexts", "Informal language", "Cultural sensitivity", "Relationship building"],
      whenToUse: "When working in community or social service settings",
      color: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" }
    },
    {
      id: 10,
      title: "Information Processing Speed",
      category: "Cognitive Agility",
      icon: "🚀",
      duration: "10 min",
      type: "Practice Session",
      description: "Sharpen your ability to quickly process, retain, and render complex information accurately.",
      topics: ["Memory techniques", "Processing strategies", "Speed building", "Accuracy maintenance"],
      whenToUse: "When preparing for fast-paced or information-dense assignments",
      color: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" }
    }
  ];

  const getStatusEmoji = (status: string) => {
    const emojiMap: any = {
      "Growing": "🌱",
      "Developing": "🌿",
      "Building": "🏗️",
      "Strengthening": "💪",
      "Advancing": "🚀",
      "Emerging": "✨",
      "Strong": "⭐",
      "Solid": "🎯"
    };
    return emojiMap[status] || "🌱";
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <NavBar />
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-50">Your Growth Journey</h1>
          <p className="mt-1 text-sm text-slate-400">Continuous skill development through practice, reflection, and learning</p>
        </div>

        {/* Growth Mindset Banner */}
        <div className="mb-6 rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-purple-500/10 p-6">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">🌟</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-100 mb-1">Growth Mindset Approach</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Interpreting excellence is a journey, not a destination. Every assignment is an opportunity to learn, every debrief a chance to grow.
                We focus on <strong className="text-violet-400">progress over perfection</strong>, celebrating each step forward in your professional development.
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm text-slate-400">
            <span>🧠 Neuroscience-based learning</span>
            <span>🏃 Sports psychology principles</span>
            <span>💡 CBT-informed growth strategies</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-slate-800">
          {[
            { key: "journey", label: "Your Development Areas" },
            { key: "library", label: "Skill Builder Library" }
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
        {selectedTab === "journey" && (
          <div className="space-y-6">
            {/* Competency Areas - Growth Language Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {competencyAreas.map((area, idx) => (
                <div key={idx} className={`rounded-xl border ${area.color.border} ${area.color.bg} p-6 hover:shadow-lg transition-all`}>
                  <div className="flex items-start gap-3 mb-4">
                    <span className="text-3xl">{area.icon}</span>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${area.color.text} mb-1`}>{area.domain}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{getStatusEmoji(area.status)}</span>
                        <span className="text-sm font-medium text-slate-300">{area.status}</span>
                      </div>
                      <p className="text-sm text-slate-400 italic leading-relaxed">"{area.insight}"</p>
                    </div>
                  </div>

                  {/* Individual Skills - NO PERCENTAGES */}
                  <div className="space-y-2 pt-4 border-t border-slate-700/50">
                    {area.skills.map((skill, skillIdx) => (
                      <div key={skillIdx} className="flex items-center justify-between group">
                        <span className="text-sm text-slate-300">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm opacity-0 group-hover:opacity-100 transition-opacity">{getStatusEmoji(skill.status)}</span>
                          <span className={`text-sm font-medium ${area.color.text}`}>{skill.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => setSelectedTab("library")}
                    className={`mt-4 w-full px-4 py-2 rounded-lg border ${area.color.border} ${area.color.text} hover:bg-slate-800 transition-colors text-sm font-medium`}
                  >
                    Explore Skill Builders →
                  </button>
                </div>
              ))}
            </div>

            {/* Growth Principles */}
            <div className="rounded-xl border border-slate-700 bg-slate-800/30 p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Evidence-Based Growth Principles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h4 className="font-medium text-slate-200">Process Over Outcome</h4>
                  </div>
                  <p className="text-sm text-slate-400">Focus on what you can control: preparation, practice, and reflection. Results follow consistent process.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    <h4 className="font-medium text-slate-200">Deliberate Practice</h4>
                  </div>
                  <p className="text-sm text-slate-400">Targeted skill work in specific areas drives improvement faster than general practice.</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    <h4 className="font-medium text-slate-200">Progressive Challenge</h4>
                  </div>
                  <p className="text-sm text-slate-400">Growth happens at the edge of your comfort zone. Small stretches compound over time.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === "library" && (
          <div className="space-y-6">
            {/* Library Header */}
            <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📚</span>
                <h3 className="text-lg font-semibold text-slate-100">Quick Skill Builder Library</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Bite-sized learning modules designed to strengthen specific competencies. Each builder takes 5-15 minutes and can be completed anytime -
                before assignments, after debriefs, or whenever you want to sharpen a skill.
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-400" />
                  <span className="text-slate-300">{skillBuilders.filter(s => s.type === "Quick Course").length} Quick Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-400" />
                  <span className="text-slate-300">{skillBuilders.filter(s => s.type === "Practice Session").length} Practice Sessions</span>
                </div>
              </div>
            </div>

            {/* Skill Builders Grid */}
            <div className="grid grid-cols-1 gap-4">
              {skillBuilders.map((builder) => (
                <div
                  key={builder.id}
                  className={`rounded-lg border ${builder.color.border} ${builder.color.bg} p-5 hover:shadow-lg transition-all cursor-pointer`}
                  onClick={() => setExpandedSkill(expandedSkill === builder.id.toString() ? null : builder.id.toString())}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{builder.icon}</span>
                        <div>
                          <h4 className="font-semibold text-slate-100">{builder.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-md ${builder.color.bg} ${builder.color.text} text-xs font-medium`}>
                              {builder.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 text-xs">
                              {builder.type}
                            </span>
                            <span className="text-xs text-slate-400">{builder.duration}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-slate-300 mb-3">{builder.description}</p>

                      {expandedSkill === builder.id.toString() && (
                        <div className="mt-4 space-y-3 pt-3 border-t border-slate-700/50">
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-2">What You'll Learn</p>
                            <div className="flex flex-wrap gap-2">
                              {builder.topics.map((topic, idx) => (
                                <span key={idx} className="px-2 py-1 rounded-md bg-slate-700/50 text-slate-300 text-xs">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">When to Use</p>
                            <p className="text-sm text-slate-300">{builder.whenToUse}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Start builder action
                      }}
                      className={`ml-4 px-4 py-2 rounded-lg ${builder.color.text} border ${builder.color.border} hover:bg-slate-800 transition-colors text-sm font-medium whitespace-nowrap`}
                    >
                      Start Builder
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Encouragement Footer */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <p className="text-sm text-slate-300">
                <strong className="text-slate-100">Remember:</strong> Skill development is not linear. Some days you'll feel stronger in certain areas than others -
                this is completely normal and part of the learning process. Consistent practice and reflection are what drive long-term growth.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
