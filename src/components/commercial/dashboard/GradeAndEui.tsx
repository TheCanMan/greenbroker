"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from "recharts";
import type { BuildingScore } from "@/lib/commercial/types";

const GRADE_COLORS: Record<string, string> = {
  A: "#15803d", B: "#65a30d", C: "#d97706", D: "#dc2626", F: "#991b1b",
};

export function GradeAndEui({ score }: { score: BuildingScore | null }) {
  if (!score) {
    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        No score yet — analytics haven&apos;t run for this building.
      </section>
    );
  }
  const { grade, overall_score, eui_kbtu_per_sqft, peer_eui_median, peer_percentile } = score;
  const color = GRADE_COLORS[grade] ?? "#6b7280";

  const data = [
    { label: "Peer median", value: peer_eui_median ?? 0 },
    { label: "This building", value: eui_kbtu_per_sqft ?? 0 },
  ];

  return (
    <section className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2">
      <div className="flex flex-col items-start justify-center">
        <div className="text-sm uppercase tracking-widest text-gray-500">Building grade</div>
        <div className="mt-3 flex items-baseline gap-4">
          <span
            className="flex h-32 w-32 items-center justify-center rounded-2xl text-7xl font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {grade}
          </span>
          <div>
            <div className="text-3xl font-semibold text-gray-900">
              {overall_score.toFixed(0)}<span className="text-lg text-gray-500">/100</span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {peer_percentile !== null ? (
                <>
                  Worse than{" "}
                  <strong>{peer_percentile > 50 ? (peer_percentile).toFixed(0) : (100 - peer_percentile).toFixed(0)}%</strong>{" "}
                  of DMV peers
                </>
              ) : "No peer data yet"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm uppercase tracking-widest text-gray-500">EUI vs peers (kBtu/sqft/yr)</div>
        <div className="mt-2 text-xs text-gray-500">Lower is better. Peer cohort: DMV buildings of this type.</div>
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="label" tickLine={false} />
              <YAxis tickLine={false} />
              <Tooltip formatter={(v: number) => `${v.toFixed(0)} kBtu/sqft/yr`} />
              <ReferenceLine y={peer_eui_median ?? 0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar dataKey="value">
                {data.map((row) => (
                  <Cell
                    key={row.label}
                    fill={row.label === "This building" ? color : "#cbd5e1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
