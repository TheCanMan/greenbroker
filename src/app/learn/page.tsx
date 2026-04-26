import Link from "next/link";

const LESSONS = [
  {
    title: "How rebates work",
    body: "Most programs require proof of address, eligible equipment, a contractor invoice, and timing rules. Some must be started before installation.",
  },
  {
    title: "Why net cost matters",
    body: "The cheapest quote is not always the best project. GreenBroker compares gross cost, rebates, annual savings, payback range, and paperwork readiness.",
  },
  {
    title: "Supplier switching safety",
    body: "Maryland allows residential energy choice, but variable rates, teaser rates, monthly fees, and unclear renewal terms can wipe out savings.",
  },
  {
    title: "Why ranges beat guarantees",
    body: "Usage, weather, behavior, installation quality, and program rules all move the result. A credible estimate should show a low-high range.",
  },
];

export default function LearnPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="section-title">Learn</h1>
        <p className="section-subtitle">
          Plain-language guides for home energy rebates, project payback, safe
          supplier comparison, and paperwork readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {LESSONS.map((lesson) => (
          <article key={lesson.title} className="card p-6">
            <h2 className="text-xl font-bold text-gray-900">{lesson.title}</h2>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              {lesson.body}
            </p>
          </article>
        ))}
      </div>

      <div className="card p-6 mt-8 bg-brand-50 border-brand-200">
        <h2 className="font-bold text-brand-900 mb-2">
          Rebate rules change.
        </h2>
        <p className="text-sm text-brand-800 leading-relaxed">
          GreenBroker shows last-verified data and prepares your packet for
          review before submission. Always verify eligibility before purchase
          or installation.
        </p>
        <Link href="/intake" className="mt-4 inline-block btn-primary text-sm">
          Check My Rebates
        </Link>
      </div>
    </div>
  );
}
