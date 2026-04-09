import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/ratelimit";
import { sendLeadNotificationEmail } from "@/lib/email/resend";

const schema = z.object({
  assessmentId: z.string().cuid(),
  leadTier: z.enum(["STANDARD", "PRE_QUALIFIED", "PREMIUM"]).default("STANDARD"),
});

/**
 * POST /api/leads/purchase
 * Contractor purchases access to a homeowner's assessment.
 *
 * Flow:
 * 1. Validate contractor auth + active subscription
 * 2. Check contractor has credits OR charge their card
 * 3. Create lead record
 * 4. Send lead details email to contractor
 * 5. Notify homeowner
 */
export async function POST(request: NextRequest) {
  // ─── Rate limiting ─────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const rl = rateLimit(ip, RATE_LIMITS.purchase);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many purchase attempts" }, { status: 429 });
  }

  try {
    // ─── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── Validate input ────────────────────────────────────────────────────
    const body = await request.json();
    const { assessmentId, leadTier } = schema.parse(body);

    // ─── Get contractor ────────────────────────────────────────────────────
    const { data: contractor } = await supabase
      .from("contractors")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    if (!contractor) {
      return NextResponse.json(
        { error: "No contractor account found. Apply at /contractors/apply" },
        { status: 403 }
      );
    }

    if (contractor.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your contractor account is pending review. Please wait for approval." },
        { status: 403 }
      );
    }

    // ─── Check for duplicate purchase ─────────────────────────────────────
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("assessment_id", assessmentId)
      .eq("contractor_id", contractor.id)
      .single();

    if (existingLead) {
      return NextResponse.json(
        { error: "You have already purchased this lead", leadId: existingLead.id },
        { status: 409 }
      );
    }

    // ─── Get assessment (verify it exists and is purchasable) ─────────────
    const adminSupabase = createAdminClient();
    const { data: assessment } = await adminSupabase
      .from("home_assessments")
      .select("id, zip, square_footage, primary_heating_fuel, urgency, created_at")
      .eq("id", assessmentId)
      .single();

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const leadProduct = STRIPE_PRODUCTS.leads[leadTier];
    const pricePaid = leadProduct.priceInCents / 100;

    let stripePaymentId: string | null = null;

    // ─── Payment: use credits or charge card ─────────────────────────────
    if (contractor.lead_credits > 0 && contractor.subscription_status === "ACTIVE") {
      // Deduct from subscription credits (no charge)
      await adminSupabase
        .from("contractors")
        .update({ lead_credits: contractor.lead_credits - 1 })
        .eq("id", contractor.id);
    } else if (contractor.stripe_customer_id) {
      // Charge directly via Stripe PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: leadProduct.priceInCents,
        currency: "usd",
        customer: contractor.stripe_customer_id,
        description: `${leadProduct.name} — Assessment ${assessmentId}`,
        metadata: {
          contractor_id: contractor.id,
          assessment_id: assessmentId,
          lead_tier: leadTier,
        },
        confirm: true,
        payment_method: "pm_card_us", // In prod: require contractor to have a saved PM
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/contractor/leads`,
      });
      stripePaymentId = paymentIntent.id;
    } else {
      return NextResponse.json(
        { error: "No payment method on file. Please add a card in billing settings." },
        { status: 402 }
      );
    }

    // ─── Create lead record ────────────────────────────────────────────────
    const { data: lead, error: leadError } = await adminSupabase
      .from("leads")
      .insert({
        assessment_id: assessmentId,
        contractor_id: contractor.id,
        status: "NEW",
        price_paid: pricePaid,
        stripe_payment_id: stripePaymentId,
      })
      .select()
      .single();

    if (leadError) {
      console.error("Lead insert error:", leadError);
      return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
    }

    // ─── Send email notification to contractor ─────────────────────────────
    try {
      await sendLeadNotificationEmail({
        contractorId: contractor.id,
        leadId: lead.id,
        assessmentId: assessmentId,
      });
    } catch (emailError) {
      // Non-fatal — log but don't fail the purchase
      console.error("Lead notification email failed:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        leadId: lead.id,
        pricePaid,
        message: "Lead purchased successfully. Full contact details are now in your dashboard.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    console.error("Lead purchase error:", error);
    return NextResponse.json({ error: "Purchase failed" }, { status: 500 });
  }
}
