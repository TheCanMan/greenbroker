-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker migration 100: GIN indexes for array columns
--
-- Prisma can't model GIN indexes on text[] columns directly, so we add them
-- here. These accelerate the contractor search API's containment checks:
--
--   service_area_county_ids @> ARRAY['MD:montgomery']
--   service_utility_ids     @> ARRAY['pepco-md']
--   categories              @> ARRAY['hvac']
--
-- Idempotent (IF NOT EXISTS). Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_contractors_service_area_county_ids_gin
  ON contractors USING GIN (service_area_county_ids);

CREATE INDEX IF NOT EXISTS idx_contractors_service_utility_ids_gin
  ON contractors USING GIN (service_utility_ids);

CREATE INDEX IF NOT EXISTS idx_contractors_categories_gin
  ON contractors USING GIN (categories);
