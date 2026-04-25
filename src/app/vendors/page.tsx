import { Suspense } from "react";
import { VendorsClient } from "./vendors-client";

export const metadata = {
  title: "Vendor Directory | GreenBroker",
  description:
    "Browse verified retailers and distributors of energy-efficient appliances in the Montgomery County, MD area.",
};

export default function VendorsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="section-title">Vendor Directory</h1>
        <p className="section-subtitle">
          Retailers, distributors, and manufacturers of energy-efficient
          appliances serving Montgomery County, MD. Vendors marked with a ✓ are
          GreenBroker-verified.
        </p>
      </div>

      <Suspense fallback={<div className="text-gray-500">Loading vendors...</div>}>
        <VendorsClient />
      </Suspense>
    </div>
  );
}
