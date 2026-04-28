"use client";

import { useMemo, useState } from "react";

const CANONICAL_POINTS = [
  "OAT",
  "RAT",
  "MAT",
  "SAT",
  "DAT",
  "ZN_TEMP",
  "ZN_SETPOINT",
  "FAN_STATUS",
  "FAN_SPEED",
  "VFD_FREQ",
  "DAMPER_POSITION",
  "COOLING_VALVE",
  "HEATING_VALVE",
  "REHEAT_VALVE",
  "OCCUPANCY_MODE",
  "CO2",
  "STATIC_PRESSURE",
  "FILTER_DP",
  "CHW_SUPPLY_TEMP",
  "CHW_RETURN_TEMP",
  "HW_SUPPLY_TEMP",
  "HW_RETURN_TEMP",
] as const;

const EXAMPLE_HEADERS = [
  "AHU-1 OAT",
  "AHU-1 Supply Air Temp",
  "AHU-1 Fan Status",
  "VAV-203 Reheat Valve",
  "VAV-203 Zone Temp",
  "AHU-1 OA Damper Cmd",
  "CHW Supply Temp",
  "CHW Return Temp",
];

function suggestPoint(header: string) {
  const h = header.toLowerCase();
  if (h.includes("outside") || h.includes("oat")) return { point: "OAT", confidence: 92 };
  if (h.includes("supply air") || h.includes("sat")) return { point: "SAT", confidence: 88 };
  if (h.includes("fan") && h.includes("status")) return { point: "FAN_STATUS", confidence: 90 };
  if (h.includes("fan") && (h.includes("speed") || h.includes("vfd"))) return { point: "FAN_SPEED", confidence: 82 };
  if (h.includes("reheat")) return { point: "REHEAT_VALVE", confidence: 86 };
  if (h.includes("zone") && h.includes("temp")) return { point: "ZN_TEMP", confidence: 82 };
  if (h.includes("damper")) return { point: "DAMPER_POSITION", confidence: 78 };
  if (h.includes("co2")) return { point: "CO2", confidence: 94 };
  if (h.includes("static")) return { point: "STATIC_PRESSURE", confidence: 84 };
  if (h.includes("filter")) return { point: "FILTER_DP", confidence: 80 };
  if (h.includes("chw") && h.includes("supply")) return { point: "CHW_SUPPLY_TEMP", confidence: 86 };
  if (h.includes("chw") && h.includes("return")) return { point: "CHW_RETURN_TEMP", confidence: 86 };
  return { point: "OAT", confidence: 35 };
}

export function PointMappingWizard({ headers = EXAMPLE_HEADERS }: { headers?: string[] }) {
  const initial = useMemo(
    () =>
      Object.fromEntries(
        headers.map((header) => {
          const suggestion = suggestPoint(header);
          return [header, suggestion.point];
        }),
      ) as Record<string, string>,
    [headers],
  );
  const [mapping, setMapping] = useState(initial);

  return (
    <div className="card p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
            BAS point mapper
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Normalize messy trend-log headers
          </h3>
        </div>
        <span className="text-sm text-slate-500">Niagara / Metasys / WebCTRL examples</span>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        {headers.map((header) => {
          const suggestion = suggestPoint(header);
          return (
            <div
              key={header}
              className="grid gap-3 border-b border-slate-100 p-3 last:border-b-0 md:grid-cols-[1fr_190px_100px]"
            >
              <div>
                <div className="font-mono text-sm text-slate-800">{header}</div>
                <div className="mt-1 text-xs text-slate-500">Suggested canonical point</div>
              </div>
              <select
                value={mapping[header]}
                onChange={(event) =>
                  setMapping((prev) => ({ ...prev, [header]: event.target.value }))
                }
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                {CANONICAL_POINTS.map((point) => (
                  <option key={point} value={point}>
                    {point}
                  </option>
                ))}
              </select>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                {suggestion.confidence}% conf.
              </div>
            </div>
          );
        })}
      </div>
      <pre className="mt-4 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">
        {JSON.stringify(mapping, null, 2)}
      </pre>
    </div>
  );
}
