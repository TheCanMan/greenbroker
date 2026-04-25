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

/**
 * Structured contractor service area. Mirrors `ServiceArea` in src/lib/geo/types.ts
 * but is duplicated here to keep the validation layer self-contained.
 */
const ServiceAreaSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("state"),
    stateCode: z.string().regex(/^[A-Z]{2}$/, "State code must be 2 uppercase letters"),
  }),
  z.object({
    kind: z.literal("counties"),
    countyIds: z
      .array(z.string().regex(/^[A-Z]{2}:[a-z0-9-]+$/, "Invalid county id (expected format: MD:montgomery)"))
      .min(1, "Pick at least one county")
      .max(40, "Too many counties — consider a state-wide or metro service area"),
  }),
  z.object({
    kind: z.literal("metro"),
    regionId: z.string().min(1, "Pick a metro region"),
  }),
]);

export const ContractorApplicationSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name too short")
    .max(200, "Business name too long"),
  categories: z
    .array(z.enum(VALID_CATEGORIES))
    .min(1, "Select at least one category")
    .max(8, "Too many categories"),

  /** Where this contractor will perform work — replaces serviceZips. */
  serviceArea: ServiceAreaSchema,

  /**
   * Optional list of utility territories the contractor is approved to work in.
   * Required to flag as MEA Participating for EmPOWER programs (utility-specific).
   */
  serviceUtilityIds: z.array(z.string().min(1)).max(10).optional().default([]),

  /** @deprecated — accepted only to import legacy data. New flows should use serviceArea. */
  serviceZips: z
    .array(z.string().regex(/^\d{5}$/))
    .max(50)
    .optional(),

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

  /**
   * Either filter by ZIP (legacy) or by resolved location (preferred). When
   * `countyId` is supplied, the API should match contractors whose service
   * area covers that county via `serviceAreaCovers()`.
   */
  zip: z.string().regex(/^\d{5}$/).optional(),
  countyId: z
    .string()
    .regex(/^[A-Z]{2}:[a-z0-9-]+$/)
    .optional(),
  utilityId: z.string().min(1).optional(),

  tier: z.enum(["VERIFIED", "PREFERRED", "ELITE"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ContractorQuery = z.infer<typeof ContractorQuerySchema>;
