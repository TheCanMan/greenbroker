import type { Finding } from "@/lib/commercial/types";
import { formatRange } from "@/lib/commercial/utils";

export function NextSteps({ findings, buildingId }: { findings: Finding[]; buildingId: string }) {
  const top = findings.slice(0, 5);
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Recommended next steps</h2>
      <p className="mt-1 text-sm text-gray-500">
        Ordered by expected impact. Each step is a diagnosis — an on-site technician or a paid
        engagement would confirm and implement.
      </p>
      <ol className="mt-4 space-y-3">
        {top.map((f, i) => (
          <li key={f.id} className="flex items-start gap-3 rounded-lg border border-gray-100 p-3">
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {i + 1}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{f.title}</div>
              <div className="text-xs text-gray-500">
                Expected savings: {formatRange(f.estimated_annual_savings_usd_low, f.estimated_annual_savings_usd_high)} · {f.confidence} confidence
              </div>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-5 flex flex-wrap gap-3 no-print">
        <a
          href={`/commercial/buildings/${buildingId}/report`}
          className="btn-primary text-sm"
        >
          Open print-ready report
        </a>
        <button
          type="button"
          disabled
          title="Booking flow not wired in MVP"
          className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Schedule a commissioning consult
        </button>
      </div>
    </section>
  );
}
