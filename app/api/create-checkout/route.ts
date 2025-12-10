import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = supabaseAdmin;

// Price mapping for tiers
function getPriceIdForTier(tier: string, cycle: string): string | null {
  const priceMap: Record<string, Record<string, string | undefined>> = {
    growth: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
      yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
  };

  return priceMap[tier]?.[cycle] || null;
}

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    let { price_id, mode, tier, cycle } = body;

    // If tier/cycle provided, look up price_id
    if (tier && cycle && !price_id) {
      price_id = getPriceIdForTier(tier, cycle);
      mode = "subscription";

      if (!price_id) {
        return NextResponse.json(
          { error: `No price found for tier: ${tier}, cycle: ${cycle}` },
          { status: 400 }
        );
      }
    }

    if (!price_id || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: either (tier, cycle) or (price_id, mode)" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email || profile?.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: mode as "subscription" | "payment",
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        user_id: user.id,
        supabase_user_id: user.id, // legacy compatibility
        tier: tier || "",
        cycle: cycle || "",
      },
      ...(mode === "subscription" ? {
        subscription_data: {
          metadata: {
            user_id: user.id,
            supabase_user_id: user.id,
            tier: tier || "",
            cycle: cycle || "",
          },
        },
      } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
