import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import type { CountyId } from "@/lib/geo/types";

const QuerySchema = z.object({
  countyId: z.string().regex(/^[A-Z]{2}:[a-z0-9-]+$/).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  category: z.string().optional(),
  utilityId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * GET /api/contractors/search?countyId=MD:montgomery&category=hvac
 *
 * Returns ACTIVE contractors whose service_zips contain at least one ZIP
 * that resolves to the requested county. This is an in-memory filter on top
 * of the Supabase query — fine at pilot scale (<1k contractors).
 *
 * When the Contractor model gains structured `serviceAreaCountyIds`, swap
 * the in-memory filter for a `service_area_county_ids @> ARRAY[?]` Postgres
 * predicate.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { countyId: rawCountyId, zip, category, limit } = parsed.data;

  // Resolve target county. Either accept countyId directly or derive from ZIP.
  let targetCounty: CountyId | null = null;
  if (rawCountyId && COUNTY_BY_ID.has(rawCountyId as CountyId)) {
    targetCounty = rawCountyId as CountyId;
  } else if (zip) {
    const resolved = resolveZip(zip);
    if (resolved) targetCounty = resolved.countyId;
  }

  if (!targetCounty) {
    return NextResponse.json(
      { error: "Provide either ?countyId=... or a resolvable ?zip=..." },
      { status: 400 }
    );
  }

  // Pull active contractors. Filter by category at the DB layer when given.
  const supabase = createAdminClient();
  let query = supabase
    .from("contractors")
    .select(
      "id, business_name, tier, categories, service_zips, bio, website, logo_url, " +
        "mhic_license, mhic_verified, certifications, mea_participating, " +
        "insurance_verified, rating, review_count, completed_projects"
    )
    .eq("status", "ACTIVE");
  if (category) query = query.contains("categories", [category]);
  query = query.limit(limit * 2); // overshoot, since we filter in JS

  const { data, error } = await query;
  if (error) {
    // The contractors table may not exist yet (pre-migration) or RLS may be
    // blocking. Either way, treat it as "no contractors onboarded yet" rather
    // than a hard server error — the frontend renders an empty state.
    if (
      error.message.includes("schema cache") ||
      error.code === "PGRST116" ||
      error.code === "42P01"
    ) {
      return NextResponse.json({
        countyId: targetCounty,
        countyName: COUNTY_BY_ID.get(targetCounty)?.name ?? targetCounty,
        contractors: [],
        total: 0,
        notice: "Contractor onboarding pipeline coming soon.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter in-memory: include a contractor if ANY of their service_zips
  // resolves to the target county.
  const results = (data ?? [])
    .filter((c) => {
      const zips = c.service_zips ?? [];
      return zips.some((z: string) => resolveZip(z)?.countyId === targetCounty);
    })
    .slice(0, limit);

  return NextResponse.json({
    countyId: targetCounty,
    countyName: COUNTY_BY_ID.get(targetCounty)?.name ?? targetCounty,
    contractors: results,
    total: results.length,
  });
}
