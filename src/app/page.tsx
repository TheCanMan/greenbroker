import { Suspense } from "react";
import Link from "next/link";
import { HomepageZipForm } from "@/components/HomepageZipForm";

const HOW_IT_WORKS = [
  {
    n: 1,
    title: "Tell us about your home",
    body: "ZIP, utility, equipment, goals — one short form. Optional bill upload.",
  },
  {
    n: 2,
    title: "We find rebates and savings",
    body: "Every program you qualify for, ranked by net cost and payback.",
  },
  {
    n: 3,
    title: "You choose an upgrade",
    body: "Compare upgrades side-by-side with confidence ranges, not guarantees.",
  },
  {
    n: 4,
    title: "We prepare the paperwork",
    body: "Pre-filled rebate packet + contractor quote packet.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero — single, focused, ZIP-driven */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span>📍</span> Piloting in Montgomery County, MD
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-5">
              Find your home energy rebates{" "}
              <span className="text-brand-600">in 2 minutes.</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-2xl">
              Enter your ZIP and we&apos;ll show every rebate you qualify for,
              your estimated net cost, and the next steps.
            </p>

            <Suspense fallback={<div className="h-16" />}>
              <HomepageZipForm />
            </Suspense>

            <p className="mt-4 text-sm text-gray-500">
              No account required to see your plan. Save it only if you want to
              come back.{" "}
              <Link
                href="/auth/login"
                className="text-brand-700 font-medium underline underline-offset-4 hover:text-brand-800"
              >
                Already have one? Sign in
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* What this is — single line, no separate section */}
      <section className="py-12 px-4 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            <strong>GreenBroker is TurboTax for home energy savings.</strong>{" "}
            We check your address, utility, equipment, and eligibility to find
            rebates, rank upgrades by ROI, match you with qualified contractors,
            and prepare the paperwork.
          </p>
        </div>
      </section>

      {/* How it works — tightened text, no icons-as-emoji */}
      <section className="py-16 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="section-title">How it works</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.n} className="card p-6">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white grid place-items-center font-bold mb-4">
                  {step.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust — single inline disclaimer, no card grid */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-600 leading-relaxed">
            Confidence ranges, not guarantees. Last-verified dates on every
            rebate. Risky supplier contracts get flagged before you switch.{" "}
            <strong className="text-gray-900">
              We don&apos;t auto-submit rebates or auto-switch suppliers
            </strong>{" "}
            — we prepare the packet for your review before anything goes out.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Check what you qualify for.
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
