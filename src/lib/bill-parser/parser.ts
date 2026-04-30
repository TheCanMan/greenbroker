import type { UtilityBillExtraction } from "./schema";

export const BILL_PARSER_VERSION = "2026-04-30.v1";

type ParseOptions = {
  fileName?: string | null;
  fileUrl?: string | null;
};

function normalizeText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\r/g, "")
    .trim();
}

function clean(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

function money(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/[$,\s]/g, "").replace(/\u2212/g, "-"));
  return Number.isFinite(parsed) ? parsed : null;
}

function numberValue(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = Number(value.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function match(text: string, regex: RegExp): string | null {
  return clean(text.match(regex)?.[1]);
}

function moneyMatch(text: string, regex: RegExp): number | null {
  return money(text.match(regex)?.[1]);
}

function numberMatch(text: string, regex: RegExp): number | null {
  return numberValue(text.match(regex)?.[1]);
}

function parseDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value.replace(/-/g, " "));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function daysBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
  return Number.isFinite(days) && days > 0 ? days : null;
}

function annualize(value: number | null, days: number | null): number | null {
  if (!value || !days) return null;
  return Math.round((value * 365) / days);
}

function monthlyCost(cost: number | null, days: number | null): number | null {
  if (!cost || !days) return null;
  return Math.round((cost * 30.42) / days);
}

function extractAddress(text: string): {
  serviceAddress: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
} {
  const singleLine = text.match(/(?:Bill Service address|Service Address):?\s*([^\n]+?)(?:,\s*)?\n?\s*(ROCKVILLE|[A-Z][A-Z ]+),?\s*(MD|DC|VA)\s+(\d{5})(?:-\d{4})?/i);
  if (singleLine) {
    return {
      serviceAddress: clean(singleLine[1]?.replace(/,$/, "")),
      city: clean(singleLine[2]?.toUpperCase()),
      state: clean(singleLine[3]?.toUpperCase()),
      zip: clean(singleLine[4]),
    };
  }

  const pepco = text.match(/Service Address:\s*([^\n]+)\n\s*([A-Z][A-Z ]+)\s+(MD|DC|VA)\s+(\d{5})/i);
  return {
    serviceAddress: clean(pepco?.[1]),
    city: clean(pepco?.[2]?.toUpperCase()),
    state: clean(pepco?.[3]?.toUpperCase()),
    zip: clean(pepco?.[4]),
  };
}

function baseExtraction(
  text: string,
  options: ParseOptions,
): Omit<UtilityBillExtraction, "provider" | "utilityType" | "normalizedUtilityId" | "confidence"> {
  const address = extractAddress(text);
  return {
    parserVersion: BILL_PARSER_VERSION,
    fileName: options.fileName ?? null,
    fileUrl: options.fileUrl ?? null,
    rawText: text,
    warnings: [],
    accountNumber: match(text, /Account Number:?\s*([0-9 ]{6,})/i),
    customerName: match(text, /^([A-Z][A-Z .'-]+)\n(?:[A-Z][A-Z .'-]+\n)?Account Number/im),
    serviceAddress: address.serviceAddress,
    city: address.city,
    state: address.state,
    zip: address.zip,
    rateClass: null,
    meterNumber: null,
    billingPeriodStart: null,
    billingPeriodEnd: null,
    billIssueDate: null,
    dueDate: null,
    days: null,
    totalAmountDue: moneyMatch(text, /Total Amount Due by [^\n$]*\s+\$?([\d,.]+)/i) ?? moneyMatch(text, /Total to pay\s+\$?([\d,.]+)/i),
    currentCharges: null,
    deliveryCharges: moneyMatch(text, /Delivery\s+\$?([\d,.]+)/i),
    supplyCharges: moneyMatch(text, /Supply\s+\$?([\d,.]+)/i),
    totalKwh: null,
    totalTherms: null,
    billedCcf: null,
    demandKw: null,
    onPeakKwh: null,
    intermediatePeakKwh: null,
    offPeakKwh: null,
    priceToCompareCentsPerKwh: null,
    gasSupplyRatePerTherm: null,
    budgetBilling: /budget/i.test(text),
    supplierName: null,
    annualizedKwh: null,
    annualizedTherms: null,
    estimatedMonthlyCost: null,
  };
}

function confidenceScore(extraction: UtilityBillExtraction, required: Array<keyof UtilityBillExtraction>): number {
  const found = required.filter((key) => extraction[key] !== null && extraction[key] !== undefined).length;
  return Math.max(35, Math.round((found / required.length) * 100));
}

function parsePepco(text: string, options: ParseOptions): UtilityBillExtraction {
  const normalized = normalizeText(text);
  const base = baseExtraction(text, options);
  const period =
    text.match(/Billing Period:\s*([0-9-]+)\s+to\s+([0-9-]+)/i) ??
    text.match(/([A-Z][a-z]{2,}\s+\d{1,2},\s+\d{4})\s+to\s+([A-Z][a-z]{2,}\s+\d{1,2},\s+\d{4})/);
  const start = parseDate(period?.[1] ?? null);
  const end = parseDate(period?.[2] ?? null);
  const days =
    numberMatch(text, /Use \(kWh\)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+(\d{1,3})\s+[\d,.]+/i) ??
    daysBetween(start, end);
  const totalKwh =
    numberMatch(text, /Total use-kWh\s+([\d,.]+)/i) ??
    numberMatch(text, /Use \(kWh\)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{1,3}\s+([\d,.]+)/i);
  const currentCharges =
    moneyMatch(text, /New electric charges\s+\$?([\d,.]+)/i) ??
    moneyMatch(text, /Total Electric Charges\s+-\s+[^0-9$]+?\s+\$?([\d,.]+)/i);

  const extraction: UtilityBillExtraction = {
    ...base,
    provider: "pepco",
    utilityType: "electric",
    normalizedUtilityId: "pepco-md",
    rateClass: match(text, /Details of your Electric Charges\s*\n?([^\n]+?)\s+-\s+service number/i),
    meterNumber: match(text, /Meter\s+Number[\s\S]{0,80}?([A-Z0-9]{6,})\s+Use \(kWh\)/i),
    billingPeriodStart: start,
    billingPeriodEnd: end,
    billIssueDate: parseDate(match(text, /Bill Issue Date:\s*([0-9-]+)/i)),
    dueDate: parseDate(match(text, /Total Amount Due by\s+([A-Z][a-z]{2,}\s+\d{1,2},\s+\d{4})/i)),
    days,
    currentCharges,
    totalKwh,
    demandKw: numberMatch(text, /Maximum Demand\s+([\d.]+)\s+kW/i) ?? numberMatch(text, /On-Peak Demand\s+\(kW\)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{1,3}\s+([\d.]+)/i),
    onPeakKwh: numberMatch(text, /On-Peak Use \(kWh\)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{1,3}\s+([\d,.]+)/i),
    intermediatePeakKwh: numberMatch(text, /Int-Peak Use \(kWh\)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{1,3}\s+([\d,.]+)/i),
    offPeakKwh: numberMatch(text, /Off-Peak Use \(kWh\)\s+[A-Z][a-z]{2}\s+\d{1,2}\s+[A-Z][a-z]{2}\s+\d{1,2}\s+\d{1,3}\s+([\d,.]+)/i),
    priceToCompareCentsPerKwh: numberMatch(text, /Price to Compare is\s+([\d.]+)\s+cents/i),
    supplierName: /supplied and distributed by\s+Pepco/i.test(text) ? "Pepco" : null,
    annualizedKwh: annualize(totalKwh, days),
    estimatedMonthlyCost: monthlyCost(currentCharges ?? base.totalAmountDue, days),
    confidence: 0,
  };

  extraction.confidence = confidenceScore(extraction, [
    "accountNumber",
    "serviceAddress",
    "zip",
    "billingPeriodStart",
    "billingPeriodEnd",
    "totalKwh",
    "currentCharges",
    "rateClass",
  ]);
  if (!/Residential Service/i.test(normalized) && /Non-Residential/i.test(normalized)) {
    extraction.warnings.push("This appears to be a commercial electric bill.");
  }
  return extraction;
}

function parseWashingtonGas(text: string, options: ParseOptions): UtilityBillExtraction {
  const base = baseExtraction(text, options);
  const period = text.match(/Invoice Period:\s*([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})-([A-Z][a-z]{2}\s+\d{1,2},\s+\d{4})/i);
  const start = parseDate(period?.[1] ?? null);
  const end = parseDate(period?.[2] ?? null);
  const days = numberMatch(text, /Invoice Period:[^\n(]+\((\d+)\s+days\)/i) ?? daysBetween(start, end);
  const therms = numberMatch(text, /Total Therms\(TH\) used for \d+ days\s+\(Total CCFx[\d.]+\)\s+([\d,.]+)/i);
  const currentCharges = moneyMatch(text, /Total Current Washington Gas Charges\s+\$?([\d,.]+)/i) ?? moneyMatch(text, /Total Charges This Period\s+\$?([\d,.]+)/i);

  const extraction: UtilityBillExtraction = {
    ...base,
    provider: "washington_gas",
    utilityType: "gas",
    normalizedUtilityId: "washington-gas-md",
    accountNumber: match(text, /Account Number:?\s*([0-9]{8,})/i),
    rateClass: match(text, /Rate Class:\s*([A-Za-z ]+?)(?:\s+Next Read Date|\s+Meter Number)/i),
    meterNumber: match(text, /Rate Class:[\s\S]{0,120}?Meter Number[\s\S]{0,80}?([A-Z0-9]{4,})\s+\d/i),
    billingPeriodStart: start,
    billingPeriodEnd: end,
    billIssueDate: parseDate(match(text, /Invoice Date:\s*([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i)),
    dueDate: parseDate(match(text, /Please pay \$?[\d,.]+ by\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})/i) ?? match(text, /Due date\s+([A-Z][a-z]+\s+\d{2},\s+\d{4})/i)),
    days,
    totalAmountDue: moneyMatch(text, /Please pay \$?([\d,.]+) by/i) ?? base.totalAmountDue,
    currentCharges,
    billedCcf: numberMatch(text, /Total CCF\s+([\d,.]+)/i),
    totalTherms: therms,
    gasSupplyRatePerTherm: numberMatch(text, /PGC\s+[\d,.]+\s+TH\s+x\s+\.?([\d.]+)/i),
    supplierName: match(text, /Your gas is supplied and distributed by\s*\n?([^\n.]+)/i) ?? "Washington Gas",
    annualizedTherms: annualize(therms, days),
    estimatedMonthlyCost: monthlyCost(currentCharges ?? base.totalAmountDue, days),
    confidence: 0,
  };

  extraction.confidence = confidenceScore(extraction, [
    "accountNumber",
    "serviceAddress",
    "zip",
    "billingPeriodStart",
    "billingPeriodEnd",
    "totalTherms",
    "currentCharges",
    "rateClass",
  ]);
  return extraction;
}

function parseUnknown(text: string, options: ParseOptions): UtilityBillExtraction {
  const base = baseExtraction(text, options);
  return {
    ...base,
    provider: "unknown",
    utilityType: "unknown",
    normalizedUtilityId: null,
    confidence: confidenceScore({ ...base, provider: "unknown", utilityType: "unknown", normalizedUtilityId: null, confidence: 0 } as UtilityBillExtraction, [
      "accountNumber",
      "serviceAddress",
      "zip",
      "totalAmountDue",
    ]),
    warnings: ["We could not identify this utility bill format. Review all fields manually."],
  };
}

export function parseUtilityBillText(rawText: string, options: ParseOptions = {}): UtilityBillExtraction {
  const text = normalizeText(rawText);
  if (/Washington Gas/i.test(text)) return parseWashingtonGas(text, options);
  if (/Pepco/i.test(text) || /Electric Bill Summary/i.test(text)) return parsePepco(text, options);
  return parseUnknown(text, options);
}
