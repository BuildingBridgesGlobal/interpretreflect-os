import React from "react";

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="border-t border-slate-900/80 bg-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">Pricing</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">Calm, clear pricing for individuals and programs.</h2>
          <p className="mt-3 text-base text-slate-300">Professional infrastructure that respects your work. Choose the plan that fits your needs.</p>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">Basic</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">$12</p>
              <span className="text-[0.75rem] text-slate-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Core tools for professional interpreters</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Assignment prep workflow</li>
              <li>• Reflection & debriefing tools</li>
              <li>• Burnout drift tracking</li>
              <li>• Domain mapping</li>
              <li>• Skills dashboard</li>
              <li>• Tools library</li>
              <li>• Basic insights</li>
            </ul>
            <a href="/signup" className="mt-6 inline-flex items-center rounded-lg border border-slate-700 text-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Get Started</a>
          </div>
          <div className="rounded-2xl border-2 border-teal-400/60 bg-slate-900/95 p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-teal-400 px-3 py-1 text-xs font-semibold text-slate-950">Popular</span>
            </div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-teal-300">Pro</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">$25</p>
              <span className="text-[0.75rem] text-slate-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Everything in Basic, plus CEU support</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Everything in Basic</li>
              <li>• CEU alignment & tracking</li>
              <li>• Automated CEU evidence collection</li>
              <li>• AI coaching agent (Catalyst)</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
              <li>• Early access to new features</li>
            </ul>
            <a href="/signup" className="mt-6 inline-flex items-center rounded-lg bg-teal-400 text-slate-950 px-4 py-2 text-sm font-semibold hover:bg-teal-300">Get Started</a>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">For Programs & Organizations</p>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-slate-50">Contact Us</p>
              <p className="text-sm text-slate-400 mt-1">Custom pricing for agencies, programs, and institutions</p>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              We offer tailored solutions for organizations that want to support their interpreters with professional development infrastructure, wellness monitoring, and team coordination tools.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Team analytics and insights</li>
              <li>• Anonymous emotional load dashboards</li>
              <li>• Supervisor insights and support</li>
              <li>• CEU alignment and tracking</li>
              <li>• Cohort reports and trends</li>
            </ul>
            <a href="#contact" className="mt-6 inline-flex items-center rounded-lg border border-teal-400 text-teal-300 px-4 py-2 text-sm font-semibold hover:bg-teal-500/10">Contact Us to Learn More</a>
          </div>
        </div>
      </div>
    </section>
  );
};
