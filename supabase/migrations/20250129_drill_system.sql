-- Interpreter Drills System Schema
-- Phase 1: Core drill functionality with 6 categories and comprehensive tracking

-- =====================================================
-- DRILL CATEGORIES & SUBCATEGORIES
-- =====================================================

-- Main drill categories (6 core categories)
CREATE TABLE drill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_code TEXT NOT NULL UNIQUE, -- ethical_judgment, role_management, etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_emoji TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subcategories within each category
CREATE TABLE drill_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES drill_categories(id) ON DELETE CASCADE,
  subcategory_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- DRILLS
-- =====================================================

-- Individual drill questions/scenarios
CREATE TABLE drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subcategory_id UUID NOT NULL REFERENCES drill_subcategories(id) ON DELETE CASCADE,
  drill_code TEXT NOT NULL UNIQUE,
  drill_type TEXT NOT NULL, -- scenario_decision, best_worst_ranking, red_flag, quick_fire, regulation_check

  -- Content
  scenario_text TEXT NOT NULL,
  context_details JSONB, -- Additional context like setting, participants, etc.

  -- For scenario_decision and quick_fire
  question TEXT,
  correct_answer TEXT,
  options JSONB, -- Array of answer options

  -- For best_worst_ranking
  ranking_items JSONB, -- Array of items to rank
  correct_best TEXT,
  correct_worst TEXT,

  -- For red_flag identification
  red_flags JSONB, -- Array of red flags to identify
  correct_red_flags JSONB, -- Array of correct red flag IDs

  -- Feedback and explanation
  explanation TEXT NOT NULL, -- Why the correct answer is right
  incorrect_feedback JSONB, -- Feedback for each incorrect option
  learning_points JSONB, -- Key takeaways from this drill

  -- Related content
  related_module_id UUID REFERENCES skill_modules(id), -- NSM module that unlocks this drill
  related_ecci_domain TEXT,

  -- Metadata
  difficulty_level INTEGER DEFAULT 1, -- 1-5 scale
  estimated_seconds INTEGER DEFAULT 30,
  tags JSONB, -- Array of tags for searching/filtering

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- USER PROGRESS & ATTEMPTS
-- =====================================================

-- Individual drill attempts (every time user answers a drill)
CREATE TABLE drill_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES drills(id) ON DELETE CASCADE,
  session_id UUID, -- For grouping attempts in practice sessions

  -- User's response
  user_answer TEXT,
  user_ranking JSONB, -- For ranking drills
  user_red_flags JSONB, -- For red flag drills
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5), -- 1-5 scale

  -- Performance metrics
  is_correct BOOLEAN NOT NULL,
  response_time_seconds INTEGER, -- How long they took to answer

  -- Timestamp
  attempted_at TIMESTAMPTZ DEFAULT now()
);

-- Practice sessions (when user does multiple drills in one sitting)
CREATE TABLE drill_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- quick_practice, category_practice, custom
  category_id UUID REFERENCES drill_categories(id),

  -- Session stats
  drills_completed INTEGER DEFAULT 0,
  drills_correct INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  average_confidence DECIMAL(3,2),

  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT false
);

-- =====================================================
-- USER STATS & PROGRESS TRACKING
-- =====================================================

-- Overall drill stats per user
CREATE TABLE user_drill_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Overall metrics
  total_drills_attempted INTEGER DEFAULT 0,
  total_drills_correct INTEGER DEFAULT 0,
  overall_accuracy DECIMAL(5,2) DEFAULT 0, -- Percentage

  -- Readiness score (0-100)
  readiness_score INTEGER DEFAULT 0,

  -- Streaks
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  last_practice_date DATE,

  -- Confidence calibration
  overconfidence_rate DECIMAL(5,2) DEFAULT 0, -- % of times confident but wrong
  underconfidence_rate DECIMAL(5,2) DEFAULT 0, -- % of times not confident but right

  -- Time tracking
  total_practice_time_seconds INTEGER DEFAULT 0,
  average_response_time_seconds INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Category-specific stats per user
CREATE TABLE user_category_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES drill_categories(id) ON DELETE CASCADE,

  -- Category metrics
  drills_attempted INTEGER DEFAULT 0,
  drills_correct INTEGER DEFAULT 0,
  accuracy DECIMAL(5,2) DEFAULT 0,

  -- Proficiency level (1-5)
  proficiency_level INTEGER DEFAULT 1,

  -- Last practiced
  last_practiced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, category_id)
);

-- =====================================================
-- PERSONALIZED RECOMMENDATIONS
-- =====================================================

-- AI-generated recommendations based on performance
CREATE TABLE drill_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  recommendation_type TEXT NOT NULL, -- focus_area, streak_maintenance, confidence_calibration
  priority INTEGER DEFAULT 1, -- 1-5, higher = more important

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- What to practice
  suggested_category_id UUID REFERENCES drill_categories(id),
  suggested_drill_ids JSONB, -- Array of specific drill IDs

  -- Reasoning
  reasoning TEXT,
  based_on_metrics JSONB, -- Which metrics triggered this recommendation

  -- Status
  is_active BOOLEAN DEFAULT true,
  dismissed_at TIMESTAMPTZ,
  acted_on_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Drill lookups
CREATE INDEX idx_drills_subcategory ON drills(subcategory_id);
CREATE INDEX idx_drills_module ON drills(related_module_id);
CREATE INDEX idx_drills_active ON drills(is_active);

-- Attempts lookups
CREATE INDEX idx_attempts_user ON drill_attempts(user_id);
CREATE INDEX idx_attempts_drill ON drill_attempts(drill_id);
CREATE INDEX idx_attempts_session ON drill_attempts(session_id);
CREATE INDEX idx_attempts_date ON drill_attempts(attempted_at);

-- Sessions lookups
CREATE INDEX idx_sessions_user ON drill_sessions(user_id);
CREATE INDEX idx_sessions_category ON drill_sessions(category_id);

-- Stats lookups
CREATE INDEX idx_category_stats_user ON user_category_stats(user_id);

-- Recommendations
CREATE INDEX idx_recommendations_user ON drill_recommendations(user_id);
CREATE INDEX idx_recommendations_active ON drill_recommendations(is_active, priority);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE drill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_drill_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_category_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_recommendations ENABLE ROW LEVEL SECURITY;

-- Public read for categories and subcategories
CREATE POLICY "Anyone can view drill categories"
  ON drill_categories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can view drill subcategories"
  ON drill_subcategories FOR SELECT
  USING (is_active = true);

-- Users can view active drills (but only if they've unlocked them via modules)
CREATE POLICY "Users can view active drills"
  ON drills FOR SELECT
  USING (is_active = true);

-- Users can only access their own attempts
CREATE POLICY "Users can view own drill attempts"
  ON drill_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drill attempts"
  ON drill_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only access their own sessions
CREATE POLICY "Users can view own drill sessions"
  ON drill_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own drill sessions"
  ON drill_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Users can only access their own stats
CREATE POLICY "Users can view own drill stats"
  ON user_drill_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own category stats"
  ON user_category_stats FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only access their own recommendations
CREATE POLICY "Users can view own recommendations"
  ON drill_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON drill_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: 6 Core Categories
-- =====================================================

INSERT INTO drill_categories (category_code, title, description, display_order) VALUES
('ethical_judgment', 'Ethical Judgment', 'Navigate ethical dilemmas and boundary decisions', 1),
('role_management', 'Role Management', 'Practice staying in role and managing boundaries', 2),
('situational_judgment', 'Situational Judgment', 'Make quick decisions in complex scenarios', 3),
('intervention_decisions', 'Intervention Decisions', 'Know when to intervene and when to stay silent', 4),
('self_regulation', 'Self-Regulation', 'Manage stress and maintain professional composure', 5),
('terminology', 'Terminology', 'Quick terminology decisions and equivalents', 6);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update user stats after each attempt
CREATE OR REPLACE FUNCTION update_user_drill_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert user_drill_stats
  INSERT INTO user_drill_stats (
    user_id,
    total_drills_attempted,
    total_drills_correct,
    overall_accuracy,
    last_practice_date
  )
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    CASE WHEN NEW.is_correct THEN 100.0 ELSE 0.0 END,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_drills_attempted = user_drill_stats.total_drills_attempted + 1,
    total_drills_correct = user_drill_stats.total_drills_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    overall_accuracy = ROUND(
      ((user_drill_stats.total_drills_correct + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END)::DECIMAL /
       (user_drill_stats.total_drills_attempted + 1)::DECIMAL * 100),
      2
    ),
    last_practice_date = CURRENT_DATE,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_drill_stats
AFTER INSERT ON drill_attempts
FOR EACH ROW
EXECUTE FUNCTION update_user_drill_stats();

-- Function to calculate and update readiness score
CREATE OR REPLACE FUNCTION calculate_readiness_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_accuracy DECIMAL;
  v_total_drills INTEGER;
  v_categories_practiced INTEGER;
  v_streak INTEGER;
  v_score INTEGER;
BEGIN
  -- Get user stats
  SELECT
    overall_accuracy,
    total_drills_attempted,
    current_streak_days
  INTO v_accuracy, v_total_drills, v_streak
  FROM user_drill_stats
  WHERE user_id = p_user_id;

  -- Count categories with at least 5 drills completed
  SELECT COUNT(DISTINCT category_id)
  INTO v_categories_practiced
  FROM user_category_stats
  WHERE user_id = p_user_id AND drills_attempted >= 5;

  -- Calculate readiness score (0-100)
  -- 40% accuracy, 30% volume, 20% breadth, 10% consistency
  v_score := GREATEST(0, LEAST(100,
    ROUND(
      (COALESCE(v_accuracy, 0) * 0.4) +
      (LEAST(100, COALESCE(v_total_drills, 0) * 2) * 0.3) +
      (LEAST(100, COALESCE(v_categories_practiced, 0) * 16.67) * 0.2) +
      (LEAST(100, COALESCE(v_streak, 0) * 10) * 0.1)
    )
  ));

  -- Update the readiness score
  UPDATE user_drill_stats
  SET readiness_score = v_score,
      updated_at = now()
  WHERE user_id = p_user_id;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql;
