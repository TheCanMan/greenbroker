import { z } from "zod";

export const residentialGoalSchema = z.enum([
  "lower_bills",
  "replace_broken_equipment",
  "improve_comfort",
  "electrify_home",
  "solar_or_battery",
  "compare_energy_supplier",
  "get_contractor_quotes",
  "improve_indoor_air_quality",
]);

export const residentialIntakeSnapshotSchema = z.object({
  assessmentId: z.string().optional(),
  address: z.string().nullable().optional(),
  zip: z.string().regex(/^\d{5}$/),
  city: z.string().nullable().optional(),
  county: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  electricUtilityId: z.string().nullable().optional(),
  gasUtilityId: z.string().nullable().optional(),
  homeType: z.string().nullable().optional(),
  ownershipStatus: z.string().nullable().optional(),
  yearBuilt: z.number().int().optional(),
  squareFeet: z.number().int().optional(),
  occupants: z.number().int().optional(),
  averageMonthlyBill: z.number().nullable().optional(),
  annualKwh: z.number().nullable().optional(),
  annualTherms: z.number().nullable().optional(),
  currentSupplierKnown: z.boolean().optional(),
  currentSupplierName: z.string().nullable().optional(),
  heatingType: z.string().nullable().optional(),
  coolingType: z.string().nullable().optional(),
  waterHeaterType: z.string().nullable().optional(),
  waterHeaterAge: z.number().nullable().optional(),
  hvacAge: z.number().nullable().optional(),
  hasSmartThermostat: z.boolean().optional(),
  insulationConcerns: z.string().nullable().optional(),
  windowCondition: z.string().nullable().optional(),
  roofAge: z.number().nullable().optional(),
  goals: z.array(residentialGoalSchema),
  householdSize: z.number().nullable().optional(),
  incomeRange: z.string().nullable().optional(),
  assistancePrograms: z.array(z.string()).optional(),
  submittedAt: z.string().optional(),
});

export const upgradeRecommendationSchema = z.object({
  upgradeType: z.string(),
  eligibleRebates: z.array(z.string()),
  projectCostRange: z.tuple([z.number(), z.number()]),
  estimatedNetCostRange: z.tuple([z.number(), z.number()]),
  estimatedAnnualSavingsRange: z.tuple([z.number(), z.number()]),
  paybackRange: z.tuple([z.number(), z.number()]),
  difficulty: z.enum(["easy", "medium", "complex"]),
  contractorRequired: z.boolean(),
  paperworkStatus: z.enum([
    "ready",
    "needs_contractor_quote",
    "needs_invoice",
    "needs_model_number",
    "needs_income_verification",
  ]),
  whyRecommended: z.string(),
  documentsNeeded: z.array(z.string()),
  contractorQuestions: z.array(z.string()),
});

export type ResidentialIntakeSnapshot = z.infer<typeof residentialIntakeSnapshotSchema>;
export type UpgradeRecommendation = z.infer<typeof upgradeRecommendationSchema>;

