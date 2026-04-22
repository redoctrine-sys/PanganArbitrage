-- 003_schema_pedagang.sql

CREATE TABLE IF NOT EXISTS pedagang (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nama          text NOT NULL,
  no_hp         text,
  city_id       uuid NOT NULL REFERENCES cities(id),
  lokasi_detail text,
  keterangan    text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedagang_harga (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedagang_id  uuid NOT NULL REFERENCES pedagang(id),
  commodity_id uuid NOT NULL REFERENCES commodities(id),
  price        numeric(12,2) NOT NULL,
  date         date NOT NULL DEFAULT CURRENT_DATE,
  satuan       text DEFAULT 'kg',
  created_at   timestamptz DEFAULT now()
);
