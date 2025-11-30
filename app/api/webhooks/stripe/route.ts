import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
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
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  console.log(`Processing event: ${event.type}`);

  // Initialize Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Get user_id from metadata
        const userId = session.metadata?.user_id;
        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        // Get subscription details
        const subscriptionId = session.subscription as string;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Determine tier from price
        const priceId = subscription.items.data[0].price.id;
        const tier = getTierFromPriceId(priceId);
        const cycle =
          subscription.items.data[0].price.recurring?.interval === "year"
            ? "yearly"
            : "monthly";

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
          console.error("Error updating profile:", error);
          throw error;
        }

        console.log(`Subscription created for user ${userId}: ${tier} ${cycle}`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by stripe_subscription_id
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (fetchError || !profile) {
          console.error("Could not find user for subscription:", subscription.id);
          break;
        }

        const priceId = subscription.items.data[0].price.id;
        const tier = getTierFromPriceId(priceId);
        const cycle =
          subscription.items.data[0].price.recurring?.interval === "year"
            ? "yearly"
            : "monthly";

        // Determine status
        let status = "active";
        if (subscription.status === "past_due") status = "past_due";
        if (subscription.status === "canceled") status = "canceled";
        if (subscription.status === "trialing") status = "trialing";

        const { error } = await supabase.rpc("apply_subscription_update", {
          p_user_id: profile.id,
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
          console.error("Error updating profile:", error);
          throw error;
        }

        console.log(
          `Subscription updated for user ${profile.id}: ${tier} ${cycle} ${status}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user by stripe_subscription_id
        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (fetchError || !profile) {
          console.error("Could not find user for subscription:", subscription.id);
          break;
        }

        // Downgrade to free tier
        const { error } = await supabase.rpc("apply_subscription_update", {
          p_user_id: profile.id,
          p_status: "canceled",
          p_tier: "free",
          p_cycle: null,
          p_customer_id: subscription.customer as string,
          p_subscription_id: subscription.id,
          p_trial_end: null,
        });

        if (error) {
          console.error("Error updating profile:", error);
          throw error;
        }

        console.log(`Subscription canceled for user ${profile.id}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as any;
        const subscriptionId = typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id;

        if (!subscriptionId) break;

        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (fetchError || !profile) {
          console.error(
            "Could not find user for subscription:",
            subscriptionId
          );
          break;
        }

        // Mark as past_due
        const { error } = await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("id", profile.id);

        if (error) {
          console.error("Error updating profile:", error);
          throw error;
        }

        console.log(`Payment failed for user ${profile.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

// Helper function to map Stripe price IDs to tier names
function getTierFromPriceId(priceId: string): string {
  const BASIC_MONTHLY = process.env.STRIPE_PRICE_BASIC_MONTHLY;
  const BASIC_YEARLY = process.env.STRIPE_PRICE_BASIC_YEARLY;
  const PRO_MONTHLY = process.env.STRIPE_PRICE_PRO_MONTHLY;
  const PRO_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY;

  if (priceId === BASIC_MONTHLY || priceId === BASIC_YEARLY) return "basic";
  if (priceId === PRO_MONTHLY || priceId === PRO_YEARLY) return "pro";

  // Default to basic if unknown
  console.warn(`Unknown price ID: ${priceId}, defaulting to basic`);
  return "basic";
}
