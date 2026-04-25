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
  // We split the query in two so the structured-area path can use a fast GIN
  // index lookup, while the legacy ZIP path still works for rows that
  // pre-date the geo migration.
  const supabase = createAdminClient();
  const SELECT =
    "id, business_name, tier, categories, service_zips, " +
    "service_area_kind, service_area_state_code, service_area_county_ids, " +
    "service_area_metro_id, service_utility_ids, bio, website, logo_url, " +
    "mhic_license, mhic_verified, certifications, mea_participating, " +
    "insurance_verified, rating, review_count, completed_projects";

  // Path A — structured service area covers this county.
  // Either:
  //   * service_area_kind = 'state'    AND service_area_state_code = '<state>'
  //   * service_area_kind = 'counties' AND service_area_county_ids @> ['<countyId>']
  //   * service_area_kind = 'metro'    AND service_area_metro_id IN (<metros containing county>)
  // Postgres doesn't easily union three predicates in PostgREST, so we fan
  // out to three queries and dedupe in memory.
  const stateCode = targetCounty.split(":")[0];
  const { METROS } = await import("@/lib/geo/registry");
  const matchingMetroIds = METROS.filter((m) =>
    m.countyIds.includes(targetCounty)
  ).map((m) => m.id);

  const buildQuery = () => {
    let q = supabase.from("contractors").select(SELECT).eq("status", "ACTIVE");
    if (category) q = q.contains("categories", [category]);
    return q;
  };

  const [byState, byCounty, byMetro, byLegacy] = await Promise.all([
    buildQuery()
      .eq("service_area_kind", "state")
      .eq("service_area_state_code", stateCode)
      .limit(limit),
    buildQuery()
      .eq("service_area_kind", "counties")
      .contains("service_area_county_ids", [targetCounty])
      .limit(limit),
    matchingMetroIds.length
      ? buildQuery()
          .eq("service_area_kind", "metro")
          .in("service_area_metro_id", matchingMetroIds)
          .limit(limit)
      : Promise.resolve({ data: [], error: null }),
    // Legacy: rows where service_area_kind is null — fall back to in-memory
    // ZIP scan. Bounded by limit*4 to keep it cheap at pilot scale.
    buildQuery()
      .is("service_area_kind", null)
      .limit(limit * 4),
  ]);

  const firstError =
    byState.error ?? byCounty.error ?? byMetro.error ?? byLegacy.error;
  const data = firstError
    ? null
    : [
        ...(byState.data ?? []),
        ...(byCounty.data ?? []),
        ...(byMetro.data ?? []),
        // Legacy: filter to those whose service_zips include any ZIP in county.
        ...((byLegacy.data ?? []) as { service_zips: string[] }[]).filter((c) =>
          (c.service_zips ?? []).some(
            (z) => resolveZip(z)?.countyId === targetCounty
          )
        ),
      ];
  const error = firstError;
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

  // Dedupe by id (a contractor could match more than one of the four queries
  // if their data is inconsistent) and cap to the requested limit.
  const seen = new Set<string>();
  const results: typeof data = [];
  for (const c of data ?? []) {
    if (seen.has(c.id)) continue;
    seen.add(c.id);
    results.push(c);
    if (results.length >= limit) break;
  }

  return NextResponse.json({
    countyId: targetCounty,
    countyName: COUNTY_BY_ID.get(targetCounty)?.name ?? targetCounty,
    contractors: results,
    total: results.length,
  });
}
