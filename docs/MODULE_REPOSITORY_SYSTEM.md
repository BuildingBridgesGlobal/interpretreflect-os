# Module Repository System for 300+ Workshops

## Overview

This document outlines the architecture for a scalable module repository system designed to manage 300+ interpreter workshops while maintaining RID compliance, enabling efficient content organization, and supporting agency-specific customization.

---

## System Goals

1. **Scalability**: Support 300+ workshops with room for growth
2. **Compliance**: Full RID 2025 PS Category alignment
3. **Discoverability**: Easy search, filter, and recommendation
4. **Reusability**: Module templates and content sharing
5. **Tracking**: Progress tracking per interpreter and agency
6. **Quality**: Rating, review, and effectiveness metrics
7. **Flexibility**: Agency customization of content

---

## Information Architecture

### Module Hierarchy

```
Repository
├── Collections (thematic groupings)
│   ├── Learning Paths (sequential curricula)
│   │   └── Modules (individual workshops)
│   │       ├── Sessions (if multi-part)
│   │       └── Resources (materials, videos, etc.)
```

### Example Structure

```
Collections:
├── Legal Interpreting Mastery
│   ├── Learning Path: Courtroom Fundamentals
│   │   ├── Module: Introduction to Legal Settings
│   │   ├── Module: Courtroom Protocol
│   │   ├── Module: Legal Terminology I
│   │   └── Module: Legal Terminology II
│   └── Learning Path: Advanced Legal Practice
│       ├── Module: Deposition Interpreting
│       └── Module: Expert Witness Scenarios
├── Medical Interpreting Excellence
│   └── Learning Path: Healthcare Foundations
│       ├── Module: Medical Terminology Basics
│       └── Module: Patient-Provider Communication
├── Power, Privilege & Oppression
│   └── Learning Path: PPO Certification Track
│       ├── Module: Understanding Systems of Oppression
│       └── Module: Trauma-Informed Interpreting
└── ... (300+ modules organized)
```

---

## Database Schema

```sql
-- ============================================
-- MODULE REPOSITORY SYSTEM SCHEMA
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE module_status AS ENUM (
  'draft',
  'review',
  'approved',
  'published',
  'archived',
  'deprecated'
);

CREATE TYPE module_format AS ENUM (
  'in_person',
  'virtual_live',
  'self_paced',
  'hybrid',
  'blended'
);

CREATE TYPE content_knowledge_level AS ENUM (
  'little_none',      -- Little or no prior knowledge
  'some',             -- Some familiarity
  'extensive',        -- Extensive experience
  'teaching'          -- For educators/mentors
);

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

CREATE TYPE specialist_area AS ENUM (
  'none',
  'legal',
  'performing_arts',
  'medical',           -- Future specialist area
  'educational'        -- Future specialist area
);

-- ============================================
-- COLLECTIONS (Top-level groupings)
-- ============================================
CREATE TABLE module_collections (
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
  created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- LEARNING PATHS (Sequential curricula)
-- ============================================
CREATE TABLE learning_paths (
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
  /*
  {
    "min_modules_completed": 5,
    "min_score": 80,
    "requires_final_assessment": true
  }
  */

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- MODULES (Individual workshops/courses)
-- ============================================
CREATE TABLE ceu_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),

  -- Detailed Content
  learning_objectives JSONB DEFAULT '[]',
  /*
  [
    "Identify key courtroom participants and their roles",
    "Apply appropriate register when interpreting judicial proceedings",
    "Demonstrate consecutive interpreting in legal contexts"
  ]
  */
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
  /*
  [
    {
      "name": "Dr. Jane Smith",
      "credentials": "PhD, NIC, SC:L",
      "bio": "20 years experience in legal interpreting...",
      "photo_url": "..."
    }
  ]
  */

  -- Assessment
  has_assessment BOOLEAN DEFAULT false,
  passing_score INTEGER, -- Percentage
  assessment_type VARCHAR(50), -- 'quiz', 'practical', 'reflection', 'portfolio'

  -- Resources
  materials JSONB DEFAULT '[]',
  /*
  [
    {"type": "pdf", "title": "Handout", "url": "..."},
    {"type": "video", "title": "Demo", "url": "..."}
  ]
  */

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
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for search and filtering
CREATE INDEX idx_modules_status ON ceu_modules(status);
CREATE INDEX idx_modules_ps_category ON ceu_modules(ps_category);
CREATE INDEX idx_modules_content_area ON ceu_modules(content_area);
CREATE INDEX idx_modules_specialist ON ceu_modules(specialist_area);
CREATE INDEX idx_modules_ppo ON ceu_modules(is_ppo_designated);
CREATE INDEX idx_modules_format ON ceu_modules(format);
CREATE INDEX idx_modules_level ON ceu_modules(content_knowledge_level);

-- Full-text search
ALTER TABLE ceu_modules ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(short_description, '')), 'C')
  ) STORED;

CREATE INDEX idx_modules_search ON ceu_modules USING gin(search_vector);

-- ============================================
-- MODULE SESSIONS (For multi-part modules)
-- ============================================
CREATE TABLE module_sessions (
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

-- ============================================
-- LEARNING PATH MODULES (Junction table)
-- ============================================
CREATE TABLE learning_path_modules (
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

-- ============================================
-- MODULE TAGS (For flexible categorization)
-- ============================================
CREATE TABLE module_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(50),
  tag_type VARCHAR(50) DEFAULT 'general', -- 'general', 'skill', 'topic', 'setting'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE module_tag_assignments (
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
  ('Sight Translation', 'sight-translation', 'skill');

-- ============================================
-- AGENCY MODULE CUSTOMIZATION
-- ============================================
CREATE TABLE agency_module_settings (
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

-- ============================================
-- AGENCY LEARNING PATH CUSTOMIZATION
-- ============================================
CREATE TABLE agency_learning_paths (
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
  created_by UUID REFERENCES profiles(id)
);

CREATE TABLE agency_learning_path_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_learning_path_id UUID REFERENCES agency_learning_paths(id) ON DELETE CASCADE,
  module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,

  sequence_number INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,

  UNIQUE(agency_learning_path_id, module_id),
  UNIQUE(agency_learning_path_id, sequence_number)
);

-- ============================================
-- MODULE RATINGS & REVIEWS
-- ============================================
CREATE TABLE module_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES ceu_modules(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  -- Rating
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  -- Specific feedback
  content_quality INTEGER CHECK (content_quality >= 1 AND content_quality <= 5),
  presenter_effectiveness INTEGER CHECK (presenter_effectiveness >= 1 AND presenter_quality <= 5),
  practical_applicability INTEGER CHECK (practical_applicability >= 1 AND practical_applicability <= 5),

  -- Metadata
  is_verified_completion BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(module_id, user_id)
);

-- Trigger to update module average rating
CREATE OR REPLACE FUNCTION update_module_rating()
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
    )
  WHERE id = COALESCE(NEW.module_id, OLD.module_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_module_rating
  AFTER INSERT OR UPDATE OR DELETE ON module_ratings
  FOR EACH ROW EXECUTE FUNCTION update_module_rating();

-- ============================================
-- INTERPRETER MODULE PROGRESS
-- ============================================
CREATE TABLE interpreter_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
  ceu_record_id UUID REFERENCES interpreter_ceu_records(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(interpreter_id, module_id, organization_id)
);

CREATE INDEX idx_progress_interpreter ON interpreter_module_progress(interpreter_id);
CREATE INDEX idx_progress_module ON interpreter_module_progress(module_id);
CREATE INDEX idx_progress_status ON interpreter_module_progress(status);

-- ============================================
-- LEARNING PATH PROGRESS
-- ============================================
CREATE TABLE interpreter_learning_path_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interpreter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- ============================================
-- MODULE RECOMMENDATIONS
-- ============================================
CREATE TABLE module_recommendations (
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

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Module catalog view with full details
CREATE VIEW v_module_catalog AS
SELECT
  m.*,
  c.name as collection_name,
  lp.name as learning_path_name,
  lpm.sequence_number,
  COALESCE(array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
FROM ceu_modules m
LEFT JOIN learning_path_modules lpm ON lpm.module_id = m.id
LEFT JOIN learning_paths lp ON lp.id = lpm.learning_path_id
LEFT JOIN module_collections c ON c.id = lp.collection_id
LEFT JOIN module_tag_assignments mta ON mta.module_id = m.id
LEFT JOIN module_tags t ON t.id = mta.tag_id
WHERE m.status = 'published'
GROUP BY m.id, c.name, lp.name, lpm.sequence_number;

-- Interpreter CEU needs view
CREATE VIEW v_interpreter_ceu_needs AS
SELECT
  p.id as interpreter_id,
  p.full_name,
  cc.cycle_start_date,
  cc.cycle_end_date,
  COALESCE(SUM(CASE WHEN cr.content_area = 'PS' THEN cr.ceu_value ELSE 0 END), 0) as ps_earned,
  COALESCE(SUM(CASE WHEN cr.is_ppo THEN cr.ceu_value ELSE 0 END), 0) as ppo_earned,
  COALESCE(SUM(CASE WHEN cr.content_area = 'GS' THEN cr.ceu_value ELSE 0 END), 0) as gs_earned,
  COALESCE(SUM(cr.ceu_value), 0) as total_earned,
  6.0 - COALESCE(SUM(CASE WHEN cr.content_area = 'PS' THEN cr.ceu_value ELSE 0 END), 0) as ps_needed,
  1.0 - COALESCE(SUM(CASE WHEN cr.is_ppo THEN cr.ceu_value ELSE 0 END), 0) as ppo_needed,
  8.0 - COALESCE(SUM(cr.ceu_value), 0) as total_needed
FROM profiles p
LEFT JOIN interpreter_ceu_cycles cc ON cc.interpreter_id = p.id AND cc.is_current = true
LEFT JOIN interpreter_ceu_records cr ON cr.interpreter_id = p.id
  AND cr.completion_date BETWEEN cc.cycle_start_date AND cc.cycle_end_date
WHERE p.role = 'interpreter'
GROUP BY p.id, p.full_name, cc.cycle_start_date, cc.cycle_end_date;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get recommended modules for interpreter based on their needs
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
  -- Get interpreter's current needs
  SELECT
    GREATEST(6.0 - COALESCE(SUM(CASE WHEN content_area = 'PS' THEN ceu_value ELSE 0 END), 0), 0),
    GREATEST(1.0 - COALESCE(SUM(CASE WHEN is_ppo THEN ceu_value ELSE 0 END), 0), 0),
    GREATEST(8.0 - COALESCE(SUM(ceu_value), 0), 0)
  INTO v_ps_needed, v_ppo_needed, v_total_needed
  FROM interpreter_ceu_records
  WHERE interpreter_id = p_interpreter_id;

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
      SELECT module_id FROM interpreter_module_progress
      WHERE interpreter_id = p_interpreter_id AND status = 'completed'
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
```

---

## Module Content Structure

### Self-Paced Module JSON Schema

```typescript
interface ModuleContent {
  version: string;
  moduleId: string;

  // Sections (in order)
  sections: Section[];

  // Final assessment
  assessment?: Assessment;
}

interface Section {
  id: string;
  title: string;
  type: 'video' | 'text' | 'interactive' | 'quiz' | 'discussion' | 'activity';
  duration_minutes: number;

  // Content based on type
  content: VideoContent | TextContent | QuizContent | ActivityContent;

  // Navigation
  is_required: boolean;
  unlock_condition?: {
    type: 'section_complete' | 'quiz_passed' | 'time_elapsed';
    value: string | number;
  };
}

interface VideoContent {
  url: string;
  provider: 'vimeo' | 'youtube' | 'hosted';
  transcript_url?: string;
  captions_url?: string;
  asl_version_url?: string; // Accessibility
  chapters?: { title: string; timestamp: number }[];
}

interface TextContent {
  body: string; // Markdown/HTML
  attachments?: { title: string; url: string; type: string }[];
}

interface QuizContent {
  questions: Question[];
  passing_score: number;
  max_attempts: number;
  show_correct_answers: boolean;
  randomize_questions: boolean;
}

interface Question {
  id: string;
  type: 'multiple_choice' | 'multiple_select' | 'true_false' | 'matching' | 'short_answer';
  text: string;
  media_url?: string;
  options?: { id: string; text: string; is_correct: boolean }[];
  correct_answer?: string;
  explanation?: string;
  points: number;
}

interface ActivityContent {
  instructions: string;
  activity_type: 'reflection' | 'practice' | 'observation' | 'discussion';
  submission_type: 'text' | 'file' | 'video' | 'none';
  rubric?: RubricItem[];
}

interface Assessment {
  type: 'quiz' | 'practical' | 'portfolio' | 'reflection';
  passing_score: number;
  time_limit_minutes?: number;
  content: QuizContent | ActivityContent;
}
```

---

## API Endpoints

### Module Catalog

```typescript
// List modules with filters
GET /api/modules
  ?search={term}
  &ps_category={category}
  &content_area={PS|GS}
  &is_ppo={true|false}
  &specialist_area={legal|performing_arts}
  &format={in_person|virtual_live|self_paced}
  &level={little_none|some|extensive|teaching}
  &max_ceu={value}
  &min_rating={value}
  &collection_id={id}
  &learning_path_id={id}
  &page={number}
  &limit={number}

// Get single module
GET /api/modules/{id}

// Get module content (for enrolled users)
GET /api/modules/{id}/content

// Get recommended modules for interpreter
GET /api/modules/recommendations?interpreter_id={id}

// Get modules by CEU need
GET /api/modules/by-need?interpreter_id={id}&need_type={ps|ppo|total}
```

### Learning Paths

```typescript
// List learning paths
GET /api/learning-paths
  ?collection_id={id}
  &is_certification={true|false}

// Get learning path details with modules
GET /api/learning-paths/{id}

// Enroll in learning path
POST /api/learning-paths/{id}/enroll
Body: { interpreter_id }

// Get learning path progress
GET /api/learning-paths/{id}/progress?interpreter_id={id}
```

### Progress Tracking

```typescript
// Start module
POST /api/modules/{id}/start
Body: { interpreter_id }

// Update progress
PUT /api/modules/{id}/progress
Body: {
  interpreter_id,
  current_section_id,
  progress_percentage,
  time_spent_minutes
}

// Submit assessment
POST /api/modules/{id}/assessment/submit
Body: {
  interpreter_id,
  answers: [{ question_id, answer }]
}

// Complete module
POST /api/modules/{id}/complete
Body: { interpreter_id }
```

### Agency Customization

```typescript
// Get agency's enabled modules
GET /api/agency/{org_id}/modules

// Enable/disable module for agency
PUT /api/agency/{org_id}/modules/{module_id}
Body: {
  is_enabled,
  is_required,
  is_featured,
  custom_price,
  agency_notes
}

// Create custom learning path
POST /api/agency/{org_id}/learning-paths
Body: {
  name,
  description,
  module_ids: [],
  is_mandatory,
  is_onboarding_path
}

// Assign module to interpreters
POST /api/agency/{org_id}/assignments
Body: {
  module_id,
  interpreter_ids: [],
  due_date
}
```

---

## Module Categories Mapping to RID 2025

| PS Category | Module Tag | Example Modules |
|-------------|------------|-----------------|
| Language & Cultural Development | `asl-linguistics`, `deaf-culture` | "Advanced ASL Discourse", "Understanding Deaf Culture" |
| Settings-Based Studies | `legal`, `medical`, `educational` | "Legal Interpreting 101", "Medical Terminology" |
| Cognitive Processes | `interpreting-process`, `cognitive` | "Simultaneous Interpreting Strategies", "Memory Techniques" |
| Professional Interpersonal | `teaming`, `mentoring` | "Effective Teaming Strategies", "Mentorship Best Practices" |
| Ethical Considerations | `ethics` | "Ethical Decision Making", "NAD-RID CPC Deep Dive" |
| Supporting Knowledge & Skills | `business`, `technology` | "Business Practices for Interpreters", "VRI Best Practices" |
| Healthy Minds & Bodies | `wellness`, `self-care` | "Preventing RSI", "Vicarious Trauma Management" |
| Power, Privilege & Oppression | `ppo`, `social-justice` | "Understanding Systemic Oppression", "Trauma-Informed Interpreting" |

---

## Content Seeding Strategy for 300+ Modules

### Phase 1: Core Modules (50)
- 8 modules per PS category = 64 modules
- Mix of knowledge levels

### Phase 2: Specialist Tracks (50)
- Legal: 25 modules (SC:L track)
- Performing Arts: 15 modules (SC:PA track)
- Medical: 10 modules (emerging)

### Phase 3: PPO Focus (30)
- Deep-dive PPO content
- Intersectionality modules
- Trauma-informed series

### Phase 4: Settings Expansion (100)
- Educational K-12
- Higher Education
- Mental Health
- VRS/VRI
- Conference/Platform

### Phase 5: Advanced & Specialty (70+)
- DeafBlind interpreting
- Trilingual interpreting
- CDI/DI training
- Research & academia

---

## UI Components

### Module Catalog Page
- Filter sidebar (categories, format, level, CEUs)
- Search bar with autocomplete
- Grid/list view toggle
- Sort options (relevance, rating, newest, popular)
- Module cards with quick info

### Module Detail Page
- Hero with cover image/preview video
- CEU badge and category tags
- Learning objectives
- Presenter info
- Syllabus/outline
- Reviews section
- Related modules
- Enroll/Start CTA

### Learning Path Page
- Path overview with total CEUs
- Visual module sequence
- Progress indicator
- Unlock status per module
- Estimated completion time

### Interpreter Dashboard
- CEU progress toward cycle requirements
- In-progress modules
- Recommended next modules
- Recent completions
- Upcoming live sessions

### Agency Admin Dashboard
- Module catalog management
- Custom learning path builder
- Assignment tools
- Completion reports
- CEU compliance overview

---

## Next Steps

1. Create Supabase migration for module repository schema
2. Build module content JSON structure and validation
3. Develop module catalog API with search/filter
4. Create admin UI for module management
5. Build interpreter-facing module viewer
6. Implement progress tracking system
7. Develop recommendation engine
8. Create reporting and analytics dashboard
9. Seed initial module content (start with 50 core modules)
10. Build certificate generation for completions
