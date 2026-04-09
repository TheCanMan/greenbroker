import Link from "next/link";
import { SAVINGS_SCENARIOS, POLICY_ALERT } from "@/lib/data/scenarios";
import { REBATES } from "@/lib/data/rebates";
import { formatCurrency } from "@/lib/calculations/savings";

// Key stats for the hero section
const HERO_STATS = [
  { value: "$15,000", label: "Max EmPOWER rebate for heat pump", icon: "🔥" },
  { value: "9.4 yrs", label: "Solar payback — best standalone investment", icon: "☀️" },
  { value: "$2,100", label: "Available rebates for heat pump water heater", icon: "💧" },
  { value: "$485/yr", label: "LED savings for $100 investment", icon: "💡" },
];

const QUICK_WINS = [
  {
    title: "LEDs First",
    description: "Replace 40 incandescent bulbs for $100. Save $485/year. Payback: 2.5 months.",
    icon: "💡",
    href: "/calculator?scenario=leds",
    cta: "Calculate savings",
    badge: "2.5 month payback",
    badgeColor: "green",
  },
  {
    title: "Heat Pump Water Heater",
    description: "Up to $2,100 in rebates (PEPCO + Electrify MC). Save $837/year vs. electric resistance.",
    icon: "💧",
    href: "/products/water-heaters",
    cta: "Compare models",
    badge: "$2,100 rebates",
    badgeColor: "blue",
  },
  {
    title: "Solar + SRECs",
    description: "9.4-year payback even without federal credits. Maryland SRECs add $700+/year.",
    icon: "☀️",
    href: "/calculator?scenario=solar",
    cta: "Run the numbers",
    badge: "Best ROI",
    badgeColor: "amber",
  },
];

export default function HomePage() {
  const availableRebates = REBATES.filter((r) => r.available);
  const maxHeatPumpStack =
    15000 + 2500; // EmPOWER + Electrify MC max

  return (
    <div>
      {/* Policy Alert Banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-lg flex-shrink-0 mt-0.5">⚠️</span>
            <div className="text-sm text-amber-800">
              <strong>{POLICY_ALERT.title}:</strong> {POLICY_ALERT.body.slice(0, 200)}...{" "}
              <Link href="/rebates" className="underline font-medium hover:text-amber-900">
                See current programs →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-brand-50 via-white to-blue-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <span>📍</span> Rockville, MD (ZIP 20850) · Montgomery County
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 leading-tight tracking-tight mb-6">
              Energy upgrades,{" "}
              <span className="text-brand-600">actually explained</span>
            </h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-8 max-w-2xl">
              Product rankings based on real efficiency data. Rebate stacking for Rockville homeowners.
              Vetted contractors who know Maryland's programs. No outdated federal tax credit confusion.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/intake" className="btn-primary text-center text-lg py-4 px-8">
                Get My Personalized Plan →
              </Link>
              <Link href="/calculator" className="btn-secondary text-center text-lg py-4 px-8">
                Try the Calculator
              </Link>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-brand-700">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1 leading-snug">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Wins Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Where to start</h2>
            <p className="section-subtitle max-w-2xl mx-auto">
              The research is clear: not all efficiency upgrades are equal. Here's the optimal
              sequence for a Rockville home in April 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {QUICK_WINS.map((item, i) => (
              <div key={i} className="card p-6 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{item.icon}</div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      item.badgeColor === "green"
                        ? "bg-green-100 text-green-800"
                        : item.badgeColor === "blue"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-gray-400">STEP {i + 1}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 text-sm flex-1 leading-relaxed">{item.description}</p>
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

      {/* Rebate Stack Highlight */}
      <section className="py-16 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="section-title mb-4">
                Heat pump rebates can cover your{" "}
                <span className="text-brand-600">entire project</span>
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                With EmPOWER Maryland and Electrify MC stacked together, Rockville homeowners
                can access <strong>{formatCurrency(maxHeatPumpStack)}</strong> in currently
                available rebates — enough to cover a typical heat pump installation at net-zero cost.
              </p>
              <div className="space-y-3">
                {[
                  { label: "PEPCO EmPOWER (electrification path)", amount: "$7,500–$15,000", available: true },
                  { label: "Electrify MC (Montgomery County)", amount: "$1,000–$2,500", available: true },
                  { label: "HEEHRA (income-qualified, pending launch)", amount: "up to $8,000", available: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          item.available ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                      <span className="text-sm text-gray-700">{item.label}</span>
                      {!item.available && (
                        <span className="badge-pending">Pending</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-brand-700">{item.amount}</span>
                  </div>
                ))}
              </div>
              <Link href="/rebates" className="btn-primary inline-block mt-6">
                See All Rebates →
              </Link>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-lg">
              <h3 className="font-bold text-gray-900 text-lg mb-6">
                Example: Heat Pump Installation (~$15,000)
              </h3>
              <div className="space-y-4">
                {[
                  { label: "Gross project cost", value: 15000, color: "text-gray-900" },
                  { label: "EmPOWER rebate (midpoint)", value: -11250, color: "text-brand-600" },
                  { label: "Electrify MC rebate", value: -2000, color: "text-brand-600" },
                ].map((row, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className={`font-bold ${row.color}`}>
                      {row.value < 0 ? "−" : ""}{formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-gray-900">Net homeowner cost</span>
                  <span className="text-2xl font-bold text-brand-600">$1,750</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                * Rebate amounts vary by project scope and income. Requires BPI-certified energy audit
                ($100) and MEA-participating contractor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scenarios Summary */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Five upgrades. Real numbers.</h2>
            <p className="section-subtitle">
              Based on a 2,000 sq ft, 1980-built Rockville home. PEPCO $0.217/kWh, Washington Gas $1.40/therm.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-semibold">Upgrade</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-semibold">Net Cost</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-semibold">Annual Savings</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-semibold">Payback</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-semibold">10-Yr Cumulative</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {SAVINGS_SCENARIOS.map((scenario) => (
                  <tr
                    key={scenario.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      scenario.recommended ? "bg-brand-50/50" : ""
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{scenario.icon}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{scenario.shortName}</div>
                          {scenario.recommended && (
                            <span className="badge-savings mt-0.5">Recommended</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right font-medium text-gray-700">
                      {formatCurrency(scenario.netCostStandard)}
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-brand-600">
                      {formatCurrency(scenario.totalAnnualSavings)}/yr
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          scenario.simplePaybackYears < 5
                            ? "text-green-600"
                            : scenario.simplePaybackYears < 15
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {scenario.simplePaybackYears.toFixed(1)} yrs
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span
                        className={`font-semibold ${
                          scenario.tenYearNPV >= 0 ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {scenario.tenYearNPV >= 0 ? "+" : ""}
                        {formatCurrency(scenario.tenYearNPV)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        href={`/calculator?scenario=${scenario.id}`}
                        className="text-brand-600 hover:text-brand-700 font-medium text-xs"
                      >
                        Details →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-center">
            <Link href="/calculator" className="btn-primary">
              Open Full Savings Calculator →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-brand-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Get your personalized energy plan
          </h2>
          <p className="text-brand-200 text-lg mb-8">
            Tell us about your home and we'll calculate your exact rebate eligibility,
            savings potential, and the optimal upgrade sequence — all in one intake.
          </p>
          <Link href="/intake" className="bg-white text-brand-700 font-bold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors inline-block text-lg">
            Start My Assessment →
          </Link>
          <p className="text-brand-300 text-sm mt-4">
            Takes ~5 minutes · No account required · Free
          </p>
        </div>
      </section>
    </div>
  );
}
