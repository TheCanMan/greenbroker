"use client";
import { useState } from "react";
import type { Finding, Rebate } from "@/lib/commercial/types";
import { cn, formatRange, SEVERITY_STYLES, CONFIDENCE_STYLES, CONFIDENCE_TOOLTIPS } from "@/lib/commercial/utils";
import { FindingDetailModal } from "./FindingDetailModal";

export function FindingsList({
  findings,
  rebatesById,
  heading = "Top findings",
}: {
  findings: Finding[];
  rebatesById: Record<string, Rebate>;
  heading?: string;
}) {
  const [openFinding, setOpenFinding] = useState<Finding | null>(null);

  if (findings.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No findings yet — either this building is running well, or we haven&apos;t ingested enough data.
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900">{heading}</h2>
      <p className="mt-1 text-sm text-gray-500">
        Ranked by estimated savings × confidence. Click a card to see the supporting trend.
      </p>
      <ul className="mt-4 space-y-3">
        {findings.map((f) => {
          const rebates = (f.rebate_program_ids ?? [])
            .map((id) => rebatesById[id])
            .filter(Boolean);
          return (
            <li key={f.id}>
              <button
                onClick={() => setOpenFinding(f)}
                className="group w-full rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-brand-600 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono uppercase text-gray-600">
                      {f.rule_id}
                    </span>
                    <span className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                      SEVERITY_STYLES[f.severity],
                    )}>
                      {f.severity}
                    </span>
                    <span
                      title={CONFIDENCE_TOOLTIPS[f.confidence]}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                        CONFIDENCE_STYLES[f.confidence],
                      )}
                    >
                      {f.confidence} confidence
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatRange(f.estimated_annual_savings_usd_low, f.estimated_annual_savings_usd_high)}
                    </div>
                    <div className="text-xs text-gray-500">per year</div>
                  </div>
                </div>
                <div className="mt-3 text-base font-medium text-gray-900 group-hover:text-brand-700">
                  {f.title}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                  {f.description_md.replace(/\*\*/g, "")}
                </p>
                {rebates.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rebates.slice(0, 3).map((r) => (
                      <span
                        key={r.id}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
                        title={r.incentive_description}
                      >
                        Recovery: {r.name}
                      </span>
                    ))}
                    {rebates.length > 3 && (
                      <span className="text-[11px] text-gray-500">+{rebates.length - 3} more</span>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {openFinding && (
        <FindingDetailModal
          finding={openFinding}
          rebates={
            (openFinding.rebate_program_ids ?? [])
              .map((id) => rebatesById[id])
              .filter(Boolean) as Rebate[]
          }
          onClose={() => setOpenFinding(null)}
        />
      )}
    </section>
  );
}
