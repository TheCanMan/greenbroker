import Link from "next/link";

interface PageProps {
  searchParams: Promise<{ upgrade?: string }>;
}

const PACKET_INCLUDES = [
  {
    title: "Home basics",
    items: [
      "Address, ZIP, county, square footage, year built",
      "Number of bedrooms / bathrooms / occupants",
      "Ownership status",
    ],
  },
  {
    title: "Utility & equipment",
    items: [
      "Electric + gas utility (PEPCO, BGE, Washington Gas, etc.)",
      "Current heating, cooling, and water-heater type + age",
      "Insulation concerns and panel size if known",
    ],
  },
  {
    title: "Rebate context",
    items: [
      "All programs you appear to qualify for (with max amounts)",
      "Whether the contractor must be MEA-Participating / BPI-certified",
      "Required documents (BPI audit, AHRI certificate, model #, photos)",
    ],
  },
  {
    title: "Project notes",
    items: [
      "Selected upgrade and any goals (lower bills, comfort, electrification)",
      "Photos of existing equipment if uploaded",
      "Income-qualification flag if applicable (without exposing income)",
    ],
  },
];

const CONTRACTOR_RESPONSE_FIELDS = [
  "Gross project cost",
  "Eligible equipment make/model with AHRI certificate where required",
  "Estimated install timeline",
  "MHIC + trade license numbers (we verify against labor.maryland.gov/pq)",
  "MEA-Participating Contractor confirmation if rebate program requires it",
  "Whether contractor will submit rebate paperwork on your behalf",
];

export default async function ContractorQuotesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const upgrade = sp.upgrade ?? null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Contractor quote packet</h1>
        <p className="section-subtitle">
          {upgrade
            ? `One packet, sent to multiple vetted contractors for your ${upgrade.toLowerCase()} project.`
            : "One packet, sent to multiple vetted contractors. Get apples-to-apples bids without re-explaining your home five times."}
        </p>
      </div>

      <div className="card p-6 mb-8 bg-brand-50 border-brand-200">
        <h2 className="font-bold text-brand-900 mb-2 text-lg">
          Ready to get bids?
        </h2>
        <p className="text-sm text-brand-800 leading-relaxed mb-4">
          One short form, fanned out to vetted contractors who serve your
          county. They respond with structured bids you can compare side-by-side.
        </p>
        <Link
          href={
            upgrade
              ? `/contractor-quotes/new?upgrade=${encodeURIComponent(upgrade)}`
              : "/contractor-quotes/new"
          }
          className="btn-primary inline-block"
        >
          Request bids →
        </Link>
      </div>

      <div className="card p-5 mb-8 bg-gray-50 border-gray-200">
        <h2 className="font-bold text-gray-900 mb-2 text-sm">
          Other things you can do
        </h2>
        <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
          <li>
            Browse vetted contractors who serve your county at{" "}
            <Link href="/contractors" className="underline font-semibold">
              /contractors
            </Link>
          </li>
          <li>
            Run the{" "}
            <Link href="/intake" className="underline font-semibold">
              intake
            </Link>{" "}
            first so the bid form pre-fills your ZIP and home profile
          </li>
          <li>
            Use the{" "}
            <Link href="/rebates" className="underline font-semibold">
              rebate database
            </Link>{" "}
            to see which contractor certifications each program requires
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            What goes into your packet
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            One document. Everything a contractor needs to give you an accurate quote
            without three phone calls or a site visit (yet).
          </p>
          <div className="space-y-4">
            {PACKET_INCLUDES.map((section) => (
              <div key={section.title} className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{section.title}</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  {section.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            What contractors send back
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            We standardize the bid response so you can actually compare.
          </p>
          <div className="card p-5">
            <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
              {CONTRACTOR_RESPONSE_FIELDS.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>

          <div className="card p-5 mt-5 bg-brand-50 border-brand-200">
            <h3 className="font-bold text-brand-900 mb-2">Why a packet (vs. calls)</h3>
            <ul className="text-sm text-brand-800 space-y-1.5 list-disc list-inside">
              <li>You explain your home once, not five times</li>
              <li>Bids come back in a comparable format</li>
              <li>Rebate-program-specific requirements are pre-flagged</li>
              <li>No phone tag — bids land in your dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <Link
          href={
            upgrade
              ? `/contractor-quotes/new?upgrade=${encodeURIComponent(upgrade)}`
              : "/contractor-quotes/new"
          }
          className="btn-primary inline-block"
        >
          Start a bid request →
        </Link>
        <p className="text-xs text-gray-500 mt-3">
          We email matching contractors immediately. Bids typically come back
          within 2 business days.
        </p>
      </div>
    </div>
  );
}
