-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker migration 204: bid acceptance ("award") on quote_requests
--
-- Adds winning_quote_id so a homeowner can mark which contractor's bid won.
-- Bid lifecycle:
--   request.status: open -> awarded (terminal) | closed | withdrawn
--   bid.status:     submitted -> won | lost
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS winning_quote_id text REFERENCES contractor_quotes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS awarded_at       timestamptz;

CREATE INDEX IF NOT EXISTS idx_quote_requests_winning_quote_id
  ON quote_requests (winning_quote_id);
