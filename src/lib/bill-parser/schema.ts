import { z } from "zod";

export const billProviderSchema = z.enum([
  "pepco",
  "washington_gas",
  "unknown",
]);

export const utilityBillExtractionSchema = z.object({
  parserVersion: z.string(),
  provider: billProviderSchema,
  utilityType: z.enum(["electric", "gas", "unknown"]),
  normalizedUtilityId: z.string().nullable(),
  fileName: z.string().nullable().optional(),
  fileUrl: z.string().url().nullable().optional(),
  rawText: z.string().optional(),
  confidence: z.number().min(0).max(100),
  warnings: z.array(z.string()).default([]),
  accountNumber: z.string().nullable(),
  customerName: z.string().nullable(),
  serviceAddress: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zip: z.string().nullable(),
  rateClass: z.string().nullable(),
  meterNumber: z.string().nullable(),
  billingPeriodStart: z.string().nullable(),
  billingPeriodEnd: z.string().nullable(),
  billIssueDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  days: z.number().nullable(),
  totalAmountDue: z.number().nullable(),
  currentCharges: z.number().nullable(),
  deliveryCharges: z.number().nullable(),
  supplyCharges: z.number().nullable(),
  totalKwh: z.number().nullable(),
  totalTherms: z.number().nullable(),
  billedCcf: z.number().nullable(),
  demandKw: z.number().nullable(),
  onPeakKwh: z.number().nullable(),
  intermediatePeakKwh: z.number().nullable(),
  offPeakKwh: z.number().nullable(),
  priceToCompareCentsPerKwh: z.number().nullable(),
  gasSupplyRatePerTherm: z.number().nullable(),
  budgetBilling: z.boolean(),
  supplierName: z.string().nullable(),
  annualizedKwh: z.number().nullable(),
  annualizedTherms: z.number().nullable(),
  estimatedMonthlyCost: z.number().nullable(),
});

export type BillProvider = z.infer<typeof billProviderSchema>;
export type UtilityBillExtraction = z.infer<typeof utilityBillExtractionSchema>;
