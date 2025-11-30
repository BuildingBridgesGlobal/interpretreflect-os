"use client";

type TrainingRecommendationsProps = {
  userData: any;
};

export default function TrainingRecommendations({ userData }: TrainingRecommendationsProps) {
  // Mock training recommendations - curated by Elya based on performance data
  const trainings = [
    {
      id: 1,
      title: "Cultural Conflict Resolution",
      type: "Scenario Practice",
      duration: "15 min",
      targetSkill: "Cultural Mediation",
      difficulty: "Intermediate"
    },
    {
      id: 2,
      title: "Managing Decision Fatigue",
      type: "Micro-Learning",
      duration: "8 min",
      targetSkill: "Cognitive Load",
      difficulty: "Beginner"
    },
    {
      id: 3,
      title: "Medical Oncology Terminology",
      type: "Vocabulary Drill",
      duration: "12 min",
      targetSkill: "Linguistic Accuracy",
      difficulty: "Advanced"
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "Beginner") return "text-teal-400 bg-teal-500/10";
    if (difficulty === "Intermediate") return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-50">Training Recommendations</h3>
        <p className="text-sm text-slate-400 mt-1">Curated for you based on your data</p>
      </div>

      <div className="space-y-3">
        {trainings.map((training) => (
          <div
            key={training.id}
            className="rounded-lg border border-slate-700 bg-slate-950/30 p-4 hover:border-teal-500/50 hover:bg-slate-800/50 transition-all group cursor-pointer"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-slate-200 group-hover:text-slate-50 transition-colors pr-2">
                {training.title}
              </h4>
              <span className={`text-xs font-medium px-2 py-1 rounded whitespace-nowrap ${getDifficultyColor(training.difficulty)}`}>
                {training.difficulty}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <span>{training.type}</span>
              <span>•</span>
              <span>{training.duration}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Targets:</span>
                <span className="text-xs text-teal-400">{training.targetSkill}</span>
              </div>
              <button className="text-xs text-teal-400 hover:text-teal-300 font-medium transition-colors">
                Start →
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm">
        Browse All Trainings
      </button>
    </div>
  );
}
