import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  tier: z.enum(["BASIC", "PROFESSIONAL", "ELITE"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // ─── Auth check ────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── Validate input ────────────────────────────────────────────────────
    const body = await request.json();
    const { tier, successUrl, cancelUrl } = schema.parse(body);

    const product = STRIPE_PRODUCTS.subscriptions[tier];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    // ─── Get or create Stripe customer ────────────────────────────────────
    let stripeCustomerId: string | undefined;

    // Look up existing contractor record
    const { data: contractor } = await supabase
      .from("contractors")
      .select("stripe_customer_id, profile_id")
      .eq("profile_id", user.id)  // Note: profile_id = profile.id not user.id
      .single();

    if (contractor?.stripe_customer_id) {
      stripeCustomerId = contractor.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
          app: "greenbroker",
        },
      });
      stripeCustomerId = customer.id;

      // Save to contractor record
      if (contractor) {
        await supabase
          .from("contractors")
          .update({ stripe_customer_id: customer.id })
          .eq("profile_id", user.id);
      }
    }

    // ─── Create checkout session ───────────────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: product.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl ?? `${appUrl}/dashboard/contractor/billing?success=true`,
      cancel_url: cancelUrl ?? `${appUrl}/dashboard/contractor/billing?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier,
        },
        trial_period_days: 7, // 7-day free trial for all tiers
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        supabase_user_id: user.id,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error("Stripe checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
