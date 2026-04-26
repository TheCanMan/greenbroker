"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resolveZip } from "@/lib/geo/zip-lookup";
import { COUNTY_BY_ID } from "@/lib/geo/registry";
import { UtilityPicker } from "@/components/geo/UtilityPicker";
import { GREENBROKER_PLAN_STORAGE_KEY } from "@/lib/residential/agents";

// ─── Form types ──────────────────────────────────────────────────────────────
// Mirrors the Phase-1 spec sections A–F. Anything not pre-existing on
// home_assessments is stored in the intake_v2 JSONB column on save.

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
type AssistanceProgram = "SNAP" | "Medicaid" | "LIHEAP" | "SSI" | "other" | "none" | "prefer_not_to_say";

interface FormState {
  // A. Home basics
  address: string;
  zip: string;
  city: string;
  homeType: HomeType | "";
  ownership: Ownership | "";
  yearBuilt: number;
  squareFootage: number;
  occupants: number;

  // B. Utility info
  electricUtilityId: string;
  gasUtilityId: string;
  currentSupplierKnown: boolean;
  currentSupplierName: string;
  averageMonthlyBill: number | "";
  annualKwh: number | "";
  annualTherms: number | "";

  // C. Existing equipment
  heatingType: HeatingType | "";
  coolingType: CoolingType | "";
  waterHeaterType: WaterHeaterType | "";
  waterHeaterAge: number | "";
  hvacAge: number | "";
  hasSmartThermostat: boolean;
  insulationConcerns: string;
  windowCondition: string;
  roofAge: number | "";

  // D. Goals
  goals: Goal[];

  // E. Eligibility
  householdSize: number | "";
  incomeRange: IncomeRange | "";
  assistancePrograms: AssistanceProgram[];

  // F. Consent
  consentGeneratePlan: boolean;
  consentStoreDocuments: boolean;
  consentContact: boolean;
}

const DEFAULTS: FormState = {
  address: "",
  zip: "",
  city: "",
  homeType: "",
  ownership: "",
  yearBuilt: 1985,
  squareFootage: 2000,
  occupants: 3,

  electricUtilityId: "",
  gasUtilityId: "",
  currentSupplierKnown: false,
  currentSupplierName: "",
  averageMonthlyBill: "",
  annualKwh: "",
  annualTherms: "",

  heatingType: "",
  coolingType: "",
  waterHeaterType: "",
  waterHeaterAge: "",
  hvacAge: "",
  hasSmartThermostat: false,
  insulationConcerns: "",
  windowCondition: "",
  roofAge: "",

  goals: [],

  householdSize: "",
  incomeRange: "",
  assistancePrograms: [],

  consentGeneratePlan: false,
  consentStoreDocuments: false,
  consentContact: false,
};

const SECTIONS = [
  { id: "home", label: "Home basics", icon: "🏠" },
  { id: "utility", label: "Utility & bill", icon: "⚡" },
  { id: "equipment", label: "Equipment", icon: "🛠️" },
  { id: "goals", label: "Goals", icon: "🎯" },
  { id: "eligibility", label: "Eligibility", icon: "👥" },
  { id: "consent", label: "Consent", icon: "✓" },
] as const;

const HOME_TYPES: { value: HomeType; label: string }[] = [
  { value: "single_family", label: "Single-family" },
  { value: "townhouse", label: "Townhouse" },
  { value: "condo", label: "Condo" },
  { value: "multifamily", label: "Multifamily (2–4 units)" },
];

const OWNERSHIP: { value: Ownership; label: string }[] = [
  { value: "own", label: "I own it" },
  { value: "rent", label: "I rent" },
  { value: "landlord", label: "I'm a landlord" },
];

const HEATING: { value: HeatingType; label: string }[] = [
  { value: "gas_furnace", label: "Gas furnace" },
  { value: "electric_resistance", label: "Electric resistance / baseboard" },
  { value: "heat_pump", label: "Heat pump" },
  { value: "oil", label: "Oil" },
  { value: "propane", label: "Propane" },
  { value: "unknown", label: "Not sure" },
];

const COOLING: { value: CoolingType; label: string }[] = [
  { value: "central_ac", label: "Central AC" },
  { value: "heat_pump", label: "Heat pump (heats + cools)" },
  { value: "window_units", label: "Window units" },
  { value: "none", label: "None" },
  { value: "unknown", label: "Not sure" },
];

const WATER_HEATERS: { value: WaterHeaterType; label: string }[] = [
  { value: "gas_tank", label: "Gas tank" },
  { value: "electric_tank", label: "Electric tank" },
  { value: "tankless", label: "Tankless gas" },
  { value: "heat_pump", label: "Heat pump water heater" },
  { value: "unknown", label: "Not sure" },
];

const GOALS: { value: Goal; label: string; icon: string }[] = [
  { value: "lower_bills", label: "Lower my monthly bills", icon: "💰" },
  { value: "replace_broken_equipment", label: "Replace broken equipment", icon: "🔧" },
  { value: "improve_comfort", label: "Improve home comfort", icon: "🛋️" },
  { value: "electrify_home", label: "Electrify my home (drop gas)", icon: "🔌" },
  { value: "solar_or_battery", label: "Add solar or battery storage", icon: "☀️" },
  { value: "compare_energy_supplier", label: "Compare energy suppliers", icon: "📊" },
  { value: "get_contractor_quotes", label: "Get contractor quotes", icon: "🧾" },
  { value: "improve_indoor_air_quality", label: "Improve indoor air quality", icon: "🌬️" },
];

const INCOME_RANGES: { value: IncomeRange; label: string }[] = [
  { value: "under_50k", label: "Under $50,000" },
  { value: "50k_80k", label: "$50,000 – $80,000" },
  { value: "80k_120k", label: "$80,000 – $120,000" },
  { value: "120k_180k", label: "$120,000 – $180,000" },
  { value: "over_180k", label: "Over $180,000" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const ASSISTANCE: { value: AssistanceProgram; label: string }[] = [
  { value: "SNAP", label: "SNAP" },
  { value: "Medicaid", label: "Medicaid" },
  { value: "LIHEAP", label: "LIHEAP" },
  { value: "SSI", label: "SSI" },
  { value: "other", label: "Other" },
  { value: "none", label: "None" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

function IntakeForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill ZIP from ?zip= param if homepage form sent us here.
  useEffect(() => {
    const z = sp.get("zip");
    if (z && /^\d{5}$/.test(z)) {
      setForm((prev) => ({ ...prev, zip: z }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resolved = useMemo(
    () => (form.zip.length === 5 ? resolveZip(form.zip) : null),
    [form.zip]
  );
  const county = resolved ? COUNTY_BY_ID.get(resolved.countyId) : null;

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Validation: minimum required fields before submit.
  const blockers: string[] = [];
  if (!form.zip || form.zip.length !== 5) blockers.push("ZIP code");
  if (!form.homeType) blockers.push("home type");
  if (!form.ownership) blockers.push("ownership");
  if (!form.electricUtilityId) blockers.push("electric utility");
  if (!form.heatingType) blockers.push("current heating type");
  if (form.goals.length === 0) blockers.push("at least one goal");
  if (!form.consentGeneratePlan) blockers.push("consent to generate plan");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blockers.length > 0) {
      setError(`Still need: ${blockers.join(", ")}`);
      sectionRefs.current[SECTIONS[0].id]?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        // Existing AssessmentSchema fields
        zip: form.zip,
        electricUtilityId: form.electricUtilityId || undefined,
        gasUtilityId: form.gasUtilityId || undefined,
        squareFootage: form.squareFootage,
        yearBuilt: form.yearBuilt,
        bedrooms: 3, // legacy required field; not asked in v2
        primaryHeatingFuel: mapHeatingFuel(form.heatingType),
        currentHvacType: mapHvacType(form.heatingType, form.coolingType),
        hvacAge: typeof form.hvacAge === "number" ? form.hvacAge : undefined,
        hasGas: form.heatingType === "gas_furnace" || form.waterHeaterType === "gas_tank",
        annualKwh: typeof form.annualKwh === "number" ? form.annualKwh : undefined,
        annualTherms: typeof form.annualTherms === "number" ? form.annualTherms : undefined,
        householdIncome: undefined, // we collect range, not exact
        amiBracket: "unknown" as const,
        hasExistingSolar: false,
        hasEv: false,
        roofAge: typeof form.roofAge === "number" ? form.roofAge : undefined,
        notes: form.insulationConcerns || undefined,
        photoUrls: [],
        utilityBillUrls: [],

        // v2 extras (server stores in intake_v2 JSONB)
        intake_v2: {
          address: form.address || null,
          city: form.city || null,
          county: county?.name ?? null,
          home_type: form.homeType,
          ownership_status: form.ownership,
          occupants: form.occupants,
          current_supplier_known: form.currentSupplierKnown,
          current_supplier_name: form.currentSupplierName || null,
          average_monthly_bill:
            typeof form.averageMonthlyBill === "number"
              ? form.averageMonthlyBill
              : null,
          cooling_type: form.coolingType || null,
          water_heater_type: form.waterHeaterType || null,
          water_heater_age:
            typeof form.waterHeaterAge === "number" ? form.waterHeaterAge : null,
          has_smart_thermostat: form.hasSmartThermostat,
          insulation_concerns: form.insulationConcerns || null,
          window_condition: form.windowCondition || null,
          goals: form.goals,
          household_size:
            typeof form.householdSize === "number" ? form.householdSize : null,
          income_range: form.incomeRange || null,
          assistance_programs: form.assistancePrograms,
          consent_generate_plan: form.consentGeneratePlan,
          consent_store_documents: form.consentStoreDocuments,
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
      const planSnapshot = {
        assessmentId: data.id,
        address: form.address || null,
        zip: form.zip,
        city: form.city || null,
        county: county?.name ?? null,
        state: resolved?.state ?? null,
        electricUtilityId: form.electricUtilityId || null,
        gasUtilityId: form.gasUtilityId || null,
        homeType: form.homeType || null,
        ownershipStatus: form.ownership || null,
        yearBuilt: form.yearBuilt,
        squareFeet: form.squareFootage,
        occupants: form.occupants,
        averageMonthlyBill:
          typeof form.averageMonthlyBill === "number"
            ? form.averageMonthlyBill
            : null,
        annualKwh:
          typeof form.annualKwh === "number" ? form.annualKwh : null,
        annualTherms:
          typeof form.annualTherms === "number" ? form.annualTherms : null,
        currentSupplierKnown: form.currentSupplierKnown,
        currentSupplierName: form.currentSupplierName || null,
        heatingType: form.heatingType || null,
        coolingType: form.coolingType || null,
        waterHeaterType: form.waterHeaterType || null,
        waterHeaterAge:
          typeof form.waterHeaterAge === "number" ? form.waterHeaterAge : null,
        hvacAge: typeof form.hvacAge === "number" ? form.hvacAge : null,
        hasSmartThermostat: form.hasSmartThermostat,
        insulationConcerns: form.insulationConcerns || null,
        windowCondition: form.windowCondition || null,
        roofAge: typeof form.roofAge === "number" ? form.roofAge : null,
        goals: form.goals,
        householdSize:
          typeof form.householdSize === "number" ? form.householdSize : null,
        incomeRange: form.incomeRange || null,
        assistancePrograms: form.assistancePrograms,
        submittedAt: new Date().toISOString(),
      };

      try {
        sessionStorage.setItem(
          GREENBROKER_PLAN_STORAGE_KEY,
          JSON.stringify(planSnapshot),
        );
      } catch {
        // Session storage is only a convenience for the immediate results page.
      }
      // Route to plan with location params so /plan can scope rebates immediately.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        {/* Sticky section nav */}
        <aside className="hidden lg:block sticky top-24 self-start">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Sections
          </p>
          <nav className="space-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  sectionRefs.current[s.id]?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg"
              >
                <span>{s.icon}</span>
                {s.label}
              </a>
            ))}
          </nav>
          <p className="text-xs text-gray-400 mt-6 leading-relaxed">
            One form. Takes about 2 minutes. We&apos;ll route to your personalized
            plan when you finish.
          </p>
        </aside>

        <form onSubmit={handleSubmit} className="space-y-10">
          <header>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Check My Rebates
            </h1>
            <p className="text-gray-600">
              Tell us about your home and goals — we&apos;ll show every rebate you
              qualify for, calculate net cost, and prepare paperwork.
            </p>
          </header>

          {/* A. Home basics */}
          <Section
            id="home"
            title="A. Home basics"
            icon="🏠"
            innerRef={(el) => (sectionRefs.current.home = el)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Street address (optional)" full>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="123 Main St"
                  className={inputCls}
                  autoComplete="street-address"
                />
              </Field>
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
                {form.zip.length === 5 && !resolved && (
                  <p className="text-xs text-amber-600 mt-1">
                    We don&apos;t serve this ZIP yet — you can still save your info.
                  </p>
                )}
                {county && (
                  <p className="text-xs text-emerald-700 mt-1">
                    ✓ {county.name}, {resolved?.state}
                  </p>
                )}
              </Field>
              <Field label="City">
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  placeholder="Rockville"
                  className={inputCls}
                  autoComplete="address-level2"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Home type *">
                <Chips
                  options={HOME_TYPES}
                  value={form.homeType}
                  onChange={(v) => update("homeType", v as HomeType)}
                />
              </Field>
              <Field label="Ownership *">
                <Chips
                  options={OWNERSHIP}
                  value={form.ownership}
                  onChange={(v) => update("ownership", v as Ownership)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Year built">
                <input
                  type="number"
                  value={form.yearBuilt}
                  onChange={(e) =>
                    update("yearBuilt", parseInt(e.target.value) || 1985)
                  }
                  min={1800}
                  max={new Date().getFullYear()}
                  className={inputCls}
                />
              </Field>
              <Field label="Square feet">
                <input
                  type="number"
                  value={form.squareFootage}
                  onChange={(e) =>
                    update("squareFootage", parseInt(e.target.value) || 2000)
                  }
                  min={200}
                  max={20000}
                  step={50}
                  className={inputCls}
                />
              </Field>
              <Field label="Occupants">
                <input
                  type="number"
                  value={form.occupants}
                  onChange={(e) =>
                    update("occupants", parseInt(e.target.value) || 3)
                  }
                  min={1}
                  max={20}
                  className={inputCls}
                />
              </Field>
            </div>
          </Section>

          {/* B. Utility */}
          <Section
            id="utility"
            title="B. Utility & bill"
            icon="⚡"
            innerRef={(el) => (sectionRefs.current.utility = el)}
          >
            <Field label="Who delivers your power? *">
              {county ? (
                <UtilityPicker
                  countyId={resolved!.countyId}
                  electricUtilityId={form.electricUtilityId || undefined}
                  gasUtilityId={form.gasUtilityId || undefined}
                  onChange={(next) => {
                    update("electricUtilityId", next.electricUtilityId ?? "");
                    update("gasUtilityId", next.gasUtilityId ?? "");
                  }}
                />
              ) : (
                <p className="text-xs text-gray-500">
                  Enter a ZIP above first to load utility options.
                </p>
              )}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Do you know your current supplier?">
                <Chips
                  options={[
                    { value: "yes", label: "Yes" },
                    { value: "no", label: "No / Default supply" },
                  ]}
                  value={form.currentSupplierKnown ? "yes" : "no"}
                  onChange={(v) => update("currentSupplierKnown", v === "yes")}
                />
              </Field>
              {form.currentSupplierKnown && (
                <Field label="Current supplier name">
                  <input
                    type="text"
                    value={form.currentSupplierName}
                    onChange={(e) => update("currentSupplierName", e.target.value)}
                    placeholder="e.g. Constellation"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Average monthly bill ($)">
                <input
                  type="number"
                  value={form.averageMonthlyBill}
                  onChange={(e) =>
                    update(
                      "averageMonthlyBill",
                      e.target.value === "" ? "" : parseFloat(e.target.value)
                    )
                  }
                  min={0}
                  step={5}
                  className={inputCls}
                  placeholder="200"
                />
              </Field>
              <Field label="Annual kWh (optional)">
                <input
                  type="number"
                  value={form.annualKwh}
                  onChange={(e) =>
                    update(
                      "annualKwh",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  min={0}
                  step={100}
                  className={inputCls}
                  placeholder="11000"
                />
              </Field>
              <Field label="Annual therms (optional)">
                <input
                  type="number"
                  value={form.annualTherms}
                  onChange={(e) =>
                    update(
                      "annualTherms",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  min={0}
                  step={10}
                  className={inputCls}
                  placeholder="940"
                />
              </Field>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Bill upload coming soon — for now, your annual usage is enough for an
              accurate estimate. We&apos;ll show ranges and tighten them as you add data.
            </p>
          </Section>

          {/* C. Equipment */}
          <Section
            id="equipment"
            title="C. Existing equipment"
            icon="🛠️"
            innerRef={(el) => (sectionRefs.current.equipment = el)}
          >
            <Field label="Heating *">
              <Chips
                options={HEATING}
                value={form.heatingType}
                onChange={(v) => update("heatingType", v as HeatingType)}
              />
            </Field>
            <Field label="Cooling">
              <Chips
                options={COOLING}
                value={form.coolingType}
                onChange={(v) => update("coolingType", v as CoolingType)}
              />
            </Field>
            <Field label="Water heater">
              <Chips
                options={WATER_HEATERS}
                value={form.waterHeaterType}
                onChange={(v) => update("waterHeaterType", v as WaterHeaterType)}
              />
            </Field>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="HVAC age (years)">
                <input
                  type="number"
                  value={form.hvacAge}
                  onChange={(e) =>
                    update(
                      "hvacAge",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  min={0}
                  max={60}
                  className={inputCls}
                />
              </Field>
              <Field label="Water heater age">
                <input
                  type="number"
                  value={form.waterHeaterAge}
                  onChange={(e) =>
                    update(
                      "waterHeaterAge",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  min={0}
                  max={50}
                  className={inputCls}
                />
              </Field>
              <Field label="Roof age">
                <input
                  type="number"
                  value={form.roofAge}
                  onChange={(e) =>
                    update(
                      "roofAge",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  min={0}
                  max={60}
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="space-y-3">
              <CheckRow
                label="I already have a smart thermostat"
                checked={form.hasSmartThermostat}
                onChange={(v) => update("hasSmartThermostat", v)}
              />
            </div>

            <Field label="Insulation concerns (optional)">
              <textarea
                rows={2}
                value={form.insulationConcerns}
                onChange={(e) => update("insulationConcerns", e.target.value)}
                placeholder="e.g. attic feels under-insulated, basement walls bare"
                className={inputCls}
              />
            </Field>

            <Field label="Window condition (optional)">
              <input
                type="text"
                value={form.windowCondition}
                onChange={(e) => update("windowCondition", e.target.value)}
                placeholder="e.g. original single-pane / double-pane / mostly replaced"
                className={inputCls}
              />
            </Field>
          </Section>

          {/* D. Goals */}
          <Section
            id="goals"
            title="D. Goals"
            icon="🎯"
            innerRef={(el) => (sectionRefs.current.goals = el)}
          >
            <p className="text-sm text-gray-500 -mt-2">
              Select all that apply. We use these to rank upgrade recommendations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {GOALS.map((g) => {
                const checked = form.goals.includes(g.value);
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() =>
                      update(
                        "goals",
                        checked
                          ? form.goals.filter((x) => x !== g.value)
                          : [...form.goals, g.value]
                      )
                    }
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                      checked
                        ? "border-brand-500 bg-brand-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <span className="font-medium text-gray-900">{g.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* E. Eligibility */}
          <Section
            id="eligibility"
            title="E. Eligibility"
            icon="👥"
            innerRef={(el) => (sectionRefs.current.eligibility = el)}
          >
            <p className="text-sm text-gray-500 -mt-2">
              Used only to show income-qualified rebates (HEEHRA, MSAP, Green Bank
              loan). We never share this with anyone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Household size">
                <input
                  type="number"
                  value={form.householdSize}
                  onChange={(e) =>
                    update(
                      "householdSize",
                      e.target.value === "" ? "" : parseInt(e.target.value)
                    )
                  }
                  min={1}
                  max={20}
                  placeholder="3"
                  className={inputCls}
                />
              </Field>
              <Field label="Annual household income">
                <select
                  value={form.incomeRange}
                  onChange={(e) =>
                    update("incomeRange", e.target.value as IncomeRange)
                  }
                  className={inputCls}
                >
                  <option value="">Select range…</option>
                  {INCOME_RANGES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Receives any of these (optional)">
              <div className="flex flex-wrap gap-2">
                {ASSISTANCE.map((a) => {
                  const checked = form.assistancePrograms.includes(a.value);
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() =>
                        update(
                          "assistancePrograms",
                          checked
                            ? form.assistancePrograms.filter((x) => x !== a.value)
                            : [...form.assistancePrograms, a.value]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium ${
                        checked
                          ? "border-brand-500 bg-brand-50 text-brand-800"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {a.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </Section>

          {/* F. Consent */}
          <Section
            id="consent"
            title="F. Consent"
            icon="✓"
            innerRef={(el) => (sectionRefs.current.consent = el)}
          >
            <CheckRow
              label="Generate my personalized energy plan from this intake *"
              checked={form.consentGeneratePlan}
              onChange={(v) => update("consentGeneratePlan", v)}
            />
            <CheckRow
              label="Store any documents I upload (utility bills, photos) so I can come back later"
              checked={form.consentStoreDocuments}
              onChange={(v) => update("consentStoreDocuments", v)}
            />
            <CheckRow
              label="Contact me with rebate updates and program changes (optional)"
              checked={form.consentContact}
              onChange={(v) => update("consentContact", v)}
            />
            <p className="text-xs text-gray-500 leading-relaxed mt-2">
              We don&apos;t auto-submit rebate forms or auto-switch energy suppliers.
              Anything that goes out goes through your review first.
            </p>
          </Section>

          {/* Submit */}
          <div className="border-t border-gray-200 pt-6 sticky bottom-0 bg-white pb-4">
            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-3">
                {error}
              </p>
            )}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-xs text-gray-500">
                {blockers.length === 0
                  ? "Looks good — ready to generate your plan."
                  : `Still need: ${blockers.join(", ")}`}
              </p>
              <button
                type="submit"
                disabled={submitting || blockers.length > 0}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-base py-3 px-6"
              >
                {submitting ? "Generating plan…" : "Generate my energy plan →"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Or{" "}
              <Link href="/" className="underline hover:text-gray-600">
                back to homepage
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapHeatingFuel(h: HeatingType | ""): "gas" | "electric" | "oil" | "propane" {
  switch (h) {
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
  h: HeatingType | "",
  c: CoolingType | ""
): "central-ac-gas-furnace" | "heat-pump" | "window-ac" | "boiler" | "mini-split" {
  if (h === "heat_pump" || c === "heat_pump") return "heat-pump";
  if (c === "window_units") return "window-ac";
  if (h === "oil" || h === "propane") return "boiler";
  return "central-ac-gas-furnace";
}

const inputCls =
  "w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500";

function Section({
  id,
  title,
  icon,
  children,
  innerRef,
}: {
  id: string;
  title: string;
  icon: string;
  children: React.ReactNode;
  innerRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <section id={id} ref={innerRef} className="card p-6 scroll-mt-24">
      <header className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{icon}</span>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="block text-xs font-semibold text-gray-700 mb-1">{label}</span>
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
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
            value === o.value
              ? "border-brand-500 bg-brand-50 text-brand-800"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {o.label}
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
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
      />
      <span className="text-gray-700 leading-snug">{label}</span>
    </label>
  );
}

export default function IntakePage() {
  return (
    <Suspense
      fallback={<div className="max-w-3xl mx-auto px-4 py-12">Loading…</div>}
    >
      <IntakeForm />
    </Suspense>
  );
}
