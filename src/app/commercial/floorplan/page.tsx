"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { SAMPLE_COMMERCIAL_ASSESSMENT } from "@/lib/commercial/sampleCommercialAssessments";
import { SAMPLE_FDD_FINDINGS } from "@/lib/commercial/sampleFddFindings";
import { formatUsd } from "@/lib/commercial/utils";

type RoomBand = "empty" | "low" | "medium" | "high" | "full";

type Room = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  occupancy: number;
  equipment: string;
  people: number;
  type: "room" | "open" | "support" | "mechanical";
};

const FLOOR_ROOMS: Room[] = [
  { id: "room-21", name: "Room 21", x: 44, y: 58, width: 96, height: 48, occupancy: 75, equipment: "VAV-2A", people: 9, type: "room" },
  { id: "open-5", name: "Open Area 5", x: 160, y: 48, width: 158, height: 64, occupancy: 50, equipment: "AHU-2", people: 22, type: "open" },
  { id: "room-27", name: "Room 27", x: 340, y: 38, width: 82, height: 42, occupancy: 50, equipment: "VAV-2B", people: 6, type: "room" },
  { id: "room-32", name: "Room 32", x: 438, y: 38, width: 86, height: 42, occupancy: 50, equipment: "VAV-2C", people: 6, type: "room" },
  { id: "open-6", name: "Open Area 6", x: 548, y: 48, width: 174, height: 64, occupancy: 60, equipment: "AHU-2", people: 28, type: "open" },
  { id: "room-37", name: "Room 37", x: 750, y: 38, width: 88, height: 42, occupancy: 0, equipment: "VAV-3A", people: 0, type: "room" },
  { id: "room-41", name: "Room 41", x: 860, y: 38, width: 88, height: 42, occupancy: 75, equipment: "VAV-3B", people: 8, type: "room" },
  { id: "open-7", name: "Open Area 7", x: 970, y: 48, width: 150, height: 64, occupancy: 42, equipment: "AHU-3", people: 18, type: "open" },
  { id: "room-44", name: "Room 44", x: 1144, y: 42, width: 72, height: 54, occupancy: 50, equipment: "VAV-4A", people: 5, type: "room" },
  { id: "open-4", name: "Open Area 4", x: 30, y: 150, width: 126, height: 70, occupancy: 43, equipment: "AHU-2", people: 14, type: "open" },
  { id: "room-22", name: "Room 22", x: 188, y: 174, width: 58, height: 40, occupancy: 50, equipment: "VAV-2A", people: 5, type: "room" },
  { id: "room-23", name: "Room 23", x: 254, y: 174, width: 58, height: 40, occupancy: 0, equipment: "VAV-2A", people: 0, type: "room" },
  { id: "room-24", name: "Room 24", x: 322, y: 174, width: 58, height: 40, occupancy: 75, equipment: "VAV-2B", people: 7, type: "room" },
  { id: "room-25", name: "Room 25", x: 390, y: 174, width: 58, height: 40, occupancy: 50, equipment: "VAV-2B", people: 5, type: "room" },
  { id: "room-28", name: "Room 28", x: 456, y: 174, width: 58, height: 40, occupancy: 67, equipment: "VAV-2C", people: 6, type: "room" },
  { id: "room-29", name: "Room 29", x: 524, y: 174, width: 58, height: 40, occupancy: 0, equipment: "VAV-2C", people: 0, type: "room" },
  { id: "room-30", name: "Room 30", x: 592, y: 174, width: 58, height: 40, occupancy: 50, equipment: "VAV-2D", people: 5, type: "room" },
  { id: "room-33", name: "Room 33", x: 660, y: 174, width: 58, height: 40, occupancy: 100, equipment: "VAV-2D", people: 11, type: "room" },
  { id: "room-34", name: "Room 34", x: 728, y: 174, width: 58, height: 40, occupancy: 50, equipment: "VAV-3A", people: 5, type: "room" },
  { id: "room-35", name: "Room 35", x: 796, y: 174, width: 58, height: 40, occupancy: 0, equipment: "VAV-3A", people: 0, type: "room" },
  { id: "room-36", name: "Room 36", x: 864, y: 174, width: 58, height: 40, occupancy: 67, equipment: "VAV-3B", people: 6, type: "room" },
  { id: "room-39", name: "Room 39", x: 932, y: 174, width: 58, height: 40, occupancy: 50, equipment: "VAV-3B", people: 5, type: "room" },
  { id: "room-42", name: "Room 42", x: 1000, y: 174, width: 58, height: 40, occupancy: 100, equipment: "VAV-4A", people: 12, type: "room" },
  { id: "room-43", name: "Room 43", x: 1068, y: 174, width: 58, height: 40, occupancy: 0, equipment: "VAV-4A", people: 0, type: "room" },
  { id: "room-45", name: "Room 45", x: 1144, y: 150, width: 72, height: 54, occupancy: 67, equipment: "VAV-4B", people: 7, type: "room" },
  { id: "room-46", name: "Room 46", x: 1144, y: 212, width: 72, height: 54, occupancy: 50, equipment: "VAV-4B", people: 5, type: "room" },
  { id: "room-20", name: "Room 20", x: 44, y: 294, width: 66, height: 46, occupancy: 67, equipment: "RTU-3", people: 6, type: "room" },
  { id: "room-19", name: "Room 19", x: 118, y: 294, width: 66, height: 46, occupancy: 50, equipment: "RTU-3", people: 5, type: "room" },
  { id: "room-56", name: "Room 56", x: 202, y: 290, width: 118, height: 48, occupancy: 50, equipment: "RTU-3", people: 12, type: "room" },
  { id: "mechanical", name: "Mechanical Rm.", x: 548, y: 314, width: 174, height: 54, occupancy: 0, equipment: "Mechanical", people: 0, type: "mechanical" },
  { id: "storage", name: "Storage", x: 742, y: 324, width: 88, height: 46, occupancy: 0, equipment: "None", people: 0, type: "support" },
  { id: "copy-1", name: "Copy / Print", x: 874, y: 306, width: 82, height: 42, occupancy: 33, equipment: "VAV-3B", people: 2, type: "support" },
  { id: "room-47", name: "Room 47", x: 1068, y: 286, width: 72, height: 54, occupancy: 50, equipment: "VAV-4B", people: 5, type: "room" },
  { id: "open-8", name: "Open Area 8", x: 1078, y: 366, width: 138, height: 72, occupancy: 40, equipment: "AHU-3", people: 16, type: "open" },
  { id: "kitchen", name: "Kitchen", x: 82, y: 470, width: 172, height: 70, occupancy: 42, equipment: "MAU-1", people: 8, type: "support" },
  { id: "bath-a", name: "Bathroom", x: 540, y: 522, width: 82, height: 50, occupancy: 40, equipment: "Exhaust", people: 3, type: "support" },
  { id: "bath-b", name: "Bathroom", x: 638, y: 522, width: 82, height: 50, occupancy: 20, equipment: "Exhaust", people: 2, type: "support" },
  { id: "elevator", name: "Elevator", x: 750, y: 510, width: 72, height: 74, occupancy: 0, equipment: "None", people: 0, type: "support" },
  { id: "east-hub", name: "East Hub", x: 1100, y: 470, width: 110, height: 74, occupancy: 38, equipment: "AHU-3", people: 9, type: "open" },
  { id: "room-48", name: "Room 48", x: 1008, y: 604, width: 62, height: 48, occupancy: 67, equipment: "VAV-4C", people: 6, type: "room" },
  { id: "room-49", name: "Room 49", x: 1094, y: 622, width: 72, height: 50, occupancy: 50, equipment: "VAV-4C", people: 5, type: "room" },
  { id: "open-9", name: "Open Area 9", x: 1078, y: 686, width: 138, height: 70, occupancy: 38, equipment: "AHU-3", people: 14, type: "open" },
  { id: "open-3", name: "Open Area 3", x: 30, y: 660, width: 128, height: 72, occupancy: 50, equipment: "AHU-1", people: 18, type: "open" },
  { id: "room-16", name: "Room 16", x: 118, y: 600, width: 66, height: 48, occupancy: 67, equipment: "VAV-1A", people: 6, type: "room" },
  { id: "room-15", name: "Room 15", x: 254, y: 730, width: 58, height: 40, occupancy: 67, equipment: "VAV-1B", people: 6, type: "room" },
  { id: "room-12", name: "Room 12", x: 220, y: 828, width: 58, height: 40, occupancy: 63, equipment: "VAV-1B", people: 6, type: "room" },
  { id: "room-8", name: "Room 8", x: 446, y: 828, width: 58, height: 40, occupancy: 67, equipment: "VAV-1C", people: 6, type: "room" },
  { id: "room-3", name: "Room 3", x: 660, y: 828, width: 58, height: 40, occupancy: 100, equipment: "VAV-1D", people: 10, type: "room" },
  { id: "open-1", name: "Open Area 1", x: 618, y: 906, width: 176, height: 72, occupancy: 56, equipment: "AHU-1", people: 24, type: "open" },
  { id: "open-2", name: "Open Area 2", x: 248, y: 906, width: 180, height: 72, occupancy: 42, equipment: "AHU-1", people: 17, type: "open" },
  { id: "open-10", name: "Open Area 10", x: 980, y: 906, width: 150, height: 72, occupancy: 40, equipment: "AHU-3", people: 15, type: "open" },
];

const alertRows = [
  {
    title: "High CO2 levels",
    detail: "Break Room CO2 levels above 1,150ppm",
    location: "Floor 2 - Break Room",
    badge: "Critical",
    tone: "red",
    time: "2 min ago",
  },
  {
    title: "Filter maintenance due",
    detail: "MERV 16 filter replacement needed",
    location: "HVAC Unit 2A",
    badge: "Warning",
    tone: "amber",
    time: "1 hour ago",
  },
  {
    title: "Energy savings goal met",
    detail: "15% reduction achieved this month",
    location: "Building wide",
    badge: "Info",
    tone: "green",
    time: "3 hours ago",
  },
];

const systemRows = [
  { label: "BMS integration", detail: "Sample feed updated 30s ago", status: "Online" },
  { label: "Sensor network", detail: "Occupancy model updated 15s ago", status: "Online" },
  { label: "HVAC control review", detail: "Advisory only, no live control changes", status: "Online" },
  { label: "Data processing", detail: "Trend normalization running", status: "Review" },
];

function occupancyBand(value: number): RoomBand {
  if (value === 0) return "empty";
  if (value <= 25) return "low";
  if (value <= 50) return "medium";
  if (value <= 75) return "high";
  return "full";
}

const bandStyles: Record<RoomBand, { fill: string; stroke: string; pill: string; text: string }> = {
  empty: { fill: "#e8eef5", stroke: "#93a4b8", pill: "#9aabc0", text: "#334155" },
  low: { fill: "#bfdbfe", stroke: "#7aa7de", pill: "#93c5fd", text: "#1e3a8a" },
  medium: { fill: "#93c5fd", stroke: "#5c94d6", pill: "#60a5fa", text: "#0f3a70" },
  high: { fill: "#60a5fa", stroke: "#3b82f6", pill: "#3b82f6", text: "#0f172a" },
  full: { fill: "#2563eb", stroke: "#1d4ed8", pill: "#1d4ed8", text: "#ffffff" },
};

export default function CommercialFloorplanPage() {
  const [selectedRoomId, setSelectedRoomId] = useState("room-33");
  const [dateRange, setDateRange] = useState("Last 14 days");
  const [timeOfDay, setTimeOfDay] = useState("Workday");

  const selectedRoom = FLOOR_ROOMS.find((room) => room.id === selectedRoomId) ?? FLOOR_ROOMS[0];

  const peopleDetected = useMemo(
    () => FLOOR_ROOMS.reduce((sum, room) => sum + room.people, 0),
    [],
  );

  const averageOccupancy = useMemo(
    () => Math.round(FLOOR_ROOMS.reduce((sum, room) => sum + room.occupancy, 0) / FLOOR_ROOMS.length),
    [],
  );

  const estimatedSavings = SAMPLE_FDD_FINDINGS.reduce(
    (sum, finding) => sum + finding.annualWasteDollarsBase,
    0,
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/commercial" className="text-sm font-semibold text-slate-500 hover:text-blue-700">
              Back to Commercial
            </Link>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight">Entropy floorplan dashboard</h1>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                Live-style demo
              </span>
            </div>
          </div>
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Advisory analytics only, no automatic BAS control
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total energy usage" value="847.2 kWh" delta="-12.3% vs last week" trend="down" icon="⚡" />
          <KpiCard label="HVAC efficiency" value="94.7%" delta="+5.2% vs last week" trend="up" icon="≋" />
          <KpiCard label="Avg temperature" value="72.1°F" delta="+0.8°F vs last week" trend="up" icon="♨" />
          <KpiCard label="Humidity level" value="45.3%" delta="-2.1% vs last week" trend="down" icon="♒" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 className="text-xl font-black">{SAMPLE_COMMERCIAL_ASSESSMENT.buildingName}</h2>
              <p className="mt-1 text-sm text-slate-500">{SAMPLE_COMMERCIAL_ASSESSMENT.address}</p>
            </div>
            <div className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              Suite 5000
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-100 p-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="flex flex-wrap gap-3">
              <SelectShell label="Building" value={SAMPLE_COMMERCIAL_ASSESSMENT.buildingName} />
              <SelectShell label="Floor" value="Floor 5" />
            </div>
            <div className="flex flex-wrap gap-3">
              <SelectShell label="Date range" value={dateRange} onChange={setDateRange} options={["Last 14 days", "Last 30 days", "This month"]} />
              <SelectShell label="Time of day" value={timeOfDay} onChange={setTimeOfDay} options={["Workday", "After hours", "All day"]} />
              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Day of week</div>
                <div className="flex gap-2">
                  {["M", "T", "W", "T", "F"].map((day, index) => (
                    <button
                      key={`${day}-${index}`}
                      type="button"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600"
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              <span>W 33rd St.</span>
              <span>10th Avenue</span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
              <svg
                viewBox="0 0 1248 1024"
                className="min-h-[620px] min-w-[1050px] rounded-lg bg-white"
                role="img"
                aria-label="Occupancy dashboard floorplan"
              >
                <defs>
                  <pattern id="floor-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#e9eef5" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect x="0" y="0" width="1248" height="1024" fill="url(#floor-grid)" />
                <rect x="16" y="18" width="1216" height="980" rx="4" fill="transparent" stroke="#475569" strokeWidth="4" />
                <path
                  d="M16 150H1232M16 224H1232M16 420H1232M16 560H1232M16 800H1232M176 18V998M408 150V998M742 420V640M982 420V998"
                  fill="none"
                  stroke="#9caaba"
                  strokeWidth="1.5"
                />
                {FLOOR_ROOMS.map((room) => {
                  const band = occupancyBand(room.occupancy);
                  const colors = bandStyles[band];
                  const selected = room.id === selectedRoom.id;
                  return (
                    <g key={room.id} onClick={() => setSelectedRoomId(room.id)} className="cursor-pointer">
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.width}
                        height={room.height}
                        rx="4"
                        fill={colors.fill}
                        fillOpacity={room.type === "mechanical" || room.type === "support" ? 0.55 : 0.92}
                        stroke={selected ? "#0f172a" : colors.stroke}
                        strokeWidth={selected ? 3 : 1.5}
                      />
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2 - 5}
                        textAnchor="middle"
                        fontSize={room.width > 120 ? 14 : 11}
                        fill={band === "full" ? "#e0f2fe" : "#334155"}
                        fontWeight="600"
                      >
                        {room.name}
                      </text>
                      <rect
                        x={room.x + room.width / 2 - 28}
                        y={room.y + room.height / 2 + 7}
                        width="56"
                        height="22"
                        rx="11"
                        fill={colors.pill}
                      />
                      <text
                        x={room.x + room.width / 2}
                        y={room.y + room.height / 2 + 22}
                        textAnchor="middle"
                        fontSize="13"
                        fill={colors.text}
                        fontWeight="800"
                      >
                        {room.occupancy}%
                      </text>
                    </g>
                  );
                })}
                <text x="46" y="1010" fontSize="16" fill="#64748b" fontWeight="800">N</text>
              </svg>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold uppercase tracking-[0.18em] text-slate-400">Occupancy</span>
                <LegendSwatch color={bandStyles.empty.fill} label="0%" />
                <LegendSwatch color={bandStyles.low.fill} label="1-25%" />
                <LegendSwatch color={bandStyles.medium.fill} label="26-50%" />
                <LegendSwatch color={bandStyles.high.fill} label="51-75%" />
                <LegendSwatch color={bandStyles.full.fill} label="76-100%" />
              </div>
              <div>
                {FLOOR_ROOMS.length} zones <span className="mx-2">|</span> {peopleDetected} people detected
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Panel title="Active alerts" count={alertRows.length}>
            <div className="space-y-4">
              {alertRows.map((alert) => (
                <div key={alert.title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-950">{alert.title}</div>
                      <div className="mt-2 text-sm text-slate-600">{alert.detail}</div>
                      <div className="mt-2 text-xs text-slate-500">{alert.location}</div>
                    </div>
                    <span className={`${badgeTone(alert.tone)} rounded-full px-3 py-1 text-xs font-bold`}>
                      {alert.badge}
                    </span>
                  </div>
                  <div className="mt-2 text-right text-xs text-slate-400">{alert.time}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="System status">
            <div className="space-y-4">
              {systemRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div>
                    <div className="font-semibold text-slate-950">{row.label}</div>
                    <div className="mt-1 text-sm text-slate-500">{row.detail}</div>
                  </div>
                  <span className={row.status === "Online" ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700"}>
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black">Energy savings tracker</h2>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Pilot active
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Selected zone: <span className="font-semibold text-slate-950">{selectedRoom.name}</span> ·{" "}
                {selectedRoom.equipment} · {selectedRoom.people} people detected · {averageOccupancy}% average floor occupancy
              </p>
            </div>
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-700">
              MERV 16 MESP filters
            </span>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <SavingsMetric label="Energy saved" value="2,847 kWh" tone="blue" />
            <SavingsMetric label="Cost savings" value={formatUsd(Math.round(estimatedSavings / 12))} tone="green" />
            <SavingsMetric label="CO2 reduced" value="1.2 tons" tone="emerald" />
            <SavingsMetric label="Efficiency gain" value="18.3%" tone="violet" />
          </div>

          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            <span className="font-bold">Efficiency-as-a-Service performance:</span>{" "}
            Current month performance is modeled at <span className="font-bold">18.3% above baseline</span>.
            Verify trend data, IAQ guardrails, and contractor notes before operational changes.
          </div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  label,
  value,
  delta,
  trend,
  icon,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-slate-600">{label}</div>
          <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
          <div className={`mt-2 text-sm font-semibold ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
            {delta}
          </div>
        </div>
        <div className="text-2xl text-blue-600">{icon}</div>
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
        className="min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
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

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-3 w-5 rounded" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-black">{title}</h2>
        {typeof count === "number" ? (
          <span className="grid h-7 min-w-7 place-items-center rounded-full border border-slate-200 px-2 text-sm font-semibold">
            {count}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function SavingsMetric({ label, value, tone }: { label: string; value: string; tone: "blue" | "green" | "emerald" | "violet" }) {
  const tones = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    emerald: "bg-emerald-600",
    violet: "bg-violet-600",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`mb-3 grid h-9 w-9 place-items-center rounded-lg text-white ${tones[tone]}`}>↯</div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function badgeTone(tone: string) {
  if (tone === "red") return "bg-red-100 text-red-700";
  if (tone === "amber") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}
