import type { Metadata } from "next";
import Link from "next/link";
import { DataUploadCard } from "@/components/commercial/feature/DataUploadCard";
import { FindingCard } from "@/components/commercial/feature/FindingCard";
import { IAQEnergyTradeoff } from "@/components/commercial/feature/IAQEnergyTradeoff";
import { ODCVReadinessCard } from "@/components/commercial/feature/ODCVReadinessCard";
import { RuleLibraryTable } from "@/components/commercial/feature/RuleLibraryTable";
import { SavingsToNOICalculator } from "@/components/commercial/feature/SavingsToNOICalculator";
import { UtilityBillAnalyzer } from "@/components/commercial/feature/UtilityBillAnalyzer";
import { COMMERCIAL_RULE_DEFINITIONS } from "@/lib/commercial/commercialRuleDefinitions";
import { SAMPLE_COMMERCIAL_ASSESSMENT } from "@/lib/commercial/sampleCommercialAssessments";
import { SAMPLE_FDD_FINDINGS } from "@/lib/commercial/sampleFddFindings";

export const metadata: Metadata = {
  title: "Commercial Energy Analytics",
};

const HERO_STATS = [
  { value: "10-30%", label: "HVAC savings opportunity range" },
  { value: "20", label: "Explainable FDD rules" },
  { value: "60 sec", label: "Bill to benchmark" },
  { value: "No rip", label: "Works before sensor or controls upgrades" },
];

const PERSONAS = [
  {
    role: "Owner / Asset Manager",
    value: "NOI impact, cap-rate value creation, portfolio prioritization, and payback.",
  },
  {
    role: "Chief Engineer",
    value: "Rule IDs, trend evidence, root-cause hypotheses, and corrective actions.",
  },
  {
    role: "Sustainability / ESG",
    value: "kWh, therms, CO2e, ENERGY STAR / CBECS benchmarking, and incentive matching.",
  },
  {
    role: "Schools / Public Sector",
    value: "IAQ-first savings, no-upfront pilot paths, grants, rebates, and board-ready reports.",
  },
];

const DATA_UPLOADS = [
  {
    title: "Utility bill PDF",
    whatWeDetect: "EUI, blended rate, annualized spend, peer gap, and recovery band.",
    timeToUse: "60 seconds with manual fallback.",
    privacy: "Bill data only; no tenant or student identity.",
    exampleOutput: "Recoverable waste estimate: $10k-$19k/year.",
  },
  {
    title: "Interval data CSV",
    whatWeDetect: "Peak demand, base load, demand-response windows, and schedules.",
    timeToUse: "5 minutes once exported.",
    privacy: "Aggregated meter data; no occupant tracking.",
    exampleOutput: "Demand shed opportunity during 3-6 PM peaks.",
  },
  {
    title: "BMS trend CSV",
    whatWeDetect: "20 explainable FDD rules across AHUs, VAVs, fans, dampers, boilers, and chillers.",
    timeToUse: "10-20 minutes depending on point naming.",
    privacy: "Equipment telemetry only.",
    exampleOutput: "AHU-2 runs 42 hrs/week after occupancy.",
  },
  {
    title: "BAS point list",
    whatWeDetect: "Readiness for automated trend mapping and rule coverage.",
    timeToUse: "2 minutes after CSV export.",
    privacy: "Point names and equipment names only.",
    exampleOutput: "FDD coverage: 14 of 20 rules ready.",
  },
  {
    title: "Floorplan PDF",
    whatWeDetect: "Zones, equipment service areas, fault overlays, and O-DCV planning scope.",
    timeToUse: "Manual zone map in 10 minutes.",
    privacy: "No camera or biometric data required.",
    exampleOutput: "Floor 3 savings zone: $7.6k/year.",
  },
  {
    title: "IAQ / occupancy export",
    whatWeDetect: "Ventilation efficiency while preserving CO2, PM2.5, comfort, and safety guardrails.",
    timeToUse: "5 minutes from sensor export.",
    privacy: "Supports camera-free, non-PII sensing options.",
    exampleOutput: "CO2 below 800 ppm for 94% of occupied hours.",
  },
];

const MODULES = [
  "Utility bill benchmarking",
  "Trend-log FDD",
  "Floorplan zone mapper",
  "O-DCV readiness score",
  "IAQ + ventilation analyzer",
  "After-hours runtime analyzer",
  "Rebate + incentive matcher",
  "Savings-to-NOI calculator",
  "Pilot proposal generator",
  "Portfolio ranking dashboard",
];

export default function CommercialLandingPage() {
  return (
    <div className="bg-white">
      <section className="overflow-hidden bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="inline-flex rounded-full border border-blue-400/40 bg-blue-400/10 px-4 py-1.5 text-sm font-semibold text-blue-100">
              Commercial Building Savings OS - DMV pilot
            </div>
            <h1 className="mt-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
              Find HVAC waste, prove the savings, and build a pilot-ready plan.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">
              GreenBroker analyzes utility bills, BMS trend logs, floorplans, and operating
              schedules to identify energy waste, map incentives, and generate an implementation
              plan without ripping out your BMS.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/commercial/intake" className="btn-commercial text-center">
                Start free building assessment
              </Link>
              <Link
                href="/commercial/sample-report"
                className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-center font-semibold text-white hover:bg-white/20"
              >
                View sample building report
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {HERO_STATS.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="mt-1 text-xs leading-snug text-slate-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl">
            <div className="rounded-[1.5rem] bg-white p-5 text-slate-950">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                Sample output
              </div>
              <div className="mt-4 space-y-3">
                {SAMPLE_FDD_FINDINGS.slice(0, 2).map((finding) => (
                  <div key={finding.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="text-xs font-mono font-bold text-blue-700">{finding.ruleId}</div>
                    <div className="mt-1 font-bold">{finding.title}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      Estimated waste: ${finding.annualWasteDollarsLow.toLocaleString()}-${finding.annualWasteDollarsHigh.toLocaleString()}/yr
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/commercial/proposal" className="mt-5 block rounded-xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white">
                Generate pilot proposal
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-5">
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-3 text-sm font-semibold">
          <Link href="/commercial/intake" className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm hover:text-blue-700">
            Intake
          </Link>
          <Link href="/commercial/sample-report" className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm hover:text-blue-700">
            Sample report
          </Link>
          <Link href="/commercial/rules" className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm hover:text-blue-700">
            Rules
          </Link>
          <Link href="/commercial/floorplan" className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm hover:text-blue-700">
            Floorplan
          </Link>
          <Link href="/commercial/portfolio" className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm hover:text-blue-700">
            Portfolio
          </Link>
          <Link href="/commercial/proposal" className="rounded-full bg-white px-4 py-2 text-slate-700 shadow-sm hover:text-blue-700">
            Proposal
          </Link>
        </nav>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="section-title">Built for the people who have to approve, fix, and verify.</h2>
            <p className="section-subtitle">
              Same data, different lens: finance, facilities, sustainability, and public-sector
              reporting.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {PERSONAS.map((persona) => (
              <div key={persona.role} className="card p-5">
                <h3 className="font-bold text-slate-950">{persona.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{persona.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="section-title">Start with the data you already have.</h2>
            <p className="section-subtitle">
              Upload a bill, trend log, point list, floorplan, or IAQ export. GreenBroker tells
              you what is actionable now and what is missing before a pilot.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {DATA_UPLOADS.map((card) => (
              <DataUploadCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="section-title">R-Zero-style direction, GreenBroker entry point.</h2>
              <p className="mt-4 leading-relaxed text-slate-600">
                Platforms like R-Zero show where the market is heading: occupancy-aware
                ventilation, IAQ-linked controls, and energy savings without major retrofits.
                GreenBroker starts one step earlier: it tells you which buildings are ready, what
                data you already have, and where savings are likely before you buy sensors or touch
                controls.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {MODULES.map((module) => (
                  <div key={module} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                    {module}
                  </div>
                ))}
              </div>
            </div>
            <ODCVReadinessCard assessment={SAMPLE_COMMERCIAL_ASSESSMENT} />
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <UtilityBillAnalyzer />
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white">Open 20-rule FDD library.</h2>
              <p className="mt-2 max-w-3xl text-slate-300">
                Explainable diagnostics for engineers: required points, detection logic, savings
                placeholder, and corrective actions.
              </p>
            </div>
            <Link href="/commercial/rules" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950">
              Open rule library
            </Link>
          </div>
          <RuleLibraryTable rules={COMMERCIAL_RULE_DEFINITIONS} limit={8} />
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <h2 className="section-title">Sample findings with evidence windows.</h2>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {SAMPLE_FDD_FINDINGS.map((finding) => (
              <FindingCard key={finding.id} finding={finding} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
          <IAQEnergyTradeoff />
          <div className="card p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Public-sector pilot
            </div>
            <h2 className="mt-2 text-3xl font-bold text-slate-950">
              Board-ready savings without disruption.
            </h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              Schools and local governments need IAQ-safe savings, grant and rebate matching, and a
              clean story for boards. GreenBroker turns utility bills, trend logs, and floorplans
              into a concise pilot scope before procurement.
            </p>
            <Link href="/commercial/intake" className="btn-commercial mt-6 inline-block">
              Start school / public-sector assessment
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <SavingsToNOICalculator />
        </div>
      </section>

      <section className="bg-blue-700 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold">Start with one building.</h2>
          <p className="mt-3 text-blue-100">
            Upload what you have. We will produce a readiness score, savings band, incentive map,
            and recommended next action.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/commercial/intake" className="rounded-xl bg-white px-6 py-3 font-semibold text-blue-700">
              Start free assessment
            </Link>
            <Link href="/commercial/floorplan" className="rounded-xl border border-white/40 px-6 py-3 font-semibold text-white">
              Try floorplan prototype
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
