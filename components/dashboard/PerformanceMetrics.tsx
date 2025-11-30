"use client";

type PerformanceMetricsProps = {
  userData: any;
};

export default function PerformanceMetrics({ userData }: PerformanceMetricsProps) {
  // Mock ECCI domain scores - will be replaced with real data
  const ecciDomains = [
    { name: "Linguistic", score: 8.2, trend: "up", color: "teal" },
    { name: "Cultural", score: 7.8, trend: "stable", color: "blue" },
    { name: "Cognitive", score: 6.9, trend: "down", color: "purple" },
    { name: "Interpersonal", score: 8.5, trend: "up", color: "violet" }
  ];

  const overallScore = 7.9;
  const streakDays = 12;

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return "↗";
    if (trend === "down") return "↘";
    return "→";
  };

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-teal-400";
    if (trend === "down") return "text-amber-400";
    return "text-slate-400";
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400" },
      violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400" }
    };
    return colors[color] || colors.teal;
  };

  return (
    <div className="mb-6">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-50">Performance Metrics</h3>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Overall Score</p>
            <p className="text-2xl font-bold text-teal-400">{overallScore}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Debrief Streak</p>
            <p className="text-2xl font-bold text-slate-200">{streakDays} <span className="text-sm text-slate-400">days</span></p>
          </div>
        </div>
      </div>

      {/* ECCI Domains Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ecciDomains.map((domain) => {
          const colorClasses = getColorClasses(domain.color);
          return (
            <button
              key={domain.name}
              className={`rounded-xl border ${colorClasses.border} ${colorClasses.bg} p-5 text-left hover:scale-105 transition-transform group cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-slate-200 group-hover:text-slate-50 transition-colors">
                  {domain.name}
                </h4>
                <span className={`text-lg ${getTrendColor(domain.trend)}`}>
                  {getTrendIcon(domain.trend)}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${colorClasses.text}`}>{domain.score}</span>
                <span className="text-sm text-slate-500">/10</span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colorClasses.bg} ${colorClasses.border} border-r-2 rounded-full transition-all`}
                  style={{ width: `${(domain.score / 10) * 100}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Tap to drill into specifics
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
