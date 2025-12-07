-- ============================================================================
-- MODULE REPOSITORY SYSTEM
-- Scalable architecture for 300+ workshops with RID 2025 PS Category compliance
-- ============================================================================

-- ============================================================================
-- 1. ENUMS FOR RID 2025 COMPLIANCE
-- ============================================================================

-- Module status enum
DO $$ BEGIN
    CREATE TYPE module_status AS ENUM (
        'draft',
        'review',
        'approved',
        'published',
        'archived',
        'deprecated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Module format enum
DO $$ BEGIN
    CREATE TYPE module_format AS ENUM (
        'in_person',
        'virtual_live',
        'self_paced',
        'hybrid',
        'blended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Content knowledge level (per RID requirements)
DO $$ BEGIN
    CREATE TYPE content_knowledge_level AS ENUM (
        'little_none',      -- Little or no prior knowledge
        'some',             -- Some familiarity
        'extensive',        -- Extensive experience
        'teaching'          -- For educators/mentors
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- RID 2025 Professional Studies Categories
DO $$ BEGIN
    CREATE TYPE ps_category AS ENUM (
        'language_cultural_development',
        'settings_based_studies',
        'cognitive_processes',
        'professional_interpersonal',
        'ethical_considerations',
        'supporting_knowledge_skills',
        'healthy_minds_bodies',
        'power_privilege_oppression'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Specialist certificate areas
DO $$ BEGIN
    CREATE TYPE specialist_area AS ENUM (
        'none',
        'legal',
        'performing_arts',
        'medical',
        'educational'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. MODULE COLLECTIONS (Top-level thematic groupings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),

    -- Visual
    cover_image_url TEXT,
    icon VARCHAR(100),
    color_theme VARCHAR(50),

    -- Categorization
    primary_ps_category ps_category,
    specialist_area specialist_area DEFAULT 'none',
    is_ppo_focused BOOLEAN DEFAULT false,

    -- Metadata
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 3. LEARNING PATHS (Sequential curricula within collections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES module_collections(id) ON DELETE SET NULL,

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),

    -- Visual
    cover_image_url TEXT,
    thumbnail_url TEXT,

    -- Learning Outcomes
    learning_objectives JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    target_audience TEXT,

    -- CEU Info
    total_ceu_value DECIMAL(4,2) DEFAULT 0,
    primary_content_area VARCHAR(10) DEFAULT 'PS', -- PS or GS
    ps_categories ps_category[] DEFAULT '{}',
    is_ppo_track BOOLEAN DEFAULT false,
    specialist_area specialist_area DEFAULT 'none',

    -- Duration
    estimated_hours DECIMAL(5,2),
    recommended_pace VARCHAR(100), -- e.g., "2 modules per week"

    -- Status & Visibility
    status module_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_certification_track BOOLEAN DEFAULT false,

    -- Completion Requirements
    completion_requirements JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 4. CEU MODULES (Individual workshops/courses - the 300+ repository)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Basic Info
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),

    -- Detailed Content
    learning_objectives JSONB DEFAULT '[]',
    topics_covered JSONB DEFAULT '[]',
    prerequisites JSONB DEFAULT '[]',
    target_audience TEXT,

    -- Visual
    cover_image_url TEXT,
    thumbnail_url TEXT,
    preview_video_url TEXT,

    -- CEU Classification (RID 2025 Compliant)
    ceu_value DECIMAL(4,2) NOT NULL,
    content_area VARCHAR(10) NOT NULL DEFAULT 'PS', -- PS or GS
    ps_category ps_category,
    is_ppo_designated BOOLEAN DEFAULT false,
    specialist_area specialist_area DEFAULT 'none',
    content_knowledge_level content_knowledge_level DEFAULT 'some',

    -- CEU Calculation Metadata
    contact_hours DECIMAL(5,2),
    instructional_ratio VARCHAR(20) DEFAULT '1:1', -- For non-traditional: '2:1', '3:1'
    ceu_calculation_notes TEXT,

    -- Format & Delivery
    format module_format DEFAULT 'self_paced',
    duration_minutes INTEGER,
    has_live_component BOOLEAN DEFAULT false,
    max_participants INTEGER,

    -- Presenter Info
    presenter_ids UUID[] DEFAULT '{}',
    presenter_info JSONB DEFAULT '[]',

    -- Assessment
    has_assessment BOOLEAN DEFAULT false,
    passing_score INTEGER, -- Percentage
    assessment_type VARCHAR(50), -- 'quiz', 'practical', 'reflection', 'portfolio'
    assessment_questions JSONB DEFAULT '[]',

    -- Resources
    materials JSONB DEFAULT '[]',

    -- Scheduling (for live modules)
    available_dates JSONB DEFAULT '[]',
    registration_deadline_days INTEGER,

    -- Status & Visibility
    status module_status DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT false,
    is_free BOOLEAN DEFAULT false,

    -- Versioning
    version VARCHAR(20) DEFAULT '1.0',
    previous_version_id UUID REFERENCES ceu_modules(id),

    -- Analytics
    completion_count INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2),
    total_ratings INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    last_updated_content_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- Full-text search vector
ALTER TABLE ceu_modules ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(short_description, '')), 'C')
    ) STORED;

-- ============================================================================
-- 5. MODULE SESSIONS (For multi-part modules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,

    -- Session Info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    session_number INTEGER NOT NULL,

    -- Duration
    duration_minutes INTEGER,

    -- Content
    content_outline JSONB DEFAULT '[]',
    resources JSONB DEFAULT '[]',

    -- For live sessions
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    meeting_url TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(module_id, session_number)
);

-- ============================================================================
-- 6. LEARNING PATH MODULES (Junction table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS learning_path_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,

    -- Sequencing
    sequence_number INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    is_milestone BOOLEAN DEFAULT false, -- Key checkpoint in path

    -- Unlock conditions
    unlock_after_module_id UUID REFERENCES ceu_modules(id),
    unlock_after_days INTEGER, -- Days after previous module

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(learning_path_id, module_id),
    UNIQUE(learning_path_id, sequence_number)
);

-- ============================================================================
-- 7. MODULE TAGS (For flexible categorization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(50),
    tag_type VARCHAR(50) DEFAULT 'general', -- 'general', 'skill', 'topic', 'setting'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS module_tag_assignments (
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES module_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (module_id, tag_id)
);

-- Seed common tags
INSERT INTO module_tags (name, slug, tag_type) VALUES
    ('Legal', 'legal', 'setting'),
    ('Medical', 'medical', 'setting'),
    ('Educational', 'educational', 'setting'),
    ('Mental Health', 'mental-health', 'setting'),
    ('DeafBlind', 'deafblind', 'topic'),
    ('ASL Linguistics', 'asl-linguistics', 'topic'),
    ('Business Practices', 'business-practices', 'topic'),
    ('Ethics', 'ethics', 'topic'),
    ('Mentoring', 'mentoring', 'skill'),
    ('Consecutive', 'consecutive', 'skill'),
    ('Simultaneous', 'simultaneous', 'skill'),
    ('Sight Translation', 'sight-translation', 'skill'),
    ('Vicarious Trauma', 'vicarious-trauma', 'topic'),
    ('Self-Care', 'self-care', 'topic'),
    ('Team Interpreting', 'team-interpreting', 'skill'),
    ('Remote Interpreting', 'remote-interpreting', 'setting')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 8. AGENCY MODULE CUSTOMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_module_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,

    -- Visibility
    is_enabled BOOLEAN DEFAULT true,
    is_required BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,

    -- Custom pricing (if applicable)
    custom_price DECIMAL(10,2),

    -- Custom content additions
    agency_notes TEXT, -- Internal notes for interpreters
    supplementary_materials JSONB DEFAULT '[]',

    -- Assignment settings
    auto_assign_new_interpreters BOOLEAN DEFAULT false,
    due_within_days INTEGER, -- Days to complete after assignment

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, module_id)
);

-- ============================================================================
-- 9. AGENCY LEARNING PATH CUSTOMIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS agency_learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Can be based on existing path or custom
    base_learning_path_id UUID REFERENCES learning_paths(id),

    -- Custom path info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_onboarding_path BOOLEAN DEFAULT false,

    -- Requirements
    is_mandatory BOOLEAN DEFAULT false,
    completion_deadline_days INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS agency_learning_path_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_learning_path_id UUID REFERENCES agency_learning_paths(id) ON DELETE CASCADE,
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,

    sequence_number INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,

    UNIQUE(agency_learning_path_id, module_id),
    UNIQUE(agency_learning_path_id, sequence_number)
);

-- ============================================================================
-- 10. MODULE RATINGS & REVIEWS
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,

    -- Specific feedback
    content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
    presenter_effectiveness INTEGER CHECK (presenter_effectiveness >= 1 AND presenter_effectiveness <= 5),
    practical_applicability INTEGER CHECK (practical_applicability >= 1 AND practical_applicability <= 5),

    -- Metadata
    is_verified_completion BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(module_id, user_id)
);

-- ============================================================================
-- 11. INTERPRETER MODULE PROGRESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interpreter_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interpreter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Progress
    status VARCHAR(50) DEFAULT 'not_started',
    -- 'not_started', 'in_progress', 'completed', 'failed', 'expired'
    progress_percentage INTEGER DEFAULT 0,
    current_session_number INTEGER DEFAULT 1,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,

    -- Assessment
    assessment_score INTEGER,
    assessment_attempts INTEGER DEFAULT 0,
    assessment_passed BOOLEAN,

    -- CEU Record Link
    ceu_certificate_id UUID REFERENCES ceu_certificates(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(interpreter_id, module_id, organization_id)
);

-- ============================================================================
-- 12. LEARNING PATH PROGRESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS interpreter_learning_path_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interpreter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),

    -- Progress
    status VARCHAR(50) DEFAULT 'not_started',
    modules_completed INTEGER DEFAULT 0,
    total_modules INTEGER,
    progress_percentage INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_completion_date DATE,

    -- Certification (if applicable)
    certificate_issued BOOLEAN DEFAULT false,
    certificate_id UUID,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(interpreter_id, learning_path_id, organization_id)
);

-- ============================================================================
-- 13. MODULE RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,
    recommended_module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,

    -- Relationship type
    relationship_type VARCHAR(50) NOT NULL,
    -- 'prerequisite', 'follow_up', 'related', 'alternative'

    strength INTEGER DEFAULT 1, -- 1-10 how strong the recommendation is

    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(module_id, recommended_module_id)
);

-- ============================================================================
-- 14. INDEXES
-- ============================================================================

-- Module collections
CREATE INDEX IF NOT EXISTS idx_collections_slug ON module_collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_ps_category ON module_collections(primary_ps_category);
CREATE INDEX IF NOT EXISTS idx_collections_featured ON module_collections(is_featured) WHERE is_featured = true;

-- Learning paths
CREATE INDEX IF NOT EXISTS idx_learning_paths_slug ON learning_paths(slug);
CREATE INDEX IF NOT EXISTS idx_learning_paths_collection ON learning_paths(collection_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths(status);
CREATE INDEX IF NOT EXISTS idx_learning_paths_featured ON learning_paths(is_featured) WHERE is_featured = true;

-- CEU modules
CREATE INDEX IF NOT EXISTS idx_ceu_modules_status ON ceu_modules(status);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_ps_category ON ceu_modules(ps_category);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_content_area ON ceu_modules(content_area);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_specialist ON ceu_modules(specialist_area);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_ppo ON ceu_modules(is_ppo_designated) WHERE is_ppo_designated = true;
CREATE INDEX IF NOT EXISTS idx_ceu_modules_format ON ceu_modules(format);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_level ON ceu_modules(content_knowledge_level);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_search ON ceu_modules USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_ceu_modules_featured ON ceu_modules(is_featured) WHERE is_featured = true;

-- Module sessions
CREATE INDEX IF NOT EXISTS idx_module_sessions_module ON module_sessions(module_id);

-- Learning path modules
CREATE INDEX IF NOT EXISTS idx_lp_modules_path ON learning_path_modules(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_lp_modules_module ON learning_path_modules(module_id);

-- Module tags
CREATE INDEX IF NOT EXISTS idx_module_tags_type ON module_tags(tag_type);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_module ON module_tag_assignments(module_id);
CREATE INDEX IF NOT EXISTS idx_tag_assignments_tag ON module_tag_assignments(tag_id);

-- Agency settings
CREATE INDEX IF NOT EXISTS idx_agency_module_settings_org ON agency_module_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_agency_module_settings_module ON agency_module_settings(module_id);

-- Module ratings
CREATE INDEX IF NOT EXISTS idx_module_ratings_module ON module_ratings(module_id);
CREATE INDEX IF NOT EXISTS idx_module_ratings_user ON module_ratings(user_id);

-- Interpreter progress
CREATE INDEX IF NOT EXISTS idx_interpreter_progress_interpreter ON interpreter_module_progress(interpreter_id);
CREATE INDEX IF NOT EXISTS idx_interpreter_progress_module ON interpreter_module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_interpreter_progress_status ON interpreter_module_progress(status);
CREATE INDEX IF NOT EXISTS idx_interpreter_progress_org ON interpreter_module_progress(organization_id);

-- Learning path progress
CREATE INDEX IF NOT EXISTS idx_lp_progress_interpreter ON interpreter_learning_path_progress(interpreter_id);
CREATE INDEX IF NOT EXISTS idx_lp_progress_path ON interpreter_learning_path_progress(learning_path_id);

-- Module recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_module ON module_recommendations(module_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_recommended ON module_recommendations(recommended_module_id);

-- ============================================================================
-- 15. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE module_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_module_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_learning_path_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpreter_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE interpreter_learning_path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_recommendations ENABLE ROW LEVEL SECURITY;

-- Public read for catalog items
CREATE POLICY "Public collections are viewable by all" ON module_collections
    FOR SELECT TO authenticated
    USING (is_public = true);

CREATE POLICY "Published learning paths are viewable by all" ON learning_paths
    FOR SELECT TO authenticated
    USING (status = 'published');

CREATE POLICY "Published modules are viewable by all" ON ceu_modules
    FOR SELECT TO authenticated
    USING (status = 'published');

CREATE POLICY "Module sessions are viewable by all" ON module_sessions
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM ceu_modules WHERE id = module_id AND status = 'published'));

CREATE POLICY "Learning path modules are viewable by all" ON learning_path_modules
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Tags are viewable by all" ON module_tags
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Tag assignments are viewable by all" ON module_tag_assignments
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Recommendations are viewable by all" ON module_recommendations
    FOR SELECT TO authenticated
    USING (true);

-- Agency settings - members can view their org's settings
CREATE POLICY "Org members can view agency module settings" ON agency_module_settings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = agency_module_settings.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Org admins can manage agency module settings" ON agency_module_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = agency_module_settings.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Agency learning paths
CREATE POLICY "Org members can view agency learning paths" ON agency_learning_paths
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = agency_learning_paths.organization_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Org admins can manage agency learning paths" ON agency_learning_paths
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = agency_learning_paths.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Agency learning path modules viewable by org members" ON agency_learning_path_modules
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM agency_learning_paths alp
            JOIN organization_members om ON om.organization_id = alp.organization_id
            WHERE alp.id = agency_learning_path_modules.agency_learning_path_id
            AND om.user_id = auth.uid()
        )
    );

-- Module ratings
CREATE POLICY "Public ratings are viewable by all" ON module_ratings
    FOR SELECT TO authenticated
    USING (is_public = true);

CREATE POLICY "Users can manage their own ratings" ON module_ratings
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Interpreter progress - users can view/manage their own
CREATE POLICY "Users can view their own module progress" ON interpreter_module_progress
    FOR SELECT TO authenticated
    USING (interpreter_id = auth.uid());

CREATE POLICY "Users can insert their own module progress" ON interpreter_module_progress
    FOR INSERT TO authenticated
    WITH CHECK (interpreter_id = auth.uid());

CREATE POLICY "Users can update their own module progress" ON interpreter_module_progress
    FOR UPDATE TO authenticated
    USING (interpreter_id = auth.uid());

-- Org admins can view their interpreters' progress
CREATE POLICY "Org admins can view interpreter progress" ON interpreter_module_progress
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = interpreter_module_progress.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- Learning path progress
CREATE POLICY "Users can view their own learning path progress" ON interpreter_learning_path_progress
    FOR SELECT TO authenticated
    USING (interpreter_id = auth.uid());

CREATE POLICY "Users can manage their own learning path progress" ON interpreter_learning_path_progress
    FOR ALL TO authenticated
    USING (interpreter_id = auth.uid())
    WITH CHECK (interpreter_id = auth.uid());

CREATE POLICY "Org admins can view learning path progress" ON interpreter_learning_path_progress
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = interpreter_learning_path_progress.organization_id
            AND user_id = auth.uid()
            AND role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- 16. TRIGGERS
-- ============================================================================

-- Update module average rating trigger
CREATE OR REPLACE FUNCTION update_ceu_module_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ceu_modules
    SET
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM module_ratings
            WHERE module_id = COALESCE(NEW.module_id, OLD.module_id)
        ),
        total_ratings = (
            SELECT COUNT(*)
            FROM module_ratings
            WHERE module_id = COALESCE(NEW.module_id, OLD.module_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.module_id, OLD.module_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ceu_module_rating ON module_ratings;
CREATE TRIGGER trigger_update_ceu_module_rating
    AFTER INSERT OR UPDATE OR DELETE ON module_ratings
    FOR EACH ROW EXECUTE FUNCTION update_ceu_module_rating();

-- Update learning path total CEU value
CREATE OR REPLACE FUNCTION update_learning_path_ceu_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE learning_paths
    SET
        total_ceu_value = (
            SELECT COALESCE(SUM(m.ceu_value), 0)
            FROM learning_path_modules lpm
            JOIN ceu_modules m ON m.id = lpm.module_id
            WHERE lpm.learning_path_id = COALESCE(NEW.learning_path_id, OLD.learning_path_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.learning_path_id, OLD.learning_path_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lp_ceu_total ON learning_path_modules;
CREATE TRIGGER trigger_update_lp_ceu_total
    AFTER INSERT OR UPDATE OR DELETE ON learning_path_modules
    FOR EACH ROW EXECUTE FUNCTION update_learning_path_ceu_total();

-- Update module completion count
CREATE OR REPLACE FUNCTION update_module_completion_count()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
        UPDATE ceu_modules
        SET completion_count = completion_count + 1, updated_at = NOW()
        WHERE id = NEW.module_id;
    ELSIF OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE ceu_modules
        SET completion_count = GREATEST(completion_count - 1, 0), updated_at = NOW()
        WHERE id = NEW.module_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_completion_count ON interpreter_module_progress;
CREATE TRIGGER trigger_update_completion_count
    AFTER INSERT OR UPDATE ON interpreter_module_progress
    FOR EACH ROW EXECUTE FUNCTION update_module_completion_count();

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_module_repo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_module_collections_updated_at ON module_collections;
CREATE TRIGGER update_module_collections_updated_at
    BEFORE UPDATE ON module_collections
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_learning_paths_updated_at ON learning_paths;
CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_ceu_modules_updated_at ON ceu_modules;
CREATE TRIGGER update_ceu_modules_updated_at
    BEFORE UPDATE ON ceu_modules
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_module_sessions_updated_at ON module_sessions;
CREATE TRIGGER update_module_sessions_updated_at
    BEFORE UPDATE ON module_sessions
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_agency_module_settings_updated_at ON agency_module_settings;
CREATE TRIGGER update_agency_module_settings_updated_at
    BEFORE UPDATE ON agency_module_settings
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_agency_learning_paths_updated_at ON agency_learning_paths;
CREATE TRIGGER update_agency_learning_paths_updated_at
    BEFORE UPDATE ON agency_learning_paths
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_module_ratings_updated_at ON module_ratings;
CREATE TRIGGER update_module_ratings_updated_at
    BEFORE UPDATE ON module_ratings
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_interpreter_progress_updated_at ON interpreter_module_progress;
CREATE TRIGGER update_interpreter_progress_updated_at
    BEFORE UPDATE ON interpreter_module_progress
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

DROP TRIGGER IF EXISTS update_lp_progress_updated_at ON interpreter_learning_path_progress;
CREATE TRIGGER update_lp_progress_updated_at
    BEFORE UPDATE ON interpreter_learning_path_progress
    FOR EACH ROW EXECUTE FUNCTION update_module_repo_updated_at();

-- ============================================================================
-- 17. FUNCTIONS
-- ============================================================================

-- Get recommended modules for interpreter based on their CEU needs
CREATE OR REPLACE FUNCTION get_recommended_modules(p_interpreter_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    module_id UUID,
    title VARCHAR,
    ceu_value DECIMAL,
    ps_category ps_category,
    is_ppo_designated BOOLEAN,
    recommendation_reason TEXT,
    priority_score INTEGER
) AS $$
DECLARE
    v_ps_needed DECIMAL;
    v_ppo_needed DECIMAL;
    v_total_needed DECIMAL;
BEGIN
    -- Get interpreter's current needs from user_ceu_summary
    SELECT
        GREATEST(6.0 - COALESCE(professional_studies_earned, 0), 0),
        GREATEST(1.0 - COALESCE(ppo_earned, 0), 0),
        GREATEST(8.0 - COALESCE(total_earned, 0), 0)
    INTO v_ps_needed, v_ppo_needed, v_total_needed
    FROM user_ceu_summary
    WHERE user_id = p_interpreter_id
    ORDER BY cycle_start_date DESC
    LIMIT 1;

    -- Default values if no summary exists
    v_ps_needed := COALESCE(v_ps_needed, 6.0);
    v_ppo_needed := COALESCE(v_ppo_needed, 1.0);
    v_total_needed := COALESCE(v_total_needed, 8.0);

    RETURN QUERY
    SELECT
        m.id,
        m.title,
        m.ceu_value,
        m.ps_category,
        m.is_ppo_designated,
        CASE
            WHEN v_ppo_needed > 0 AND m.is_ppo_designated THEN 'Fulfills PPO requirement'
            WHEN v_ps_needed > 0 AND m.content_area = 'PS' THEN 'Fulfills PS requirement'
            ELSE 'Recommended for professional development'
        END::TEXT as recommendation_reason,
        CASE
            WHEN v_ppo_needed > 0 AND m.is_ppo_designated THEN 100
            WHEN v_ps_needed > 0 AND m.content_area = 'PS' THEN 80
            ELSE 50
        END + COALESCE(m.average_rating::INTEGER * 5, 0) as priority_score
    FROM ceu_modules m
    WHERE m.status = 'published'
        AND m.id NOT IN (
            SELECT imp.module_id FROM interpreter_module_progress imp
            WHERE imp.interpreter_id = p_interpreter_id AND imp.status = 'completed'
        )
    ORDER BY priority_score DESC, m.average_rating DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Search modules with filters
CREATE OR REPLACE FUNCTION search_modules(
    p_search_term TEXT DEFAULT NULL,
    p_ps_category ps_category DEFAULT NULL,
    p_content_area VARCHAR DEFAULT NULL,
    p_is_ppo BOOLEAN DEFAULT NULL,
    p_specialist_area specialist_area DEFAULT NULL,
    p_format module_format DEFAULT NULL,
    p_level content_knowledge_level DEFAULT NULL,
    p_max_ceu DECIMAL DEFAULT NULL,
    p_min_rating DECIMAL DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    module_id UUID,
    title VARCHAR,
    short_description VARCHAR,
    ceu_value DECIMAL,
    content_area VARCHAR,
    ps_category ps_category,
    is_ppo_designated BOOLEAN,
    format module_format,
    content_knowledge_level content_knowledge_level,
    average_rating DECIMAL,
    total_ratings INTEGER,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.title,
        m.short_description,
        m.ceu_value,
        m.content_area,
        m.ps_category,
        m.is_ppo_designated,
        m.format,
        m.content_knowledge_level,
        m.average_rating,
        m.total_ratings,
        CASE
            WHEN p_search_term IS NOT NULL THEN
                ts_rank(m.search_vector, plainto_tsquery('english', p_search_term))
            ELSE 1.0
        END as rank
    FROM ceu_modules m
    WHERE m.status = 'published'
        AND (p_search_term IS NULL OR m.search_vector @@ plainto_tsquery('english', p_search_term))
        AND (p_ps_category IS NULL OR m.ps_category = p_ps_category)
        AND (p_content_area IS NULL OR m.content_area = p_content_area)
        AND (p_is_ppo IS NULL OR m.is_ppo_designated = p_is_ppo)
        AND (p_specialist_area IS NULL OR m.specialist_area = p_specialist_area)
        AND (p_format IS NULL OR m.format = p_format)
        AND (p_level IS NULL OR m.content_knowledge_level = p_level)
        AND (p_max_ceu IS NULL OR m.ceu_value <= p_max_ceu)
        AND (p_min_rating IS NULL OR m.average_rating >= p_min_rating)
    ORDER BY rank DESC, m.average_rating DESC NULLS LAST, m.completion_count DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 18. VIEWS
-- ============================================================================

-- Module catalog view with full details
CREATE OR REPLACE VIEW v_module_catalog AS
SELECT
    m.*,
    c.name as collection_name,
    c.slug as collection_slug,
    lp.name as learning_path_name,
    lp.slug as learning_path_slug,
    lpm.sequence_number,
    COALESCE(
        (SELECT array_agg(DISTINCT t.name)
         FROM module_tag_assignments mta
         JOIN module_tags t ON t.id = mta.tag_id
         WHERE mta.module_id = m.id),
        '{}'
    ) as tags
FROM ceu_modules m
LEFT JOIN learning_path_modules lpm ON lpm.module_id = m.id
LEFT JOIN learning_paths lp ON lp.id = lpm.learning_path_id
LEFT JOIN module_collections c ON c.id = lp.collection_id
WHERE m.status = 'published';

-- Interpreter CEU needs view
CREATE OR REPLACE VIEW v_interpreter_ceu_needs AS
SELECT
    ucs.user_id as interpreter_id,
    ucs.cycle_start_date,
    ucs.cycle_end_date,
    ucs.professional_studies_earned as ps_earned,
    ucs.ppo_earned,
    ucs.general_studies_earned as gs_earned,
    ucs.total_earned,
    GREATEST(6.0 - ucs.professional_studies_earned, 0) as ps_needed,
    GREATEST(1.0 - ucs.ppo_earned, 0) as ppo_needed,
    GREATEST(8.0 - ucs.total_earned, 0) as total_needed,
    ucs.is_compliant
FROM user_ceu_summary ucs
WHERE ucs.cycle_end_date >= CURRENT_DATE;

COMMENT ON TABLE module_collections IS 'Top-level thematic groupings for workshop modules';
COMMENT ON TABLE learning_paths IS 'Sequential curricula within collections';
COMMENT ON TABLE ceu_modules IS 'Individual workshops/courses - the 300+ module repository';
COMMENT ON TABLE interpreter_module_progress IS 'Tracks interpreter progress through individual modules';
COMMENT ON TABLE interpreter_learning_path_progress IS 'Tracks interpreter progress through learning paths';
