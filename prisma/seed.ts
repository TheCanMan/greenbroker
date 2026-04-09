/**
 * prisma/seed.ts
 *
 * Populates the database with:
 *  - Sample contractor accounts (PENDING_REVIEW + ACTIVE)
 *  - Sample homeowner profile with a completed assessment
 *
 * Run:  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or:   npx prisma db seed
 *
 * Requires DATABASE_URL in .env.local (direct connection, not pooler)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Contractor seed data ────────────────────────────────────────────────────

const SEED_CONTRACTORS = [
  {
    businessName: "Capital Green HVAC",
    email: "info@capitalgreenhvac.example",
    phone: "+13015550101",
    website: "https://capitalgreenhvac.example",
    description:
      "Montgomery County's leading heat pump installer. Licensed and insured, specializing in Mitsubishi and Carrier Infinity systems. Over 400 installations in Rockville, Bethesda, and Gaithersburg.",
    serviceCategories: ["heat-pump-hvac", "ductless-mini-split", "hvac-maintenance"],
    licensedStates: ["MD", "VA", "DC"],
    insuranceVerified: true,
    tier: "PREFERRED" as const,
    status: "ACTIVE" as const,
    rating: 4.8,
    reviewCount: 127,
    completedProjects: 412,
    leadCredits: 8,
    subscriptionTier: "PROFESSIONAL" as const,
  },
  {
    businessName: "SunPath Solar MD",
    email: "hello@sunpathsolar.example",
    phone: "+13015550202",
    website: "https://sunpathsolar.example",
    description:
      "Maryland's highest-rated solar installer in Montgomery County. SunPower and Tesla Powerwall certified. Full-service installation, permits, and utility interconnection.",
    serviceCategories: ["solar-installer", "battery-storage", "ev-charger"],
    licensedStates: ["MD"],
    insuranceVerified: true,
    tier: "ELITE" as const,
    status: "ACTIVE" as const,
    rating: 4.9,
    reviewCount: 89,
    completedProjects: 203,
    leadCredits: 15,
    subscriptionTier: "ELITE" as const,
  },
  {
    businessName: "EcoPlumb Rockville",
    email: "service@ecoplumb.example",
    phone: "+13015550303",
    website: null,
    description:
      "Heat pump water heater installation and plumbing services for Rockville and surrounding ZIP codes. Rheem ProTerra certified installer.",
    serviceCategories: ["water-heater", "plumbing"],
    licensedStates: ["MD"],
    insuranceVerified: true,
    tier: "STANDARD" as const,
    status: "ACTIVE" as const,
    rating: 4.6,
    reviewCount: 34,
    completedProjects: 78,
    leadCredits: 3,
    subscriptionTier: "BASIC" as const,
  },
  {
    businessName: "Rockville Insulation Pros",
    email: "quotes@rvkinsulation.example",
    phone: "+13015550404",
    website: "https://rvkinsulation.example",
    description:
      "Air sealing and insulation specialists. BPI Building Analyst certified. We identify and fix the biggest sources of energy loss in Montgomery County homes.",
    serviceCategories: ["insulation", "air-sealing", "home-energy-audit"],
    licensedStates: ["MD"],
    insuranceVerified: false,
    tier: "STANDARD" as const,
    status: "PENDING_REVIEW" as const,
    rating: 0,
    reviewCount: 0,
    completedProjects: 0,
    leadCredits: 0,
    subscriptionTier: null,
  },
];

// ─── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Starting seed…");

  // Clean slate for seed data (won't delete real user profiles)
  await prisma.review.deleteMany({});
  await prisma.lead.deleteMany({});
  await prisma.homeAssessment.deleteMany({});
  await prisma.contractor.deleteMany({});

  console.log("  ✓  Cleared existing seed data");

  // ── Create contractor profiles ─────────────────────────────────────────────
  // Note: In production these would be linked to real Supabase auth.users rows.
  // For seed purposes we create Profile records with placeholder user_ids.

  for (const c of SEED_CONTRACTORS) {
    // Create a placeholder profile
    const profile = await prisma.profile.upsert({
      where: { email: c.email },
      update: {},
      create: {
        userId: `seed-${c.businessName.toLowerCase().replace(/\s+/g, "-")}`,
        email: c.email,
        firstName: "Seed",
        lastName: "Account",
        role: "CONTRACTOR",
      },
    });

    await prisma.contractor.create({
      data: {
        profileId: profile.id,
        businessName: c.businessName,
        phone: c.phone,
        website: c.website,
        description: c.description,
        serviceCategories: c.serviceCategories,
        licensedStates: c.licensedStates,
        insuranceVerified: c.insuranceVerified,
        tier: c.tier,
        status: c.status,
        rating: c.rating,
        reviewCount: c.reviewCount,
        completedProjects: c.completedProjects,
        leadCredits: c.leadCredits,
        subscriptionTier: c.subscriptionTier,
        subscriptionStatus: c.subscriptionTier ? "ACTIVE" : null,
      },
    });

    console.log(`  ✓  Contractor: ${c.businessName} (${c.status})`);
  }

  // ── Create a sample homeowner + assessment ─────────────────────────────────
  const homeownerProfile = await prisma.profile.upsert({
    where: { email: "demo-homeowner@greenbroker.example" },
    update: {},
    create: {
      userId: "seed-homeowner-demo",
      email: "demo-homeowner@greenbroker.example",
      firstName: "Demo",
      lastName: "Homeowner",
      role: "HOMEOWNER",
    },
  });

  await prisma.homeAssessment.create({
    data: {
      profileId: homeownerProfile.id,
      zip: "20850",
      squareFootage: 2400,
      yearBuilt: 1988,
      bedroomCount: 4,
      bathroomCount: 2,
      heatingFuel: "GAS",
      hvacType: "CENTRAL_FORCED_AIR",
      hasAC: true,
      hasSolar: false,
      hasEV: false,
      electricProvider: "PEPCO",
      gasProvider: "WASHINGTON_GAS",
      avgMonthlyElectricBill: 185,
      avgMonthlyGasBill: 140,
      // Calculated outputs
      calcAnnualEnergyCost: 3900,
      calcSavingsPotential: 3200,
      calcAvailableRebates: 17500,
      calcSolarProductionKwh: 9800,
      calcSolarSavingsFirstYear: 2123,
      calcHeatPumpSavings: 780,
      calcHpwhSavings: 340,
    },
  });

  console.log("  ✓  Homeowner + assessment (ZIP 20850, 2,400 sq ft, 1988)");

  // ── Summary ────────────────────────────────────────────────────────────────
  const contractorCount = await prisma.contractor.count();
  const assessmentCount = await prisma.homeAssessment.count();

  console.log("\n✅  Seed complete:");
  console.log(`    ${contractorCount} contractors`);
  console.log(`    ${assessmentCount} home assessments`);
  console.log("\n   Run `npx prisma studio` to inspect the data.");
}

main()
  .catch((e) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
