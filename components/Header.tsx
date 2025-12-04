import React from "react";

interface HeaderProps {
  variant?: "interpreter" | "agency";
}

export const Header: React.FC<HeaderProps> = ({ variant = "interpreter" }) => {
  const isAgency = variant === "agency";

  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/80 bg-slate-950/90 backdrop-blur">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-3 md:py-4 flex items-center justify-between gap-4">
        <a href={isAgency ? "/for-agencies" : "/"} className="flex items-center gap-2">
          <div className="flex items-baseline gap-0.5">
            <span className="text-base md:text-lg font-semibold text-slate-50">Interpret</span>
            <span className="text-base md:text-lg font-semibold text-teal-400">Reflect</span>
          </div>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-[0.8rem] text-slate-300">
          <a href="/" className="hover:text-teal-300 transition">For Interpreters</a>
          <a href="/for-agencies" className="hover:text-teal-300 transition">For Agencies</a>
          <a href="#pricing" className="hover:text-teal-300 transition">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          {isAgency ? (
            <>
              <a href="/agency/login" className="hidden sm:inline-flex items-center rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-300 px-3 py-1.5 text-xs font-semibold hover:bg-violet-500/20 transition-colors">Sign in</a>
              <a href="/agency/signup" className="inline-flex items-center rounded-lg bg-violet-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300">Sign up</a>
            </>
          ) : (
            <>
              <a href="/signin" className="hidden sm:inline-flex items-center rounded-lg border border-teal-400/30 bg-teal-400/10 text-teal-300 px-3 py-1.5 text-xs font-semibold hover:bg-teal-400/20 transition-colors">Sign in</a>
              <a href="/start" className="inline-flex items-center rounded-lg bg-teal-400 text-slate-950 px-3 py-1.5 text-xs font-semibold hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">Start free</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
