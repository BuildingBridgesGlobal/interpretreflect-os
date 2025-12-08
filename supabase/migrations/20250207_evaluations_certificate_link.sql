-- ============================================================================
-- ADD CERTIFICATE_ID TO CEU_EVALUATIONS
-- Links evaluations to their resulting certificate
-- ============================================================================

ALTER TABLE ceu_evaluations ADD COLUMN IF NOT EXISTS certificate_id UUID REFERENCES ceu_certificates(id);

CREATE INDEX IF NOT EXISTS idx_ceu_evaluations_certificate ON ceu_evaluations(certificate_id);

COMMENT ON COLUMN ceu_evaluations.certificate_id IS 'The certificate issued after this evaluation was completed';
