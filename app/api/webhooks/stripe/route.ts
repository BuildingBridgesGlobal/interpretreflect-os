import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Disable body parsing - we need raw body for webhook signature verification
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = supabaseAdmin;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("Webhook: Missing stripe-signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "customer.subscription.created": {
        await handleSubscriptionCreatedOrUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionCreatedOrUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      case "invoice.paid": {
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }

      case "invoice.payment_succeeded": {
        // Same as invoice.paid for our purposes
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }

      case "invoice.payment_failed": {
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    // Return 200 to prevent Stripe from retrying - log error for debugging
    return NextResponse.json({ received: true, error: err.message });
  }
}

// ============================================
// CHECKOUT COMPLETED
// ============================================
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Checkout] Session completed: ${session.id}`);

  // Check if this is a top-up purchase (supports both old "topup" and new "credit_topup")
  if (session.metadata?.type === "topup" || session.metadata?.type === "credit_topup") {
    await handleTopUpPurchase(session);
    return;
  }

  // Handle subscription checkout
  const userId = session.metadata?.user_id || session.metadata?.supabase_user_id;
  if (!userId) {
    console.error("[Checkout] No user_id in session metadata:", session.id);
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("[Checkout] No subscription ID in session:", session.id);
    return;
  }

  // Retrieve full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine tier and cycle
  const priceId = subscription.items.data[0]?.price.id;
  const tier = session.metadata?.tier || getTierFromPriceId(priceId);
  const cycle = session.metadata?.cycle ||
    (subscription.items.data[0]?.price.recurring?.interval === "year" ? "yearly" : "monthly");

  // Update profile via RPC function
  const { error } = await supabase.rpc("apply_subscription_update", {
    p_user_id: userId,
    p_status: "active",
    p_tier: tier,
    p_cycle: cycle,
    p_customer_id: session.customer as string,
    p_subscription_id: subscriptionId,
    p_trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  if (error) {
    console.error("[Checkout] Error updating profile:", error);
    throw error;
  }

  // Add monthly credits for Pro users
  await addMonthlyCreditsForPro(userId, tier);

  console.log(`[Checkout] Subscription created for user ${userId}: ${tier} ${cycle}`);
}

// ============================================
// TOP-UP PURCHASE
// ============================================
async function handleTopUpPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const credits = parseInt(session.metadata?.credits || "0", 10);
  const packageName = session.metadata?.package_name;

  if (!userId || credits <= 0) {
    console.error("[TopUp] Invalid metadata:", session.metadata);
    return;
  }

  // Add top-up credits using RPC function
  const { error } = await supabase.rpc("add_topup_credits", {
    p_user_id: userId,
    p_credits: credits,
    p_stripe_payment_id: session.payment_intent as string,
    p_package_name: packageName,
    p_price_cents: session.amount_total,
  });

  if (error) {
    console.error("[TopUp] Error adding credits:", error);
    throw error;
  }

  console.log(`[TopUp] Added ${credits} credits for user ${userId}`);
}

// ============================================
// SUBSCRIPTION CREATED/UPDATED
// ============================================
async function handleSubscriptionCreatedOrUpdated(subscription: Stripe.Subscription) {
  console.log(`[Subscription] Updated: ${subscription.id} (status: ${subscription.status})`);

  // Try to find user from metadata first
  let userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id;

  // If no metadata, look up by subscription ID in database
  if (!userId) {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (fetchError || !profile) {
      // Try by customer ID
      const { data: profileByCustomer } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", subscription.customer as string)
        .single();

      if (!profileByCustomer) {
        console.error("[Subscription] Could not find user for subscription:", subscription.id);
        return;
      }
      userId = profileByCustomer.id;
    } else {
      userId = profile.id;
    }
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tier = subscription.metadata?.tier || getTierFromPriceId(priceId);
  const cycle = subscription.metadata?.cycle ||
    (subscription.items.data[0]?.price.recurring?.interval === "year" ? "yearly" : "monthly");

  // Map Stripe status to our status
  let status = "active";
  if (subscription.status === "past_due") status = "past_due";
  if (subscription.status === "canceled") status = "canceled";
  if (subscription.status === "unpaid") status = "past_due";
  if (subscription.status === "incomplete") status = "incomplete";
  if (subscription.status === "incomplete_expired") status = "canceled";
  // Note: trialing status maps to active

  const { error } = await supabase.rpc("apply_subscription_update", {
    p_user_id: userId,
    p_status: status,
    p_tier: tier,
    p_cycle: cycle,
    p_customer_id: subscription.customer as string,
    p_subscription_id: subscription.id,
    p_trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  if (error) {
    console.error("[Subscription] Error updating profile:", error);
    throw error;
  }

  console.log(`[Subscription] Updated user ${userId}: ${tier} ${cycle} (${status})`);
}

// ============================================
// SUBSCRIPTION DELETED
// ============================================
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log(`[Subscription] Deleted: ${subscription.id}`);

  // Try to find user from metadata first
  let userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id;

  // If no metadata, look up by subscription ID in database
  if (!userId) {
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (fetchError || !profile) {
      console.error("[Subscription] Could not find user for deleted subscription:", subscription.id);
      return;
    }
    userId = profile.id;
  }

  // Downgrade to free tier
  const { error } = await supabase.rpc("apply_subscription_update", {
    p_user_id: userId,
    p_status: "canceled",
    p_tier: "free",
    p_cycle: null,
    p_customer_id: subscription.customer as string,
    p_subscription_id: subscription.id,
    p_trial_end: null,
  });

  if (error) {
    console.error("[Subscription] Error downgrading profile:", error);
    throw error;
  }

  console.log(`[Subscription] Canceled for user ${userId}, downgraded to free`);
}

// ============================================
// INVOICE PAID (Recurring Payment Success)
// ============================================
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;

  // Only process subscription invoices (not one-time payments)
  // subscription_cycle = recurring payment, subscription_create = first payment
  if (!["subscription_cycle", "subscription_create"].includes(invoiceData.billing_reason)) {
    console.log(`[Invoice] Skipping non-subscription invoice: ${invoiceData.billing_reason}`);
    return;
  }

  const subscriptionId = typeof invoiceData.subscription === "string"
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) {
    console.log("[Invoice] No subscription ID in invoice");
    return;
  }

  // Find user by subscription ID
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, subscription_tier")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (fetchError || !profile) {
    // Try to get from subscription metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id;

    if (userId) {
      // Ensure subscription status is active
      await supabase
        .from("profiles")
        .update({ subscription_status: "active" })
        .eq("id", userId);

      // Add monthly credits if Pro
      const tier = subscription.metadata?.tier || getTierFromPriceId(subscription.items.data[0]?.price.id);
      if (invoiceData.billing_reason === "subscription_cycle") {
        await addMonthlyCreditsForPro(userId, tier);
      }
      console.log(`[Invoice] Payment succeeded for user ${userId} (from metadata)`);
    } else {
      console.error("[Invoice] Could not find user for subscription:", subscriptionId);
    }
    return;
  }

  // Update status to active (in case it was past_due)
  await supabase
    .from("profiles")
    .update({ subscription_status: "active" })
    .eq("id", profile.id);

  // Add monthly credits for Pro users on billing cycle (not on first payment - that's handled in checkout)
  if (invoiceData.billing_reason === "subscription_cycle") {
    await addMonthlyCreditsForPro(profile.id, profile.subscription_tier);
  }

  console.log(`[Invoice] Payment succeeded for user ${profile.id}`);
}

// ============================================
// PAYMENT FAILED
// ============================================
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = typeof invoiceData.subscription === "string"
    ? invoiceData.subscription
    : invoiceData.subscription?.id;

  if (!subscriptionId) return;

  // Find user by subscription ID
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (fetchError || !profile) {
    // Try to get from subscription metadata
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata?.user_id || subscription.metadata?.supabase_user_id;

    if (userId) {
      await supabase
        .from("profiles")
        .update({ subscription_status: "past_due" })
        .eq("id", userId);
      console.log(`[Invoice] Payment failed for user ${userId} (from metadata)`);
    } else {
      console.error("[Invoice] Could not find user for failed payment:", subscriptionId);
    }
    return;
  }

  // Mark as past_due
  await supabase
    .from("profiles")
    .update({ subscription_status: "past_due" })
    .eq("id", profile.id);

  console.log(`[Invoice] Payment failed for user ${profile.id}`);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Map Stripe price IDs to tier names
function getTierFromPriceId(priceId: string): string {
  if (!priceId) return "free";

  // Environment variables for current prices
  const GROWTH_MONTHLY = process.env.STRIPE_PRICE_GROWTH_MONTHLY;
  const GROWTH_YEARLY = process.env.STRIPE_PRICE_GROWTH_YEARLY;
  const PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const PRO_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY;

  // Legacy Pro prices (grandfathered users at $25/month or $250/year)
  const PRO_MONTHLY_LEGACY = "price_1SYeJ8IouyG60O9haPEp6P1H";
  const PRO_YEARLY_LEGACY = "price_1SYeJ8IouyG60O9hkAn4L26v";

  // Check for Growth tier
  if (priceId === GROWTH_MONTHLY || priceId === GROWTH_YEARLY) return "growth";

  // Check for Pro tier (new prices)
  if (priceId === PRO_MONTHLY || priceId === PRO_YEARLY) return "pro";

  // Check for legacy Pro tier (grandfathered users still get Pro benefits)
  if (priceId === PRO_MONTHLY_LEGACY || priceId === PRO_YEARLY_LEGACY) {
    console.log(`[Tier] Legacy Pro price detected: ${priceId}`);
    return "pro";
  }

  // Default to free if unknown
  console.warn(`[Tier] Unknown price ID: ${priceId}, defaulting to free`);
  return "free";
}

// Add monthly credits for Growth and Pro users
async function addMonthlyCredits(userId: string, tier: string) {
  // Only Growth and Pro tiers get monthly credits
  if (tier !== "pro" && tier !== "growth") return;

  try {
    const { error } = await supabase.rpc("add_monthly_credits", { p_user_id: userId });
    if (error) {
      console.error("[Credits] Error adding monthly credits:", error);
    } else {
      console.log(`[Credits] Added monthly credits for ${tier} user ${userId}`);
    }
  } catch (error) {
    console.error("[Credits] Exception adding monthly credits:", error);
    // Non-critical - don't fail the webhook
  }
}

// Alias for backwards compatibility
const addMonthlyCreditsForPro = addMonthlyCredits;
