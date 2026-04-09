import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/calculations/savings";

type LeadStatus = "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST" | "EXPIRED";

const STATUS_CONFIG: Record<LeadStatus, { label: string; dot: string; badge: string }> = {
  NEW:       { label: "New",       dot: "bg-blue-500",   badge: "bg-blue-50 text-blue-700" },
  CONTACTED: { label: "Contacted", dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-700" },
  QUOTED:    { label: "Quoted",    dot: "bg-purple-400", badge: "bg-purple-50 text-purple-700" },
  WON:       { label: "Won",       dot: "bg-green-500",  badge: "bg-green-50 text-green-700" },
  LOST:      { label: "Lost",      dot: "bg-gray-300",   badge: "bg-gray-100 text-gray-500" },
  EXPIRED:   { label: "Expired",   dot: "bg-gray-200",   badge: "bg-gray-50 text-gray-400" },
};

export default async function ContractorLeadsPage({
  searchParams,
}: {
  // Next.js 15: searchParams is a Promise
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: _status, page: pageStr } = await searchParams;
  const statusFilter = _status as LeadStatus | undefined;
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "CONTRACTOR") redirect("/dashboard");

  const { data: contractor } = await supabase
    .from("contractors")
    .select("id, status, lead_credits, subscription_tier")
    .eq("profile_id", profile.id)
    .single();

  if (!contractor) redirect("/dashboard/contractor");

  // Build query with optional status filter
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("leads")
    .select(
      `id, status, price_paid, created_at,
       home_assessment:home_assessments(
         id, zip, square_footage, year_built,
         heating_fuel, hvac_type,
         calc_annual_energy_cost, calc_savings_potential, calc_available_rebates
       )`,
      { count: "exact" }
    )
    .eq("contractor_id", contractor.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter && STATUS_CONFIG[statusFilter]) {
    query = query.eq("status", statusFilter);
  }

  const { data: leads, count } = await query;

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  // Status counts for tab filters
  const { data: statusCounts } = await supabase
    .from("leads")
    .select("status")
    .eq("contractor_id", contractor.id);

  const counts = (statusCounts ?? []).reduce<Record<string, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1;
    return acc;
  }, {});
  const totalCount = statusCounts?.length ?? 0;

  const isActive = contractor.status === "ACTIVE";
  const hasSubscription = !!contractor.subscription_tier;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 text-sm mt-1">
            Rockville homeowners ready to upgrade their homes
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-600">{contractor.lead_credits}</div>
          <div className="text-xs text-gray-500">credits remaining</div>
        </div>
      </div>

      {/* No subscription banner */}
      {isActive && !hasSubscription && (
        <div className="card p-6 text-center mb-6">
          <div className="text-3xl mb-3">🎯</div>
          <h2 className="font-bold text-gray-900 mb-2">Subscribe to unlock leads</h2>
          <p className="text-gray-500 text-sm mb-4">
            Choose a plan to start receiving qualified homeowner leads in Rockville, MD.
          </p>
          <Link href="/dashboard/contractor/billing" className="btn-primary text-sm py-2 px-5">
            View plans →
          </Link>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {[
          { label: "All", value: undefined, count: totalCount },
          ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
            label: cfg.label,
            value: key,
            count: counts[key] ?? 0,
          })),
        ].map((tab) => {
          const isSelected =
            tab.value === undefined
              ? !statusFilter
              : statusFilter === tab.value;
          const href = tab.value
            ? `/dashboard/contractor/leads?status=${tab.value}`
            : "/dashboard/contractor/leads";

          return (
            <Link
              key={tab.label}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Leads list */}
      {leads && leads.length > 0 ? (
        <div className="space-y-3">
          {leads.map((lead) => {
            const status = lead.status as LeadStatus;
            const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.NEW;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const assessment = lead.home_assessment as any;

            return (
              <div
                key={lead.id}
                className="card p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Left: ID + status */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          Lead #{lead.id.slice(-8).toUpperCase()}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {new Date(lead.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: price */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-bold text-gray-700">
                      {formatCurrency(lead.price_paid ?? 0)}
                    </div>
                    <div className="text-xs text-gray-400">paid</div>
                  </div>
                </div>

                {/* Assessment details */}
                {assessment && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-400">Location</div>
                      <div className="text-sm font-semibold text-gray-800">
                        ZIP {assessment.zip}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Home size</div>
                      <div className="text-sm font-semibold text-gray-800">
                        {assessment.square_footage?.toLocaleString()} sq ft · {assessment.year_built}
                      </div>
                    </div>
                    {assessment.calc_annual_energy_cost && (
                      <div>
                        <div className="text-xs text-gray-400">Annual energy cost</div>
                        <div className="text-sm font-semibold text-gray-800">
                          {formatCurrency(assessment.calc_annual_energy_cost)}
                        </div>
                      </div>
                    )}
                    {assessment.calc_savings_potential && (
                      <div>
                        <div className="text-xs text-gray-400">Savings potential</div>
                        <div className="text-sm font-semibold text-brand-700">
                          {formatCurrency(assessment.calc_savings_potential)}/yr
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status update actions */}
                {(status === "NEW" || status === "CONTACTED") && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {status === "NEW" && (
                      <LeadStatusButton leadId={lead.id} nextStatus="CONTACTED" label="Mark contacted" />
                    )}
                    {status === "CONTACTED" && (
                      <LeadStatusButton leadId={lead.id} nextStatus="QUOTED" label="Mark quoted" />
                    )}
                    <LeadStatusButton leadId={lead.id} nextStatus="WON" label="Mark won ✓" primary />
                    <LeadStatusButton leadId={lead.id} nextStatus="LOST" label="Mark lost" muted />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-3">
            {statusFilter ? "🔍" : "🎯"}
          </div>
          <p className="text-gray-500 text-sm">
            {statusFilter
              ? `No leads with status "${STATUS_CONFIG[statusFilter as LeadStatus]?.label ?? statusFilter}"`
              : "No leads yet — they'll appear here as homeowners complete assessments."}
          </p>
          {!hasSubscription && (
            <Link href="/dashboard/contractor/billing" className="btn-primary text-sm py-2 px-4 mt-4 inline-block">
              Subscribe to receive leads
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/dashboard/contractor/leads?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
              className="btn-secondary text-sm py-2 px-4"
            >
              ← Previous
            </Link>
          )}
          <span className="text-sm text-gray-500 py-2 px-3">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/dashboard/contractor/leads?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
              className="btn-secondary text-sm py-2 px-4"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// Inline client button for status updates
function LeadStatusButton({
  leadId,
  nextStatus,
  label,
  primary,
  muted,
}: {
  leadId: string;
  nextStatus: string;
  label: string;
  primary?: boolean;
  muted?: boolean;
}) {
  return (
    <form
      action={async () => {
        "use server";
        const { createClient: createSC } = await import("@/lib/supabase/server");
        const supabase = await createSC();
        await supabase
          .from("leads")
          .update({ status: nextStatus })
          .eq("id", leadId);
      }}
    >
      <button
        type="submit"
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
          primary
            ? "bg-green-600 text-white hover:bg-green-700"
            : muted
            ? "text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-300"
            : "bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200"
        }`}
      >
        {label}
      </button>
    </form>
  );
}
