"use client";

import { useState } from "react";
import { formatUsd } from "@/lib/commercial/utils";

export function SavingsToNOICalculator() {
  const [annualSpend, setAnnualSpend] = useState(250000);
  const [savingsPct, setSavingsPct] = useState(18);
  const [capRate, setCapRate] = useState(5.5);
  const [projectCost, setProjectCost] = useState(75000);

  const annualSavings = annualSpend * (savingsPct / 100);
  const valueCreation = annualSavings / (capRate / 100);
  const payback = projectCost / Math.max(annualSavings, 1);
  const tenYearSavings = annualSavings * 10 - projectCost;

  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-950 p-6 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          Savings to NOI
        </div>
        <h3 className="mt-2 text-3xl font-bold">Translate energy waste into owner math.</h3>
        <p className="mt-2 text-sm text-slate-300">
          Ranges are planning estimates, not guaranteed savings. Verified savings should be measured
          through the pilot M&V plan.
        </p>
      </div>
      <div className="grid gap-8 p-6 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5">
          <Slider label="Annual utility spend" value={annualSpend} min={50000} max={1000000} step={10000} format={formatUsd} onChange={setAnnualSpend} />
          <Slider label="Estimated savings" value={savingsPct} min={5} max={30} step={1} format={(v) => `${v}%`} onChange={setSavingsPct} />
          <Slider label="Cap rate" value={capRate} min={3} max={9} step={0.25} format={(v) => `${v}%`} onChange={setCapRate} />
          <Slider label="Implementation cost" value={projectCost} min={0} max={300000} step={5000} format={formatUsd} onChange={setProjectCost} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Output label="Annual savings" value={formatUsd(annualSavings)} />
          <Output label="NOI increase" value={formatUsd(annualSavings)} />
          <Output label="Implied value creation" value={formatUsd(valueCreation)} highlight />
          <Output label="Simple payback" value={`${payback.toFixed(1)} years`} />
          <Output label="10-year cumulative savings" value={formatUsd(tenYearSavings)} wide />
          <Output label="Share-of-savings pilot" value="Optional EaaS path" wide />
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-950">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-blue-600"
      />
    </label>
  );
}

function Output({
  label,
  value,
  highlight,
  wide,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white"
      } ${wide ? "sm:col-span-2" : ""}`}
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
