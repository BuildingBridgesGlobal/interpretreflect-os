-- Skills & Growth Phase: Core Tables + RLS
-- Migration: 20250127000001_skills_growth_schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SKILLS TABLE (Catalog)
-- ============================================
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'linguistic', 'ethical', 'technical', 'emotional-regulation'
  description TEXT,
  level_descriptors JSONB, -- { "1": "Novice...", "2": "Advanced beginner...", etc. }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- RLS: Public read for authenticated users (write restricted to admins later)
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read skills catalog"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- 2. SKILL ASSESSMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('self', 'coach', 'system')),
  level INTEGER NOT NULL CHECK (level >= 1 AND level <= 5),
  confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_assessments_user ON skill_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_skill ON skill_assessments(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_created ON skill_assessments(created_at DESC);

-- RLS: User-owned only
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own assessments"
  ON skill_assessments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON skill_assessments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments"
  ON skill_assessments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments"
  ON skill_assessments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 3. SKILL GOALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS skill_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  target_level INTEGER NOT NULL CHECK (target_level >= 1 AND target_level <= 5),
  deadline TIMESTAMPTZ,
  priority INTEGER CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_goals_user ON skill_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_goals_skill ON skill_goals(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_goals_priority ON skill_goals(priority DESC);

-- RLS: User-owned only
ALTER TABLE skill_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own goals"
  ON skill_goals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON skill_goals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON skill_goals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON skill_goals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 4. PRACTICE SESSIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS practice_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('drill', 'simulation', 'prep', 'review')),
  duration_minutes INTEGER,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user ON practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_skill ON practice_sessions(skill_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created ON practice_sessions(created_at DESC);

-- RLS: User-owned only
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own practice sessions"
  ON practice_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions"
  ON practice_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions"
  ON practice_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own practice sessions"
  ON practice_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- 5. AGENT EVENTS TABLE (for recommendations & logging)
-- ============================================
CREATE TABLE IF NOT EXISTS agent_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent TEXT NOT NULL, -- e.g., 'skills', 'catalyst', 'reflect'
  event_type TEXT NOT NULL, -- e.g., 'recommendation', 'query', 'feedback'
  metadata JSONB, -- Flexible storage for event details
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_events_user ON agent_events(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_agent ON agent_events(agent);
CREATE INDEX IF NOT EXISTS idx_agent_events_type ON agent_events(event_type);
CREATE INDEX IF NOT EXISTS idx_agent_events_created ON agent_events(created_at DESC);

-- RLS: User-owned only
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own agent events"
  ON agent_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agent events"
  ON agent_events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agent events"
  ON agent_events FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own agent events"
  ON agent_events FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- SEED DATA: Initial Skills Catalog
-- ============================================

-- Linguistic Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Simultaneous Interpreting', 'linguistic', 'Real-time interpretation between languages while speaker continues',
 '{"1": "Can handle basic greetings and simple exchanges", "2": "Can manage routine medical/legal dialogues with preparation", "3": "Handles complex technical content with good accuracy", "4": "Seamlessly interprets high-stakes, emotionally charged sessions", "5": "Expert-level performance across all domains and registers"}'::jsonb),

('Consecutive Interpreting', 'linguistic', 'Note-taking and interpreting after speaker pauses',
 '{"1": "Can relay short messages with notes", "2": "Can handle standard consultations with accurate note-taking", "3": "Interprets complex monologues with excellent retention", "4": "Maintains accuracy through lengthy legal/medical testimony", "5": "Flawless performance with extended technical discourse"}'::jsonb),

('Medical Terminology', 'linguistic', 'Understanding and interpreting medical vocabulary and concepts',
 '{"1": "Knows basic anatomy and common conditions", "2": "Comfortable with routine diagnoses and procedures", "3": "Handles specialist consultations (oncology, cardiology)", "4": "Interprets complex treatment plans and research discussions", "5": "Expert in all medical specialties and clinical research"}'::jsonb),

('Legal Terminology', 'linguistic', 'Understanding and interpreting legal vocabulary and procedures',
 '{"1": "Knows basic legal rights and court roles", "2": "Handles arraignments and simple civil cases", "3": "Interprets depositions and expert testimony", "4": "Works complex trials and appellate proceedings", "5": "Expert across all legal domains including contracts and IP"}'::jsonb)

ON CONFLICT DO NOTHING;

-- Ethical Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Role-Space Management', 'ethical', 'Maintaining appropriate boundaries and professional role',
 '{"1": "Aware of interpreter role vs. advocate/counselor", "2": "Consistently maintains boundaries in routine settings", "3": "Navigates gray areas and consumer pressure with skill", "4": "Models ethical decision-making for colleagues", "5": "Expert consultant on ethics and role-space dilemmas"}'::jsonb),

('Cultural Mediation', 'ethical', 'Bridging cultural gaps while maintaining neutrality',
 '{"1": "Aware of cultural differences in communication", "2": "Explains cultural context when necessary", "3": "Skillfully mediates cultural misunderstandings", "4": "Anticipates cultural conflicts and intervenes appropriately", "5": "Expert in cross-cultural communication and training"}'::jsonb),

('Confidentiality Management', 'ethical', 'Protecting sensitive information and navigating disclosure',
 '{"1": "Understands basic confidentiality requirements", "2": "Consistently applies confidentiality in practice", "3": "Handles complex disclosure scenarios (mandated reporting)", "4": "Advises on confidentiality policies and protocols", "5": "Expert on confidentiality across all domains and jurisdictions"}'::jsonb)

ON CONFLICT DO NOTHING;

-- Emotional Regulation Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Vicarious Trauma Management', 'emotional-regulation', 'Processing and recovering from exposure to traumatic content',
 '{"1": "Aware of vicarious trauma risks", "2": "Uses basic self-care and debriefing", "3": "Implements structured recovery protocols", "4": "Maintains resilience through sustained trauma exposure", "5": "Mentors others and contributes to trauma-informed training"}'::jsonb),

('Emotional Residue Processing', 'emotional-regulation', 'Managing emotional carryover between assignments',
 '{"1": "Notices emotional reactions after difficult assignments", "2": "Uses grounding techniques between sessions", "3": "Implements systematic emotional clearing routines", "4": "Maintains emotional neutrality across back-to-back sessions", "5": "Expert in emotional regulation and teaches others"}'::jsonb),

('Burnout Prevention', 'emotional-regulation', 'Recognizing and preventing long-term exhaustion',
 '{"1": "Aware of burnout signs and symptoms", "2": "Monitors workload and takes breaks", "3": "Proactively adjusts schedule and boundaries", "4": "Sustains long-term career without burnout", "5": "Mentors others on sustainable career practices"}'::jsonb)

ON CONFLICT DO NOTHING;

-- Technical Skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Remote Interpreting Technology', 'technical', 'Using video/phone interpreting platforms effectively',
 '{"1": "Can join basic video calls and manage audio", "2": "Proficient with major VRI platforms", "3": "Troubleshoots technical issues independently", "4": "Optimizes setup for quality and ergonomics", "5": "Trains others and advises on platform selection"}'::jsonb),

('Note-Taking Systems', 'technical', 'Developing efficient note-taking methods for consecutive interpreting',
 '{"1": "Takes basic linear notes", "2": "Uses symbols and abbreviations consistently", "3": "Employs advanced notation systems", "4": "Custom system optimized for personal workflow", "5": "Teaches note-taking and develops new methods"}'::jsonb)

ON CONFLICT DO NOTHING;

-- ============================================
-- UPDATED_AT TRIGGER (for tables with updated_at)
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_goals_updated_at
  BEFORE UPDATE ON skill_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
