import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const { price_id, mode, tier, cycle, apply_student_discount } = body;

    if (!price_id || !mode) {
      return NextResponse.json(
        { error: "Missing required fields: price_id, mode" },
        { status: 400 }
      );
    }

    // Stripe Promotion Code ID for STUDENT50 (50% off forever)
    const STUDENT_PROMO_CODE_ID = "promo_1SYf081ouyG60O9h";

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
      // Auto-apply student discount using promotion code ID
      discounts: apply_student_discount
        ? [
            {
              promotion_code: STUDENT_PROMO_CODE_ID,
            },
          ]
        : undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      metadata: {
        supabase_user_id: user.id,
        tier,
        cycle,
        student_discount_applied: apply_student_discount ? "true" : "false",
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier,
          cycle,
          student_discount_applied: apply_student_discount ? "true" : "false",
        },
      },
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
