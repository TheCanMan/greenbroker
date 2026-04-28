import type { CommercialAssessment } from "@/lib/commercial/feature-types";

const CHECKS = [
  {
    label: "Variable occupancy",
    test: (assessment: CommercialAssessment) =>
      Boolean(assessment.variableOccupancy || assessment.occupancyPattern === "hybrid"),
  },
  {
    label: "VAV / central AHU system",
    test: (assessment: CommercialAssessment) =>
      Boolean(assessment.hasCentralAhus),
  },
  {
    label: "Controllable outdoor-air dampers",
    test: (assessment: CommercialAssessment) => Boolean(assessment.hasControllableOaDampers),
  },
  {
    label: "VFD fans",
    test: (assessment: CommercialAssessment) => Boolean(assessment.hasVfds),
  },
  {
    label: "BAS supports schedules / setpoints",
    test: (assessment: CommercialAssessment) => Boolean(assessment.basSupportsSchedules),
  },
  {
    label: "CO2 or occupancy signal",
    test: (assessment: CommercialAssessment) =>
      Boolean(assessment.hasCo2Sensors || assessment.uploadedData.occupancyData),
  },
  {
    label: "Floorplan zones mapped",
    test: (assessment: CommercialAssessment) => Boolean(assessment.floorplanZonesMapped),
  },
  {
    label: "IAQ constraints known",
    test: (assessment: CommercialAssessment) => Boolean(assessment.iaqConstraintsKnown),
  },
] as const;

function stageFor(score: number) {
  if (score <= 1) return "Not ready";
  if (score <= 3) return "Data-ready";
  if (score <= 5) return "Sensor-ready";
  if (score <= 7) return "Pilot-ready";
  return "Controls-ready";
}

export function ODCVReadinessCard({ assessment }: { assessment: CommercialAssessment }) {
  const present = CHECKS.filter((check) => check.test(assessment));
  const missing = CHECKS.filter((check) => !check.test(assessment));
  const stage = stageFor(present.length);

  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-950 p-6 text-white">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
          O-DCV pilot planning
        </div>
        <h3 className="mt-2 text-2xl font-bold">{stage}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Occupancy-driven ventilation can save money, but any pilot must preserve minimum
          ventilation, ASHRAE/code requirements, IAQ guardrails, engineer approval, and manual
          override.
        </p>
      </div>
      <div className="grid gap-4 p-6 md:grid-cols-2">
        <div>
          <div className="text-sm font-semibold text-slate-900">Ready signals</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {present.map((check) => (
              <li key={check.label} className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span>{check.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">Missing prerequisites</div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {missing.length === 0 ? (
              <li>Generate a verification plan before any control changes.</li>
            ) : (
              missing.map((check) => (
                <li key={check.label} className="flex gap-2">
                  <span className="text-amber-600">!</span>
                  <span>{check.label}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-sm text-slate-700">
        Next action: build an occupancy-aware ventilation pilot plan, not live controls, and verify
        savings with before/after trend windows.
      </div>
    </div>
  );
}
