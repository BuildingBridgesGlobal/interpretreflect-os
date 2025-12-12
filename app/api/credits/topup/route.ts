import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Top-up package configurations with actual Stripe price IDs
const TOPUP_PACKAGES = {
  small: {
    credits: 2,
    ceu_value: 0.1,
    price_cents: 1500, // $15
    stripe_price_id: "price_1SdRWPIouyG60O9hrSnYiw90",
    name: "2 Credits",
    description: "0.1 CEUs - Full price",
  },
  medium: {
    credits: 4,
    ceu_value: 0.2,
    price_cents: 2700, // $27 (10% off from $30)
    stripe_price_id: "price_1SdRXZIouyG60O9hnV3nFaT1",
    name: "4 Credits",
    description: "0.2 CEUs - 10% off",
  },
  large: {
    credits: 8,
    ceu_value: 0.4,
    price_cents: 4800, // $48 (20% off from $60)
    stripe_price_id: "price_1SdRYyIouyG60O9h1PWdM6FD",
    name: "8 Credits",
    description: "0.4 CEUs - 20% off",
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
    // Support both "package" (frontend) and "package_name" for backwards compat
    const package_name = body.package || body.package_name;
    const { success_url, cancel_url } = body;

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

    // Allow both Pro and Growth users to purchase top-ups
    if (profile.subscription_tier !== "pro" && profile.subscription_tier !== "growth") {
      return NextResponse.json(
        { error: "Top-up credits are only available for Pro and Growth subscribers" },
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

    // Create Stripe Checkout Session for one-time payment using actual Stripe price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: packageConfig.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        package_name: package_name,
        credits: packageConfig.credits.toString(),
        type: "credit_topup",
      },
      success_url: success_url || `${process.env.NEXT_PUBLIC_APP_URL}/ceu?tab=credits&topup=success`,
      cancel_url: cancel_url || `${process.env.NEXT_PUBLIC_APP_URL}/ceu?tab=credits`,
    });

    return NextResponse.json({
      success: true,
      url: session.url,
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
