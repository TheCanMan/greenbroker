import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser, createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/calculations/savings";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";

export default async function ContractorDashboardPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "CONTRACTOR") redirect("/dashboard");

  // Get contractor data
  const { data: contractor } = await supabase
    .from("contractors")
    .select("*")
    .eq("profile_id", profile.id)
    .single();

  if (!contractor) {
    // No contractor profile yet — prompt to apply
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔧</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Complete your contractor profile
        </h1>
        <p className="text-gray-500 mb-8">
          Set up your GreenBroker contractor profile to start receiving qualified leads
          from Montgomery County homeowners ready to upgrade.
        </p>
        <Link href="/contractors/apply" className="btn-primary">
          Set Up My Profile →
        </Link>
      </div>
    );
  }

  // Get lead stats
  const { data: leads } = await supabase
    .from("leads")
    .select("id, status, price_paid, created_at")
    .eq("contractor_id", contractor.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const totalLeads = leads?.length ?? 0;
  const newLeads = leads?.filter((l) => l.status === "NEW").length ?? 0;
  const wonLeads = leads?.filter((l) => l.status === "WON").length ?? 0;
  const totalSpent = leads?.reduce((sum, l) => sum + (l.price_paid ?? 0), 0) ?? 0;

  const isPending = contractor.status === "PENDING_REVIEW";
  const isActive = contractor.status === "ACTIVE";
  const hasSubscription = !!contractor.subscription_tier;
  const tierInfo = contractor.subscription_tier
    ? STRIPE_PRODUCTS.subscriptions[contractor.subscription_tier as keyof typeof STRIPE_PRODUCTS.subscriptions]
    : null;

  return (
    <div>
      {/* Status banner */}
      {isPending && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex gap-3">
          <span className="text-amber-600">⏳</span>
          <div>
            <strong className="text-amber-800">Account under review</strong>
            <p className="text-amber-700 text-sm mt-0.5">
              We&apos;re verifying your licenses and insurance. This usually takes 1–2 business days.
              You&apos;ll receive an email when approved.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{contractor.business_name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                contractor.tier === "ELITE"
                  ? "bg-amber-100 text-amber-800"
                  : contractor.tier === "PREFERRED"
                  ? "bg-brand-100 text-brand-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {contractor.tier}
            </span>
            {tierInfo && (
              <span className="text-xs text-gray-500">
                {tierInfo.name} plan · {formatCurrency(tierInfo.monthlyPrice)}/month
              </span>
            )}
            {!hasSubscription && isActive && (
              <Link
                href="/dashboard/contractor/billing"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700"
              >
                Upgrade to get leads →
              </Link>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-600">{contractor.lead_credits}</div>
          <div className="text-xs text-gray-500">leads remaining</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total leads", value: totalLeads, icon: "🎯" },
          { label: "New leads", value: newLeads, icon: "🔔" },
          { label: "Won projects", value: wonLeads, icon: "✅" },
          { label: "Total invested", value: formatCurrency(totalSpent), icon: "💰" },
        ].map((stat, i) => (
          <div key={i} className="card p-5">
            <div className="text-xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Rating */}
      {contractor.rating > 0 && (
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-brand-700">{contractor.rating.toFixed(1)}</div>
            <div>
              <div className="flex gap-1 text-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className={contractor.rating >= star ? "text-amber-400" : "text-gray-200"}>
                    ★
                  </span>
                ))}
              </div>
              <div className="text-sm text-gray-500">{contractor.review_count} reviews · {contractor.completed_projects} completed projects</div>
            </div>
          </div>
        </div>
      )}

      {/* Recent leads */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Recent Leads</h2>
          <Link href="/dashboard/contractor/leads" className="text-brand-600 text-sm font-medium hover:text-brand-700">
            View all →
          </Link>
        </div>

        {leads && leads.length > 0 ? (
          <div className="space-y-3">
            {leads.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      lead.status === "NEW"
                        ? "bg-blue-500"
                        : lead.status === "WON"
                        ? "bg-green-500"
                        : lead.status === "CONTACTED"
                        ? "bg-amber-400"
                        : "bg-gray-300"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Lead #{lead.id.slice(-6)}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                    {lead.status}
                  </span>
                  <span className="text-sm font-bold text-gray-700">
                    {formatCurrency(lead.price_paid ?? 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-3xl mb-3">🎯</div>
            <p className="text-gray-500 text-sm mb-4">No leads yet</p>
            {!hasSubscription ? (
              <Link href="/dashboard/contractor/billing" className="btn-primary text-sm py-2 px-4">
                Subscribe to receive leads
              </Link>
            ) : (
              <p className="text-xs text-gray-400">
                Leads will appear here when homeowners in your service area complete assessments.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
