## Objectives
- Create lean Supabase schema for Skills & Growth with user‑owned RLS
- Write onboarding Step 4 data to Supabase (skills selected + self‑assessments)
- Power `/app/skills` UI from Supabase reads (assessments, goals, practice)
- Log recommendations in `agent_events` (no duplicate tables)

## Schema (Supabase)
- `skills`: catalog of competencies (uuid, name, category, description, level_descriptors jsonb, timestamps)
- `skill_assessments`: (uuid, user_id FK auth.users, skill_id FK skills, source: self/coach/system, level 1–5, confidence, notes, created_at) with RLS user‑owned
- `skill_goals`: (uuid, user_id FK, skill_id FK, target_level 1–5, deadline, priority 1–5, timestamps) with RLS user‑owned
- `practice_sessions`: (uuid, user_id FK, skill_id FK, session_type drill/simulation/prep/review, duration_minutes, quality_rating 1–5, notes, created_at) with RLS user‑owned
- `agent_events`: (uuid, user_id FK, agent, event_type, metadata jsonb, created_at) with RLS user‑owned; use `event_type='recommendation'` for practice suggestions
- Policies:
  - skills: public select (authenticated users); write limited to admins later
  - user‑owned tables: select/insert/update/delete only when `auth.uid() = user_id`

## Environment & Client
- Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Supabase client already present in `lib/supabaseClient.ts`; continue using it for reads/writes

## Onboarding Writes (Step 4)
- On submit:
  - Insert `skill_assessments` rows for selected skills with `source='self'` and chosen level
  - Insert `skill_goals` rows with `target_level = min(level + 1, 5)` and default priority
- Error handling: surface inline errors, retry; proceed to `/app?firstRun=1` on success

## SkillsDashboard Reads
- Focus skills & goals: query `skill_goals` join `skills`, order by priority/deadline, limit 2
- CompetencyRadar: aggregate latest `skill_assessments` by skill/category; shape data for chart stub
- PracticeQueue: simple v1 rule‑based list
  - include goals with low recent practice (`practice_sessions` in last 7 days < threshold)
  - include skills with plateau (no level change in N days)
  - produce items with `session_type`, `suggestedDuration`, `reason`
- GrowthTimeline: plot last 6–8 weeks of `skill_assessments.level` changes over time with practice counts

## Agent Events Logging (Recommendations)
- When PracticeQueue is generated (Phase 2), write an `agent_events` entry per suggested item:
  - `agent='skills'`, `event_type='recommendation'`, `metadata={ skill_id, session_type, duration, reason }`

## UI Integration
- Keep updated OSPreview (2×3 grid) and Skills route/components
- Add loading/empty states in SkillsDashboard when no data yet
- Keep Catalyst at `/app/coach` as front door; agents remain behind the glass

## Testing & Verification
- Seed minimal `skills` catalog
- Run onboarding → confirm rows in `skill_assessments` and `skill_goals`
- Verify SkillsDashboard loads focus skills and radar/timeline stubs without errors
- Ensure RLS prevents cross‑user access

## Deliverables
- SQL migration script for the 5 tables + RLS policies
- Onboarding Step 4 write integration
- SkillsDashboard Supabase read integration
- PracticeQueue v1 rules + `agent_events` logging

## Post‑Phase (Optional Next)
- Charting: hook radar/timeline to a lightweight chart lib
- Catalyst intent routing: map common queries to skills/optimization/prep/debrief
- Program aggregates: safe, anonymized views for cohorts