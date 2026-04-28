"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { CommercialAssessment } from "@/lib/commercial/feature-types";
import { SAMPLE_FDD_FINDINGS } from "@/lib/commercial/sampleFddFindings";
import { calculateDeploymentReadiness } from "@/lib/commercial/readiness";
import { formatUsd } from "@/lib/commercial/utils";

export function PortfolioRankTable({ buildings }: { buildings: CommercialAssessment[] }) {
  const [type, setType] = useState("all");
  const [minSavings, setMinSavings] = useState(0);
  const deferredType = useDeferredValue(type);
  const deferredMinSavings = useDeferredValue(minSavings);

  const rows = useMemo(() => {
    return buildings
      .map((building, index) => {
        const readiness = calculateDeploymentReadiness(building);
        const spend = (building.annualElectricSpend ?? 0) + (building.annualGasSpend ?? 0);
        const savings = Math.round(spend * (index === 0 ? 0.16 : index === 1 ? 0.13 : index === 2 ? 0.09 : 0.18));
        return {
          building,
          readiness,
          spend,
          savings,
          euiPercentile: index === 0 ? 68 : index === 1 ? 74 : index === 2 ? 54 : 81,
          topFault: SAMPLE_FDD_FINDINGS[index % SAMPLE_FDD_FINDINGS.length].title,
          action:
            readiness.score >= 76
              ? "Start pilot"
              : readiness.score >= 51
                ? "Upload floorplan"
                : "Collect data",
        };
      })
      .filter((row) => deferredType === "all" || row.building.buildingType === deferredType)
      .filter((row) => row.savings >= deferredMinSavings)
      .sort((a, b) => b.savings + b.readiness.score * 100 - (a.savings + a.readiness.score * 100));
  }, [buildings, deferredType, deferredMinSavings]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-sm font-bold text-slate-950">Portfolio ranking</div>
          <div className="text-xs text-slate-500">Rank buildings by savings, readiness, and actionability.</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="all">All building types</option>
            <option value="school">Schools</option>
            <option value="office">Office</option>
            <option value="gym">Gym</option>
            <option value="nonprofit">Nonprofit</option>
          </select>
          <select
            value={minSavings}
            onChange={(event) => setMinSavings(Number(event.target.value))}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option value={0}>Any savings</option>
            <option value={25000}>$25k+ savings</option>
            <option value={50000}>$50k+ savings</option>
          </select>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Building</th>
                <th className="px-4 py-3">Sqft</th>
                <th className="px-4 py-3">Energy spend</th>
                <th className="px-4 py-3">EUI percentile</th>
                <th className="px-4 py-3">Readiness</th>
                <th className="px-4 py-3">Estimated savings</th>
                <th className="px-4 py-3">Top fault</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.building.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-950">{row.building.buildingName}</div>
                    <div className="text-xs capitalize text-slate-500">{row.building.buildingType.replaceAll("_", " ")}</div>
                  </td>
                  <td className="px-4 py-4">{row.building.sqft.toLocaleString()}</td>
                  <td className="px-4 py-4">{formatUsd(row.spend)}</td>
                  <td className="px-4 py-4">{row.euiPercentile}th</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-800">
                      {row.readiness.score}/100
                    </span>
                  </td>
                  <td className="px-4 py-4 font-semibold text-emerald-700">{formatUsd(row.savings)}</td>
                  <td className="max-w-xs px-4 py-4 text-slate-600">{row.topFault}</td>
                  <td className="px-4 py-4 font-semibold text-blue-700">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
