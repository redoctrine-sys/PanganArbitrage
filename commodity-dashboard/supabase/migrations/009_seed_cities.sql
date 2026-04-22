-- 009_seed_cities.sql
-- Sample kota-kota utama di Jawa, Bali, Lombok (akan dilengkapi via Nominatim seed script)

INSERT INTO cities (name, name_sp2kp, province, island, entity_type, kode_wilayah) VALUES
  ('Jakarta Pusat', 'KOTA JAKARTA PUSAT', 'DKI Jakarta', 'Jawa', 'kota', '3171'),
  ('Jakarta Selatan', 'KOTA JAKARTA SELATAN', 'DKI Jakarta', 'Jawa', 'kota', '3174'),
  ('Surabaya', 'KOTA SURABAYA', 'Jawa Timur', 'Jawa', 'kota', '3578'),
  ('Bandung', 'KOTA BANDUNG', 'Jawa Barat', 'Jawa', 'kota', '3273'),
  ('Semarang', 'KOTA SEMARANG', 'Jawa Tengah', 'Jawa', 'kota', '3374'),
  ('Yogyakarta', 'KOTA YOGYAKARTA', 'DI Yogyakarta', 'Jawa', 'kota', '3471'),
  ('Malang', 'KOTA MALANG', 'Jawa Timur', 'Jawa', 'kota', '3573'),
  ('Denpasar', 'KOTA DENPASAR', 'Bali', 'Bali', 'kota', '5171'),
  ('Mataram', 'KOTA MATARAM', 'NTB', 'Lombok', 'kota', '5271'),
  ('Bogor', 'KOTA BOGOR', 'Jawa Barat', 'Jawa', 'kota', '3271'),
  ('Bekasi', 'KOTA BEKASI', 'Jawa Barat', 'Jawa', 'kota', '3275'),
  ('Depok', 'KOTA DEPOK', 'Jawa Barat', 'Jawa', 'kota', '3276'),
  ('Tangerang', 'KOTA TANGERANG', 'Banten', 'Jawa', 'kota', '3671'),
  ('Tasikmalaya', 'KOTA TASIKMALAYA', 'Jawa Barat', 'Jawa', 'kota', '3278'),
  ('Cirebon', 'KOTA CIREBON', 'Jawa Barat', 'Jawa', 'kota', '3274'),
  ('Solo', 'KOTA SURAKARTA', 'Jawa Tengah', 'Jawa', 'kota', '3372'),
  ('Magelang', 'KOTA MAGELANG', 'Jawa Tengah', 'Jawa', 'kota', '3371'),
  ('Salatiga', 'KOTA SALATIGA', 'Jawa Tengah', 'Jawa', 'kota', '3373'),
  ('Tegal', 'KOTA TEGAL', 'Jawa Tengah', 'Jawa', 'kota', '3376'),
  ('Pekalongan', 'KOTA PEKALONGAN', 'Jawa Tengah', 'Jawa', 'kota', '3375'),
  ('Kediri', 'KOTA KEDIRI', 'Jawa Timur', 'Jawa', 'kota', '3571'),
  ('Blitar', 'KOTA BLITAR', 'Jawa Timur', 'Jawa', 'kota', '3572'),
  ('Probolinggo', 'KOTA PROBOLINGGO', 'Jawa Timur', 'Jawa', 'kota', '3574'),
  ('Pasuruan', 'KOTA PASURUAN', 'Jawa Timur', 'Jawa', 'kota', '3575'),
  ('Mojokerto', 'KOTA MOJOKERTO', 'Jawa Timur', 'Jawa', 'kota', '3576'),
  ('Madiun', 'KOTA MADIUN', 'Jawa Timur', 'Jawa', 'kota', '3577'),
  ('Batu', 'KOTA BATU', 'Jawa Timur', 'Jawa', 'kota', '3579'),
  ('Serang', 'KOTA SERANG', 'Banten', 'Jawa', 'kota', '3673'),
  ('Cilegon', 'KOTA CILEGON', 'Banten', 'Jawa', 'kota', '3672')
ON CONFLICT (kode_wilayah) DO NOTHING;
