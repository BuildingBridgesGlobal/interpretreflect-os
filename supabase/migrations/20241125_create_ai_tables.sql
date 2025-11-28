-- AI Sessions Table
CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    context_snapshot JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_ai_sessions_last_activity ON ai_sessions(last_activity DESC);

-- AI Interactions Table
CREATE TABLE ai_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_sessions(id) ON DELETE CASCADE,
    input_type VARCHAR(20) CHECK (input_type IN ('text', 'voice', 'proactive')),
    user_input TEXT,
    ai_response JSONB,
    actions_generated JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_interactions_session_id ON ai_interactions(session_id);
CREATE INDEX idx_ai_interactions_created_at ON ai_interactions(created_at DESC);

-- AI Contexts Table
CREATE TABLE ai_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES ai_interactions(id) ON DELETE CASCADE,
    current_assignments JSONB,
    wellbeing_data JSONB,
    skills_data JSONB,
    user_patterns JSONB
);

CREATE INDEX idx_ai_contexts_interaction_id ON ai_contexts(interaction_id);

-- Skills Catalog Table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    level_descriptors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_name ON skills(name);

-- Skill Assessments Table
CREATE TABLE skill_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    source VARCHAR(20) CHECK (source IN ('self', 'coach', 'system')),
    level INTEGER CHECK (level >= 1 AND level <= 5),
    confidence INTEGER CHECK (confidence >= 1 AND confidence <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_skill_assessments_user_id ON skill_assessments(user_id);
CREATE INDEX idx_skill_assessments_skill_id ON skill_assessments(skill_id);
CREATE INDEX idx_skill_assessments_created_at ON skill_assessments(created_at DESC);

-- Skill Goals Table
CREATE TABLE skill_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    target_level INTEGER CHECK (target_level >= 1 AND target_level <= 5),
    deadline TIMESTAMP WITH TIME ZONE,
    priority INTEGER CHECK (priority >= 1 AND priority <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_skill_goals_user_id ON skill_goals(user_id);
CREATE INDEX idx_skill_goals_skill_id ON skill_goals(skill_id);
CREATE INDEX idx_skill_goals_priority ON skill_goals(priority DESC);

-- Practice Sessions Table
CREATE TABLE practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    session_type VARCHAR(20) CHECK (session_type IN ('drill', 'simulation', 'prep', 'review')),
    duration_minutes INTEGER NOT NULL,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_practice_sessions_user_id ON practice_sessions(user_id);
CREATE INDEX idx_practice_sessions_skill_id ON practice_sessions(skill_id);
CREATE INDEX idx_practice_sessions_created_at ON practice_sessions(created_at DESC);

-- Agent Events Table
CREATE TABLE agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent VARCHAR(100) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agent_events_user_id ON agent_events(user_id);
CREATE INDEX idx_agent_events_agent ON agent_events(agent);
CREATE INDEX idx_agent_events_event_type ON agent_events(event_type);
CREATE INDEX idx_agent_events_created_at ON agent_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user-owned tables
CREATE POLICY "Users can view own sessions" ON ai_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON ai_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON ai_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON ai_interactions
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM ai_sessions WHERE id = session_id));

CREATE POLICY "Users can create interactions in own sessions" ON ai_interactions
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM ai_sessions WHERE id = session_id));

CREATE POLICY "Users can view own contexts" ON ai_contexts
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM ai_sessions WHERE id = (SELECT session_id FROM ai_interactions WHERE id = interaction_id)));

CREATE POLICY "Users can create contexts for own interactions" ON ai_contexts
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM ai_sessions WHERE id = (SELECT session_id FROM ai_interactions WHERE id = interaction_id)));

-- Skills catalog policies
CREATE POLICY "Authenticated users can view skills catalog" ON skills
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- User-owned data policies
CREATE POLICY "Users own their skill assessments" ON skill_assessments
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their skill goals" ON skill_goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their practice sessions" ON practice_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their agent events" ON agent_events
    FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON skills TO authenticated;
GRANT ALL ON ai_sessions TO authenticated;
GRANT ALL ON ai_interactions TO authenticated;
GRANT ALL ON ai_contexts TO authenticated;
GRANT ALL ON skill_assessments TO authenticated;
GRANT ALL ON skill_goals TO authenticated;
GRANT ALL ON practice_sessions TO authenticated;
GRANT ALL ON agent_events TO authenticated;

-- Seed some basic skills
INSERT INTO skills (name, category, description, level_descriptors) VALUES
('Communication', 'Soft Skills', 'Effective verbal and written communication abilities', '{"1": "Basic communication", "2": "Clear expression", "3": "Active listening", "4": "Persuasive communication", "5": "Master communicator"}'),
('Problem Solving', 'Cognitive', 'Ability to analyze and solve complex problems', '{"1": "Simple problem solving", "2": "Structured approach", "3": "Creative solutions", "4": "Complex problem solving", "5": "Innovation driver"}'),
('Leadership', 'Management', 'Ability to lead and inspire teams', '{"1": "Basic leadership", "2": "Team coordination", "3": "Motivational leadership", "4": "Strategic leadership", "5": "Transformational leader"}'),
('Technical Writing', 'Technical', 'Ability to write clear technical documentation', '{"1": "Basic documentation", "2": "Clear instructions", "3": "Comprehensive guides", "4": "Complex technical docs", "5": "Technical author"}'),
('Data Analysis', 'Analytical', 'Ability to analyze and interpret data', '{"1": "Basic analysis", "2": "Trend identification", "3": "Statistical analysis", "4": "Advanced analytics", "5": "Data scientist"}');