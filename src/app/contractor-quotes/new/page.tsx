import { Suspense } from "react";
import Link from "next/link";
import { NewQuoteRequestForm } from "./form";

interface PageProps {
  searchParams: Promise<{ upgrade?: string; zip?: string }>;
}

export default async function NewQuoteRequestPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Request contractor bids</h1>
        <p className="section-subtitle">
          One form fans out to vetted contractors who serve your county. They
          respond with bids you can compare side-by-side. We don&apos;t put you on
          a phone tree.
        </p>
      </div>

      <Suspense fallback={<div className="card p-6">Loading…</div>}>
        <NewQuoteRequestForm
          initialUpgrade={sp.upgrade}
          initialZip={sp.zip}
        />
      </Suspense>

      <p className="text-xs text-gray-500 mt-8 leading-relaxed">
        We email matching contractors immediately. Bids typically come back
        within 2 business days. We don&apos;t share your address with anyone
        until you choose to engage a specific contractor.{" "}
        <Link href="/contractors" className="underline">
          Browse contractors
        </Link>{" "}
        in your area first if you want to see who&apos;s on the list.
      </p>
    </div>
  );
}
