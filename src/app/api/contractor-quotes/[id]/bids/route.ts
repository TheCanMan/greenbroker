import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const Body = z.object({
  grossCostUsd: z.number().positive(),
  eligibleModelNumber: z.string().max(200).optional(),
  timeline: z.string().max(200).optional(),
  participatesInRebate: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

/**
 * POST /api/contractor-quotes/[id]/bids
 *
 * Contractor submits a bid in response to a homeowner's quote request.
 * Auth-required: must be logged in as a CONTRACTOR-role profile with an
 * approved contractors row.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: requestId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the contractor record for this user.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "CONTRACTOR") {
    return NextResponse.json(
      { error: "Contractor account required" },
      { status: 403 }
    );
  }
  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, status, mhic_license, mea_participating")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!contractor || contractor.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "Active contractor profile required" },
      { status: 403 }
    );
  }

  // Validate body.
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

  // Ensure the request exists + is open.
  const admin = createAdminClient();
  const { data: req } = await admin
    .from("quote_requests" as never)
    .select("id, status, selected_upgrade")
    .eq("id", requestId)
    .maybeSingle();
  if (!req) {
    return NextResponse.json({ error: "Quote request not found" }, { status: 404 });
  }
  const reqRow = req as unknown as { id: string; status: string; selected_upgrade: string };
  if (reqRow.status !== "open") {
    return NextResponse.json(
      { error: `Quote request is ${reqRow.status} — no longer accepting bids` },
      { status: 409 }
    );
  }

  // Insert the bid. contractor_quotes.id has no DB default — generate one.
  const { data: bid, error } = await admin
    .from("contractor_quotes")
    .insert({
      id: crypto.randomUUID(),
      request_id: requestId,
      contractor_id: contractor.id,
      selected_upgrade: reqRow.selected_upgrade,
      gross_cost_usd: body.grossCostUsd,
      eligible_model_number: body.eligibleModelNumber ?? null,
      timeline: body.timeline ?? null,
      participates_in_rebate: body.participatesInRebate,
      license_info: {
        mhic: contractor.mhic_license ?? null,
        mea_participating: contractor.mea_participating,
        notes: body.notes ?? null,
      },
      status: "submitted",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ bid });
}
