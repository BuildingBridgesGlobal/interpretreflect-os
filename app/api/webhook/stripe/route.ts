import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const tier = session.metadata?.tier;
  const cycle = session.metadata?.cycle;

  if (!userId || !tier || !cycle) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update user profile
  await supabase.rpc("apply_subscription_update", {
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

  console.log(`Subscription activated for user ${userId}: ${tier} ${cycle}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;
  const tier = subscription.metadata?.tier;
  const cycle = subscription.metadata?.cycle;

  if (!userId) {
    console.error("Missing user ID in subscription metadata:", subscription.id);
    return;
  }

  let status: string;
  switch (subscription.status) {
    case "active":
      status = "active";
      break;
    case "past_due":
      status = "past_due";
      break;
    case "canceled":
      status = "canceled";
      break;
    case "trialing":
      status = "trialing";
      break;
    default:
      status = subscription.status;
  }

  await supabase.rpc("apply_subscription_update", {
    p_user_id: userId,
    p_status: status,
    p_tier: tier || "basic",
    p_cycle: cycle || "monthly",
    p_customer_id: subscription.customer as string,
    p_subscription_id: subscription.id,
    p_trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  });

  console.log(`Subscription updated for user ${userId}: ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) {
    console.error("Missing user ID in subscription metadata:", subscription.id);
    return;
  }

  // Set user back to trial tier with canceled status
  await supabase
    .from("profiles")
    .update({
      subscription_tier: "trial",
      subscription_status: "canceled",
      subscription_ends_at: new Date().toISOString(),
    })
    .eq("id", userId);

  console.log(`Subscription canceled for user ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) return;

  // Update subscription status to active
  await supabase
    .from("profiles")
    .update({ subscription_status: "active" })
    .eq("id", userId);

  console.log(`Payment succeeded for user ${userId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.supabase_user_id;

  if (!userId) return;

  // Update subscription status to past_due
  await supabase
    .from("profiles")
    .update({ subscription_status: "past_due" })
    .eq("id", userId);

  console.log(`Payment failed for user ${userId}`);
}
