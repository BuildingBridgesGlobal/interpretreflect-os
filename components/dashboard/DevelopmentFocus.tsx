"use client";

type DevelopmentFocusProps = {
  userData: any;
};

export default function DevelopmentFocus({ userData }: DevelopmentFocusProps) {
  // Mock data - will be replaced with Elya AI analysis
  const focusAreas = [
    {
      skill: "Cultural Mediation",
      reason: "Pattern detected: Hesitation in high-stakes cultural conflicts",
      progress: 64,
      nextAction: "Complete scenario practice: Family conflict resolution in healthcare setting",
      timeline: "2 practices remaining to reach proficiency"
    },
    {
      skill: "Decision Fatigue Management",
      reason: "Data shows decreased accuracy in back-to-back assignments",
      progress: 42,
      nextAction: "Debrief your next VRS assignment with focus on pacing and breaks",
      timeline: "Track 5 more assignments to establish baseline"
    }
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Current Development Focus</h3>
          <p className="text-sm text-slate-400 mt-1">Data-driven priority growth areas</p>
        </div>
      </div>

      <div className="space-y-5">
        {focusAreas.map((area, index) => (
          <div key={index} className="rounded-lg border border-slate-700 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-100">{area.skill}</h4>
                <p className="text-sm text-slate-400 mt-1">{area.reason}</p>
              </div>
              <span className="text-xs font-medium text-teal-400 bg-teal-500/10 px-2 py-1 rounded">
                {area.progress}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-full transition-all"
                style={{ width: `${area.progress}%` }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-teal-400 mt-1">→</span>
                <p className="text-sm text-slate-300"><strong>Next action:</strong> {area.nextAction}</p>
              </div>
              <p className="text-xs text-slate-500 pl-5">{area.timeline}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
