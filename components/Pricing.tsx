"use client";
import React, { useState } from "react";

export const Pricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section id="pricing" className="border-t border-slate-900/80 bg-slate-950/95">
      <div className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="text-[0.75rem] font-medium uppercase tracking-[0.16em] text-teal-300/80">Pricing</p>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">Clear pricing for individuals and programs.</h2>
          <p className="mt-3 text-base text-slate-300">Professional infrastructure that scales with your career. 7-day free trial, no credit card required.</p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!isYearly ? "text-slate-50" : "text-slate-400"}`}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            aria-label={isYearly ? "Switch to monthly billing" : "Switch to yearly billing"}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950"
            style={{ backgroundColor: isYearly ? "#5eead4" : "#334155" }}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-slate-950 transition-transform ${
                isYearly ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? "text-slate-50" : "text-slate-400"}`}>
            Yearly <span className="text-teal-300">(save 20%)</span>
          </span>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Plan */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">Basic</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">
                ${isYearly ? "115.20" : "12"}
              </p>
              <span className="text-[0.75rem] text-slate-400">/{isYearly ? "year" : "month"}</span>
            </div>
            {isYearly && (
              <p className="mt-1 text-xs text-teal-300">Save $28.80/year (2 months free)</p>
            )}
            <p className="mt-2 text-sm text-slate-400">Core tools for professional interpreters</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Assignment prep workflow</li>
              <li>• Performance analysis tools</li>
              <li>• Pattern tracking dashboard</li>
              <li>• Domain mapping</li>
              <li>• Skills development tracking</li>
              <li>• Tools library</li>
              <li>• Basic insights</li>
            </ul>
            <a href="/start" className="mt-6 inline-flex items-center rounded-lg border border-slate-700 text-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Try Free for 7 Days</a>
          </div>

          {/* Pro Plan */}
          <div className="rounded-2xl border-2 border-teal-400/60 bg-slate-900/95 p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center rounded-full bg-teal-400 px-3 py-1 text-xs font-semibold text-slate-950">Popular</span>
            </div>
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-teal-300">Pro</p>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-slate-50">
                ${isYearly ? "240" : "25"}
              </p>
              <span className="text-[0.75rem] text-slate-400">/{isYearly ? "year" : "month"}</span>
            </div>
            {isYearly && (
              <p className="mt-1 text-xs text-teal-300">Save $60/year (2 months free)</p>
            )}
            <p className="mt-2 text-sm text-slate-400">Everything in Basic, plus CEU support & AI coaching</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Everything in Basic</li>
              <li>• CEU alignment & tracking</li>
              <li>• Automated CEU evidence collection</li>
              <li>• AI coaching agent (Elya)</li>
              <li>• Advanced analytics</li>
              <li>• Priority support</li>
              <li>• Early access to new features</li>
            </ul>
            <a href="/start" className="mt-6 inline-flex items-center rounded-lg bg-teal-400 text-slate-950 px-4 py-2 text-sm font-semibold hover:bg-teal-300">Try Free for 7 Days</a>
          </div>

          {/* Enterprise Plan */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/85 p-6">
            <p className="text-xs font-semibold tracking-[0.16em] uppercase text-slate-400">For Programs & Organizations</p>
            <div className="mt-3">
              <p className="text-2xl font-semibold text-slate-50">Contact Us</p>
              <p className="text-sm text-slate-400 mt-1">Custom pricing for agencies, programs, and institutions</p>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Tailored solutions for organizations that want to provide professional development infrastructure, performance analytics, and team coordination tools.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>• Team analytics and insights</li>
              <li>• Performance pattern dashboards</li>
              <li>• Supervisor insights and support</li>
              <li>• CEU alignment and tracking</li>
              <li>• Cohort reports and trends</li>
            </ul>
            <a href="#contact" className="mt-6 inline-flex items-center rounded-lg border border-teal-400 text-teal-300 px-4 py-2 text-sm font-semibold hover:bg-teal-500/10">Contact Us to Learn More</a>
          </div>
        </div>

        {/* Student Discount Notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Student or new interpreter (first 2 years)?{" "}
            <a href="#contact" className="text-teal-300 hover:text-teal-200 underline">
              Get 50% off with verification
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
