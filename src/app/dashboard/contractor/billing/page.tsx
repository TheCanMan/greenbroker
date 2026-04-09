"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STRIPE_PRODUCTS } from "@/lib/stripe/products";
import { formatCurrency } from "@/lib/calculations/savings";

type Tier = "BASIC" | "PROFESSIONAL" | "ELITE";

interface ContractorBillingData {
  subscription_tier: Tier | null;
  subscription_status: string | null;
  lead_credits: number;
  stripe_customer_id: string | null;
  status: string;
}

export default function ContractorBillingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [contractor, setContractor] = useState<ContractorBillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<Tier | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("user_id", user.id)
        .single();

      if (profile?.role !== "CONTRACTOR") { router.push("/dashboard"); return; }

      const { data: contractorData } = await supabase
        .from("contractors")
        .select("subscription_tier, subscription_status, lead_credits, stripe_customer_id, status")
        .eq("profile_id", profile.id)
        .single();

      setContractor(contractorData as ContractorBillingData | null);
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  async function handlePortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
        setPortalLoading(false);
      }
    } catch {
      setError("Network error. Please try again.");
      setPortalLoading(false);
    }
  }

  async function handleSubscribe(tier: Tier) {
    setCheckoutLoading(tier);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
        setCheckoutLoading(null);
      }
    } catch {
      setError("Network error. Please try again.");
      setCheckoutLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-sm animate-pulse">Loading billing info…</div>
      </div>
    );
  }

  const currentTier = contractor?.subscription_tier;
  const isActive = contractor?.status === "ACTIVE";
  const subStatus = contractor?.subscription_status;

  const tiers: Array<{ key: Tier; highlight?: boolean }> = [
    { key: "BASIC" },
    { key: "PROFESSIONAL", highlight: true },
    { key: "ELITE" },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-500 mt-1">
          Manage your GreenBroker subscription and lead credits.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Current plan summary */}
      {currentTier && (
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="font-bold text-gray-900 text-lg">
                  {STRIPE_PRODUCTS.subscriptions[currentTier].name} Plan
                </h2>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    subStatus === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : subStatus === "TRIALING"
                      ? "bg-blue-100 text-blue-800"
                      : subStatus === "PAST_DUE"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {subStatus === "TRIALING" ? "Free trial" : subStatus?.toLowerCase() ?? "active"}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {formatCurrency(STRIPE_PRODUCTS.subscriptions[currentTier].monthlyPrice)}/month ·{" "}
                {contractor?.lead_credits} lead credits remaining
              </p>
            </div>
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="btn-secondary text-sm py-2 px-5 disabled:opacity-50"
            >
              {portalLoading ? "Opening portal…" : "Manage billing →"}
            </button>
          </div>

          {subStatus === "PAST_DUE" && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700">
              ⚠️ Your last payment failed. Please{" "}
              <button onClick={handlePortal} className="underline font-semibold">
                update your payment method
              </button>{" "}
              to continue receiving leads.
            </div>
          )}
        </div>
      )}

      {/* Pricing table */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {currentTier ? "Change your plan" : "Choose a plan to start receiving leads"}
      </h2>

      {!isActive && !currentTier && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-sm text-amber-700">
          ⏳ Your account is under review. You can select a plan now and it will activate once approved.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {tiers.map(({ key, highlight }) => {
          const plan = STRIPE_PRODUCTS.subscriptions[key];
          const isCurrent = currentTier === key;

          return (
            <div
              key={key}
              className={`card p-6 flex flex-col relative ${
                highlight
                  ? "ring-2 ring-brand-500 shadow-lg"
                  : "border border-gray-200"
              }`}
            >
              {highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Most popular
                </div>
              )}

              <div className="mb-4">
                <div className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-1">
                  {plan.name}
                </div>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.monthlyPrice)}
                  </span>
                  <span className="text-gray-500 text-sm mb-0.5">/month</span>
                </div>
                <div className="text-sm text-gray-500">
                  {plan.leadCreditsPerMonth} leads/month included
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  +{formatCurrency(plan.leadPricePerExtra)} per additional lead
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center text-sm font-semibold text-brand-700 bg-brand-50 rounded-xl py-3">
                  Current plan ✓
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(key)}
                  disabled={checkoutLoading !== null}
                  className={`w-full py-3 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
                    highlight
                      ? "btn-primary"
                      : "border-2 border-brand-300 text-brand-700 hover:bg-brand-50"
                  }`}
                >
                  {checkoutLoading === key
                    ? "Redirecting…"
                    : currentTier
                    ? key > currentTier
                      ? "Upgrade"
                      : "Downgrade"
                    : "Get started"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Lead credit top-up info */}
      <div className="card p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-3">About lead credits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <div className="flex gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <div className="font-semibold text-gray-800 mb-0.5">Monthly refresh</div>
              Credits reset at the start of each billing cycle, not carried over.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <div className="font-semibold text-gray-800 mb-0.5">Instant delivery</div>
              Leads appear in your dashboard the moment a homeowner completes their assessment.
            </div>
          </div>
          <div className="flex gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <div className="font-semibold text-gray-800 mb-0.5">Quality guarantee</div>
              Every lead is a real Rockville homeowner who has completed a full energy intake.
            </div>
          </div>
        </div>
      </div>

      {/* Per-lead pricing */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 mb-4">À la carte lead pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Object.entries(STRIPE_PRODUCTS.perLead).map(([key, lead]) => (
            <div key={key} className="bg-gray-50 rounded-xl p-4">
              <div className="text-lg font-bold text-brand-700 mb-1">
                {formatCurrency(lead.price)}
              </div>
              <div className="text-sm font-semibold text-gray-800">{lead.name}</div>
              <div className="text-xs text-gray-500 mt-1">{lead.description}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          À la carte leads are charged per-use when your monthly credit balance runs out.
          You can also purchase them directly from the leads page.
        </p>
      </div>
    </div>
  );
}
