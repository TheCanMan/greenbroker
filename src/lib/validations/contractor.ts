import { z } from "zod";

const VALID_CATEGORIES = [
  "hvac",
  "solar-installer",
  "electrician",
  "insulation",
  "window",
  "roofing",
  "general-contractor",
  "energy-auditor",
  "plumber",
  "ev-charger",
  "home-performance",
  "hers-rater",
] as const;

const VALID_CERTIFICATIONS = [
  "BPI",
  "NABCEP",
  "EPA608",
  "EPA-LEAD-RRP",
  "RESNET-HERS",
  "ASHRAE",
  "Mitsubishi-Diamond",
  "Daikin-Comfort-Pro",
  "Carrier-Factory-Auth",
] as const;

export const ContractorApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name too short")
    .max(200, "Business name too long"),
  categories: z
    .array(z.enum(VALID_CATEGORIES))
    .min(1, "Select at least one category")
    .max(8, "Too many categories"),
  serviceZips: z
    .array(z.string().regex(/^\d{5}$/))
    .min(1, "Add at least one service ZIP code")
    .max(50, "Too many ZIP codes"),
  bio: z.string().max(1000).optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),

  // Licenses
  mhicLicense: z
    .string()
    .regex(/^[A-Z0-9-]+$/, "Invalid MHIC license format")
    .optional()
    .or(z.literal("")),
  hvacLicense: z.string().max(50).optional().or(z.literal("")),
  electricalLicense: z.string().max(50).optional().or(z.literal("")),
  plumbingLicense: z.string().max(50).optional().or(z.literal("")),
  wsscLicense: z.string().max(50).optional().or(z.literal("")),

  certifications: z.array(z.enum(VALID_CERTIFICATIONS)).default([]),
  meaParticipating: z.boolean().default(false),

  // Contact
  phone: z
    .string()
    .regex(/^\+?[\d\s\-().]{10,15}$/, "Invalid phone number")
    .optional(),
});

export type ContractorApplicationInput = z.infer<typeof ContractorApplicationSchema>;

export const ContractorUpdateSchema = ContractorApplicationSchema.partial();
export type ContractorUpdateInput = z.infer<typeof ContractorUpdateSchema>;

export const ContractorQuerySchema = z.object({
  category: z.enum(VALID_CATEGORIES).optional(),
  zip: z.string().regex(/^\d{5}$/).optional(),
  tier: z.enum(["VERIFIED", "PREFERRED", "ELITE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ContractorQuery = z.infer<typeof ContractorQuerySchema>;
