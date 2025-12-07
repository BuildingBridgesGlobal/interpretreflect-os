-- ============================================================================
-- CEU COMPLIANCE DOCUMENT STORAGE SYSTEM
-- RID-compliant document storage with 6-year retention and audit trail
-- ============================================================================

-- ============================================================================
-- 1. ENUMS FOR DOCUMENT CLASSIFICATION
-- ============================================================================

-- Document Categories (per RID requirements)
DO $$ BEGIN
    CREATE TYPE document_category AS ENUM (
        'certificate_of_completion',
        'attendance_record',
        'evaluation_form',
        'evaluation_summary',
        'workshop_materials',
        'presenter_bio',
        'activity_plan',
        'promotional_materials',
        'syllabus',
        'transcript',
        'grade_report',
        'independent_study_plan',
        'independent_study_deliverable',
        'pinra_approval',
        'relevance_statement',
        'sponsor_notes',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Document Status
DO $$ BEGIN
    CREATE TYPE document_status AS ENUM (
        'pending_upload',
        'uploaded',
        'verified',
        'archived',
        'expired'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. CEU DOCUMENTS TABLE (Core document storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    interpreter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id),

    -- Document Classification
    category document_category NOT NULL,
    status document_status DEFAULT 'uploaded',

    -- Document Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT,
    storage_path TEXT NOT NULL, -- Supabase storage path

    -- CEU Linkage
    ceu_certificate_id UUID REFERENCES ceu_certificates(id) ON DELETE SET NULL,
    ceu_module_id UUID REFERENCES ceu_modules(id) ON DELETE SET NULL,

    -- Compliance Metadata
    activity_date DATE,
    retention_until DATE, -- Calculated: activity_date + 6 years
    is_compliance_critical BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),

    -- Audit Trail
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full-text search vector
ALTER TABLE ceu_documents ADD COLUMN IF NOT EXISTS search_vector tsvector
    GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

-- ============================================================================
-- 3. DOCUMENT VERSIONS (for updates/corrections)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES ceu_documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    change_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),

    UNIQUE(document_id, version_number)
);

-- ============================================================================
-- 4. COMPLIANCE CHECKLISTS (Per RID activity type requirements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_compliance_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What this checklist is for
    activity_type VARCHAR(50) NOT NULL, -- 'SIA', 'PINRA', 'AC', 'IS'
    name VARCHAR(255) NOT NULL,

    -- Checklist items (JSON array of required documents)
    required_documents JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. COMPLIANCE STATUS TRACKING (Per CEU record)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_compliance_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What we're tracking compliance for
    ceu_certificate_id UUID REFERENCES ceu_certificates(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES ceu_compliance_checklists(id),

    -- Status
    is_complete BOOLEAN DEFAULT false,
    missing_documents JSONB DEFAULT '[]', -- Array of missing document categories

    -- Review tracking
    last_reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    review_notes TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(ceu_certificate_id)
);

-- ============================================================================
-- 6. BULK UPLOAD BATCHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_document_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

    -- Batch details
    batch_name VARCHAR(255),
    description TEXT,
    total_documents INTEGER DEFAULT 0,
    processed_documents INTEGER DEFAULT 0,
    failed_documents INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    error_log JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- 7. DOCUMENT ACCESS LOG (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ceu_document_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES ceu_documents(id) ON DELETE CASCADE,
    accessed_by UUID REFERENCES auth.users(id),
    access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'edit', 'delete', 'auto_expire'
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. INDEXES
-- ============================================================================

-- CEU Documents
CREATE INDEX IF NOT EXISTS idx_ceu_documents_org ON ceu_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_interpreter ON ceu_documents(interpreter_id);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_category ON ceu_documents(category);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_status ON ceu_documents(status);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_certificate ON ceu_documents(ceu_certificate_id);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_module ON ceu_documents(ceu_module_id);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_retention ON ceu_documents(retention_until);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_activity_date ON ceu_documents(activity_date);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_search ON ceu_documents USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_ceu_documents_compliance ON ceu_documents(is_compliance_critical) WHERE is_compliance_critical = true;

-- Document versions
CREATE INDEX IF NOT EXISTS idx_ceu_doc_versions_document ON ceu_document_versions(document_id);

-- Compliance checklists
CREATE INDEX IF NOT EXISTS idx_ceu_checklists_type ON ceu_compliance_checklists(activity_type);
CREATE INDEX IF NOT EXISTS idx_ceu_checklists_active ON ceu_compliance_checklists(is_active) WHERE is_active = true;

-- Compliance status
CREATE INDEX IF NOT EXISTS idx_ceu_compliance_status_certificate ON ceu_compliance_status(ceu_certificate_id);
CREATE INDEX IF NOT EXISTS idx_ceu_compliance_status_complete ON ceu_compliance_status(is_complete);

-- Document batches
CREATE INDEX IF NOT EXISTS idx_ceu_doc_batches_org ON ceu_document_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_ceu_doc_batches_status ON ceu_document_batches(status);

-- Access log
CREATE INDEX IF NOT EXISTS idx_ceu_access_log_document ON ceu_document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_ceu_access_log_user ON ceu_document_access_log(accessed_by);
CREATE INDEX IF NOT EXISTS idx_ceu_access_log_date ON ceu_document_access_log(accessed_at);

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ceu_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_compliance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_document_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_document_access_log ENABLE ROW LEVEL SECURITY;

-- Documents: Users can see their own or their org's documents
CREATE POLICY "Users can view own documents" ON ceu_documents
    FOR SELECT TO authenticated
    USING (
        interpreter_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- Documents: Interpreters can upload their own, org admins can upload for anyone
CREATE POLICY "Users can upload documents" ON ceu_documents
    FOR INSERT TO authenticated
    WITH CHECK (
        interpreter_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Documents: Users can update their own documents
CREATE POLICY "Users can update own documents" ON ceu_documents
    FOR UPDATE TO authenticated
    USING (
        interpreter_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Document versions: Same access as parent document
CREATE POLICY "Users can view document versions" ON ceu_document_versions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ceu_documents d
            WHERE d.id = document_id
            AND (
                d.interpreter_id = auth.uid() OR
                d.organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE user_id = auth.uid() AND status = 'active'
                )
            )
        )
    );

CREATE POLICY "Users can insert document versions" ON ceu_document_versions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ceu_documents d
            WHERE d.id = document_id
            AND (
                d.interpreter_id = auth.uid() OR
                d.organization_id IN (
                    SELECT organization_id FROM organization_members
                    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
                )
            )
        )
    );

-- Compliance checklists: Publicly readable (reference data)
CREATE POLICY "Compliance checklists are viewable" ON ceu_compliance_checklists
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Compliance status: Users can view their own or their org's
CREATE POLICY "Users can view compliance status" ON ceu_compliance_status
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ceu_certificates c
            WHERE c.id = ceu_certificate_id
            AND c.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM ceu_certificates c
            JOIN organization_members om ON om.user_id = auth.uid()
            WHERE c.id = ceu_certificate_id
            AND om.role IN ('owner', 'admin') AND om.status = 'active'
        )
    );

CREATE POLICY "Org admins can manage compliance status" ON ceu_compliance_status
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ceu_certificates c
            JOIN ceu_documents d ON d.ceu_certificate_id = c.id
            JOIN organization_members om ON om.organization_id = d.organization_id
            WHERE c.id = ceu_certificate_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin') AND om.status = 'active'
        )
    );

-- Document batches: Org members can view, admins can manage
CREATE POLICY "Org members can view batches" ON ceu_document_batches
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "Org admins can manage batches" ON ceu_document_batches
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
        )
    );

-- Access log: Org admins can view
CREATE POLICY "Org admins can view access log" ON ceu_document_access_log
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM ceu_documents d
            JOIN organization_members om ON om.organization_id = d.organization_id
            WHERE d.id = document_id
            AND om.user_id = auth.uid()
            AND om.role IN ('owner', 'admin') AND om.status = 'active'
        )
    );

-- System can insert access logs
CREATE POLICY "System can insert access logs" ON ceu_document_access_log
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- 10. HELPER FUNCTIONS
-- ============================================================================

-- Calculate retention date (6 years from activity per RID requirements)
CREATE OR REPLACE FUNCTION calculate_retention_date(activity_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN activity_date + INTERVAL '6 years';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update retention date trigger
CREATE OR REPLACE FUNCTION update_ceu_doc_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.activity_date IS NOT NULL THEN
        NEW.retention_until := calculate_retention_date(NEW.activity_date);
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ceu_doc_retention_date ON ceu_documents;
CREATE TRIGGER set_ceu_doc_retention_date
    BEFORE INSERT OR UPDATE ON ceu_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_ceu_doc_retention_date();

-- Check compliance completeness for a CEU certificate
CREATE OR REPLACE FUNCTION check_ceu_compliance_completeness(p_certificate_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_activity_type VARCHAR(50);
    v_checklist JSONB;
    v_missing JSONB := '[]'::JSONB;
    v_item JSONB;
    v_doc_count INTEGER;
BEGIN
    -- Get activity type from CEU certificate
    SELECT rid_activity_type INTO v_activity_type
    FROM ceu_certificates WHERE id = p_certificate_id;

    IF v_activity_type IS NULL THEN
        v_activity_type := 'SIA'; -- Default to Sponsor Initiated Activity
    END IF;

    -- Get checklist for this activity type
    SELECT required_documents INTO v_checklist
    FROM ceu_compliance_checklists
    WHERE activity_type = v_activity_type AND is_active = true
    ORDER BY effective_date DESC
    LIMIT 1;

    IF v_checklist IS NULL THEN
        RETURN jsonb_build_object('complete', true, 'missing', '[]'::jsonb, 'activity_type', v_activity_type);
    END IF;

    -- Check each required document
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_checklist)
    LOOP
        IF (v_item->>'required')::boolean THEN
            SELECT COUNT(*) INTO v_doc_count
            FROM ceu_documents
            WHERE ceu_certificate_id = p_certificate_id
                AND category::text = (v_item->>'category');

            IF v_doc_count = 0 THEN
                v_missing := v_missing || v_item;
            END IF;
        END IF;
    END LOOP;

    -- Update or create compliance status record
    INSERT INTO ceu_compliance_status (ceu_certificate_id, is_complete, missing_documents, last_reviewed_at)
    VALUES (p_certificate_id, jsonb_array_length(v_missing) = 0, v_missing, NOW())
    ON CONFLICT (ceu_certificate_id) DO UPDATE SET
        is_complete = jsonb_array_length(v_missing) = 0,
        missing_documents = v_missing,
        last_reviewed_at = NOW(),
        updated_at = NOW();

    RETURN jsonb_build_object(
        'complete', jsonb_array_length(v_missing) = 0,
        'missing', v_missing,
        'activity_type', v_activity_type,
        'total_required', jsonb_array_length(v_checklist),
        'total_missing', jsonb_array_length(v_missing)
    );
END;
$$ LANGUAGE plpgsql;

-- Process document retention (mark expired documents)
CREATE OR REPLACE FUNCTION process_ceu_document_retention()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    -- Mark documents past retention as expired
    WITH expired AS (
        UPDATE ceu_documents
        SET status = 'expired', updated_at = NOW()
        WHERE retention_until < CURRENT_DATE
            AND status != 'expired'
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired_count FROM expired;

    -- Log for audit
    INSERT INTO ceu_document_access_log (document_id, access_type, accessed_at)
    SELECT id, 'auto_expire', NOW()
    FROM ceu_documents
    WHERE retention_until < CURRENT_DATE
        AND status = 'expired'
        AND updated_at >= NOW() - INTERVAL '1 minute';

    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Get documents approaching expiration (for admin alerts)
CREATE OR REPLACE FUNCTION get_expiring_documents(p_org_id UUID, p_days_until INTEGER DEFAULT 90)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    category document_category,
    interpreter_id UUID,
    activity_date DATE,
    retention_until DATE,
    days_remaining INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.title,
        d.category,
        d.interpreter_id,
        d.activity_date,
        d.retention_until,
        (d.retention_until - CURRENT_DATE)::INTEGER as days_remaining
    FROM ceu_documents d
    WHERE d.organization_id = p_org_id
        AND d.status != 'expired'
        AND d.retention_until IS NOT NULL
        AND d.retention_until <= CURRENT_DATE + (p_days_until || ' days')::INTERVAL
    ORDER BY d.retention_until ASC;
END;
$$ LANGUAGE plpgsql;

-- Log document access
CREATE OR REPLACE FUNCTION log_document_access(
    p_document_id UUID,
    p_user_id UUID,
    p_access_type VARCHAR,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO ceu_document_access_log (document_id, accessed_by, access_type, ip_address, user_agent)
    VALUES (p_document_id, p_user_id, p_access_type, p_ip_address, p_user_agent)
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. SEED COMPLIANCE CHECKLISTS
-- ============================================================================

-- Sponsor Initiated Activity (SIA)
INSERT INTO ceu_compliance_checklists (activity_type, name, required_documents, effective_date)
VALUES (
    'SIA',
    'Sponsor Initiated Activity Requirements',
    '[
        {"category": "activity_plan", "required": true, "description": "Activity Plan Form with educational objectives"},
        {"category": "presenter_bio", "required": true, "description": "Presenter qualifications and credentials"},
        {"category": "promotional_materials", "required": true, "description": "Event flyer or announcement"},
        {"category": "attendance_record", "required": true, "description": "Signed attendance verification"},
        {"category": "evaluation_summary", "required": true, "description": "Participant evaluation summary"},
        {"category": "certificate_of_completion", "required": true, "description": "Certificate of attendance/completion"}
    ]'::jsonb,
    '2025-01-01'
) ON CONFLICT DO NOTHING;

-- Participant Initiated Non-RID Activity (PINRA)
INSERT INTO ceu_compliance_checklists (activity_type, name, required_documents, effective_date)
VALUES (
    'PINRA',
    'Participant Initiated Non-RID Activity Requirements',
    '[
        {"category": "pinra_approval", "required": true, "description": "Pre-approval form from RID sponsor"},
        {"category": "relevance_statement", "required": true, "description": "Statement of relevance to interpreting"},
        {"category": "workshop_materials", "required": true, "description": "Event brochure or agenda"},
        {"category": "certificate_of_completion", "required": true, "description": "Proof of attendance from provider"},
        {"category": "sponsor_notes", "required": false, "description": "Sponsor rationale notes"}
    ]'::jsonb,
    '2025-01-01'
) ON CONFLICT DO NOTHING;

-- Academic Coursework (AC)
INSERT INTO ceu_compliance_checklists (activity_type, name, required_documents, effective_date)
VALUES (
    'AC',
    'Academic Coursework Requirements',
    '[
        {"category": "syllabus", "required": true, "description": "Course syllabus with objectives"},
        {"category": "relevance_statement", "required": true, "description": "Statement of relevance to interpreting"},
        {"category": "transcript", "required": true, "description": "Official grade report or transcript"},
        {"category": "sponsor_notes", "required": false, "description": "Accreditation verification notes"}
    ]'::jsonb,
    '2025-01-01'
) ON CONFLICT DO NOTHING;

-- Independent Study (IS)
INSERT INTO ceu_compliance_checklists (activity_type, name, required_documents, effective_date)
VALUES (
    'IS',
    'Independent Study Requirements',
    '[
        {"category": "independent_study_plan", "required": true, "description": "IS Activity Plan with learning objectives"},
        {"category": "relevance_statement", "required": true, "description": "Statement of relevance and objectives"},
        {"category": "independent_study_deliverable", "required": true, "description": "Final project or deliverable"},
        {"category": "evaluation_form", "required": true, "description": "Self-evaluation or assessment"},
        {"category": "sponsor_notes", "required": true, "description": "Sponsor approval and review notes"}
    ]'::jsonb,
    '2025-01-01'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. VIEWS
-- ============================================================================

-- Documents with compliance info
CREATE OR REPLACE VIEW v_ceu_documents_with_compliance AS
SELECT
    d.*,
    cs.is_complete as compliance_complete,
    cs.missing_documents as compliance_missing,
    cs.last_reviewed_at as compliance_reviewed_at,
    c.certificate_number,
    c.title as certificate_title,
    c.ceu_value,
    c.rid_category
FROM ceu_documents d
LEFT JOIN ceu_compliance_status cs ON cs.ceu_certificate_id = d.ceu_certificate_id
LEFT JOIN ceu_certificates c ON c.id = d.ceu_certificate_id;

-- Organization document summary
CREATE OR REPLACE VIEW v_org_document_summary AS
SELECT
    d.organization_id,
    COUNT(*) as total_documents,
    COUNT(*) FILTER (WHERE d.status = 'uploaded') as uploaded_count,
    COUNT(*) FILTER (WHERE d.status = 'verified') as verified_count,
    COUNT(*) FILTER (WHERE d.status = 'expired') as expired_count,
    COUNT(*) FILTER (WHERE d.is_compliance_critical) as critical_count,
    COUNT(*) FILTER (WHERE d.retention_until <= CURRENT_DATE + INTERVAL '90 days' AND d.status != 'expired') as expiring_soon_count,
    SUM(d.file_size_bytes) as total_storage_bytes
FROM ceu_documents d
GROUP BY d.organization_id;

-- Interpreter document summary
CREATE OR REPLACE VIEW v_interpreter_document_summary AS
SELECT
    d.interpreter_id,
    d.organization_id,
    COUNT(*) as total_documents,
    COUNT(DISTINCT d.ceu_certificate_id) as certificates_with_docs,
    array_agg(DISTINCT d.category) as document_categories,
    MAX(d.created_at) as last_upload_at
FROM ceu_documents d
GROUP BY d.interpreter_id, d.organization_id;

COMMENT ON TABLE ceu_documents IS 'CEU compliance document storage with 6-year retention per RID requirements';
COMMENT ON TABLE ceu_compliance_checklists IS 'Required document checklists by RID activity type (SIA, PINRA, AC, IS)';
COMMENT ON TABLE ceu_compliance_status IS 'Tracks document compliance completeness per CEU certificate';
COMMENT ON TABLE ceu_document_access_log IS 'Audit trail for document access (view, download, edit, delete)';
