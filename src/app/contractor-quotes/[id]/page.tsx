import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { formatCurrency } from "@/lib/calculations/savings";
import type { CountyId } from "@/lib/geo/types";
import { AwardButton } from "./award-button";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notified?: string }>;
}

interface QuoteRequestRow {
  id: string;
  profile_id: string | null;
  zip: string;
  county_id: string | null;
  state: string | null;
  selected_upgrade: string;
  scope_notes: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  preferred_categories: string[];
  status: string;
  contractors_notified_count: number;
  winning_quote_id: string | null;
  awarded_at: string | null;
  created_at: string;
}

interface BidRow {
  id: string;
  contractor_id: string | null;
  gross_cost_usd: number | null;
  eligible_model_number: string | null;
  timeline: string | null;
  participates_in_rebate: boolean;
  license_info: { mhic?: string; mea_participating?: boolean; notes?: string } | null;
  status: string;
  created_at: string;
  contractors?: { business_name: string } | null;
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
  awarded: "bg-brand-50 text-brand-800 border-brand-200",
  withdrawn: "bg-red-50 text-red-700 border-red-200",
};

export default async function QuoteRequestPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const justSubmitted = sp.notified !== undefined;

  const admin = createAdminClient();

  // Determine if the current user owns this request (controls "Award" buttons).
  const supabaseClient = await createClient();
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();
  let viewerProfileId: string | null = null;
  if (user) {
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    viewerProfileId = profile?.id ?? null;
  }

  const { data: requestRow, error: reqErr } = await admin
    .from("quote_requests" as never)
    .select(
      "id, profile_id, zip, county_id, state, selected_upgrade, scope_notes, " +
        "contact_email, contact_phone, preferred_categories, status, " +
        "contractors_notified_count, winning_quote_id, awarded_at, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  // Table missing or row not found.
  if (reqErr?.code === "42P01" || reqErr?.message?.includes("schema cache")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6 text-sm text-amber-800 bg-amber-50 border-amber-200">
          The quote-requests table doesn&apos;t exist in this Supabase project
          yet. Apply migration <code>203_quote_requests.sql</code> to enable
          this page.
        </div>
      </div>
    );
  }
  if (!requestRow) notFound();

  const req = requestRow as unknown as QuoteRequestRow;

  // Bids on this request.
  const { data: bidsRaw } = await admin
    .from("contractor_quotes")
    .select(
      "id, contractor_id, gross_cost_usd, eligible_model_number, timeline, " +
        "participates_in_rebate, license_info, status, created_at, " +
        "contractors:contractor_id (business_name)"
    )
    .eq("request_id", id)
    .order("created_at", { ascending: false });

  const bids = (bidsRaw ?? []) as unknown as BidRow[];
  const county = req.county_id
    ? COUNTY_BY_ID.get(req.county_id as CountyId)
    : null;
  const notifiedCount = sp.notified ? parseInt(sp.notified) : req.contractors_notified_count;
  const isOwner = Boolean(viewerProfileId && viewerProfileId === req.profile_id);
  const winningBid = req.winning_quote_id
    ? bids.find((b) => b.id === req.winning_quote_id)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {justSubmitted && (
        <div className="card p-5 mb-6 bg-emerald-50 border-emerald-200">
          <h2 className="font-bold text-emerald-900 mb-1">
            ✓ Bid request sent to {notifiedCount} contractor{notifiedCount === 1 ? "" : "s"}.
          </h2>
          <p className="text-sm text-emerald-800">
            We&apos;ll email you here ({req.contact_email ?? "your contact email"})
            as bids come in. Bookmark this page to check back —
            it auto-updates with new bids.
          </p>
        </div>
      )}

      {req.status === "awarded" && winningBid && (
        <div className="card p-5 mb-6 bg-brand-50 border-brand-200">
          <h2 className="font-bold text-brand-900 mb-1">
            🎉 You awarded {winningBid.contractors?.business_name ?? "this contractor"}
          </h2>
          <p className="text-sm text-brand-800">
            Awarded {req.awarded_at
              ? new Date(req.awarded_at).toLocaleDateString()
              : "recently"}
            {winningBid.gross_cost_usd
              ? ` at ${formatCurrency(winningBid.gross_cost_usd)}`
              : ""}
            . They&apos;ve been notified and should reach out shortly.
          </p>
        </div>
      )}

      {req.status === "open" && req.profile_id && !isOwner && (
        <div className="card p-3 mb-6 bg-amber-50 border-amber-200">
          <p className="text-xs text-amber-800">
            Sign in as the homeowner who created this request to award a bid.
          </p>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
            Bid request
          </p>
          <h1 className="text-2xl font-bold text-gray-900">{req.selected_upgrade}</h1>
          <p className="text-sm text-gray-600 mt-1">
            {county ? `${county.name}, ${req.state}` : req.zip} · created{" "}
            {new Date(req.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full border font-bold uppercase ${STATUS_STYLES[req.status] ?? STATUS_STYLES.open}`}
        >
          {req.status}
        </span>
      </div>

      {/* Request summary */}
      <div className="card p-5 mb-6">
        <h2 className="font-bold text-gray-900 mb-3">Request details</h2>
        <dl className="text-sm space-y-2">
          <Row k="Upgrade" v={req.selected_upgrade} />
          <Row k="Categories notified" v={req.preferred_categories.join(", ")} />
          <Row k="Contractors notified" v={String(req.contractors_notified_count)} />
          {req.scope_notes && (
            <Row k="Scope notes" v={req.scope_notes} />
          )}
        </dl>
      </div>

      {/* Bids */}
      <div>
        <div className="flex items-end justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            Bids ({bids.length})
          </h2>
          {bids.length > 1 && (
            <p className="text-xs text-gray-500">Sorted newest first</p>
          )}
        </div>
        {bids.length === 0 ? (
          <div className="card p-8 text-center text-sm text-gray-600">
            No bids yet. Contractors typically respond within 2 business days.
            We&apos;ll email <strong>{req.contact_email ?? "you"}</strong> as
            each bid lands.
          </div>
        ) : (
          <div className="space-y-3">
            {bids.map((b) => (
              <div
                key={b.id}
                className={`card p-5 ${b.status === "won" ? "ring-2 ring-brand-500" : b.status === "lost" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                      {b.contractors?.business_name ?? "Contractor"}
                      {b.status === "won" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 font-bold uppercase">
                          ✓ Awarded
                        </span>
                      )}
                      {b.status === "lost" && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium uppercase">
                          Not selected
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted {new Date(b.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {b.gross_cost_usd && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(b.gross_cost_usd)}
                      </div>
                      <div className="text-xs text-gray-500">gross project cost</div>
                    </div>
                  )}
                </div>
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-4 text-xs">
                  {b.eligible_model_number && (
                    <Cell label="Equipment" value={b.eligible_model_number} />
                  )}
                  {b.timeline && <Cell label="Timeline" value={b.timeline} />}
                  <Cell
                    label="Will submit rebate"
                    value={b.participates_in_rebate ? "Yes" : "No"}
                  />
                  {b.license_info?.mhic && (
                    <Cell label="MHIC #" value={b.license_info.mhic} />
                  )}
                  {b.license_info?.mea_participating && (
                    <Cell label="MEA-Participating" value="Yes" />
                  )}
                </dl>
                {b.license_info?.notes && (
                  <p className="text-sm text-gray-600 mt-3 italic">
                    {b.license_info.notes}
                  </p>
                )}
                {isOwner && req.status === "open" && b.status === "submitted" && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <AwardButton
                      requestId={req.id}
                      quoteId={b.id}
                      contractorName={b.contractors?.business_name ?? "this contractor"}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-8">
        Want to verify a contractor&apos;s license? Search at{" "}
        <a
          href="https://labor.maryland.gov/pq/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          labor.maryland.gov/pq/
        </a>
        . When you&apos;re ready to engage, contact the contractor directly —
        we don&apos;t process payments or take a cut.{" "}
        <Link href="/contractor-quotes" className="underline">
          Back to all requests
        </Link>
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-4 border-b border-gray-100 pb-1.5 last:border-0">
      <dt className="text-gray-500 w-1/3">{k}</dt>
      <dd className="font-medium text-gray-900 flex-1">{v}</dd>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-semibold text-gray-900">{value}</div>
    </div>
  );
}
