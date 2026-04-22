-- 004_schema_transport.sql

CREATE TABLE IF NOT EXISTS transport_vendors (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama         text NOT NULL,
  kontak       text,
  moda         text CHECK (moda IN ('truk','pickup','ekspedisi','kapal','motor','lainnya')),
  price_type   text CHECK (price_type IN ('per_km','flat')),
  price_per_km numeric(10,2),
  price_flat   numeric(12,2),
  kapasitas_kg numeric(10,2),
  cakupan      text[],
  catatan      text,
  active       boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS city_distances (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_from_id   uuid NOT NULL REFERENCES cities(id),
  city_to_id     uuid NOT NULL REFERENCES cities(id),
  distance_km    numeric(10,2) NOT NULL,
  duration_hours numeric(8,2),
  route_type     text CHECK (route_type IN ('darat','darat+ferry','ferry')),
  source         text DEFAULT 'osrm',
  updated_at     timestamptz DEFAULT now(),
  UNIQUE(city_from_id, city_to_id)
);
