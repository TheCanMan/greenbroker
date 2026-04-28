import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioRankTable } from "@/components/commercial/feature/PortfolioRankTable";
import { SAMPLE_PORTFOLIO } from "@/lib/commercial/sampleCommercialAssessments";

export const metadata: Metadata = {
  title: "Commercial Portfolio Ranking",
};

export default function CommercialPortfolioPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
      <div>
        <Link href="/commercial" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Commercial
        </Link>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950">
          Portfolio ranking dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Rank where to start by data readiness, energy spend, EUI percentile, estimated savings,
          incentive potential, and operational complexity.
        </p>
      </div>
      <PortfolioRankTable buildings={SAMPLE_PORTFOLIO} />
    </main>
  );
}
