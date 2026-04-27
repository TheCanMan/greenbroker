import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createAdminClient, getUser } from "@/lib/supabase/server";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import type { CountyId } from "@/lib/geo/types";

interface QuoteRequestRow {
  id: string;
  zip: string;
  county_id: string | null;
  state: string | null;
  selected_upgrade: string;
  scope_notes: string | null;
  preferred_categories: string[];
  status: string;
  created_at: string;
}

interface MyBidRow {
  request_id: string;
  status: string;
}

export default async function ContractorQuotesListPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login?redirect=/dashboard/contractor/quotes");

  const supabase = await createClient();

  // 1. Get this contractor's profile + record.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "CONTRACTOR") {
    redirect("/dashboard");
  }
  const { data: contractor } = await supabase
    .from("contractors")
    .select(
      "id, status, categories, service_area_kind, service_area_state_code, " +
        "service_area_county_ids, service_area_metro_id, service_zips"
    )
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!contractor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card p-6">
          <h1 className="font-bold text-gray-900 mb-2">No contractor profile</h1>
          <p className="text-sm text-gray-600 mb-4">
            You need an approved contractor profile before bid requests show up here.
          </p>
          <Link href="/contractors/apply" className="btn-primary inline-block">
            Apply as a contractor
          </Link>
        </div>
      </div>
    );
  }

  // 2. Build the county set this contractor serves.
  const admin = createAdminClient();
  const myCounties = await resolveCoveredCounties(admin, {
    kind: contractor.service_area_kind,
    stateCode: contractor.service_area_state_code,
    countyIds: contractor.service_area_county_ids ?? [],
    metroId: contractor.service_area_metro_id,
    serviceZips: contractor.service_zips ?? [],
  });

  // 3. Pull inbound requests matching county + at least one category.
  const { data: requestsRaw, error: reqErr } = await admin
    .from("quote_requests" as never)
    .select(
      "id, zip, county_id, state, selected_upgrade, scope_notes, " +
        "preferred_categories, status, created_at"
    )
    .in("county_id", myCounties.length > 0 ? myCounties : ["__none__"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (reqErr?.code === "42P01" || reqErr?.message?.includes("schema cache")) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card p-6 bg-amber-50 border-amber-200 text-sm text-amber-900">
          The quote-requests table doesn&apos;t exist in this Supabase project
          yet. Apply migration <code>203_quote_requests.sql</code> to enable
          this view.
        </div>
      </div>
    );
  }

  const allRequests = (requestsRaw ?? []) as unknown as QuoteRequestRow[];
  // Further filter: at least one preferred category must overlap with
  // contractor.categories. (DB-side overlap on .in() doesn't compose easily.)
  const myCategories = new Set(contractor.categories ?? []);
  const requests = allRequests.filter((r) =>
    r.preferred_categories.some((c) => myCategories.has(c))
  );

  // 4. Get bids this contractor has already submitted, to flag them.
  const { data: myBidsRaw } = await admin
    .from("contractor_quotes")
    .select("request_id, status")
    .eq("contractor_id", contractor.id);
  const myBids = (myBidsRaw ?? []) as unknown as MyBidRow[];
  const responded = new Set(myBids.map((b) => b.request_id));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="section-title">Inbound bid requests</h1>
          <p className="section-subtitle">
            Homeowners in your service area who&apos;ve requested bids that
            match at least one of your categories.
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Serving {myCounties.length} count{myCounties.length === 1 ? "y" : "ies"}{" "}
          · {myCategories.size} categor{myCategories.size === 1 ? "y" : "ies"}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card p-8 text-center text-sm text-gray-600">
          <p className="mb-3">No inbound requests right now.</p>
          <p className="text-xs text-gray-500">
            We&apos;ll email you the moment a homeowner in{" "}
            {myCounties.slice(0, 3).map(c => COUNTY_BY_ID.get(c as CountyId)?.name ?? c).join(", ")}
            {myCounties.length > 3 ? "…" : ""} requests bids matching your categories.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const county = r.county_id
              ? COUNTY_BY_ID.get(r.county_id as CountyId)
              : null;
            const isResponded = responded.has(r.id);
            return (
              <Link
                key={r.id}
                href={`/dashboard/contractor/quotes/${r.id}`}
                className="card p-5 block hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{r.selected_upgrade}</h3>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          r.status === "open"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {r.status}
                      </span>
                      {isResponded && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold">
                          You&apos;ve bid
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {county?.name ?? r.zip}, {r.state} ·{" "}
                      {r.preferred_categories.join(", ")}
                    </p>
                    {r.scope_notes && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                        {r.scope_notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-gray-500 flex-shrink-0">
                    <div>{new Date(r.created_at).toLocaleDateString()}</div>
                    <div className="mt-2 text-brand-700 font-semibold">
                      {isResponded ? "Update bid →" : "Respond →"}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Translate a contractor's structured serviceArea into a flat list of
 * countyIds. Used to filter inbound requests at the DB layer.
 */
async function resolveCoveredCounties(
  admin: ReturnType<typeof createAdminClient>,
  area: {
    kind: string | null;
    stateCode: string | null;
    countyIds: string[];
    metroId: string | null;
    serviceZips: string[];
  }
): Promise<string[]> {
  const { COUNTIES, METROS } = await import("@/lib/geo/registry");
  const { resolveZip } = await import("@/lib/geo/zip-lookup");

  if (area.kind === "state" && area.stateCode) {
    return COUNTIES.filter((c) => c.state === area.stateCode).map((c) => c.id);
  }
  if (area.kind === "counties") return area.countyIds;
  if (area.kind === "metro" && area.metroId) {
    return METROS.find((m) => m.id === area.metroId)?.countyIds ?? [];
  }
  // Legacy: derive from service_zips.
  const set = new Set<string>();
  for (const zip of area.serviceZips) {
    const r = resolveZip(zip);
    if (r) set.add(r.countyId);
  }
  return [...set];
}
