-- ============================================================================
-- Safe Fix: Update RLS policy for billing_prices (no table drop)
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can view active prices" ON public.billing_prices;
DROP POLICY IF EXISTS "Anyone can view active prices v2" ON public.billing_prices;

-- Create new policy that allows BOTH anon and authenticated users to read prices
CREATE POLICY "Anyone can view active prices"
  ON public.billing_prices
  FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'billing_prices';
