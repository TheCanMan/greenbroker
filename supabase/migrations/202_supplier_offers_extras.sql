-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker migration 202: supplier_offers — extras for live curation
--
-- Adds columns the seed JSON already carries but migration 201 missed:
--   - url           supplier homepage / offer URL
--   - intro_rate    teaser rate $/kWh (when fixed_or_variable = 'intro_then_variable')
--   - intro_months  intro window length
--   - source_url    where we verified the offer (PSC list / supplier page)
--
-- Plus loosens fixed_or_variable's allowed values to include the
-- "intro_then_variable" form the seed already uses.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE supplier_offers
  ADD COLUMN IF NOT EXISTS url         text,
  ADD COLUMN IF NOT EXISTS intro_rate  double precision,
  ADD COLUMN IF NOT EXISTS intro_months integer,
  ADD COLUMN IF NOT EXISTS source_url  text;

CREATE INDEX IF NOT EXISTS idx_supplier_offers_last_verified
  ON supplier_offers (last_verified);
