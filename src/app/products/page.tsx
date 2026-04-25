import Link from "next/link";
import { HEAT_PUMPS, WATER_HEATERS, SOLAR_PANELS, BATTERIES, SMART_THERMOSTATS } from "@/lib/data/products";
import { formatCurrency } from "@/lib/calculations/savings";

const PRODUCT_CATEGORIES = [
  {
    id: "heat-pumps",
    title: "Heat Pumps",
    icon: "🌡️",
    description: "Highest-rebate category. Replace gas furnace + AC with a single efficient system.",
    topRebate: "Up to $17,500 in rebates (EmPOWER + Electrify MC)",
    count: HEAT_PUMPS.length,
    topProduct: HEAT_PUMPS[0],
    href: "/products/heat-pumps",
  },
  {
    id: "water-heaters",
    title: "Water Heaters",
    icon: "💧",
    description: "Heat pump water heaters deliver 60–80% energy reduction vs. electric resistance.",
    topRebate: "Up to $2,100 in rebates (PEPCO + Electrify MC)",
    count: WATER_HEATERS.length,
    topProduct: WATER_HEATERS[0],
    href: "/products/water-heaters",
  },
  {
    id: "solar",
    title: "Solar Panels",
    icon: "☀️",
    description: "9.4-year payback even without federal credits, thanks to Maryland's strong SREC market.",
    topRebate: "Up to $7,500 MSAP + RCES $5,000 + sales tax exemption",
    count: SOLAR_PANELS.length,
    topProduct: SOLAR_PANELS[0],
    href: "/products/solar-panels",
  },
  {
    id: "battery",
    title: "Battery Storage",
    icon: "🔋",
    description: "Pair with solar for backup power and time-of-use rate optimization.",
    topRebate: "Maryland RCES: 30% up to $5,000",
    count: BATTERIES.length,
    topProduct: BATTERIES[0],
    href: "/products/battery-storage",
  },
  {
    id: "thermostats",
    title: "Smart Thermostats",
    icon: "🏠",
    description: "Fastest payback of any HVAC accessory. ecobee Premium saves ~$250/year.",
    topRebate: "$100 PEPCO rebate — essentially free",
    count: SMART_THERMOSTATS.length,
    topProduct: SMART_THERMOSTATS[0],
    href: "/products/smart-thermostats",
  },
];

export default function ProductsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="section-title">Product Rankings</h1>
        <p className="section-subtitle">
          Real efficiency data from EnergyStar, AHRI, and DOE. Annual costs calculated at
          PEPCO $0.217/kWh and Washington Gas $1.40/therm (April 2026).
        </p>
      </div>

      {/* Methodology callout */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <div className="flex gap-3">
          <span className="text-blue-500 text-lg">📊</span>
          <div className="text-sm text-blue-800">
            <strong>Methodology:</strong> Rankings draw from EnergyStar.gov product databases,
            DOE test procedures, AHRI-certified performance data, and manufacturer specifications.
            All model numbers are real, commercially available products. Energy Star &quot;Most Efficient&quot;
            designation identifies the top tier within each certified category. Annual operating costs
            use PEPCO&apos;s blended rate of $0.217/kWh and Washington Gas all-in rate of $1.40/therm.
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PRODUCT_CATEGORIES.map((cat) => (
          <Link key={cat.id} href={cat.href} className="card p-6 hover:border-brand-300 group">
            <div className="flex items-start justify-between mb-4">
              <span className="text-4xl">{cat.icon}</span>
              <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {cat.count} products
              </span>
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-brand-700 transition-colors">
              {cat.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{cat.description}</p>

            <div className="bg-brand-50 rounded-xl px-3 py-2 mb-4">
              <div className="text-xs text-brand-700 font-semibold">{cat.topRebate}</div>
            </div>

            {cat.topProduct && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs text-gray-400 mb-1">Top-ranked</div>
                <div className="font-semibold text-gray-900 text-sm">{cat.topProduct.name}</div>
                {cat.topProduct.annualSavingsVsBaseline && (
                  <div className="text-brand-600 text-sm font-semibold mt-1">
                    {formatCurrency(cat.topProduct.annualSavingsVsBaseline)}/yr savings vs. baseline
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 text-brand-600 text-sm font-semibold group-hover:gap-2 flex items-center gap-1 transition-all">
              Compare {cat.title.toLowerCase()} →
            </div>
          </Link>
        ))}
      </div>

      {/* Note on ROI Sequencing */}
      <div className="mt-12 bg-gray-50 rounded-3xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Optimal upgrade sequence for Montgomery County</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: "1", label: "LEDs", detail: "2.5 month payback", icon: "💡" },
            { step: "2", label: "Solar", detail: "9.4 yr payback", icon: "☀️" },
            { step: "3", label: "Heat Pump", detail: "Time with replacement", icon: "🌡️" },
            { step: "4", label: "Weatherize", detail: "Time with renovation", icon: "🏠" },
            { step: "5", label: "Full Electric", detail: "For HEEHRA timing", icon: "⚡" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center mb-3">
                {item.step}
              </div>
              <div className="text-xl mb-1">{item.icon}</div>
              <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
