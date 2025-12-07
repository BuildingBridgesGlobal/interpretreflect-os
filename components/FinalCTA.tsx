import React from "react";

type FinalCTAProps = {
  primaryHref?: string;
  secondaryHref?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
};

export const FinalCTA: React.FC<FinalCTAProps> = ({
  primaryHref = "/start",
  secondaryHref = "#pricing",
  primaryLabel = "Get Started Free",
  secondaryLabel = "See Pricing",
}) => {
  return (
    <section className="bg-slate-950 py-20 text-slate-50 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Your Work Is High-Stakes. Your Operating System Should Be Too.</h2>
        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
          Start with the free Basic plan. Upgrade to Pro when you're ready for CEU workshops and unlimited features.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href={primaryHref} className="inline-flex items-center rounded-xl bg-teal-400 px-6 py-3 font-semibold text-slate-950 hover:bg-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-300">
            {primaryLabel}
          </a>
          <a href={secondaryHref} className="inline-flex items-center rounded-xl border border-violet-400 px-6 py-3 font-semibold text-violet-300 hover:bg-violet-400/10 focus:outline-none focus:ring-2 focus:ring-violet-300">
            {secondaryLabel}
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-400">Basic plan is free forever. No credit card required.</p>
        <p className="mt-1 text-xs text-slate-500">Designed with interpreters. Grounded in science. Built for the future of the profession.</p>
      </div>
    </section>
  );
};
