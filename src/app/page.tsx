import { Suspense } from "react";
import Link from "next/link";
import { HomepageZipForm } from "@/components/HomepageZipForm";

const HOW_IT_WORKS = [
  {
    n: 1,
    title: "Tell us about your home",
    body: "Address, utility, equipment, goals — one short form. Upload a bill if you have one.",
    icon: "🏠",
  },
  {
    n: 2,
    title: "We find rebates and savings",
    body: "Every program you qualify for in Montgomery County, ranked by net cost and payback.",
    icon: "🔍",
  },
  {
    n: 3,
    title: "You choose an upgrade",
    body: "Compare upgrades side-by-side with confidence ranges, not guarantees.",
    icon: "✅",
  },
  {
    n: 4,
    title: "We prepare the paperwork",
    body: "Pre-filled rebate packet, contractor quote packet, and a checklist of what's still needed.",
    icon: "📄",
  },
];

const EXAMPLE_UPGRADES = [
  {
    title: "Heat pump water heater",
    rebateRange: "$2,000–$2,100",
    netCostRange: "$1,500–$3,500",
    paybackRange: "3–5 yrs",
    note: "PEPCO + Electrify MC stack to cover most of the install cost.",
    icon: "💧",
  },
  {
    title: "Home performance / insulation",
    rebateRange: "Up to $10,000",
    netCostRange: "$0–$3,000 typical",
    paybackRange: "2–6 yrs",
    note: "EmPOWER Home Performance — requires BPI-certified audit ($100).",
    icon: "🏠",
  },
  {
    title: "Smart thermostat",
    rebateRange: "$100",
    netCostRange: "$50–$200",
    paybackRange: "<1 yr",
    note: "ecobee or Nest qualifies. Often instant rebate at the retailer.",
    icon: "🌡️",
  },
  {
    title: "Heat pump (electrification)",
    rebateRange: "$8,500–$17,500",
    netCostRange: "$0–$6,500",
    paybackRange: "Varies",
    note: "EmPOWER electrification path + Electrify MC. Largest available rebate stack.",
    icon: "🔥",
  },
];

const TRUST_POINTS = [
  {
    title: "Confidence ranges, not guarantees",
    body: "Every estimate shows a low–high band. We tell you exactly what's still missing to tighten it.",
  },
  {
    title: "Last-verified dates on every rebate",
    body: "Programs change. We show when each rebate was last confirmed and link to the source.",
  },
  {
    title: "Risky supplier contracts get flagged",
    body: "Variable rates, teaser intros, monthly fees, early termination fees — all surfaced before you switch.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span>📍</span> Piloting in Montgomery County, MD
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Find your home energy rebates{" "}
              <span className="text-brand-600">in 2 minutes.</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl">
              Enter your address, upload your utility bill, and GreenBroker will show your
              best upgrades, eligible rebates, estimated net cost, and next steps.
            </p>

            <Suspense fallback={<div className="h-16" />}>
              <HomepageZipForm />
            </Suspense>

            <div className="mt-4 flex flex-col sm:flex-row gap-3 text-sm">
              <Link
                href="/intake"
                className="text-brand-700 font-semibold hover:text-brand-800 underline underline-offset-4"
              >
                Or run the full intake →
              </Link>
              <span className="hidden sm:inline text-gray-300">·</span>
              <Link
                href="/rebates"
                className="text-gray-600 font-medium hover:text-gray-900 underline underline-offset-4"
              >
                Browse example rebates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What this is */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            TurboTax for home energy savings
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            We check your address, utility, home details, equipment, and eligibility to find
            rebates, rank upgrades by ROI, match you with qualified contractors, and prepare
            the paperwork. One form. Plain language. No outdated federal-credit confusion.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">How it works</h2>
            <p className="section-subtitle">Four steps from intake to ready-to-submit packet.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-600 text-white grid place-items-center font-bold">
                    {step.n}
                  </div>
                  <span className="text-2xl">{step.icon}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example upgrades */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title">Example upgrades for a Montgomery County home</h2>
            <p className="section-subtitle">
              All numbers shown as confidence ranges. Your actual results depend on your home,
              utility, and project scope.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {EXAMPLE_UPGRADES.map((u) => (
              <div key={u.title} className="card p-5 flex flex-col">
                <div className="text-3xl mb-3">{u.icon}</div>
                <h3 className="font-bold text-gray-900 mb-3">{u.title}</h3>
                <dl className="text-xs space-y-1.5 mb-3">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Rebate</dt>
                    <dd className="font-semibold text-brand-700">{u.rebateRange}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Net cost</dt>
                    <dd className="font-medium text-gray-900">{u.netCostRange}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Payback</dt>
                    <dd className="font-medium text-gray-900">{u.paybackRange}</dd>
                  </div>
                </dl>
                <p className="text-xs text-gray-500 leading-snug mt-auto">{u.note}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/rebates" className="btn-secondary inline-block">
              See all rebates
            </Link>
          </div>
        </div>
      </section>

      {/* Trust / safety */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title">What we promise — and what we don&apos;t</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TRUST_POINTS.map((t) => (
              <div key={t.title} className="card p-5">
                <h3 className="font-bold text-gray-900 mb-2">{t.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{t.body}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 text-center mt-8 max-w-3xl mx-auto leading-relaxed">
            We don&apos;t auto-submit rebate forms or auto-switch your energy supplier yet.
            We prepare the packet, flag risks, and let you review before anything goes out.
            Maryland allows residential energy choice — not all supplier plans are good ones.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Check what you qualify for in 2 minutes.
          </h2>
          <p className="text-brand-100 text-lg mb-8">
            One short intake → personalized energy plan → ready-to-review rebate packet.
          </p>
          <Link
            href="/intake"
            className="bg-white text-brand-700 font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors inline-block text-lg"
          >
            Check My Rebates →
          </Link>
          <p className="text-brand-200 text-sm mt-4">
            ~2 minutes · No account required · Free
          </p>
        </div>
      </section>
    </div>
  );
}
