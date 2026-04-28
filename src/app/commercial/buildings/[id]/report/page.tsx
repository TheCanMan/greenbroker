import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { DashboardPayload, Finding, Rebate } from "@/lib/commercial/types";
import {
  getCommercialDemoDashboard,
  isCommercialDemoBuildingId,
} from "@/lib/commercial/demo-data";
import { fetchEntropyJson, formatRange, formatUsd } from "@/lib/commercial/utils";

export const dynamic = "force-dynamic";

function formatDate(value: string | null): string {
  if (!value) {
    return "Not available";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPercentile(value: number | null): string {
  if (value === null) {
    return "Not available";
  }

  return `${value}th percentile`;
}

function markdownToPlainText(value: string): string {
  return value.replace(/\*\*/g, "").replace(/\n{2,}/g, "\n").trim();
}

function getFindingRebateNames(
  finding: Finding,
  rebatesById: Record<string, Rebate>,
): string[] {
  return finding.rebate_program_ids
    .map((id) => rebatesById[id]?.name)
    .filter((name): name is string => Boolean(name));
}

async function getDashboardPayload(id: string): Promise<DashboardPayload> {
  if (isCommercialDemoBuildingId(id)) {
    return getCommercialDemoDashboard();
  }

  return fetchEntropyJson<DashboardPayload>(`/buildings/${id}/dashboard`);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  try {
    const data = await getDashboardPayload(id);
    return {
      title: `${data.building.name} Report`,
    };
  } catch {
    return {
      title: "Commercial Report",
    };
  }
}

export default async function CommercialBuildingReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let data: DashboardPayload;

  try {
    data = await getDashboardPayload(id);
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
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link
          href={`/commercial/buildings/${id}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to dashboard
        </Link>
        <div className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-xs font-medium text-brand-800">
          Use your browser&apos;s Print dialog to save this page as PDF.
        </div>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm uppercase tracking-[0.25em] text-gray-500">
              Commercial HVAC Analytics Report
            </div>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">
              {building.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              {building.address ? `${building.address}, ` : ""}
              {building.city}, {building.state} {building.zip ?? ""}
            </p>
          </div>
          <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-brand-700">
              Estimated annual savings
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {formatRange(savings_range_low, savings_range_high)}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Based on an effective electric rate of{" "}
              <strong>${building.effective_rate_usd_per_kwh.toFixed(2)}/kWh</strong>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Overall grade
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {score?.grade ?? "N/A"}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
              EUI
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {score?.eui_kbtu_per_sqft ? `${score.eui_kbtu_per_sqft}` : "N/A"}
            </div>
            <div className="mt-1 text-sm text-gray-500">kBtu/sqft</div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Peer standing
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {formatPercentile(score?.peer_percentile ?? null)}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
              Last analyzed
            </div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {formatDate(score?.snapshot_date ?? null)}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Priority findings
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ranked by expected savings and confidence so the team can start with
              the highest-value commissioning work.
            </p>
          </div>
          <div className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600">
            {all_findings.length} total finding{all_findings.length === 1 ? "" : "s"}
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {top_findings.map((finding, index) => {
            const rebateNames = getFindingRebateNames(finding, rebates_by_id);

            return (
              <article
                key={finding.id}
                className="rounded-2xl border border-gray-100 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
                        {finding.rule_id}
                        {finding.equipment_name ? ` · ${finding.equipment_name}` : ""}
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-gray-900">
                        {finding.title}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{formatRange(finding.estimated_annual_savings_usd_low, finding.estimated_annual_savings_usd_high)}</div>
                    <div className="mt-1 capitalize">
                      {finding.severity} severity · {finding.confidence} confidence
                    </div>
                  </div>
                </div>

                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-gray-700">
                  {markdownToPlainText(finding.description_md)}
                </p>

                {(finding.detected_window_start || rebateNames.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
                    {finding.detected_window_start && finding.detected_window_end && (
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Window: {formatDate(finding.detected_window_start)} to{" "}
                        {formatDate(finding.detected_window_end)}
                      </span>
                    )}
                    {rebateNames.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-brand-50 px-3 py-1 text-brand-800"
                      >
                        Rebate fit: {name}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">
            Data needed to tighten the analysis
          </h2>
          <div className="mt-5 space-y-4">
            {data_gaps.length === 0 ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-900">
                No critical data gaps are blocking the current rule set.
              </div>
            ) : (
              data_gaps.map((gap) => (
                <article
                  key={gap.id}
                  className="rounded-2xl border border-gray-100 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      {gap.missing_data_type.replaceAll("_", " ")}
                    </h3>
                    <div className="text-sm font-medium text-brand-700">
                      Unlocks about {formatUsd(gap.unlocks_savings_estimate_usd)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-700">
                    {gap.instructions_md}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-900">
            Data quality watchlist
          </h2>
          <div className="mt-5 space-y-3">
            {data_quality.map((point) => (
              <article
                key={point.point_id}
                className="rounded-2xl border border-gray-100 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {point.equipment_name}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">
                      {point.normalized_name.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-gray-900">
                      {point.score}
                    </div>
                    <div className="text-xs text-gray-500">quality score</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-gray-600">
                  <div>
                    <div className="font-medium text-gray-900">{point.missing_pct}%</div>
                    <div>missing</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{point.flatline_pct}%</div>
                    <div>flatlined</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{point.outlier_pct}%</div>
                    <div>outliers</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
