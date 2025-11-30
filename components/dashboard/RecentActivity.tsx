"use client";

type RecentActivityProps = {
  userData: any;
};

export default function RecentActivity({ userData }: RecentActivityProps) {
  // Mock debrief data
  const recentDebriefs = [
    {
      id: 1,
      date: "2 days ago",
      type: "Medical · Oncology Consultation",
      insight: "Identified decision fatigue pattern in back-to-back legal assignments",
      domain: "Cognitive"
    },
    {
      id: 2,
      date: "5 days ago",
      type: "Legal · Family Court",
      insight: "Strong cultural code-switching in community health setting",
      domain: "Cultural"
    },
    {
      id: 3,
      date: "1 week ago",
      type: "Community Health · Home Visit",
      insight: "Excellent pacing management under high cognitive load",
      domain: "Interpersonal"
    }
  ];

  const getDomainColor = (domain: string) => {
    const colors: Record<string, string> = {
      Cognitive: "text-purple-400",
      Cultural: "text-blue-400",
      Interpersonal: "text-violet-400",
      Linguistic: "text-teal-400"
    };
    return colors[domain] || "text-slate-400";
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Recent Activity</h3>
          <p className="text-sm text-slate-400 mt-1">Last 5 assignment debriefs with Elya</p>
        </div>
        <button className="text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {recentDebriefs.map((debrief) => (
          <button
            key={debrief.id}
            className="w-full text-left rounded-lg border border-slate-700 bg-slate-950/30 p-4 hover:bg-slate-800/50 hover:border-slate-600 transition-all group"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-slate-200 group-hover:text-slate-50 transition-colors">
                  {debrief.type}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{debrief.date}</p>
              </div>
              <span className={`text-xs font-medium ${getDomainColor(debrief.domain)} bg-slate-800 px-2 py-1 rounded`}>
                {debrief.domain}
              </span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed">
              {debrief.insight}
            </p>

            <p className="text-xs text-slate-600 mt-2">Tap to expand full debrief →</p>
          </button>
        ))}
      </div>
    </div>
  );
}
