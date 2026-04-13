import { Suspense } from "react";
import { AppliancesCatalogClient } from "./catalog-client";

export const metadata = {
  title: "Appliance Catalog | GreenBroker",
  description:
    "Browse energy-efficient appliances from verified vendors. Filter by category, efficiency, price, and ZIP code.",
};

export default function AppliancesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Energy-Efficient Appliance Catalog</h1>
        <p className="section-subtitle">
          Browse products from verified vendors across Montgomery County. See
          real pricing, stock status, and installation options before you buy.
        </p>
      </div>

      <Suspense fallback={<div className="text-gray-500">Loading catalog...</div>}>
        <AppliancesCatalogClient />
      </Suspense>
    </div>
  );
}
