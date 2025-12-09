import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Top-up package configurations
const TOPUP_PACKAGES = {
  small: {
    credits: 2,
    price_cents: 500,
    stripe_price_id: process.env.STRIPE_PRICE_TOPUP_SMALL || "price_topup_small",
    name: "2 Credits",
    description: "$2.50 per credit",
  },
  medium: {
    credits: 4,
    price_cents: 800,
    stripe_price_id: process.env.STRIPE_PRICE_TOPUP_MEDIUM || "price_topup_medium",
    name: "4 Credits",
    description: "$2.00 per credit - Best value",
  },
  large: {
    credits: 8,
    price_cents: 1400,
    stripe_price_id: process.env.STRIPE_PRICE_TOPUP_LARGE || "price_topup_large",
    name: "8 Credits",
    description: "$1.75 per credit",
  },
};

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { package_name, success_url, cancel_url } = body;

    // Validate package
    const packageConfig = TOPUP_PACKAGES[package_name as keyof typeof TOPUP_PACKAGES];
    if (!packageConfig) {
      return NextResponse.json(
        { error: "Invalid package. Choose small, medium, or large." },
        { status: 400 }
      );
    }

    // Check if user is Pro (only Pro users can buy top-ups)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("subscription_tier, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (profile.subscription_tier !== "pro") {
      return NextResponse.json(
        { error: "Top-up credits are only available for Pro subscribers" },
        { status: 403 }
      );
    }

    // Create or get Stripe customer
    let customerId = profile.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create Stripe Checkout Session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Workshop Credits: ${packageConfig.name}`,
              description: packageConfig.description,
            },
            unit_amount: packageConfig.price_cents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        package_name: package_name,
        credits: packageConfig.credits.toString(),
        type: "topup",
      },
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/ceu?topup=success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/ceu`,
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error: any) {
    console.error("Top-up checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch available packages
export async function GET() {
  return NextResponse.json({
    packages: Object.entries(TOPUP_PACKAGES).map(([key, pkg]) => ({
      id: key,
      ...pkg,
    })),
  });
}
