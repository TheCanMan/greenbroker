import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get contractor's Stripe customer ID
    const { data: contractor } = await supabase
      .from("contractors")
      .select("stripe_customer_id")
      .eq("profile_id", user.id)
      .single();

    if (!contractor?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing account found" }, { status: 404 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const session = await stripe.billingPortal.sessions.create({
      customer: contractor.stripe_customer_id,
      return_url: `${appUrl}/dashboard/contractor/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: "Failed to open billing portal" }, { status: 500 });
  }
}
