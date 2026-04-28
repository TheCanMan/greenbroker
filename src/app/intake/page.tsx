"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UtilityPicker } from "@/components/geo/UtilityPicker";
import { COUNTY_BY_ID, UTILITY_BY_ID } from "@/lib/geo/registry";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { GREENBROKER_PLAN_STORAGE_KEY } from "@/lib/residential/agents";

type HomeType = "single_family" | "townhouse" | "condo" | "multifamily";
type Ownership = "own" | "rent" | "landlord";
type HeatingType =
  | "gas_furnace"
  | "electric_resistance"
  | "heat_pump"
  | "oil"
  | "propane"
  | "unknown";
type CoolingType = "central_ac" | "heat_pump" | "window_units" | "none" | "unknown";
type WaterHeaterType =
  | "gas_tank"
  | "electric_tank"
  | "tankless"
  | "heat_pump"
  | "unknown";
type Goal =
  | "lower_bills"
  | "replace_broken_equipment"
  | "improve_comfort"
  | "electrify_home"
  | "solar_or_battery"
  | "compare_energy_supplier"
  | "get_contractor_quotes"
  | "improve_indoor_air_quality";
type IncomeRange =
  | "under_50k"
  | "50k_80k"
  | "80k_120k"
  | "120k_180k"
  | "over_180k"
  | "prefer_not_to_say";
type StepId = "home" | "utility" | "systems" | "goals" | "review";

interface FormState {
  address: string;
  zip: string;
  homeType: HomeType | "";
  ownership: Ownership | "";
  yearBuilt: number | "";
  squareFootage: number | "";
  occupants: number | "";
  electricUtilityId: string;
  gasUtilityId: string;
  averageMonthlyBill: number | "";
  annualKwh: number | "";
  heatingType: HeatingType | "";
  coolingType: CoolingType | "";
  waterHeaterType: WaterHeaterType | "";
  waterHeaterAge: number | "";
  hvacAge: number | "";
  hasSmartThermostat: boolean;
  insulationConcerns: string;
  goals: Goal[];
  householdSize: number | "";
  incomeRange: IncomeRange | "";
  consentGeneratePlan: boolean;
  consentContact: boolean;
}

const DEFAULTS: FormState = {
  address: "",
  zip: "",
  homeType: "",
  ownership: "",
  yearBuilt: "",
  squareFootage: "",
  occupants: "",
  electricUtilityId: "",
  gasUtilityId: "",
  averageMonthlyBill: "",
  annualKwh: "",
  heatingType: "",
  coolingType: "",
  waterHeaterType: "",
  waterHeaterAge: "",
  hvacAge: "",
  hasSmartThermostat: false,
  insulationConcerns: "",
  goals: [],
  householdSize: "",
  incomeRange: "",
  consentGeneratePlan: false,
  consentContact: false,
};

const STEPS: { id: StepId; label: string; title: string; body: string }[] = [
  {
    id: "home",
    label: "Home",
    title: "Start with the home",
    body: "We only need enough to locate programs and size the first estimate.",
  },
  {
    id: "utility",
    label: "Utility",
    title: "Connect the utility territory",
    body: "Your utility determines which rebates and supplier comparisons apply.",
  },
  {
    id: "systems",
    label: "Systems",
    title: "Tell us what is in the house",
    body: "Heating and water-heater details drive the first upgrade ranking.",
  },
  {
    id: "goals",
    label: "Goals",
    title: "Pick what matters most",
    body: "We use your goals to rank the plan instead of showing every possible project.",
  },
  {
    id: "review",
    label: "Review",
    title: "Review and generate",
    body: "You can view the plan without an account. Saving it requires account creation.",
  },
];

const HOME_TYPES: { value: HomeType; label: string }[] = [
  { value: "single_family", label: "Single-family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multifamily", label: "2-4 unit multifamily" },
];

const OWNERSHIP: { value: Ownership; label: string }[] = [
  { value: "own", label: "I own it" },
  { value: "rent", label: "I rent" },
  { value: "landlord", label: "I am a landlord" },
];

const HEATING: { value: HeatingType; label: string }[] = [
  { value: "gas_furnace", label: "Gas furnace" },
  { value: "electric_resistance", label: "Electric baseboard" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "oil", label: "Oil" },
  { value: "propane", label: "Propane" },
  { value: "unknown", label: "Not sure" },
];

const COOLING: { value: CoolingType; label: string }[] = [
  { value: "central_ac", label: "Central AC" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "window_units", label: "Window units" },
  { value: "none", label: "None" },
  { value: "unknown", label: "Not sure" },
];

const WATER_HEATERS: { value: WaterHeaterType; label: string }[] = [
  { value: "gas_tank", label: "Gas tank" },
  { value: "electric_tank", label: "Electric tank" },
  { value: "tankless", label: "Tankless" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "unknown", label: "Not sure" },
];

const GOALS: { value: Goal; label: string; body: string }[] = [
  {
    value: "lower_bills",
    label: "Lower monthly bills",
    body: "Prioritize short payback and low-risk savings.",
  },
  {
    value: "replace_broken_equipment",
    label: "Replace equipment soon",
    body: "Surface contractor-ready projects and model requirements.",
  },
  {
    value: "improve_comfort",
    label: "Fix comfort problems",
    body: "Rank insulation, air sealing, and HVAC-related work higher.",
  },
  {
    value: "electrify_home",
    label: "Electrify over time",
    body: "Plan heat pumps, water heating, panel needs, and incentives.",
  },
  {
    value: "compare_energy_supplier",
    label: "Compare suppliers safely",
    body: "Review fixed-rate offers and flag risky contract terms.",
  },
  {
    value: "get_contractor_quotes",
    label: "Prepare quote packet",
    body: "Package the home details contractors need to bid accurately.",
  },
  {
    value: "solar_or_battery",
    label: "Consider solar or battery",
    body: "Keep clean-energy programs visible without overpromising.",
  },
  {
    value: "improve_indoor_air_quality",
    label: "Improve indoor air",
    body: "Keep ventilation, filtration, and envelope work in view.",
  },
];

const INCOME_RANGES: { value: IncomeRange; label: string }[] = [
  { value: "under_50k", label: "Under $50,000" },
  { value: "50k_80k", label: "$50,000 - $80,000" },
  { value: "80k_120k", label: "$80,000 - $120,000" },
  { value: "120k_180k", label: "$120,000 - $180,000" },
  { value: "over_180k", label: "Over $180,000" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function IntakeForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const zip = sp.get("zip");
    if (zip && /^\d{5}$/.test(zip)) {
      setForm((prev) => ({ ...prev, zip }));
    }
  }, [sp]);

  const activeStep = STEPS[stepIndex];
  const resolved = useMemo(
    () => (form.zip.length === 5 ? resolveZip(form.zip) : null),
    [form.zip],
  );
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;
  const electricUtility = form.electricUtilityId
    ? UTILITY_BY_ID.get(form.electricUtilityId)
    : null;
  const gasUtility = form.gasUtilityId ? UTILITY_BY_ID.get(form.gasUtilityId) : null;

  useEffect(() => {
    setForm((prev) => {
      if (!prev.electricUtilityId && !prev.gasUtilityId) return prev;
      return {
        ...prev,
        electricUtilityId: "",
        gasUtilityId: "",
      };
    });
  }, [resolved?.countyId]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const stepBlockers = getStepBlockers(activeStep.id, form);
  const finalBlockers = STEPS.flatMap((step) => getStepBlockers(step.id, form));
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  function goNext() {
    if (stepBlockers.length > 0) {
      setError(`Still need: ${stepBlockers.join(", ")}`);
      return;
    }

    setError(null);
    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (finalBlockers.length > 0) {
      setError(`Still need: ${finalBlockers.join(", ")}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    const city = county?.name?.replace(" County", "") ?? null;
    const squareFootage = typeof form.squareFootage === "number" ? form.squareFootage : 2000;
    const yearBuilt = typeof form.yearBuilt === "number" ? form.yearBuilt : 1985;
    const occupants = typeof form.occupants === "number" ? form.occupants : 3;

    try {
      const payload = {
        zip: form.zip,
        electricUtilityId: form.electricUtilityId || undefined,
        gasUtilityId: form.gasUtilityId || undefined,
        squareFootage,
        yearBuilt,
        bedrooms: 3,
        primaryHeatingFuel: mapHeatingFuel(form.heatingType),
        currentHvacType: mapHvacType(form.heatingType, form.coolingType),
        hvacAge: typeof form.hvacAge === "number" ? form.hvacAge : undefined,
        hasGas: form.heatingType === "gas_furnace" || form.waterHeaterType === "gas_tank",
        annualKwh: typeof form.annualKwh === "number" ? form.annualKwh : undefined,
        annualTherms: undefined,
        householdIncome: undefined,
        amiBracket: "unknown" as const,
        hasExistingSolar: false,
        hasEv: false,
        roofAge: undefined,
        notes: form.insulationConcerns || undefined,
        photoUrls: [],
        utilityBillUrls: [],
        intake_v2: {
          address: form.address || null,
          city,
          county: county?.name ?? null,
          home_type: form.homeType,
          ownership_status: form.ownership,
          occupants,
          current_supplier_known: false,
          current_supplier_name: null,
          average_monthly_bill:
            typeof form.averageMonthlyBill === "number" ? form.averageMonthlyBill : null,
          heating_type: form.heatingType || null,
          cooling_type: form.coolingType || null,
          water_heater_type: form.waterHeaterType || null,
          water_heater_age:
            typeof form.waterHeaterAge === "number" ? form.waterHeaterAge : null,
          has_smart_thermostat: form.hasSmartThermostat,
          insulation_concerns: form.insulationConcerns || null,
          window_condition: null,
          goals: form.goals,
          household_size: typeof form.householdSize === "number" ? form.householdSize : null,
          income_range: form.incomeRange || null,
          assistance_programs: [],
          consent_generate_plan: form.consentGeneratePlan,
          consent_store_documents: false,
          consent_contact: form.consentContact,
          submitted_at: new Date().toISOString(),
        },
      };

      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Failed to save assessment.");
        setSubmitting(false);
        return;
      }

      const planSnapshot = data.snapshot ?? {
        assessmentId: data.id,
        address: form.address || null,
        zip: form.zip,
        city,
        county: county?.name ?? null,
        state: resolved?.state ?? null,
        electricUtilityId: form.electricUtilityId || null,
        gasUtilityId: form.gasUtilityId || null,
        homeType: form.homeType || null,
        ownershipStatus: form.ownership || null,
        yearBuilt,
        squareFeet: squareFootage,
        occupants,
        averageMonthlyBill:
          typeof form.averageMonthlyBill === "number" ? form.averageMonthlyBill : null,
        annualKwh: typeof form.annualKwh === "number" ? form.annualKwh : null,
        annualTherms: null,
        currentSupplierKnown: false,
        currentSupplierName: null,
        heatingType: form.heatingType || null,
        coolingType: form.coolingType || null,
        waterHeaterType: form.waterHeaterType || null,
        waterHeaterAge:
          typeof form.waterHeaterAge === "number" ? form.waterHeaterAge : null,
        hvacAge: typeof form.hvacAge === "number" ? form.hvacAge : null,
        hasSmartThermostat: form.hasSmartThermostat,
        insulationConcerns: form.insulationConcerns || null,
        windowCondition: null,
        roofAge: null,
        goals: form.goals,
        householdSize: typeof form.householdSize === "number" ? form.householdSize : null,
        incomeRange: form.incomeRange || null,
        assistancePrograms: [],
        submittedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(GREENBROKER_PLAN_STORAGE_KEY, JSON.stringify(planSnapshot));
      } catch {
        // The server assessment id still lets /plan recover the data.
      }

      const params = new URLSearchParams({ zip: form.zip });
      if (form.electricUtilityId) params.set("electric", form.electricUtilityId);
      if (form.gasUtilityId) params.set("gas", form.gasUtilityId);
      if (data.id) params.set("assessment", data.id);
      router.push(`/plan?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/70 via-white to-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-sm font-semibold text-brand-700 mb-3">
              Residential pilot: Rockville / Montgomery County / Pepco
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-950">
              Check your home rebates without the paperwork maze.
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl">
              GreenBroker builds a first-pass energy plan from the few details that
              actually change rebates, cost ranges, and next steps.
            </p>
          </div>
          <div className="rounded-3xl border border-brand-100 bg-white/80 p-5 shadow-sm">
            <div className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>Step {stepIndex + 1} of {STEPS.length}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-brand-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              No account required to view the plan. Create one afterward to save it.
            </p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="px-2 pb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                Intake path
              </p>
              <nav className="space-y-1">
                {STEPS.map((step, index) => {
                  const state =
                    index === stepIndex ? "active" : index < stepIndex ? "done" : "upcoming";
                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (index <= stepIndex) setStepIndex(index);
                      }}
                      className={`w-full rounded-2xl px-3 py-3 text-left transition ${
                        state === "active"
                          ? "bg-brand-600 text-white shadow-sm"
                          : state === "done"
                            ? "text-brand-800 hover:bg-brand-50"
                            : "text-gray-400"
                      }`}
                    >
                      <span className="block text-xs font-semibold">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="block text-sm font-bold">{step.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6 sm:p-8">
              <p className="text-sm font-semibold text-brand-700">
                {activeStep.label}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-gray-950">
                {activeStep.title}
              </h2>
              <p className="mt-2 text-sm text-gray-500">{activeStep.body}</p>
            </div>

            <div className="p-6 sm:p-8">
              {activeStep.id === "home" && (
                <div className="space-y-6">
                  <Field label="Street address">
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => update("address", e.target.value)}
                      placeholder="123 Main St"
                      className={inputCls}
                      autoComplete="street-address"
                    />
                    <p className="mt-1 text-xs text-gray-400">
                      Optional for now, but it improves contractor and rebate packet prep.
                    </p>
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                    <Field label="ZIP code *">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={form.zip}
                        onChange={(e) =>
                          update("zip", e.target.value.replace(/\D/g, "").slice(0, 5))
                        }
                        className={inputCls}
                        autoComplete="postal-code"
                        required
                      />
                    </Field>
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Service area
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-800">
                        {county
                          ? `${county.name}, ${resolved?.state}`
                          : form.zip.length === 5
                            ? "Not in the current lookup table yet"
                            : "Enter ZIP to locate programs"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Home type *">
                      <Chips
                        options={HOME_TYPES}
                        value={form.homeType}
                        onChange={(value) => update("homeType", value as HomeType)}
                      />
                    </Field>
                    <Field label="Ownership *">
                      <Chips
                        options={OWNERSHIP}
                        value={form.ownership}
                        onChange={(value) => update("ownership", value as Ownership)}
                      />
                    </Field>
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm font-bold text-gray-900">Improve estimate accuracy</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Optional. We use defaults if you skip these.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Field label="Year built">
                        <input
                          type="number"
                          value={form.yearBuilt}
                          onChange={(e) =>
                            update(
                              "yearBuilt",
                              e.target.value === "" ? "" : parseInt(e.target.value),
                            )
                          }
                          min={1800}
                          max={new Date().getFullYear()}
                          className={inputCls}
                          placeholder="1985"
                        />
                      </Field>
                      <Field label="Square feet">
                        <input
                          type="number"
                          value={form.squareFootage}
                          onChange={(e) =>
                            update(
                              "squareFootage",
                              e.target.value === "" ? "" : parseInt(e.target.value),
                            )
                          }
                          min={200}
                          max={20000}
                          step={50}
                          className={inputCls}
                          placeholder="2000"
                        />
                      </Field>
                      <Field label="Occupants">
                        <input
                          type="number"
                          value={form.occupants}
                          onChange={(e) =>
                            update(
                              "occupants",
                              e.target.value === "" ? "" : parseInt(e.target.value),
                            )
                          }
                          min={1}
                          max={20}
                          className={inputCls}
                          placeholder="3"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {activeStep.id === "utility" && (
                <div className="space-y-6">
                  <Field label="Who delivers your electricity? *">
                    {county && resolved ? (
                      <UtilityPicker
                        countyId={resolved.countyId}
                        electricUtilityId={form.electricUtilityId || undefined}
                        gasUtilityId={form.gasUtilityId || undefined}
                        onChange={(next) => {
                          update("electricUtilityId", next.electricUtilityId ?? "");
                          update("gasUtilityId", next.gasUtilityId ?? "");
                        }}
                      />
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                        Enter a supported ZIP on the previous step to load utility options.
                      </div>
                    )}
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Average monthly energy bill">
                      <input
                        type="number"
                        value={form.averageMonthlyBill}
                        onChange={(e) =>
                          update(
                            "averageMonthlyBill",
                            e.target.value === "" ? "" : parseFloat(e.target.value),
                          )
                        }
                        min={0}
                        step={5}
                        className={inputCls}
                        placeholder="200"
                      />
                    </Field>
                    <Field label="Annual kWh if you know it">
                      <input
                        type="number"
                        value={form.annualKwh}
                        onChange={(e) =>
                          update(
                            "annualKwh",
                            e.target.value === "" ? "" : parseInt(e.target.value),
                          )
                        }
                        min={0}
                        step={100}
                        className={inputCls}
                        placeholder="11000"
                      />
                    </Field>
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-sm font-bold text-blue-950">
                      Bill upload can come later
                    </p>
                    <p className="mt-1 text-sm text-blue-800">
                      The first plan works from ZIP, utility, and a bill estimate. A
                      future upload will tighten the range and extract supplier details.
                    </p>
                  </div>
                </div>
              )}

              {activeStep.id === "systems" && (
                <div className="space-y-6">
                  <Field label="Current heating *">
                    <Chips
                      options={HEATING}
                      value={form.heatingType}
                      onChange={(value) => update("heatingType", value as HeatingType)}
                    />
                  </Field>
                  <Field label="Cooling">
                    <Chips
                      options={COOLING}
                      value={form.coolingType}
                      onChange={(value) => update("coolingType", value as CoolingType)}
                    />
                  </Field>
                  <Field label="Water heater">
                    <Chips
                      options={WATER_HEATERS}
                      value={form.waterHeaterType}
                      onChange={(value) =>
                        update("waterHeaterType", value as WaterHeaterType)
                      }
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="HVAC age">
                      <input
                        type="number"
                        value={form.hvacAge}
                        onChange={(e) =>
                          update(
                            "hvacAge",
                            e.target.value === "" ? "" : parseInt(e.target.value),
                          )
                        }
                        min={0}
                        max={60}
                        className={inputCls}
                        placeholder="15"
                      />
                    </Field>
                    <Field label="Water-heater age">
                      <input
                        type="number"
                        value={form.waterHeaterAge}
                        onChange={(e) =>
                          update(
                            "waterHeaterAge",
                            e.target.value === "" ? "" : parseInt(e.target.value),
                          )
                        }
                        min={0}
                        max={50}
                        className={inputCls}
                        placeholder="10"
                      />
                    </Field>
                    <Field label="Smart thermostat">
                      <CheckRow
                        label="Already installed"
                        checked={form.hasSmartThermostat}
                        onChange={(value) => update("hasSmartThermostat", value)}
                      />
                    </Field>
                  </div>

                  <Field label="Comfort or insulation notes">
                    <textarea
                      rows={3}
                      value={form.insulationConcerns}
                      onChange={(e) => update("insulationConcerns", e.target.value)}
                      placeholder="Drafty rooms, hot upstairs, cold basement, old attic insulation..."
                      className={inputCls}
                    />
                  </Field>
                </div>
              )}

              {activeStep.id === "goals" && (
                <div className="space-y-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {GOALS.map((goal) => {
                      const checked = form.goals.includes(goal.value);
                      return (
                        <button
                          key={goal.value}
                          type="button"
                          onClick={() =>
                            update(
                              "goals",
                              checked
                                ? form.goals.filter((item) => item !== goal.value)
                                : [...form.goals, goal.value],
                            )
                          }
                          className={`rounded-2xl border p-4 text-left transition ${
                            checked
                              ? "border-brand-500 bg-brand-50 shadow-sm"
                              : "border-gray-200 hover:border-brand-200 hover:bg-brand-50/40"
                          }`}
                        >
                          <span className="block text-sm font-bold text-gray-950">
                            {goal.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                            {goal.body}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm font-bold text-gray-900">
                      Optional: income-qualified rebates
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Skip this if you prefer. It only affects programs with income rules.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field label="Household size">
                        <input
                          type="number"
                          value={form.householdSize}
                          onChange={(e) =>
                            update(
                              "householdSize",
                              e.target.value === "" ? "" : parseInt(e.target.value),
                            )
                          }
                          min={1}
                          max={20}
                          placeholder="3"
                          className={inputCls}
                        />
                      </Field>
                      <Field label="Income range">
                        <select
                          value={form.incomeRange}
                          onChange={(e) => update("incomeRange", e.target.value as IncomeRange)}
                          className={inputCls}
                        >
                          <option value="">Skip for now</option>
                          {INCOME_RANGES.map((range) => (
                            <option key={range.value} value={range.value}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>
                </div>
              )}

              {activeStep.id === "review" && (
                <div className="space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SummaryCard
                      label="Home"
                      value={`${formatHomeType(form.homeType)} in ${county?.name ?? form.zip}`}
                      detail={[
                        form.address,
                        form.ownership && formatOwnership(form.ownership),
                        form.squareFootage && `${form.squareFootage.toLocaleString()} sq ft`,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    />
                    <SummaryCard
                      label="Utility"
                      value={electricUtility?.name ?? "Electric utility missing"}
                      detail={gasUtility ? `Gas: ${gasUtility.name}` : "Gas utility optional"}
                    />
                    <SummaryCard
                      label="Systems"
                      value={formatHeating(form.heatingType)}
                      detail={[
                        form.waterHeaterType && `Water heater: ${formatWaterHeater(form.waterHeaterType)}`,
                        form.hvacAge && `HVAC age: ${form.hvacAge} years`,
                      ]
                        .filter(Boolean)
                        .join(" - ")}
                    />
                    <SummaryCard
                      label="Goals"
                      value={`${form.goals.length} selected`}
                      detail={form.goals.map(formatGoal).join(", ")}
                    />
                  </div>

                  <div className="rounded-3xl border border-brand-100 bg-brand-50 p-5">
                    <p className="text-sm font-bold text-brand-950">
                      What happens next
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-brand-900">
                      We generate your My Energy Plan with rebate matches, net cost
                      ranges, estimated savings ranges, and paperwork readiness. We do
                      not auto-submit rebate forms or switch energy suppliers.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <CheckRow
                      label="Generate my personalized energy plan from this intake *"
                      checked={form.consentGeneratePlan}
                      onChange={(value) => update("consentGeneratePlan", value)}
                    />
                    <CheckRow
                      label="Contact me with rebate updates and program changes"
                      checked={form.consentContact}
                      onChange={(value) => update("consentContact", value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 bg-gray-50/80 p-4 sm:p-6">
              {error && (
                <p className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    {stepBlockers.length === 0
                      ? "This step is ready."
                      : `Still need: ${stepBlockers.join(", ")}`}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Required fields are only used when they materially change the plan.
                  </p>
                </div>
                <div className="flex gap-2">
                  {stepIndex > 0 && (
                    <button type="button" onClick={goBack} className="btn-secondary px-5 py-3 text-sm">
                      Back
                    </button>
                  )}
                  {activeStep.id === "review" ? (
                    <button
                      type="submit"
                      disabled={submitting || finalBlockers.length > 0}
                      className="btn-primary px-5 py-3 text-sm disabled:opacity-50"
                    >
                      {submitting ? "Generating plan..." : "Generate my energy plan"}
                    </button>
                  ) : (
                    <button type="button" onClick={goNext} className="btn-primary px-5 py-3 text-sm">
                      Continue
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-gray-400">
                <Link href="/" className="underline hover:text-gray-600">
                  Back to homepage
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function getStepBlockers(step: StepId, form: FormState): string[] {
  if (step === "home") {
    return [
      (!form.zip || form.zip.length !== 5) && "ZIP code",
      !form.homeType && "home type",
      !form.ownership && "ownership",
    ].filter((item): item is string => Boolean(item));
  }

  if (step === "utility") {
    return [!form.electricUtilityId && "electric utility"].filter(
      (item): item is string => Boolean(item),
    );
  }

  if (step === "systems") {
    return [!form.heatingType && "current heating"].filter(
      (item): item is string => Boolean(item),
    );
  }

  if (step === "goals") {
    return [form.goals.length === 0 && "at least one goal"].filter(
      (item): item is string => Boolean(item),
    );
  }

  return [!form.consentGeneratePlan && "consent to generate plan"].filter(
    (item): item is string => Boolean(item),
  );
}

function mapHeatingFuel(heating: HeatingType | ""): "gas" | "electric" | "oil" | "propane" {
  switch (heating) {
    case "gas_furnace":
      return "gas";
    case "electric_resistance":
    case "heat_pump":
      return "electric";
    case "oil":
      return "oil";
    case "propane":
      return "propane";
    default:
      return "gas";
  }
}

function mapHvacType(
  heating: HeatingType | "",
  cooling: CoolingType | "",
): "central-ac-gas-furnace" | "heat-pump" | "window-ac" | "boiler" | "mini-split" {
  if (heating === "heat_pump" || cooling === "heat_pump") return "heat-pump";
  if (cooling === "window_units") return "window-ac";
  if (heating === "oil" || heating === "propane") return "boiler";
  return "central-ac-gas-furnace";
}

function formatHomeType(value: HomeType | "") {
  return HOME_TYPES.find((item) => item.value === value)?.label ?? "Home";
}

function formatOwnership(value: Ownership | "") {
  return OWNERSHIP.find((item) => item.value === value)?.label ?? "";
}

function formatHeating(value: HeatingType | "") {
  return HEATING.find((item) => item.value === value)?.label ?? "Heating not selected";
}

function formatWaterHeater(value: WaterHeaterType | "") {
  return WATER_HEATERS.find((item) => item.value === value)?.label ?? "";
}

function formatGoal(value: Goal) {
  return GOALS.find((item) => item.value === value)?.label ?? value;
}

const inputCls =
  "w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
            value === option.value
              ? "border-brand-500 bg-brand-50 text-brand-800 shadow-sm"
              : "border-gray-200 text-gray-600 hover:border-brand-200 hover:bg-brand-50/40"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="leading-snug text-gray-700">{label}</span>
    </label>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-base font-bold text-gray-950">{value}</p>
      {detail && <p className="mt-1 text-sm text-gray-500">{detail}</p>}
    </div>
  );
}

export default function IntakePage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-12">Loading...</div>}>
      <IntakeForm />
    </Suspense>
  );
}
