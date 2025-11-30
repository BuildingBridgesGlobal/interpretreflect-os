"use client";

type SkillDeepDiveProps = {
  skillId: string;
  onBack: () => void;
};

const mockSkillData = {
  "1": {
    name: "Message Accuracy",
    domain: "Linguistic",
    definition: "The ability to convey the source message with complete fidelity to meaning, intent, and register. Message accuracy directly affects consumer comprehension, legal outcomes, medical safety, and professional credibility.",
    currentMastery: 92,
    trend: "up",
    debriefMoments: [
      {
        date: "2025-11-20",
        setting: "Medical",
        note: "Maintained 98% accuracy during complex oncology consultation. Excellent management of technical terminology while preserving patient-centered language."
      },
      {
        date: "2025-11-15",
        setting: "Legal",
        note: "Strong performance in court testimony. Minor register adjustment needed when shifting between attorney questions and witness responses."
      },
      {
        date: "2025-11-08",
        setting: "Educational",
        note: "Captured full meaning in IEP meeting. Successfully navigated educational jargon while maintaining accessibility for parents."
      }
    ],
    performanceData: [
      { month: "Jul", score: 75 },
      { month: "Aug", score: 78 },
      { month: "Sep", score: 82 },
      { month: "Oct", score: 87 },
      { month: "Nov", score: 92 }
    ],
    trainingModules: [
      { id: "t1", title: "Advanced Medical Terminology Drill", type: "Skill Drill", duration: 15, completed: true },
      { id: "t2", title: "Register Calibration Practice", type: "Scenario Practice", duration: 25, completed: true },
      { id: "t3", title: "Legal Language Precision", type: "Micro-Lesson", duration: 8, completed: false }
    ],
    benchmark: {
      userScore: 92,
      platformAverage: 78,
      professionalStandard: 85
    }
  },
  "3": {
    name: "Terminology Management",
    domain: "Linguistic",
    definition: "The systematic approach to specialized vocabulary acquisition, retention, and deployment across settings. Effective terminology management reduces cognitive load, increases accuracy, and builds professional confidence.",
    currentMastery: 45,
    trend: "down",
    debriefMoments: [
      {
        date: "2025-10-15",
        setting: "Medical",
        note: "Struggled with cardiology terminology in emergency department setting. Recommend focused prep before medical assignments."
      },
      {
        date: "2025-10-03",
        setting: "Legal",
        note: "Good grasp of family court terms but hesitation on procedural vocabulary slowed processing time."
      }
    ],
    performanceData: [
      { month: "Jul", score: 52 },
      { month: "Aug", score: 55 },
      { month: "Sep", score: 48 },
      { month: "Oct", score: 45 },
      { month: "Nov", score: 45 }
    ],
    trainingModules: [
      { id: "t4", title: "Medical Terminology Foundations", type: "Micro-Lesson", duration: 10, completed: false },
      { id: "t5", title: "Legal Vocab Rapid Recall", type: "Skill Drill", duration: 12, completed: false },
      { id: "t6", title: "Pre-Assignment Terminology Prep Protocol", type: "Case Study", duration: 20, completed: false }
    ],
    benchmark: {
      userScore: 45,
      platformAverage: 68,
      professionalStandard: 75
    }
  }
};

export default function SkillDeepDive({ skillId, onBack }: SkillDeepDiveProps) {
  const skill = mockSkillData[skillId as keyof typeof mockSkillData];

  if (!skill) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Skill data not found</p>
        <button onClick={onBack} className="mt-4 text-teal-400 hover:text-teal-300">← Back to overview</button>
      </div>
    );
  }

  const maxScore = Math.max(...skill.performanceData.map(d => d.score));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <button onClick={onBack} className="text-sm text-teal-400 hover:text-teal-300 mb-4">
          ← Back to Skills Overview
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-1">{skill.name}</h2>
            <p className="text-sm text-slate-400">{skill.domain} Domain</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-teal-400">{skill.currentMastery}%</p>
            <p className="text-xs text-slate-500">Current Mastery</p>
          </div>
        </div>
      </div>

      {/* Definition & Impact */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-3">Why This Matters</h3>
        <p className="text-slate-300 leading-relaxed">{skill.definition}</p>
      </div>

      {/* Performance Trend */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Performance Trend</h3>
          <div className="flex items-center gap-2">
            {skill.trend === "up" ? (
              <span className="text-teal-400 text-sm flex items-center gap-1">
                ↗ Improving
              </span>
            ) : skill.trend === "down" ? (
              <span className="text-amber-400 text-sm flex items-center gap-1">
                ↘ Declining
              </span>
            ) : (
              <span className="text-blue-400 text-sm flex items-center gap-1">
                → Stable
              </span>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 flex items-end justify-between gap-2">
          {skill.performanceData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-slate-800 rounded-t-lg relative" style={{ height: "100%" }}>
                <div
                  className={`w-full rounded-t-lg transition-all ${
                    skill.trend === "up" ? "bg-teal-500" : skill.trend === "down" ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ height: `${(data.score / maxScore) * 100}%`, position: "absolute", bottom: 0 }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">{data.month}</p>
              <p className="text-xs text-slate-500">{data.score}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Debrief Moments */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Related Debrief Moments</h3>
        <div className="space-y-3">
          {skill.debriefMoments.map((moment, idx) => (
            <div key={idx} className="border-l-2 border-teal-500 pl-4 py-2">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-slate-500">{new Date(moment.date).toLocaleDateString()}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-xs text-slate-300">{moment.setting}</span>
              </div>
              <p className="text-sm text-slate-300">{moment.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Training Modules */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Available Training</h3>
        <div className="space-y-2">
          {skill.trainingModules.map((module) => (
            <div
              key={module.id}
              className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-800/30 hover:bg-slate-800/50 transition-all"
            >
              <div className="flex items-center gap-3">
                {module.completed ? (
                  <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 text-xs">✓</div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-200">{module.title}</p>
                  <p className="text-xs text-slate-500">{module.type} • {module.duration} min</p>
                </div>
              </div>
              {!module.completed && (
                <button className="px-4 py-1.5 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-colors">
                  Start
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark Comparison */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Benchmark Comparison</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Your Score</span>
              <span className="font-bold text-teal-400">{skill.benchmark.userScore}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-teal-400 h-2 rounded-full" style={{ width: `${skill.benchmark.userScore}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Platform Average</span>
              <span className="font-bold text-slate-300">{skill.benchmark.platformAverage}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-slate-500 h-2 rounded-full" style={{ width: `${skill.benchmark.platformAverage}%` }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-400">Professional Standard</span>
              <span className="font-bold text-slate-300">{skill.benchmark.professionalStandard}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${skill.benchmark.professionalStandard}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
