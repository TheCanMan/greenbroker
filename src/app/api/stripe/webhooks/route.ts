import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

// App Router reads raw body via request.text() — no bodyParser config needed.
// We use constructEventAsync (Web Crypto API) so this route is fully
// edge-compatible and works on Cloudflare Workers without nodejs_compat.

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  // ─── Verify webhook signature (async / Web Crypto API) ────────────────────
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 400 });
  }

  const supabase = createAdminClient();

  // ─── Idempotency check ────────────────────────────────────────────────────
  // Stripe can send the same event multiple times — check if we've processed it
  const { data: existingEvent } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .single();

  if (existingEvent) {
    // Already processed — return 200 to prevent Stripe from retrying
    return new NextResponse(null, { status: 200 });
  }

  // ─── Record event ─────────────────────────────────────────────────────────
  await supabase.from("stripe_events").insert({
    id: event.id,
    type: event.type,
    data: event.data as any,
  });

  // ─── Handle events ────────────────────────────────────────────────────────
  try {
    switch (event.type) {

      // ── Subscription created / updated ─────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const tier = subscription.metadata.tier as string;

        const status = mapStripeStatusToAppStatus(subscription.status);
        const leadCredits = getLeadCreditsForTier(tier);

        await supabase
          .from("contractors")
          .update({
            subscription_id: subscription.id,
            subscription_tier: tier,
            subscription_status: status,
            subscription_end_date: subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000).toISOString()
              : null,
            lead_credits: leadCredits,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      // ── Subscription deleted / canceled ────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("contractors")
          .update({
            subscription_status: "CANCELED",
            subscription_tier: null,
            lead_credits: 0,
          })
          .eq("stripe_customer_id", customerId);

        // Notify contractor
        const { data: contractor } = await supabase
          .from("contractors")
          .select("profile_id, profiles(email, first_name)")
          .eq("stripe_customer_id", customerId)
          .single();

        if (contractor) {
          const profile = (contractor as any).profiles;
          if (profile?.email) {
            await sendEmail({
              to: profile.email,
              subject: "Your GreenBroker subscription has ended",
              text: `Hi ${profile.first_name ?? "there"}, your GreenBroker subscription has been canceled. Visit greenbroker.com/dashboard/contractor/billing to resubscribe.`,
            });
          }
        }

        break;
      }

      // ── Payment succeeded ───────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (invoice.billing_reason === "subscription_cycle") {
          // Monthly renewal — refresh lead credits
          const { data: contractor } = await supabase
            .from("contractors")
            .select("subscription_tier")
            .eq("stripe_customer_id", customerId)
            .single();

          if (contractor?.subscription_tier) {
            const freshCredits = getLeadCreditsForTier(contractor.subscription_tier);
            await supabase
              .from("contractors")
              .update({ lead_credits: freshCredits })
              .eq("stripe_customer_id", customerId);
          }
        }

        break;
      }

      // ── Payment failed ──────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("contractors")
          .update({ subscription_status: "PAST_DUE" })
          .eq("stripe_customer_id", customerId);

        break;
      }

      // ── Checkout completed (subscription) ──────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Session;

        if (session.mode === "subscription" && session.metadata?.supabase_user_id) {
          const userId = session.metadata.supabase_user_id;

          // Ensure contractor record exists
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (profile) {
            await supabase
              .from("profiles")
              .update({ role: "CONTRACTOR" })
              .eq("user_id", userId);
          }
        }

        break;
      }

      default:
        // Unhandled event type — log and ignore
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error(`Error processing Stripe event ${event.type}:`, error);
    // Return 500 to trigger Stripe retry
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapStripeStatusToAppStatus(
  stripeStatus: Stripe.Subscription.Status
): string {
  const map: Record<Stripe.Subscription.Status, string> = {
    active: "ACTIVE",
    past_due: "PAST_DUE",
    canceled: "CANCELED",
    trialing: "TRIALING",
    incomplete: "INCOMPLETE",
    incomplete_expired: "CANCELED",
    unpaid: "PAST_DUE",
    paused: "CANCELED",
  };
  return map[stripeStatus] ?? "INCOMPLETE";
}

function getLeadCreditsForTier(tier: string): number {
  const credits: Record<string, number> = {
    BASIC: 10,
    PROFESSIONAL: 25,
    ELITE: 9999, // "Unlimited"
  };
  return credits[tier] ?? 0;
}
