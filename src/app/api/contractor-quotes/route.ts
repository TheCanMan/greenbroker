import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import type { CountyId } from "@/lib/geo/types";

const Body = z.object({
  zip: z.string().regex(/^\d{5}$/),
  selectedUpgrade: z.string().min(2).max(200),
  preferredCategories: z.array(z.string().min(1)).min(1).max(8),
  scopeNotes: z.string().max(2000).optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(7).max(40).optional(),
});

/**
 * POST /api/contractor-quotes
 *
 * Homeowner creates a bid request. We:
 *   1. Resolve the ZIP -> county
 *   2. Insert a quote_requests row
 *   3. Find ACTIVE contractors whose service area covers the county AND
 *      who match at least one preferred category
 *   4. Email each matching contractor a link to /dashboard/contractor/quotes
 *      via Resend (no-op if RESEND_API_KEY is not set — request still saves)
 *   5. Return {requestId, contractorsNotified}
 *
 * Auth-optional — anonymous homeowners can still request quotes; we'll
 * follow up via the contact email/phone they provided.
 */
export async function POST(request: Request) {
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

  const resolved = resolveZip(body.zip);
  if (!resolved) {
    return NextResponse.json(
      { error: "We don't yet serve this ZIP." },
      { status: 400 }
    );
  }
  const targetCounty = resolved.countyId as CountyId;

  // Optional auth - if logged in, attach to the homeowner's profile.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let profileId: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    profileId = profile?.id ?? null;
  }

  const admin = createAdminClient();

  // 1. Find matching contractors via the same multi-shape query as
  //    /api/contractors/search.
  const { METROS } = await import("@/lib/geo/registry");
  const matchingMetroIds = METROS.filter((m) =>
    m.countyIds.includes(targetCounty)
  ).map((m) => m.id);
  const stateCode = targetCounty.split(":")[0];

  const baseSelect = "id, business_name, profile_id, categories, service_zips";
  const buildContractorQuery = () =>
    admin
      .from("contractors")
      .select(baseSelect)
      .eq("status", "ACTIVE")
      .overlaps("categories", body.preferredCategories);

  const [byState, byCounty, byMetro, byLegacy] = await Promise.all([
    buildContractorQuery()
      .eq("service_area_kind", "state")
      .eq("service_area_state_code", stateCode)
      .limit(50),
    buildContractorQuery()
      .eq("service_area_kind", "counties")
      .contains("service_area_county_ids", [targetCounty])
      .limit(50),
    matchingMetroIds.length
      ? buildContractorQuery()
          .eq("service_area_kind", "metro")
          .in("service_area_metro_id", matchingMetroIds)
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
    buildContractorQuery().is("service_area_kind", null).limit(200),
  ]);

  // Aggregate + dedupe.
  const seen = new Set<string>();
  const matching: Array<{ id: string; business_name: string; profile_id: string; categories: string[]; service_zips: string[] }> = [];
  for (const result of [byState, byCounty, byMetro, byLegacy]) {
    if (result.error) continue;
    for (const row of (result.data ?? []) as typeof matching) {
      if (seen.has(row.id)) continue;
      // Legacy rows: only include if any service_zip resolves to target county.
      if (
        result === byLegacy &&
        !(row.service_zips ?? []).some(
          (z) => resolveZip(z)?.countyId === targetCounty
        )
      ) {
        continue;
      }
      seen.add(row.id);
      matching.push(row);
    }
  }

  // 2. Insert the quote request.
  const { data: insertedRaw, error: insertErr } = await admin
    .from("quote_requests" as never)
    .insert({
      profile_id: profileId,
      zip: body.zip,
      county_id: targetCounty,
      state: resolved.state,
      selected_upgrade: body.selectedUpgrade,
      preferred_categories: body.preferredCategories,
      scope_notes: body.scopeNotes ?? null,
      contact_email: body.contactEmail ?? null,
      contact_phone: body.contactPhone ?? null,
      contractors_notified_count: matching.length,
    } as never)
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json(
      { error: insertErr.message ?? "Failed to create quote request" },
      { status: 500 }
    );
  }
  const inserted = insertedRaw as unknown as { id: string };

  // 3. Fan out emails to matching contractors. Best-effort; failures don't
  //    fail the request. RESEND_API_KEY missing -> sendEmail throws, we swallow.
  const countyName = COUNTY_BY_ID.get(targetCounty)?.name ?? targetCounty;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://greenbroker.oskoui-amin.workers.dev"}/dashboard/contractor/quotes/${inserted.id}`;

  // Look up contractor profile emails in one shot.
  const profileIds = matching.map((c) => c.profile_id).filter(Boolean);
  let emailMap = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, email")
      .in("id", profileIds);
    emailMap = new Map(
      (profiles ?? []).map((p: { id: string; email: string }) => [p.id, p.email])
    );
  }

  await Promise.allSettled(
    matching.map(async (c) => {
      const to = emailMap.get(c.profile_id);
      if (!to) return;
      try {
        await sendEmail({
          to,
          subject: `New quote request: ${body.selectedUpgrade} (${countyName})`,
          html: `
            <h2>New GreenBroker quote request</h2>
            <p>A homeowner in <strong>${countyName}</strong> is requesting bids for:</p>
            <p><strong>${escapeHtml(body.selectedUpgrade)}</strong></p>
            ${body.scopeNotes ? `<p><em>${escapeHtml(body.scopeNotes)}</em></p>` : ""}
            <p><a href="${dashboardUrl}" style="background:#10b981;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">View request &amp; respond &rarr;</a></p>
            <p style="color:#6b7280;font-size:12px;">You're receiving this because your contractor profile is listed as active in ${countyName}.</p>
          `,
          text: `New GreenBroker quote request in ${countyName}\n\nUpgrade: ${body.selectedUpgrade}\n${body.scopeNotes ?? ""}\n\nRespond at: ${dashboardUrl}`,
        });
      } catch {
        // sendEmail throws when RESEND_API_KEY is missing or Resend errors —
        // request stays valid even if notifications fail.
      }
    })
  );

  return NextResponse.json({
    requestId: inserted.id,
    contractorsNotified: matching.length,
    countyName,
  });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
