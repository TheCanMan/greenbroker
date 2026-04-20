import Link from "next/link";

const HERO_STATS = [
  { value: "$15k/yr", label: "Typical waste found on a 65k sqft school", icon: "🏫" },
  { value: "10", label: "FDD rules running on every upload", icon: "🔍" },
  { value: "15-min", label: "Resample resolution for all trend data", icon: "⏱️" },
  { value: "30-day", label: "Free Tier 1 trial, no card required", icon: "🎟️" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Drop a utility bill",
    description:
      "We benchmark your EUI against ENERGY STAR CBECS peers and flag buildings running 10%+ above median. Takes under a minute — no BMS access needed.",
    icon: "📄",
    href: "/commercial/onboarding",
    cta: "Start Tier 0",
  },
  {
    step: "02",
    title: "Upload BMS trend CSVs",
    description:
      "Export from Niagara, Metasys, WebCTRL or similar. We auto-classify every point, resample to 15-min intervals, preserve raw status transitions, and run the full FDD suite.",
    icon: "📊",
    href: "/commercial/onboarding?tier=1",
    cta: "Try Tier 1",
  },
  {
    step: "03",
    title: "Get ranked findings with $/yr",
    description:
      "Each finding ships with severity, estimated annual waste, confidence band, and matched utility rebate. Export a PDF audit or share a read-only dashboard with your chief engineer.",
    icon: "📈",
    href: "/commercial/demo",
    cta: "See a sample",
  },
];

const RULES = [
  { id: "R001", name: "Simultaneous heating & cooling", severity: "high" },
  { id: "R002", name: "Economizer not economizing", severity: "high" },
  { id: "R003", name: "Low ΔT on chilled water", severity: "medium" },
  { id: "R004", name: "Overventilation during unoccupied", severity: "high" },
  { id: "R005", name: "Hot deck / cold deck fighting", severity: "medium" },
  { id: "R006", name: "Zone setpoint drift", severity: "low" },
  { id: "R007", name: "After-hours runtime", severity: "medium" },
  { id: "R008", name: "Short-cycling fans", severity: "medium" },
  { id: "R009", name: "Reheat without cooling lockout", severity: "high" },
  { id: "R010", name: "Static pressure reset disabled", severity: "medium" },
];

export default function CommercialLandingPage() {
  return (
    <div>
      {/* Context Banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg flex-shrink-0 mt-0.5">🏢</span>
            <div className="text-sm text-blue-800">
              <strong>Commercial buildings</strong> — this is the SaaS side of GreenBroker for
              owners, operators, and chief engineers. Residential homeowners should head{" "}
              <Link href="/" className="underline font-medium hover:text-blue-900">
                back to the main site
              </Link>
              .
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span>🏢</span> DMV commercial FDD · Maryland · DC · Northern Virginia
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Find HVAC waste in your building,{" "}
              <span className="text-brand-600">without ripping out your BMS</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl">
              Upload a utility bill or trend-log CSV. Our fault-detection engine runs 10
              industry-standard rules, estimates dollar impact per finding, and matches them to
              local utility rebates. No integrations, no on-site appointments.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="/commercial/onboarding"
                className="btn-primary text-center text-lg py-4 px-8"
              >
                Try with a utility bill →
              </Link>
              <Link
                href="/commercial/demo"
                className="btn-secondary text-center text-lg py-4 px-8"
              >
                See the sample school
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HERO_STATS.map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
                >
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-brand-700">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Three tiers of depth</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              Start with whatever data you have. Upgrade depth as your BMS access improves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{item.icon}</div>
                  <span className="text-xs font-bold text-gray-400">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm flex-1 leading-relaxed">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className="mt-5 text-brand-600 font-semibold text-sm hover:text-brand-700 flex items-center gap-1"
                >
                  {item.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FDD Rules */}
      <section className="py-16 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="section-title mb-4">
                10 fault rules,{" "}
                <span className="text-brand-600">open and explainable</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                Every finding shows the rule ID, the input points it fired on, and the specific
                time windows where the fault occurred. No black-box scores. Your mechanical
                engineer can audit the logic before you spend a dime on a retrofit.
              </p>
              <Link href="/commercial/rules" className="btn-primary inline-block">
                Read the rule specs →
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
              <div className="space-y-2">
                {RULES.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-2 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-gray-400">
                        {rule.id}
                      </span>
                      <span className="text-sm text-gray-700">{rule.name}</span>
                    </div>
                    <span
                      className={
                        rule.severity === "high"
                          ? "badge-warning"
                          : rule.severity === "medium"
                          ? "badge-rebate"
                          : "badge-pending"
                      }
                    >
                      {rule.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-brand-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Benchmark your building in 60 seconds
          </h2>
          <p className="text-brand-200 text-lg mb-8">
            Drop a PDF utility bill. We&apos;ll tell you if you&apos;re running above the CBECS
            peer median and how much of that gap is typically recoverable.
          </p>
          <Link
            href="/commercial/onboarding"
            className="bg-white text-brand-700 font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors inline-block text-lg"
          >
            Start Tier 0 — free →
          </Link>
          <p className="text-brand-300 text-sm mt-4">
            No account required · No BMS access needed · DMV only (for now)
          </p>
        </div>
      </section>
    </div>
  );
}
