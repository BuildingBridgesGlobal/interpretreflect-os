-- Migration for Dashboard Features: Weekly Reports, Debriefs, Patterns, and Preferences
-- Created: 2025-01-28

-- ============================================================================
-- POST-ASSIGNMENT DEBRIEFS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.assignment_debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Assignment Details
  assignment_title TEXT NOT NULL,
  assignment_date TIMESTAMPTZ NOT NULL,

  -- AI-Generated Content
  ai_summary TEXT,
  key_insight TEXT,

  -- Metadata
  domain_tags TEXT[] DEFAULT '{}',
  intensity_level TEXT CHECK (intensity_level IN ('low', 'medium', 'high')),
  skills_used TEXT[] DEFAULT '{}',
  feeling TEXT,

  -- Voice Journaling
  voice_transcript TEXT,
  voice_recording_url TEXT,

  -- Go Deeper Prompts
  go_deeper_prompts JSONB DEFAULT '[]', -- Array of prompt strings

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_debriefs_user_id ON public.assignment_debriefs(user_id);
CREATE INDEX idx_debriefs_assignment_date ON public.assignment_debriefs(assignment_date DESC);
CREATE INDEX idx_debriefs_domain_tags ON public.assignment_debriefs USING GIN(domain_tags);

-- RLS Policies
ALTER TABLE public.assignment_debriefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own debriefs"
  ON public.assignment_debriefs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debriefs"
  ON public.assignment_debriefs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debriefs"
  ON public.assignment_debriefs
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own debriefs"
  ON public.assignment_debriefs
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PATTERN RECOGNITION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Pattern Classification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('strength', 'challenge', 'drift', 'growth')),

  -- Pattern Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence JSONB DEFAULT '[]', -- Array of evidence strings

  -- Metrics
  frequency INTEGER DEFAULT 0,
  trend TEXT CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  confidence_score DECIMAL(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Related Data
  related_domains TEXT[] DEFAULT '{}',
  recommendation TEXT,

  -- Active Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_patterns_user_id ON public.user_patterns(user_id);
CREATE INDEX idx_patterns_type ON public.user_patterns(pattern_type);
CREATE INDEX idx_patterns_active ON public.user_patterns(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own patterns"
  ON public.user_patterns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
  ON public.user_patterns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
  ON public.user_patterns
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- LEARNED PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learned_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Preference Classification
  category TEXT NOT NULL CHECK (category IN ('prompts', 'workflow', 'feedback', 'scheduling')),

  -- Preference Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  learned_from TEXT NOT NULL, -- e.g., "42 reflection sessions analyzed"

  -- Confidence & Status
  confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_preferences_user_id ON public.learned_preferences(user_id);
CREATE INDEX idx_preferences_category ON public.learned_preferences(category);
CREATE INDEX idx_preferences_active ON public.learned_preferences(is_active) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE public.learned_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.learned_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.learned_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.learned_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- WEEKLY OS REPORTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Week Identifier
  week_ending DATE NOT NULL,

  -- Assignments Summary
  total_assignments INTEGER DEFAULT 0,
  assignments_by_domain JSONB DEFAULT '{}', -- {domain: count}

  -- Skills Development
  skills_developed TEXT[] DEFAULT '{}',
  skills_needs_work TEXT[] DEFAULT '{}',

  -- Burnout Drift
  drift_level TEXT CHECK (drift_level IN ('stable', 'slight', 'moderate', 'high')),
  drift_trend TEXT CHECK (drift_trend IN ('improving', 'stable', 'worsening')),
  drift_signals TEXT[] DEFAULT '{}',

  -- CEU Hours
  ceu_hours DECIMAL(5,2) DEFAULT 0,

  -- AI Insights
  insights JSONB DEFAULT '[]', -- Array of insight strings

  -- Email Status
  emailed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_weekly_reports_user_id ON public.weekly_reports(user_id);
CREATE INDEX idx_weekly_reports_week_ending ON public.weekly_reports(week_ending DESC);
CREATE UNIQUE INDEX idx_weekly_reports_user_week ON public.weekly_reports(user_id, week_ending);

-- RLS Policies
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own weekly reports"
  ON public.weekly_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly reports"
  ON public.weekly_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly reports"
  ON public.weekly_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- LIBRARY ENTRIES (for organizing all reflection content)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.library_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Entry Details
  title TEXT NOT NULL,
  entry_type TEXT CHECK (entry_type IN ('debrief', 'prep', 'review', 'note')),

  -- Reference to actual content
  debrief_id UUID REFERENCES public.assignment_debriefs(id) ON DELETE SET NULL,

  -- Tags for organization
  domain_tags TEXT[] DEFAULT '{}',
  workflow_tags TEXT[] DEFAULT '{}',
  skill_tags TEXT[] DEFAULT '{}',
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),

  -- Timestamps
  entry_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_library_user_id ON public.library_entries(user_id);
CREATE INDEX idx_library_entry_date ON public.library_entries(entry_date DESC);
CREATE INDEX idx_library_domain_tags ON public.library_entries USING GIN(domain_tags);
CREATE INDEX idx_library_workflow_tags ON public.library_entries USING GIN(workflow_tags);
CREATE INDEX idx_library_skill_tags ON public.library_entries USING GIN(skill_tags);

-- RLS Policies
ALTER TABLE public.library_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own library entries"
  ON public.library_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own library entries"
  ON public.library_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library entries"
  ON public.library_entries
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library entries"
  ON public.library_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_assignment_debriefs_updated_at
  BEFORE UPDATE ON public.assignment_debriefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_patterns_updated_at
  BEFORE UPDATE ON public.user_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learned_preferences_updated_at
  BEFORE UPDATE ON public.learned_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_reports_updated_at
  BEFORE UPDATE ON public.weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
