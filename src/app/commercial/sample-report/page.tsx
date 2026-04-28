import type { Metadata } from "next";
import Link from "next/link";
import { DeploymentReadinessScore } from "@/components/commercial/feature/DeploymentReadinessScore";
import { FindingCard } from "@/components/commercial/feature/FindingCard";
import { IAQEnergyTradeoff } from "@/components/commercial/feature/IAQEnergyTradeoff";
import { RebateMatchCard } from "@/components/commercial/feature/RebateMatchCard";
import { COMMERCIAL_INCENTIVES } from "@/lib/commercial/commercialIncentives";
import { SAMPLE_COMMERCIAL_ASSESSMENT } from "@/lib/commercial/sampleCommercialAssessments";
import { SAMPLE_FDD_FINDINGS } from "@/lib/commercial/sampleFddFindings";
import { formatRange, formatUsd } from "@/lib/commercial/utils";

export const metadata: Metadata = {
  title: "Sample Commercial Report",
};

export default function CommercialSampleReportPage() {
  const low = SAMPLE_FDD_FINDINGS.reduce((sum, finding) => sum + finding.annualWasteDollarsLow, 0);
  const high = SAMPLE_FDD_FINDINGS.reduce((sum, finding) => sum + finding.annualWasteDollarsHigh, 0);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link href="/commercial" className="text-sm text-gray-500 hover:text-gray-700">
            Back to Commercial
          </Link>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
            Sample building report
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            A board-ready view of diagnostic findings, savings ranges, incentive matches, IAQ
            guardrails, and the next data needed for a pilot.
          </p>
        </div>
        <Link href="/commercial/buildings/demo-sample-school/report" className="btn-secondary">
          Open print-ready report
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Building" value={SAMPLE_COMMERCIAL_ASSESSMENT.buildingName} />
        <Metric label="Annual utility spend" value={formatUsd((SAMPLE_COMMERCIAL_ASSESSMENT.annualElectricSpend ?? 0) + (SAMPLE_COMMERCIAL_ASSESSMENT.annualGasSpend ?? 0))} />
        <Metric label="Estimated savings range" value={formatRange(low, high)} />
        <Metric label="Primary next step" value="Pilot proposal" />
      </section>

      <DeploymentReadinessScore assessment={SAMPLE_COMMERCIAL_ASSESSMENT} />

      <section>
        <h2 className="section-title">Top findings</h2>
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {SAMPLE_FDD_FINDINGS.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      </section>

      <IAQEnergyTradeoff />

      <section>
        <h2 className="section-title">Incentive matches</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {COMMERCIAL_INCENTIVES.slice(0, 3).map((incentive) => (
            <RebateMatchCard key={incentive.id} incentive={incentive} />
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-slate-950">{value}</div>
    </div>
  );
}
