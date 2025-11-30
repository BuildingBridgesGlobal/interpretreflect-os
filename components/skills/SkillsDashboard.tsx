"use client";
import { useState } from "react";
import SkillsOverview from "./SkillsOverview";
import SkillDeepDive from "./SkillDeepDive";
import TrainingLibrary from "./TrainingLibrary";

type View = "overview" | "training" | "skill-detail";

export const SkillsDashboard = () => {
  const [currentView, setCurrentView] = useState<View>("overview");
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const handleSkillClick = (skillId: string) => {
    setSelectedSkillId(skillId);
    setCurrentView("skill-detail");
  };

  const handleBackToOverview = () => {
    setCurrentView("overview");
    setSelectedSkillId(null);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setCurrentView("overview")}
          className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
            currentView === "overview" || currentView === "skill-detail"
              ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Skills Overview
        </button>
        <button
          onClick={() => setCurrentView("training")}
          className={`px-6 py-2 rounded-t-lg font-medium transition-all ${
            currentView === "training"
              ? "bg-slate-800 text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-300"
          }`}
        >
          Training Library
        </button>
      </div>

      {/* Content Area */}
      {currentView === "overview" && (
        <SkillsOverview onSkillClick={handleSkillClick} />
      )}

      {currentView === "skill-detail" && selectedSkillId && (
        <SkillDeepDive skillId={selectedSkillId} onBack={handleBackToOverview} />
      )}

      {currentView === "training" && (
        <TrainingLibrary />
      )}
    </div>
  );
};
