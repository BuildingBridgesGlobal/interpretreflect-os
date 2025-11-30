"use client";

import { useState } from "react";

type TrainingFormat = "all" | "scenarios" | "micro-lessons" | "case-studies" | "skill-drills" | "assigned";

type TrainingModule = {
  id: string;
  title: string;
  format: Exclude<TrainingFormat, "all" | "assigned">;
  duration: number;
  difficulty: "Entry" | "Intermediate" | "Advanced";
  skills: string[];
  setting?: string;
  completed: boolean;
  assigned?: boolean;
  assignedReason?: string;
  priority?: number;
};

const mockTrainingModules: TrainingModule[] = [
  // Scenario Practices
  {
    id: "s1",
    title: "Emergency Department Triage",
    format: "scenarios",
    duration: 25,
    difficulty: "Advanced",
    skills: ["Message Accuracy", "Decision Making", "Terminology Management"],
    setting: "Medical",
    completed: false,
    assigned: true,
    assignedReason: "Your last 3 debriefs showed decision fatigue in high-volume medical settings",
    priority: 1
  },
  {
    id: "s2",
    title: "Family Court Custody Hearing",
    format: "scenarios",
    duration: 30,
    difficulty: "Advanced",
    skills: ["Cultural Mediation", "Ethical Reasoning", "Message Accuracy"],
    setting: "Legal",
    completed: false
  },
  {
    id: "s3",
    title: "IEP Meeting Facilitation",
    format: "scenarios",
    duration: 20,
    difficulty: "Intermediate",
    skills: ["Team Collaboration", "Cultural Navigation"],
    setting: "Educational",
    completed: true
  },

  // Micro-Lessons
  {
    id: "m1",
    title: "Register Shifting in Real-Time",
    format: "micro-lessons",
    duration: 8,
    difficulty: "Intermediate",
    skills: ["Register Shifting", "Message Accuracy"],
    completed: false,
    assigned: true,
    assignedReason: "Strengthen register calibration identified in Nov 15 legal debrief",
    priority: 2
  },
  {
    id: "m2",
    title: "Cardiology Terminology Essentials",
    format: "micro-lessons",
    duration: 12,
    difficulty: "Entry",
    skills: ["Terminology Management"],
    setting: "Medical",
    completed: false
  },
  {
    id: "m3",
    title: "Cultural Bridging Techniques",
    format: "micro-lessons",
    duration: 10,
    difficulty: "Intermediate",
    skills: ["Cultural Mediation", "Cultural Navigation"],
    completed: true
  },

  // Case Studies
  {
    id: "c1",
    title: "Mental Health Crisis Intervention",
    format: "case-studies",
    duration: 35,
    difficulty: "Advanced",
    skills: ["Ethical Reasoning", "Decision Making", "Professional Boundaries"],
    setting: "Mental Health",
    completed: false
  },
  {
    id: "c2",
    title: "VRS Complex Technical Support Call",
    format: "case-studies",
    duration: 25,
    difficulty: "Intermediate",
    skills: ["Information Processing", "Multitasking Capacity"],
    setting: "VRS",
    completed: false
  },

  // Skill Drills
  {
    id: "d1",
    title: "Medical Terminology Rapid Recall",
    format: "skill-drills",
    duration: 15,
    difficulty: "Entry",
    skills: ["Terminology Management"],
    completed: false,
    assigned: true,
    assignedReason: "Build automaticity before next medical assignment",
    priority: 3
  },
  {
    id: "d2",
    title: "Number Processing Speed Training",
    format: "skill-drills",
    duration: 10,
    difficulty: "Intermediate",
    skills: ["Information Processing"],
    completed: true
  },
  {
    id: "d3",
    title: "Fingerspelling Fluency Builder",
    format: "skill-drills",
    duration: 12,
    difficulty: "Entry",
    skills: ["Message Accuracy"],
    completed: false
  }
];

export default function TrainingLibrary() {
  const [selectedFormat, setSelectedFormat] = useState<TrainingFormat>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const filteredModules = mockTrainingModules.filter(module => {
    if (selectedFormat === "all") return true;
    if (selectedFormat === "assigned") return module.assigned;
    return module.format === selectedFormat;
  }).filter(module => {
    if (!selectedDifficulty) return true;
    return module.difficulty === selectedDifficulty;
  });

  const assignedModules = mockTrainingModules.filter(m => m.assigned).sort((a, b) => (a.priority || 99) - (b.priority || 99));
  const totalHours = mockTrainingModules.filter(m => m.completed).reduce((acc, m) => acc + m.duration, 0) / 60;
  const completedCount = mockTrainingModules.filter(m => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Total Training Hours</p>
          <p className="text-2xl font-bold text-teal-400">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Modules Completed</p>
          <p className="text-2xl font-bold text-slate-100">{completedCount}/{mockTrainingModules.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Current Streak</p>
          <p className="text-2xl font-bold text-slate-100">7 days</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="text-xs text-slate-500 mb-1">Assigned Training</p>
          <p className="text-2xl font-bold text-amber-400">{assignedModules.length}</p>
        </div>
      </div>

      {/* Assigned Training Priority Section */}
      {assignedModules.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-lg font-semibold text-slate-100">Elya Recommendations</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Personalized training based on your performance patterns</p>
          <div className="space-y-3">
            {assignedModules.map((module) => (
              <div key={module.id} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-medium">
                        Priority {module.priority}
                      </span>
                      <span className="text-xs text-slate-500">{module.difficulty}</span>
                    </div>
                    <h4 className="font-medium text-slate-100 mb-1">{module.title}</h4>
                    <p className="text-xs text-slate-400 mb-2">{module.assignedReason}</p>
                    <div className="flex gap-2 flex-wrap">
                      {module.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-800 text-xs text-slate-300">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-medium hover:bg-amber-400 transition-colors">
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format Filter */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">Training Library</h3>

        {/* Format Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: "all", label: "All Training" },
            { key: "assigned", label: "Assigned" },
            { key: "scenarios", label: "Scenario Practices" },
            { key: "micro-lessons", label: "Micro-Lessons" },
            { key: "case-studies", label: "Case Studies" },
            { key: "skill-drills", label: "Skill Drills" }
          ].map((format) => (
            <button
              key={format.key}
              onClick={() => setSelectedFormat(format.key as TrainingFormat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedFormat === format.key
                  ? "bg-teal-500 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {format.label}
            </button>
          ))}
        </div>

        {/* Difficulty Filter */}
        <div className="flex gap-2 mb-6">
          <span className="text-sm text-slate-400 mr-2">Difficulty:</span>
          {["Entry", "Intermediate", "Advanced"].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(selectedDifficulty === diff ? null : diff)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                selectedDifficulty === diff
                  ? "bg-blue-500 text-slate-950"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {diff}
            </button>
          ))}
          {selectedDifficulty && (
            <button
              onClick={() => setSelectedDifficulty(null)}
              className="text-xs text-slate-500 hover:text-slate-400"
            >
              Clear
            </button>
          )}
        </div>

        {/* Training Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map((module) => (
            <div
              key={module.id}
              className={`rounded-lg border p-4 transition-all hover:scale-[1.02] ${
                module.completed
                  ? "border-teal-500/30 bg-teal-500/5"
                  : "border-slate-700 bg-slate-800/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {module.completed && (
                      <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 text-xs">✓</div>
                    )}
                    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                      module.difficulty === "Entry" ? "bg-green-500/20 text-green-400" :
                      module.difficulty === "Intermediate" ? "bg-blue-500/20 text-blue-400" :
                      "bg-purple-500/20 text-purple-400"
                    }`}>
                      {module.difficulty}
                    </span>
                    <span className="text-xs text-slate-500">{module.duration} min</span>
                  </div>
                  <h4 className="font-medium text-slate-100 mb-1">{module.title}</h4>
                  {module.setting && (
                    <p className="text-xs text-slate-400 mb-2">{module.setting}</p>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {module.skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-slate-400">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {!module.completed && (
                <button className="w-full mt-3 px-4 py-2 rounded-lg bg-teal-500 text-slate-950 text-sm font-medium hover:bg-teal-400 transition-colors">
                  Start Training
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No training modules match your filters
          </div>
        )}
      </div>
    </div>
  );
}
