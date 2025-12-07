# CEU Compliance Document Storage System

## Overview

This document outlines the architecture for a comprehensive CEU compliance document storage system that meets RID requirements for record retention (6 years minimum) and supports agency/interpreter certification maintenance tracking.

---

## System Requirements

### RID Compliance Requirements
1. **6-year retention** for all CEU-related documents
2. **Audit trail** for program reviews
3. **Attendance verification** records
4. **Certificate of completion** generation and storage
5. **Evaluation summaries** per activity
6. **Sponsor documentation** alignment

### Platform Requirements
1. Multi-agency support with data isolation
2. Interpreter-specific document access
3. Agency-wide reporting capabilities
4. Bulk upload for workshop documentation
5. Search and filter by date, category, interpreter
6. Export for RID program review submissions

---

## Database Schema

### Core Tables

```sql
-- ============================================
-- CEU COMPLIANCE DOCUMENT STORAGE SCHEMA
-- ============================================

-- Document Categories Enum
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

-- Document Status Enum
CREATE TYPE document_status AS ENUM (
  'pending_upload',
  'uploaded',
  'verified',
  'archived',
  'expired'
);

-- ============================================
-- CEU DOCUMENTS TABLE
-- ============================================
CREATE TABLE ceu_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  interpreter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES profiles(id),

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
  ceu_record_id UUID REFERENCES interpreter_ceu_records(id) ON DELETE SET NULL,
  workshop_id UUID REFERENCES ceu_workshops(id) ON DELETE SET NULL,
  module_id UUID REFERENCES ceu_modules(id) ON DELETE SET NULL,

  -- Compliance Metadata
  activity_date DATE,
  retention_until DATE NOT NULL, -- Calculated: activity_date + 6 years
  is_compliance_critical BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),

  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Search Optimization
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_ceu_documents_org ON ceu_documents(organization_id);
CREATE INDEX idx_ceu_documents_interpreter ON ceu_documents(interpreter_id);
CREATE INDEX idx_ceu_documents_category ON ceu_documents(category);
CREATE INDEX idx_ceu_documents_ceu_record ON ceu_documents(ceu_record_id);
CREATE INDEX idx_ceu_documents_workshop ON ceu_documents(workshop_id);
CREATE INDEX idx_ceu_documents_retention ON ceu_documents(retention_until);
CREATE INDEX idx_ceu_documents_search ON ceu_documents USING gin(search_vector);

-- ============================================
-- DOCUMENT VERSIONS (for updates/corrections)
-- ============================================
CREATE TABLE ceu_document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES ceu_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),

  UNIQUE(document_id, version_number)
);

-- ============================================
-- COMPLIANCE CHECKLISTS
-- ============================================
CREATE TABLE ceu_compliance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What this checklist is for
  activity_type VARCHAR(50) NOT NULL, -- 'SIA', 'PINRA', 'AC', 'IS'

  -- Checklist items (JSON array of required documents)
  required_documents JSONB NOT NULL DEFAULT '[]',
  /*
  Example structure:
  [
    {
      "category": "activity_plan",
      "required": true,
      "description": "Completed activity plan form"
    },
    {
      "category": "presenter_bio",
      "required": true,
      "description": "Presenter biographical information"
    }
  ]
  */

  -- Metadata
  effective_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMPLIANCE STATUS TRACKING
-- ============================================
CREATE TABLE ceu_compliance_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What we're tracking compliance for
  ceu_record_id UUID REFERENCES interpreter_ceu_records(id) ON DELETE CASCADE,
  checklist_id UUID REFERENCES ceu_compliance_checklists(id),

  -- Status
  is_complete BOOLEAN DEFAULT false,
  missing_documents JSONB DEFAULT '[]', -- Array of missing document categories

  -- Review tracking
  last_reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  review_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ceu_record_id)
);

-- ============================================
-- BULK UPLOAD BATCHES
-- ============================================
CREATE TABLE ceu_document_batches (
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
  created_by UUID REFERENCES profiles(id)
);

-- ============================================
-- DOCUMENT ACCESS LOG (Audit Trail)
-- ============================================
CREATE TABLE ceu_document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES ceu_documents(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES profiles(id),
  access_type VARCHAR(50) NOT NULL, -- 'view', 'download', 'edit', 'delete'
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_access_log_document ON ceu_document_access_log(document_id);
CREATE INDEX idx_document_access_log_user ON ceu_document_access_log(accessed_by);
CREATE INDEX idx_document_access_log_date ON ceu_document_access_log(accessed_at);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE ceu_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_compliance_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_document_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceu_document_access_log ENABLE ROW LEVEL SECURITY;

-- Documents: Users can see their own or their org's documents
CREATE POLICY "Users can view own documents" ON ceu_documents
  FOR SELECT USING (
    interpreter_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Documents: Only org admins or document owner can insert
CREATE POLICY "Users can upload documents" ON ceu_documents
  FOR INSERT WITH CHECK (
    interpreter_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Calculate retention date (6 years from activity)
CREATE OR REPLACE FUNCTION calculate_retention_date(activity_date DATE)
RETURNS DATE AS $$
BEGIN
  RETURN activity_date + INTERVAL '6 years';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update retention date trigger
CREATE OR REPLACE FUNCTION update_retention_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activity_date IS NOT NULL THEN
    NEW.retention_until := calculate_retention_date(NEW.activity_date);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_retention_date
  BEFORE INSERT OR UPDATE ON ceu_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_retention_date();

-- Check compliance completeness
CREATE OR REPLACE FUNCTION check_compliance_completeness(p_ceu_record_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_activity_type VARCHAR(50);
  v_checklist JSONB;
  v_missing JSONB := '[]'::JSONB;
  v_item JSONB;
  v_doc_count INTEGER;
BEGIN
  -- Get activity type from CEU record
  SELECT activity_type INTO v_activity_type
  FROM interpreter_ceu_records WHERE id = p_ceu_record_id;

  -- Get checklist for this activity type
  SELECT required_documents INTO v_checklist
  FROM ceu_compliance_checklists
  WHERE activity_type = v_activity_type AND is_active = true
  ORDER BY effective_date DESC
  LIMIT 1;

  IF v_checklist IS NULL THEN
    RETURN jsonb_build_object('complete', true, 'missing', '[]'::jsonb);
  END IF;

  -- Check each required document
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_checklist)
  LOOP
    IF (v_item->>'required')::boolean THEN
      SELECT COUNT(*) INTO v_doc_count
      FROM ceu_documents
      WHERE ceu_record_id = p_ceu_record_id
        AND category = (v_item->>'category')::document_category;

      IF v_doc_count = 0 THEN
        v_missing := v_missing || v_item;
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'complete', jsonb_array_length(v_missing) = 0,
    'missing', v_missing
  );
END;
$$ LANGUAGE plpgsql;
```

---

## Storage Architecture

### Supabase Storage Buckets

```
ceu-documents/
├── {organization_id}/
│   ├── certificates/
│   │   └── {year}/
│   │       └── {interpreter_id}/
│   │           └── {document_id}.pdf
│   ├── attendance/
│   │   └── {workshop_id}/
│   │       └── attendance_sheet.pdf
│   ├── evaluations/
│   │   └── {workshop_id}/
│   │       ├── summary.pdf
│   │       └── individual/
│   ├── workshop-materials/
│   │   └── {workshop_id}/
│   │       ├── syllabus.pdf
│   │       ├── slides.pdf
│   │       └── handouts/
│   ├── independent-study/
│   │   └── {interpreter_id}/
│   │       └── {study_id}/
│   │           ├── plan.pdf
│   │           └── deliverables/
│   └── transcripts/
│       └── {interpreter_id}/
│           └── {academic_id}.pdf
```

### Storage Policies

```sql
-- Bucket creation
INSERT INTO storage.buckets (id, name, public)
VALUES ('ceu-documents', 'ceu-documents', false);

-- RLS for storage
CREATE POLICY "Org members can access their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ceu-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

CREATE POLICY "Org admins can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ceu-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin') AND status = 'active'
  )
);
```

---

## Document Workflows

### 1. Certificate of Completion Flow

```typescript
interface CertificateGenerationParams {
  interpreterId: string;
  workshopId: string;
  completionDate: Date;
  ceuValue: number;
  contentArea: 'PS' | 'GS';
  psCategory?: string;
  ppoDesignation: boolean;
}

async function generateAndStoreCertificate(params: CertificateGenerationParams) {
  // 1. Generate PDF certificate
  const pdfBuffer = await generateCertificatePDF(params);

  // 2. Upload to storage
  const storagePath = `${orgId}/certificates/${year}/${params.interpreterId}/${uuid}.pdf`;
  await supabase.storage.from('ceu-documents').upload(storagePath, pdfBuffer);

  // 3. Create document record
  await supabase.from('ceu_documents').insert({
    organization_id: orgId,
    interpreter_id: params.interpreterId,
    category: 'certificate_of_completion',
    title: `Certificate - ${workshopTitle}`,
    file_name: `certificate_${workshopId}.pdf`,
    storage_path: storagePath,
    ceu_record_id: ceuRecordId,
    workshop_id: params.workshopId,
    activity_date: params.completionDate,
    is_compliance_critical: true
  });

  // 4. Update compliance status
  await updateComplianceStatus(ceuRecordId);
}
```

### 2. Bulk Attendance Upload Flow

```typescript
interface BulkAttendanceUpload {
  workshopId: string;
  attendanceFile: File;
  interpreterIds: string[];
}

async function processBulkAttendance(data: BulkAttendanceUpload) {
  // 1. Create batch record
  const batch = await supabase.from('ceu_document_batches').insert({
    organization_id: orgId,
    batch_name: `Attendance - Workshop ${data.workshopId}`,
    total_documents: data.interpreterIds.length + 1, // +1 for master sheet
    status: 'processing'
  }).select().single();

  // 2. Upload master attendance sheet
  const masterPath = `${orgId}/attendance/${data.workshopId}/master_attendance.pdf`;
  await supabase.storage.from('ceu-documents').upload(masterPath, data.attendanceFile);

  // 3. Create document record for master sheet
  await supabase.from('ceu_documents').insert({
    organization_id: orgId,
    category: 'attendance_record',
    title: 'Master Attendance Sheet',
    workshop_id: data.workshopId,
    storage_path: masterPath,
    is_compliance_critical: true
  });

  // 4. Link attendance to each interpreter's CEU record
  for (const interpreterId of data.interpreterIds) {
    const ceuRecord = await getCeuRecordForWorkshop(interpreterId, data.workshopId);
    if (ceuRecord) {
      await supabase.from('ceu_documents').insert({
        organization_id: orgId,
        interpreter_id: interpreterId,
        category: 'attendance_record',
        title: 'Attendance Verification',
        ceu_record_id: ceuRecord.id,
        workshop_id: data.workshopId,
        storage_path: masterPath, // Reference to master sheet
        is_compliance_critical: true
      });
    }
  }

  // 5. Update batch status
  await supabase.from('ceu_document_batches').update({
    status: 'completed',
    processed_documents: data.interpreterIds.length + 1,
    completed_at: new Date()
  }).eq('id', batch.id);
}
```

---

## Compliance Checklists by Activity Type

### Sponsor Initiated Activity (SIA)
```json
{
  "activity_type": "SIA",
  "required_documents": [
    {"category": "activity_plan", "required": true, "description": "Activity Plan Form"},
    {"category": "presenter_bio", "required": true, "description": "Presenter Qualifications"},
    {"category": "promotional_materials", "required": true, "description": "Event Flyer/Announcement"},
    {"category": "attendance_record", "required": true, "description": "Attendance Verification"},
    {"category": "evaluation_summary", "required": true, "description": "Evaluation Summary"},
    {"category": "certificate_of_completion", "required": true, "description": "Certificate of Attendance"}
  ]
}
```

### Participant Initiated Non-RID Activity (PINRA)
```json
{
  "activity_type": "PINRA",
  "required_documents": [
    {"category": "pinra_approval", "required": true, "description": "Pre-Approval Form"},
    {"category": "relevance_statement", "required": true, "description": "Relevance Statement"},
    {"category": "workshop_materials", "required": true, "description": "Event Brochure/Agenda"},
    {"category": "certificate_of_completion", "required": true, "description": "Proof of Attendance"},
    {"category": "sponsor_notes", "required": false, "description": "Sponsor Rationale Notes"}
  ]
}
```

### Academic Coursework (AC)
```json
{
  "activity_type": "AC",
  "required_documents": [
    {"category": "syllabus", "required": true, "description": "Course Syllabus"},
    {"category": "relevance_statement", "required": true, "description": "Relevance Statement"},
    {"category": "transcript", "required": true, "description": "Grade Report/Transcript"},
    {"category": "sponsor_notes", "required": false, "description": "Accreditation Verification"}
  ]
}
```

### Independent Study (IS)
```json
{
  "activity_type": "IS",
  "required_documents": [
    {"category": "independent_study_plan", "required": true, "description": "IS Activity Plan"},
    {"category": "relevance_statement", "required": true, "description": "Relevance & Objectives"},
    {"category": "independent_study_deliverable", "required": true, "description": "Final Deliverable"},
    {"category": "evaluation_form", "required": true, "description": "Evaluation/Assessment"},
    {"category": "sponsor_notes", "required": true, "description": "Sponsor Approval Notes"}
  ]
}
```

---

## API Endpoints

### Document Management

```typescript
// Upload document
POST /api/ceu/documents
Body: FormData { file, category, ceuRecordId?, workshopId?, metadata }

// Get documents for interpreter
GET /api/ceu/documents?interpreterId={id}&category={category}

// Get documents for workshop
GET /api/ceu/documents/workshop/{workshopId}

// Get compliance status
GET /api/ceu/compliance/{ceuRecordId}

// Download document
GET /api/ceu/documents/{documentId}/download

// Bulk upload
POST /api/ceu/documents/bulk
Body: FormData { files[], workshopId, interpreterIds[] }

// Generate certificate
POST /api/ceu/certificates/generate
Body: { interpreterId, workshopId, completionDate }

// Export for RID review
GET /api/ceu/documents/export?startDate={date}&endDate={date}&format={zip|pdf}
```

---

## Retention & Archival

### Automated Retention Management

```sql
-- Daily job to check expiring documents
CREATE OR REPLACE FUNCTION process_document_retention()
RETURNS void AS $$
BEGIN
  -- Mark documents past retention as expired
  UPDATE ceu_documents
  SET status = 'expired'
  WHERE retention_until < CURRENT_DATE
    AND status != 'expired';

  -- Log for audit
  INSERT INTO ceu_document_access_log (document_id, access_type, accessed_at)
  SELECT id, 'auto_expire', NOW()
  FROM ceu_documents
  WHERE retention_until < CURRENT_DATE
    AND status = 'expired';
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available) or external scheduler
SELECT cron.schedule('retention-check', '0 2 * * *', 'SELECT process_document_retention()');
```

### Archive Export

```typescript
async function exportForArchive(orgId: string, dateRange: { start: Date; end: Date }) {
  // 1. Get all documents in range
  const documents = await supabase
    .from('ceu_documents')
    .select('*')
    .eq('organization_id', orgId)
    .gte('activity_date', dateRange.start)
    .lte('activity_date', dateRange.end);

  // 2. Create ZIP archive
  const archive = new JSZip();

  for (const doc of documents.data) {
    const file = await supabase.storage
      .from('ceu-documents')
      .download(doc.storage_path);

    archive.file(`${doc.category}/${doc.file_name}`, file.data);
  }

  // 3. Add manifest
  archive.file('manifest.json', JSON.stringify({
    exportDate: new Date(),
    dateRange,
    documentCount: documents.data.length,
    documents: documents.data.map(d => ({
      id: d.id,
      title: d.title,
      category: d.category,
      activityDate: d.activity_date
    }))
  }));

  return archive.generateAsync({ type: 'blob' });
}
```

---

## UI Components Needed

1. **Document Upload Widget**
   - Drag-and-drop support
   - Category selection
   - Link to CEU record/workshop
   - Progress indicator

2. **Compliance Dashboard**
   - Visual checklist per CEU record
   - Missing documents highlighted
   - Quick upload for missing items

3. **Document Browser**
   - Filter by category, date, interpreter
   - Preview capability
   - Bulk actions (download, export)

4. **Certificate Generator**
   - Template selection
   - Preview before generation
   - Batch generation for workshops

5. **Retention Manager** (Admin only)
   - Documents approaching expiration
   - Archive export tools
   - Audit log viewer

---

## Next Steps

1. Create Supabase migration for schema
2. Set up storage buckets with policies
3. Implement document upload API
4. Build certificate generation service
5. Create compliance checking cron job
6. Develop UI components
7. Add export functionality for RID reviews
