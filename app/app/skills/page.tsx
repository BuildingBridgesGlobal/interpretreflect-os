import { SkillsDashboard } from "@/components/skills/SkillsDashboard";
import Link from "next/link";

export default function SkillsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Simple nav */}
      <header className="border-b border-slate-800 px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-lg font-bold text-teal-400">InterpretReflect OS</span>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link href="/app" className="hover:text-teal-300">Dashboard</Link>
            <Link href="/app/skills" className="text-teal-300">Skills</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <SkillsDashboard />
      </main>
    </div>
  );
}
