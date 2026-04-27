import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient, createClient, getUser } from "@/lib/supabase/server";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { formatCurrency } from "@/lib/calculations/savings";
import type { CountyId } from "@/lib/geo/types";
import { BidForm } from "./bid-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface QuoteRequestRow {
  id: string;
  zip: string;
  county_id: string | null;
  state: string | null;
  selected_upgrade: string;
  scope_notes: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  preferred_categories: string[];
  status: string;
  created_at: string;
}

interface MyBidRow {
  id: string;
  gross_cost_usd: number | null;
  eligible_model_number: string | null;
  timeline: string | null;
  participates_in_rebate: boolean;
  status: string;
  created_at: string;
}

export default async function ContractorQuoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();
  if (!user) redirect(`/auth/login?redirect=/dashboard/contractor/quotes/${id}`);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "CONTRACTOR") redirect("/dashboard");

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, business_name, status")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!contractor) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6">
          <h1 className="font-bold text-gray-900 mb-2">No contractor profile</h1>
          <Link href="/contractors/apply" className="btn-primary inline-block mt-3">
            Apply as a contractor
          </Link>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: requestRow, error: reqErr } = await admin
    .from("quote_requests" as never)
    .select(
      "id, zip, county_id, state, selected_upgrade, scope_notes, contact_email, " +
        "contact_phone, preferred_categories, status, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (reqErr?.code === "42P01" || reqErr?.message?.includes("schema cache")) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="card p-6 bg-amber-50 border-amber-200 text-sm text-amber-900">
          The quote-requests table doesn&apos;t exist yet. Apply migration{" "}
          <code>203_quote_requests.sql</code>.
        </div>
      </div>
    );
  }
  if (!requestRow) notFound();

  const req = requestRow as unknown as QuoteRequestRow;

  // Existing bid from this contractor (one bid per contractor per request).
  const { data: existingBidRaw } = await admin
    .from("contractor_quotes")
    .select(
      "id, gross_cost_usd, eligible_model_number, timeline, " +
        "participates_in_rebate, status, created_at"
    )
    .eq("request_id", id)
    .eq("contractor_id", contractor.id)
    .maybeSingle();
  const existingBid = existingBidRaw as unknown as MyBidRow | null;

  const county = req.county_id
    ? COUNTY_BY_ID.get(req.county_id as CountyId)
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/dashboard/contractor/quotes"
        className="text-sm text-gray-600 hover:text-gray-900 underline"
      >
        ← Back to inbound requests
      </Link>

      <div className="mt-4 mb-6 flex items-start justify-between gap-4 flex-wrap">
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
          className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
            req.status === "open"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {req.status}
        </span>
      </div>

      {/* Request details */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-bold text-gray-900 mb-3">Request details</h2>
            <dl className="text-sm space-y-2">
              <Row k="Upgrade" v={req.selected_upgrade} />
              <Row k="Categories" v={req.preferred_categories.join(", ")} />
              <Row k="Service ZIP" v={req.zip} />
              {req.scope_notes && <Row k="Scope notes" v={req.scope_notes} />}
            </dl>
          </div>

          {(req.contact_email || req.contact_phone) && (
            <div className="card p-5 bg-amber-50 border-amber-200">
              <h2 className="font-bold text-amber-900 mb-2">Homeowner contact</h2>
              <p className="text-xs text-amber-700 mb-3">
                Available because you&apos;re an active GreenBroker contractor.
                Don&apos;t share with anyone outside your firm.
              </p>
              <dl className="text-sm space-y-1.5">
                {req.contact_email && (
                  <Row k="Email" v={req.contact_email} />
                )}
                {req.contact_phone && (
                  <Row k="Phone" v={req.contact_phone} />
                )}
              </dl>
            </div>
          )}

          {existingBid && (
            <div className="card p-5 bg-brand-50 border-brand-200">
              <h2 className="font-bold text-brand-900 mb-2">Your existing bid</h2>
              <dl className="text-sm space-y-1.5">
                {existingBid.gross_cost_usd && (
                  <Row
                    k="Gross cost"
                    v={formatCurrency(existingBid.gross_cost_usd)}
                  />
                )}
                {existingBid.eligible_model_number && (
                  <Row k="Equipment" v={existingBid.eligible_model_number} />
                )}
                {existingBid.timeline && (
                  <Row k="Timeline" v={existingBid.timeline} />
                )}
                <Row
                  k="Will submit rebate"
                  v={existingBid.participates_in_rebate ? "Yes" : "No"}
                />
                <Row
                  k="Submitted"
                  v={new Date(existingBid.created_at).toLocaleString()}
                />
              </dl>
              <p className="text-xs text-brand-700 mt-3 italic">
                Submitting again creates a new bid — leave a note in &quot;notes&quot;
                explaining the revision.
              </p>
            </div>
          )}
        </div>

        {/* Bid form */}
        <div>
          {req.status !== "open" ? (
            <div className="card p-5 text-sm text-gray-600">
              This request is <strong>{req.status}</strong> — not accepting new
              bids.
            </div>
          ) : (
            <BidForm requestId={id} />
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3 border-b border-gray-100 pb-1.5 last:border-0">
      <dt className="text-gray-500 w-1/3 flex-shrink-0">{k}</dt>
      <dd className="font-medium text-gray-900 break-words min-w-0">{v}</dd>
    </div>
  );
}
