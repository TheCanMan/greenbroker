import type { Building } from "@/lib/commercial/types";
import { formatUsd } from "@/lib/commercial/utils";

export function HeadlineCard({
  building,
  savingsLow,
  savingsHigh,
  lastRefreshIso,
}: {
  building: Building;
  savingsLow: number;
  savingsHigh: number;
  lastRefreshIso: string | null;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-widest text-gray-500">
            {building.building_type.toUpperCase()} · {building.sqft.toLocaleString()} sqft · {building.city}, {building.state}
          </div>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{building.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-800">
            Tier {building.tier}
          </span>
          {lastRefreshIso && (
            <span className="text-xs text-gray-500">
              Last analyzed {new Date(lastRefreshIso).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-gray-100 pt-6">
        <div className="text-sm uppercase tracking-wider text-gray-500">
          Your building wastes an estimated
        </div>
        <div className="mt-1 text-5xl font-semibold tracking-tight text-gray-900 md:text-6xl">
          {formatUsd(savingsLow)} <span className="text-gray-400">–</span> {formatUsd(savingsHigh)}
          <span className="ml-2 text-xl font-normal text-gray-500">per year</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-gray-600">
          Savings calculated using your effective rate of{" "}
          <strong>${building.effective_rate_usd_per_kwh.toFixed(2)}/kWh</strong>
          {building.effective_rate_source.startsWith("default") ? (
            <> — based on {building.utility_territory?.toUpperCase() ?? "DMV"} commercial average.</>
          ) : (
            <> — based on 12 months of utility bills.</>
          )}{" "}
          Ranges, never point estimates — we&apos;re honest about uncertainty.
        </p>
      </div>
    </section>
  );
}
