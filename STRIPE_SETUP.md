# Stripe Integration Setup Guide

## Overview
InterpretReflect uses Stripe for subscription billing with the following structure:

**Products:**
- InterpretReflect Basic (`prod_Stad2yERSNi311`)
  - $12/month (`price_1SWimuIouyG60O9hP3ZBRPWQ`)
  - $120/year (`price_1SWioKIouyG60O9hwao2wPsz`)

- InterpretReflect Pro (`prod_TVfeaZYeM9VqlJ`)
  - $25/month (`price_1SYeJ8IouyG60O9haPEp6P1H`)
  - $250/year (`price_1SYeJ8IouyG60O9hkAn4L26v`)

**Promotion Code:**
- Code: `STUDENT50` - 50% off forever (for students and new interpreters)
- Promotion ID: `promo_1SYf081ouyG60O9h` (used in code for auto-apply)

## Setup Steps

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_... (or sk_live_ for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_)
STRIPE_WEBHOOK_SECRET=whsec_... (from webhook setup below)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or your production URL)
```

### 2. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

### 3. Apply Database Migrations

```bash
npx supabase db push
```

This will apply:
- `20250128000001_add_user_profiles_billing.sql` - User profiles with subscription fields
- `20250128000002_billing_prices.sql` - Billing prices table with your Stripe Price IDs

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter webhook URL:
   - **Local testing**: Use Stripe CLI (see below)
   - **Production**: `https://yourdomain.com/api/webhook/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 5. Local Testing with Stripe CLI

Install Stripe CLI:
```bash
# Mac
brew install stripe/stripe-cli/stripe

# Windows
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

This will output a webhook signing secret - add it to your `.env.local`

### 6. Test the Flow

1. **Sign up** → User gets 7-day trial automatically
2. **Click "Upgrade"** → Opens UpgradeModal
3. **Select plan** → Basic or Pro, Monthly or Yearly
4. **Enter coupon** (optional) → `STUDENT50` for 50% off
5. **Checkout** → Redirects to Stripe Checkout
6. **Payment** → Stripe processes payment
7. **Webhook** → Updates user's subscription in Supabase
8. **Redirect** → Returns to dashboard with active subscription

## Usage in Components

### Trigger Upgrade Flow

```tsx
import UpgradeModal from "@/components/UpgradeModal";
import { useState } from "react";

export default function Dashboard() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <button onClick={() => setShowUpgrade(true)}>
        Upgrade to Pro
      </button>

      <UpgradeModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}
```

The modal includes:
- Plan selection (Basic or Pro)
- Billing cycle selection (Monthly or Yearly)
- Student discount checkbox (auto-applies 50% off)
- Real-time price preview with discount calculation

### Check User's Subscription

```tsx
const { data: profile } = await supabase
  .from("profiles")
  .select("subscription_tier, subscription_status, trial_ends_at")
  .eq("id", user.id)
  .single();

if (profile.subscription_tier === "trial") {
  // Show trial banner
} else if (profile.subscription_tier === "basic") {
  // Basic tier features
} else if (profile.subscription_tier === "pro") {
  // Pro tier features
}
```

### Student Discount

The student discount is handled in two ways:

1. **Auto-detection**: If user has `.edu` email or is marked as new interpreter in their profile
2. **Manual checkbox**: User checks "I'm a student" in the upgrade modal

When applied, the Stripe Promotion Code (`promo_1SYf081ouyG60O9h`) is automatically included in the checkout session, showing 50% off instantly in Stripe Checkout.

## API Routes

### `/api/create-checkout` (POST)
Creates a Stripe Checkout session

**Request:**
```json
{
  "price_id": "price_1SWimuIouyG60O9hP3ZBRPWQ",
  "mode": "subscription",
  "tier": "basic",
  "cycle": "monthly",
  "apply_student_discount": true // optional, auto-applies promo code
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### `/api/webhook/stripe` (POST)
Handles Stripe webhooks to update subscription status

## Supabase Functions

### `get_price_for_user(user_id, tier, cycle)`
Returns the correct Stripe Price ID and indicates if student discount should be applied

### `apply_subscription_update(...)`
Updates user's subscription details (called by webhook)

### `is_student_eligible(user_id)`
Checks if user qualifies for student/new interpreter discount

## Testing Stripe Integration

### Test Cards
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires authentication: 4000 0025 0000 3155
```

### Test Flow
1. Create test user account
2. Trigger upgrade flow
3. Use test card to complete checkout
4. Verify webhook updates subscription in Supabase
5. Check dashboard shows correct subscription tier

## Production Checklist

- [ ] Switch to live Stripe keys (`sk_live_...` and `pk_live_...`)
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Configure production webhook endpoint in Stripe
- [ ] Test end-to-end flow with live mode (small amount)
- [ ] Set up Stripe billing alerts
- [ ] Configure customer email notifications in Stripe
- [ ] Test subscription cancellation flow
- [ ] Test payment failure handling

## Troubleshooting

**Webhook not firing:**
- Check Stripe CLI is running (`stripe listen`)
- Verify webhook secret matches `.env.local`
- Check webhook endpoint is accessible

**Subscription not updating:**
- Check webhook logs in Stripe Dashboard
- Verify `supabase_user_id` in subscription metadata
- Check Supabase logs for RPC errors

**Checkout session fails:**
- Verify Stripe Price IDs are correct
- Check customer already has active subscription
- Ensure coupon code exists and is valid

## Support

For Stripe-specific issues:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For InterpretReflect integration:
- Check application logs
- Review Supabase function logs
- Verify migration was applied correctly
