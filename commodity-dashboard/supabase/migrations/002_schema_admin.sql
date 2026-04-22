-- 002_schema_admin.sql
-- naming_queue + commodity_pairs

CREATE TABLE IF NOT EXISTS naming_queue (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type             text NOT NULL CHECK (type IN ('city','commodity')),
  review_subtype   text CHECK (review_subtype IN ('typo','new','pair')),
  raw_value        text NOT NULL,
  suggestion       text,
  canonical_id     uuid,
  pair_target_id   uuid,
  similarity_score numeric(4,3),
  method           text CHECK (method IN ('exact','fuzzy','gemini','manual')),
  source           text,
  source_count     int DEFAULT 1,
  status           text DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','skipped')),
  reviewed_at      timestamptz,
  reviewer_note    text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(type, raw_value)
);

CREATE TABLE IF NOT EXISTS commodity_pairs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commodity_a_id   uuid NOT NULL REFERENCES commodities(id),
  commodity_b_id   uuid NOT NULL REFERENCES commodities(id),
  similarity_score numeric(4,3),
  pair_type        text CHECK (pair_type IN ('exact','variant','comparable')),
  approved_at      timestamptz,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  CHECK (commodity_a_id != commodity_b_id),
  UNIQUE(commodity_a_id, commodity_b_id)
);
