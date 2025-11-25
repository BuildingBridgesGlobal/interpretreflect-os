import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
        <a href="#hero" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-400/10 border border-teal-400/60">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-300">InterpretReflect</p>
            <p className="text-[0.7rem] text-slate-500">The operating system for interpreters</p>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-[0.8rem] text-slate-300">
          <a href="#os-preview" className="hover:text-teal-300 transition">OS</a>
          <a href="/app/skills" className="hover:text-teal-300 transition">Skills</a>
          <a href="#teams-programs" className="hover:text-teal-300 transition">Teams</a>
          <a href="#pricing" className="hover:text-teal-300 transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <a href="/start" className="hidden sm:inline-flex items-center rounded-lg bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-semibold hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">Start free</a>
          <a href="#day-in-life" className="inline-flex items-center rounded-lg border border-slate-700 px-3 py-1.5 text-[0.75rem] text-slate-200 hover:border-teal-400/70 hover:text-teal-300">How it feels</a>
        </div>
      </div>
    </header>
  );
};
