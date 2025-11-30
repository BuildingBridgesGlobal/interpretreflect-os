"use client";

type UpcomingPreparationProps = {
  userData: any;
};

export default function UpcomingPreparation({ userData }: UpcomingPreparationProps) {
  // Mock upcoming assignments
  const upcomingAssignments = [
    {
      id: 1,
      date: "Tomorrow, 2:00 PM",
      type: "Medical · Oncology Consultation",
      prep: "Review terminology set and your notes from similar assignments",
      materials: ["Medical Oncology Glossary", "Previous debrief: Cancer treatment discussion"]
    }
  ];

  const hasUpcoming = upcomingAssignments.length > 0;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-50">Upcoming Preparation</h3>
          <p className="text-sm text-slate-400 mt-1">Elya-powered prep for your next assignments</p>
        </div>
      </div>

      {hasUpcoming ? (
        <div className="space-y-4">
          {upcomingAssignments.map((assignment) => (
            <div key={assignment.id} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">📋</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-100">{assignment.type}</p>
                  <p className="text-sm text-amber-400 mt-0.5">{assignment.date}</p>
                </div>
              </div>

              <p className="text-sm text-slate-300 mb-3">{assignment.prep}</p>

              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Recommended Materials</p>
                {assignment.materials.map((material, idx) => (
                  <button key={idx} className="block w-full text-left text-sm text-teal-400 hover:text-teal-300 transition-colors">
                    → {material}
                  </button>
                ))}
              </div>

              <button className="mt-4 w-full px-4 py-2 rounded-lg bg-teal-400 text-slate-950 font-semibold hover:bg-teal-300 transition-colors">
                Start Prep Session
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-400 mb-4">No upcoming assignments logged</p>
          <button className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors">
            + Add Upcoming Assignment
          </button>
        </div>
      )}
    </div>
  );
}
