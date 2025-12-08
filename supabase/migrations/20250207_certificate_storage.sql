-- ============================================================================
-- CERTIFICATE PDF STORAGE BUCKET
-- Creates Supabase storage bucket for CEU certificate PDFs
-- ============================================================================

-- Create the storage bucket for certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'certificates',
    'certificates',
    false,  -- Private bucket (requires auth)
    5242880,  -- 5MB max file size
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Users can read their own certificates
CREATE POLICY "Users can read own certificates"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'certificates'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
);

-- Policy: Service role can insert certificates (for server-side generation)
CREATE POLICY "Service role can insert certificates"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'certificates'
    AND (
        auth.role() = 'service_role'
        OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
);

-- Policy: Admins can read all certificates
CREATE POLICY "Admins can read all certificates"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'certificates'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================================================
-- FUNCTION TO GET SIGNED URL FOR CERTIFICATE PDF
-- ============================================================================

CREATE OR REPLACE FUNCTION get_certificate_pdf_url(
    p_certificate_id UUID,
    p_expiry_seconds INTEGER DEFAULT 3600
)
RETURNS TEXT AS $$
DECLARE
    v_storage_path TEXT;
    v_user_id UUID;
    v_requesting_user UUID;
BEGIN
    v_requesting_user := auth.uid();

    -- Get certificate info
    SELECT pdf_storage_path, user_id
    INTO v_storage_path, v_user_id
    FROM ceu_certificates
    WHERE id = p_certificate_id;

    IF v_storage_path IS NULL THEN
        RETURN NULL;
    END IF;

    -- Check access: user can access their own, admins can access all
    IF v_requesting_user != v_user_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles
            WHERE id = v_requesting_user
            AND role IN ('admin', 'super_admin')
        ) THEN
            RAISE EXCEPTION 'Access denied';
        END IF;
    END IF;

    -- Return the storage path (actual signed URL generation happens in application code)
    RETURN v_storage_path;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_certificate_pdf_url IS 'Returns the storage path for a certificate PDF if user has access';
