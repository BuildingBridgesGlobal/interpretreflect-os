import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900/80 bg-slate-950">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="max-w-sm">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">InterpretReflect</p>
            <p className="mt-2 text-sm text-slate-300">The operating system for interpreters, focused on wellbeing, skills, and growth. Built with interpreters, educators, and mental-health experts.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Product</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><a href="#os-preview" className="hover:text-teal-300">Dashboard</a></li>
                <li><a href="#features" className="hover:text-teal-300">OS Features</a></li>
                <li><a href="#pricing" className="hover:text-teal-300">Pricing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">For</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><a href="#teams-programs" className="hover:text-teal-300">Programs & Cohorts</a></li>
                <li><a href="#teams-programs" className="hover:text-teal-300">Agencies & Colleges</a></li>
                <li><a href="#science" className="hover:text-teal-300">Research & Approach</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Support</p>
              <ul className="mt-3 space-y-2 text-slate-300">
                <li><a href="/start" className="hover:text-teal-300">Get started</a></li>
                <li><a href="#testimonials" className="hover:text-teal-300">Stories</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-900/80 pt-5">
          <p className="text-[0.7rem] text-slate-500">© {new Date().getFullYear()} InterpretReflect · All rights reserved.</p>
          <p className="text-[0.7rem] text-slate-500">Built with trauma-informed design, emotional intelligence research, and interpreter ethics at the core.</p>
        </div>
      </div>
    </footer>
  );
};
