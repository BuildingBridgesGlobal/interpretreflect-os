"use client";

import { useState } from "react";

type Debrief = {
  id: string;
  date: string;
  assignmentType: string;
  setting: string;
  headline: string;
  skills: string[];
  performanceFlags: {
    strengths: string[];
    development: string[];
    breakthroughs: string[];
  };
  fullAnalysis: string;
};

const mockDebriefs: Debrief[] = [
  {
    id: "d1",
    date: "2025-11-27",
    assignmentType: "Medical",
    setting: "Emergency Department",
    headline: "Strong performance under pressure. Excellent triage terminology management and quick decision-making.",
    skills: ["Message Accuracy", "Decision Making", "Terminology Management"],
    performanceFlags: {
      strengths: ["Maintained composure in high-stress environment", "Accurate medical terminology"],
      development: [],
      breakthroughs: []
    },
    fullAnalysis: "You demonstrated exceptional performance in a challenging emergency department environment. Your ability to maintain message accuracy while processing rapid-fire medical information shows significant growth in cognitive load management. The triage terminology was handled with precision, and your decision-making under pressure was sound. This assignment showcases your readiness for high-acuity medical settings."
  },
  {
    id: "d2",
    date: "2025-11-25",
    assignmentType: "Legal",
    setting: "Family Court - Custody Hearing",
    headline: "Cultural mediation excellence. Minor register adjustments needed between attorney and client interactions.",
    skills: ["Cultural Mediation", "Register Shifting", "Ethical Reasoning"],
    performanceFlags: {
      strengths: ["Navigated emotional family dynamics with professionalism", "Strong cultural bridging"],
      development: ["Register calibration between formal court and informal sidebar"],
      breakthroughs: []
    },
    fullAnalysis: "This family court session highlighted your cultural mediation strengths. You successfully navigated highly emotional dynamics while maintaining professional boundaries. The only area for development is fine-tuning register shifts when moving between formal court proceedings and informal attorney-client sidebars. Overall strong performance."
  },
  {
    id: "d3",
    date: "2025-11-22",
    assignmentType: "Educational",
    setting: "IEP Meeting",
    headline: "Breakthrough in educational jargon management. Accessibility for parents significantly improved.",
    skills: ["Message Accuracy", "Team Collaboration", "Cultural Navigation"],
    performanceFlags: {
      strengths: ["Excellent team facilitation", "Parent-centered language"],
      development: [],
      breakthroughs: ["Educational terminology became automatic - no longer slowing processing"]
    },
    fullAnalysis: "This IEP meeting marks a turning point in your educational interpreting. The special education terminology that previously required conscious effort is now automatic, freeing up cognitive resources for message crafting. Your ability to balance technical accuracy with parent accessibility was exceptional. This is evidence of mastery development in educational settings."
  },
  {
    id: "d4",
    date: "2025-11-20",
    assignmentType: "Medical",
    setting: "Oncology Consultation",
    headline: "98% accuracy in complex medical dialogue. Excellent balance of technical precision and compassion.",
    skills: ["Message Accuracy", "Cultural Mediation", "Terminology Management"],
    performanceFlags: {
      strengths: ["Technical terminology mastery", "Patient-centered approach"],
      development: [],
      breakthroughs: []
    },
    fullAnalysis: "Your oncology consultation performance was exemplary. Managing complex cancer terminology while preserving the emotional weight of the conversation requires both technical skill and interpersonal sensitivity. You achieved both. The 98% accuracy rating reflects not just linguistic precision but appropriate register and affect management."
  },
  {
    id: "d5",
    date: "2025-11-15",
    assignmentType: "Legal",
    setting: "Court Testimony",
    headline: "Strong testimony interpretation. Watch cognitive load during extended Q&A sequences.",
    skills: ["Message Accuracy", "Multitasking Capacity", "Register Shifting"],
    performanceFlags: {
      strengths: ["Precise legal language", "Maintained neutrality"],
      development: ["Cognitive load management in rapid-fire questioning"],
      breakthroughs: []
    },
    fullAnalysis: "Court testimony interpretation is demanding, and you handled it well. Your legal language precision and professional neutrality were spot-on. The only flag is cognitive load during the rapid-fire cross-examination sequence. Consider prep strategies for sustained high-intensity questioning."
  }
];

const assignmentTypes = ["All", "Medical", "Legal", "Educational", "VRS", "Community", "Mental Health"];
const skillAreas = ["All", "Message Accuracy", "Cultural Mediation", "Decision Making", "Terminology Management", "Register Shifting"];

export default function DebriefLog() {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [selectedFlag, setSelectedFlag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDebriefs = mockDebriefs.filter(debrief => {
    if (selectedType !== "All" && debrief.assignmentType !== selectedType) return false;
    if (selectedSkill !== "All" && !debrief.skills.includes(selectedSkill)) return false;
    if (selectedFlag === "strengths" && debrief.performanceFlags.strengths.length === 0) return false;
    if (selectedFlag === "development" && debrief.performanceFlags.development.length === 0) return false;
    if (selectedFlag === "breakthroughs" && debrief.performanceFlags.breakthroughs.length === 0) return false;
    if (searchQuery && !debrief.headline.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !debrief.setting.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-1">Assignment Debrief Log</h2>
      <p className="text-sm text-slate-400 mb-6">Complete history of your Elya debrief sessions</p>

      {/* Search and Filters */}
      <div className="space-y-4 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search debriefs by headline or setting..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          {/* Assignment Type */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Assignment Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {assignmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Skill Area */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Skill Area</label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {skillAreas.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          {/* Elya Flags */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Elya Flags</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFlag(selectedFlag === "strengths" ? null : "strengths")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFlag === "strengths"
                    ? "bg-teal-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Strengths
              </button>
              <button
                onClick={() => setSelectedFlag(selectedFlag === "development" ? null : "development")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFlag === "development"
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Development
              </button>
              <button
                onClick={() => setSelectedFlag(selectedFlag === "breakthroughs" ? null : "breakthroughs")}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedFlag === "breakthroughs"
                    ? "bg-purple-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Breakthroughs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-slate-400 mb-4">
        Showing {filteredDebriefs.length} of {mockDebriefs.length} debriefs
      </p>

      {/* Debrief List */}
      <div className="space-y-3">
        {filteredDebriefs.map((debrief) => (
          <div
            key={debrief.id}
            className="rounded-lg border border-slate-700 bg-slate-800/30 overflow-hidden hover:border-slate-600 transition-all"
          >
            {/* Summary View */}
            <div
              onClick={() => setExpandedId(expandedId === debrief.id ? null : debrief.id)}
              className="p-4 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-500">{new Date(debrief.date).toLocaleDateString()}</span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-400 text-xs font-medium">
                      {debrief.assignmentType}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 mb-1">{debrief.setting}</p>
                  <p className="text-sm text-slate-300">{debrief.headline}</p>
                </div>
                <button className="text-slate-400 hover:text-slate-300 ml-4">
                  {expandedId === debrief.id ? "−" : "+"}
                </button>
              </div>

              {/* Skills Tags */}
              <div className="flex gap-2 flex-wrap mt-3">
                {debrief.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-slate-400">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Performance Flags */}
              {(debrief.performanceFlags.strengths.length > 0 ||
                debrief.performanceFlags.development.length > 0 ||
                debrief.performanceFlags.breakthroughs.length > 0) && (
                <div className="flex gap-2 mt-2">
                  {debrief.performanceFlags.strengths.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/30 text-teal-400 text-xs">
                      {debrief.performanceFlags.strengths.length} Strength{debrief.performanceFlags.strengths.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {debrief.performanceFlags.development.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                      {debrief.performanceFlags.development.length} Development Area{debrief.performanceFlags.development.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {debrief.performanceFlags.breakthroughs.length > 0 && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs">
                      {debrief.performanceFlags.breakthroughs.length} Breakthrough{debrief.performanceFlags.breakthroughs.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Expanded View */}
            {expandedId === debrief.id && (
              <div className="border-t border-slate-700 p-4 bg-slate-900/50">
                <h4 className="text-sm font-semibold text-slate-200 mb-3">Full Elya Analysis</h4>
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{debrief.fullAnalysis}</p>

                {/* Detailed Flags */}
                <div className="space-y-3">
                  {debrief.performanceFlags.strengths.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-teal-400 mb-1">Strengths Identified</p>
                      <ul className="space-y-1">
                        {debrief.performanceFlags.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-teal-400">✓</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {debrief.performanceFlags.development.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-400 mb-1">Areas for Development</p>
                      <ul className="space-y-1">
                        {debrief.performanceFlags.development.map((area, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <span className="text-amber-400">→</span>
                            {area}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {debrief.performanceFlags.breakthroughs.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-purple-400 mb-1">Breakthroughs</p>
                      <ul className="space-y-1">
                        {debrief.performanceFlags.breakthroughs.map((breakthrough, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                            <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            {breakthrough}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredDebriefs.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No debriefs match your current filters
        </div>
      )}
    </div>
  );
}
