"use client";

import { useState } from "react";
import type { CommercialAssessment, FddFinding } from "@/lib/commercial/feature-types";
import { calculateDeploymentReadiness } from "@/lib/commercial/readiness";
import { formatRange } from "@/lib/commercial/utils";

export function buildProposalMarkdown({
  assessment,
  findings,
}: {
  assessment: CommercialAssessment;
  findings: FddFinding[];
}) {
  const readiness = calculateDeploymentReadiness(assessment);
  const top = findings.slice(0, 5);

  return `# GreenBroker Pilot Proposal - ${assessment.buildingName}

## Executive summary
GreenBroker reviewed available building data and identified an estimated ${formatRange(
    top.reduce((sum, finding) => sum + finding.annualWasteDollarsLow, 0),
    top.reduce((sum, finding) => sum + finding.annualWasteDollarsHigh, 0),
  )} annual HVAC savings opportunity. Current deployment readiness is ${readiness.score}/100 (${readiness.band}).

## Top opportunities
${top
  .map(
    (finding, index) =>
      `${index + 1}. ${finding.title} - estimated ${formatRange(
        finding.annualWasteDollarsLow,
        finding.annualWasteDollarsHigh,
      )}. Verification: ${finding.verificationPlan}`,
  )
  .join("\n")}

## Measurement and verification
Use two weeks of pre-change trend data, implement approved low-risk corrections, then compare normalized runtime, kWh, comfort complaints, and IAQ guardrails for two weeks after correction.

## Safety and IAQ guardrails
No live control changes should be made without building-engineer approval, code-minimum ventilation checks, IAQ guardrails, and manual override.

## Recommended next step
${readiness.nextBestAction}
`;
}

export function ProposalPreview({
  assessment,
  findings,
}: {
  assessment: CommercialAssessment;
  findings: FddFinding[];
}) {
  const [copied, setCopied] = useState(false);
  const markdown = buildProposalMarkdown({ assessment, findings });

  async function copyMarkdown() {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <article className="card p-8">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
          Board-ready pilot proposal
        </div>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
          {assessment.buildingName}
        </h1>
        <p className="mt-3 text-slate-600">
          A concise diagnostic proposal for utility bill benchmarking, trend-log FDD, incentive
          matching, and a safety-first implementation pilot.
        </p>
        <div className="mt-8 space-y-6 whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {markdown}
        </div>
      </article>
      <aside className="space-y-4">
        <button type="button" onClick={copyMarkdown} className="btn-commercial w-full">
          {copied ? "Copied" : "Copy Markdown"}
        </button>
        <button type="button" disabled className="w-full rounded-xl border border-slate-200 bg-slate-100 px-6 py-3 font-semibold text-slate-500">
          Download PDF later
        </button>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          This is a planning proposal, not a guarantee. Final savings require site approval,
          implementation, and measurement and verification.
        </div>
      </aside>
    </div>
  );
}
