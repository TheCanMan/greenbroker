// ─────────────────────────────────────────────────────────────────────────────
// GreenBroker Vendor Directory
// Retailers, distributors, and manufacturers selling energy-efficient
// appliances and technologies. Local-first for Rockville, MD (20850).
// ─────────────────────────────────────────────────────────────────────────────

import type { Vendor, ProductVendor } from "@/lib/types/vendor";

// Rockville, MD area ZIPs — used as default "local" service area
const ROCKVILLE_ZIPS = [
  "20850", "20851", "20852", "20853", "20854", "20855", "20857", "20859",
  "20877", "20878", "20879", "20882", "20886", // Gaithersburg / Rockville vicinity
  "20814", "20815", "20816", "20817", // Bethesda
];

// ─── National Big-Box Retailers ──────────────────────────────────────────────

export const VENDORS: Vendor[] = [
  {
    id: "vendor-home-depot-rockville",
    name: "The Home Depot — Rockville",
    type: "big-box",
    website: "https://www.homedepot.com",
    phone: "(301) 468-6000",
    address: "15740 Shady Grove Rd",
    city: "Rockville",
    state: "MD",
    zip: "20850",
    servicesZips: ROCKVILLE_ZIPS,
    nationalShipping: true,
    categories: [
      "water-heater", "smart-thermostat", "refrigerator", "washer", "dryer",
      "dishwasher", "window", "insulation", "ev-charger",
    ],
    verified: true,
    energyStarPartner: true,
    rebateProcessor: false,
    freeDelivery: true,
    installationAvailable: true,
    description:
      "Full-service big-box retailer with local showroom. Carries most EnergyStar-rated appliances with same/next-day pickup and delivery options.",
    pros: [
      "Largest local inventory — see models in-person",
      "Free delivery on most appliances over $396",
      "Pro Xtra rewards for contractors",
    ],
    cons: [
      "Does not file utility rebates on your behalf",
      "Installation through 3rd-party contractor network (quality varies)",
    ],
    logoEmoji: "🏠",
  },
  {
    id: "vendor-lowes-rockville",
    name: "Lowe's — Rockville",
    type: "big-box",
    website: "https://www.lowes.com",
    phone: "(301) 519-3100",
    address: "12275 Rockville Pike",
    city: "Rockville",
    state: "MD",
    zip: "20852",
    servicesZips: ROCKVILLE_ZIPS,
    nationalShipping: true,
    categories: [
      "water-heater", "smart-thermostat", "refrigerator", "washer", "dryer",
      "dishwasher", "window", "insulation", "ev-charger",
    ],
    verified: true,
    energyStarPartner: true,
    freeDelivery: true,
    installationAvailable: true,
    description:
      "National big-box retailer with appliance showroom and installation services. Frequent EnergyStar appliance promotions.",
    pros: ["Price matching available", "10% military discount"],
    cons: ["Limited heat pump water heater selection in-store"],
    logoEmoji: "🏪",
  },
  {
    id: "vendor-best-buy-rockville",
    name: "Best Buy — Rockville",
    type: "big-box",
    website: "https://www.bestbuy.com",
    address: "1701 Rockville Pike",
    city: "Rockville",
    state: "MD",
    zip: "20852",
    servicesZips: ROCKVILLE_ZIPS,
    nationalShipping: true,
    categories: ["smart-thermostat", "refrigerator", "washer", "dryer", "dishwasher"],
    verified: true,
    energyStarPartner: true,
    freeDelivery: true,
    installationAvailable: true,
    description: "Electronics and appliance retailer. Strong selection of smart thermostats and smart appliances.",
    logoEmoji: "🛒",
  },

  // ─── Specialty HVAC/Plumbing Distributors ────────────────────────────────
  {
    id: "vendor-ferguson-gaithersburg",
    name: "Ferguson — Gaithersburg",
    type: "specialty-retail",
    website: "https://www.ferguson.com",
    phone: "(301) 948-1100",
    address: "7825 Airpark Rd",
    city: "Gaithersburg",
    state: "MD",
    zip: "20879",
    servicesZips: ROCKVILLE_ZIPS,
    categories: ["water-heater", "heat-pump", "central-ac", "furnace"],
    verified: true,
    description:
      "Leading HVAC and plumbing distributor. Contractor-focused but homeowner purchases welcome. Stocks Rheem ProTerra, A.O. Smith Voltex, Bradford White.",
    pros: [
      "Counter service for quick pickup",
      "Trade pricing available with contractor account",
      "Knowledgeable staff on commercial-grade equipment",
    ],
    cons: ["Not designed for retail browsing — call ahead"],
    logoEmoji: "🔧",
  },
  {
    id: "vendor-hvac-direct",
    name: "HVACDirect.com",
    type: "online",
    website: "https://hvacdirect.com",
    phone: "(877) 782-5842",
    nationalShipping: true,
    categories: ["heat-pump", "central-ac", "furnace", "water-heater"],
    verified: true,
    description:
      "Online wholesale HVAC marketplace. Sells factory-fresh systems (Carrier, Daikin, Mitsubishi mini-splits) direct to consumers at contractor pricing.",
    pros: [
      "30–40% below typical contractor-quoted prices",
      "Free shipping on orders over $199",
      "Direct ship from manufacturer warehouses",
    ],
    cons: [
      "You must find your own licensed installer (required for warranty)",
      "No returns on special-order HVAC equipment",
    ],
    logoEmoji: "🌐",
  },

  // ─── Solar & Battery — Manufacturer Direct + Installer Networks ──────────
  {
    id: "vendor-sunpower",
    name: "SunPower (Direct)",
    type: "manufacturer",
    website: "https://us.sunpower.com",
    nationalShipping: false,
    categories: ["solar-panel", "battery-storage"],
    verified: true,
    installationAvailable: true,
    description:
      "Premium residential solar manufacturer. Sold exclusively through certified dealer network — not available as DIY components.",
    pros: ["40-year warranty on Maxeon panels", "Complete system integration"],
    cons: [
      "Not available to purchase panels alone",
      "SunPower filed bankruptcy in 2024 — verify dealer warranty backstop",
    ],
    logoEmoji: "☀️",
  },
  {
    id: "vendor-tesla-energy",
    name: "Tesla Energy",
    type: "manufacturer",
    website: "https://www.tesla.com/energy",
    nationalShipping: false,
    categories: ["solar-panel", "battery-storage", "ev-charger"],
    verified: true,
    installationAvailable: true,
    description:
      "Direct-to-consumer sales of Powerwall, Solar Roof, and Wall Connector. Quote and installation arranged through Tesla's certified installer network.",
    pros: [
      "Integrated ecosystem (solar + Powerwall + EV)",
      "Transparent, fixed national pricing",
      "Tesla app for system monitoring",
    ],
    cons: ["Install lead times 2–4 months in DMV market"],
    logoEmoji: "⚡",
  },
  {
    id: "vendor-enphase",
    name: "Enphase Store",
    type: "manufacturer",
    website: "https://enphase.com",
    nationalShipping: true,
    categories: ["solar-panel", "battery-storage"],
    verified: true,
    description:
      "Microinverter and IQ Battery manufacturer. Sold through certified installer network. 15-year warranty on IQ Battery 10C (longest in industry).",
    logoEmoji: "🔋",
  },

  // ─── Online Specialty ───────────────────────────────────────────────────
  {
    id: "vendor-supplyhouse",
    name: "SupplyHouse.com",
    type: "online",
    website: "https://www.supplyhouse.com",
    nationalShipping: true,
    categories: ["water-heater", "smart-thermostat", "heat-pump"],
    verified: true,
    freeDelivery: true,
    description:
      "Online plumbing and HVAC marketplace. Strong selection of heat pump water heaters, tankless units, and smart thermostats.",
    pros: ["Free shipping over $99", "Same-day shipping on in-stock items"],
    cons: ["Returns on water heaters require original packaging"],
    logoEmoji: "📦",
  },
  {
    id: "vendor-amazon",
    name: "Amazon",
    type: "online",
    website: "https://www.amazon.com",
    nationalShipping: true,
    categories: ["smart-thermostat", "ev-charger", "refrigerator", "washer", "dryer"],
    verified: true,
    freeDelivery: true,
    description: "General online marketplace with strong smart home inventory. Beware of third-party sellers on high-ticket appliances.",
    pros: ["Prime delivery on smart thermostats", "Easy returns on small appliances"],
    cons: ["Third-party sellers may void manufacturer warranty"],
    logoEmoji: "📮",
  },

  // ─── Utility & Program Partners ──────────────────────────────────────────
  {
    id: "vendor-pepco-marketplace",
    name: "PEPCO Marketplace",
    type: "utility-program",
    website: "https://marketplace.pepco.com",
    nationalShipping: false,
    servicesZips: ROCKVILLE_ZIPS,
    categories: ["smart-thermostat", "water-heater", "heat-pump"],
    verified: true,
    rebateProcessor: true,
    description:
      "PEPCO's in-house marketplace for EmPOWER-qualified products. Rebates are applied instantly at checkout — no paperwork required.",
    pros: [
      "Instant rebate (no paperwork)",
      "EnergyStar-certified inventory only",
      "Includes $100 thermostat rebate",
    ],
    cons: ["Limited product selection vs. general retail"],
    logoEmoji: "🏛️",
  },
  {
    id: "vendor-mea-approved-network",
    name: "MEA Participating Contractor Network",
    type: "utility-program",
    website: "https://energy.maryland.gov",
    servicesZips: ROCKVILLE_ZIPS,
    categories: ["heat-pump", "solar-panel", "battery-storage", "insulation", "water-heater"],
    verified: true,
    rebateProcessor: true,
    meaApproved: true,
    installationAvailable: true,
    description:
      "Network of Maryland Energy Administration-approved contractors. Required channel for MEA rebate programs (MSAP solar, RCES battery, etc.).",
    pros: [
      "Contractors file rebates on your behalf",
      "Verified licensing and insurance",
    ],
    logoEmoji: "🏛️",
  },
  {
    id: "vendor-solar-switch-together",
    name: "Solar Switch Together (Group Buy)",
    type: "cooperative",
    website: "https://www.switchtogether.com",
    servicesZips: ROCKVILLE_ZIPS,
    categories: ["solar-panel", "battery-storage"],
    verified: true,
    installationAvailable: true,
    description:
      "Group-buy solar program organized by Montgomery County and neighboring jurisdictions. Discounts of 10–20% below retail through pooled demand.",
    pros: [
      "10–20% discount vs. retail solar",
      "Vetted installer selected via competitive RFP",
      "Community-backed — less risk of fly-by-night installers",
    ],
    cons: [
      "Enrollment windows are limited (typically 1–2 per year)",
      "Equipment choice is fixed by program RFP",
    ],
    logoEmoji: "🤝",
  },
];

// ─── Product → Vendor Availability Map ───────────────────────────────────────
// Price ranges reflect typical April 2026 pricing and are refreshed quarterly.

export const PRODUCT_VENDORS: ProductVendor[] = [
  // ─── Rheem ProTerra Heat Pump Water Heater ───────────────────────────────
  {
    productId: "wh-rheem-proterra",
    vendorId: "vendor-home-depot-rockville",
    price: 1899,
    priceNote: "before $1,600 EmPOWER rebate",
    stockStatus: "in-stock",
    url: "https://www.homedepot.com/p/Rheem-ProTerra-50-Gal",
    lastUpdated: "2026-04-01",
    localPickup: true,
  },
  {
    productId: "wh-rheem-proterra",
    vendorId: "vendor-supplyhouse",
    price: 1749,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "wh-rheem-proterra",
    vendorId: "vendor-pepco-marketplace",
    price: 299,
    priceNote: "after $1,600 instant EmPOWER rebate (installation sold separately)",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-05",
    includesInstallation: false,
  },
  {
    productId: "wh-rheem-proterra",
    vendorId: "vendor-ferguson-gaithersburg",
    price: 1650,
    priceNote: "contractor pricing with account",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    localPickup: true,
  },

  // ─── A.O. Smith Voltex MAX ───────────────────────────────────────────────
  {
    productId: "wh-aosmith-voltex",
    vendorId: "vendor-home-depot-rockville",
    price: 1799,
    stockStatus: "order-only",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "wh-aosmith-voltex",
    vendorId: "vendor-lowes-rockville",
    price: 1749,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "wh-aosmith-voltex",
    vendorId: "vendor-ferguson-gaithersburg",
    price: 1550,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    localPickup: true,
  },

  // ─── Bradford White AeroTherm ────────────────────────────────────────────
  {
    productId: "wh-bradford-white-aerotherm",
    vendorId: "vendor-ferguson-gaithersburg",
    price: 1450,
    priceNote: "Bradford White sold through plumbers only",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },

  // ─── Rinnai Tankless ─────────────────────────────────────────────────────
  {
    productId: "wh-rinnai-rx199",
    vendorId: "vendor-home-depot-rockville",
    price: 1699,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "wh-rinnai-rx199",
    vendorId: "vendor-supplyhouse",
    price: 1625,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },

  // ─── Heat Pumps ──────────────────────────────────────────────────────────
  {
    productId: "hp-lennox-sl25xpv",
    vendorId: "vendor-hvac-direct",
    price: 6800,
    priceNote: "equipment only; installation by licensed contractor required",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "hp-carrier-infinity-24",
    vendorId: "vendor-hvac-direct",
    price: 6400,
    priceNote: "equipment only",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "hp-mitsubishi-hh2i",
    vendorId: "vendor-hvac-direct",
    price: 3600,
    priceNote: "single-zone equipment; full install $4,000–$8,000",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "hp-mitsubishi-hh2i",
    vendorId: "vendor-mea-approved-network",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
    priceNote: "installed with MEA-approved contractor, rebates filed",
  },

  // ─── Solar Panels ────────────────────────────────────────────────────────
  {
    productId: "sol-sunpower-maxeon7",
    vendorId: "vendor-sunpower",
    priceNote: "$3.35/W installed — call for quote",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },
  {
    productId: "sol-sunpower-maxeon7",
    vendorId: "vendor-solar-switch-together",
    priceNote: "10–20% below retail through group buy",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },
  {
    productId: "sol-longi-himo6",
    vendorId: "vendor-mea-approved-network",
    priceNote: "$2.75–$3.15/W installed",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },
  {
    productId: "sol-longi-himo6",
    vendorId: "vendor-solar-switch-together",
    priceNote: "Group-buy pricing — check current round",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },
  {
    productId: "sol-canadian-tophiku6",
    vendorId: "vendor-mea-approved-network",
    priceNote: "~$2.96/W installed",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },

  // ─── Batteries ───────────────────────────────────────────────────────────
  {
    productId: "bat-tesla-pw3",
    vendorId: "vendor-tesla-energy",
    price: 15400,
    priceNote: "installed — before $5,000 MD RCES grant",
    stockStatus: "order-only",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },
  {
    productId: "bat-enphase-iq10c",
    vendorId: "vendor-enphase",
    price: 13000,
    priceNote: "through Enphase certified installer",
    stockStatus: "order-only",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },
  {
    productId: "bat-enphase-iq10c",
    vendorId: "vendor-mea-approved-network",
    priceNote: "$13,000–$15,000 installed",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    includesInstallation: true,
  },

  // ─── Smart Thermostats ───────────────────────────────────────────────────
  {
    productId: "therm-ecobee-premium",
    vendorId: "vendor-pepco-marketplace",
    price: 149,
    priceNote: "after $100 instant EmPOWER rebate",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-05",
  },
  {
    productId: "therm-ecobee-premium",
    vendorId: "vendor-amazon",
    price: 249,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "therm-ecobee-premium",
    vendorId: "vendor-best-buy-rockville",
    price: 249,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "therm-ecobee-premium",
    vendorId: "vendor-home-depot-rockville",
    price: 249,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    localPickup: true,
  },
  {
    productId: "therm-google-nest-4",
    vendorId: "vendor-pepco-marketplace",
    price: 179,
    priceNote: "after $100 EmPOWER rebate",
    stockStatus: "in-stock",
    lastUpdated: "2026-04-05",
  },
  {
    productId: "therm-google-nest-4",
    vendorId: "vendor-amazon",
    price: 279,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "therm-google-nest-4",
    vendorId: "vendor-best-buy-rockville",
    price: 279,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },

  // ─── Refrigerators ───────────────────────────────────────────────────────
  {
    productId: "ref-samsung-rf30bb",
    vendorId: "vendor-home-depot-rockville",
    price: 1999,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
    localPickup: false,
  },
  {
    productId: "ref-samsung-rf30bb",
    vendorId: "vendor-lowes-rockville",
    price: 1949,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "ref-samsung-rf30bb",
    vendorId: "vendor-best-buy-rockville",
    price: 1899,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "ref-lg-lrtls2403",
    vendorId: "vendor-home-depot-rockville",
    price: 849,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "ref-lg-lrtls2403",
    vendorId: "vendor-lowes-rockville",
    price: 799,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },

  // ─── Heat Pump Dryers ────────────────────────────────────────────────────
  {
    productId: "dry-blomberg-dhp24",
    vendorId: "vendor-home-depot-rockville",
    price: 1499,
    priceNote: "before $250 Electrify MC rebate",
    stockStatus: "order-only",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "dry-beko-hpd24414w",
    vendorId: "vendor-amazon",
    price: 1449,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },

  // ─── Pool Pumps ──────────────────────────────────────────────────────────
  {
    productId: "pool-pentair-intelliflo",
    vendorId: "vendor-home-depot-rockville",
    price: 2199,
    stockStatus: "order-only",
    lastUpdated: "2026-04-01",
  },
  {
    productId: "pool-pentair-intelliflo",
    vendorId: "vendor-amazon",
    price: 2099,
    stockStatus: "in-stock",
    lastUpdated: "2026-04-01",
  },
];

// ─── Helper functions ────────────────────────────────────────────────────────

export function getVendorById(id: string): Vendor | undefined {
  return VENDORS.find((v) => v.id === id);
}

export function getVendorsForProduct(productId: string): Array<{
  vendor: Vendor;
  listing: ProductVendor;
}> {
  return PRODUCT_VENDORS
    .filter((pv) => pv.productId === productId)
    .map((listing) => {
      const vendor = getVendorById(listing.vendorId);
      return vendor ? { vendor, listing } : null;
    })
    .filter((x): x is { vendor: Vendor; listing: ProductVendor } => x !== null)
    .sort((a, b) => {
      // Sort: in-stock first, then by price
      const stockOrder = { "in-stock": 0, "order-only": 1, "out-of-stock": 2, discontinued: 3 };
      const stockDiff = stockOrder[a.listing.stockStatus] - stockOrder[b.listing.stockStatus];
      if (stockDiff !== 0) return stockDiff;
      return (a.listing.price ?? Infinity) - (b.listing.price ?? Infinity);
    });
}

export function getLowestPriceForProduct(productId: string): number | null {
  const listings = PRODUCT_VENDORS.filter(
    (pv) => pv.productId === productId && pv.price !== undefined && pv.stockStatus !== "discontinued"
  );
  if (listings.length === 0) return null;
  return Math.min(...listings.map((l) => l.price!));
}

export function getVendorsByCategory(category: string): Vendor[] {
  return VENDORS.filter((v) => v.categories.includes(category as any));
}

export function getVendorsByZip(zip: string): Vendor[] {
  return VENDORS.filter(
    (v) => v.nationalShipping || (v.servicesZips && v.servicesZips.includes(zip))
  );
}

export function getVendorsByType(type: string): Vendor[] {
  return VENDORS.filter((v) => v.type === type);
}

export function searchVendors(query: {
  category?: string;
  type?: string;
  zip?: string;
  verifiedOnly?: boolean;
}): Vendor[] {
  return VENDORS.filter((v) => {
    if (query.category && !v.categories.includes(query.category as any)) return false;
    if (query.type && v.type !== query.type) return false;
    if (query.zip && !v.nationalShipping && !(v.servicesZips?.includes(query.zip))) return false;
    if (query.verifiedOnly && !v.verified) return false;
    return true;
  });
}
