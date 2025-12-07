import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

  const supabase = supabaseAdmin;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if this is a top-up purchase
        if (session.metadata?.type === "topup") {
          const userId = session.metadata.supabase_user_id;
          const credits = parseInt(session.metadata.credits || "0", 10);
          const packageName = session.metadata.package_name;

          if (!userId || credits <= 0) {
            console.error("Invalid top-up metadata:", session.metadata);
            break;
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
            console.error("Error adding top-up credits:", error);
            throw error;
          }

          console.log(`Added ${credits} top-up credits for user ${userId}`);
          break;
        }

        // Handle subscription checkout
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

        // Add monthly credits for Pro users
        await addMonthlyCreditsForPro(supabase, userId, tier);

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

        // Determine status (no more trialing - map to active)
        let status = "active";
        if (subscription.status === "past_due") status = "past_due";
        if (subscription.status === "canceled") status = "canceled";
        // Note: trialing status now maps to active since we removed trial tier

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

      case "invoice.paid": {
        // Handle successful recurring payment - add monthly credits
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceData = invoice as any;

        // Only process subscription invoices (not one-time payments)
        if (invoiceData.billing_reason !== "subscription_cycle") break;

        const subscriptionId = typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id;

        if (!subscriptionId) break;

        const { data: profile, error: fetchError } = await supabase
          .from("profiles")
          .select("id, subscription_tier")
          .eq("stripe_subscription_id", subscriptionId)
          .single();

        if (fetchError || !profile) {
          console.error("Could not find user for subscription:", subscriptionId);
          break;
        }

        // Add monthly credits for Pro users on billing cycle
        await addMonthlyCreditsForPro(supabase, profile.id, profile.subscription_tier);

        console.log(`Invoice paid for user ${profile.id}, credits refreshed`);
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
  // Environment variables for new prices
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
    console.log(`Legacy Pro price detected: ${priceId} - treating as Pro tier`);
    return "pro";
  }

  // Default to free if unknown (no paid subscription = free tier)
  console.warn(`Unknown price ID: ${priceId}, defaulting to free`);
  return "free";
}

// Helper function to add monthly credits for Pro users
async function addMonthlyCreditsForPro(supabase: any, userId: string, tier: string) {
  if (tier !== "pro") return;

  try {
    await supabase.rpc("add_monthly_credits", { p_user_id: userId });
    console.log(`Added 4 monthly credits for Pro user ${userId}`);
  } catch (error) {
    console.error("Error adding monthly credits:", error);
    // Non-critical - don't fail the webhook
  }
}
