-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HOMEOWNER', 'CONTRACTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ContractorTier" AS ENUM ('VERIFIED', 'PREFERRED', 'ELITE');

-- CreateEnum
CREATE TYPE "ContractorStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('BASIC', 'PROFESSIONAL', 'ELITE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTED', 'WON', 'LOST', 'DISPUTED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'HOMEOWNER',
    "first_name" TEXT,
    "last_name" TEXT,
    "phone" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_assessments" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT,
    "zip" TEXT NOT NULL,
    "state" TEXT,
    "county_id" TEXT,
    "electric_utility_id" TEXT,
    "gas_utility_id" TEXT,
    "square_footage" INTEGER NOT NULL,
    "year_built" INTEGER NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER,
    "primary_heating_fuel" TEXT NOT NULL,
    "current_hvac_type" TEXT NOT NULL,
    "hvac_age" INTEGER,
    "current_hvac_seer" DOUBLE PRECISION,
    "current_furnace_afue" DOUBLE PRECISION,
    "has_gas" BOOLEAN NOT NULL DEFAULT true,
    "electric_panel_amps" INTEGER,
    "roof_orientation" TEXT,
    "roof_age" INTEGER,
    "attic_r_value" DOUBLE PRECISION,
    "annual_kwh" INTEGER,
    "annual_therms" INTEGER,
    "household_income" INTEGER,
    "ami_bracket" TEXT,
    "has_existing_solar" BOOLEAN NOT NULL DEFAULT false,
    "has_ev" BOOLEAN NOT NULL DEFAULT false,
    "urgency" TEXT,
    "notes" TEXT,
    "calc_annual_energy_cost" DOUBLE PRECISION,
    "calc_savings_potential" DOUBLE PRECISION,
    "calc_available_rebates" DOUBLE PRECISION,
    "calc_solar_payback_years" DOUBLE PRECISION,
    "calc_recommended_upgrades" TEXT[],
    "photo_urls" TEXT[],
    "utility_bill_urls" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "tier" "ContractorTier" NOT NULL DEFAULT 'VERIFIED',
    "status" "ContractorStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "categories" TEXT[],
    "service_area_kind" TEXT,
    "service_area_state_code" TEXT,
    "service_area_county_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "service_area_metro_id" TEXT,
    "service_utility_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "service_zips" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bio" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "mhic_license" TEXT,
    "mhic_verified" BOOLEAN NOT NULL DEFAULT false,
    "hvac_license" TEXT,
    "electrical_license" TEXT,
    "plumbing_license" TEXT,
    "wssc_license" TEXT,
    "certifications" TEXT[],
    "mea_participating" BOOLEAN NOT NULL DEFAULT false,
    "insurance_verified" BOOLEAN NOT NULL DEFAULT false,
    "background_check_passed" BOOLEAN NOT NULL DEFAULT false,
    "insurance_expiry" TIMESTAMP(3),
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "completed_projects" INTEGER NOT NULL DEFAULT 0,
    "stripe_customer_id" TEXT,
    "subscription_id" TEXT,
    "subscription_tier" "SubscriptionTier",
    "subscription_status" "SubscriptionStatus",
    "subscription_end_date" TIMESTAMP(3),
    "lead_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "contractor_id" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "price_paid" DOUBLE PRECISION NOT NULL,
    "stripe_payment_id" TEXT,
    "contacted_at" TIMESTAMP(3),
    "quoted_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "closed_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "contractor_id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "project_value" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rebate_applications" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "program_name" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "notes" TEXT,
    "document_urls" TEXT[],
    "form_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rebate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stripe_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data" JSONB NOT NULL,

    CONSTRAINT "stripe_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_requests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "categories" TEXT[],
    "zip" TEXT NOT NULL,
    "contractor_id" TEXT,
    "responded" BOOLEAN NOT NULL DEFAULT false,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- CreateIndex
CREATE INDEX "profiles_email_idx" ON "profiles"("email");

-- CreateIndex
CREATE INDEX "home_assessments_profile_id_idx" ON "home_assessments"("profile_id");

-- CreateIndex
CREATE INDEX "home_assessments_zip_idx" ON "home_assessments"("zip");

-- CreateIndex
CREATE INDEX "home_assessments_county_id_idx" ON "home_assessments"("county_id");

-- CreateIndex
CREATE INDEX "home_assessments_state_idx" ON "home_assessments"("state");

-- CreateIndex
CREATE INDEX "home_assessments_created_at_idx" ON "home_assessments"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_profile_id_key" ON "contractors"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_stripe_customer_id_key" ON "contractors"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "contractors_subscription_id_key" ON "contractors"("subscription_id");

-- CreateIndex
CREATE INDEX "contractors_status_idx" ON "contractors"("status");

-- CreateIndex
CREATE INDEX "contractors_tier_idx" ON "contractors"("tier");

-- CreateIndex
CREATE INDEX "contractors_subscription_status_idx" ON "contractors"("subscription_status");

-- CreateIndex
CREATE INDEX "contractors_service_area_kind_idx" ON "contractors"("service_area_kind");

-- CreateIndex
CREATE INDEX "contractors_service_area_state_code_idx" ON "contractors"("service_area_state_code");

-- CreateIndex
CREATE INDEX "leads_contractor_id_idx" ON "leads"("contractor_id");

-- CreateIndex
CREATE INDEX "leads_assessment_id_idx" ON "leads"("assessment_id");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "leads_assessment_id_contractor_id_key" ON "leads"("assessment_id", "contractor_id");

-- CreateIndex
CREATE INDEX "reviews_contractor_id_idx" ON "reviews"("contractor_id");

-- CreateIndex
CREATE INDEX "reviews_profile_id_idx" ON "reviews"("profile_id");

-- CreateIndex
CREATE INDEX "rebate_applications_profile_id_idx" ON "rebate_applications"("profile_id");

-- CreateIndex
CREATE INDEX "rebate_applications_status_idx" ON "rebate_applications"("status");

-- CreateIndex
CREATE INDEX "contact_requests_contractor_id_idx" ON "contact_requests"("contractor_id");

-- CreateIndex
CREATE INDEX "contact_requests_email_idx" ON "contact_requests"("email");

-- AddForeignKey
ALTER TABLE "home_assessments" ADD CONSTRAINT "home_assessments_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "home_assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_contractor_id_fkey" FOREIGN KEY ("contractor_id") REFERENCES "contractors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rebate_applications" ADD CONSTRAINT "rebate_applications_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

