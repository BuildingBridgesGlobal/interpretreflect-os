-- PART 2: Create views
-- Run this AFTER part 1

DROP VIEW IF EXISTS v_ceu_deadline_tracking CASCADE;
DROP VIEW IF EXISTS v_ceu_monthly_summary CASCADE;

CREATE VIEW v_ceu_deadline_tracking AS
SELECT
    c.id,
    c.certificate_number,
    c.user_id,
    p.full_name as participant_name,
    p.email as participant_email,
    p.rid_member_number,
    c.title as module_title,
    c.ceu_value,
    c.rid_category,
    c.activity_code,
    c.completed_at,
    c.issued_at,
    c.rid_submitted_at,
    c.rid_submission_batch,
    EXTRACT(DAY FROM (NOW() - c.issued_at)) as days_since_issued,
    45 - EXTRACT(DAY FROM (NOW() - c.issued_at)) as days_until_deadline,
    CASE
        WHEN c.rid_submitted_at IS NOT NULL THEN 'submitted'
        WHEN EXTRACT(DAY FROM (NOW() - c.issued_at)) > 45 THEN 'overdue'
        WHEN EXTRACT(DAY FROM (NOW() - c.issued_at)) > 30 THEN 'urgent'
        WHEN EXTRACT(DAY FROM (NOW() - c.issued_at)) > 14 THEN 'due_soon'
        ELSE 'on_track'
    END as deadline_status
FROM ceu_certificates c
JOIN profiles p ON p.id = c.user_id
WHERE c.status = 'active'
ORDER BY c.issued_at ASC;

CREATE VIEW v_ceu_monthly_summary AS
SELECT
    DATE_TRUNC('month', c.issued_at) as month,
    TO_CHAR(DATE_TRUNC('month', c.issued_at), 'YYYY-MM') as month_key,
    TO_CHAR(DATE_TRUNC('month', c.issued_at), 'Month YYYY') as month_display,
    COUNT(*) as total_certificates,
    COUNT(DISTINCT c.user_id) as unique_participants,
    SUM(c.ceu_value) as total_ceus,
    COUNT(CASE WHEN c.rid_submitted_at IS NOT NULL THEN 1 END) as submitted_count,
    COUNT(CASE WHEN c.rid_submitted_at IS NULL THEN 1 END) as pending_count,
    COUNT(CASE WHEN p.rid_member_number IS NULL THEN 1 END) as missing_rid_numbers,
    SUM(CASE WHEN c.rid_category = 'Professional Studies' THEN c.ceu_value ELSE 0 END) as ps_ceus,
    SUM(CASE WHEN c.rid_category = 'Power, Privilege & Oppression' THEN c.ceu_value ELSE 0 END) as ppo_ceus,
    SUM(CASE WHEN c.rid_category = 'General Studies' THEN c.ceu_value ELSE 0 END) as gs_ceus
FROM ceu_certificates c
JOIN profiles p ON p.id = c.user_id
WHERE c.status = 'active'
GROUP BY DATE_TRUNC('month', c.issued_at)
ORDER BY month DESC;
