"use client";
import React from "react";

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="border-t border-slate-900/80 bg-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">Pricing</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">Simple pricing. Start free, grow with your practice.</h2>
          <p className="mt-3 text-base text-slate-300">Free tier for journaling, Growth for daily support, Pro for CEU credits.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE Plan */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">Free</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">$0</p>
              <span className="text-[0.75rem] text-slate-400">forever</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Start your wellness journey with Elya</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>5 Elya conversations/month</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Basic mood tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Conversation history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Calendar view</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Dark/light mode</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Best for: Students, curious interpreters</p>
            </div>
            <a href="/start" className="mt-6 inline-flex items-center rounded-lg border border-slate-700 text-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-800 w-full justify-center">Get Started Free</a>
          </div>

          {/* GROWTH Plan */}
          <div className="rounded-2xl border border-violet-500/50 bg-slate-900/90 p-6 relative">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-violet-300">Growth</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">$15</p>
              <span className="text-[0.75rem] text-slate-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Daily support for working interpreters</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span><span className="text-violet-300 font-medium">Unlimited</span> Elya conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span>Pre-assignment prep workflow</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span>Post-assignment debrief</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span>Burnout monitoring</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span>AI insights & patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span>Wellness tracking dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✓</span>
                <span>Export conversation history</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Best for: Working interpreters who don't need CEUs yet</p>
            </div>
            <a href="/start" className="mt-6 inline-flex items-center rounded-lg border border-violet-400 text-violet-300 px-4 py-2 text-sm font-semibold hover:bg-violet-500/10 w-full justify-center">Start with Growth</a>
          </div>

          {/* PRO Plan */}
          <div className="rounded-2xl border-2 border-teal-400/60 bg-slate-900/95 p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-teal-400 px-3 py-1 text-xs font-semibold text-slate-950">For CEUs</span>
            </div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-teal-300">Pro</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">$30</p>
              <span className="text-[0.75rem] text-slate-400">/month</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">Full professional toolkit with CEU credits</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>Everything in Growth</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span><span className="text-teal-300 font-medium">0.2 RID CEUs/month</span> (2 hrs of workshops)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>All theory videos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>All skill practice modules</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>Deep Dive case studies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>CEU certificates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>RID compliance tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>Competency profile</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-xs text-slate-500">Best for: Certified interpreters needing CEUs</p>
            </div>
            <a href="/start" className="mt-6 inline-flex items-center rounded-lg bg-teal-400 text-slate-950 px-4 py-2 text-sm font-semibold hover:bg-teal-300 w-full justify-center">Upgrade to Pro</a>
          </div>
        </div>

        {/* For Agencies Banner */}
        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">For Agencies & Programs</h3>
              <p className="text-sm text-slate-400 mt-1">Custom solutions for organizations with team management, analytics, and bulk CEU access</p>
            </div>
            <a href="/for-agencies" className="inline-flex items-center rounded-lg border border-teal-400 text-teal-300 px-5 py-2.5 text-sm font-semibold hover:bg-teal-500/10 whitespace-nowrap">Learn More</a>
          </div>
        </div>

        {/* How RID CEUs Work */}
        <div className="mt-10 border-t border-slate-800 pt-8">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">How RID CEUs Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">📹</span>
                <span className="font-medium text-slate-200">On-Demand Workshops</span>
              </div>
              <p className="text-sm text-slate-400">0.1 RID CEU per hour</p>
              <p className="text-xs text-slate-500 mt-1">Watch video, complete assessment, earn certificate</p>
            </div>
            <div className="rounded-lg bg-slate-900/50 border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <span className="font-medium text-slate-200">Pro Membership</span>
              </div>
              <p className="text-sm text-slate-400">0.2 RID CEUs/month included</p>
              <p className="text-xs text-slate-500 mt-1">2 hours of workshop content monthly</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            All workshops are RID-approved with official certificates for your records.
          </p>
        </div>
      </div>
    </section>
  );
};
