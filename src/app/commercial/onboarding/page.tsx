import Link from "next/link";
import { CommercialOnboardingForm } from "@/components/commercial/OnboardingForm";

export const dynamic = "force-dynamic";

export default function CommercialOnboardingPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <div>
        <Link
          href="/commercial"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Commercial
        </Link>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          Tier 0 — utility bill benchmark
        </h1>
        <p className="mt-2 text-gray-600">
          Tell us about your building and drop in at least one electric bill. We&apos;ll
          benchmark your EUI against CBECS peers, estimate an effective $/kWh, and surface
          a recoverable-waste range if you&apos;re running above the peer median.
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
        <div className="font-semibold">What you&apos;ll need</div>
        <ul className="mt-2 list-disc pl-5 space-y-1 text-blue-800">
          <li>12 months of electric bills (PDF or manual entry)</li>
          <li>Building square footage and type</li>
          <li>Optional: gas / water bills for a full energy picture</li>
        </ul>
      </div>

      <CommercialOnboardingForm />
    </main>
  );
}
