-- ─────────────────────────────────────────────────────────────────────────────
-- GreenBroker migration 203: contractor quote requests
--
-- Splits the bid flow into two tables:
--   - quote_requests   homeowner-initiated "I want bids for X upgrade"
--   - contractor_quotes (existing) becomes contractor responses, linked
--                        back to the request via request_id.
--
-- Idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_requests (
  id              text PRIMARY KEY,
  profile_id      text,                  -- homeowner's profile (nullable for guest)
  home_profile_id text,
  zip             text NOT NULL,
  county_id       text,
  state           text,
  selected_upgrade   text NOT NULL,
  scope_notes        text,
  contact_email      text,
  contact_phone      text,
  preferred_categories text[] NOT NULL DEFAULT '{}',  -- e.g. ["hvac","insulation"]
  status          text NOT NULL DEFAULT 'open',       -- open / closed / awarded / withdrawn
  contractors_notified_count integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_requests_profile_id
  ON quote_requests (profile_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_county_id
  ON quote_requests (county_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status
  ON quote_requests (status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at
  ON quote_requests (created_at DESC);

-- Link existing contractor_quotes (responses) back to their request.
ALTER TABLE contractor_quotes
  ADD COLUMN IF NOT EXISTS request_id text REFERENCES quote_requests(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_contractor_quotes_request_id
  ON contractor_quotes (request_id);
