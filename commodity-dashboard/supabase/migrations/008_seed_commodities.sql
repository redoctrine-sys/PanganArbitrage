-- 008_seed_commodities.sql
-- 17 komoditas SP2KP

INSERT INTO commodities (name, unit, category, source_origin, is_sp2kp) VALUES
  ('Beras Medium', 'kg', 'Beras', 'sp2kp', true),
  ('Beras Premium', 'kg', 'Beras', 'sp2kp', true),
  ('Jagung', 'kg', 'Seralia', 'sp2kp', true),
  ('Kedelai Biji Kering (Impor)', 'kg', 'Kacang', 'sp2kp', true),
  ('Bawang Merah', 'kg', 'Bumbu', 'sp2kp', true),
  ('Bawang Putih Bonggol', 'kg', 'Bumbu', 'sp2kp', true),
  ('Cabai Merah Keriting', 'kg', 'Bumbu', 'sp2kp', true),
  ('Cabai Rawit Merah', 'kg', 'Bumbu', 'sp2kp', true),
  ('Daging Sapi Murni', 'kg', 'Daging', 'sp2kp', true),
  ('Daging Ayam Ras', 'kg', 'Daging', 'sp2kp', true),
  ('Telur Ayam Ras', 'kg', 'Protein', 'sp2kp', true),
  ('Gula Pasir Lokal', 'kg', 'Gula', 'sp2kp', true),
  ('Gula Pasir Premium', 'kg', 'Gula', 'sp2kp', true),
  ('Minyak Goreng Curah', 'liter', 'Minyak', 'sp2kp', true),
  ('Minyak Goreng Kemasan Premium', 'liter', 'Minyak', 'sp2kp', true),
  ('Tepung Terigu', 'kg', 'Tepung', 'sp2kp', true),
  ('Garam Halus', 'kg', 'Garam', 'sp2kp', true)
ON CONFLICT (name) DO NOTHING;
