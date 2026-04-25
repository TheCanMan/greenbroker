// ─────────────────────────────────────────────────────────────────────────────
// Sample residential energy supplier offers — Maryland, April 2026.
// MOCK DATA. Replace with a real PSC/MEA feed before going wider.
//
// Risk-scoring rules live in supplier-risk.ts and operate purely on this
// schema, so swapping in a live data source doesn't change the UI logic.
// ─────────────────────────────────────────────────────────────────────────────

export type Commodity = "electricity" | "gas";
export type RateType = "fixed" | "variable" | "intro_then_variable";

export interface SupplierOffer {
  id: string;
  supplierName: string;
  /** Maryland PSC license number. Required for legal residential supply. */
  licenseNumber: string;
  commodity: Commodity;
  /** Effective rate in $/kWh (electric) or $/therm (gas). */
  rate: number;
  rateType: RateType;
  /** Months of contract term. 0 = month-to-month. */
  termMonths: number;
  /** Monthly recurring fee on top of rate, in $. */
  monthlyFee: number;
  /** ETF in $ — 0 means none. */
  earlyTerminationFee: number;
  /** Renewable content as a percentage (0-100). */
  renewablePercent: number;
  /** Optional: introductory rate offered before reverting to variable. */
  introRate?: number;
  introMonths?: number;
  /** Display URL for the offer / supplier. */
  url?: string;
  /** Last verified date for the offer (ISO date). */
  lastVerified: string;
}

/**
 * Mock catalog of residential supplier offers serving Maryland today.
 * Hand-curated for plausibility; not actual published rates.
 */
export const SUPPLIER_OFFERS: SupplierOffer[] = [
  {
    id: "constellation-12mo-fixed",
    supplierName: "Constellation Energy",
    licenseNumber: "IR-639",
    commodity: "electricity",
    rate: 0.1099,
    rateType: "fixed",
    termMonths: 12,
    monthlyFee: 0,
    earlyTerminationFee: 150,
    renewablePercent: 0,
    url: "https://www.constellation.com",
    lastVerified: "2026-04-15",
  },
  {
    id: "cleansky-100-renewable-12",
    supplierName: "CleanSky Energy",
    licenseNumber: "IR-2967",
    commodity: "electricity",
    rate: 0.1245,
    rateType: "fixed",
    termMonths: 12,
    monthlyFee: 0,
    earlyTerminationFee: 100,
    renewablePercent: 100,
    url: "https://www.cleanskyenergy.com",
    lastVerified: "2026-04-15",
  },
  {
    id: "directenergy-24mo-fixed",
    supplierName: "Direct Energy",
    licenseNumber: "IR-437",
    commodity: "electricity",
    rate: 0.1185,
    rateType: "fixed",
    termMonths: 24,
    monthlyFee: 0,
    earlyTerminationFee: 200,
    renewablePercent: 0,
    url: "https://www.directenergy.com",
    lastVerified: "2026-04-15",
  },
  {
    id: "spark-intro-variable",
    supplierName: "Spark Energy",
    licenseNumber: "IR-1289",
    commodity: "electricity",
    rate: 0.1599, // post-intro variable rate
    rateType: "intro_then_variable",
    introRate: 0.0599,
    introMonths: 3,
    termMonths: 0,
    monthlyFee: 5.95,
    earlyTerminationFee: 0,
    renewablePercent: 0,
    url: "https://www.sparkenergy.com",
    lastVerified: "2026-04-15",
  },
  {
    id: "northamerican-month-to-month",
    supplierName: "North American Power",
    licenseNumber: "IR-1742",
    commodity: "electricity",
    rate: 0.142,
    rateType: "variable",
    termMonths: 0,
    monthlyFee: 0,
    earlyTerminationFee: 0,
    renewablePercent: 25,
    url: "https://www.napower.com",
    lastVerified: "2026-04-15",
  },
  {
    id: "inspire-renewable-monthly",
    supplierName: "Inspire Clean Energy",
    licenseNumber: "IR-2531",
    commodity: "electricity",
    rate: 0.139, // flat monthly fee model — rate slightly higher than utility
    rateType: "fixed",
    termMonths: 12,
    monthlyFee: 0,
    earlyTerminationFee: 0,
    renewablePercent: 100,
    url: "https://www.inspirecleanenergy.com",
    lastVerified: "2026-04-15",
  },
];

/** Default PEPCO standard-offer-service rate used as the "do nothing" baseline. */
export const PEPCO_STANDARD_OFFER_RATE = 0.1112; // $/kWh, generation only
