"use client";

import { useState } from "react";
import { SAVINGS_SCENARIOS, POLICY_ALERT } from "@/lib/data/scenarios";
import { formatCurrency, calcSolarSavings, calcHPWHSavings } from "@/lib/calculations/savings";
import { UTILITY_RATES } from "@/lib/types";
import type { SavingsScenario } from "@/lib/types";

type Tab = "scenarios" | "solar" | "hpwh" | "leds";

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("scenarios");
  const [selectedScenario, setSelectedScenario] = useState<SavingsScenario>(SAVINGS_SCENARIOS[3]); // Solar default
  const [isIncomeQualified, setIsIncomeQualified] = useState(false);

  // Solar calculator state
  const [solarSizeKw, setSolarSizeKw] = useState(7.5);
  const [solarCostPerWatt, setSolarCostPerWatt] = useState(3.50);
  const solarCalc = calcSolarSavings(solarSizeKw, solarCostPerWatt);

  // HPWH calculator state
  const [currentWaterHeaterType, setCurrentWaterHeaterType] = useState<"electric-resistance" | "gas-tank">("electric-resistance");
  const hpwhCalc = calcHPWHSavings(currentWaterHeaterType, 4.07);

  // LED calculator state
  const [numBulbs, setNumBulbs] = useState(40);
  const ledSavingsPerBulb = (60 - 9) * 3 * 365 / 1000 * UTILITY_RATES.electric.blendedPerKwh;
  const ledTotalSavings = numBulbs * ledSavingsPerBulb;
  const ledCost = numBulbs * 2.5;
  const ledPaybackMonths = (ledCost / ledTotalSavings) * 12;

  const TABS = [
    { id: "scenarios" as Tab, label: "All Scenarios", icon: "📊" },
    { id: "solar" as Tab, label: "Solar", icon: "☀️" },
    { id: "hpwh" as Tab, label: "Water Heater", icon: "💧" },
    { id: "leds" as Tab, label: "LED Lighting", icon: "💡" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="section-title">Savings Calculator</h1>
        <p className="section-subtitle">
          Real numbers for Rockville, MD. PEPCO ${UTILITY_RATES.electric.blendedPerKwh}/kWh ·
          Washington Gas ${UTILITY_RATES.gas.allInPerTherm}/therm · April 2026
        </p>
      </div>

      {/* Policy Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex gap-3">
        <span className="text-amber-600 text-lg flex-shrink-0">⚠️</span>
        <div className="text-sm text-amber-800">
          <strong>Federal credits eliminated:</strong> The 30% solar tax credit (25D) and home
          improvement credit (25C) were eliminated for installations after December 31, 2025. All
          calculations below reflect current Maryland/county programs only.
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ── All Scenarios Tab ── */}
      {activeTab === "scenarios" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scenario List */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700">Income-qualified (≤150% AMI)?</label>
              <button
                onClick={() => setIsIncomeQualified(!isIncomeQualified)}
                className={`w-12 h-6 rounded-full transition-colors ${isIncomeQualified ? "bg-brand-600" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${isIncomeQualified ? "translate-x-7" : "translate-x-0.5"}`} />
              </button>
            </div>

            {SAVINGS_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setSelectedScenario(scenario)}
                className={`w-full text-left card p-4 transition-all ${
                  selectedScenario.id === scenario.id
                    ? "border-brand-500 bg-brand-50 shadow-md"
                    : "hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{scenario.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{scenario.shortName}</div>
                      <div className="text-xs text-brand-600 font-bold mt-0.5">
                        {formatCurrency(scenario.totalAnnualSavings)}/yr
                      </div>
                    </div>
                  </div>
                  {scenario.recommended && (
                    <span className="badge-savings text-xs">⭐ Top pick</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Scenario Detail */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl">{selectedScenario.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedScenario.name}</h2>
                  </div>
                  <p className="text-gray-600">{selectedScenario.description}</p>
                </div>
              </div>

              {/* Key Numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  {
                    label: "Net Cost",
                    value: formatCurrency(
                      isIncomeQualified
                        ? selectedScenario.netCostIncomeQualified
                        : selectedScenario.netCostStandard
                    ),
                    sub: isIncomeQualified ? "income-qualified" : "standard",
                    color: "text-gray-900",
                  },
                  {
                    label: "Annual Savings",
                    value: formatCurrency(selectedScenario.totalAnnualSavings),
                    sub: "energy + maintenance",
                    color: "text-brand-600",
                  },
                  {
                    label: "Payback",
                    value: `${selectedScenario.simplePaybackYears.toFixed(1)} yrs`,
                    sub: "simple payback",
                    color:
                      selectedScenario.simplePaybackYears < 5
                        ? "text-green-600"
                        : selectedScenario.simplePaybackYears < 15
                        ? "text-amber-600"
                        : "text-red-500",
                  },
                  {
                    label: "CO₂ Reduction",
                    value: `${selectedScenario.co2ReductionTonsPerYear.toFixed(1)} tons`,
                    sub: "per year",
                    color: "text-green-600",
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    <div className="text-xs text-gray-400">{stat.sub}</div>
                  </div>
                ))}
              </div>

              {/* Rebate Stack */}
              {selectedScenario.availableRebates.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-gray-900 mb-3">Available Rebates</h3>
                  <div className="space-y-2">
                    {selectedScenario.availableRebates.map((rebate, i) => (
                      <div
                        key={i}
                        className={`flex justify-between items-center rounded-lg px-4 py-2.5 ${
                          rebate.incomeQualifiedOnly && !isIncomeQualified
                            ? "bg-gray-50 opacity-50"
                            : "bg-brand-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              rebate.incomeQualifiedOnly && !isIncomeQualified
                                ? "bg-gray-400"
                                : "bg-brand-500"
                            }`}
                          />
                          <span className="text-sm text-gray-700">{rebate.rebateId}</span>
                          {rebate.incomeQualifiedOnly && (
                            <span className="badge-pending">Income required</span>
                          )}
                        </div>
                        <span className="font-bold text-brand-700 text-sm">
                          {formatCurrency(rebate.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Caveats */}
              {selectedScenario.caveats.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">What to know</h3>
                  <ul className="space-y-2">
                    {selectedScenario.caveats.map((caveat, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-amber-500 flex-shrink-0 mt-0.5">→</span>
                        {caveat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Solar Calculator Tab ── */}
      {activeTab === "solar" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Solar System Calculator</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  System Size: {solarSizeKw} kW
                </label>
                <input
                  type="range"
                  min={2}
                  max={15}
                  step={0.5}
                  value={solarSizeKw}
                  onChange={(e) => setSolarSizeKw(parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>2 kW (small)</span>
                  <span>15 kW (large)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Installed Cost: ${solarCostPerWatt.toFixed(2)}/W
                </label>
                <input
                  type="range"
                  min={2.50}
                  max={4.00}
                  step={0.05}
                  value={solarCostPerWatt}
                  onChange={(e) => setSolarCostPerWatt(parseFloat(e.target.value))}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>$2.50 (budget)</span>
                  <span>$4.00 (premium)</span>
                </div>
              </div>

              <div className="bg-brand-50 rounded-xl p-4 space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location assumptions</div>
                <div className="text-sm text-gray-600">📍 Rockville, MD · 4.5 peak sun hours/day</div>
                <div className="text-sm text-gray-600">⚡ PEPCO net metering: 1:1 retail rate</div>
                <div className="text-sm text-gray-600">📈 Certified SREC price: $70/credit</div>
                <div className="text-sm text-gray-600">🚫 Federal 25D credit: eliminated 1/1/2026</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">System Output</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Annual generation", value: `${solarCalc.annualKwhGenerated.toFixed(0)} kWh` },
                  { label: "Gross system cost", value: formatCurrency(solarCalc.grossSystemCost) },
                  { label: "Net metering savings", value: `${formatCurrency(solarCalc.annualNetMeteringSavings)}/yr` },
                  { label: "SREC income", value: `${formatCurrency(solarCalc.annualSrecIncome)}/yr` },
                  { label: "Total annual value", value: `${formatCurrency(solarCalc.totalAnnualValue)}/yr`, highlight: true },
                  { label: "Sales tax exemption", value: formatCurrency(solarCalc.salesTaxSavings), note: "(MD 6% exemption)" },
                  { label: "Simple payback", value: `${solarCalc.simplePaybackYears.toFixed(1)} years`, highlight: true },
                  { label: "25-year lifetime savings", value: formatCurrency(solarCalc.lifetime25YearSavings) },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 ${item.highlight ? "bg-brand-50 col-span-2" : "bg-gray-50"}`}
                  >
                    <div className={`font-bold ${item.highlight ? "text-2xl text-brand-700" : "text-lg text-gray-900"}`}>
                      {item.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.label} {item.note && <span className="text-gray-400">{item.note}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 bg-amber-50 border-amber-200">
              <h3 className="font-bold text-amber-800 mb-2">⚠️ SREC Price Outlook</h3>
              <p className="text-sm text-amber-700">
                Current certified SREC price: $70/credit (Brighter Tomorrow 1.5x multiplier for
                systems July 2024–January 2028). Prices will decline as Solar ACP drops from
                $55 (2025) → $22.50 (2030). Long-term conservative estimate: ~$45/SREC.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── HPWH Calculator Tab ── */}
      {activeTab === "hpwh" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Heat Pump Water Heater Calculator</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current water heater type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(["electric-resistance", "gas-tank"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setCurrentWaterHeaterType(type)}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        currentWaterHeaterType === type
                          ? "border-brand-500 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type === "electric-resistance" ? "⚡ Electric Resistance" : "🔥 Gas Tank"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <div className="font-semibold text-blue-900 mb-2">Rheem ProTerra XE50T10H45U0</div>
                <div className="text-sm text-blue-700">UEF 4.07 · Industry highest · 50 gallon</div>
                <div className="text-sm text-blue-600 mt-1">Installed cost: ~$1,800–$2,500</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Annual Savings Breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Current annual cost</span>
                  <span className="font-bold text-gray-900">{formatCurrency(hpwhCalc.currentAnnualCost)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">New HPWH annual cost</span>
                  <span className="font-bold text-green-600">{formatCurrency(hpwhCalc.newAnnualCost)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">Annual savings</span>
                  <span className="font-bold text-2xl text-brand-600">{formatCurrency(hpwhCalc.annualSavings)}</span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-gray-900 mb-4">Rebate Stack</h3>
              <div className="space-y-2">
                {[
                  { label: "PEPCO EmPOWER", amount: 1600 },
                  { label: "Electrify MC", amount: 500 },
                ].map((r, i) => (
                  <div key={i} className="flex justify-between items-center bg-brand-50 rounded-lg px-4 py-2.5">
                    <span className="text-sm text-gray-700">{r.label}</span>
                    <span className="font-bold text-brand-700">{formatCurrency(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-gray-900">Total available rebates</span>
                  <span className="text-xl font-bold text-brand-600">{formatCurrency(hpwhCalc.availableRebates)}</span>
                </div>
              </div>
            </div>

            <div className="card p-6 bg-green-50 border-green-200">
              <div className="text-2xl font-bold text-green-700">
                {hpwhCalc.paybackYears.toFixed(1)} year payback
              </div>
              <div className="text-sm text-green-600 mt-1">
                Net cost after rebates: {formatCurrency(hpwhCalc.netInvestmentAfterRebates)}
              </div>
              <div className="text-sm text-gray-600 mt-2">
                Lifetime savings (13 yrs): {formatCurrency(hpwhCalc.annualSavings * 13)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LED Tab ── */}
      {activeTab === "leds" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">LED Lighting Calculator</h2>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of incandescent bulbs to replace: {numBulbs}
              </label>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={numBulbs}
                onChange={(e) => setNumBulbs(parseInt(e.target.value))}
                className="w-full accent-brand-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>5 bulbs</span>
                <span>100 bulbs</span>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Assuming: 60W incandescent → 9W LED · 3 hours/day · ${UTILITY_RATES.electric.blendedPerKwh}/kWh
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Investment cost", value: formatCurrency(ledCost), sub: "$2.50/bulb avg" },
                  { label: "Annual savings", value: formatCurrency(ledTotalSavings), sub: "electricity" },
                  { label: "Payback period", value: `${ledPaybackMonths.toFixed(1)} months`, sub: "simple payback", highlight: true },
                  { label: "5-year savings", value: formatCurrency(ledTotalSavings * 5 - ledCost), sub: "net of bulb cost" },
                ].map((stat, i) => (
                  <div key={i} className={`rounded-xl p-4 ${stat.highlight ? "bg-green-50 col-span-2" : "bg-gray-50"}`}>
                    <div className={`font-bold ${stat.highlight ? "text-3xl text-green-600" : "text-xl text-gray-900"}`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                    <div className="text-xs text-gray-400">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 bg-green-50 border-green-200">
              <p className="text-sm text-green-800 font-semibold">
                💡 Do this first — before any other upgrade
              </p>
              <p className="text-sm text-green-700 mt-1">
                The single best ROI of any efficiency measure. Every month you wait costs money.
                Buy in bulk at Costco or Amazon for the best per-bulb price.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
