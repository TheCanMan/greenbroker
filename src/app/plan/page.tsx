import Link from "next/link";
import { Suspense } from "react";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID, UTILITY_BY_ID } from "@/lib/geo/registry";
import { findRebatesFor } from "@/lib/geo/eligibility";
import { REBATES } from "@/lib/data/rebates";
import { formatCurrency } from "@/lib/calculations/savings";
import { LocationPicker } from "@/components/geo/LocationPicker";
import type { CountyId, StateCode } from "@/lib/geo/types";

interface PageProps {
  searchParams: Promise<{ zip?: string; electric?: string; gas?: string }>;
}

const SAMPLE_UPGRADES = [
  {
    type: "Heat pump water heater",
    icon: "💧",
    projectCostRange: [3500, 5500],
    rebateRange: [1600, 2100],
    annualSavingsRange: [350, 600],
    paybackRange: [3, 5],
    difficulty: "easy" as const,
    contractorRequired: true,
    paperworkStatus: "needs_contractor_quote" as const,
    why: "Largest single-rebate appliance in PEPCO + Electrify MC stack. Replaces gas water heater with electric.",
    docsNeeded: ["Contractor invoice", "Equipment model number", "Photos of old + new unit"],
  },
  {
    type: "Home Performance / insulation + air sealing",
    icon: "🏠",
    projectCostRange: [5000, 12000],
    rebateRange: [2500, 10000],
    annualSavingsRange: [400, 900],
    paybackRange: [3, 8],
    difficulty: "medium" as const,
    contractorRequired: true,
    paperworkStatus: "needs_contractor_quote" as const,
    why: "EmPOWER Home Performance covers up to 75% of cost. Requires BPI-certified energy audit ($100).",
    docsNeeded: ["BPI audit report", "MEA-Participating contractor invoice", "Pre/post blower-door test"],
  },
  {
    type: "Smart thermostat",
    icon: "🌡️",
    projectCostRange: [150, 280],
    rebateRange: [100, 100],
    annualSavingsRange: [80, 150],
    paybackRange: [0.5, 2],
    difficulty: "easy" as const,
    contractorRequired: false,
    paperworkStatus: "ready" as const,
    why: "PEPCO ecobee/Nest rebate. Often available as instant rebate at retailer.",
    docsNeeded: ["Proof of purchase", "Model number"],
  },
  {
    type: "Energy supplier comparison",
    icon: "⚡",
    projectCostRange: [0, 0],
    rebateRange: [0, 0],
    annualSavingsRange: [60, 240],
    paybackRange: [0, 0],
    difficulty: "easy" as const,
    contractorRequired: false,
    paperworkStatus: "ready" as const,
    why: "Maryland allows residential energy choice. We flag risky contracts (variable rates, teaser intros, fees).",
    docsNeeded: ["Most recent electric bill"],
  },
];

const DIFFICULTY_STYLES = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  complex: "bg-red-50 text-red-700 border-red-200",
};

const PAPERWORK_LABELS = {
  ready: "Ready to apply",
  needs_contractor_quote: "Needs contractor quote",
  needs_invoice: "Needs invoice",
  needs_model_number: "Needs equipment model #",
  needs_income_verification: "Needs income verification",
};

const PAPERWORK_STYLES = {
  ready: "bg-emerald-50 text-emerald-700",
  needs_contractor_quote: "bg-amber-50 text-amber-800",
  needs_invoice: "bg-amber-50 text-amber-800",
  needs_model_number: "bg-amber-50 text-amber-800",
  needs_income_verification: "bg-blue-50 text-blue-800",
};

function range([lo, hi]: [number, number] | number[]): string {
  if (lo === hi) return formatCurrency(lo);
  if (lo === 0 && hi === 0) return "—";
  return `${formatCurrency(lo)} – ${formatCurrency(hi)}`;
}

function yearRange([lo, hi]: number[]): string {
  if (lo === 0 && hi === 0) return "Immediate";
  if (lo === hi) return `${lo} yr${lo === 1 ? "" : "s"}`;
  return `${lo}–${hi} yrs`;
}

export default async function PlanPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const resolved = sp.zip ? resolveZip(sp.zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;
  const electricUtility = sp.electric ? UTILITY_BY_ID.get(sp.electric) : null;
  const gasUtility = sp.gas ? UTILITY_BY_ID.get(sp.gas) : null;

  const eligibleRebates = resolved
    ? findRebatesFor(REBATES, {
        state: resolved.state as StateCode,
        countyId: resolved.countyId as CountyId,
        zip: sp.zip!,
        electricUtilityId: sp.electric,
        gasUtilityId: sp.gas,
      })
    : [];

  const totalRebatePotential = eligibleRebates.reduce(
    (sum, r) => sum + (r.maxAmount || 0),
    0
  );
  const upgradeCount = SAMPLE_UPGRADES.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="section-title">My Energy Plan</h1>
        <p className="section-subtitle">
          {resolved && county
            ? `${county.name}, ${resolved.state} · personalized for your location`
            : "Tell us where you live to see your personalized plan."}
        </p>
      </div>

      <Suspense fallback={<div className="card p-5 mb-8" />}>
        <LocationPicker />
      </Suspense>

      {!resolved ? (
        <div className="card p-10 text-center">
          <div className="text-4xl mb-4">📍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            We need a few details to build your plan
          </h2>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
            Enter your ZIP above for a quick view, or run the full intake to get tighter
            estimates and a ready-to-review rebate packet.
          </p>
          <Link href="/intake" className="btn-primary inline-block">
            Run the full intake →
          </Link>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <StatCard
              label="Eligible programs"
              value={String(eligibleRebates.length)}
              hint="rebates that match your location"
            />
            <StatCard
              label="Total rebate potential"
              value={formatCurrency(totalRebatePotential)}
              hint="if you stack everything you qualify for"
              accent="brand"
            />
            <StatCard
              label="Recommended upgrades"
              value={String(upgradeCount)}
              hint="ranked by net cost + payback"
            />
            <StatCard
              label="Confidence"
              value={electricUtility && gasUtility ? "High" : "Medium"}
              hint={
                electricUtility && gasUtility
                  ? "utility selected — utility-specific rebates locked in"
                  : "select your utility for tighter estimates"
              }
              accent={electricUtility && gasUtility ? "emerald" : "amber"}
            />
          </div>

          {/* Recommended upgrades */}
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Recommended upgrades
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              All numbers shown as low–high confidence ranges. Your actual results
              depend on your home, utility, project scope, and chosen contractor.
            </p>
            <div className="space-y-4">
              {SAMPLE_UPGRADES.map((u) => (
                <div key={u.type} className="card p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <span className="text-3xl">{u.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-gray-900">{u.type}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${DIFFICULTY_STYLES[u.difficulty]}`}
                          >
                            {u.difficulty}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PAPERWORK_STYLES[u.paperworkStatus]}`}
                          >
                            {PAPERWORK_LABELS[u.paperworkStatus]}
                          </span>
                          {u.contractorRequired && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                              Contractor required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          <strong className="text-gray-900">Why:</strong> {u.why}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          <strong>Docs needed:</strong> {u.docsNeeded.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs space-y-1 flex-shrink-0 min-w-[180px]">
                      <Row label="Project cost" value={range(u.projectCostRange)} />
                      <Row
                        label="Rebate"
                        value={range(u.rebateRange)}
                        accent="brand"
                      />
                      <Row
                        label="Net cost"
                        value={range([
                          Math.max(0, u.projectCostRange[0] - u.rebateRange[1]),
                          Math.max(0, u.projectCostRange[1] - u.rebateRange[0]),
                        ])}
                        bold
                      />
                      <Row label="Annual savings" value={range(u.annualSavingsRange)} />
                      <Row label="Payback" value={yearRange(u.paybackRange)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Link
                      href={`/packet?upgrade=${encodeURIComponent(u.type)}`}
                      className="btn-primary text-xs py-2 px-3"
                    >
                      Prepare rebate packet
                    </Link>
                    {u.contractorRequired && (
                      <Link
                        href={`/contractor-quotes?upgrade=${encodeURIComponent(u.type)}`}
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
                </div>
              ))}
            </div>
          </div>

          {/* Missing info */}
          <div className="card p-5 bg-amber-50 border-amber-200">
            <h3 className="font-bold text-amber-900 mb-2">
              Tighten these estimates
            </h3>
            <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
              {!electricUtility && (
                <li>Select your electric utility above (PEPCO, BGE, Potomac Edison, etc.)</li>
              )}
              {!gasUtility && (
                <li>Select your gas utility (or mark all-electric)</li>
              )}
              <li>
                Run the{" "}
                <Link href="/intake" className="underline font-semibold">
                  full intake
                </Link>{" "}
                to add your equipment age, square footage, and household income — these
                affect rebate eligibility and payback math.
              </li>
              <li>Upload a recent utility bill so we can model actual usage instead of averages.</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500 mt-8 leading-relaxed max-w-3xl">
            Estimates use confidence ranges, not guarantees. Rebate availability and
            eligibility must be verified with each program before purchase or installation.
            We don&apos;t auto-submit rebates yet — we prepare the packet for your review.
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
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "brand" | "emerald" | "amber";
}) {
  const valueClass =
    accent === "brand"
      ? "text-brand-700"
      : accent === "emerald"
        ? "text-emerald-700"
        : accent === "amber"
          ? "text-amber-700"
          : "text-gray-900";
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div className={`text-3xl font-bold mt-1 ${valueClass}`}>{value}</div>
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
  accent?: "brand";
  bold?: boolean;
}) {
  const valueClass = accent === "brand" ? "text-brand-700" : "text-gray-900";
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={`${bold ? "font-bold" : "font-semibold"} ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
