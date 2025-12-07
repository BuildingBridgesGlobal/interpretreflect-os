# Stripe Setup Checklist for 3-Tier Pricing

## Overview

Migrating from old pricing to new 3-tier structure:

| Old Tier | Old Price | New Tier | New Price |
|----------|-----------|----------|-----------|
| Basic | $12/month | FREE | $0 |
| Pro | $25/month | GROWTH | $15/month |
| - | - | PRO | $30/month |

---

## Step 1: Create Products in Stripe Dashboard

Go to: **Stripe Dashboard > Products**

### Product 1: InterpretReflect Growth
- **Name:** InterpretReflect Growth
- **Description:** Daily support for working interpreters - Unlimited Elya, assignment workflows, insights

### Product 2: InterpretReflect Pro (v2)
- **Name:** InterpretReflect Pro
- **Description:** Full professional toolkit with 4 CEU credits/month

### Product 3: CEU Credit Top-Ups
- **Name:** CEU Credit Top-Ups
- **Description:** Additional CEU credits for Pro subscribers

---

## Step 2: Create Prices for Each Product

### GROWTH Prices (Product: InterpretReflect Growth)

| Price Name | Amount | Billing | Stripe Price ID |
|------------|--------|---------|-----------------|
| Growth Monthly | $15.00 | Monthly recurring | `price_____________` |
| Growth Yearly | $150.00 | Yearly recurring | `price_____________` |

### PRO Prices (Product: InterpretReflect Pro)

| Price Name | Amount | Billing | Stripe Price ID |
|------------|--------|---------|-----------------|
| Pro Monthly | $30.00 | Monthly recurring | `price_____________` |
| Pro Yearly | $300.00 | Yearly recurring | `price_____________` |

### TOP-UP Prices (Product: CEU Credit Top-Ups) - ONE-TIME

| Price Name | Amount | Type | Credits | Stripe Price ID |
|------------|--------|------|---------|-----------------|
| 2 Credits | $5.00 | One-time | 2 | `price_____________` |
| 4 Credits | $8.00 | One-time | 4 | `price_____________` |
| 8 Credits | $14.00 | One-time | 8 | `price_____________` |

---

## Step 3: Update Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# GROWTH tier
STRIPE_PRICE_GROWTH_MONTHLY=price_xxxxxxxxxxxxxxxxxx
STRIPE_PRICE_GROWTH_YEARLY=price_xxxxxxxxxxxxxxxxxx

# PRO tier (new $30 pricing)
STRIPE_PRICE_PRO_MONTHLY=price_xxxxxxxxxxxxxxxxxx
STRIPE_PRICE_PRO_YEARLY=price_xxxxxxxxxxxxxxxxxx

# Top-up credits
STRIPE_PRICE_TOPUP_SMALL=price_xxxxxxxxxxxxxxxxxx
STRIPE_PRICE_TOPUP_MEDIUM=price_xxxxxxxxxxxxxxxxxx
STRIPE_PRICE_TOPUP_LARGE=price_xxxxxxxxxxxxxxxxxx
```

---

## Step 4: Update Migration File

Replace placeholders in `supabase/migrations/20250206_growth_tier_and_credits.sql`:

```sql
-- Find and replace these placeholders with actual Stripe Price IDs:

-- GROWTH
'price_growth_monthly_REPLACE' → 'price_xxxxxxxxxxxxxxxxxx'
'price_growth_yearly_REPLACE' → 'price_xxxxxxxxxxxxxxxxxx'
'prod_growth_REPLACE' → 'prod_xxxxxxxxxxxxxxxxxx'

-- PRO v2
'price_pro_monthly_v2_REPLACE' → 'price_xxxxxxxxxxxxxxxxxx'
'price_pro_yearly_v2_REPLACE' → 'price_xxxxxxxxxxxxxxxxxx'
'prod_pro_v2_REPLACE' → 'prod_xxxxxxxxxxxxxxxxxx'

-- TOP-UPS
'price_topup_small_placeholder' → 'price_xxxxxxxxxxxxxxxxxx'
'price_topup_medium_placeholder' → 'price_xxxxxxxxxxxxxxxxxx'
'price_topup_large_placeholder' → 'price_xxxxxxxxxxxxxxxxxx'
```

---

## Step 5: Configure Stripe Webhook

Ensure your webhook is listening for these events:
- `checkout.session.completed` (subscriptions + top-ups)
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid` (for monthly credit refresh)
- `invoice.payment_failed`

Webhook URL: `https://your-domain.com/api/webhooks/stripe`

---

## Step 6: Run Database Migration

```bash
# Push migration to Supabase
npx supabase db push

# Or if using hosted Supabase, run the migration in SQL Editor
```

---

## Step 7: Handle Existing Subscribers

### Users on old Basic ($12/month):
- They will continue at $12/month until they cancel
- On cancellation, they become FREE tier
- Consider: Email them about new FREE tier (they're overpaying!)

### Users on old Pro ($25/month):
- They will continue at $25/month (grandfathered)
- They get the new 4 credits/month benefit
- The webhook recognizes old Pro price IDs and treats as "pro" tier

### To migrate existing Pro users to new pricing:
Option A: Let Stripe auto-migrate on next billing cycle
Option B: Create a one-time migration in Stripe to move them

---

## Step 8: Archive Old Prices (Optional)

In Stripe Dashboard, archive (don't delete) old prices:
- `price_1SWimuIouyG60O9hP3ZBRPWQ` (Basic Monthly $12)
- `price_1SWioKIouyG60O9hwao2wPsz` (Basic Yearly $120)
- `price_1SYeJ8IouyG60O9haPEp6P1H` (Pro Monthly $25)
- `price_1SYeJ8IouyG60O9hkAn4L26v` (Pro Yearly $250)

**Note:** Don't delete - existing subscriptions still reference these.

---

## Step 9: Update Webhook Handler for Old Prices

The webhook already handles old Pro prices - they map to "pro" tier. But add old prices to env for clarity:

```bash
# Old prices (for existing subscribers)
STRIPE_PRICE_PRO_MONTHLY_LEGACY=price_1SYeJ8IouyG60O9haPEp6P1H
STRIPE_PRICE_PRO_YEARLY_LEGACY=price_1SYeJ8IouyG60O9hkAn4L26v
```

Update `getTierFromPriceId()` in webhook to recognize legacy prices:

```typescript
function getTierFromPriceId(priceId: string): string {
  // New prices
  if (priceId === process.env.STRIPE_PRICE_GROWTH_MONTHLY ||
      priceId === process.env.STRIPE_PRICE_GROWTH_YEARLY) return "growth";
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
      priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return "pro";

  // Legacy Pro prices (grandfathered users)
  if (priceId === 'price_1SYeJ8IouyG60O9haPEp6P1H' ||
      priceId === 'price_1SYeJ8IouyG60O9hkAn4L26v') return "pro";

  return "free";
}
```

---

## Verification Checklist

After setup, verify:

- [ ] Growth Monthly subscription works (creates "growth" tier user)
- [ ] Growth Yearly subscription works
- [ ] Pro Monthly subscription works (creates "pro" tier user with 4 credits)
- [ ] Pro Yearly subscription works
- [ ] Top-up small ($5/2 credits) adds credits to Pro user
- [ ] Top-up medium ($8/4 credits) adds credits to Pro user
- [ ] Top-up large ($14/8 credits) adds credits to Pro user
- [ ] Monthly billing cycle refreshes Pro user credits to 4
- [ ] Existing Pro subscribers still work (legacy prices recognized)
- [ ] Cancellation downgrades user to "free" tier
- [ ] CEU page shows correct credit balance
- [ ] Pricing page shows correct 3-tier structure

---

## Quick Reference: Tier Features

| Feature | FREE | GROWTH | PRO |
|---------|------|--------|-----|
| Elya conversations | 5/month | Unlimited | Unlimited |
| Assignment prep/debrief | No | Yes | Yes |
| AI Insights | No | Yes | Yes |
| Burnout monitoring | No | Yes | Yes |
| CEU Credits | 0 | 0 | 4/month |
| CEU Content Access | No | No | Yes |
| Certificates | No | No | Yes |
| Top-up purchases | No | No | Yes |
