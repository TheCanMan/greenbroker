import { Suspense } from "react";
import { REBATES } from "@/lib/data/rebates";
import { formatCurrency } from "@/lib/calculations/savings";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID, UTILITY_BY_ID } from "@/lib/geo/registry";
import { findRebatesFor } from "@/lib/geo/eligibility";
import { LocationPicker } from "@/components/geo/LocationPicker";
import type { Rebate } from "@/lib/types";

interface PageProps {
  searchParams: Promise<{ zip?: string; electric?: string; gas?: string }>;
}

function formatUpgradeType(value: string): string {
  return value
    .replaceAll("-", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatTerritory(rebate: Rebate): string {
  if (rebate.territoryLabel) return rebate.territoryLabel;
  if (rebate.scopes.length === 0) return "All eligible customers";

  return rebate.scopes
    .map((scope) => {
      if (scope.kind === "state") return scope.stateCode;
      if (scope.kind === "county") return scope.countyIds.join(", ");
      if (scope.kind === "utility") return scope.utilityIds.join(", ");
      return "Federal";
    })
    .join(" + ");
}

function applicationTiming(rebate: Rebate): string {
  const timing =
    rebate.applicationTiming ??
    (rebate.type === "discount"
      ? "instant"
      : rebate.requiresMEAContractor
        ? "contractor_submitted"
        : rebate.requiresAudit
          ? "before_install"
          : "after_install");

  return timing.replaceAll("_", " ");
}

function documentsNeeded(rebate: Rebate): string[] {
  if (rebate.documentsNeeded?.length) return rebate.documentsNeeded;

  return [
    "Proof of address and utility territory",
    rebate.requiresAudit && "Home Performance assessment",
    rebate.requiresMEAContractor && "Participating contractor quote or invoice",
    rebate.incomeQualified && "Income qualification documentation",
    rebate.applicableCategories.some((category) =>
      ["heat-pump", "water-heater", "smart-thermostat", "battery-storage"].includes(category),
    ) && "Equipment model number",
    "Proof of purchase or final invoice",
  ].filter((item): item is string => Boolean(item));
}

export default async function RebatesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const resolved = sp.zip ? resolveZip(sp.zip) : null;
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;
  const electricUtility = sp.electric ? UTILITY_BY_ID.get(sp.electric) : null;
  const gasUtility = sp.gas ? UTILITY_BY_ID.get(sp.gas) : null;

  // Apply location filter when we have a resolved ZIP. Otherwise fall back to
  // showing every program in the database (catalog mode).
  const filteredAvailable = resolved
    ? findRebatesFor(REBATES, {
        state: resolved.state,
        countyId: resolved.countyId,
        zip: sp.zip!,
        electricUtilityId: sp.electric,
        gasUtilityId: sp.gas,
      })
    : REBATES.filter((r) => r.available);

  const filteredPending = resolved
    ? findRebatesFor(REBATES, {
        state: resolved.state,
        countyId: resolved.countyId,
        zip: sp.zip!,
        electricUtilityId: sp.electric,
        gasUtilityId: sp.gas,
      }, { onlyAvailable: false }).filter((r) => !r.available)
    : REBATES.filter((r) => !r.available);

  const availableRebates = filteredAvailable;
  const pendingRebates = filteredPending;

  const totalMaxAvailable = availableRebates.reduce((sum, r) => {
    // Avoid double-counting overlapping programs; rough max
    return sum + r.maxAmount;
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-title">Rebate & Incentive Database</h1>
        <p className="section-subtitle">
          {resolved && county ? (
            <>
              {county.name}, {resolved.state}
              {electricUtility && <> · Electric: {electricUtility.name}</>}
              {gasUtility && <> · Gas: {gasUtility.name}</>}
              {" · Accurate as of April 2026"}
            </>
          ) : (
            <>All programs across our coverage footprint · Accurate as of April 2026</>
          )}
        </p>
      </div>

      <Suspense fallback={<div className="card p-5 mb-8" />}>
        <LocationPicker />
      </Suspense>

      {/* Critical Alert */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-10">
        <div className="flex gap-4">
          <span className="text-red-500 text-2xl flex-shrink-0">🚨</span>
          <div>
            <h2 className="font-bold text-red-900 text-lg mb-2">
              Federal Tax Credits Were Eliminated — Ignore Outdated Information
            </h2>
            <p className="text-red-800 text-sm leading-relaxed">
              The <strong>One Big Beautiful Bill Act</strong> (signed July 4, 2025) terminated
              the federal home improvement credit (25C) and solar tax credit (25D) for
              installations after <strong>December 31, 2025</strong>. Many contractor websites,
              online calculators, and news articles still reference &quot;30% solar credit available
              through 2032&quot; — <strong>this is wrong</strong>. As of April 2026, the primary
              financial drivers for Montgomery County homeowners are the EmPOWER Maryland, Electrify MC,
              MSAP, and RCES programs listed below.
            </p>
          </div>
        </div>
      </div>

      {/* Stacking Scenarios */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Maximum Rebate Stacking Scenarios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Heat Pump Install (~$15,000)",
              rebates: [
                { label: "EmPOWER electrification", amount: "$7,500–$15,000" },
                { label: "Electrify MC", amount: "$1,000–$2,500" },
              ],
              totalRange: "$8,500–$17,500",
              netCostRange: "$0–$6,500",
              note: "Realistic net cost after stacking both programs",
              color: "brand",
            },
            {
              title: "Solar + Battery (~$35,000)",
              rebates: [
                { label: "MSAP (income-qualified)", amount: "$7,500" },
                { label: "RCES battery grant", amount: "$5,000" },
                { label: "Sales tax exemption", amount: "$2,100" },
                { label: "Switch Together discount", amount: "~$7,000" },
              ],
              totalRange: "~$21,600",
              netCostRange: "+$700–$950/yr SREC income",
              note: "Plus $1,200–$1,800/yr net metering savings",
              color: "amber",
            },
            {
              title: "Full Electrification (~$60,750)",
              rebates: [
                { label: "EmPOWER + Electrify MC", amount: "~$15,000" },
                { label: "MSAP + RCES", amount: "~$12,500" },
                { label: "Sales tax exemption", amount: "~$3,800" },
              ],
              totalRange: "$31,300–$41,300",
              netCostRange: "$18,700–$28,700",
              note: "When HEEHRA launches: income-qualified could approach $0",
              color: "green",
            },
          ].map((scenario, i) => (
            <div key={i} className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">{scenario.title}</h3>
              <div className="space-y-2 mb-4">
                {scenario.rebates.map((r, j) => (
                  <div key={j} className="flex justify-between text-sm">
                    <span className="text-gray-600">{r.label}</span>
                    <span className="font-semibold text-brand-700">{r.amount}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs text-gray-500 mb-1">Total incentives</div>
                <div className="text-xl font-bold text-brand-700">{scenario.totalRange}</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">{scenario.netCostRange}</div>
                <div className="text-xs text-gray-400 mt-2">{scenario.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available Programs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {resolved
            ? `Programs You Qualify For (${availableRebates.length})`
            : `Currently Available Programs (${availableRebates.length})`}
        </h2>
        <p className="text-gray-500 mb-6">
          {resolved
            ? "Filtered to programs whose state, county, and utility-territory rules match your location."
            : "All programs below are active and accepting applications as of April 2026."}
        </p>
        {resolved && availableRebates.length === 0 && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            No active rebates match your exact (county + utility) combination.
            We may still have programs you qualify for once we add more data
            for your area.
          </p>
        )}

        <div className="space-y-4">
          {availableRebates.map((rebate) => (
            <div key={rebate.id} className="card p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 flex-wrap mb-2">
                    <h3 className="font-bold text-gray-900">{rebate.name}</h3>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        rebate.type === "rebate"
                          ? "bg-green-100 text-green-800"
                          : rebate.type === "srec"
                          ? "bg-purple-100 text-purple-800"
                          : rebate.type === "loan"
                          ? "bg-blue-100 text-blue-800"
                          : rebate.type === "discount"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {rebate.type}
                    </span>
                    {rebate.incomeQualified && (
                      <span className="badge-pending">Income-qualified</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Admin: {rebate.administrator}</div>
                  <p className="text-sm text-gray-600 leading-relaxed">{rebate.description}</p>
                  <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <InfoCell label="Territory" value={formatTerritory(rebate)} />
                    <InfoCell
                      label="Eligible upgrades"
                      value={rebate.applicableCategories.map(formatUpgradeType).join(", ")}
                    />
                    <InfoCell
                      label="Application timing"
                      value={applicationTiming(rebate)}
                    />
                    <InfoCell
                      label="Requires contractor"
                      value={rebate.requiresMEAContractor || rebate.requiresAudit ? "Yes" : "No"}
                    />
                    <InfoCell
                      label="Income qualification"
                      value={rebate.incomeQualified ? "Required" : "Not required"}
                    />
                    <InfoCell
                      label="Last verified"
                      value={rebate.lastVerified ?? "April 2026"}
                    />
                  </dl>
                  <div className="mt-3 text-xs text-gray-500">
                    <strong>Documents needed:</strong>{" "}
                    {documentsNeeded(rebate).join(", ")}
                  </div>
                  {rebate.notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                      📌 {rebate.notes}
                    </p>
                  )}
                  {rebate.stackableWith.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      Stacks with: {rebate.stackableWith.slice(0, 3).join(", ")}
                      {rebate.stackableWith.length > 3 && ` +${rebate.stackableWith.length - 3} more`}
                    </div>
                  )}
                </div>
                <div className="md:text-right flex-shrink-0">
                  {rebate.maxAmount > 0 && (
                    <div className="text-2xl font-bold text-brand-700">
                      {rebate.type === "srec" ? "Ongoing" : `Up to ${formatCurrency(rebate.maxAmount)}`}
                    </div>
                  )}
                  {rebate.coveragePct && (
                    <div className="text-sm text-gray-500">
                      or {(rebate.coveragePct * 100).toFixed(0)}% of cost
                    </div>
                  )}
                  <a
                    href={rebate.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-brand-600 hover:text-brand-700 text-sm font-medium underline"
                  >
                    Learn more →
                  </a>
                  <a
                    href={`/intake?rebate=${rebate.id}`}
                    className="block mt-2 btn-primary text-center text-sm py-2 px-3"
                  >
                    Check if I qualify
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Programs */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Pending Programs — Not Yet Available ({pendingRebates.length})
        </h2>
        <p className="text-gray-500 mb-6">
          These federal programs exist in law but are not yet live in Maryland. MEA issued an RFP
          for HEEHRA administration in July 2025. Expected launch: late 2026 or beyond.
        </p>

        <div className="space-y-4">
          {pendingRebates.map((rebate) => (
            <div key={rebate.id} className="card p-6 opacity-70 border-dashed">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 flex-wrap mb-2">
                    <h3 className="font-bold text-gray-700">{rebate.name}</h3>
                    <span className="badge-pending">⏳ Not yet available in MD</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">{rebate.description}</p>
                </div>
                <div className="md:text-right flex-shrink-0">
                  <div className="text-xl font-bold text-gray-400">
                    Up to {formatCurrency(rebate.maxAmount)}
                  </div>
                  {rebate.incomeQualified && (
                    <div className="text-xs text-gray-400">Income-qualified only</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-gray-800 capitalize">{value}</dd>
    </div>
  );
}
