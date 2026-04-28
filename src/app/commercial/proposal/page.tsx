import type { Metadata } from "next";
import Link from "next/link";
import { ProposalPreview } from "@/components/commercial/feature/ProposalPreview";
import { SAMPLE_COMMERCIAL_ASSESSMENT } from "@/lib/commercial/sampleCommercialAssessments";
import { SAMPLE_FDD_FINDINGS } from "@/lib/commercial/sampleFddFindings";

export const metadata: Metadata = {
  title: "Commercial Pilot Proposal",
};

export default function CommercialProposalPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-6">
      <div>
        <Link href="/commercial" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Commercial
        </Link>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
          Pilot proposal generator
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Generate a concise executive proposal from assessment data, top findings, incentive
          matches, readiness score, and safety/IAQ guardrails.
        </p>
      </div>
      <ProposalPreview assessment={SAMPLE_COMMERCIAL_ASSESSMENT} findings={SAMPLE_FDD_FINDINGS} />
    </main>
  );
}
