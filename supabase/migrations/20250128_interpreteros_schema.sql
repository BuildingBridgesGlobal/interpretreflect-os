-- InterpreterOS Database Schema
-- This migration creates all tables needed for the Skills and History pages

-- ============================================================================
-- SKILLS DOMAIN
-- ============================================================================

-- ECCI Skills Master Table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL, -- Linguistic, Cultural, Cognitive, Interpersonal
  description TEXT,
  professional_impact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Skill Assessments (tracks mastery over time)
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level INTEGER NOT NULL CHECK (level >= 0 AND level <= 100), -- 0-100 percentage
  assessment_type TEXT, -- 'debrief', 'training', 'self-assessment'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Skill Goals
CREATE TABLE IF NOT EXISTS skill_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  target_level INTEGER NOT NULL CHECK (target_level >= 0 AND target_level <= 100),
  current_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  achieved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Training Modules
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  format TEXT NOT NULL, -- 'scenarios', 'micro-lessons', 'case-studies', 'skill-drills'
  duration INTEGER NOT NULL, -- minutes
  difficulty TEXT NOT NULL, -- 'Entry', 'Intermediate', 'Advanced'
  setting TEXT, -- 'Medical', 'Legal', 'Educational', 'VRS', 'Community', 'Mental Health'
  description TEXT,
  content JSONB, -- Training content/structure
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Module - Skill Mapping (many-to-many)
CREATE TABLE IF NOT EXISTS training_module_skills (
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (training_module_id, skill_id)
);

-- User Training Completions
CREATE TABLE IF NOT EXISTS training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  duration_minutes INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Training Assignments (Elya recommendations)
CREATE TABLE IF NOT EXISTS training_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_module_id UUID NOT NULL REFERENCES training_modules(id) ON DELETE CASCADE,
  assigned_reason TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10, lower is higher priority
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- DEBRIEFS & HISTORY DOMAIN
-- ============================================================================

-- Assignment Debriefs
CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  assignment_type TEXT NOT NULL, -- 'Medical', 'Legal', 'Educational', 'VRS', 'Community', 'Mental Health'
  setting TEXT,
  headline TEXT NOT NULL, -- Elya's main insight
  full_analysis TEXT NOT NULL, -- Complete Elya analysis
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Debrief - Skill Mapping (tracks which skills were evaluated)
CREATE TABLE IF NOT EXISTS debrief_skills (
  debrief_id UUID NOT NULL REFERENCES debriefs(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  PRIMARY KEY (debrief_id, skill_id)
);

-- Performance Flags (strengths, development areas, breakthroughs)
CREATE TABLE IF NOT EXISTS performance_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debrief_id UUID NOT NULL REFERENCES debriefs(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL, -- 'strength', 'development', 'breakthrough'
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Elya Chat Messages
CREATE TABLE IF NOT EXISTS elya_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'elya' or 'user'
  content TEXT NOT NULL,
  context TEXT, -- 'dashboard', 'debrief', 'training', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Performance Milestones
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL, -- 'first', 'achievement', 'breakthrough'
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User Notes/Reflections
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL, -- 'debrief', 'training', 'general'
  related_id UUID, -- ID of related debrief or training
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Skill assessments
CREATE INDEX IF NOT EXISTS idx_skill_assessments_user_id ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill_id ON skill_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_created_at ON skill_assessments(created_at DESC);

-- Skill goals
CREATE INDEX IF NOT EXISTS idx_skill_goals_user_id ON skill_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_goals_skill_id ON skill_goals(skill_id);

-- Training completions
CREATE INDEX IF NOT EXISTS idx_training_completions_user_id ON training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_completions_completed_at ON training_completions(completed_at DESC);

-- Training assignments
CREATE INDEX IF NOT EXISTS idx_training_assignments_user_id ON training_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_training_assignments_priority ON training_assignments(priority);

-- Debriefs
CREATE INDEX IF NOT EXISTS idx_debriefs_user_id ON debriefs(user_id);
CREATE INDEX IF NOT EXISTS idx_debriefs_date ON debriefs(date DESC);
CREATE INDEX IF NOT EXISTS idx_debriefs_assignment_type ON debriefs(assignment_type);

-- Performance flags
CREATE INDEX IF NOT EXISTS idx_performance_flags_debrief_id ON performance_flags(debrief_id);
CREATE INDEX IF NOT EXISTS idx_performance_flags_type ON performance_flags(flag_type);

-- Elya messages
CREATE INDEX IF NOT EXISTS idx_elya_messages_user_id ON elya_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_elya_messages_created_at ON elya_messages(created_at DESC);

-- Milestones
CREATE INDEX IF NOT EXISTS idx_milestones_user_id ON milestones(user_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON milestones(date DESC);

-- User notes
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_type ON user_notes(note_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_module_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE debrief_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE elya_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Skills (read-only for all authenticated users)
CREATE POLICY "Skills are viewable by all authenticated users"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- Skill assessments (users can only access their own)
CREATE POLICY "Users can view their own skill assessments"
  ON skill_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill assessments"
  ON skill_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Skill goals (users can only access their own)
CREATE POLICY "Users can view their own skill goals"
  ON skill_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill goals"
  ON skill_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill goals"
  ON skill_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Training modules (read-only for all authenticated users)
CREATE POLICY "Training modules are viewable by all authenticated users"
  ON training_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Training module skills are viewable by all authenticated users"
  ON training_module_skills FOR SELECT
  TO authenticated
  USING (true);

-- Training completions (users can only access their own)
CREATE POLICY "Users can view their own training completions"
  ON training_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training completions"
  ON training_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Training assignments (users can only access their own)
CREATE POLICY "Users can view their own training assignments"
  ON training_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own training assignments"
  ON training_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Debriefs (users can only access their own)
CREATE POLICY "Users can view their own debriefs"
  ON debriefs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own debriefs"
  ON debriefs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own debriefs"
  ON debriefs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Debrief skills
CREATE POLICY "Users can view debrief skills for their debriefs"
  ON debrief_skills FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM debriefs
    WHERE debriefs.id = debrief_skills.debrief_id
    AND debriefs.user_id = auth.uid()
  ));

-- Performance flags
CREATE POLICY "Users can view performance flags for their debriefs"
  ON performance_flags FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM debriefs
    WHERE debriefs.id = performance_flags.debrief_id
    AND debriefs.user_id = auth.uid()
  ));

-- Elya messages (users can only access their own)
CREATE POLICY "Users can view their own elya messages"
  ON elya_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own elya messages"
  ON elya_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Milestones (users can only access their own)
CREATE POLICY "Users can view their own milestones"
  ON milestones FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- User notes (users can only access their own)
CREATE POLICY "Users can view their own notes"
  ON user_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON user_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON user_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON user_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA: ECCI SKILLS
-- ============================================================================

INSERT INTO skills (name, domain, description, professional_impact) VALUES
-- Linguistic Domain
('Message Accuracy', 'Linguistic', 'The ability to convey the source message with complete fidelity to meaning, intent, and register.', 'Message accuracy directly affects consumer comprehension, legal outcomes, medical safety, and professional credibility.'),
('Register Shifting', 'Linguistic', 'Adapting language formality and style to match the context and participants.', 'Appropriate register use ensures effective communication across diverse settings and maintains professional standards.'),
('Terminology Management', 'Linguistic', 'The systematic approach to specialized vocabulary acquisition, retention, and deployment across settings.', 'Effective terminology management reduces cognitive load, increases accuracy, and builds professional confidence.'),

-- Cultural Domain
('Cultural Mediation', 'Cultural', 'Facilitating understanding across cultural differences while maintaining message integrity.', 'Cultural mediation directly affects message equivalence and consumer trust in cross-cultural communication.'),
('Cultural Navigation', 'Cultural', 'Understanding and adapting to cultural norms, values, and communication styles.', 'Cultural competence enables interpreters to work effectively in diverse communities and settings.'),
('Community Knowledge', 'Cultural', 'Understanding the specific cultural, linguistic, and social contexts of Deaf communities.', 'Deep community knowledge informs culturally appropriate interpreting decisions and builds trust.'),

-- Cognitive Domain
('Multitasking Capacity', 'Cognitive', 'Managing multiple cognitive processes simultaneously during interpretation.', 'Multitasking ability is essential for handling complex interpreting scenarios with multiple demands.'),
('Decision Making', 'Cognitive', 'Making real-time interpreting choices under pressure with incomplete information.', 'Sound decision-making directly impacts message accuracy and professional effectiveness.'),
('Information Processing', 'Cognitive', 'Processing, analyzing, and rendering information quickly and accurately.', 'Processing speed and accuracy determine interpreting quality in fast-paced environments.'),

-- Interpersonal Domain
('Professional Boundaries', 'Interpersonal', 'Maintaining appropriate professional relationships and ethical limits.', 'Clear boundaries protect both interpreters and consumers while ensuring professional integrity.'),
('Team Collaboration', 'Interpersonal', 'Working effectively with other interpreters and professionals in team settings.', 'Collaboration skills enable successful teamwork and improve overall service quality.'),
('Ethical Reasoning', 'Interpersonal', 'Analyzing and resolving ethical dilemmas using professional codes and principles.', 'Ethical reasoning ensures interpreters make sound professional judgments in complex situations.')
ON CONFLICT DO NOTHING;
