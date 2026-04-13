import { SMART_THERMOSTATS } from "@/lib/data/products";
import { formatCurrency } from "@/lib/calculations/savings";
import type { Product } from "@/lib/types";

function RatingBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ThermostatCard({ product, rank }: { product: Product; rank: number }) {
  const annualSavings = product.annualSavingsVsBaseline || 0;
  const paybackYears = product.paybackYears || 0;

  return (
    <div className={`card p-6 ${rank === 1 ? "border-brand-400 border-2" : ""}`}>
      {rank === 1 && (
        <div className="badge-savings mb-3">⭐ #1 Best Value</div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
            #{rank} · {product.brand}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
          <div className="text-sm text-gray-500 mt-0.5">{product.model}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-brand-700">{paybackYears.toFixed(1)}</div>
          <div className="text-xs text-gray-400">Years to ROI</div>
        </div>
      </div>

      {/* Key Specs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          {
            label: "Annual Savings",
            value: annualSavings,
            max: 300,
            color: "bg-green-500",
            format: "$",
          },
          { label: "Payback Period", value: paybackYears, max: 3, color: "bg-blue-500", format: "yr" },
          { label: "Price", value: product.msrpMin, max: 400, color: "bg-brand-500", format: "$" },
        ].map((spec, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{spec.label}</span>
              <span className="font-semibold text-gray-900">
                {spec.format === "$"
                  ? formatCurrency(spec.value)
                  : spec.label === "Payback Period"
                    ? `${spec.value.toFixed(1)}yr`
                    : spec.value}
              </span>
            </div>
            <RatingBar value={spec.value} max={spec.max} color={spec.color} />
          </div>
        ))}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.energyStarMostEfficient && (
          <span className="badge-savings">EnergyStar</span>
        )}
        {paybackYears <= 1 && (
          <span className="badge-rebate">Sub-1-Year Payback</span>
        )}
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          MSRP {formatCurrency(product.msrpMin)}
        </span>
      </div>

      {/* Cost & Savings */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Price (MSRP)</div>
            <div className="font-bold text-gray-900">{formatCurrency(product.msrpMin)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">With installation</div>
            <div className="font-bold text-brand-600">
              {formatCurrency(product.installedCostMin!)}–{formatCurrency(product.installedCostMax!)}
            </div>
          </div>
          {annualSavings > 0 && (
            <div className="col-span-2">
              <div className="text-xs text-gray-500">Annual HVAC savings</div>
              <div className="font-bold text-green-600 text-lg">{formatCurrency(annualSavings)}/yr</div>
            </div>
          )}
        </div>
      </div>

      {/* Highlights */}
      <ul className="space-y-1.5 mb-4">
        {product.highlights.slice(0, 3).map((h, i) => (
          <li key={i} className="text-sm text-gray-600 flex gap-2">
            <span className="text-brand-500 flex-shrink-0">✓</span>
            {h}
          </li>
        ))}
      </ul>

      {/* Caveats */}
      {product.caveats && product.caveats.length > 0 && (
        <ul className="space-y-1.5">
          {product.caveats.map((c, i) => (
            <li key={i} className="text-xs text-amber-700 flex gap-2">
              <span className="flex-shrink-0">⚠</span>
              {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SmartThermostatsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="text-sm text-gray-500 mb-2">Products / Smart Thermostats</div>
        <h1 className="section-title">Smart Thermostat Rankings</h1>
        <p className="section-subtitle">
          Fastest payback of any energy upgrade. ~1 year ROI with PEPCO rebate.
        </p>
      </div>

      {/* Rebate Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "PEPCO EmPOWER Rebate", amount: "$100", sub: "Makes ecobee effectively free" },
          { label: "Average Annual Savings", amount: "~$250", sub: "26% reduction in HVAC costs" },
          { label: "Payback Period", amount: "~1 yr", sub: "Fastest of any HVAC upgrade" },
        ].map((item, i) => (
          <div key={i} className="bg-brand-50 rounded-2xl p-5">
            <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">{item.sub}</div>
            <div className="text-3xl font-bold text-brand-700">{item.amount}</div>
            <div className="text-sm text-gray-700 font-medium mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Context Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-blue-900 mb-2">How smart thermostats save energy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Learning & Scheduling (Nest)</strong><br />
            <span className="text-blue-600">
              Self-programming thermostat learns your patterns over ~1 week. Automatically adjusts heating/cooling to match
              occupancy. Typical savings: 10–15% of HVAC costs.
            </span>
          </div>
          <div>
            <strong>Multi-Zone Control (ecobee)</strong><br />
            <span className="text-blue-600">
              Included room sensor eliminates hot/cold spots by measuring temperature in separate room. Directs HVAC to condition
              occupied spaces. Typical savings: 23–26% of HVAC costs.
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          <strong>Why smart thermostats beat other HVAC upgrades:</strong> They require zero equipment replacement (work with
          existing system), have minimal installation cost, and deliver immediate 10–26% savings. Heat pumps and high-efficiency
          furnaces take longer to pay back.
        </div>
      </div>

      {/* Economics Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-amber-800 mb-2">⚠️ Smart thermostat ROI: ~1 year (fastest upgrade)</h3>
        <p className="text-sm text-amber-700 leading-relaxed">
          Smart thermostats deliver the <strong>shortest payback period of any energy upgrade</strong> — typically 1–1.5 years:
        </p>
        <ul className="text-sm text-amber-700 mt-2 space-y-1">
          <li>
            <strong>ecobee Premium:</strong> {formatCurrency(249)} MSRP → ~{formatCurrency(150)} net cost after $100 PEPCO
            EmPOWER rebate → {formatCurrency(250)}/year savings (26% HVAC reduction) → <strong>~9 months payback</strong>
          </li>
          <li>
            <strong>Google Nest:</strong> {formatCurrency(279)} MSRP (no local rebate) → {formatCurrency(150)}/year savings (10%
            HVAC reduction) → <strong>~2 years payback</strong>
          </li>
        </ul>
        <p className="text-sm text-amber-700 mt-2">
          For comparison: Heat pumps take 10–15 years to pay back (without federal credits), furnaces take 8–12 years. Install a
          smart thermostat now, then pair with heat pump or solar later.
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SMART_THERMOSTATS.map((product, i) => (
          <ThermostatCard key={product.id} product={product} rank={i + 1} />
        ))}
      </div>

      {/* Licensing Note */}
      <div className="mt-10 bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">Installation & setup for smart thermostats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900">DIY Installation (Usually Possible)</strong><br />
            Most homeowners can self-install smart thermostats in 30–60 minutes. Requires: (1) compatible HVAC system (not all
            oil furnaces work), (2) 24V common wire (some older systems lack this), (3) basic wiring comfort.
          </div>
          <div>
            <strong className="text-gray-900">Professional Installation</strong><br />
            HVAC contractors charge $100–$300 for installation + configuration. Recommended if: (1) system compatibility
            unclear, (2) no common wire present, (3) prefer warranty/support. Verify contractor has ecobee or Nest certification.
          </div>
          <div>
            <strong className="text-gray-900">Wi-Fi & App Setup</strong><br />
            All smart thermostats require 2.4 GHz Wi-Fi for remote control and scheduling. Download brand app (ecobee or Google
            Home) and create account. Connection takes 5–10 minutes after hardware install.
          </div>
        </div>
      </div>
    </div>
  );
}
