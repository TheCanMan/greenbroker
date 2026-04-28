import type { Metadata } from "next";
import Link from "next/link";
import { RuleLibraryTable } from "@/components/commercial/feature/RuleLibraryTable";
import { COMMERCIAL_RULE_DEFINITIONS } from "@/lib/commercial/commercialRuleDefinitions";

export const metadata: Metadata = {
  title: "Fault Detection Rules",
};

export default function CommercialRulesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div>
        <Link href="/commercial" className="text-sm text-gray-500 hover:text-gray-700">
          Back to Commercial
        </Link>
        <h1 className="mt-2 text-4xl font-bold text-gray-900 tracking-tight">
          20 explainable FDD rules
        </h1>
        <p className="mt-3 text-gray-600 max-w-3xl">
          Every finding shows its rule ID, required input points, detection logic, likely savings
          mechanism, and recommended action. This is an engineer-auditable diagnostic layer, not a
          black-box controls claim.
        </p>
      </div>

      <RuleLibraryTable rules={COMMERCIAL_RULE_DEFINITIONS} />

      <div className="rounded-2xl bg-brand-50 border border-brand-200 p-6 text-sm text-gray-700">
        <div className="font-semibold text-gray-900">
          Want to see these fire on your building?
        </div>
        <p className="mt-1">
          Start with a utility bill for a Tier 0 benchmark, or upload BMS trend CSVs for full
          fault detection. We will identify what is actionable and what data is still missing.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/commercial/intake" className="btn-commercial text-sm">
            Start free assessment
          </Link>
          <Link href="/commercial/sample-report" className="btn-secondary text-sm">
            View sample report
          </Link>
        </div>
      </div>
    </main>
  );
}
