import type { DataGap } from "@/lib/commercial/types";
import { formatUsd } from "@/lib/commercial/utils";

export function DataGapPanel({ gaps }: { gaps: DataGap[] }) {
  if (gaps.length === 0) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">What we&apos;d find with more data</h2>
        <p className="mt-2 text-sm text-gray-500">
          You&apos;ve given us everything we need — no upgrade prompts here.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-dashed border-brand-600/40 bg-brand-50 p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-brand-800">What we&apos;d find with more data</h2>
          <p className="mt-1 text-sm text-brand-800/80">
            Each of these unlocks additional diagnostic rules and dollar savings.
          </p>
        </div>
        <span className="rounded-full bg-brand-600 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
          Upgrade
        </span>
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {gaps.map((g) => (
          <li key={g.id} className="rounded-xl border border-brand-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-900">
                Upload <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">{g.missing_data_type}</code>
              </div>
              <div className="text-sm font-semibold text-brand-800">
                ~{formatUsd(g.unlocks_savings_estimate_usd)}/yr
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{g.instructions_md}</p>
            {g.unlocks_findings_json.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {g.unlocks_findings_json.map((r) => (
                  <span key={r} className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-mono text-gray-600">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
