// ─────────────────────────────────────────────────────────────────────────────
// GreenBroker Vendor & Appliance Access Types
// A "vendor" is a retailer, distributor, or manufacturer selling energy-
// efficient products. Distinct from a "contractor" (who installs).
// ─────────────────────────────────────────────────────────────────────────────

import type { ProductCategory } from "./index";

export type VendorType =
  | "big-box"            // Home Depot, Lowe's, Best Buy
  | "specialty-retail"   // Ferguson, HVAC-Depot
  | "online"             // Amazon, SupplyHouse.com
  | "manufacturer"       // Direct from SunPower, Mitsubishi
  | "utility-program"    // PEPCO Marketplace, WSSC rebate partners
  | "local-distributor"  // Regional wholesale
  | "auction"            // Government surplus, refurb marketplaces
  | "cooperative";       // Group-buy programs, Solar Switch Together

export type StockStatus = "in-stock" | "order-only" | "out-of-stock" | "discontinued";

export interface Vendor {
  id: string;
  name: string;
  type: VendorType;
  website: string;
  phone?: string;

  // Location — for local vendors only
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  servicesZips?: string[];        // ZIPs this vendor delivers to (local)
  nationalShipping?: boolean;

  // Categories carried
  categories: ProductCategory[];

  // Trust signals
  verified: boolean;              // GreenBroker-verified
  energyStarPartner?: boolean;
  rebateProcessor?: boolean;      // Will file PEPCO/MEA rebates for buyer
  freeDelivery?: boolean;
  installationAvailable?: boolean; // Vendor can refer/arrange install
  meaApproved?: boolean;           // Approved for MEA rebate programs
  pepcoMarketplace?: boolean;      // On PEPCO Marketplace

  description: string;
  pros?: string[];
  cons?: string[];
  logoEmoji?: string;              // placeholder before real logos
}

export interface ProductVendor {
  productId: string;               // links to Product.id in products.ts
  vendorId: string;                // links to Vendor.id
  price?: number;                  // current listed price (undefined = "call for quote")
  priceNote?: string;              // e.g. "before $1,600 rebate"
  stockStatus: StockStatus;
  vendorSku?: string;
  url?: string;                    // deep link to product page at vendor
  lastUpdated: string;             // ISO date — when this price was verified
  includesInstallation?: boolean;
  localPickup?: boolean;
  notes?: string;
}

// ─── Search/Filter types ─────────────────────────────────────────────────────

export interface CatalogQuery {
  category?: ProductCategory;
  tier?: "good" | "better" | "best" | "most-efficient";
  energyStarOnly?: boolean;
  maxPrice?: number;
  brand?: string;
  zip?: string;                    // filter vendors by service ZIP
  sortBy?: "price-low" | "price-high" | "efficiency" | "savings" | "payback";
}

export interface VendorQuery {
  category?: ProductCategory;
  type?: VendorType;
  zip?: string;
  verifiedOnly?: boolean;
}
