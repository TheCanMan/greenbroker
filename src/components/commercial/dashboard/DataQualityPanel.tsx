import type { DataQualityPoint } from "@/lib/commercial/types";

export function DataQualityPanel({ points }: { points: DataQualityPoint[] }) {
  if (points.length === 0) return null;

  const worst = [...points].sort((a, b) => a.score - b.score).slice(0, 10);
  const avg = points.reduce((s, p) => s + p.score, 0) / points.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Data quality</h2>
        <div className="text-sm text-slate-500">
          average {avg.toFixed(0)}/100 across {points.length} point
          {points.length === 1 ? "" : "s"}
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Per-point health from the latest ingest. Flatline or outlier spikes
        often point to a stuck or mis-scaled sensor — worth checking before
        you act on findings from those points.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="pb-2 text-left">Equipment / point</th>
              <th className="pb-2 text-right">Missing</th>
              <th className="pb-2 text-right">Flatline</th>
              <th className="pb-2 text-right">Outliers</th>
              <th className="pb-2 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {worst.map((p) => (
              <tr key={p.point_id}>
                <td className="py-2">
                  <div className="font-medium text-slate-900">{p.equipment_name}</div>
                  <div className="text-xs text-slate-500">{p.normalized_name}</div>
                </td>
                <td className="py-2 text-right tabular-nums">{p.missing_pct.toFixed(0)}%</td>
                <td className="py-2 text-right tabular-nums">{p.flatline_pct.toFixed(0)}%</td>
                <td className="py-2 text-right tabular-nums">{p.outlier_pct.toFixed(0)}%</td>
                <td className={`py-2 text-right font-semibold tabular-nums ${p.score >= 80 ? "text-emerald-700" : p.score >= 50 ? "text-amber-700" : "text-red-700"}`}>
                  {p.score.toFixed(0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {points.length > worst.length && (
        <p className="mt-3 text-xs text-slate-400">
          Showing 10 lowest-scoring points out of {points.length}.
        </p>
      )}
    </section>
  );
}
