-- ============================================================================
-- Diagnostic: Check billing_prices table status
-- ============================================================================

-- Check if table exists and view its data
SELECT
  'Table Data' as check_type,
  tier,
  cycle,
  display_name,
  stripe_price_id,
  price_cents,
  is_active
FROM public.billing_prices
ORDER BY tier, cycle;

-- Check RLS policies
SELECT
  'RLS Policies' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'billing_prices';

-- Check if RLS is enabled
SELECT
  'RLS Status' as check_type,
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'billing_prices';
