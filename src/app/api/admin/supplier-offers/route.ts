import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * POST /api/admin/supplier-offers
 *
 * Upsert a curated supplier offer. Auth-gated to ADMIN role profiles only —
 * this is the single point of entry for getting real PSC-verified offers
 * into the supplier_offers table.
 *
 * Until we have a real scraper or partner API, this is the path:
 *   1. Curator visits the MD PSC supplier list + each supplier's rate page
 *   2. Curator POSTs the verified offer here with last_verified = today
 *   3. /energy-supplier-compare reads via /api/supplier-offers
 *
 * Body shape mirrors the Postgres table (snake_case).
 */
const Body = z.object({
  id: z.string().min(1),
  supplier_name: z.string().min(1),
  license_number: z.string().min(1),
  commodity: z.enum(["electricity", "gas"]),
  rate: z.number().positive(),
  fixed_or_variable: z.enum(["fixed", "variable", "intro_then_variable"]),
  term_months: z.number().int().min(0).max(60),
  monthly_fee: z.number().min(0).default(0),
  early_termination_fee: z.number().min(0).default(0),
  renewable_percent: z.number().int().min(0).max(100).default(0),
  intro_rate: z.number().positive().optional(),
  intro_months: z.number().int().min(1).max(24).optional(),
  url: z.string().url().optional(),
  source_url: z.string().url().optional(),
  warnings: z.array(z.string()).default([]),
  last_verified: z.string().optional(), // ISO date; defaults to today
});

export async function POST(request: Request) {
  // Gate to ADMIN role
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (profile?.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin role required to curate supplier offers" },
      { status: 403 }
    );
  }

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

  const admin = createAdminClient();
  const lastVerified = body.last_verified ?? new Date().toISOString();

  // supplier_offers.id has no DB default; the body provides one.
  const { data, error } = await admin
    .from("supplier_offers" as never)
    .upsert(
      {
        ...body,
        last_verified: lastVerified,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ offer: data });
}
