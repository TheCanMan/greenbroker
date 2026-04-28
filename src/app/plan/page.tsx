"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocationPicker } from "@/components/geo/LocationPicker";
import { formatCurrency } from "@/lib/calculations/savings";
import {
  buildResidentialEnergyPlan,
  GREENBROKER_PLAN_STORAGE_KEY,
} from "@/lib/residential/agents";
import type { ResidentialIntakeSnapshot } from "@/lib/residential/schemas";

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  complex: "bg-red-50 text-red-700 border-red-200",
};

const PAPERWORK_LABELS = {
  ready: "Ready",
  needs_contractor_quote: "Needs quote",
  needs_invoice: "Needs invoice",
  needs_model_number: "Needs model #",
  needs_income_verification: "Needs income verification",
};

function formatRange([lo, hi]: [number, number]): string {
  if (lo === hi) return formatCurrency(lo);
  if (lo === 0 && hi === 0) return "$0";
  return `${formatCurrency(lo)} - ${formatCurrency(hi)}`;
}

function formatYearRange([lo, hi]: [number, number]): string {
  if (lo === 0 && hi <= 1) return "Immediate";
  if (lo === hi) return `${lo} yr${lo === 1 ? "" : "s"}`;
  return `${lo}-${hi} yrs`;
}

function fallbackSnapshotFromParams(sp: URLSearchParams): ResidentialIntakeSnapshot | null {
  const zip = sp.get("zip");
  if (!zip || !/^\d{5}$/.test(zip)) {
    return null;
  }

  return {
    assessmentId: sp.get("assessment") ?? undefined,
    zip,
    electricUtilityId: sp.get("electric"),
    gasUtilityId: sp.get("gas"),
    yearBuilt: 1985,
    squareFeet: 2000,
    occupants: 3,
    heatingType: "gas_furnace",
    waterHeaterType: "gas_tank",
    hasSmartThermostat: false,
    goals: ["lower_bills"],
    assistancePrograms: [],
  };
}

function PlanBody() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [storedSnapshot, setStoredSnapshot] = useState<ResidentialIntakeSnapshot | null>(null);
  const [remoteSnapshot, setRemoteSnapshot] = useState<ResidentialIntakeSnapshot | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const assessmentId = sp.get("assessment");
  const currentPath = `${pathname}?${sp.toString()}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(GREENBROKER_PLAN_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as ResidentialIntakeSnapshot;
      if (!assessmentId || parsed.assessmentId === assessmentId) {
        setStoredSnapshot(parsed);
      }
    } catch {
      setStoredSnapshot(null);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!assessmentId || storedSnapshot?.assessmentId === assessmentId) return;

    let cancelled = false;
    fetch(`/api/assessments/${encodeURIComponent(assessmentId)}`, {
      cache: "no-store",
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { snapshot?: ResidentialIntakeSnapshot } | null) => {
        if (!cancelled && data?.snapshot) {
          setRemoteSnapshot(data.snapshot);
          try {
            sessionStorage.setItem(
              GREENBROKER_PLAN_STORAGE_KEY,
              JSON.stringify(data.snapshot),
            );
          } catch {
            // The fetched assessment still drives this render even if storage is unavailable.
          }
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteSnapshot(null);
      });

    return () => {
      cancelled = true;
    };
  }, [assessmentId, storedSnapshot?.assessmentId]);

  const fallbackSnapshot = useMemo(
    () => fallbackSnapshotFromParams(new URLSearchParams(sp.toString())),
    [sp],
  );
  const snapshot = storedSnapshot ?? remoteSnapshot ?? (assessmentId ? null : fallbackSnapshot);
  const isLoadingAssessment = Boolean(assessmentId && !storedSnapshot && !remoteSnapshot);
  const plan = useMemo(
    () => (snapshot ? buildResidentialEnergyPlan(snapshot) : null),
    [snapshot],
  );
  const supplierCompareHref = useMemo(() => {
    if (!plan) return "/energy-supplier-compare";

    const params = new URLSearchParams({
      kwh: String(plan.estimatedAnnualUsage.kwh),
      desired_plan_type: "fixed_rate_only",
      risk_tolerance: "low",
    });
    if (plan.snapshot.electricUtilityId) {
      params.set("utility", plan.snapshot.electricUtilityId);
    }
    if (plan.snapshot.currentSupplierName) {
      params.set("current_supplier", plan.snapshot.currentSupplierName);
    }

    return `/energy-supplier-compare?${params.toString()}`;
  }, [plan]);

  async function handleSavePlan() {
    if (!plan) return;

    setSaveStatus("saving");
    try {
      if (assessmentId) {
        const res = await fetch(`/api/assessments/${encodeURIComponent(assessmentId)}/claim`, {
          method: "POST",
        });
        if (res.status === 401) {
          router.push(`/auth/signup?redirect=${encodeURIComponent(currentPath)}&intent=save-plan`);
          return;
        }
        if (!res.ok) throw new Error("Could not save this plan.");
      } else {
        router.push(`/auth/signup?redirect=${encodeURIComponent(currentPath)}&intent=save-plan`);
        return;
      }

      try {
        localStorage.setItem(GREENBROKER_PLAN_STORAGE_KEY, JSON.stringify(plan.snapshot));
      } catch {
        // Server ownership is the durable save. Local storage only speeds up reloads.
      }
      setSaveStatus("saved");
      router.refresh();
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-6">
        <h1 className="section-title">My Energy Plan</h1>
        <p className="section-subtitle">
          {plan
            ? "Ranked by net cost, rebate amount, estimated savings, payback, ease, and paperwork readiness."
            : isLoadingAssessment
              ? "Loading your saved assessment before showing recommendations."
              : "Tell us where you live to see your personalized plan."}
        </p>
      </div>

      <Suspense fallback={<div className="card p-5 mb-8" />}>
        <LocationPicker />
      </Suspense>

      {!plan ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isLoadingAssessment
              ? "Loading your saved plan"
              : "We need a few details to build your plan"}
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            {isLoadingAssessment
              ? "We are fetching the assessment details so the plan uses your intake instead of generic estimates."
              : "Run the full intake to get equipment-aware recommendations, rebate packet readiness, and safer supplier comparison."}
          </p>
          {!isLoadingAssessment && (
            <Link href="/intake" className="btn-primary inline-block">
              Check My Rebates →
            </Link>
          )}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-5 mb-8">
            <div className="card p-6">
              <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
                Address summary
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">
                {plan.addressSummary || `${plan.snapshot.zip} home`}
              </h2>
              <p className="text-sm text-gray-600 mt-3">
                {plan.utilitySummary}
              </p>
              <p className="text-xs text-gray-500 mt-3">
                Estimated usage: {plan.estimatedAnnualUsage.kwh.toLocaleString()} kWh
                {plan.estimatedAnnualUsage.therms > 0
                  ? ` + ${plan.estimatedAnnualUsage.therms.toLocaleString()} therms`
                  : ""}
              </p>
            </div>

            <div className="card p-6 bg-brand-50 border-brand-200">
              <div className="text-xs uppercase tracking-wide text-brand-700 font-semibold">
                Estimated annual energy cost
              </div>
              <div className="text-4xl font-bold text-brand-800 mt-2">
                {formatCurrency(plan.estimatedAnnualEnergyCost)}
              </div>
              <div className="mt-3 text-sm text-brand-900">
                Confidence score: <strong>{plan.confidenceScore}/100</strong>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Total potential rebates"
              value={formatCurrency(plan.totalPotentialRebates)}
              hint="from matched programs and starter upgrade stack"
            />
            <StatCard
              label="Estimated net cost"
              value={formatRange(plan.estimatedNetCostRange)}
              hint="after rebates, before final contractor quote"
            />
            <StatCard
              label="Annual savings"
              value={formatRange(plan.estimatedAnnualSavingsRange)}
              hint="confidence range, not a guarantee"
            />
            <StatCard
              label="Payback range"
              value={formatYearRange(plan.paybackRange)}
              hint="simple payback after incentives"
            />
          </section>

          <section className="mb-10">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Top recommended upgrades
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Every recommendation explains why it is here and what paperwork
                  still needs to be gathered.
                </p>
              </div>
              <Link href="/intake" className="btn-secondary text-sm hidden sm:inline-block">
                Update intake
              </Link>
            </div>

            <div className="space-y-4">
              {plan.recommendations.map((item) => (
                <article key={item.upgradeType} className="card p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{item.upgradeType}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${DIFFICULTY_STYLES[item.difficulty]}`}
                        >
                          {item.difficulty}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 font-semibold">
                          {PAPERWORK_LABELS[item.paperworkStatus]}
                        </span>
                        {item.contractorRequired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            Contractor required
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                        <strong className="text-gray-900">Why this is recommended:</strong>{" "}
                        {item.whyRecommended}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        <strong>Documents needed:</strong>{" "}
                        {item.documentsNeeded.join(", ")}
                      </p>
                      {item.contractorQuestions.length > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>What to ask the contractor:</strong>{" "}
                          {item.contractorQuestions.join(" ")}
                        </p>
                      )}
                      {item.eligibleRebates.length > 0 && (
                        <p className="text-xs text-brand-700 mt-2">
                          <strong>Matched rebates:</strong>{" "}
                          {item.eligibleRebates.join(", ")}
                        </p>
                      )}
                    </div>

                    <div className="text-sm space-y-1.5 flex-shrink-0 lg:min-w-[220px]">
                      <Row label="Project cost" value={formatRange(item.projectCostRange)} />
                      <Row label="Rebates" value={formatCurrency(Math.max(0, item.projectCostRange[1] - item.estimatedNetCostRange[1]))} accent />
                      <Row label="Net cost" value={formatRange(item.estimatedNetCostRange)} bold />
                      <Row label="Annual savings" value={formatRange(item.estimatedAnnualSavingsRange)} />
                      <Row label="Payback" value={formatYearRange(item.paybackRange)} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/packet?upgrade=${encodeURIComponent(item.upgradeType)}`}
                      className="btn-primary text-xs py-2 px-3"
                    >
                      Prepare rebate packet
                    </Link>
                    {item.contractorRequired && (
                      <Link
                        href={`/contractor-quotes?upgrade=${encodeURIComponent(item.upgradeType)}`}
                        className="btn-secondary text-xs py-2 px-3"
                      >
                        Get contractor quote packet
                      </Link>
                    )}
                    <Link
                      href="/products"
                      className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-4 self-center px-2"
                    >
                      Compare products
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-5 bg-amber-50 border-amber-200">
              <h3 className="font-bold text-amber-900 mb-2">
                Missing info needed to improve accuracy
              </h3>
              {plan.missingInfo.length === 0 ? (
                <p className="text-sm text-amber-800">
                  You gave us enough for a strong first pass. Contractor quotes
                  and model numbers will tighten final rebate eligibility.
                </p>
              ) : (
                <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                  {plan.missingInfo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5 bg-blue-50 border-blue-200">
              <h3 className="font-bold text-blue-900 mb-2">
                Supplier comparison snapshot
              </h3>
              <p className="text-sm text-blue-800">
                Supplier switching can save money, but some contracts are risky.
                We flag variable rates, teaser rates, fees, and unclear terms
                before you switch.
              </p>
              <Link
                href={supplierCompareHref}
                className="mt-4 inline-block btn-commercial text-sm"
              >
                Compare energy suppliers
              </Link>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={handleSavePlan}
              disabled={saveStatus === "saving"}
            >
              {saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "Plan saved"
                  : "Save plan"}
            </button>
            <Link href="/packet" className="btn-primary text-sm">
              Prepare my rebate packet
            </Link>
            <p className="text-xs text-gray-500">
              Viewing is free. Saving requires a homeowner account.
            </p>
            {saveStatus === "error" && (
              <p className="text-sm text-red-600">
                Could not save this plan. Please sign in and try again.
              </p>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-8 leading-relaxed max-w-3xl">
            Estimates use confidence ranges, not guarantees. Rebate availability
            and eligibility must be verified with each program before purchase
            or installation. GreenBroker prepares your packet for review before
            submission.
          </p>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div className="text-2xl font-bold mt-1 text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-500 mt-1 leading-snug">{hint}</div>}
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  bold,
}: {
  label: string;
  value: string;
  accent?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span
        className={`${bold ? "font-bold" : "font-semibold"} ${
          accent ? "text-brand-700" : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12">Loading plan...</div>}>
      <PlanBody />
    </Suspense>
  );
}
