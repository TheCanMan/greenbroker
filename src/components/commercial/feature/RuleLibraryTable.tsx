import type { FddRuleDefinition } from "@/lib/commercial/feature-types";

const SEVERITY_CLASS: Record<FddRuleDefinition["defaultSeverity"], string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
};

export function RuleLibraryTable({
  rules,
  limit,
}: {
  rules: FddRuleDefinition[];
  limit?: number;
}) {
  const visible = limit ? rules.slice(0, limit) : rules;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden grid-cols-[90px_1.4fr_1fr_1fr_100px] gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
        <div>Rule</div>
        <div>Finding</div>
        <div>Required points</div>
        <div>Recommended action</div>
        <div>Severity</div>
      </div>
      <div className="divide-y divide-slate-100">
        {visible.map((rule) => (
          <div
            key={rule.id}
            className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[90px_1.4fr_1fr_1fr_100px] md:gap-4"
          >
            <div className="font-mono font-bold text-blue-700">{rule.id}</div>
            <div>
              <div className="font-semibold text-slate-950">{rule.title}</div>
              <div className="mt-1 text-xs text-slate-500">{rule.explanation}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {rule.requiredPoints.slice(0, 3).map((point) => (
                <code key={point} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
                  {point}
                </code>
              ))}
            </div>
            <div className="text-slate-600">{rule.recommendedActions[0]}</div>
            <div>
              <span
                className={`rounded-full px-2 py-1 text-[11px] font-semibold uppercase ${SEVERITY_CLASS[rule.defaultSeverity]}`}
              >
                {rule.defaultSeverity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
