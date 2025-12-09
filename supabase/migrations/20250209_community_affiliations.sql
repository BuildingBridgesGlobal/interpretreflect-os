-- ============================================
-- Community Affiliations & Identity Tags
-- ============================================
-- Aligned with RID Member Sections and professional organizations
-- Privacy-first: all selections are voluntary and user-controlled
--
-- Categories:
--   identity   = Personal/cultural identity (DPI, Black, LGBTQ+, etc.)
--   background = Professional background (First-Gen, Career Changer)
--   specialty  = Practice areas (Legal, Medical, VRS, etc.)

-- Core affiliations table
CREATE TABLE IF NOT EXISTS community_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- Full display name
  short_code TEXT NOT NULL UNIQUE,       -- URL-safe identifier
  category TEXT NOT NULL,                -- 'identity', 'specialty', 'background'
  aligned_org TEXT,                      -- RID Member Section or org alignment
  description TEXT,                      -- Hover/help text
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data: Identity affiliations (RID Member Section aligned)
INSERT INTO community_affiliations (name, short_code, category, aligned_org, description, display_order) VALUES
  ('Deaf Parented Interpreter (DPI)', 'dpi', 'identity', 'IDP Member Section', 'Interpreters who have Deaf parent(s)', 1),
  ('Deaf/DeafBlind Interpreter', 'deaf-interpreter', 'identity', 'Deaf Interpreter Member Section', 'Deaf, DeafBlind, or Hard of Hearing interpreters', 2),
  ('Black Interpreter', 'black', 'identity', 'NAOBI', 'Aligned with National Alliance of Black Interpreters', 3),
  ('Latinx/Spanish-Influenced Interpreter', 'latinx', 'identity', 'Mano a Mano', 'Interpreters working in Spanish-influenced settings or of Latinx heritage', 4),
  ('LGBTQ+ Interpreter', 'lgbtq', 'identity', 'BLGIT Member Section', 'Bisexual, Lesbian, Gay, Intersex, Transgender interpreters', 5),
  ('Native/Indigenous Interpreter', 'indigenous', 'identity', 'Intertribal Deaf Council', 'American Indian, Alaska Native, First Nations interpreters', 6),
  ('Interpreter of Color', 'ioc', 'identity', NULL, 'Broader category for BIPOC interpreters', 7),
  ('Asian/Pacific Islander Interpreter', 'aapi', 'identity', NULL, 'Asian American and Pacific Islander interpreters', 8)
ON CONFLICT (short_code) DO NOTHING;

-- Seed data: Background affiliations
INSERT INTO community_affiliations (name, short_code, category, aligned_org, description, display_order) VALUES
  ('First-Generation Interpreter', 'first-gen', 'background', NULL, 'No family members in the interpreting field', 10),
  ('Deaf Family/Community Connection', 'deaf-connected', 'background', NULL, 'Heritage signers with Deaf family or deep community ties', 11),
  ('Career Changer', 'career-changer', 'background', NULL, 'Entered interpreting from another profession', 12)
ON CONFLICT (short_code) DO NOTHING;

-- Seed data: Specialty areas
INSERT INTO community_affiliations (name, short_code, category, aligned_org, description, display_order) VALUES
  ('Legal/Court Interpreter', 'legal', 'specialty', 'LIMS', 'Legal Interpreting Member Section', 20),
  ('Medical/Healthcare Interpreter', 'medical', 'specialty', NULL, 'Healthcare and medical settings', 21),
  ('Mental Health Interpreter', 'mental-health', 'specialty', NULL, 'Therapy, psychiatric, and mental health settings', 22),
  ('Educational Interpreter', 'educational', 'specialty', 'EIMS', 'K-12 and higher education settings', 23),
  ('VRS/VRI Interpreter', 'vrs', 'specialty', NULL, 'Video Relay and Video Remote Interpreting', 24),
  ('Conference/Platform Interpreter', 'conference', 'specialty', NULL, 'Large events, conferences, platform work', 25),
  ('Performing Arts Interpreter', 'performing-arts', 'specialty', NULL, 'Theater, music, entertainment', 26),
  ('DeafBlind Interpreter', 'deafblind', 'specialty', NULL, 'Tactile and close vision interpreting', 27)
ON CONFLICT (short_code) DO NOTHING;

-- User's selected affiliations (many-to-many)
CREATE TABLE IF NOT EXISTS user_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  affiliation_id UUID NOT NULL REFERENCES community_affiliations(id) ON DELETE CASCADE,
  visible_in_community BOOLEAN DEFAULT true,  -- Can toggle visibility per affiliation
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, affiliation_id)
);

-- Add mentor fields to profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'open_to_mentoring') THEN
    ALTER TABLE profiles ADD COLUMN open_to_mentoring BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'mentor_bio') THEN
    ALTER TABLE profiles ADD COLUMN mentor_bio TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'years_experience') THEN
    ALTER TABLE profiles ADD COLUMN years_experience INTEGER;
  END IF;
END $$;

-- Content/workshop perspective tags
CREATE TABLE IF NOT EXISTS content_perspectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,            -- 'workshop', 'video', 'article'
  content_id UUID NOT NULL,              -- References the content item
  affiliation_id UUID NOT NULL REFERENCES community_affiliations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_type, content_id, affiliation_id)
);

-- ============================================
-- RLS Policies
-- ============================================

-- Affiliations table: Anyone can read active affiliations
ALTER TABLE community_affiliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active affiliations" ON community_affiliations;
CREATE POLICY "Anyone can view active affiliations"
  ON community_affiliations FOR SELECT
  USING (is_active = true);

-- User affiliations: Users manage their own, visible ones are public
ALTER TABLE user_affiliations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own affiliations" ON user_affiliations;
CREATE POLICY "Users can manage their own affiliations"
  ON user_affiliations FOR ALL
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Visible affiliations are public in community" ON user_affiliations;
CREATE POLICY "Visible affiliations are public in community"
  ON user_affiliations FOR SELECT
  USING (visible_in_community = true);

-- Content perspectives: Anyone can read
ALTER TABLE content_perspectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view content perspectives" ON content_perspectives;
CREATE POLICY "Anyone can view content perspectives"
  ON content_perspectives FOR SELECT
  USING (true);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_affiliations_user ON user_affiliations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliations_affiliation ON user_affiliations(affiliation_id);
CREATE INDEX IF NOT EXISTS idx_user_affiliations_visible ON user_affiliations(visible_in_community) WHERE visible_in_community = true;
CREATE INDEX IF NOT EXISTS idx_content_perspectives_content ON content_perspectives(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_community_affiliations_category ON community_affiliations(category);

-- ============================================
-- Helper view: Users with their visible affiliations
-- ============================================
DROP VIEW IF EXISTS user_community_profiles;
CREATE VIEW user_community_profiles AS
SELECT
  p.id as user_id,
  p.full_name,
  p.open_to_mentoring,
  p.mentor_bio,
  p.years_experience,
  COALESCE(
    json_agg(
      json_build_object(
        'id', ca.id,
        'name', ca.name,
        'short_code', ca.short_code,
        'category', ca.category
      )
    ) FILTER (WHERE ca.id IS NOT NULL AND ua.visible_in_community = true),
    '[]'
  ) as visible_affiliations
FROM profiles p
LEFT JOIN user_affiliations ua ON p.id = ua.user_id AND ua.visible_in_community = true
LEFT JOIN community_affiliations ca ON ua.affiliation_id = ca.id AND ca.is_active = true
WHERE p.open_to_mentoring = true
GROUP BY p.id, p.full_name, p.open_to_mentoring, p.mentor_bio, p.years_experience;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE community_affiliations IS 'RID-aligned identity, background, and specialty tags for community discovery';
COMMENT ON TABLE user_affiliations IS 'User-selected affiliations with privacy controls';
COMMENT ON TABLE content_perspectives IS 'Perspective tags on workshops and content';
COMMENT ON VIEW user_community_profiles IS 'Public view of mentors with their visible affiliations';
