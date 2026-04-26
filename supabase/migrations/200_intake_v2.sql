-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker migration 200: Phase-2 intake JSONB blob
--
-- Adds a single jsonb column on home_assessments to hold the v2 intake
-- payload (goals, household_size, income_range, assistance programs, ownership,
-- occupants, water-heater type/age, smart-thermostat flag, insulation notes,
-- window condition, current supplier info, consent flags). Keeping it as a
-- single blob avoids an 18-column migration on every schema iteration; we'll
-- promote individual fields to real columns when we have queries that need
-- them indexed.
--
-- Idempotent. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE home_assessments
  ADD COLUMN IF NOT EXISTS intake_v2 jsonb;

-- GIN index lets us query keys inside the blob if needed later, e.g.:
--   WHERE intake_v2 -> 'goals' ? 'electrify_home'
--   WHERE intake_v2 ->> 'income_range' = 'under_50k'
CREATE INDEX IF NOT EXISTS idx_home_assessments_intake_v2_gin
  ON home_assessments USING GIN (intake_v2);
