-- 001_schema_core.sql
-- Core tables: cities, commodities, prices_raw

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS cities (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  name_sp2kp   text,
  province     text,
  island       text CHECK (island IN ('Jawa','Madura','Bali','Lombok')),
  entity_type  text CHECK (entity_type IN ('kota','kabupaten')),
  kode_wilayah text UNIQUE,
  lat          numeric(9,6),
  lng          numeric(9,6)
);

CREATE TABLE IF NOT EXISTS commodities (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL UNIQUE,
  unit          text DEFAULT 'kg',
  category      text,
  source_origin text DEFAULT 'sp2kp',
  is_sp2kp      boolean DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prices_raw (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date          date NOT NULL,
  city_raw      text NOT NULL,
  commodity_raw text NOT NULL,
  city_id       uuid REFERENCES cities(id),
  commodity_id  uuid REFERENCES commodities(id),
  price         numeric(12,2) NOT NULL,
  het_ha        numeric(12,2),
  source        text NOT NULL,
  kode_wilayah  text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(date, city_raw, commodity_raw, source)
);

CREATE INDEX IF NOT EXISTS idx_pr_pending_city ON prices_raw(city_id) WHERE city_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_pending_comm ON prices_raw(commodity_id) WHERE commodity_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_pr_approved ON prices_raw(city_id, commodity_id, date DESC)
  WHERE city_id IS NOT NULL AND commodity_id IS NOT NULL;
