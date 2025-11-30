-- ============================================================================
-- Update billing_prices with TEST MODE Stripe price IDs
-- ============================================================================

-- Update Basic Monthly (user-created)
UPDATE public.billing_prices
SET
  stripe_price_id = 'price_1SYykGIouyG60O9hTQJUJoIH',
  stripe_product_id = 'prod_TW0oN52xzK3sbK'
WHERE tier = 'basic' AND cycle = 'monthly';

-- Update Basic Yearly (user-created)
UPDATE public.billing_prices
SET
  stripe_price_id = 'price_1SYyl4IouyG60O9heBsgNY4B',
  stripe_product_id = 'prod_TW0oN52xzK3sbK'
WHERE tier = 'basic' AND cycle = 'yearly';

-- Update Pro Monthly
UPDATE public.billing_prices
SET
  stripe_price_id = 'price_1SSnIiIouyG60O9hiy7LNsof',
  stripe_product_id = 'prod_TPcXPWMsuo9nUd'
WHERE tier = 'pro' AND cycle = 'monthly';

-- Update Pro Yearly
UPDATE public.billing_prices
SET
  stripe_price_id = 'price_1SYyldIouyG60O9hY29FIb0r',
  stripe_product_id = 'prod_TPcXPWMsuo9nUd'
WHERE tier = 'pro' AND cycle = 'yearly';

-- Verify the updates
SELECT tier, cycle, display_name, stripe_price_id, stripe_product_id, price_cents, is_active
FROM public.billing_prices
ORDER BY tier, cycle;
