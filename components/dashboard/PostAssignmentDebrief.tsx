"use client";

import { useState } from "react";

type DebriefProps = {
  assignmentId?: string;
};

type DebriefEntry = {
  id: string;
  assignmentTitle: string;
  date: string;
  aiSummary: string;
  keyInsight: string;
  domainTags: string[];
  intensityLevel: "low" | "medium" | "high";
  skillsUsed: string[];
  feeling?: string;
  goDeeperPrompts?: string[];
  voiceTranscript?: string;
};

export default function PostAssignmentDebrief({ assignmentId }: DebriefProps) {
  const [selectedEntry, setSelectedEntry] = useState<DebriefEntry | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showNewDebrief, setShowNewDebrief] = useState(false);
  const [expandedDeeper, setExpandedDeeper] = useState<string | null>(null);

  // Mock debrief entries - will come from database
  const debriefEntries: DebriefEntry[] = [
    {
      id: "1",
      assignmentTitle: "Cardiology Specialist Consultation",
      date: "2025-01-15",
      aiSummary: "Successfully interpreted a complex cardiology consultation involving post-catheterization care discussion. Patient showed good comprehension of treatment plan. Provider was direct and collaborative.",
      keyInsight: "Your medical vocabulary retention has improved 22% over the past month, particularly in cardiology terminology. You handled technical terms with confidence.",
      domainTags: ["Medical", "Cardiology"],
      intensityLevel: "high",
      skillsUsed: ["Medical terminology", "Emotional regulation", "Team coordination"],
      feeling: "challenged but confident",
      goDeeperPrompts: [
        "What specific cardiology terms felt most challenging during this session?",
        "How did you manage the emotional intensity when technical discussions became dense?",
        "What boundary-setting strategies helped you maintain professional distance?"
      ]
    },
    {
      id: "2",
      assignmentTitle: "IEP Meeting - Middle School",
      date: "2025-01-14",
      aiSummary: "Facilitated communication between parents and school team regarding student's accommodation needs. Multiple stakeholders with different communication styles. Successfully maintained neutrality.",
      keyInsight: "Pattern identified: You excel at managing multi-party conversations in education settings. This is your 8th IEP meeting with positive feedback.",
      domainTags: ["Education", "K-12"],
      intensityLevel: "medium",
      skillsUsed: ["Boundary-setting", "Multi-party coordination", "Advocacy navigation"],
      feeling: "energized",
      goDeeperPrompts: [
        "What made this IEP meeting different from your previous 7?",
        "How did you navigate moments when parent and school perspectives diverged?",
        "What energized you most about this multi-party coordination?"
      ]
    }
  ];

  const handleVoiceRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic will be implemented with Web Speech API or backend service
    if (!isRecording) {
      // Start recording
      console.log("Starting voice recording...");
    } else {
      // Stop recording and process
      console.log("Stopping voice recording...");
    }
  };

  const getIntensityColor = (level: string) => {
    switch (level) {
      case "high":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-300"
        };
      case "medium":
        return {
          bg: "bg-violet-500/10",
          border: "border-violet-500/30",
          text: "text-violet-300"
        };
      case "low":
        return {
          bg: "bg-teal-500/10",
          border: "border-teal-500/30",
          text: "text-teal-300"
        };
      default:
        return {
          bg: "bg-slate-500/10",
          border: "border-slate-500/30",
          text: "text-slate-300"
        };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-50">Post-Assignment Debriefs</h2>
        <button
          onClick={() => setShowNewDebrief(!showNewDebrief)}
          className="px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-medium border border-teal-500/30 hover:bg-teal-500/30 transition-colors"
        >
          {showNewDebrief ? "Cancel" : "+ New Debrief"}
        </button>
      </div>

      {/* New Debrief Form with Voice Journaling */}
      {showNewDebrief && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-5">
          <h3 className="text-base font-semibold text-slate-200 mb-4">Create New Debrief</h3>

          {/* Voice Recording Interface */}
          <div className="mb-4 p-4 rounded-lg border border-slate-800 bg-slate-950/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-400 animate-pulse' : 'bg-slate-600'}`} />
                <p className="text-sm font-medium text-slate-300">
                  {isRecording ? "Recording..." : "Voice Debrief"}
                </p>
              </div>
              <button
                onClick={handleVoiceRecording}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isRecording
                    ? 'bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30'
                    : 'bg-teal-500/20 text-teal-300 border-teal-500/30 hover:bg-teal-500/30'
                }`}
              >
                {isRecording ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <rect x="6" y="6" width="8" height="8" rx="1" />
                    </svg>
                    Stop Recording
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
                    </svg>
                    Start Voice Debrief
                  </span>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Speak naturally about your assignment. Elya will transcribe and generate insights automatically.
            </p>
          </div>

          {/* Manual Text Entry (Alternative) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Or type your reflection
            </label>
            <textarea
              className="w-full px-3 py-2 rounded-lg border border-slate-800 bg-slate-950/50 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
              rows={4}
              placeholder="Describe what happened during the assignment..."
            />
          </div>

          {/* Quick Feeling Tags */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">How did you feel?</label>
            <div className="flex flex-wrap gap-2">
              {["energized", "challenged but confident", "drained", "neutral", "overwhelmed", "fulfilled"].map((feeling) => (
                <button
                  key={feeling}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-800/50 text-slate-400 hover:border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-300 transition-colors"
                >
                  {feeling}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button className="w-full px-4 py-2 rounded-lg bg-teal-500/20 text-teal-300 text-sm font-medium border border-teal-500/30 hover:bg-teal-500/30 transition-colors">
            Generate AI Debrief
          </button>
        </div>
      )}

      {/* Debrief List */}
      <div className="space-y-3">
        {debriefEntries.map((entry) => {
          const colors = getIntensityColor(entry.intensityLevel);

          return (
            <div
              key={entry.id}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 hover:border-teal-500/30 transition-colors cursor-pointer"
              onClick={() => setSelectedEntry(entry)}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-200">{entry.assignmentTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1">{new Date(entry.date).toLocaleDateString()}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${colors.border} ${colors.bg} ${colors.text}`}>
                  {entry.intensityLevel} intensity
                </span>
              </div>

              {/* AI Summary */}
              <div className="mb-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                <p className="text-xs text-violet-400/80 uppercase tracking-wide mb-1">AI Summary</p>
                <p className="text-sm text-slate-300">{entry.aiSummary}</p>
              </div>

              {/* Key Insight */}
              <div className="mb-3 p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                <p className="text-xs text-teal-400/80 uppercase tracking-wide mb-1">Key Insight</p>
                <p className="text-sm text-slate-300">{entry.keyInsight}</p>
              </div>

              {/* Tags and Metadata */}
              <div className="flex flex-wrap gap-2 mb-3">
                {/* Domain Tags */}
                {entry.domainTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-800/50 text-slate-400 border border-slate-700"
                  >
                    {tag}
                  </span>
                ))}

                {/* Skills Used */}
                {entry.skillsUsed.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  >
                    {skill}
                  </span>
                ))}

                {/* Feeling Tag */}
                {entry.feeling && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    {entry.feeling}
                  </span>
                )}
              </div>

              {/* "Go Deeper" Prompts */}
              {entry.goDeeperPrompts && entry.goDeeperPrompts.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedDeeper(expandedDeeper === entry.id ? null : entry.id);
                    }}
                    className="flex items-center gap-2 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <svg
                      className={`w-4 h-4 transition-transform ${expandedDeeper === entry.id ? 'rotate-90' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Go deeper with Elya ({entry.goDeeperPrompts.length} prompts)
                  </button>

                  {expandedDeeper === entry.id && (
                    <div className="mt-3 space-y-2">
                      {entry.goDeeperPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation();
                            // This would open a reflection interface with the prompt
                            console.log("Selected prompt:", prompt);
                          }}
                          className="w-full text-left p-3 rounded-lg border border-violet-500/20 bg-violet-500/5 hover:bg-violet-500/10 transition-colors group"
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded-full bg-violet-400/20 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-violet-400/30 transition-colors">
                              <span className="text-xs font-semibold text-violet-300">{idx + 1}</span>
                            </div>
                            <p className="text-sm text-slate-300 flex-1">{prompt}</p>
                            <svg className="w-4 h-4 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
