import { WATER_HEATERS } from "@/lib/data/products";
import { formatCurrency } from "@/lib/calculations/savings";
import type { WaterHeaterProduct } from "@/lib/types";

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

function WaterHeaterCard({ product, rank }: { product: WaterHeaterProduct; rank: number }) {
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
          <div className="text-2xl font-bold text-brand-700">{product.uef}</div>
          <div className="text-xs text-gray-400">UEF</div>
        </div>
      </div>

      {/* Key Specs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "UEF", value: product.uef, max: 5, color: "bg-blue-500" },
          { label: "Gallons", value: product.gallons || 0, max: 80, color: "bg-green-500" },
        ].map((spec, i) => (
          <div key={i}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{spec.label}</span>
              <span className="font-semibold text-gray-900">
                {spec.value.toFixed(spec.label === "UEF" ? 2 : 0)}
              </span>
            </div>
            <RatingBar value={spec.value} max={spec.max} color={spec.color} />
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Type</span>
          <span className="font-semibold text-gray-900">
            {product.type === "heat-pump" ? "HPWH" : "Gas"}
          </span>
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {product.energyStarMostEfficient && (
          <span className="badge-savings">EnergyStar Most Efficient</span>
        )}
        <span className="badge-rebate">
          {product.type === "heat-pump" ? "HPWH Eligible" : "Gas Tankless"}
        </span>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {product.gallons && product.type === "heat-pump" ? `${product.gallons} gal` : product.gpm && `${product.gpm} gpm`}
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
              <div className="text-xs text-gray-500">
                {product.type === "heat-pump"
                  ? "Annual savings vs. electric resistance"
                  : "Annual savings vs. gas tank"}
              </div>
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

export default function WaterHeatersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="text-sm text-gray-500 mb-2">Products / Water Heaters</div>
        <h1 className="section-title">Water Heater Rankings</h1>
        <p className="section-subtitle">
          Ranked by UEF efficiency. Heat pump water heaters save $800+/yr vs. electric resistance at PEPCO rates.
        </p>
      </div>

      {/* Rebate Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "EmPOWER Heat Pump WH", amount: "$1,600", sub: "PEPCO rebate, no income req." },
          { label: "Electrify MC HPWH", amount: "$500", sub: "Montgomery County" },
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
        <h3 className="font-bold text-blue-900 mb-2">Understanding UEF (Uniform Energy Factor)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
          <div>
            <strong>Heat Pump Water Heaters (HPWH)</strong><br />
            <span className="text-blue-600">UEF 3.0–4.1 • ~$950/yr operating cost • Save $800+/yr vs electric</span>
          </div>
          <div>
            <strong>Electric Resistance</strong><br />
            <span className="text-blue-600">UEF 0.9–1.0 • ~$977/yr at PEPCO rates • Baseline for HPWH comparison</span>
          </div>
          <div>
            <strong>Gas Tankless</strong><br />
            <span className="text-blue-600">UEF 0.96–0.98 • ~$340/yr • 20-year lifespan but not electrifiable</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          Heat pump water heaters are ~4x more efficient than electric resistance. Tankless gas is a good fallback if staying on gas,
          but electrification creates a path off fossil fuels.
        </div>
      </div>

      {/* Economics Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-amber-800 mb-2">⚠️ Water heater economics at PEPCO rates</h3>
        <p className="text-sm text-amber-700 leading-relaxed">
          Heat pump water heaters save approximately <strong>$837/year vs. electric resistance</strong> at current PEPCO rates
          ($0.217/kWh). For a typical 50-gallon household (185 gal/day hot water), this equals a{" "}
          <strong>~3–4 year payback after rebates</strong>. After $1,600 EmPOWER rebate, net cost is $200–$900, making payback
          under 2 years. Gas tankless units save only $125–$150/year vs. gas tank heaters and lock in future vulnerability to
          Washington Gas rate increases (currently seeking $82.5M rate hike). <strong>Financial case for HPWH:</strong> (1) when
          replacing a failed electric resistance heater, (2) combined with solar to lower effective electric rate, or (3) as part
          of whole-home electrification strategy.
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WATER_HEATERS.map((product, i) => (
          <WaterHeaterCard key={product.id} product={product} rank={i + 1} />
        ))}
      </div>

      {/* Licensing Note */}
      <div className="mt-10 bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">Contractor requirements for water heater installation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900">MHIC License</strong><br />
            Maryland Home Improvement Commission — required for all residential contractors. Now requires $500,000 general
            liability insurance (up from $50K in June 2024).
          </div>
          <div>
            <strong className="text-gray-900">Plumber License</strong><br />
            Maryland HVACR Board license (Master or Journeyman tier) required separately for water heater installation. Most
            plumbers hold this.
          </div>
          <div>
            <strong className="text-gray-900">WSSC Water License (Montgomery County)</strong><br />
            Water Supply and Sewerage Commission license required in some Montgomery County jurisdictions for water heater work.
            Verify locally.
          </div>
        </div>
      </div>
    </div>
  );
}
