-- PART 3: Create functions
-- Run this AFTER part 2

CREATE OR REPLACE FUNCTION get_ceu_admin_dashboard()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'overview', (
            SELECT json_build_object(
                'total_certificates', COUNT(*),
                'total_participants', COUNT(DISTINCT user_id),
                'total_ceus', COALESCE(SUM(ceu_value), 0),
                'pending_submission', COUNT(*) FILTER (WHERE rid_submitted_at IS NULL),
                'submitted_this_month', COUNT(*) FILTER (
                    WHERE rid_submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
                ),
                'overdue_count', COUNT(*) FILTER (
                    WHERE rid_submitted_at IS NULL
                    AND issued_at < (CURRENT_DATE - INTERVAL '45 days')
                )
            )
            FROM ceu_certificates
            WHERE status = 'active'
        ),
        'deadline_alerts', (
            SELECT COALESCE(json_agg(alert ORDER BY days_until_deadline ASC), '[]'::json)
            FROM (
                SELECT
                    certificate_number,
                    participant_name,
                    module_title,
                    ceu_value,
                    issued_at,
                    days_since_issued::integer,
                    days_until_deadline::integer,
                    deadline_status
                FROM v_ceu_deadline_tracking
                WHERE rid_submitted_at IS NULL
                AND days_until_deadline <= 14
                LIMIT 10
            ) alert
        ),
        'monthly_summary', (
            SELECT COALESCE(json_agg(m ORDER BY month DESC), '[]'::json)
            FROM (
                SELECT * FROM v_ceu_monthly_summary
                LIMIT 12
            ) m
        ),
        'grievances', (
            SELECT json_build_object(
                'open', COUNT(*) FILTER (WHERE status = 'open'),
                'in_review', COUNT(*) FILTER (WHERE status = 'in_review'),
                'resolved_this_month', COUNT(*) FILTER (
                    WHERE status = 'resolved'
                    AND resolved_at >= DATE_TRUNC('month', CURRENT_DATE)
                )
            )
            FROM ceu_grievances
        ),
        'evaluations', (
            SELECT json_build_object(
                'total', COUNT(*),
                'this_month', COUNT(*) FILTER (
                    WHERE submitted_at >= DATE_TRUNC('month', CURRENT_DATE)
                ),
                'avg_rating', ROUND(AVG(
                    (q1_objectives_clear + q2_content_relevant + q3_applicable_to_work + q4_presenter_effective) / 4.0
                )::numeric, 2)
            )
            FROM ceu_evaluations
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION submit_ceu_batch_to_rid(
    p_certificate_ids UUID[],
    p_admin_id UUID,
    p_batch_id VARCHAR DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_batch_id VARCHAR;
    v_count INTEGER;
BEGIN
    v_batch_id := COALESCE(p_batch_id, 'RID-' || TO_CHAR(NOW(), 'YYYY-MM-DD-HH24MI'));

    UPDATE ceu_certificates
    SET
        rid_submitted_at = NOW(),
        rid_submitted_by = p_admin_id,
        rid_submission_batch = v_batch_id,
        updated_at = NOW()
    WHERE id = ANY(p_certificate_ids)
    AND rid_submitted_at IS NULL
    AND status = 'active';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'batch_id', v_batch_id,
        'certificates_submitted', v_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
