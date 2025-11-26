"use client";
import React from "react";
import { CompetencyRadar } from "./CompetencyRadar";
import { PracticeQueue, PracticeItem } from "./PracticeQueue";
import { GrowthTimeline } from "./GrowthTimeline";
import { supabase } from "@/lib/supabaseClient";

export const SkillsDashboard: React.FC = () => {
  const [userId, setUserId] = React.useState<string | null>(null);
  const [focusSkills, setFocusSkills] = React.useState<Array<{ name: string; targetLevel: number; currentLevel: number }>>([]);
  const [practiceItems, setPracticeItems] = React.useState<PracticeItem[]>([]);

  React.useEffect(() => {
    const run = async () => {
      if (!supabase) return;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;
      setUserId(uid);
      if (!uid) return;
      const { data: skills } = await supabase.from("skills").select("id,name");
      const nameById: Record<number, string> = {};
      (skills ?? []).forEach((s: any) => { nameById[s.id] = s.name; });
      const { data: goals } = await supabase.from("skill_goals").select("skill_id,target_level,created_at").eq("user_id", uid).order("created_at", { ascending: false });
      const goalIds = (goals ?? []).map((g: any) => g.skill_id).slice(0, 2);
      const { data: assessments } = await supabase
        .from("skill_assessments")
        .select("skill_id,level,created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false });
      const latestBySkill: Record<number, number> = {};
      (assessments ?? []).forEach((row: any) => {
        if (!(row.skill_id in latestBySkill)) latestBySkill[row.skill_id] = row.level ?? 0;
      });
      const items = goalIds.map((id: number) => ({ name: nameById[id] ?? String(id), targetLevel: 4, currentLevel: latestBySkill[id] ?? 0 }));
      setFocusSkills(items);

      const generated: PracticeItem[] = goalIds.map((skillId: number, idx) => {
        const lvl = latestBySkill[skillId] ?? 0;
        const sessionType = lvl <= 2 ? "simulation" : lvl === 3 ? "drill" : "review";
        const suggestedDuration = lvl <= 2 ? 20 : lvl === 3 ? 15 : 10;
        return {
          id: `${Date.now()}-${idx}`,
          skillId: String(skillId),
          skillName: nameById[skillId] ?? String(skillId),
          sessionType,
          suggestedDuration,
          reason: `Current level ${lvl}/5 + active goal`,
        };
      });

      setPracticeItems(generated);

      const { data: existing } = await supabase
        .from("agent_events")
        .select("id,metadata,created_at")
        .eq("user_id", uid)
        .eq("agent", "practice")
        .eq("event_type", "practice_recommendation")
        .order("created_at", { ascending: false })
        .limit(1);
      if (!existing || existing.length === 0) {
        await (supabase.from("agent_events") as any).insert({ user_id: uid, agent: "practice", event_type: "practice_recommendation", metadata: { items: generated } });
      }
    };
    run();
  }, []);

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50 md:text-4xl">Skills & Growth</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300 md:text-base">Your interpreting competencies, goals, and practice queue in one calm view.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Focus skills</p>
          <p className="mt-1 text-sm text-slate-300">The two skills you're actively growing right now.</p>
          <ul className="mt-4 space-y-3 text-sm text-slate-200">
            {focusSkills.map((skill) => (
              <li key={skill.name} className="flex items-center justify-between">
                <span>{skill.name}</span>
                <span className="text-xs text-slate-400">{skill.currentLevel}/5 → {skill.targetLevel}/5</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <CompetencyRadar />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {userId && <PracticeQueue userId={userId} items={practiceItems} onSessionLogged={() => {}} />}
        </div>
        <div className="md:col-span-1">
          <GrowthTimeline />
        </div>
      </div>
    </section>
  );
};
