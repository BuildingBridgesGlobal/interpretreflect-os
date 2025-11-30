# Student Discount Implementation

## Overview
The STUDENT50 promotion code has been integrated into InterpretReflect's checkout flow with automatic application.

## Stripe Setup (Completed ✅)

**Promotion Code Created:**
- **Code**: STUDENT50
- **Promotion ID**: `promo_1SYf081ouyG60O9h`
- **Discount**: 50% off
- **Duration**: Forever
- **Status**: Active

## How It Works

### 1. User Experience

When upgrading, users see a checkbox:
```
☑️ I'm a student or new interpreter (first 2 years)
   Get 50% off your subscription automatically
   [-50%]
```

**When checked:**
- Price preview updates to show 50% discount
- Original price shown with strikethrough
- Discounted price displayed prominently
- No coupon code input needed

### 2. Backend Flow

```typescript
// UpgradeModal.tsx
const applyStudentDiscount = priceInfo.should_apply_student_discount || isStudent;

// Sent to API
{
  price_id: "price_1SWimuIouyG60O9hP3ZBRPWQ",
  mode: "subscription",
  tier: "basic",
  cycle: "monthly",
  apply_student_discount: true
}

// API Route (create-checkout/route.ts)
const STUDENT_PROMO_CODE_ID = "promo_1SYf081ouyG60O9h";

const session = await stripe.checkout.sessions.create({
  // ... other settings
  discounts: apply_student_discount ? [{
    promotion_code: STUDENT_PROMO_CODE_ID
  }] : undefined
});
```

### 3. Auto-Detection

The system automatically applies the discount if:

1. **Student with .edu email**: User has verified `.edu` email in profile
2. **New interpreter**: User's `certification_date` is within 2 years AND `is_new_interpreter` flag is true

This is checked via the `get_price_for_user()` function which returns `should_apply_student_discount: boolean`

## Files Modified

### Components
- **UpgradeModal.tsx**
  - Replaced coupon input field with checkbox
  - Added real-time discount preview
  - Shows strikethrough price when discount applied
  - Sends `apply_student_discount` boolean to API

### API Routes
- **create-checkout/route.ts**
  - Added `STUDENT_PROMO_CODE_ID` constant
  - Uses Stripe Promotion Code ID instead of coupon code
  - Applies discount automatically when checkbox is checked
  - Tracks discount in subscription metadata

### Documentation
- **STRIPE_SETUP.md** - Updated with promotion code details
- **STUDENT_DISCOUNT_IMPLEMENTATION.md** - This file

## Testing

### Manual Testing Flow

1. **Sign up** as new user
2. Click **"Upgrade"** button
3. Select **Basic or Pro** tier
4. Select **Monthly or Yearly** billing
5. **Check** the student checkbox
6. Verify price updates to 50% off
7. Click **"Continue to Checkout"**
8. On Stripe Checkout page, verify:
   - Student Discount: -50% appears
   - Correct discounted price shown
9. Complete checkout with test card: `4242 4242 4242 4242`
10. Verify webhook updates subscription in Supabase

### Expected Results

**Without discount:**
- Basic Monthly: $12.00/mo
- Basic Yearly: $120.00/yr
- Pro Monthly: $25.00/mo
- Pro Yearly: $250.00/yr

**With STUDENT50 discount:**
- Basic Monthly: ~~$12.00~~ → **$6.00/mo**
- Basic Yearly: ~~$120.00~~ → **$60.00/yr**
- Pro Monthly: ~~$25.00~~ → **$12.50/mo**
- Pro Yearly: ~~$250.00~~ → **$125.00/yr**

## Edge Cases Handled

1. **User unchecks box**: Price updates back to full amount immediately
2. **Already eligible**: If user is auto-detected as eligible, checkbox is still shown for manual confirmation
3. **Stripe checkout**: Discount appears automatically in Stripe UI, no manual input needed
4. **Subscription updates**: Discount tracked in metadata for reporting

## Admin & Reporting

To see discount usage in Stripe Dashboard:
1. Go to **Promotion codes** → **STUDENT50**
2. View **Redemptions** count
3. Click to see all subscriptions using this code
4. Filter reports by promotion code

## Future Enhancements

Possible improvements:
- Email verification for .edu addresses
- Certification date upload for new interpreters
- Automatic expiration after 2 years for new interpreter discount
- Admin panel to review discount eligibility
- Usage analytics dashboard

## Support

If users have issues:
1. Verify they're checking the student checkbox
2. Check if discount appears in Stripe Checkout
3. Confirm promotion code is still active in Stripe Dashboard
4. Review webhook logs if subscription doesn't update properly
