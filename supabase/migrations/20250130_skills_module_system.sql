-- ============================================================================
-- SKILLS MODULE SYSTEM - Complete schema for micro-learning platform
-- ============================================================================

-- ============================================================================
-- 1. SKILL SERIES TABLE
-- Organizes modules into learning pathways aligned with ECCI domains
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    series_code VARCHAR(20) UNIQUE NOT NULL,  -- e.g., 'nsm' for Nervous System Management
    title VARCHAR(200) NOT NULL,
    description TEXT,
    ecci_domain VARCHAR(50) NOT NULL,  -- Self-Awareness, Self-Management, etc.
    total_modules INTEGER DEFAULT 0,
    estimated_total_minutes INTEGER,
    icon_emoji VARCHAR(10),

    -- Series ordering and visibility
    display_order INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,

    -- Attribution (for CATIE content)
    attribution_text TEXT,
    source_url VARCHAR(500),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. SKILL MODULES TABLE
-- Individual 5-10 minute micro-learning modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_code VARCHAR(20) UNIQUE NOT NULL,  -- e.g., 'nsm-1-1'
    series_id UUID REFERENCES skill_series(id) ON DELETE CASCADE,

    -- Module metadata
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    ecci_domain VARCHAR(50) NOT NULL,
    order_in_series INTEGER NOT NULL,

    -- Content sections (JSON for flexibility)
    content_concept JSONB NOT NULL,      -- Quick Concept section (2 min)
    content_practice JSONB NOT NULL,     -- Micro-Practice section (3 min)
    content_application JSONB NOT NULL,  -- Application Bridge section (1 min)

    -- Elya integration
    elya_prompt_set_id UUID,  -- Links to elya_prompt_sets table

    -- Module settings
    has_video BOOLEAN DEFAULT false,
    video_url VARCHAR(500),
    prerequisites JSONB DEFAULT '[]'::jsonb,  -- Array of module_codes
    is_active BOOLEAN DEFAULT true,

    -- Attribution
    attribution_text TEXT NOT NULL,
    source_content_url VARCHAR(500),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(series_id, order_in_series)
);

-- ============================================================================
-- 3. ELYA PROMPT SETS TABLE
-- Stores conversation sequences for module-specific Elya reflections
-- ============================================================================

CREATE TABLE IF NOT EXISTS elya_prompt_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_code VARCHAR(50) UNIQUE NOT NULL,  -- e.g., 'nsm-1-1-reflection'
    module_code VARCHAR(20),  -- Links to skill_modules

    -- Prompt sequence
    prompts JSONB NOT NULL,  -- Array of prompt objects with order, type, text, logic

    -- Metadata
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. USER MODULE PROGRESS TABLE
-- Tracks individual user progress through modules
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,

    -- Progress tracking
    status VARCHAR(20) DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER DEFAULT 0,

    -- Section completion
    concept_completed BOOLEAN DEFAULT false,
    practice_completed BOOLEAN DEFAULT false,
    reflection_completed BOOLEAN DEFAULT false,
    application_completed BOOLEAN DEFAULT false,

    -- User engagement
    reflection_text TEXT,  -- User's final reflection response
    practice_notes TEXT,   -- Notes from practice exercise

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, module_id)
);

-- ============================================================================
-- 5. USER SERIES PROGRESS TABLE
-- Tracks user progress through entire series
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_series_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    series_id UUID NOT NULL REFERENCES skill_series(id) ON DELETE CASCADE,

    -- Progress metrics
    modules_completed INTEGER DEFAULT 0,
    total_modules INTEGER NOT NULL,
    total_time_spent_seconds INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'not_started',  -- 'not_started', 'in_progress', 'completed'
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, series_id)
);

-- ============================================================================
-- 6. SKILL REFLECTIONS TABLE
-- Stores Elya conversation history for module reflections
-- ============================================================================

CREATE TABLE IF NOT EXISTS skill_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES skill_modules(id) ON DELETE CASCADE,
    user_module_progress_id UUID REFERENCES user_module_progress(id) ON DELETE CASCADE,

    -- Conversation data
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of {role, content, timestamp}

    -- Reflection metadata
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    total_messages INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 7. ECCI COMPETENCY SCORES TABLE
-- Tracks user development across ECCI domains over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS ecci_competency_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- ECCI Domain
    domain VARCHAR(50) NOT NULL,  -- Self-Awareness, Self-Management, etc.

    -- Score tracking (growth-oriented, not graded)
    engagement_level INTEGER DEFAULT 0,  -- 0-100 based on modules completed
    modules_completed INTEGER DEFAULT 0,
    total_time_invested_seconds INTEGER DEFAULT 0,

    -- Calculated metrics
    last_activity_at TIMESTAMP WITH TIME ZONE,
    trend VARCHAR(20),  -- 'building', 'steady', 'exploring'

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, domain)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Skill series indexes
CREATE INDEX idx_skill_series_domain ON skill_series(ecci_domain);
CREATE INDEX idx_skill_series_active ON skill_series(is_active, display_order);

-- Skill modules indexes
CREATE INDEX idx_skill_modules_series ON skill_modules(series_id);
CREATE INDEX idx_skill_modules_code ON skill_modules(module_code);
CREATE INDEX idx_skill_modules_domain ON skill_modules(ecci_domain);
CREATE INDEX idx_skill_modules_active ON skill_modules(is_active);

-- Elya prompt sets indexes
CREATE INDEX idx_elya_prompts_module ON elya_prompt_sets(module_code);

-- User module progress indexes
CREATE INDEX idx_user_module_progress_user ON user_module_progress(user_id);
CREATE INDEX idx_user_module_progress_module ON user_module_progress(module_id);
CREATE INDEX idx_user_module_progress_status ON user_module_progress(status);
CREATE INDEX idx_user_module_progress_completed ON user_module_progress(completed_at DESC);

-- User series progress indexes
CREATE INDEX idx_user_series_progress_user ON user_series_progress(user_id);
CREATE INDEX idx_user_series_progress_series ON user_series_progress(series_id);

-- Skill reflections indexes
CREATE INDEX idx_skill_reflections_user ON skill_reflections(user_id);
CREATE INDEX idx_skill_reflections_module ON skill_reflections(module_id);

-- ECCI competency scores indexes
CREATE INDEX idx_ecci_scores_user ON ecci_competency_scores(user_id);
CREATE INDEX idx_ecci_scores_domain ON ecci_competency_scores(domain);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE skill_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE elya_prompt_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_series_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecci_competency_scores ENABLE ROW LEVEL SECURITY;

-- Skill series: publicly readable, admin writable
DROP POLICY IF EXISTS "Skill series are viewable by all users" ON skill_series;
CREATE POLICY "Skill series are viewable by all users"
    ON skill_series FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Skill modules: publicly readable, admin writable
DROP POLICY IF EXISTS "Skill modules are viewable by all users" ON skill_modules;
CREATE POLICY "Skill modules are viewable by all users"
    ON skill_modules FOR SELECT
    TO authenticated
    USING (is_active = true);

-- Elya prompt sets: publicly readable
DROP POLICY IF EXISTS "Elya prompts are viewable by all users" ON elya_prompt_sets;
CREATE POLICY "Elya prompts are viewable by all users"
    ON elya_prompt_sets FOR SELECT
    TO authenticated
    USING (true);

-- User module progress: users can view/modify their own
DROP POLICY IF EXISTS "Users can view their own module progress" ON user_module_progress;
CREATE POLICY "Users can view their own module progress"
    ON user_module_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own module progress" ON user_module_progress;
CREATE POLICY "Users can insert their own module progress"
    ON user_module_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own module progress" ON user_module_progress;
CREATE POLICY "Users can update their own module progress"
    ON user_module_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- User series progress: users can view/modify their own
DROP POLICY IF EXISTS "Users can view their own series progress" ON user_series_progress;
CREATE POLICY "Users can view their own series progress"
    ON user_series_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own series progress" ON user_series_progress;
CREATE POLICY "Users can insert their own series progress"
    ON user_series_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own series progress" ON user_series_progress;
CREATE POLICY "Users can update their own series progress"
    ON user_series_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- Skill reflections: users can view/modify their own
DROP POLICY IF EXISTS "Users can view their own reflections" ON skill_reflections;
CREATE POLICY "Users can view their own reflections"
    ON skill_reflections FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reflections" ON skill_reflections;
CREATE POLICY "Users can insert their own reflections"
    ON skill_reflections FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reflections" ON skill_reflections;
CREATE POLICY "Users can update their own reflections"
    ON skill_reflections FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ECCI competency scores: users can view/modify their own
DROP POLICY IF EXISTS "Users can view their own ECCI scores" ON ecci_competency_scores;
CREATE POLICY "Users can view their own ECCI scores"
    ON ecci_competency_scores FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own ECCI scores" ON ecci_competency_scores;
CREATE POLICY "Users can insert their own ECCI scores"
    ON ecci_competency_scores FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ECCI scores" ON ecci_competency_scores;
CREATE POLICY "Users can update their own ECCI scores"
    ON ecci_competency_scores FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_skill_series_updated_at ON skill_series;
CREATE TRIGGER update_skill_series_updated_at
    BEFORE UPDATE ON skill_series
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_skill_modules_updated_at ON skill_modules;
CREATE TRIGGER update_skill_modules_updated_at
    BEFORE UPDATE ON skill_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_module_progress_updated_at ON user_module_progress;
CREATE TRIGGER update_user_module_progress_updated_at
    BEFORE UPDATE ON user_module_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_series_progress_updated_at ON user_series_progress;
CREATE TRIGGER update_user_series_progress_updated_at
    BEFORE UPDATE ON user_series_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ecci_competency_scores_updated_at ON ecci_competency_scores;
CREATE TRIGGER update_ecci_competency_scores_updated_at
    BEFORE UPDATE ON ecci_competency_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
