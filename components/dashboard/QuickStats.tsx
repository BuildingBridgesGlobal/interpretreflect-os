"use client";

type QuickStatsProps = {
  userData: any;
};

export default function QuickStats({ userData }: QuickStatsProps) {
  // Mock stats - will be calculated from real data
  const stats = [
    { label: "Assignments", value: "47" },
    { label: "Reflections", value: "52" },
    { label: "CEU Hours", value: "23.5", highlight: true }
  ];

  // Weekly calendar - showing last 7 days with assignment indicators
  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];
  const hasAssignment = [false, true, true, false, true, true, false]; // Example data

  return (
    <div className="mt-8 pt-6 border-t border-slate-800">
      {/* Weekly Calendar Strip */}
      <div className="mb-6">
        <p className="text-sm text-slate-400 mb-3">This Week</p>
        <div className="flex gap-2">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`flex-1 rounded-lg border p-3 text-center transition-colors ${
                hasAssignment[index]
                  ? "border-teal-500/40 bg-teal-500/10"
                  : "border-slate-800 bg-slate-900/30"
              }`}
            >
              <p className="text-xs text-slate-400 mb-1">{day}</p>
              <div className={`h-2 w-2 mx-auto rounded-full ${hasAssignment[index] ? "bg-teal-400" : "bg-slate-700/50"}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-lg border ${stat.highlight ? 'border-teal-500/30 bg-teal-500/5' : 'border-slate-800 bg-slate-900/30'} p-4 text-center`}
          >
            <p className={`text-2xl font-bold mb-1 ${stat.highlight ? 'text-teal-400' : 'text-slate-200'}`}>
              {stat.value}
            </p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
