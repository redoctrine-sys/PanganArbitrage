-- 005_schema_arbitrage.sql

CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date                 date NOT NULL,
  commodity_id         uuid NOT NULL REFERENCES commodities(id),
  city_buy_id          uuid NOT NULL REFERENCES cities(id),
  city_sell_id         uuid NOT NULL REFERENCES cities(id),
  price_buy            numeric(12,2) NOT NULL,
  price_sell           numeric(12,2) NOT NULL,
  price_buy_source     text,
  price_sell_source    text,
  gross_spread_pct     numeric(8,2) NOT NULL,
  route_type           text,
  distance_km          numeric(10,2),
  -- Phase B
  transport_vendor_id  uuid REFERENCES transport_vendors(id),
  transport_cost_total numeric(12,2),
  net_profit_per_kg    numeric(12,2),
  roi_pct              numeric(8,2),
  viable               boolean,
  risk_score           text CHECK (risk_score IN ('RENDAH','SEDANG','TINGGI')),
  -- Phase C
  ai_recommendation    text CHECK (ai_recommendation IN ('BELI','TUNGGU','HINDARI')),
  ai_reasoning         text,
  ai_timing            text,
  ai_risk_flag         text,
  ai_generated_at      timestamptz,
  created_at           timestamptz DEFAULT now(),
  UNIQUE(date, commodity_id, city_buy_id, city_sell_id)
);
