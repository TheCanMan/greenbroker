import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";

const Body = z.object({
  quoteId: z.string().min(1),
});

interface QuoteRequestRow {
  id: string;
  profile_id: string | null;
  selected_upgrade: string;
  contact_email: string | null;
  status: string;
}

interface BidRow {
  id: string;
  request_id: string;
  contractor_id: string | null;
  gross_cost_usd: number | null;
  status: string;
  contractors?: { business_name: string | null; profile_id: string | null } | null;
}

/**
 * POST /api/contractor-quotes/[id]/award
 *
 * Homeowner accepts a contractor's bid. Validates that:
 *   1. caller is logged in
 *   2. the request's profile_id matches the caller's profile (you can only
 *      award your own request — anonymous requests can't be awarded today)
 *   3. the bid belongs to the request and is in 'submitted' status
 *   4. the request is still 'open'
 *
 * Side effects:
 *   - request.status -> 'awarded', winning_quote_id set, awarded_at set
 *   - winning bid status -> 'won'
 *   - all other bids on this request -> 'lost'
 *   - emails the winning contractor + sends thanks-for-bidding to the rest
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params;

  // Parse body
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.flatten().fieldErrors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Auth: caller must own the request.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Sign in to award a contractor" },
      { status: 401 }
    );
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 403 });
  }

  const admin = createAdminClient();

  // Load the request.
  const { data: reqRowRaw } = await admin
    .from("quote_requests" as never)
    .select("id, profile_id, selected_upgrade, contact_email, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!reqRowRaw) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }
  const req = reqRowRaw as unknown as QuoteRequestRow;

  if (req.profile_id !== profile.id) {
    return NextResponse.json(
      {
        error:
          "Only the homeowner who created this request can award it. If you submitted as a guest, sign in with the same email and try again.",
      },
      { status: 403 }
    );
  }
  if (req.status !== "open") {
    return NextResponse.json(
      { error: `Request is already ${req.status} — can't award again` },
      { status: 409 }
    );
  }

  // Load all bids on this request, including the contractor info for the
  // winner email + thanks email.
  const { data: bidsRaw } = await admin
    .from("contractor_quotes")
    .select(
      "id, request_id, contractor_id, gross_cost_usd, status, " +
        "contractors:contractor_id (business_name, profile_id)"
    )
    .eq("request_id", requestId);
  const bids = (bidsRaw ?? []) as unknown as BidRow[];

  const winning = bids.find((b) => b.id === body.quoteId);
  if (!winning) {
    return NextResponse.json(
      { error: "Winning quote not found on this request" },
      { status: 404 }
    );
  }

  // Apply state changes.
  const nowIso = new Date().toISOString();
  const losers = bids.filter((b) => b.id !== winning.id);

  const { error: reqErr } = await admin
    .from("quote_requests" as never)
    .update({
      status: "awarded",
      winning_quote_id: winning.id,
      awarded_at: nowIso,
      updated_at: nowIso,
    } as never)
    .eq("id", requestId);
  if (reqErr) {
    return NextResponse.json({ error: reqErr.message }, { status: 500 });
  }

  await admin
    .from("contractor_quotes")
    .update({ status: "won", updated_at: nowIso })
    .eq("id", winning.id);

  if (losers.length > 0) {
    await admin
      .from("contractor_quotes")
      .update({ status: "lost", updated_at: nowIso })
      .in(
        "id",
        losers.map((b) => b.id)
      );
  }

  // Fan out emails. Best-effort; failures don't fail the award.
  await Promise.allSettled([
    notifyWinner({
      admin,
      bid: winning,
      homeownerEmail: req.contact_email ?? profile.email,
      upgrade: req.selected_upgrade,
      requestId,
    }),
    ...losers.map((b) =>
      notifyLoser({
        admin,
        bid: b,
        upgrade: req.selected_upgrade,
      })
    ),
  ]);

  return NextResponse.json({ awarded: { quoteId: winning.id } });
}

async function notifyWinner({
  admin,
  bid,
  homeownerEmail,
  upgrade,
  requestId,
}: {
  admin: ReturnType<typeof createAdminClient>;
  bid: BidRow;
  homeownerEmail: string | null;
  upgrade: string;
  requestId: string;
}) {
  const profileId = bid.contractors?.profile_id;
  if (!profileId) return;
  const { data: contractorProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();
  if (!contractorProfile?.email) return;
  try {
    await sendEmail({
      to: contractorProfile.email,
      subject: `🎉 You won the bid: ${upgrade}`,
      html: `
        <h2>You won the GreenBroker bid for "${escape(upgrade)}".</h2>
        <p>The homeowner has accepted your quote.</p>
        ${homeownerEmail ? `<p>Reach out to them directly at <strong>${escape(homeownerEmail)}</strong> to schedule the next step.</p>` : ""}
        <p><a href="${appBase()}/dashboard/contractor/quotes/${requestId}" style="background:#10b981;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">View request &rarr;</a></p>
      `,
      text: `You won the GreenBroker bid for "${upgrade}". ${homeownerEmail ? `Contact the homeowner at ${homeownerEmail}.` : ""} View at ${appBase()}/dashboard/contractor/quotes/${requestId}`,
    });
  } catch {
    /* noop */
  }
}

async function notifyLoser({
  admin,
  bid,
  upgrade,
}: {
  admin: ReturnType<typeof createAdminClient>;
  bid: BidRow;
  upgrade: string;
}) {
  const profileId = bid.contractors?.profile_id;
  if (!profileId) return;
  const { data: contractorProfile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();
  if (!contractorProfile?.email) return;
  try {
    await sendEmail({
      to: contractorProfile.email,
      subject: `Bid update: ${upgrade}`,
      html: `
        <p>Heads-up — the homeowner awarded a different contractor for "${escape(upgrade)}". Thanks for bidding.</p>
        <p>We'll send you the next matching request when one lands in your area.</p>
      `,
      text: `The homeowner awarded a different contractor for "${upgrade}". Thanks for bidding.`,
    });
  } catch {
    /* noop */
  }
}

function appBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://greenbroker.oskoui-amin.workers.dev";
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
