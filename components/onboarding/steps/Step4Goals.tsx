"use client";
import React from "react";
import { supabase } from "@/lib/supabaseClient";

const goals = [
  { key: "burnout", title: "Catch burnout before it catches me.", desc: "I want to see early warning signs and small interventions." },
  { key: "recovery", title: "Recover better between hard days.", desc: "I want help coming down after challenging assignments." },
  { key: "growth", title: "Make my growth visible.", desc: "I want to see my skill and EQ growth over time, not just survive." },
  { key: "season", title: "Support me through a specific season.", desc: "Residency, grad school, a new role, or an intense stretch." },
];

type Skill = { id: number; name: string };

export default function Step4Goals({ primary_goal, onChange }: { primary_goal?: "burnout" | "recovery" | "growth" | "season"; onChange: (partial: any) => void }) {
  const [skillsCatalog, setSkillsCatalog] = React.useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = React.useState<number[]>([]);
  const [levelsById, setLevelsById] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    const run = async () => {
      if (!supabase) {
        setSkillsCatalog([
          { id: 1, name: "Medical discourse" },
          { id: 2, name: "Legal discourse" },
          { id: 3, name: "Teaming & handoffs" },
          { id: 4, name: "Ethical decision-making" },
          { id: 5, name: "Relational presence" },
          { id: 6, name: "Cognitive pacing" },
        ]);
        return;
      }
      const { data } = await supabase.from("skills").select("id,name").order("name", { ascending: true });
      setSkillsCatalog((data ?? []).map((d: any) => ({ id: d.id, name: d.name })));
    };
    run();
  }, []);

  const toggleSkill = (id: number) => {
    let next = selectedSkillIds.includes(id) ? selectedSkillIds.filter((x) => x !== id) : [...selectedSkillIds, id];
    if (next.length > 2) next = next.slice(0, 2);
    setSelectedSkillIds(next);
    onChange({ selected_skill_ids: next });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-3">
        {goals.map((g) => (
          <button key={g.key} onClick={() => onChange({ primary_goal: g.key })} className={`rounded-2xl border p-4 text-left ${primary_goal === g.key ? "border-teal-400 bg-slate-900/70" : "border-slate-800 bg-slate-900/50"}`}>
            <p className="text-sm font-semibold text-slate-50">{g.title}</p>
            <p className="mt-1 text-sm text-slate-300">{g.desc}</p>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-slate-200">Top two skills you want to grow</p>
        <div className="grid grid-cols-2 gap-2">
          {skillsCatalog.map((s) => (
            <button key={s.id} onClick={() => toggleSkill(s.id)} className={`rounded-lg border px-3 py-2 text-sm ${selectedSkillIds.includes(s.id) ? "border-teal-400 text-teal-300" : "border-slate-700 text-slate-300"}`}>{s.name}</button>
          ))}
        </div>
      </div>

      {selectedSkillIds.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-200">Quick self-assessment (1–5)</p>
          <div className="space-y-2">
            {selectedSkillIds.map((id) => {
              const skill = skillsCatalog.find((x) => x.id === id);
              return (
                <div key={id} className="flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2">
                  <span className="text-sm text-slate-200">{skill?.name ?? "Skill"}</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          const next = { ...levelsById, [id]: n };
                          setLevelsById(next);
                          onChange({ skill_levels_by_id: next });
                        }}
                        className={`rounded-full px-2 py-1 text-xs ${levelsById[id] === n ? "bg-teal-400 text-slate-950" : "bg-slate-900 text-slate-300"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[0.75rem] text-slate-400">We’ll use this to seed your Skills & Growth dashboard.</p>
        </div>
      )}
    </div>
  );
}
