-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker migration 002: state + county + utility columns
--
-- Adds structured geo fields to home_assessments (resolved location +
-- selected utility) and to contractors (structured service area). Mirrors
-- prisma/schema.prisma; written by hand because Prisma doesn't model GIN
-- indexes on text[] columns directly.
--
-- Idempotent: every statement uses IF NOT EXISTS / IF EXISTS so re-running
-- the migration against an already-migrated database is a no-op.
--
-- Run via:
--   - Supabase CLI:  supabase db push
--   - Or paste into: Supabase Dashboard → SQL Editor
--
-- Applies to schema version: post-001_rls_policies.sql
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ─── home_assessments ────────────────────────────────────────────────────────

ALTER TABLE home_assessments
  ADD COLUMN IF NOT EXISTS state               text,
  ADD COLUMN IF NOT EXISTS county_id           text,
  ADD COLUMN IF NOT EXISTS electric_utility_id text,
  ADD COLUMN IF NOT EXISTS gas_utility_id      text;

CREATE INDEX IF NOT EXISTS idx_home_assessments_state
  ON home_assessments (state);
CREATE INDEX IF NOT EXISTS idx_home_assessments_county_id
  ON home_assessments (county_id);
CREATE INDEX IF NOT EXISTS idx_home_assessments_electric_utility_id
  ON home_assessments (electric_utility_id);

-- Backfill state + county_id for existing rows using the same ZIP-prefix
-- table as src/lib/geo/zip-lookup.ts. Order matters: more specific prefixes
-- (3-digit) first, then catch-alls. Idempotent — only sets fields that are
-- still NULL.
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:montgomery'
  WHERE state IS NULL AND (zip LIKE '208%' OR zip LIKE '209%');
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:prince-georges'
  WHERE state IS NULL AND zip LIKE '207%';
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:frederick'
  WHERE state IS NULL AND zip LIKE '217%';
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:howard'
  WHERE state IS NULL AND zip LIKE '210%';
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:anne-arundel'
  WHERE state IS NULL AND zip LIKE '211%';
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:baltimore-city'
  WHERE state IS NULL AND zip LIKE '212%';
UPDATE home_assessments
SET state = 'MD', county_id = 'MD:charles'
  WHERE state IS NULL AND zip LIKE '206%';
UPDATE home_assessments
SET state = 'DC', county_id = 'DC:dc'
  WHERE state IS NULL
    AND (zip LIKE '200%' OR zip LIKE '202%' OR zip LIKE '203%'
         OR zip LIKE '204%' OR zip LIKE '205%');

-- ─── contractors ─────────────────────────────────────────────────────────────

ALTER TABLE contractors
  ADD COLUMN IF NOT EXISTS service_area_kind        text,
  ADD COLUMN IF NOT EXISTS service_area_state_code  text,
  ADD COLUMN IF NOT EXISTS service_area_county_ids  text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS service_area_metro_id    text,
  ADD COLUMN IF NOT EXISTS service_utility_ids      text[] NOT NULL DEFAULT '{}';

-- Cheap btree indexes for the discriminator and state filters.
CREATE INDEX IF NOT EXISTS idx_contractors_service_area_kind
  ON contractors (service_area_kind);
CREATE INDEX IF NOT EXISTS idx_contractors_service_area_state_code
  ON contractors (service_area_state_code);

-- GIN indexes for the array-membership lookups the search API runs:
--   service_area_county_ids @> ARRAY['MD:montgomery']
--   service_utility_ids     @> ARRAY['pepco-md']
CREATE INDEX IF NOT EXISTS idx_contractors_service_area_county_ids_gin
  ON contractors USING GIN (service_area_county_ids);
CREATE INDEX IF NOT EXISTS idx_contractors_service_utility_ids_gin
  ON contractors USING GIN (service_utility_ids);

-- We deliberately do NOT backfill contractor service areas from service_zips
-- here. ZIP-by-ZIP resolution can produce surprising county sets for
-- contractors who entered a wide ZIP list, and silent backfills risk
-- mis-categorizing real businesses. The /api/contractors/search route
-- already falls back to in-memory ZIP scanning for rows where
-- service_area_kind IS NULL, so legacy contractors keep working until they
-- re-confirm their service area in the dashboard.

COMMIT;
