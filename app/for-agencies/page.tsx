"use client";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function ForAgenciesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="relative container mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
          {/* Background Effects */}
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-20 left-20 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>

          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <span className="px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-medium">
                For Agencies & Programs
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6">
              Develop Your Interpreting Workforce at Scale
            </h1>

            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Track competency growth, measure readiness, prevent burnout, and prove ROI.
              InterpretReflect gives you visibility into your entire interpreter roster.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://lunacal.ai/interpretreflect/agency-discovery-call-interpretreflect"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 px-8 py-4 text-base font-semibold shadow-lg shadow-teal-400/30 hover:bg-teal-300 transition"
              >
                Schedule Discovery Call
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg border-2 border-slate-600 text-slate-200 px-8 py-4 text-base font-semibold hover:bg-slate-800 transition"
              >
                Learn More
              </a>
            </div>

          </div>
        </section>

        {/* Key Problems Solved */}
        <section className="py-16 md:py-24 bg-slate-900/50">
          <div className="container mx-auto max-w-6xl px-6 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
                The Challenge
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Developing a competent interpreting workforce is expensive, time-consuming, and hard to measure.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Can't Measure Growth</h3>
                <p className="text-sm text-slate-300">
                  No visibility into interpreter competency development. Are new hires actually improving?
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">High Burnout Rate</h3>
                <p className="text-sm text-slate-300">
                  Interpreters burning out before reaching competency. No early warning system.
                </p>
              </div>

              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-6">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-100 mb-2">Can't Prove ROI</h3>
                <p className="text-sm text-slate-300">
                  Funders want data. You have anecdotes. No way to demonstrate program impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Solution */}
        <section id="features" className="py-16 md:py-24">
          <div className="container mx-auto max-w-6xl px-6 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
                The Solution: Real-Time Workforce Intelligence
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                InterpretReflect gives you a complete dashboard to manage, measure, and improve your interpreter workforce.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Feature 1 */}
              <div className="rounded-xl border border-teal-500/30 bg-gradient-to-br from-teal-500/10 to-transparent p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">Competency Growth Tracking</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      See ECCI domain performance across your entire roster. Identify who's improving, who's struggling, and where to invest training resources.
                    </p>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Track 4 ECCI domains: Linguistic, Cultural, Cognitive, Interpersonal</li>
                      <li>• Average time to competency metrics</li>
                      <li>• Individual and cohort progress</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-transparent p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">Assignment Readiness</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      Know which interpreters are prepping for assignments. Track prep completion rates and debrief quality across your team.
                    </p>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Assignment prep completion rate: 84%</li>
                      <li>• Debrief completion tracking</li>
                      <li>• Elya AI engagement metrics</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">Burnout Prevention</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      Catch burnout before it happens. Wellness check-ins flag at-risk interpreters so you can intervene early.
                    </p>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Automated wellness tracking</li>
                      <li>• Early warning alerts for supervisors</li>
                      <li>• 40% lower burnout risk with mentorship</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">Credentials Dashboard</h3>
                    <p className="text-sm text-slate-300 mb-3">
                      View all interpreter credentials in one place. Track expirations, send renewal reminders, and export compliance reports for audits.
                    </p>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li>• Roster-wide credential visibility</li>
                      <li>• Expiration alerts (90-day warning)</li>
                      <li>• One-click compliance exports</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Proof */}
        <section className="py-16 md:py-24 bg-slate-900/50">
          <div className="container mx-auto max-w-6xl px-6 md:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
                Measurable Outcomes
              </h2>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                Data you can show funders, boards, and stakeholders
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Competency Acceleration</p>
                <p className="text-3xl font-bold text-teal-400 mb-2">2.3 ECCI levels in 6 months</p>
                <p className="text-sm text-slate-400">vs 1.1 industry average</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Retention Impact</p>
                <p className="text-3xl font-bold text-violet-400 mb-2">18% reduction in turnover</p>
                <p className="text-sm text-slate-400">compared to state average</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Burnout Prevention</p>
                <p className="text-3xl font-bold text-emerald-400 mb-2">40% lower burnout risk</p>
                <p className="text-sm text-slate-400">with active mentor connections</p>
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Assignment Quality</p>
                <p className="text-3xl font-bold text-amber-400 mb-2">23% higher satisfaction</p>
                <p className="text-sm text-slate-400">when prep is completed</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="demo" className="py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-6 md:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-50 mb-4">
              Ready to Transform Your Program?
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              Schedule a 30-minute demo to see the admin dashboard in action
            </p>

            <div className="rounded-xl border border-teal-500/50 bg-gradient-to-br from-teal-500/10 to-blue-500/10 p-8 mb-8">
              <h3 className="text-xl font-semibold text-slate-100 mb-4">What You'll See</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">✓</span>
                  <p className="text-sm text-slate-300">Pipeline Health: ITP grads → Active → Mentoring</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">✓</span>
                  <p className="text-sm text-slate-300">Competency Growth by domain</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">✓</span>
                  <p className="text-sm text-slate-300">Wellness indicators & burnout alerts</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">✓</span>
                  <p className="text-sm text-slate-300">Credentials tracking & compliance</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">✓</span>
                  <p className="text-sm text-slate-300">CEU tracking & RID compliance</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-teal-400 mt-1">✓</span>
                  <p className="text-sm text-slate-300">Exportable reports for funders</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://lunacal.ai/interpretreflect/agency-discovery-call-interpretreflect"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 px-8 py-4 text-lg font-semibold shadow-lg shadow-teal-400/30 hover:bg-teal-300 transition"
              >
                Schedule Discovery Call
              </a>
              <a
                href="mailto:info@interpretreflect.com?subject=Agency Inquiry"
                className="inline-flex items-center justify-center rounded-lg border-2 border-slate-600 text-slate-200 px-8 py-4 text-lg font-semibold hover:bg-slate-800 transition"
              >
                Email Us
              </a>
            </div>

            <p className="text-sm text-slate-500 mt-6">
              Questions? Email us at info@interpretreflect.com
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
