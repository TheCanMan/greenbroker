const IAQ_METRICS = [
  { label: "CO2 below 800 ppm", value: "94%", status: "Healthy occupied hours" },
  { label: "PM2.5 average", value: "6.8", status: "ug/m3, below guardrail" },
  { label: "Humidity in comfort band", value: "87%", status: "of occupied hours" },
  { label: "Ventilation waste signal", value: "High", status: "after-hours OA remains elevated" },
];

export function IAQEnergyTradeoff() {
  return (
    <div className="card p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            IAQ + energy guardrails
          </div>
          <h3 className="mt-2 text-2xl font-bold text-slate-950">
            Savings never below IAQ guardrails
          </h3>
        </div>
        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
          Safety-first recommendation
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        GreenBroker identifies ventilation waste, but it does not recommend reducing ventilation
        below code, ASHRAE guidance, IAQ constraints, or engineer-approved limits. The goal is to
        reduce unoccupied waste while protecting occupied IAQ.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {IAQ_METRICS.map((metric) => (
          <div key={metric.label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="text-xs text-slate-500">{metric.label}</div>
            <div className="mt-1 text-2xl font-bold text-slate-950">{metric.value}</div>
            <div className="mt-1 text-xs text-slate-600">{metric.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
