"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { determineAMIBracket, calcPersonalizedSavings, formatCurrency } from "@/lib/calculations/savings";
import type { HomeProfile, AMIBracket } from "@/lib/types";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { UtilityPicker } from "@/components/geo/UtilityPicker";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
  { id: 1, label: "Your Home", icon: "🏠" },
  { id: 2, label: "Energy Systems", icon: "⚡" },
  { id: 3, label: "Usage & Bills", icon: "📊" },
  { id: 4, label: "Household", icon: "👨‍👩‍👧" },
  { id: 5, label: "Your Plan", icon: "✅" },
];

const DEFAULT_PROFILE: Partial<HomeProfile> = {
  zip: "",
  squareFootage: 2000,
  yearBuilt: 1985,
  bedrooms: 3,
  bathrooms: 2,
  hasGas: true,
  hasExistingSolar: false,
  hasEv: false,
  primaryHeatingFuel: "gas",
  currentHvacType: "central-ac-gas-furnace",
};

function IntakeBody() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [profile, setProfile] = useState<Partial<HomeProfile>>(DEFAULT_PROFILE);

  // Pre-fill ZIP from ?zip=NNNNN if the user came in from the homepage form.
  useEffect(() => {
    const z = searchParams.get("zip");
    if (z && /^\d{5}$/.test(z)) {
      setProfile((prev) => ({ ...prev, zip: z }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [results, setResults] = useState<ReturnType<typeof calcPersonalizedSavings> | null>(null);

  const update = (updates: Partial<HomeProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // Resolve ZIP → county on every render (cheap, prefix lookup).
  const resolved = useMemo(
    () => (profile.zip && profile.zip.length === 5 ? resolveZip(profile.zip) : null),
    [profile.zip]
  );
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;

  const handleFinish = () => {
    if (profile.householdIncome) {
      const amiBracket = determineAMIBracket(profile.householdIncome);
      update({ amiBracket });
    }
    const calc = calcPersonalizedSavings(profile as HomeProfile);
    setResults(calc);
    setStep(5);
  };

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Personalized Energy Plan</h1>
        <p className="text-gray-600 mt-2">
          Answer a few questions about your home. We&apos;ll calculate your exact savings potential
          and rebate eligibility — takes about 5 minutes.
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex flex-col items-center gap-1 cursor-pointer ${
                step >= s.id ? "opacity-100" : "opacity-40"
              }`}
              onClick={() => step > s.id && setStep(s.id as Step)}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                  step === s.id
                    ? "bg-brand-600 text-white shadow-md"
                    : step > s.id
                    ? "bg-brand-200 text-brand-700"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {step > s.id ? "✓" : s.icon}
              </div>
              <span className="text-xs text-gray-500 hidden sm:block">{s.label}</span>
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-8">
        {/* Step 1: Home basics */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tell us about your home</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={profile.zip || ""}
                    onChange={(e) => update({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="ZIP code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Year Built</label>
                  <input
                    type="number"
                    value={profile.yearBuilt || ""}
                    onChange={(e) => update({ yearBuilt: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="1985"
                  />
                </div>
              </div>

              {/* Utility-territory picker — required for utility-scoped rebates */}
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Who delivers your power?
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  {county
                    ? `Detected ${county.name}, ${resolved?.state}. EmPOWER and similar rebates are utility-specific — pick yours so we only show what you actually qualify for.`
                    : "Enter a 5-digit ZIP above to load utility options."}
                </p>
                <UtilityPicker
                  countyId={resolved?.countyId ?? null}
                  electricUtilityId={profile.electricUtilityId}
                  gasUtilityId={profile.gasUtilityId}
                  onChange={(next) =>
                    update({
                      electricUtilityId: next.electricUtilityId,
                      gasUtilityId: next.gasUtilityId,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Square Footage: {(profile.squareFootage || 2000).toLocaleString()} sq ft
                </label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={profile.squareFootage || 2000}
                  onChange={(e) => update({ squareFootage: parseInt(e.target.value) })}
                  className="w-full accent-brand-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>500 sq ft</span>
                  <span>5,000 sq ft</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={profile.bedrooms || 3}
                    onChange={(e) => update({ bedrooms: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Do you own the home?</label>
                  <div className="flex gap-3 mt-1">
                    {["Yes", "No"].map((opt) => (
                      <button
                        key={opt}
                        className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          opt === "Yes"
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-gray-200 text-gray-600"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Energy systems */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Current energy systems</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Primary heating fuel
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "gas", label: "🔥 Natural Gas", sub: "Washington Gas" },
                    { value: "electric", label: "⚡ Electric", sub: "Heat pump or resistance" },
                    { value: "oil", label: "🛢️ Oil", sub: "Fuel oil" },
                    { value: "propane", label: "🔵 Propane", sub: "Propane tank" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update({ primaryHeatingFuel: opt.value as any, hasGas: opt.value === "gas" })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        profile.primaryHeatingFuel === opt.value
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-semibold text-sm text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Current HVAC system type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "central-ac-gas-furnace", label: "Central AC + Gas Furnace" },
                    { value: "heat-pump", label: "Heat Pump (existing)" },
                    { value: "window-ac", label: "Window AC" },
                    { value: "boiler", label: "Boiler (steam/hot water)" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update({ currentHvacType: opt.value as any })}
                      className={`p-3 rounded-xl border-2 text-left text-sm transition-all ${
                        profile.currentHvacType === opt.value
                          ? "border-brand-500 bg-brand-50 font-semibold text-brand-800"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    How old is your HVAC? (years)
                  </label>
                  <input
                    type="number"
                    value={profile.hvacAge || ""}
                    onChange={(e) => update({ hvacAge: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. 12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Electrical panel size
                  </label>
                  <select
                    value={profile.electricPanel || 200}
                    onChange={(e) => update({ electricPanel: parseInt(e.target.value) as any })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={100}>100 amp</option>
                    <option value={150}>150 amp</option>
                    <option value={200}>200 amp</option>
                    <option value={400}>400 amp</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Have solar?", key: "hasExistingSolar" },
                  { label: "Have EV?", key: "hasEv" },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{item.label}</label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => update({ [item.key]: opt === "Yes" } as any)}
                          className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                            (profile[item.key as keyof HomeProfile] === true && opt === "Yes") ||
                            (profile[item.key as keyof HomeProfile] === false && opt === "No")
                              ? "border-brand-500 bg-brand-50 text-brand-700"
                              : "border-gray-200 text-gray-600"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Usage & Bills */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Energy usage & bills</h2>
            <p className="text-sm text-gray-500 mb-6">
              Optional but improves accuracy. Check your PEPCO and Washington Gas bills, or use our estimates.
            </p>
            <div className="space-y-5">
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                <strong>Estimates for your home size ({profile.squareFootage?.toLocaleString()} sq ft, {profile.yearBuilt}):</strong>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>Annual electricity: ~{Math.round((profile.squareFootage || 2000) * 5.5).toLocaleString()} kWh</div>
                  <div>Annual gas: ~{Math.round((profile.squareFootage || 2000) * 0.47)} therms</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Annual electricity usage (kWh) — leave blank to use estimate
                </label>
                <input
                  type="number"
                  value={profile.annualKwh || ""}
                  onChange={(e) => update({ annualKwh: parseInt(e.target.value) || undefined })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder={`~${Math.round((profile.squareFootage || 2000) * 5.5).toLocaleString()} kWh (estimated)`}
                />
              </div>

              {profile.hasGas && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Annual gas usage (therms) — leave blank to use estimate
                  </label>
                  <input
                    type="number"
                    value={profile.annualTherms || ""}
                    onChange={(e) => update({ annualTherms: parseInt(e.target.value) || undefined })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder={`~${Math.round((profile.squareFootage || 2000) * 0.47)} therms (estimated)`}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Roof details (for solar estimate)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "south", label: "⬆️ South-facing (best)" },
                    { value: "east-west", label: "↔️ East/West" },
                    { value: "flat", label: "⬜ Flat roof" },
                    { value: "north", label: "⬇️ North-facing" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => update({ roofOrientation: opt.value as any })}
                      className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                        profile.roofOrientation === opt.value
                          ? "border-brand-500 bg-brand-50 font-semibold text-brand-800"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Household Income */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Household information</h2>
            <p className="text-sm text-gray-500 mb-6">
              Income determines eligibility for several programs (MSAP solar, HEEHRA, Green Bank loan).
              This information is never shared and only used to calculate your rebate eligibility.
            </p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Annual household income (approximate)
                </label>
                <div className="space-y-2">
                  {[
                    { label: "Under $87,000 (below 80% AMI)", value: 75000, bracket: "below-80" as AMIBracket },
                    { label: "$87,000–$163,000 (80–150% AMI)", value: 120000, bracket: "80-150" as AMIBracket },
                    { label: "Over $163,000 (above 150% AMI)", value: 200000, bracket: "above-150" as AMIBracket },
                    { label: "Prefer not to say", value: 0, bracket: "unknown" as AMIBracket },
                  ].map((opt) => (
                    <button
                      key={opt.bracket}
                      onClick={() => update({ householdIncome: opt.value, amiBracket: opt.bracket })}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        profile.amiBracket === opt.bracket
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-medium text-sm text-gray-900">{opt.label}</div>
                      {opt.bracket !== "unknown" && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {opt.bracket === "below-80"
                            ? "Qualifies for MSAP solar, HEEHRA, Green Bank loan"
                            : opt.bracket === "80-150"
                            ? "Qualifies for MSAP solar, 50% HEEHRA, Green Bank loan"
                            : "Qualifies for EmPOWER, Electrify MC, RCES (no income limit)"}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How urgent is your HVAC replacement?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "My system died", urgency: "critical" },
                    { label: "It's on its way out", urgency: "planning" },
                    { label: "Just exploring", urgency: "exploring" },
                  ].map((opt) => (
                    <button
                      key={opt.urgency}
                      className="p-3 rounded-xl border-2 border-gray-200 text-sm text-gray-600 hover:border-gray-300 transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && results && (
          <div>
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personalized Plan</h2>
              <p className="text-gray-500">
                Based on your {profile.squareFootage?.toLocaleString()} sq ft,{" "}
                {profile.yearBuilt} home{county ? ` in ${county.name}` : ""}
              </p>
            </div>

            {/* Current annual cost */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-center">
              <div className="text-sm text-gray-500 mb-1">Estimated current annual energy cost</div>
              <div className="text-4xl font-bold text-gray-900">
                {formatCurrency(results.currentAnnualCost)}
              </div>
              <div className="text-sm text-gray-400 mt-1">electricity + gas</div>
            </div>

            {/* Savings by upgrade */}
            <div className="space-y-4 mb-8">
              <h3 className="font-bold text-gray-900">Your savings opportunities</h3>

              {[
                {
                  icon: "💡",
                  label: "LED Lighting (do first)",
                  savings: formatCurrency(results.ledSavings.annualDollarsSaved) + "/yr",
                  cost: formatCurrency(results.ledSavings.investmentCost),
                  payback: results.ledSavings.paybackMonths.toFixed(1) + " months",
                  badge: "Best ROI",
                  badgeColor: "green",
                },
                {
                  icon: "☀️",
                  label: "Solar System",
                  savings: formatCurrency(results.solarSavings.totalAnnualValue) + "/yr",
                  cost: formatCurrency(results.solarSavings.grossSystemCost),
                  payback: results.solarSavings.simplePaybackYears.toFixed(1) + " years",
                  badge: "Best Standalone",
                  badgeColor: "amber",
                },
                {
                  icon: "💧",
                  label: "Heat Pump Water Heater",
                  savings: formatCurrency(results.hpwhSavings.annualSavings) + "/yr",
                  cost: formatCurrency(results.hpwhSavings.netInvestmentAfterRebates) + " after rebates",
                  payback: results.hpwhSavings.paybackYears.toFixed(1) + " years",
                  badge: "$2,100 rebates",
                  badgeColor: "blue",
                },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between card p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500">
                        Cost: {item.cost} · Payback: {item.payback}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-brand-600">{item.savings}</div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.badgeColor === "green"
                          ? "bg-green-100 text-green-800"
                          : item.badgeColor === "amber"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Estimated rebates */}
            <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6 mb-6">
              <div className="text-sm text-brand-700 font-semibold mb-1">
                Estimated available rebates for your household
              </div>
              <div className="text-3xl font-bold text-brand-700">
                {formatCurrency(results.estimatedRebatesAvailable)}
              </div>
              <div className="text-xs text-brand-600 mt-1">
                {profile.amiBracket === "below-80" || profile.amiBracket === "80-150"
                  ? "Includes income-qualified programs (MSAP, HEEHRA pending)"
                  : "Based on EmPOWER, Electrify MC, and RCES (no income limit)"}
              </div>
            </div>

            {/* Next steps */}
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900">Recommended next steps</h3>
              {[
                { label: "Find vetted contractors", href: "/contractors", icon: "👷" },
                { label: "Explore all rebates", href: "/rebates", icon: "💰" },
                { label: "Compare products", href: "/products", icon: "📊" },
              ].map((item, i) => (
                <Link
                  key={i}
                  href={item.href}
                  className="flex items-center justify-between card p-4 hover:border-brand-300 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-semibold text-gray-900 group-hover:text-brand-700 text-sm">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-brand-600 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        {step < 5 && (
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => (s - 1) as Step)}
                className="btn-secondary py-3 px-6 text-sm"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <button
                onClick={() => setStep((s) => (s + 1) as Step)}
                className="btn-primary py-3 px-6 text-sm"
              >
                Continue →
              </button>
            ) : (
              <button onClick={handleFinish} className="btn-primary py-3 px-6 text-sm">
                See My Plan →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12">Loading…</div>}>
      <IntakeBody />
    </Suspense>
  );
}
