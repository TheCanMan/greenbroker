"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { Finding, Rebate, TrendSeries } from "@/lib/commercial/types";
import { formatRange } from "@/lib/commercial/utils";

const SERIES_COLORS = ["#15803d", "#dc2626", "#2563eb", "#d97706", "#7c3aed"];

export function FindingDetailModal({
  finding,
  rebates,
  onClose,
}: {
  finding: Finding;
  rebates: Rebate[];
  onClose: () => void;
}) {
  const [series, setSeries] = useState<TrendSeries[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/commercial/findings/${finding.id}/trend`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((data) => { if (!cancelled) setSeries(data); })
      .catch((e) => { if (!cancelled) setErr(String(e)); });
    return () => { cancelled = true; };
  }, [finding.id]);

  const chartData = series && series.length > 0 ? buildChartFrame(series) : [];

  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4 no-print"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-gray-500">{finding.rule_id}</div>
            <h3 className="mt-1 text-2xl font-semibold text-gray-900">{finding.title}</h3>
          </div>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100">✕</button>
        </div>

        <div className="mt-3 text-sm text-gray-500">
          Estimated savings:{" "}
          <strong className="text-gray-900">
            {formatRange(finding.estimated_annual_savings_usd_low, finding.estimated_annual_savings_usd_high)}
          </strong>{" "}
          per year
        </div>

        <div className="prose prose-sm mt-4 max-w-none text-gray-700">
          <MarkdownLite source={finding.description_md} />
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium text-gray-900">Supporting trend</div>
          {err && <div className="mt-2 text-xs text-red-600">Could not load trend: {err}</div>}
          {!err && !series && <div className="mt-2 text-xs text-gray-500">Loading…</div>}
          {series && series.length === 0 && (
            <div className="mt-2 text-xs text-gray-500">No trend data persisted for this rule.</div>
          )}
          {chartData.length > 0 && series && (
            <div className="mt-2 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} tickFormatter={fmtTick} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={fmtTick} />
                  <Legend />
                  {series.map((s, i) => (
                    <Line
                      key={s.point_id}
                      type="monotone"
                      dataKey={s.equipment_name + " " + s.normalized_name}
                      stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                      dot={false}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {rebates.length > 0 && (
          <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-sm font-semibold text-emerald-900">Recovery opportunities</div>
            <ul className="mt-2 space-y-2">
              {rebates.map((r) => (
                <li key={r.id} className="text-sm text-emerald-900">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-emerald-800/80">{r.incentive_description}</div>
                  {r.source_url && (
                    <a href={r.source_url} target="_blank" rel="noreferrer" className="text-xs underline">
                      {r.source_url}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function buildChartFrame(series: TrendSeries[]): Record<string, number | string>[] {
  const byTs = new Map<string, Record<string, number | string>>();
  for (const s of series) {
    const key = s.equipment_name + " " + s.normalized_name;
    for (const { t, v } of s.data) {
      const row = byTs.get(t) ?? { t };
      if (v !== null) row[key] = v;
      byTs.set(t, row);
    }
  }
  return [...byTs.values()].sort((a, b) => (a.t as string).localeCompare(b.t as string));
}

function fmtTick(v: string): string {
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric" });
}

function MarkdownLite({ source }: { source: string }) {
  const html = source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .concat("</p>");
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
