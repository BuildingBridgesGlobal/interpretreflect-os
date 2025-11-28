# Supabase Database Setup

## Current Status

All required tables have been created from the initial migration `20241125_create_ai_tables.sql`:
- ✅ skills (catalog)
- ✅ skill_assessments
- ✅ skill_goals
- ✅ practice_sessions
- ✅ agent_events
- ✅ RLS policies configured
- ✅ Indexes created

## Pending Migration

The skills catalog currently has generic placeholder skills. To replace them with interpreter-specific skills, apply the migration:

**Migration file**: `migrations/20250127000002_update_skills_catalog.sql`

### To Apply the Migration:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wjhdvjukspfgoojyloks
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20250127000002_update_skills_catalog.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl+Enter`

This migration will:
- Delete generic skills (Communication, Problem Solving, etc.)
- Insert 12 interpreter-specific skills across 4 categories:
  - **Linguistic**: Simultaneous Interpreting, Consecutive Interpreting, Medical Terminology, Legal Terminology
  - **Ethical**: Role-Space Management, Cultural Mediation, Confidentiality Management
  - **Emotional Regulation**: Vicarious Trauma Management, Emotional Residue Processing, Burnout Prevention
  - **Technical**: Remote Interpreting Technology, Note-Taking Systems

## Database Schema

### skills
Master catalog of interpreter skills available for tracking.

### skill_assessments
User skill level assessments (1-5 scale) from various sources (self, coach, system).

### skill_goals
User-defined goals for skill improvement with target levels and priorities.

### practice_sessions
Logged practice activities linked to specific skills.

### agent_events
System recommendations, user queries, and AI agent interactions.

## RLS Policies

All tables have Row Level Security enabled:
- `skills` - Public read for authenticated users
- All other tables - User-owned data only (auth.uid() = user_id)

## Next Steps

After applying the migration:
1. Test signup flow to ensure user creation works
2. Test onboarding flow to verify skill selection and assessment capture
3. Check Skills Dashboard displays correctly with new skills
