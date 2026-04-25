import { HEAT_PUMPS } from "@/lib/data/products";
import { formatCurrency } from "@/lib/calculations/savings";
import type { HeatPumpProduct } from "@/lib/types";

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

function HeatPumpCard({ product, rank }: { product: HeatPumpProduct; rank: number }) {
  return (
    <div className={`card p-6 ${rank === 1 ? "border-brand-400 border-2" : ""}`}>
      {rank === 1 && (
        <div className="badge-savings mb-3">⭐ #1 Most Efficient</div>
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
          <div className="text-2xl font-bold text-brand-700">{product.seer2}</div>
          <div className="text-xs text-gray-400">SEER2</div>
        </div>
      </div>

      {/* Key Specs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "SEER2", value: product.seer2, max: 30, color: "bg-blue-500" },
          { label: "HSPF2", value: product.hspf2, max: 14, color: "bg-green-500" },
          { label: "CEE Tier", value: product.ceeTier, max: 3, color: "bg-brand-500" },
        ].map((spec, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{spec.label}</span>
              <span className="font-semibold text-gray-900">{spec.value}</span>
            </div>
            <RatingBar value={spec.value} max={spec.max} color={spec.color} />
          </div>
        ))}
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.energyStarMostEfficient && (
          <span className="badge-savings">EnergyStar Most Efficient</span>
        )}
        {product.coldClimatRated && (
          <span className="badge-rebate">Cold Climate Rated</span>
        )}
        <span className="badge-rebate">CEE Tier {product.ceeTier}</span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {product.type}
        </span>
      </div>

      {/* Cost & Savings */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Installed cost</div>
            <div className="font-bold text-gray-900">
              {formatCurrency(product.installedCostMin!)}–{formatCurrency(product.installedCostMax!)}
            </div>
          </div>
          {product.annualOperatingCostDollars && (
            <div>
              <div className="text-xs text-gray-500">Annual operating</div>
              <div className="font-bold text-brand-600">{formatCurrency(product.annualOperatingCostDollars)}/yr</div>
            </div>
          )}
          {product.annualSavingsVsBaseline && (
            <div className="col-span-2">
              <div className="text-xs text-gray-500">Annual savings vs. 14.3 SEER2 baseline</div>
              <div className="font-bold text-green-600 text-lg">
                {formatCurrency(product.annualSavingsVsBaseline)}/yr
              </div>
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

export default function HeatPumpsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="text-sm text-gray-500 mb-2">Products / Heat Pumps</div>
        <h1 className="section-title">Heat Pump Rankings</h1>
        <p className="section-subtitle">
          Ranked by SEER2 efficiency. CEE tiers determine rebate levels.
          All models qualify for up to $17,500 in stacked EmPOWER + Electrify MC rebates.
        </p>
      </div>

      {/* Rebate Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "EmPOWER Electrification Max", amount: "$15,000", sub: "PEPCO rebate, no income req." },
          { label: "Electrify MC Max", amount: "$2,500", sub: "Montgomery County" },
          { label: "HEEHRA (Pending)", amount: "$8,000", sub: "Income-qualified, not yet live in MD" },
        ].map((item, i) => (
          <div key={i} className="bg-brand-50 rounded-2xl p-5">
            <div className="text-xs text-brand-600 font-semibold uppercase tracking-wide mb-1">{item.sub}</div>
            <div className="text-3xl font-bold text-brand-700">{item.amount}</div>
            <div className="text-sm text-gray-700 font-medium mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Efficiency Context */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-blue-900 mb-2">Understanding CEE Tiers (rebate qualification)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong>Tier 1</strong> — SEER2 ≥16.0, HSPF2 ≥8.5<br />
            <span className="text-blue-600">Basic rebate eligibility</span>
          </div>
          <div>
            <strong>Tier 2</strong> — SEER2 ≥17.0, HSPF2 ≥9.0<br />
            <span className="text-blue-600">Enhanced rebates</span>
          </div>
          <div>
            <strong>Tier 3</strong> — SEER2 ≥18.0+, HSPF2 ≥9.5+<br />
            <span className="text-blue-600">Maximum rebate eligibility</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          All 5 products below are CEE Tier 3 — they all qualify for maximum EmPOWER and Electrify MC rebates.
        </div>
      </div>

      {/* Economics Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-amber-800 mb-2">⚠️ Heat pump economics at current Maryland rates</h3>
        <p className="text-sm text-amber-700 leading-relaxed">
          At current rates (PEPCO $0.217/kWh, Washington Gas $1.40/therm), gas heating is still slightly
          cheaper per BTU than heat pump electric heating in Maryland ($0.0175/kBTU for gas at 80% AFUE
          vs. $0.0228/kBTU for a heat pump at HSPF2 9.5). Energy savings come primarily from dramatically
          improved cooling efficiency. <strong>The strongest financial case for heat pumps:</strong> (1) timed
          with existing system end-of-life replacement, (2) combined with solar to reduce effective electric
          rate, or (3) after Washington Gas&apos;s pending $82.5M rate increase is approved. CO₂ reduction is
          significant regardless.
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {HEAT_PUMPS.map((product, i) => (
          <HeatPumpCard key={product.id} product={product} rank={i + 1} />
        ))}
      </div>

      {/* Licensing Note */}
      <div className="mt-10 bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">Contractor requirements for heat pump installation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900">MHIC License</strong><br />
            Maryland Home Improvement Commission — required for all residential contractors.
            Now requires $500,000 general liability insurance (up from $50K in June 2024).
          </div>
          <div>
            <strong className="text-gray-900">HVACR Board License</strong><br />
            Maryland HVACR Board license (Master or Journeyman tier) required separately
            from MHIC.
          </div>
          <div>
            <strong className="text-gray-900">EPA Section 608</strong><br />
            Universal certification for refrigerant handling — explicitly required for
            heat pump and mini-split installation.
          </div>
        </div>
      </div>
    </div>
  );
}
