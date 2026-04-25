import { BATTERIES } from "@/lib/data/products";
import { formatCurrency } from "@/lib/calculations/savings";
import type { BatteryProduct } from "@/lib/types";

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

function BatteryCard({ product, rank }: { product: BatteryProduct; rank: number }) {
  const costPerKwh = (product.installedCostMin || 0) / product.usableKwh;

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
          <div className="text-2xl font-bold text-brand-700">{product.usableKwh}</div>
          <div className="text-xs text-gray-400">kWh</div>
        </div>
      </div>

      {/* Key Specs */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Usable kWh", value: product.usableKwh, max: 15, color: "bg-blue-500" },
          { label: "Continuous kW", value: product.continuousKw, max: 12, color: "bg-green-500" },
          { label: "Warranty (yr)", value: product.warrantyYears, max: 15, color: "bg-brand-500" },
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
        {product.roundTripEfficiencyPct >= 90 && (
          <span className="badge-savings">High Efficiency</span>
        )}
        {product.warrantyYears >= 15 && (
          <span className="badge-rebate">Extended Warranty</span>
        )}
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
          {product.roundTripEfficiencyPct}% round-trip
        </span>
      </div>

      {/* Cost & Specs */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Installed cost</div>
            <div className="font-bold text-gray-900">
              {formatCurrency(product.installedCostMin!)}–{formatCurrency(product.installedCostMax!)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Cost per usable kWh</div>
            <div className="font-bold text-brand-600">{formatCurrency(costPerKwh)}/kWh</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs text-gray-500">Continuous power output</div>
            <div className="font-bold text-gray-900">{product.continuousKw} kW (~{(product.continuousKw * 1000).toFixed(0)} W)</div>
          </div>
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

export default function BatteryStoragePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="text-sm text-gray-500 mb-2">Products / Battery Storage</div>
        <h1 className="section-title">Battery Storage Rankings</h1>
        <p className="section-subtitle">
          Ranked by value. Pair with solar for backup power and time-of-use rate optimization.
        </p>
      </div>

      {/* Rebate Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {[
          { label: "RCES Battery Grant", amount: "30%", sub: "Up to $5,000 total" },
          { label: "MD Sales Tax Exemption", amount: "~$1,000", sub: "7% tax waived on battery + inverter" },
          { label: "Solar Pairing Synergy", amount: "$10,500", sub: "Combined MSAP + RCES + tax savings" },
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
        <h3 className="font-bold text-blue-900 mb-2">When to pair battery storage with solar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <strong>Time-of-Use (TOU) Optimization</strong><br />
            <span className="text-blue-600">
              Store cheap solar energy during peak production (10am–2pm) and discharge during evening peak (5pm–9pm) when
              PEPCO&apos;s TOU rates spike to $0.35/kWh+. Battery arbitrage can save $400–$800/year vs. selling excess solar at net
              meter rates.
            </span>
          </div>
          <div>
            <strong>Backup Power + Resilience</strong><br />
            <span className="text-blue-600">
              Lithium batteries provide 4–14 hours of backup during grid outages. Critical for heat pump homes (no heat in
              winter outage) or electric vehicle charging reliability. Consider paired with 8+ kWh capacity.
            </span>
          </div>
        </div>
        <div className="mt-3 text-xs text-blue-600">
          <strong>Note:</strong> Battery-only installs (without solar) rarely achieve positive ROI at current electricity prices.
          Pair with solar for maximum value.
        </div>
      </div>

      {/* Economics Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
        <h3 className="font-bold text-amber-800 mb-2">⚠️ Battery storage economics: Pair with solar</h3>
        <p className="text-sm text-amber-700 leading-relaxed">
          Standalone battery storage at current PEPCO rates (~$0.217/kWh blended) and 90% round-trip efficiency has a 15–20 year
          payback for arbitrage alone. <strong>Payback improves dramatically when paired with solar:</strong> (1) MSAP ($7,500
          income-qualified) + RCES battery grant ($5,000, 30% of cost) stacks to $12,500, reducing net cost from ~$15,000 to
          $2,500; (2) TOU arbitrage captures 3–4x more value when paired with 10+ kW solar; (3) grid outage resilience adds
          insurance value (unquantified but significant for heat pump homes). <strong>Best case for battery:</strong> Retrofit to
          existing solar system where TOU savings and resilience justify the incremental cost. Worst case: Standalone with no
          solar.
        </p>
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {BATTERIES.map((product, i) => (
          <BatteryCard key={product.id} product={product} rank={i + 1} />
        ))}
      </div>

      {/* Licensing Note */}
      <div className="mt-10 bg-gray-50 rounded-2xl p-6">
        <h3 className="font-bold text-gray-900 mb-2">Contractor requirements for battery storage installation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong className="text-gray-900">MHIC License</strong><br />
            Maryland Home Improvement Commission — required for all residential battery storage installs. Requires $500,000 general
            liability insurance.
          </div>
          <div>
            <strong className="text-gray-900">Electrical Contractor License</strong><br />
            Maryland Board of Electrical Examiners — Master or Journeyman license required for battery system interconnection to
            main panel and utility grid. Essential for safe high-voltage DC wiring.
          </div>
          <div>
            <strong className="text-gray-900">Utility Interconnection</strong><br />
            PEPCO requires pre-approval and interconnection agreement for any battery system. Contractor must file interconnection
            application and coordinate with utility; typical approval time is 4–6 weeks.
          </div>
        </div>
      </div>
    </div>
  );
}
