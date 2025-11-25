## Objectives
- Elevate Skills & Growth to a first-class plane alongside Well-Being & Load
- Keep multi-agent internals behind Catalyst; ship visible UI value first
- Avoid technical debt: log recommendations as `agent_events` only

## Copy & Positioning Updates
- Hero headline: “The Operating System for Interpreter Well‑Being, Skills, and Growth”
- Subhead: “A calm, science‑based OS that tracks your emotional load, builds core interpreting skills, and gives you a multi‑agent coaching team for every assignment.”

## Homepage Changes
- Header: add “Skills” nav item; keep `/start` CTA
- OSPreview → 2×3 grid
  - Row 1: Performance & Load, Domains, Burnout Drift
  - Row 2: Today’s Support Stack, Competency Radar, Growth Timeline
- Feature Grid additions: Skill Lab, Competency Radar, Practice Queue, Optimization Engine (retain Burnout Drift & Support Stack)

## App Routes & Components
- `/app/skills` → Skills OS route
  - `SkillsDashboard` (Focus skills & goals + CompetencyRadar + PracticeQueue + GrowthTimeline)
  - `components/skills/CompetencyRadar.tsx`
  - `components/skills/PracticeQueue.tsx`
  - `components/skills/GrowthTimeline.tsx`
- `/app/coach` → Catalyst front door
  - `components/coach/CatalystChat.tsx` (conversation stub)

## Onboarding Extension (UI-first)
- Step 4: capture top two skills and quick self-assessments (store locally for now; Phase 2 writes to Supabase)

## Data Model (Phase 2 Prep)
- Supabase tables to add when ready: `skills`, `skill_assessments`, `skill_goals`, `practice_sessions`, `agent_events`
- Recommendations logged as `agent_events` with `event_type='recommendation'`

## Phase Timeline
- Phase 1 (implement now):
  - Update hero copy & header nav
  - Refactor OSPreview to 2×3 (add Competency Radar & Growth Timeline panels)
  - Create `/app/skills` and `/app/coach` routes with components stubs
  - Extend onboarding Step 4 (UI capture for skills intent)
- Phase 2:
  - Apply lean SQL; wire SkillsDashboard reads; write onboarding to Supabase
  - Seed basic Skills Agent rules to generate Practice Queue; log outputs in `agent_events`
- Phase 3:
  - Visualizations, micro-interactions; Catalyst orchestration; program aggregates

## Deliverables
- Updated OSPreview & Header
- New routes/components: SkillsDashboard (with three skills components) and CatalystChat stub
- Onboarding Step 4 UI extension

Confirm and I will implement Phase 1 immediately and prepare the SQL for Phase 2.