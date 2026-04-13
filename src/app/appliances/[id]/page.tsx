import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/lib/data/products";
import { getVendorsForProduct } from "@/lib/data/vendors";

export default async function ApplianceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = getProductById(id);
  if (!product) notFound();

  const vendorListings = getVendorsForProduct(id);
  const lowestPrice = vendorListings
    .map((l) => l.listing.price)
    .filter((p): p is number => p !== undefined)
    .sort((a, b) => a - b)[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/appliances"
        className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 mb-6"
      >
        ← Back to catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Product detail */}
        <div>
          <div className="mb-6">
            <div className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-1">
              {product.brand} · {product.model}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={product.tier} />
              {product.energyStarMostEfficient && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                  ⭐ EnergyStar Most Efficient
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <Stat
              label="Lowest Price"
              value={lowestPrice ? `$${lowestPrice.toLocaleString()}` : "Call"}
            />
            {product.annualSavingsVsBaseline ? (
              <Stat
                label="Annual Savings"
                value={`$${product.annualSavingsVsBaseline.toLocaleString()}`}
                accent="green"
              />
            ) : null}
            {product.lifespanYears ? (
              <Stat label="Lifespan" value={`${product.lifespanYears} yrs`} />
            ) : null}
            {product.paybackYears ? (
              <Stat label="Payback" value={`~${product.paybackYears} yr`} />
            ) : null}
          </div>

          {/* Highlights */}
          {product.highlights && product.highlights.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Highlights</h2>
              <ul className="space-y-2">
                {product.highlights.map((h: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-green-500 font-bold mt-0.5">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Caveats */}
          {product.caveats && product.caveats.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Things to Consider</h2>
              <ul className="space-y-2">
                {product.caveats.map((c: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                    <span className="text-amber-500 font-bold mt-0.5">!</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Specs */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-100 py-1.5">
                    <dt className="text-gray-500 capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </dt>
                    <dd className="font-medium text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Where to buy */}
        <aside>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sticky top-4">
            <h2 className="font-semibold text-gray-900 mb-4">Where to Buy</h2>

            {vendorListings.length === 0 ? (
              <div className="text-sm text-gray-500">
                Contact manufacturer for availability.{" "}
                <Link href="/vendors" className="text-brand-600 hover:text-brand-700">
                  Browse vendor directory
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {vendorListings.map(({ vendor, listing }) => (
                  <VendorCard key={vendor.id} vendor={vendor} listing={listing} />
                ))}
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-gray-100">
              <Link
                href="/contractors"
                className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold py-2 rounded-lg transition-colors"
              >
                Find a Contractor to Install
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green";
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-lg font-bold ${accent === "green" ? "text-green-700" : "text-gray-900"}`}>
        {value}
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    "most-efficient": { bg: "bg-emerald-100", text: "text-emerald-800", label: "Most Efficient" },
    best: { bg: "bg-blue-100", text: "text-blue-800", label: "Best" },
    better: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Better" },
    good: { bg: "bg-gray-100", text: "text-gray-700", label: "Good" },
  };
  const t = map[tier] || { bg: "bg-gray-100", text: "text-gray-700", label: tier };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.bg} ${t.text}`}>
      {t.label}
    </span>
  );
}

function VendorCard({ vendor, listing }: { vendor: any; listing: any }) {
  const stockLabel: Record<string, { bg: string; text: string; label: string }> = {
    "in-stock": { bg: "bg-green-100", text: "text-green-800", label: "In Stock" },
    "order-only": { bg: "bg-amber-100", text: "text-amber-800", label: "Order Only" },
    "out-of-stock": { bg: "bg-red-100", text: "text-red-800", label: "Out of Stock" },
    discontinued: { bg: "bg-gray-100", text: "text-gray-600", label: "Discontinued" },
  };
  const stock = stockLabel[listing.stockStatus] || stockLabel["order-only"];

  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {vendor.logoEmoji ? `${vendor.logoEmoji} ` : ""}
            {vendor.name}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {vendor.type.replace(/-/g, " ")}
          </div>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${stock.bg} ${stock.text}`}>
          {stock.label}
        </span>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div>
          {listing.price ? (
            <div className="font-bold text-gray-900">${listing.price.toLocaleString()}</div>
          ) : (
            <div className="text-sm font-medium text-gray-600">Contact for quote</div>
          )}
          {listing.priceNote && (
            <div className="text-xs text-gray-500 mt-0.5">{listing.priceNote}</div>
          )}
        </div>
        <a
          href={listing.url || vendor.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Visit →
        </a>
      </div>

      {listing.includesInstallation && (
        <div className="text-xs text-brand-600 mt-2 font-medium">
          ✓ Installation included
        </div>
      )}
    </div>
  );
}
