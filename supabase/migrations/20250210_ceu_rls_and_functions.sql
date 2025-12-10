-- =====================================================
-- CEU SYSTEM: ROW LEVEL SECURITY & AUTOMATION
-- =====================================================

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on CEU-related tables
ALTER TABLE skill_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_evaluations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SKILL_MODULES (WORKSHOPS) POLICIES
-- =====================================================

-- Anyone can view active workshops
DROP POLICY IF EXISTS "Active workshops are viewable by everyone" ON skill_modules;
CREATE POLICY "Active workshops are viewable by everyone"
  ON skill_modules FOR SELECT
  USING (is_active = true);

-- Authenticated users can view all active workshops
DROP POLICY IF EXISTS "Authenticated users can view all active workshops" ON skill_modules;
CREATE POLICY "Authenticated users can view all active workshops"
  ON skill_modules FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage workshops" ON skill_modules;
CREATE POLICY "Service role can manage workshops"
  ON skill_modules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- USER_MODULE_PROGRESS POLICIES
-- =====================================================

-- Users can view their own progress
DROP POLICY IF EXISTS "Users can view their own progress" ON user_module_progress;
CREATE POLICY "Users can view their own progress"
  ON user_module_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own progress records
DROP POLICY IF EXISTS "Users can create their own progress" ON user_module_progress;
CREATE POLICY "Users can create their own progress"
  ON user_module_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
DROP POLICY IF EXISTS "Users can update their own progress" ON user_module_progress;
CREATE POLICY "Users can update their own progress"
  ON user_module_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage all progress" ON user_module_progress;
CREATE POLICY "Service role can manage all progress"
  ON user_module_progress FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CEU_CERTIFICATES POLICIES
-- =====================================================

-- Users can view their own certificates
DROP POLICY IF EXISTS "Users can view their own certificates" ON ceu_certificates;
CREATE POLICY "Users can view their own certificates"
  ON ceu_certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all certificates
DROP POLICY IF EXISTS "Service role can manage certificates" ON ceu_certificates;
CREATE POLICY "Service role can manage certificates"
  ON ceu_certificates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CEU_EVALUATIONS POLICIES
-- =====================================================

-- Users can view their own evaluations
DROP POLICY IF EXISTS "Users can view their own evaluations" ON ceu_evaluations;
CREATE POLICY "Users can view their own evaluations"
  ON ceu_evaluations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own evaluations
DROP POLICY IF EXISTS "Users can create their own evaluations" ON ceu_evaluations;
CREATE POLICY "Users can create their own evaluations"
  ON ceu_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Service role has full access
DROP POLICY IF EXISTS "Service role can manage evaluations" ON ceu_evaluations;
CREATE POLICY "Service role can manage evaluations"
  ON ceu_evaluations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- AUTOMATION FUNCTIONS
-- =====================================================

-- =====================================================
-- Function: Generate Certificate Number
-- Format: IR-YY-NNNNNN (InterpretReflect-Year-Sequence)
-- =====================================================
CREATE OR REPLACE FUNCTION generate_ceu_certificate_number()
RETURNS TEXT AS $$
DECLARE
  year_code TEXT;
  sequence_num TEXT;
BEGIN
  year_code := TO_CHAR(CURRENT_DATE, 'YY');
  sequence_num := LPAD(
    (SELECT COUNT(*) + 1 FROM ceu_certificates WHERE EXTRACT(YEAR FROM issued_at) = EXTRACT(YEAR FROM CURRENT_DATE))::TEXT,
    6,
    '0'
  );
  RETURN 'IR-' || year_code || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function: Check Quiz Pass Status (80% threshold)
-- =====================================================
CREATE OR REPLACE FUNCTION check_quiz_passed(score INTEGER, threshold INTEGER DEFAULT 80)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN score >= threshold;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Function: Update Quiz Pass Status on Score Change
-- =====================================================
CREATE OR REPLACE FUNCTION update_quiz_pass_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assessment_score IS NOT NULL AND NEW.assessment_score IS DISTINCT FROM OLD.assessment_score THEN
    NEW.assessment_passed := check_quiz_passed(NEW.assessment_score::INTEGER);
    IF NEW.assessment_passed = true AND OLD.assessment_passed IS DISTINCT FROM true THEN
      NEW.assessment_completed := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: Update quiz pass status when score is set
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_quiz_pass_status ON user_module_progress;
CREATE TRIGGER trigger_update_quiz_pass_status
  BEFORE UPDATE ON user_module_progress
  FOR EACH ROW
  WHEN (NEW.assessment_score IS NOT NULL)
  EXECUTE FUNCTION update_quiz_pass_status();

-- =====================================================
-- Function: Auto-Generate Certificate When All Requirements Met
-- Requirements: video_completed, assessment_passed, evaluation_completed
-- =====================================================
CREATE OR REPLACE FUNCTION auto_generate_ceu_certificate()
RETURNS TRIGGER AS $$
DECLARE
  module_data RECORD;
  user_profile RECORD;
  cert_number TEXT;
  existing_cert_id UUID;
BEGIN
  -- Check if all CEU requirements are met and no certificate exists yet
  IF NEW.video_completed = true
     AND NEW.assessment_passed = true
     AND NEW.evaluation_completed = true
     AND NEW.certificate_id IS NULL
  THEN
    -- Get module data
    SELECT * INTO module_data
    FROM skill_modules
    WHERE id = NEW.module_id AND ceu_eligible = true;

    -- Only proceed if module is CEU-eligible
    IF module_data.id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Check if certificate already exists for this user/module combo
    SELECT id INTO existing_cert_id
    FROM ceu_certificates
    WHERE user_id = NEW.user_id AND module_id = NEW.module_id;

    IF existing_cert_id IS NOT NULL THEN
      -- Certificate already exists, just link it
      NEW.certificate_id := existing_cert_id;
      RETURN NEW;
    END IF;

    -- Get user profile
    SELECT
      COALESCE(p.full_name, u.email) as name,
      u.email,
      p.rid_member_number
    INTO user_profile
    FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
    WHERE u.id = NEW.user_id;

    -- Generate certificate number
    cert_number := generate_ceu_certificate_number();

    -- Insert certificate record
    INSERT INTO ceu_certificates (
      user_id,
      module_id,
      progress_id,
      certificate_number,
      title,
      description,
      ceu_value,
      rid_category,
      activity_code,
      presenter,
      time_spent_minutes,
      assessment_score,
      learning_objectives_achieved,
      issued_at,
      completed_at
    ) VALUES (
      NEW.user_id,
      NEW.module_id,
      NEW.id,
      cert_number,
      module_data.title,
      module_data.description,
      module_data.ceu_value,
      module_data.rid_category,
      module_data.rid_activity_code,
      COALESCE(module_data.instructor_name, 'InterpretReflect'),
      COALESCE(NEW.time_spent_seconds / 60, module_data.duration_minutes),
      NEW.assessment_score,
      module_data.learning_objectives,
      NOW(),
      NOW()
    )
    RETURNING id INTO NEW.certificate_id;

    -- Update progress record status
    NEW.status := 'completed';
    NEW.completed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Trigger: Auto-generate certificate on progress update
-- =====================================================
DROP TRIGGER IF EXISTS trigger_auto_generate_ceu_certificate ON user_module_progress;
CREATE TRIGGER trigger_auto_generate_ceu_certificate
  BEFORE UPDATE ON user_module_progress
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_ceu_certificate();

-- =====================================================
-- Function: Track RID Submission Deadline (45 days)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_rid_deadline(issued_date TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN issued_date + INTERVAL '45 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- View: Certificates approaching RID deadline
-- =====================================================
CREATE OR REPLACE VIEW ceu_certificates_deadline_tracking AS
SELECT
  c.id,
  c.certificate_number,
  c.user_id,
  c.title,
  c.ceu_value,
  c.rid_category,
  c.issued_at,
  c.rid_submitted_at,
  calculate_rid_deadline(c.issued_at) AS rid_deadline,
  EXTRACT(DAY FROM (calculate_rid_deadline(c.issued_at) - NOW())) AS days_until_deadline,
  CASE
    WHEN c.rid_submitted_at IS NOT NULL THEN 'submitted'
    WHEN NOW() > calculate_rid_deadline(c.issued_at) THEN 'overdue'
    WHEN NOW() > calculate_rid_deadline(c.issued_at) - INTERVAL '14 days' THEN 'urgent'
    WHEN NOW() > calculate_rid_deadline(c.issued_at) - INTERVAL '30 days' THEN 'due_soon'
    ELSE 'on_track'
  END AS deadline_status,
  p.full_name AS participant_name,
  p.email AS participant_email,
  p.rid_member_number
FROM ceu_certificates c
LEFT JOIN profiles p ON p.id = c.user_id
WHERE c.rid_submitted_at IS NULL
ORDER BY rid_deadline ASC;

-- =====================================================
-- Function: Get CEU Summary for a User
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_ceu_summary(p_user_id UUID)
RETURNS TABLE (
  total_earned NUMERIC,
  professional_studies_earned NUMERIC,
  ppo_earned NUMERIC,
  general_studies_earned NUMERIC,
  total_certificates INTEGER,
  is_compliant BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(c.ceu_value), 0) AS total_earned,
    COALESCE(SUM(CASE WHEN c.rid_category = 'Professional Studies' THEN c.ceu_value ELSE 0 END), 0) AS professional_studies_earned,
    COALESCE(SUM(CASE WHEN c.rid_category = 'PPO' THEN c.ceu_value ELSE 0 END), 0) AS ppo_earned,
    COALESCE(SUM(CASE WHEN c.rid_category = 'General Studies' THEN c.ceu_value ELSE 0 END), 0) AS general_studies_earned,
    COUNT(c.id)::INTEGER AS total_certificates,
    (
      COALESCE(SUM(c.ceu_value), 0) >= 8.0 AND
      COALESCE(SUM(CASE WHEN c.rid_category = 'Professional Studies' THEN c.ceu_value ELSE 0 END), 0) >= 6.0 AND
      COALESCE(SUM(CASE WHEN c.rid_category = 'PPO' THEN c.ceu_value ELSE 0 END), 0) >= 1.0
    ) AS is_compliant
  FROM ceu_certificates c
  WHERE c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_ceu_certificate_number() TO authenticated;
GRANT EXECUTE ON FUNCTION check_quiz_passed(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_rid_deadline(TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_ceu_summary(UUID) TO authenticated;
