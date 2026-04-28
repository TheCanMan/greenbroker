import type { FddFinding } from "@/lib/commercial/feature-types";
import { formatRange } from "@/lib/commercial/utils";

const SEVERITY_CLASS: Record<FddFinding["severity"], string> = {
  low: "border-slate-200 bg-slate-50 text-slate-700",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  high: "border-orange-200 bg-orange-50 text-orange-800",
  critical: "border-red-200 bg-red-50 text-red-800",
};

export function FindingCard({ finding }: { finding: FddFinding }) {
  const window = finding.evidenceWindows[0];

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs font-bold text-blue-700">{finding.ruleId}</div>
          <h3 className="mt-1 text-lg font-bold text-slate-950">{finding.title}</h3>
        </div>
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${SEVERITY_CLASS[finding.severity]}`}
        >
          {finding.severity}
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Estimated annual waste" value={formatRange(finding.annualWasteDollarsLow, finding.annualWasteDollarsHigh)} />
        <Metric label="Confidence" value={`${finding.confidence}%`} />
        <Metric label="Payback signal" value="Low/no-cost first" />
      </div>
      {window && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Evidence window
          </div>
          <p className="mt-1">{window.observed}</p>
        </div>
      )}
      <div className="mt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Suggested action
        </div>
        <p className="mt-1 text-sm text-slate-700">{finding.recommendedActions[0]}</p>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/70 p-3 ring-1 ring-slate-100">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-950">{value}</div>
    </div>
  );
}
