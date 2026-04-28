"use client";

import { useState } from "react";
import Link from "next/link";
import { DeploymentReadinessScore } from "@/components/commercial/feature/DeploymentReadinessScore";
import { ODCVReadinessCard } from "@/components/commercial/feature/ODCVReadinessCard";
import type { BasVendor, CommercialAssessment, CommercialBuildingType } from "@/lib/commercial/feature-types";

type Step = "profile" | "systems" | "data" | "results";

const DEFAULT_ASSESSMENT: CommercialAssessment = {
  id: "local-commercial-assessment",
  buildingName: "",
  address: "",
  buildingType: "office",
  sqft: 65000,
  yearBuilt: 1998,
  utilityProvider: "Pepco",
  annualElectricSpend: 120000,
  annualGasSpend: 35000,
  basVendor: "Unknown",
  hasVfds: false,
  hasCentralAhus: true,
  hasCo2Sensors: false,
  hasIaqSensors: false,
  hasSubmeters: false,
  hasControllableOaDampers: false,
  basSupportsSchedules: false,
  variableOccupancy: true,
  floorplanZonesMapped: false,
  iaqConstraintsKnown: false,
  comfortComplaints: false,
  occupancyPattern: "unknown",
  operatingSchedule: "",
  uploadedData: {
    utilityBills: true,
    intervalData: false,
    bmsTrendCsv: false,
    pointList: false,
    floorplan: false,
    equipmentSchedule: false,
    occupancyData: false,
    iaqData: false,
  },
};

export default function CommercialIntakePage() {
  const [step, setStep] = useState<Step>("profile");
  const [assessment, setAssessment] = useState<CommercialAssessment>(DEFAULT_ASSESSMENT);

  function update<K extends keyof CommercialAssessment>(key: K, value: CommercialAssessment[K]) {
    setAssessment((prev) => ({ ...prev, [key]: value }));
  }

  function updateData(key: keyof CommercialAssessment["uploadedData"], value: boolean) {
    setAssessment((prev) => ({
      ...prev,
      uploadedData: { ...prev.uploadedData, [key]: value },
    }));
  }

  function completeAssessment() {
    const normalized = {
      ...assessment,
      id: `commercial-${Date.now()}`,
      buildingName: assessment.buildingName || "Untitled commercial building",
    };
    setAssessment(normalized);
    localStorage.setItem("greenbroker:commercial-assessment", JSON.stringify(normalized));
    setStep("results");
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/commercial" className="text-sm text-gray-500 hover:text-gray-700">
        Back to Commercial
      </Link>
      <div className="mt-3 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          {(["profile", "systems", "data", "results"] as Step[]).map((item, index) => (
            <button
              key={item}
              type="button"
              onClick={() => setStep(item)}
              className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold capitalize ${
                step === item ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"
              }`}
            >
              {index + 1}. {item}
            </button>
          ))}
        </aside>

        <section className="card p-6">
          {step === "profile" && (
            <div className="space-y-5">
              <Header title="Building profile" body="Tell us what this building is and how much energy it uses. Manual entry works even before bill parsing is available." />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Building name">
                  <input value={assessment.buildingName} onChange={(event) => update("buildingName", event.target.value)} className={inputCls} />
                </Field>
                <Field label="Address">
                  <input value={assessment.address ?? ""} onChange={(event) => update("address", event.target.value)} className={inputCls} />
                </Field>
                <Field label="Building type">
                  <select value={assessment.buildingType} onChange={(event) => update("buildingType", event.target.value as CommercialBuildingType)} className={inputCls}>
                    <option value="office">Office</option>
                    <option value="school">School</option>
                    <option value="retail">Retail</option>
                    <option value="multifamily">Multifamily common areas</option>
                    <option value="gym">Gym</option>
                    <option value="nonprofit">Religious / nonprofit</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="data_center_support">Data center support space</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Square footage">
                  <input type="number" value={assessment.sqft} onChange={(event) => update("sqft", Number(event.target.value))} className={inputCls} />
                </Field>
                <Field label="Year built">
                  <input type="number" value={assessment.yearBuilt ?? ""} onChange={(event) => update("yearBuilt", Number(event.target.value))} className={inputCls} />
                </Field>
                <Field label="Utility provider">
                  <input value={assessment.utilityProvider ?? ""} onChange={(event) => update("utilityProvider", event.target.value)} className={inputCls} />
                </Field>
                <Field label="Annual electric spend">
                  <input type="number" value={assessment.annualElectricSpend ?? ""} onChange={(event) => update("annualElectricSpend", Number(event.target.value))} className={inputCls} />
                </Field>
                <Field label="Annual gas spend">
                  <input type="number" value={assessment.annualGasSpend ?? ""} onChange={(event) => update("annualGasSpend", Number(event.target.value))} className={inputCls} />
                </Field>
              </div>
              <NextButton onClick={() => setStep("systems")}>Continue to systems</NextButton>
            </div>
          )}

          {step === "systems" && (
            <div className="space-y-5">
              <Header title="BAS / BMS and operations" body="This determines whether the building is bill-only, FDD-ready, pilot-ready, or eventually controls-ready." />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="BAS / BMS vendor">
                  <select value={assessment.basVendor ?? "Unknown"} onChange={(event) => update("basVendor", event.target.value as BasVendor)} className={inputCls}>
                    <option>Niagara</option>
                    <option>Metasys</option>
                    <option>WebCTRL</option>
                    <option>Desigo</option>
                    <option>EcoStruxure</option>
                    <option>Other</option>
                    <option>Unknown</option>
                  </select>
                </Field>
                <Field label="Occupancy pattern">
                  <select value={assessment.occupancyPattern ?? "unknown"} onChange={(event) => update("occupancyPattern", event.target.value as CommercialAssessment["occupancyPattern"])} className={inputCls}>
                    <option value="stable">Stable</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Check label="VFD fans" checked={Boolean(assessment.hasVfds)} onChange={(value) => update("hasVfds", value)} />
                <Check label="Central AHUs" checked={Boolean(assessment.hasCentralAhus)} onChange={(value) => update("hasCentralAhus", value)} />
                <Check label="Controllable outdoor-air dampers" checked={Boolean(assessment.hasControllableOaDampers)} onChange={(value) => update("hasControllableOaDampers", value)} />
                <Check label="BAS supports schedules and setpoints" checked={Boolean(assessment.basSupportsSchedules)} onChange={(value) => update("basSupportsSchedules", value)} />
                <Check label="CO2 sensors" checked={Boolean(assessment.hasCo2Sensors)} onChange={(value) => update("hasCo2Sensors", value)} />
                <Check label="IAQ sensors" checked={Boolean(assessment.hasIaqSensors)} onChange={(value) => update("hasIaqSensors", value)} />
                <Check label="Submeters" checked={Boolean(assessment.hasSubmeters)} onChange={(value) => update("hasSubmeters", value)} />
                <Check label="Comfort complaints or hot/cold calls" checked={Boolean(assessment.comfortComplaints)} onChange={(value) => update("comfortComplaints", value)} />
              </div>
              <Field label="Operating schedule">
                <textarea value={assessment.operatingSchedule ?? ""} onChange={(event) => update("operatingSchedule", event.target.value)} className={inputCls} rows={3} placeholder="Weekdays 7 AM - 6 PM; Saturdays by event" />
              </Field>
              <NextButton onClick={() => setStep("data")}>Continue to data</NextButton>
            </div>
          )}

          {step === "data" && (
            <div className="space-y-5">
              <Header title="Available data and uploads" body="Upload fields are mocked for now; the important part is recording what data exists and what the next best action should be." />
              <div className="grid gap-3 md:grid-cols-2">
                <Check label="12 months of utility bills" checked={assessment.uploadedData.utilityBills} onChange={(value) => updateData("utilityBills", value)} />
                <Check label="Interval data CSV" checked={assessment.uploadedData.intervalData} onChange={(value) => updateData("intervalData", value)} />
                <Check label="BMS trend CSV" checked={assessment.uploadedData.bmsTrendCsv} onChange={(value) => updateData("bmsTrendCsv", value)} />
                <Check label="BAS point list" checked={assessment.uploadedData.pointList} onChange={(value) => updateData("pointList", value)} />
                <Check label="Floorplan PDF/image" checked={assessment.uploadedData.floorplan} onChange={(value) => updateData("floorplan", value)} />
                <Check label="Equipment schedule" checked={assessment.uploadedData.equipmentSchedule} onChange={(value) => updateData("equipmentSchedule", value)} />
                <Check label="Occupancy schedule/sensor export" checked={assessment.uploadedData.occupancyData} onChange={(value) => updateData("occupancyData", value)} />
                <Check label="IAQ / CO2 export" checked={assessment.uploadedData.iaqData} onChange={(value) => updateData("iaqData", value)} />
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Mock upload area: utility bill, trend log, point list, floorplan, and IAQ export.
              </div>
              <NextButton onClick={completeAssessment}>Generate readiness result</NextButton>
            </div>
          )}

          {step === "results" && (
            <div className="space-y-6">
              <Header title="Assessment result" body="This is saved locally for now and can later be backed by a commercialAssessments table/API." />
              <DeploymentReadinessScore assessment={assessment} />
              <ODCVReadinessCard assessment={assessment} />
              <div className="flex flex-wrap gap-3">
                <Link href="/commercial/proposal" className="btn-commercial">
                  Generate pilot proposal
                </Link>
                <Link href="/commercial/floorplan" className="btn-secondary">
                  Map floorplan zones
                </Link>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const inputCls = "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Header({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
      <p className="mt-2 text-slate-600">{body}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-blue-600"
      />
      {label}
    </label>
  );
}

function NextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="btn-commercial">
      {children}
    </button>
  );
}
