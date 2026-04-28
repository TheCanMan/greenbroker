"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SAMPLE_COMMERCIAL_ASSESSMENT } from "@/lib/commercial/sampleCommercialAssessments";
import { SAMPLE_FDD_FINDINGS } from "@/lib/commercial/sampleFddFindings";
import { formatUsd } from "@/lib/commercial/utils";

type OverlayMode = "occupancy" | "iaq" | "energy";

type RoomBand = "empty" | "low" | "medium" | "high" | "full";

type BlueprintZone = {
  id: string;
  name: string;
  tag: string;
  x: number;
  y: number;
  width: number;
  height: number;
  occupancy: number;
  people: number;
  co2: number;
  temp: number;
  energy: number;
  opportunity: number;
  equipment: string;
  useType: "open" | "conference" | "office" | "support" | "mechanical" | "amenity";
  note: string;
};

type SensorNode = {
  id: string;
  x: number;
  y: number;
  label: string;
  metric: string;
  status: "normal" | "warning" | "critical";
};

type DuctRun = {
  id: string;
  d: string;
  equipment: string;
  tone: "primary" | "warning" | "muted";
};

const BLUEPRINT_ZONES: BlueprintZone[] = [
  {
    id: "open-west",
    name: "West open office",
    tag: "A-501",
    x: 74,
    y: 82,
    width: 228,
    height: 146,
    occupancy: 61,
    people: 34,
    co2: 712,
    temp: 72.1,
    energy: 42,
    opportunity: 9800,
    equipment: "AHU-5 / VAV-5A",
    useType: "open",
    note: "Good candidate for occupancy-informed morning ramp and static pressure reset.",
  },
  {
    id: "conf-north",
    name: "North conference suite",
    tag: "B-514",
    x: 326,
    y: 82,
    width: 176,
    height: 118,
    occupancy: 88,
    people: 22,
    co2: 1186,
    temp: 73.8,
    energy: 58,
    opportunity: 7400,
    equipment: "VAV-5B",
    useType: "conference",
    note: "High CO2 while occupancy is clustered. Keep ventilation guardrails active before trimming airflow.",
  },
  {
    id: "focus-bank",
    name: "Focus rooms",
    tag: "C-520",
    x: 526,
    y: 82,
    width: 158,
    height: 118,
    occupancy: 27,
    people: 8,
    co2: 603,
    temp: 71.4,
    energy: 30,
    opportunity: 4300,
    equipment: "VAV-5C",
    useType: "office",
    note: "Often lightly used after 2 PM. Add setback candidate to operating review.",
  },
  {
    id: "east-open",
    name: "East open office",
    tag: "D-531",
    x: 710,
    y: 82,
    width: 264,
    height: 146,
    occupancy: 44,
    people: 29,
    co2: 682,
    temp: 72.7,
    energy: 39,
    opportunity: 11200,
    equipment: "AHU-5 / VAV-5D",
    useType: "open",
    note: "Largest savings zone. Airflow appears sized for full occupancy despite hybrid usage.",
  },
  {
    id: "boardroom",
    name: "Boardroom",
    tag: "B-540",
    x: 74,
    y: 282,
    width: 174,
    height: 128,
    occupancy: 0,
    people: 0,
    co2: 521,
    temp: 70.8,
    energy: 34,
    opportunity: 6200,
    equipment: "VAV-5E",
    useType: "conference",
    note: "Empty during sampled window but conditioned like an active meeting zone.",
  },
  {
    id: "core",
    name: "Elevator / restroom core",
    tag: "CORE",
    x: 294,
    y: 270,
    width: 260,
    height: 168,
    occupancy: 18,
    people: 7,
    co2: 576,
    temp: 72,
    energy: 18,
    opportunity: 1400,
    equipment: "Exhaust / common",
    useType: "support",
    note: "Support zone. Keep exhaust schedule aligned with occupied floor periods.",
  },
  {
    id: "breakroom",
    name: "Cafe / break room",
    tag: "E-548",
    x: 602,
    y: 280,
    width: 172,
    height: 132,
    occupancy: 72,
    people: 31,
    co2: 1244,
    temp: 74.2,
    energy: 49,
    opportunity: 5800,
    equipment: "VAV-5F / EF-2",
    useType: "amenity",
    note: "CO2 spike overlaps lunch load. Validate exhaust and outside-air response before changing schedules.",
  },
  {
    id: "mechanical",
    name: "Mechanical room",
    tag: "M-501",
    x: 808,
    y: 282,
    width: 166,
    height: 128,
    occupancy: 0,
    people: 0,
    co2: 498,
    temp: 76.5,
    energy: 64,
    opportunity: 2800,
    equipment: "AHU-5 / controls",
    useType: "mechanical",
    note: "AHU trend data should be paired with floor sensors before any BAS sequence edits.",
  },
  {
    id: "south-open",
    name: "South collaboration",
    tag: "F-560",
    x: 86,
    y: 506,
    width: 280,
    height: 146,
    occupancy: 39,
    people: 21,
    co2: 641,
    temp: 71.8,
    energy: 37,
    opportunity: 9300,
    equipment: "VAV-5G",
    useType: "open",
    note: "Comfort is stable with below-design utilization. Candidate for supply-air trim review.",
  },
  {
    id: "tenant-suite",
    name: "Tenant suite east",
    tag: "G-575",
    x: 414,
    y: 506,
    width: 264,
    height: 146,
    occupancy: 53,
    people: 26,
    co2: 734,
    temp: 72.6,
    energy: 41,
    opportunity: 8600,
    equipment: "VAV-5H",
    useType: "office",
    note: "Moderate opportunity. Needs lease-hour confirmation before recommending setbacks.",
  },
  {
    id: "training",
    name: "Training room",
    tag: "H-590",
    x: 726,
    y: 506,
    width: 248,
    height: 146,
    occupancy: 96,
    people: 48,
    co2: 1322,
    temp: 74.9,
    energy: 68,
    opportunity: 4500,
    equipment: "VAV-5J",
    useType: "conference",
    note: "Do not reduce airflow while CO2 is elevated. Savings come from schedule precision, not ventilation cuts.",
  },
];

const SENSOR_NODES: SensorNode[] = [
  { id: "s-01", x: 188, y: 154, label: "OCC-501", metric: "34 ppl", status: "normal" },
  { id: "s-02", x: 412, y: 142, label: "IAQ-514", metric: "1186 ppm", status: "warning" },
  { id: "s-03", x: 840, y: 150, label: "OCC-531", metric: "44%", status: "normal" },
  { id: "s-04", x: 688, y: 344, label: "IAQ-548", metric: "1244 ppm", status: "critical" },
  { id: "s-05", x: 236, y: 580, label: "OCC-560", metric: "39%", status: "normal" },
  { id: "s-06", x: 852, y: 582, label: "IAQ-590", metric: "1322 ppm", status: "critical" },
];

const DUCT_RUNS: DuctRun[] = [
  { id: "ahu-west", d: "M884 346 C778 246 610 226 502 142", equipment: "AHU-5 supply", tone: "primary" },
  { id: "ahu-east", d: "M884 346 C850 266 840 220 842 154", equipment: "AHU-5 supply", tone: "primary" },
  { id: "return-core", d: "M884 346 C760 414 600 392 424 354", equipment: "Return path", tone: "muted" },
  { id: "iaq-guardrail", d: "M884 346 C832 422 800 492 852 582", equipment: "IAQ guardrail", tone: "warning" },
];

const operations = [
  {
    title: "Prioritize East open office",
    body: "Hybrid occupancy creates the largest ventilation mismatch. Review VAV-5D minimums and AHU-5 static pressure reset.",
    impact: "$11.2k/yr",
    tone: "blue",
  },
  {
    title: "Protect training room IAQ",
    body: "CO2 is elevated. Keep outside-air response active and only tune schedules outside booked training periods.",
    impact: "Guardrail",
    tone: "amber",
  },
  {
    title: "Trim unoccupied boardroom runtime",
    body: "The boardroom is conditioned during empty periods. Confirm booking feed, then add occupancy-aware setback review.",
    impact: "$6.2k/yr",
    tone: "emerald",
  },
];

const portfolioMetrics = [
  { label: "Floor opportunity", value: "$71.3k", detail: "modeled annual waste", icon: "↯", tone: "blue" },
  { label: "Mapped zones", value: "11", detail: "room-level intelligence", icon: "⌗", tone: "slate" },
  { label: "IAQ guardrails", value: "3", detail: "zones above 1,000 ppm", icon: "◌", tone: "amber" },
  { label: "O-DCV readiness", value: "82%", detail: "pilot-ready confidence", icon: "✓", tone: "emerald" },
];

const systemRows = [
  { label: "BMS integration", detail: "WebCTRL trend feed mapped to AHU-5 and VAV terminal units", status: "Online" },
  { label: "Room intelligence", detail: "Occupancy and IAQ sensors resolved to floorplan zones", status: "Online" },
  { label: "Control posture", detail: "Advisory only. No automatic BAS writes are enabled.", status: "Guarded" },
  { label: "Evidence packet", detail: "Floorplan, point list, trend log, and comfort exceptions queued", status: "Review" },
];

const overlayLabels: Record<OverlayMode, string> = {
  occupancy: "Occupancy",
  iaq: "IAQ",
  energy: "Energy",
};

function occupancyBand(value: number): RoomBand {
  if (value === 0) return "empty";
  if (value <= 25) return "low";
  if (value <= 50) return "medium";
  if (value <= 75) return "high";
  return "full";
}

const occupancyStyles: Record<RoomBand, { fill: string; stroke: string; text: string }> = {
  empty: { fill: "#e8eef5", stroke: "#94a3b8", text: "#334155" },
  low: { fill: "#dbeafe", stroke: "#93c5fd", text: "#1e3a8a" },
  medium: { fill: "#93c5fd", stroke: "#60a5fa", text: "#0f3a70" },
  high: { fill: "#3b82f6", stroke: "#2563eb", text: "#eff6ff" },
  full: { fill: "#1e3a8a", stroke: "#1d4ed8", text: "#f8fafc" },
};

function zoneVisual(zone: BlueprintZone, overlay: OverlayMode) {
  if (zone.useType === "mechanical") {
    return { fill: "#f1f5f9", stroke: "#64748b", text: "#334155", opacity: 0.82 };
  }

  if (overlay === "iaq") {
    if (zone.co2 >= 1200) return { fill: "#fee2e2", stroke: "#ef4444", text: "#7f1d1d", opacity: 0.92 };
    if (zone.co2 >= 1000) return { fill: "#fef3c7", stroke: "#f59e0b", text: "#78350f", opacity: 0.9 };
    return { fill: "#dcfce7", stroke: "#22c55e", text: "#14532d", opacity: 0.86 };
  }

  if (overlay === "energy") {
    if (zone.opportunity >= 9000) return { fill: "#dbeafe", stroke: "#2563eb", text: "#172554", opacity: 0.94 };
    if (zone.opportunity >= 5000) return { fill: "#e0f2fe", stroke: "#0284c7", text: "#0c4a6e", opacity: 0.88 };
    return { fill: "#f8fafc", stroke: "#94a3b8", text: "#334155", opacity: 0.78 };
  }

  const style = occupancyStyles[occupancyBand(zone.occupancy)];
  return { ...style, opacity: zone.useType === "support" ? 0.64 : 0.9 };
}

function zoneMetric(zone: BlueprintZone, overlay: OverlayMode) {
  if (overlay === "iaq") return `${zone.co2} ppm`;
  if (overlay === "energy") return `$${Math.round(zone.opportunity / 1000)}k`;
  return `${zone.occupancy}%`;
}

function totalSavings() {
  return BLUEPRINT_ZONES.reduce((sum, zone) => sum + zone.opportunity, 0);
}

export default function CommercialFloorplanPage() {
  const [selectedZoneId, setSelectedZoneId] = useState("east-open");
  const [overlay, setOverlay] = useState<OverlayMode>("occupancy");
  const [dateRange, setDateRange] = useState("Last 14 days");
  const [timeOfDay, setTimeOfDay] = useState("Workday");

  const selectedZone =
    BLUEPRINT_ZONES.find((zone) => zone.id === selectedZoneId) ?? BLUEPRINT_ZONES[0];

  const peopleDetected = useMemo(
    () => BLUEPRINT_ZONES.reduce((sum, zone) => sum + zone.people, 0),
    [],
  );

  const averageOccupancy = useMemo(
    () =>
      Math.round(
        BLUEPRINT_ZONES.reduce((sum, zone) => sum + zone.occupancy, 0) /
          BLUEPRINT_ZONES.length,
      ),
    [],
  );

  const estimatedSavings = SAMPLE_FDD_FINDINGS.reduce(
    (sum, finding) => sum + finding.annualWasteDollarsBase,
    0,
  );

  return (
    <div className="min-h-screen bg-[#eef3f8] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1580px] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Link href="/commercial" className="text-sm font-semibold text-slate-500 hover:text-blue-700">
                Back to Commercial
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                  Blueprint intelligence dashboard
                </h1>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  Floor 5 · live-style demo
                </span>
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Commercial floorplan view that connects room-level occupancy, IAQ, and
                HVAC zones to energy savings opportunities. Advisory analytics only:
                no automatic BAS control changes are made from this prototype.
              </p>
            </div>
            <div className="grid min-w-[280px] gap-3 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-inner">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200">
                O-DCV readiness
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="text-5xl font-black tracking-tight">82</div>
                <div className="mb-1 rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  Pilot ready
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-blue-400 to-emerald-300" />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {portfolioMetrics.map((metric) => (
            <KpiCard key={metric.label} {...metric} />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-blue-50/70 p-5">
              <div>
                <h2 className="text-xl font-black">{SAMPLE_COMMERCIAL_ASSESSMENT.buildingName}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {SAMPLE_COMMERCIAL_ASSESSMENT.address} · 68,400 sq ft sampled floorplate
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(overlayLabels) as OverlayMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setOverlay(mode)}
                    className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                      overlay === mode
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700"
                    }`}
                  >
                    {overlayLabels[mode]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 border-b border-slate-100 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="flex flex-wrap gap-3">
                <SelectShell label="Building" value={SAMPLE_COMMERCIAL_ASSESSMENT.buildingName} />
                <SelectShell label="Floor" value="Floor 5" />
              </div>
              <div className="flex flex-wrap gap-3">
                <SelectShell
                  label="Date range"
                  value={dateRange}
                  onChange={setDateRange}
                  options={["Last 14 days", "Last 30 days", "This month"]}
                />
                <SelectShell
                  label="Time of day"
                  value={timeOfDay}
                  onChange={setTimeOfDay}
                  options={["Workday", "After hours", "All day"]}
                />
                <div>
                  <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Day sample
                  </div>
                  <div className="flex gap-2">
                    {["M", "T", "W", "T", "F"].map((day, index) => (
                      <button
                        key={`${day}-${index}`}
                        type="button"
                        className={`grid h-9 w-9 place-items-center rounded-xl border text-xs font-bold ${
                          index === 2
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">
                <span>West service core</span>
                <span>10th Avenue facade</span>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-slate-300 bg-[#f8fbff] p-3 shadow-inner">
                <BlueprintCanvas
                  overlay={overlay}
                  selectedZoneId={selectedZone.id}
                  onSelect={setSelectedZoneId}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <Legend overlay={overlay} />
                <div>
                  {BLUEPRINT_ZONES.length} mapped zones <span className="mx-2">|</span>{" "}
                  {peopleDetected} people detected <span className="mx-2">|</span>{" "}
                  {averageOccupancy}% avg occupancy
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">
                    Selected zone
                  </div>
                  <h2 className="mt-2 text-2xl font-black">{selectedZone.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedZone.tag} · {selectedZone.equipment}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                  {selectedZone.useType}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <DetailMetric label="Occupancy" value={`${selectedZone.occupancy}%`} />
                <DetailMetric label="People" value={String(selectedZone.people)} />
                <DetailMetric
                  label="CO2"
                  value={`${selectedZone.co2} ppm`}
                  warn={selectedZone.co2 > 1000}
                />
                <DetailMetric label="Temp" value={`${selectedZone.temp.toFixed(1)}°F`} />
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-950">
                <span className="font-black">Operating note:</span> {selectedZone.note}
              </div>

              <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  Modeled opportunity
                </div>
                <div className="mt-2 text-3xl font-black text-emerald-900">
                  {formatUsd(selectedZone.opportunity)}
                  <span className="text-sm font-semibold text-emerald-700"> / yr</span>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <h2 className="text-xl font-black">Sensor + BAS mapping</h2>
              <div className="mt-4 space-y-3">
                {systemRows.map((row) => (
                  <div key={row.label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold">{row.label}</div>
                      <span className={statusClass(row.status)}>{row.status}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-slate-300">{row.detail}</p>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">Operational recommendations</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Room-level insights are converted into reviewable actions for engineering teams.
                </p>
              </div>
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
                Not an automatic controller
              </span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {operations.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className={`mb-4 h-1.5 w-16 rounded-full ${operationTone(item.tone)}`} />
                  <div className="font-black text-slate-950">{item.title}</div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                  <div className="mt-4 text-sm font-black text-slate-900">{item.impact}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">Savings tracker</h2>
            <p className="mt-2 text-sm text-slate-500">
              Floor opportunity is reconciled against FDD waste and comfort guardrails.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SavingsMetric label="Zone-modeled" value={formatUsd(totalSavings())} tone="blue" />
              <SavingsMetric label="FDD-modeled" value={formatUsd(estimatedSavings)} tone="emerald" />
              <SavingsMetric label="Carbon impact" value="64.5 mt" tone="slate" />
              <SavingsMetric label="Efficiency gain" value="18.3%" tone="violet" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function BlueprintCanvas({
  overlay,
  selectedZoneId,
  onSelect,
}: {
  overlay: OverlayMode;
  selectedZoneId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 1080 760"
      className="min-h-[620px] min-w-[1080px] rounded-xl bg-[#fbfdff]"
      role="img"
      aria-label="Commercial floorplan with room-level occupancy, IAQ, and energy overlays"
    >
      <defs>
        <pattern id="minor-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e6edf5" strokeWidth="0.8" />
        </pattern>
        <pattern id="major-grid" width="100" height="100" patternUnits="userSpaceOnUse">
          <rect width="100" height="100" fill="url(#minor-grid)" />
          <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#cbd5e1" strokeWidth="1" />
        </pattern>
        <filter id="selected-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#1d4ed8" floodOpacity="0.22" />
        </filter>
      </defs>

      <rect x="0" y="0" width="1080" height="760" fill="url(#major-grid)" />
      <rect x="22" y="24" width="1036" height="710" fill="none" stroke="#0f172a" strokeWidth="4" />
      <path
        d="M52 52H1006V230H1018V678H62V444H42V260H52Z"
        fill="none"
        stroke="#0f172a"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M52 246H1008M52 466H1008M282 52V678M574 52V678M700 246V466M790 52V678M52 682H1008"
        fill="none"
        stroke="#64748b"
        strokeWidth="2"
        strokeDasharray="7 7"
      />
      <path
        d="M286 250H554V438H286ZM602 260H984V438H602ZM70 498H984V678"
        fill="none"
        stroke="#94a3b8"
        strokeWidth="1.4"
      />

      {["A", "B", "C", "D", "E", "F", "G", "H"].map((label, index) => (
        <text key={label} x={96 + index * 118} y="38" fontSize="13" fill="#64748b" fontWeight="800">
          {label}
        </text>
      ))}
      {["01", "02", "03", "04", "05", "06"].map((label, index) => (
        <text key={label} x="30" y={92 + index * 112} fontSize="12" fill="#64748b" fontWeight="800">
          {label}
        </text>
      ))}

      {DUCT_RUNS.map((run) => (
        <g key={run.id}>
          <path
            d={run.d}
            fill="none"
            stroke={run.tone === "primary" ? "#2563eb" : run.tone === "warning" ? "#f59e0b" : "#94a3b8"}
            strokeWidth={run.tone === "muted" ? 3 : 4}
            strokeOpacity={run.tone === "muted" ? 0.55 : 0.72}
            strokeDasharray={run.tone === "warning" ? "10 8" : undefined}
          />
          <circle
            cx={run.tone === "warning" ? 852 : 884}
            cy={run.tone === "warning" ? 582 : 346}
            r={run.tone === "warning" ? 5 : 4}
            fill={run.tone === "warning" ? "#f59e0b" : "#2563eb"}
          />
        </g>
      ))}

      {BLUEPRINT_ZONES.map((zone) => {
        const visual = zoneVisual(zone, overlay);
        const selected = zone.id === selectedZoneId;
        return (
          <g key={zone.id} onClick={() => onSelect(zone.id)} className="cursor-pointer">
            <rect
              x={zone.x}
              y={zone.y}
              width={zone.width}
              height={zone.height}
              rx="2"
              fill={visual.fill}
              fillOpacity={visual.opacity}
              stroke={selected ? "#0f172a" : visual.stroke}
              strokeWidth={selected ? 3.4 : 1.7}
              filter={selected ? "url(#selected-shadow)" : undefined}
            />
            <path
              d={`M${zone.x + 12} ${zone.y + zone.height - 10}H${zone.x + zone.width - 12}`}
              stroke="#0f172a"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
            <text x={zone.x + 12} y={zone.y + 22} fontSize="12" fill={visual.text} fontWeight="900">
              {zone.tag}
            </text>
            <text
              x={zone.x + 12}
              y={zone.y + 42}
              fontSize={zone.width > 200 ? 15 : 13}
              fill={visual.text}
              fontWeight="800"
            >
              {zone.name}
            </text>
            <text x={zone.x + 12} y={zone.y + zone.height - 18} fontSize="13" fill={visual.text} fontWeight="900">
              {zoneMetric(zone, overlay)}
            </text>
            <text
              x={zone.x + zone.width - 12}
              y={zone.y + zone.height - 18}
              textAnchor="end"
              fontSize="11"
              fill={visual.text}
              fontWeight="700"
              opacity="0.78"
            >
              {zone.equipment.split(" / ")[0]}
            </text>
          </g>
        );
      })}

      {[188, 412, 840, 688, 236, 852].map((x, index) => (
        <line
          key={`sensor-drop-${index}`}
          x1={x}
          y1={index < 3 ? 62 : index === 3 ? 250 : 478}
          x2={x}
          y2={SENSOR_NODES[index].y - 12}
          stroke="#38bdf8"
          strokeWidth="1"
          strokeDasharray="4 7"
          strokeOpacity="0.7"
        />
      ))}

      {SENSOR_NODES.map((sensor) => (
        <g key={sensor.id}>
          <circle
            cx={sensor.x}
            cy={sensor.y}
            r="13"
            fill={
              sensor.status === "critical"
                ? "#ef4444"
                : sensor.status === "warning"
                  ? "#f59e0b"
                  : "#0ea5e9"
            }
            stroke="#ffffff"
            strokeWidth="4"
          />
          <circle cx={sensor.x} cy={sensor.y} r="4" fill="#ffffff" />
          <rect x={sensor.x + 16} y={sensor.y - 22} width="82" height="39" rx="8" fill="#0f172a" fillOpacity="0.88" />
          <text x={sensor.x + 25} y={sensor.y - 7} fontSize="10" fill="#bfdbfe" fontWeight="800">
            {sensor.label}
          </text>
          <text x={sensor.x + 25} y={sensor.y + 8} fontSize="11" fill="#ffffff" fontWeight="900">
            {sensor.metric}
          </text>
        </g>
      ))}

      {[
        [286, 250],
        [554, 250],
        [574, 466],
        [790, 466],
        [52, 466],
        [1008, 466],
        [282, 682],
        [790, 682],
      ].map(([x, y], index) => (
        <circle key={`column-${index}`} cx={x} cy={y} r="8" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
      ))}

      <rect x="842" y="306" width="90" height="78" rx="10" fill="#0f172a" />
      <text x="887" y="336" textAnchor="middle" fontSize="12" fill="#bfdbfe" fontWeight="900">
        AHU-5
      </text>
      <text x="887" y="356" textAnchor="middle" fontSize="11" fill="#ffffff" fontWeight="800">
        18k CFM
      </text>
      <text x="887" y="376" textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="700">
        advisory
      </text>

      <text x="62" y="724" fontSize="12" fill="#475569" fontWeight="900">
        SCALE 1/16&quot; = 1&apos;-0&quot; · SAMPLE COMMERCIAL BLUEPRINT · ZONE/SENSOR OVERLAY
      </text>
      <path d="M1002 704l18 -34 18 34z" fill="none" stroke="#0f172a" strokeWidth="2" />
      <text x="1020" y="725" textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="900">
        N
      </text>
    </svg>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: string;
}) {
  const toneClass =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700"
        : tone === "amber"
          ? "bg-amber-50 text-amber-700"
          : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</div>
          <div className="mt-2 text-sm text-slate-500">{detail}</div>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-2xl text-xl font-black ${toneClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SelectShell({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options?: string[];
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        className="min-w-40 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm"
      >
        {(options ?? [value]).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Legend({ overlay }: { overlay: OverlayMode }) {
  if (overlay === "iaq") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold uppercase tracking-[0.18em] text-slate-400">IAQ</span>
        <LegendSwatch color="#dcfce7" label="< 1,000 ppm" />
        <LegendSwatch color="#fef3c7" label="1,000-1,199 ppm" />
        <LegendSwatch color="#fee2e2" label="1,200+ ppm" />
      </div>
    );
  }

  if (overlay === "energy") {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-bold uppercase tracking-[0.18em] text-slate-400">Savings</span>
        <LegendSwatch color="#f8fafc" label="< $5k" />
        <LegendSwatch color="#e0f2fe" label="$5k-$9k" />
        <LegendSwatch color="#dbeafe" label="$9k+" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-bold uppercase tracking-[0.18em] text-slate-400">Occupancy</span>
      <LegendSwatch color={occupancyStyles.empty.fill} label="0%" />
      <LegendSwatch color={occupancyStyles.low.fill} label="1-25%" />
      <LegendSwatch color={occupancyStyles.medium.fill} label="26-50%" />
      <LegendSwatch color={occupancyStyles.high.fill} label="51-75%" />
      <LegendSwatch color={occupancyStyles.full.fill} label="76-100%" />
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-3 w-5 rounded" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function DetailMetric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${warn ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-2 text-2xl font-black ${warn ? "text-amber-800" : "text-slate-950"}`}>{value}</div>
    </div>
  );
}

function SavingsMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "emerald" | "slate" | "violet";
}) {
  const tones = {
    blue: "bg-blue-600",
    emerald: "bg-emerald-600",
    slate: "bg-slate-700",
    violet: "bg-violet-600",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className={`mb-3 h-2 w-12 rounded-full ${tones[tone]}`} />
      <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function statusClass(status: string) {
  if (status === "Online") return "rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-200";
  if (status === "Guarded") return "rounded-full bg-blue-400/15 px-2.5 py-1 text-xs font-bold text-blue-200";
  return "rounded-full bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-200";
}

function operationTone(tone: string) {
  if (tone === "amber") return "bg-amber-500";
  if (tone === "emerald") return "bg-emerald-500";
  return "bg-blue-600";
}
