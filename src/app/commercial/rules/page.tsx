import Link from "next/link";

type Rule = {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  inputs: string[];
  logic: string;
  waste: string;
};

const RULES: Rule[] = [
  {
    id: "R001",
    title: "Simultaneous heating & cooling",
    severity: "high",
    inputs: ["cooling_valve_cmd", "heating_valve_cmd"],
    logic: "Both valves modulated >10% open for ≥15 min in the same window.",
    waste: "Direct kWh/therm waste — you pay to heat and cool the same air stream.",
  },
  {
    id: "R002",
    title: "Economizer not economizing",
    severity: "high",
    inputs: ["outside_air_temp", "mixed_air_temp", "oa_damper_cmd"],
    logic:
      "OAT within free-cooling band (45–65°F) but OA damper stays at minimum position while mechanical cooling runs.",
    waste: "Mechanical cooling when free outdoor air would do the job — often 15–30% of chiller runtime in shoulder seasons.",
  },
  {
    id: "R003",
    title: "Low ΔT on chilled water",
    severity: "medium",
    inputs: ["chw_supply_temp", "chw_return_temp"],
    logic: "ΔT < 6°F for sustained periods, indicating oversized pumps or bypass flow.",
    waste: "Excess pump energy and reduced chiller efficiency.",
  },
  {
    id: "R004",
    title: "Overventilation during unoccupied hours",
    severity: "high",
    inputs: ["fan_status", "occupancy_status", "operating_hours"],
    logic: "Supply fan runs ≥50% of unoccupied windows without an override reason.",
    waste: "Fan energy + tempering OA during hours nobody's there.",
  },
  {
    id: "R005",
    title: "Hot deck / cold deck fighting",
    severity: "medium",
    inputs: ["supply_air_temp", "sat_sp"],
    logic: "SAT oscillates ±4°F around setpoint more than 8× per hour.",
    waste: "Wear-and-tear on VAV boxes + wasted reheat/cooling energy.",
  },
  {
    id: "R006",
    title: "Zone setpoint drift",
    severity: "low",
    inputs: ["zone_temp", "zone_cooling_sp", "zone_heating_sp"],
    logic: "Zone temp outside deadband for >25% of occupied hours.",
    waste: "Comfort complaints → occupants override → systems compensate.",
  },
  {
    id: "R007",
    title: "After-hours runtime",
    severity: "medium",
    inputs: ["fan_status", "operating_hours", "operating_calendar"],
    logic: "Fan runs outside scheduled operating window on non-holiday days.",
    waste: "Full HVAC load during unpaid hours.",
  },
  {
    id: "R008",
    title: "Short-cycling fans",
    severity: "medium",
    inputs: ["fan_status"],
    logic: "≥6 on/off transitions per hour for sustained periods.",
    waste: "Motor wear, reduced efficiency, VFD stress.",
  },
  {
    id: "R009",
    title: "Reheat without cooling lockout",
    severity: "high",
    inputs: ["heating_valve_cmd", "supply_air_temp", "outside_air_temp"],
    logic: "Zone reheat active while SAT < 60°F and OAT < 55°F — terminal reheat with no cooling demand upstream.",
    waste: "Effectively heating outdoor air twice.",
  },
  {
    id: "R010",
    title: "Static pressure reset disabled",
    severity: "medium",
    inputs: ["supply_air_pressure", "sap_sp", "vfd_speed_cmd"],
    logic: "SAP setpoint flat within ±0.1\" across all loads — no trim-and-respond behavior.",
    waste: "Fan runs at max pressure even when VAV dampers are mostly open.",
  },
];

const SEVERITY_STYLE: Record<Rule["severity"], string> = {
  high: "bg-orange-50 text-orange-800 border-orange-300",
  medium: "bg-amber-50 text-amber-800 border-amber-200",
  low: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function CommercialRulesPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div>
        <Link
          href="/commercial"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Commercial
        </Link>
        <h1 className="mt-2 text-4xl font-bold text-gray-900 tracking-tight">
          Fault-detection rules
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl">
          Every finding we surface is grounded in one of these ten rules.
          Each rule lists the input points it needs, the condition that must be
          met to fire, and the mechanism by which the fault wastes energy. No
          black-box ML — your mechanical engineer can audit each diagnosis.
        </p>
      </div>

      <ul className="space-y-4">
        {RULES.map((r) => (
          <li
            key={r.id}
            className="card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-mono font-bold text-gray-700">
                  {r.id}
                </span>
                <h2 className="text-xl font-semibold text-gray-900">{r.title}</h2>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${SEVERITY_STYLE[r.severity]}`}
              >
                {r.severity}
              </span>
            </div>

            <dl className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-500">
                  Inputs
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {r.inputs.map((p) => (
                    <code
                      key={p}
                      className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-700"
                    >
                      {p}
                    </code>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-500">
                  Fires when
                </dt>
                <dd className="mt-1 text-gray-700">{r.logic}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gray-500">
                  Why it costs money
                </dt>
                <dd className="mt-1 text-gray-700">{r.waste}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl bg-brand-50 border border-brand-200 p-6 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">
          Want to see these fire on your building?
        </div>
        <p className="mt-1">
          Upload a utility bill for a Tier 0 benchmark, or drop BMS trend CSVs
          for full Tier 1 fault detection.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/commercial/onboarding" className="btn-primary text-sm">
            Start Tier 0 →
          </Link>
          <Link
            href="/commercial/demo"
            className="btn-secondary text-sm"
          >
            See a sample run
          </Link>
        </div>
      </div>
    </main>
  );
}
