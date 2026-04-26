-- Residential marketplace foundation tables.
-- Idempotent. Safe to re-run while the MVP UI still uses local seed data.

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  email text UNIQUE,
  profile_id text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS home_profiles (
  id text PRIMARY KEY,
  assessment_id text,
  profile_id text,
  address text,
  city text,
  state text,
  county text,
  zip text NOT NULL,
  home_type text,
  ownership text,
  year_built integer,
  square_feet integer,
  occupants integer,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS utility_accounts (
  id text PRIMARY KEY,
  home_profile_id text,
  utility_type text NOT NULL,
  utility_id text,
  utility_name text,
  current_supplier text,
  account_number text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS utility_bills (
  id text PRIMARY KEY,
  utility_account_id text,
  bill_url text,
  period_start timestamptz,
  period_end timestamptz,
  kwh double precision,
  therms double precision,
  cost_usd double precision,
  parsed_json jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS existing_equipment (
  id text PRIMARY KEY,
  home_profile_id text,
  equipment_type text NOT NULL,
  fuel_type text,
  age_years integer,
  condition text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS goal_selections (
  id text PRIMARY KEY,
  home_profile_id text,
  goal text NOT NULL,
  priority integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS eligibility_profiles (
  id text PRIMARY KEY,
  home_profile_id text,
  household_size integer,
  income_range text,
  assistance_programs text[] DEFAULT '{}' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS rebate_programs (
  id text PRIMARY KEY,
  program_name text NOT NULL,
  administrator text NOT NULL,
  territory text,
  eligible_upgrade_types text[] DEFAULT '{}' NOT NULL,
  max_rebate text,
  application_timing text,
  requires_contractor boolean DEFAULT false NOT NULL,
  requires_income_qualification boolean DEFAULT false NOT NULL,
  documents_needed text[] DEFAULT '{}' NOT NULL,
  last_verified timestamptz,
  source_url text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS upgrade_recommendations (
  id text PRIMARY KEY,
  home_profile_id text,
  upgrade_type text NOT NULL,
  project_cost_range jsonb NOT NULL,
  eligible_rebates text[] DEFAULT '{}' NOT NULL,
  net_cost_range jsonb NOT NULL,
  annual_savings_range jsonb NOT NULL,
  payback_range jsonb NOT NULL,
  confidence_score integer NOT NULL,
  paperwork_status text NOT NULL,
  why_recommended text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  product_name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL,
  energy_star_certified boolean DEFAULT false NOT NULL,
  efficiency_metric text,
  estimated_price text,
  eligible_rebates text[] DEFAULT '{}' NOT NULL,
  affiliate_url text,
  retailer text,
  model_number text,
  warranty text,
  installation_required boolean DEFAULT false NOT NULL,
  best_for text,
  ranking_score integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS contractor_quotes (
  id text PRIMARY KEY,
  contractor_id text,
  home_profile_id text,
  selected_upgrade text NOT NULL,
  gross_cost_usd double precision,
  eligible_model_number text,
  timeline text,
  license_info jsonb,
  participates_in_rebate boolean DEFAULT false NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS rebate_packets (
  id text PRIMARY KEY,
  home_profile_id text,
  selected_upgrade text NOT NULL,
  selected_rebate_id text,
  contractor_quote_id text,
  prefilled_summary jsonb,
  required_documents text[] DEFAULT '{}' NOT NULL,
  missing_items text[] DEFAULT '{}' NOT NULL,
  submission_instructions text,
  status text DEFAULT 'draft' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_offers (
  id text PRIMARY KEY,
  supplier_name text NOT NULL,
  license_number text NOT NULL,
  commodity text NOT NULL,
  rate double precision NOT NULL,
  fixed_or_variable text NOT NULL,
  term_months integer NOT NULL,
  monthly_fee double precision DEFAULT 0 NOT NULL,
  early_termination_fee double precision DEFAULT 0 NOT NULL,
  renewable_percent integer DEFAULT 0 NOT NULL,
  warnings text[] DEFAULT '{}' NOT NULL,
  last_verified timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS supplier_comparisons (
  id text PRIMARY KEY,
  home_profile_id text,
  utility text,
  current_supplier text,
  current_rate double precision,
  annual_kwh integer,
  desired_plan_type text,
  risk_tolerance text,
  results_json jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_home_profiles_zip ON home_profiles(zip);
CREATE INDEX IF NOT EXISTS idx_upgrade_recommendations_home_profile_id ON upgrade_recommendations(home_profile_id);
CREATE INDEX IF NOT EXISTS idx_rebate_packets_home_profile_id ON rebate_packets(home_profile_id);
CREATE INDEX IF NOT EXISTS idx_supplier_comparisons_home_profile_id ON supplier_comparisons(home_profile_id);
