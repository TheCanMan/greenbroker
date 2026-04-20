"use client";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import type { BuildingScore } from "@/lib/commercial/types";

export function SubscoreChart({ score }: { score: BuildingScore | null }) {
  if (!score) return null;
  const data = [
    { axis: "Scheduling", value: score.scheduling_subscore },
    { axis: "Airflow", value: score.airflow_subscore },
    { axis: "Control", value: score.control_subscore },
    { axis: "Ventilation", value: score.ventilation_subscore },
    { axis: "Data quality", value: score.data_quality_subscore },
  ];

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Sub-scores</h2>
      <p className="mt-1 text-sm text-gray-500">Where your building is strong and where it&apos;s bleeding.</p>
      <div className="mt-3 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar dataKey="value" stroke="#15803d" fill="#15803d" fillOpacity={0.3} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
