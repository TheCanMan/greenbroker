/**
 * prisma/seed.ts
 *
 * Populates the database with:
 *  - Sample contractor accounts
 *  - Sample homeowner profile with a completed assessment
 *
 * Run: npx prisma db seed
 */

import {
  PrismaClient,
  Role,
  ContractorStatus,
  ContractorTier,
  SubscriptionTier,
} from "@prisma/client";

const prisma = new PrismaClient();

const SEED_CONTRACTORS: Array<{
  businessName: string;
  email: string;
  phone: string;
  website: string | null;
  bio: string;
  categories: string[];
  serviceZips: string[];
  certifications: string[];
  insuranceVerified: boolean;
  backgroundCheckPassed: boolean;
  meaParticipating: boolean;
  tier: ContractorTier;
  status: ContractorStatus;
  rating: number;
  reviewCount: number;
  completedProjects: number;
  leadCredits: number;
  subscriptionTier: SubscriptionTier | null;
  mhicLicense?: string;
  hvacLicense?: string;
  electricalLicense?: string;
  plumbingLicense?: string;
  wsscLicense?: string;
}> = [
  {
    businessName: "Capital Green HVAC",
    email: "info@capitalgreenhvac.example",
    phone: "+13015550101",
    website: "https://capitalgreenhvac.example",
    bio: "Montgomery County heat pump installer focused on Mitsubishi and Carrier systems with a strong Rockville retrofit track record.",
    categories: ["heat-pump-hvac", "ductless-mini-split", "hvac-maintenance"],
    serviceZips: ["20850", "20852", "20854", "20878"],
    certifications: ["EPA608", "BPI"],
    insuranceVerified: true,
    backgroundCheckPassed: true,
    meaParticipating: true,
    tier: ContractorTier.PREFERRED,
    status: ContractorStatus.ACTIVE,
    rating: 4.8,
    reviewCount: 127,
    completedProjects: 412,
    leadCredits: 8,
    subscriptionTier: SubscriptionTier.PROFESSIONAL,
    mhicLicense: "MHIC-123456",
    hvacLicense: "HVACR-98765",
  },
  {
    businessName: "SunPath Solar MD",
    email: "hello@sunpathsolar.example",
    phone: "+13015550202",
    website: "https://sunpathsolar.example",
    bio: "Solar and battery installer serving Montgomery County with end-to-end permitting and interconnection support.",
    categories: ["solar-installer", "battery-storage", "ev-charger"],
    serviceZips: ["20850", "20851", "20814", "20817"],
    certifications: ["NABCEP", "Tesla Powerwall"],
    insuranceVerified: true,
    backgroundCheckPassed: true,
    meaParticipating: true,
    tier: ContractorTier.ELITE,
    status: ContractorStatus.ACTIVE,
    rating: 4.9,
    reviewCount: 89,
    completedProjects: 203,
    leadCredits: 15,
    subscriptionTier: SubscriptionTier.ELITE,
    mhicLicense: "MHIC-223344",
    electricalLicense: "ELEC-334455",
  },
  {
    businessName: "EcoPlumb Rockville",
    email: "service@ecoplumb.example",
    phone: "+13015550303",
    website: null,
    bio: "Heat pump water heater and plumbing specialist for Rockville and nearby Pepco territory ZIP codes.",
    categories: ["water-heater", "plumbing"],
    serviceZips: ["20850", "20853", "20855"],
    certifications: ["Rheem ProTerra", "WSSC Approved"],
    insuranceVerified: true,
    backgroundCheckPassed: true,
    meaParticipating: false,
    tier: ContractorTier.VERIFIED,
    status: ContractorStatus.ACTIVE,
    rating: 4.6,
    reviewCount: 34,
    completedProjects: 78,
    leadCredits: 3,
    subscriptionTier: SubscriptionTier.BASIC,
    mhicLicense: "MHIC-778899",
    plumbingLicense: "PLMB-778899",
    wsscLicense: "WSSC-1122",
  },
  {
    businessName: "Rockville Insulation Pros",
    email: "quotes@rvkinsulation.example",
    phone: "+13015550404",
    website: "https://rvkinsulation.example",
    bio: "Air sealing and insulation specialists with BPI-style home performance workflows for Montgomery County homes.",
    categories: ["insulation", "air-sealing", "home-energy-audit"],
    serviceZips: ["20850", "20852", "20877"],
    certifications: ["BPI"],
    insuranceVerified: false,
    backgroundCheckPassed: false,
    meaParticipating: true,
    tier: ContractorTier.VERIFIED,
    status: ContractorStatus.PENDING_REVIEW,
    rating: 0,
    reviewCount: 0,
    completedProjects: 0,
    leadCredits: 0,
    subscriptionTier: null,
    mhicLicense: "MHIC-445566",
  },
];

async function main() {
  console.log("🌱 Starting seed...");

  await prisma.review.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.homeAssessment.deleteMany({});
  await prisma.contractor.deleteMany({});

  console.log("  ✓ Cleared existing seed data");

  for (const contractor of SEED_CONTRACTORS) {
    const profile = await prisma.profile.upsert({
      where: { email: contractor.email },
      update: {
        phone: contractor.phone,
        role: Role.CONTRACTOR,
      },
      create: {
        userId: `seed-${contractor.businessName.toLowerCase().replace(/\s+/g, "-")}`,
        email: contractor.email,
        firstName: contractor.businessName.split(" ")[0] ?? "Seed",
        lastName: "Account",
        phone: contractor.phone,
        role: Role.CONTRACTOR,
      },
    });

    await prisma.contractor.create({
      data: {
        profileId: profile.id,
        businessName: contractor.businessName,
        tier: contractor.tier,
        status: contractor.status,
        categories: contractor.categories,
        serviceZips: contractor.serviceZips,
        bio: contractor.bio,
        website: contractor.website,
        mhicLicense: contractor.mhicLicense,
        mhicVerified: Boolean(contractor.mhicLicense),
        hvacLicense: contractor.hvacLicense,
        electricalLicense: contractor.electricalLicense,
        plumbingLicense: contractor.plumbingLicense,
        wsscLicense: contractor.wsscLicense,
        certifications: contractor.certifications,
        meaParticipating: contractor.meaParticipating,
        insuranceVerified: contractor.insuranceVerified,
        backgroundCheckPassed: contractor.backgroundCheckPassed,
        rating: contractor.rating,
        reviewCount: contractor.reviewCount,
        completedProjects: contractor.completedProjects,
        leadCredits: contractor.leadCredits,
        subscriptionTier: contractor.subscriptionTier,
        subscriptionStatus: contractor.subscriptionTier ? "ACTIVE" : null,
      },
    });

    console.log(`  ✓ Contractor: ${contractor.businessName} (${contractor.status})`);
  }

  const homeownerProfile = await prisma.profile.upsert({
    where: { email: "demo-homeowner@greenbroker.example" },
    update: {
      role: Role.HOMEOWNER,
    },
    create: {
      userId: "seed-homeowner-demo",
      email: "demo-homeowner@greenbroker.example",
      firstName: "Demo",
      lastName: "Homeowner",
      role: Role.HOMEOWNER,
    },
  });

  await prisma.homeAssessment.create({
    data: {
      profileId: homeownerProfile.id,
      zip: "20850",
      squareFootage: 2400,
      yearBuilt: 1988,
      bedrooms: 4,
      bathrooms: 2,
      primaryHeatingFuel: "gas",
      currentHvacType: "central-ac-gas-furnace",
      hvacAge: 14,
      currentHvacSeer: 13,
      currentFurnaceAfue: 80,
      hasGas: true,
      electricPanelAmps: 200,
      roofOrientation: "south",
      roofAge: 12,
      atticRValue: 19,
      annualKwh: 11160,
      annualTherms: 864,
      householdIncome: 165000,
      amiBracket: "above-150",
      hasExistingSolar: false,
      hasEv: false,
      urgency: "planning",
      notes: "Seed demo assessment for Rockville homeowner workflow.",
      calcAnnualEnergyCost: 3900,
      calcSavingsPotential: 3200,
      calcAvailableRebates: 17500,
      calcSolarPaybackYears: 11.2,
      calcRecommendedUpgrades: [
        "air-sealing",
        "heat-pump-water-heater",
        "heat-pump",
        "solar",
      ],
      photoUrls: [],
      utilityBillUrls: [],
    },
  });

  console.log("  ✓ Homeowner + assessment seeded");

  const contractorCount = await prisma.contractor.count();
  const assessmentCount = await prisma.homeAssessment.count();

  console.log("\n✅ Seed complete:");
  console.log(`   ${contractorCount} contractors`);
  console.log(`   ${assessmentCount} home assessments`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
