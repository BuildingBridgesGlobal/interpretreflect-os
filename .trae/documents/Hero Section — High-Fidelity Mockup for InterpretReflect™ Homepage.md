## Next.js App Router Build Path
- Framework: Next.js (App Router, TypeScript)
- Styling: Tailwind CSS with premium charcoal surfaces, teal/violet accents, amber highlights
- Fonts: Inter via `next/font`; swap to Satoshi/Neue Montreal when ready
- Components are Server Components; add `"use client"` only when interactivity requires it

## Section Order & IDs
- `header`, `hero`, `os-preview`, `value-strip`, `day-in-life`, `features`, `science`, `teams-programs`, `pricing`, `testimonials`, `final-cta`, `footer`

## File Structure
- `app/layout.tsx` — font and base shell
- `app/page.tsx` — homepage composition
- `components/Hero.tsx` — upgraded hero (provided below)
- `components/OSPreview.tsx` — upgraded preview with completed Support Stack (provided below)
- `components/ValueStrip.tsx` and `components/DayInLife.tsx` — your provided sections
- `components/SocialProof.tsx` and `components/FinalCTA.tsx` — previously delivered for Section 9/10

## Layout Shell
```tsx
import "./globals.css";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"], display: "swap" });
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

## Homepage Composition
```tsx
import { Hero } from "@/components/Hero";
import { OSPreview } from "@/components/OSPreview";
import { ValueStrip } from "@/components/ValueStrip";
import { DayInLife } from "@/components/DayInLife";
import { SocialProof } from "@/components/SocialProof";
import { FinalCTA } from "@/components/FinalCTA";
export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <Hero primaryHref="#start" secondaryHref="#os-preview" />
      <OSPreview />
      <ValueStrip />
      <DayInLife />
      <SocialProof />
      <FinalCTA />
    </main>
  );
}
```

## Upgraded `components/Hero.tsx`
```tsx
import React from "react";

type CTA = { label: string; href: string };

type HeroProps = {
  headline?: string;
  subhead?: string;
  primary?: CTA;
  secondary?: CTA;
  microcopy?: string;
  primaryHref?: string;
  secondaryHref?: string;
};

export const Hero: React.FC<HeroProps> = ({
  headline = "The Operating System for Interpreter Well-Being & Performance",
  subhead = "A calm, science-based OS designed for the emotional, cognitive, and ethical load you carry every day.",
  primary = { label: "Start Free", href: "#start" },
  secondary = { label: "See How It Works", href: "#os-preview" },
  microcopy = "Free during beta for individual interpreters. No credit card required.",
  primaryHref,
  secondaryHref,
}) => {
  const pHref = primaryHref || primary.href;
  const sHref = secondaryHref || secondary.href;
  return (
    <section id="hero" className="container mx-auto max-w-6xl px-6 md:px-8 py-20 md:py-28">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
        <div className="md:col-span-5 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/5 px-3 py-1 text-xs font-medium text-teal-200">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-400" />
            Interpreter OS · Emotional + Cognitive + Ethical
          </div>
          <h1 className="text-slate-50 text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">{headline}</h1>
          <p className="text-slate-300 text-lg md:text-xl leading-relaxed">{subhead}</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a href={pHref} className="inline-flex items-center justify-center rounded-lg bg-teal-400 text-slate-950 px-6 py-3 text-sm md:text-base font-semibold shadow-lg shadow-teal-400/30 hover:bg-teal-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition">
              {primary.label}
            </a>
            <a href={sHref} className="inline-flex items-center justify-center rounded-lg border border-violet-400/80 text-violet-200 px-6 py-3 text-sm md:text-base font-semibold hover:bg-violet-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 transition">
              {secondary.label}
            </a>
          </div>
          <p className="text-slate-400 text-sm">{microcopy}</p>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Designed with interpreters, not generic wellness.</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>Tracks stress, domains, and recovery over time.</span>
            </div>
          </div>
        </div>
        <div className="md:col-span-7">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_55%)] opacity-80 blur-3xl" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.8)]">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Performance & Load</p>
                    <p className="mt-1 text-sm text-slate-200">Today · 3 assignments</p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[0.65rem] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Stable
                  </div>
                </div>
                <div className="mt-4 flex items-end gap-1.5 h-20">
                  {[60, 75, 45, 90, 70, 50, 65].map((h, i) => (
                    <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-slate-800 via-teal-500/40 to-teal-400/80" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-3 flex justify-between text-[0.7rem] text-slate-400">
                  <span>Last 7 days</span>
                  <span>Avg load: 71%</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Burnout Drift</p>
                  <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[0.65rem] text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Watch · Slight increase
                  </div>
                </div>
                <div className="mt-4 h-20 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-3 py-2">
                  <div className="flex items-end gap-1.5 h-full">
                    {[20, 25, 30, 35, 40, 48, 55].map((h, i) => (
                      <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-amber-900 via-amber-500/40 to-amber-300/80" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Trend nudging up over the last 2 weeks. OS suggests shorter debriefs after medical assignments.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Today\'s Debrief Saved</p>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">1 new</span>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-slate-100">“Family conference, oncology clinic. Felt pulled between provider and patient.”</p>
                  <div className="flex flex-wrap gap-2 text-[0.7rem] text-slate-300">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5">Medical · Inpatient</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5">Emotional intensity: High</span>
                  </div>
                  <p className="text-[0.7rem] text-slate-400">OS flagged this for follow-up reflection and a brief grounding routine.</p>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Today\'s Support Stack</p>
                  <p className="mt-1 text-sm text-slate-200">Micro-support woven into your day — not another task list.</p>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <div>
                      <p className="text-slate-100">1-minute nervous system check</p>
                      <p className="text-[0.7rem] text-slate-400">After your second assignment.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <div>
                      <p className="text-slate-100">3-prompt debrief</p>
                      <p className="text-[0.7rem] text-slate-400">Scheduled for this evening — auto-saved, CEU-ready.</p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-xl bg-slate-950/80 px-3 py-2">
                    <p className="text-[0.75rem] text-amber-100">“I can honor the emotional weight of this work without carrying it alone.”</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
```

## Upgraded `components/OSPreview.tsx` (completed Support Stack)
```tsx
import React from "react";

type OSPreviewProps = { title?: string; subhead?: string };

type SupportItem = { label: string; detail: string; status: "done" | "active" | "queued" };

export const OSPreview: React.FC<OSPreviewProps> = ({
  title = "Your Interpreter OS in One View",
  subhead = "Performance trends, domain stress, burnout drift, and daily support — in a calm, readable dashboard that speaks your language.",
}) => {
  const support: SupportItem[] = [
    { label: "Pre-assignment centering (2 minutes)", detail: "Before your first medical assignment.", status: "done" },
    { label: "Micro-debrief (3 prompts)", detail: "Scheduled after the oncology family meeting.", status: "active" },
    { label: "Evening grounding check-in", detail: "Reflect on what you’re still carrying + what you can release.", status: "active" },
    { label: "Weekend load review", detail: "OS will summarize your week and suggest small adjustments.", status: "queued" },
  ];

  return (
    <section id="os-preview" className="container mx-auto max-w-6xl px-6 md:px-8 py-16 md:py-20 border-t border-slate-900/70">
      <div className="max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-semibold text-slate-50 tracking-tight">{title}</h2>
        <p className="mt-3 text-slate-300 text-base md:text-lg">{subhead}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Performance & Load</p>
              <p className="mt-1 text-sm text-slate-200">Weekly rhythm overview</p>
            </div>
            <div className="text-right text-[0.7rem] text-slate-400">
              <p>Assignments this week: 11</p>
              <p>High-intensity: 4</p>
            </div>
          </div>
          <div className="mt-4 h-28 rounded-xl bg-slate-950/90 px-3 py-2 flex items-end gap-1.5">
            {[40, 55, 80, 70, 65, 50, 30].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                <div className="w-full rounded-full bg-gradient-to-t from-teal-700 via-teal-400/70 to-teal-300" style={{ height: `${h}%` }} />
                <span className="text-[0.6rem] text-center text-slate-500">{["M","T","W","T","F","S","S"][i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[0.7rem] text-slate-400">
            <span>Target load: 65–75%</span>
            <span>OS notes: Thursday spike after double medical block.</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Domains</p>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">Top 3 this month</span>
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: "Medical · Inpatient", load: "High load", intensity: "Emotional + cognitive", badge: "Watch", badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/40" },
              { label: "Education · K–12", load: "Moderate load", intensity: "Social + cognitive", badge: "Balanced", badgeColor: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40" },
              { label: "Remote / VRI", load: "Variable load", intensity: "Cognitive + screen fatigue", badge: "Monitor", badgeColor: "bg-sky-500/10 text-sky-300 border-sky-500/40" },
            ].map((domain) => (
              <div key={domain.label} className="rounded-xl bg-slate-950/70 p-3 border border-slate-800/70 flex flex-col justify-between">
                <p className="text-[0.8rem] font-medium text-slate-100">{domain.label}</p>
                <p className="mt-1 text-[0.7rem] text-slate-300">{domain.load}</p>
                <p className="text-[0.7rem] text-slate-400">{domain.intensity}</p>
                <span className={`mt-2 inline-flex w-fit items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] ${domain.badgeColor}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {domain.badge}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.7rem] text-slate-400">Domains with repeated high emotional intensity are automatically flagged for additional support and reflection prompts.</p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Burnout Drift · 6-week view</p>
            <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.65rem] text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Slight upward trend
            </div>
          </div>
          <div className="mt-4 h-28 rounded-xl bg-slate-950/90 px-3 py-2 flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-end gap-1.5 h-20">
                {[15, 18, 20, 26, 31, 35].map((h, i) => (
                  <div key={i} className="flex-1 rounded-full bg-gradient-to-t from-amber-900 via-amber-500/40 to-amber-300/80" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[0.6rem] text-slate-500">
                <span>Week 1</span>
                <span>Week 6</span>
              </div>
            </div>
            <div className="w-px h-20 bg-slate-800/80 mx-3" />
            <div className="w-32 text-[0.7rem] text-slate-300 space-y-1">
              <p className="font-medium text-slate-100">OS Suggestion</p>
              <p>Add one 5-minute decompression ritual after high-stakes medical assignments this week.</p>
              <p className="text-slate-400">Auto-scheduled into your Support Stack.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.7rem] uppercase tracking-wide text-slate-400">Today\'s Support Stack</p>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-300">3 active · 1 completed</span>
          </div>
          <div className="space-y-3 text-sm">
            {support.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl bg-slate-950/80 px-3 py-2">
                <div className="mt-1">
                  {item.status === "done" && (
                    <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                  )}
                  {item.status === "active" && (
                    <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-teal-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    </span>
                  )}
                  {item.status === "queued" && (
                    <span className="inline-flex h-3 w-3 items-center justify-center rounded-full border border-slate-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-slate-100">{item.label}</p>
                  <p className="text-[0.7rem] text-slate-400">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
```

## After Approval
- Wire these components into `app/page.tsx` as shown
- Add `Header` and `Footer` next, then stub `features`, `science`, `teams-programs`, and `pricing` with your copy anchors
- Keep v1 motion minimal (hover/fade), layer micro-interactions in Phase 3