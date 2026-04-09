import { z } from "zod";

export const AssessmentSchema = z.object({
  zip: z
    .string()
    .regex(/^\d{5}$/, "ZIP code must be 5 digits")
    .refine((zip) => zip === "20850" || zip.startsWith("208"), {
      message: "GreenBroker currently serves Montgomery County, MD (ZIP codes starting with 208)",
    }),
  squareFootage: z
    .number()
    .int()
    .min(200, "Square footage too small")
    .max(20000, "Square footage too large"),
  yearBuilt: z
    .number()
    .int()
    .min(1800, "Year too early")
    .max(new Date().getFullYear(), "Year cannot be in the future"),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20).optional(),

  primaryHeatingFuel: z.enum(["gas", "electric", "oil", "propane"]),
  currentHvacType: z.enum([
    "central-ac-gas-furnace",
    "heat-pump",
    "window-ac",
    "boiler",
    "mini-split",
    "other",
  ]),
  hvacAge: z.number().int().min(0).max(60).optional(),
  currentHvacSeer: z.number().min(6).max(30).optional(),
  currentFurnaceAfue: z.number().min(0.6).max(1.0).optional(),
  hasGas: z.boolean(),
  electricPanelAmps: z.number().int().refine((v) => [100, 150, 200, 400].includes(v)).optional(),

  roofOrientation: z.enum(["south", "east-west", "north", "flat"]).optional(),
  roofAge: z.number().int().min(0).max(50).optional(),
  atticRValue: z.number().min(0).max(100).optional(),

  annualKwh: z.number().int().min(0).max(100000).optional(),
  annualTherms: z.number().int().min(0).max(5000).optional(),

  householdIncome: z.number().int().min(0).max(10000000).optional(),
  amiBracket: z.enum(["below-80", "80-150", "above-150", "unknown"]).optional(),

  hasExistingSolar: z.boolean().default(false),
  hasEv: z.boolean().default(false),
  urgency: z.enum(["critical", "planning", "exploring"]).optional(),
  notes: z.string().max(2000).optional(),

  photoUrls: z.array(z.string().url()).max(10).optional().default([]),
  utilityBillUrls: z.array(z.string().url()).max(5).optional().default([]),
});

export type AssessmentInput = z.infer<typeof AssessmentSchema>;

export const AssessmentUpdateSchema = AssessmentSchema.partial();
export type AssessmentUpdateInput = z.infer<typeof AssessmentUpdateSchema>;
