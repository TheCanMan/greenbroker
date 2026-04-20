import Link from "next/link";
import { notFound } from "next/navigation";
import type { DashboardPayload } from "@/lib/commercial/types";
import { fetchEntropyJson } from "@/lib/commercial/utils";
import { DemoBanner } from "@/components/commercial/dashboard/DemoBanner";
import { HeadlineCard } from "@/components/commercial/dashboard/HeadlineCard";
import { GradeAndEui } from "@/components/commercial/dashboard/GradeAndEui";
import { FindingsList } from "@/components/commercial/dashboard/FindingsList";
import { DataGapPanel } from "@/components/commercial/dashboard/DataGapPanel";
import { DataQualityPanel } from "@/components/commercial/dashboard/DataQualityPanel";
import { SubscoreChart } from "@/components/commercial/dashboard/SubscoreChart";
import { NextSteps } from "@/components/commercial/dashboard/NextSteps";

export const dynamic = "force-dynamic";

export default async function CommercialBuildingDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: DashboardPayload;
  try {
    data = await fetchEntropyJson<DashboardPayload>(`/buildings/${id}/dashboard`);
  } catch {
    return notFound();
  }
  const {
    building,
    score,
    top_findings,
    all_findings,
    data_gaps,
    data_quality,
    rebates_by_id,
    savings_range_low,
    savings_range_high,
  } = data;

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      {building.is_demo && <DemoBanner />}

      <HeadlineCard
        building={building}
        savingsLow={savings_range_low}
        savingsHigh={savings_range_high}
        lastRefreshIso={score?.snapshot_date ?? null}
      />

      <GradeAndEui score={score} />

      <FindingsList findings={top_findings} rebatesById={rebates_by_id} />

      <DataGapPanel gaps={data_gaps} />

      <DataQualityPanel points={data_quality} />

      <SubscoreChart score={score} />

      <NextSteps findings={all_findings} buildingId={building.id} />

      {!building.is_demo && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-700 no-print">
          <div className="font-semibold text-gray-900">
            Have BMS trend data?
          </div>
          <p className="mt-1">
            Upload CSVs exported from Niagara, Metasys, WebCTRL, or similar to
            unlock full FDD findings across all 10 rules.
          </p>
          <Link
            href={`/commercial/buildings/${building.id}/upload`}
            className="mt-3 inline-block btn-primary text-sm"
          >
            Upload trend CSVs →
          </Link>
        </div>
      )}

      {all_findings.length > top_findings.length && (
        <div className="text-center no-print">
          <Link
            href={`/commercial/buildings/${building.id}/findings`}
            className="text-sm text-brand-700 underline hover:text-brand-800"
          >
            View all {all_findings.length} findings →
          </Link>
        </div>
      )}

      <footer className="pt-8 text-xs text-gray-500">
        Savings calculated using an effective rate of{" "}
        <strong>${building.effective_rate_usd_per_kwh.toFixed(2)}/kWh</strong>
        {" "}({building.effective_rate_source.replace("_", " ")}). All estimates are ranges — never point values.
      </footer>
    </main>
  );
}
