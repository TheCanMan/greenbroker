"use client";

import { useMemo, useState } from "react";
import { formatRange, formatUsd } from "@/lib/commercial/utils";

const CBECS_MEDIAN_EUI: Record<string, number> = {
  office: 52,
  school: 58,
  retail: 64,
  multifamily: 48,
  gym: 86,
  nonprofit: 55,
  healthcare: 142,
  data_center_support: 220,
  other: 70,
};

export function UtilityBillAnalyzer() {
  const [buildingType, setBuildingType] = useState("school");
  const [sqft, setSqft] = useState(65000);
  const [monthlyKwh, setMonthlyKwh] = useState(82000);
  const [monthlyDemandKw, setMonthlyDemandKw] = useState(420);
  const [monthlyCost, setMonthlyCost] = useState(12300);
  const [monthlyTherms, setMonthlyTherms] = useState(1650);

  const result = useMemo(() => {
    const annualKwh = monthlyKwh * 12;
    const annualCost = monthlyCost * 12;
    const annualTherms = monthlyTherms * 12;
    const kwhPerSf = annualKwh / sqft;
    const electricKbtu = annualKwh * 3.412;
    const gasKbtu = annualTherms * 100;
    const eui = (electricKbtu + gasKbtu) / sqft;
    const medianEui = CBECS_MEDIAN_EUI[buildingType] ?? 70;
    const aboveMedian = Math.max(0, eui - medianEui);
    const blendedRate = annualCost / Math.max(annualKwh, 1);
    const gapCost = annualCost * Math.min(0.55, aboveMedian / Math.max(eui, 1));
    const demandShare = Math.min(42, Math.round((monthlyDemandKw * 14 * 12 / annualCost) * 100));

    return {
      annualKwh,
      annualCost,
      annualTherms,
      kwhPerSf,
      eui,
      medianEui,
      blendedRate,
      demandShare,
      recoverableLow: gapCost * 0.1,
      recoverableBase: gapCost * 0.25,
      recoverableHigh: gapCost * 0.4,
    };
  }, [buildingType, monthlyCost, monthlyDemandKw, monthlyKwh, monthlyTherms, sqft]);

  return (
    <div className="card overflow-hidden">
      <div className="bg-white p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
          Utility bill analyzer v2
        </div>
        <h3 className="mt-2 text-2xl font-bold text-slate-950">
          Manual fallback when PDF parsing is unavailable.
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          TODO: replace benchmark constants with verified CBECS / ENERGY STAR data by building
          type, climate zone, and operating profile.
        </p>
      </div>
      <div className="grid gap-6 border-t border-slate-100 p-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Building type
            <select value={buildingType} onChange={(event) => setBuildingType(event.target.value)} className={inputCls}>
              {Object.keys(CBECS_MEDIAN_EUI).map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <NumberField label="Square footage" value={sqft} onChange={setSqft} />
          <NumberField label="Monthly kWh" value={monthlyKwh} onChange={setMonthlyKwh} />
          <NumberField label="Monthly demand kW" value={monthlyDemandKw} onChange={setMonthlyDemandKw} />
          <NumberField label="Monthly electric cost" value={monthlyCost} onChange={setMonthlyCost} />
          <NumberField label="Monthly gas therms" value={monthlyTherms} onChange={setMonthlyTherms} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Output label="Annual kWh" value={Math.round(result.annualKwh).toLocaleString()} />
          <Output label="Annualized energy cost" value={formatUsd(result.annualCost)} />
          <Output label="kWh / sf" value={result.kwhPerSf.toFixed(1)} />
          <Output label="Estimated EUI" value={`${result.eui.toFixed(0)} kBtu/sf`} />
          <Output label="Peer median" value={`${result.medianEui} kBtu/sf`} />
          <Output label="Blended $/kWh" value={`$${result.blendedRate.toFixed(3)}`} />
          <Output label="Demand charge share" value={`${result.demandShare}% est.`} />
          <Output
            label="Recoverable waste"
            value={formatRange(result.recoverableLow, result.recoverableHigh)}
            highlight
          />
        </div>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputCls}
      />
    </label>
  );
}

function Output({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
