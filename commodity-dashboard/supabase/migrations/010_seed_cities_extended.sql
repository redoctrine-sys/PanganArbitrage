-- 010_seed_cities_extended.sql
-- Lengkap semua kabupaten/kota di Jawa, Madura, Bali, dan Lombok

INSERT INTO cities (name, name_sp2kp, province, island, entity_type, kode_wilayah) VALUES

-- ── DKI Jakarta (tambahan) ──────────────────────────────────────────────────
  ('Jakarta Timur',  'KOTA JAKARTA TIMUR',  'DKI Jakarta', 'Jawa', 'kota',       '3172'),
  ('Jakarta Barat',  'KOTA JAKARTA BARAT',  'DKI Jakarta', 'Jawa', 'kota',       '3173'),
  ('Jakarta Utara',  'KOTA JAKARTA UTARA',  'DKI Jakarta', 'Jawa', 'kota',       '3175'),
  ('Kepulauan Seribu','KAB. KEP. SERIBU',  'DKI Jakarta', 'Jawa', 'kabupaten',  '3101'),

-- ── Jawa Barat — Kabupaten ────────────────────────────────────────────────
  ('Kab. Bogor',       'KAB. BOGOR',       'Jawa Barat', 'Jawa', 'kabupaten', '3201'),
  ('Kab. Sukabumi',    'KAB. SUKABUMI',    'Jawa Barat', 'Jawa', 'kabupaten', '3202'),
  ('Kab. Cianjur',     'KAB. CIANJUR',     'Jawa Barat', 'Jawa', 'kabupaten', '3203'),
  ('Kab. Bandung',     'KAB. BANDUNG',     'Jawa Barat', 'Jawa', 'kabupaten', '3204'),
  ('Kab. Garut',       'KAB. GARUT',       'Jawa Barat', 'Jawa', 'kabupaten', '3205'),
  ('Kab. Tasikmalaya', 'KAB. TASIKMALAYA', 'Jawa Barat', 'Jawa', 'kabupaten', '3206'),
  ('Kab. Ciamis',      'KAB. CIAMIS',      'Jawa Barat', 'Jawa', 'kabupaten', '3207'),
  ('Kab. Kuningan',    'KAB. KUNINGAN',    'Jawa Barat', 'Jawa', 'kabupaten', '3208'),
  ('Kab. Cirebon',     'KAB. CIREBON',     'Jawa Barat', 'Jawa', 'kabupaten', '3209'),
  ('Kab. Majalengka',  'KAB. MAJALENGKA',  'Jawa Barat', 'Jawa', 'kabupaten', '3210'),
  ('Kab. Sumedang',    'KAB. SUMEDANG',    'Jawa Barat', 'Jawa', 'kabupaten', '3211'),
  ('Kab. Indramayu',   'KAB. INDRAMAYU',   'Jawa Barat', 'Jawa', 'kabupaten', '3212'),
  ('Kab. Subang',      'KAB. SUBANG',      'Jawa Barat', 'Jawa', 'kabupaten', '3213'),
  ('Kab. Purwakarta',  'KAB. PURWAKARTA',  'Jawa Barat', 'Jawa', 'kabupaten', '3214'),
  ('Kab. Karawang',    'KAB. KARAWANG',    'Jawa Barat', 'Jawa', 'kabupaten', '3215'),
  ('Kab. Bekasi',      'KAB. BEKASI',      'Jawa Barat', 'Jawa', 'kabupaten', '3216'),
  ('Kab. Bandung Barat','KAB. BANDUNG BARAT','Jawa Barat','Jawa','kabupaten', '3217'),
  ('Kab. Pangandaran', 'KAB. PANGANDARAN', 'Jawa Barat', 'Jawa', 'kabupaten', '3218'),

-- ── Jawa Barat — Kota (tambahan) ─────────────────────────────────────────
  ('Sukabumi',  'KOTA SUKABUMI',  'Jawa Barat', 'Jawa', 'kota', '3272'),
  ('Cimahi',    'KOTA CIMAHI',    'Jawa Barat', 'Jawa', 'kota', '3277'),
  ('Banjar',    'KOTA BANJAR',    'Jawa Barat', 'Jawa', 'kota', '3279'),

-- ── Jawa Tengah — Kabupaten ───────────────────────────────────────────────
  ('Kab. Cilacap',     'KAB. CILACAP',     'Jawa Tengah', 'Jawa', 'kabupaten', '3301'),
  ('Kab. Banyumas',    'KAB. BANYUMAS',    'Jawa Tengah', 'Jawa', 'kabupaten', '3302'),
  ('Kab. Purbalingga', 'KAB. PURBALINGGA', 'Jawa Tengah', 'Jawa', 'kabupaten', '3303'),
  ('Kab. Banjarnegara','KAB. BANJARNEGARA','Jawa Tengah', 'Jawa', 'kabupaten', '3304'),
  ('Kab. Kebumen',     'KAB. KEBUMEN',     'Jawa Tengah', 'Jawa', 'kabupaten', '3305'),
  ('Kab. Purworejo',   'KAB. PURWOREJO',   'Jawa Tengah', 'Jawa', 'kabupaten', '3306'),
  ('Kab. Wonosobo',    'KAB. WONOSOBO',    'Jawa Tengah', 'Jawa', 'kabupaten', '3307'),
  ('Kab. Magelang',    'KAB. MAGELANG',    'Jawa Tengah', 'Jawa', 'kabupaten', '3308'),
  ('Kab. Boyolali',    'KAB. BOYOLALI',    'Jawa Tengah', 'Jawa', 'kabupaten', '3309'),
  ('Kab. Klaten',      'KAB. KLATEN',      'Jawa Tengah', 'Jawa', 'kabupaten', '3310'),
  ('Kab. Sukoharjo',   'KAB. SUKOHARJO',   'Jawa Tengah', 'Jawa', 'kabupaten', '3311'),
  ('Kab. Wonogiri',    'KAB. WONOGIRI',    'Jawa Tengah', 'Jawa', 'kabupaten', '3312'),
  ('Kab. Karanganyar', 'KAB. KARANGANYAR', 'Jawa Tengah', 'Jawa', 'kabupaten', '3313'),
  ('Kab. Sragen',      'KAB. SRAGEN',      'Jawa Tengah', 'Jawa', 'kabupaten', '3314'),
  ('Kab. Grobogan',    'KAB. GROBOGAN',    'Jawa Tengah', 'Jawa', 'kabupaten', '3315'),
  ('Kab. Blora',       'KAB. BLORA',       'Jawa Tengah', 'Jawa', 'kabupaten', '3316'),
  ('Kab. Rembang',     'KAB. REMBANG',     'Jawa Tengah', 'Jawa', 'kabupaten', '3317'),
  ('Kab. Pati',        'KAB. PATI',        'Jawa Tengah', 'Jawa', 'kabupaten', '3318'),
  ('Kab. Kudus',       'KAB. KUDUS',       'Jawa Tengah', 'Jawa', 'kabupaten', '3319'),
  ('Kab. Jepara',      'KAB. JEPARA',      'Jawa Tengah', 'Jawa', 'kabupaten', '3320'),
  ('Kab. Demak',       'KAB. DEMAK',       'Jawa Tengah', 'Jawa', 'kabupaten', '3321'),
  ('Kab. Semarang',    'KAB. SEMARANG',    'Jawa Tengah', 'Jawa', 'kabupaten', '3322'),
  ('Kab. Temanggung',  'KAB. TEMANGGUNG',  'Jawa Tengah', 'Jawa', 'kabupaten', '3323'),
  ('Kab. Kendal',      'KAB. KENDAL',      'Jawa Tengah', 'Jawa', 'kabupaten', '3324'),
  ('Kab. Batang',      'KAB. BATANG',      'Jawa Tengah', 'Jawa', 'kabupaten', '3325'),
  ('Kab. Pekalongan',  'KAB. PEKALONGAN',  'Jawa Tengah', 'Jawa', 'kabupaten', '3326'),
  ('Kab. Pemalang',    'KAB. PEMALANG',    'Jawa Tengah', 'Jawa', 'kabupaten', '3327'),
  ('Kab. Tegal',       'KAB. TEGAL',       'Jawa Tengah', 'Jawa', 'kabupaten', '3328'),
  ('Kab. Brebes',      'KAB. BREBES',      'Jawa Tengah', 'Jawa', 'kabupaten', '3329'),

-- ── DI Yogyakarta — Kabupaten ─────────────────────────────────────────────
  ('Kab. Kulon Progo',  'KAB. KULON PROGO',  'DI Yogyakarta', 'Jawa', 'kabupaten', '3401'),
  ('Kab. Bantul',       'KAB. BANTUL',       'DI Yogyakarta', 'Jawa', 'kabupaten', '3402'),
  ('Kab. Gunung Kidul', 'KAB. GUNUNG KIDUL', 'DI Yogyakarta', 'Jawa', 'kabupaten', '3403'),
  ('Kab. Sleman',       'KAB. SLEMAN',       'DI Yogyakarta', 'Jawa', 'kabupaten', '3404'),

-- ── Jawa Timur — Kabupaten ────────────────────────────────────────────────
  ('Kab. Pacitan',     'KAB. PACITAN',     'Jawa Timur', 'Jawa', 'kabupaten', '3501'),
  ('Kab. Ponorogo',    'KAB. PONOROGO',    'Jawa Timur', 'Jawa', 'kabupaten', '3502'),
  ('Kab. Trenggalek',  'KAB. TRENGGALEK',  'Jawa Timur', 'Jawa', 'kabupaten', '3503'),
  ('Kab. Tulungagung', 'KAB. TULUNGAGUNG', 'Jawa Timur', 'Jawa', 'kabupaten', '3504'),
  ('Kab. Blitar',      'KAB. BLITAR',      'Jawa Timur', 'Jawa', 'kabupaten', '3505'),
  ('Kab. Kediri',      'KAB. KEDIRI',      'Jawa Timur', 'Jawa', 'kabupaten', '3506'),
  ('Kab. Malang',      'KAB. MALANG',      'Jawa Timur', 'Jawa', 'kabupaten', '3507'),
  ('Kab. Lumajang',    'KAB. LUMAJANG',    'Jawa Timur', 'Jawa', 'kabupaten', '3508'),
  ('Kab. Jember',      'KAB. JEMBER',      'Jawa Timur', 'Jawa', 'kabupaten', '3509'),
  ('Kab. Banyuwangi',  'KAB. BANYUWANGI',  'Jawa Timur', 'Jawa', 'kabupaten', '3510'),
  ('Kab. Bondowoso',   'KAB. BONDOWOSO',   'Jawa Timur', 'Jawa', 'kabupaten', '3511'),
  ('Kab. Situbondo',   'KAB. SITUBONDO',   'Jawa Timur', 'Jawa', 'kabupaten', '3512'),
  ('Kab. Probolinggo', 'KAB. PROBOLINGGO', 'Jawa Timur', 'Jawa', 'kabupaten', '3513'),
  ('Kab. Pasuruan',    'KAB. PASURUAN',    'Jawa Timur', 'Jawa', 'kabupaten', '3514'),
  ('Kab. Sidoarjo',    'KAB. SIDOARJO',    'Jawa Timur', 'Jawa', 'kabupaten', '3515'),
  ('Kab. Mojokerto',   'KAB. MOJOKERTO',   'Jawa Timur', 'Jawa', 'kabupaten', '3516'),
  ('Kab. Jombang',     'KAB. JOMBANG',     'Jawa Timur', 'Jawa', 'kabupaten', '3517'),
  ('Kab. Nganjuk',     'KAB. NGANJUK',     'Jawa Timur', 'Jawa', 'kabupaten', '3518'),
  ('Kab. Madiun',      'KAB. MADIUN',      'Jawa Timur', 'Jawa', 'kabupaten', '3519'),
  ('Kab. Magetan',     'KAB. MAGETAN',     'Jawa Timur', 'Jawa', 'kabupaten', '3520'),
  ('Kab. Ngawi',       'KAB. NGAWI',       'Jawa Timur', 'Jawa', 'kabupaten', '3521'),
  ('Kab. Bojonegoro',  'KAB. BOJONEGORO',  'Jawa Timur', 'Jawa', 'kabupaten', '3522'),
  ('Kab. Tuban',       'KAB. TUBAN',       'Jawa Timur', 'Jawa', 'kabupaten', '3523'),
  ('Kab. Lamongan',    'KAB. LAMONGAN',    'Jawa Timur', 'Jawa', 'kabupaten', '3524'),
  ('Kab. Gresik',      'KAB. GRESIK',      'Jawa Timur', 'Jawa', 'kabupaten', '3525'),

-- ── Madura (bagian dari Jawa Timur secara administratif) ──────────────────
  ('Kab. Bangkalan',   'KAB. BANGKALAN',   'Jawa Timur', 'Madura', 'kabupaten', '3526'),
  ('Kab. Sampang',     'KAB. SAMPANG',     'Jawa Timur', 'Madura', 'kabupaten', '3527'),
  ('Kab. Pamekasan',   'KAB. PAMEKASAN',   'Jawa Timur', 'Madura', 'kabupaten', '3528'),
  ('Kab. Sumenep',     'KAB. SUMENEP',     'Jawa Timur', 'Madura', 'kabupaten', '3529'),

-- ── Banten — Kabupaten ────────────────────────────────────────────────────
  ('Kab. Pandeglang',  'KAB. PANDEGLANG',  'Banten', 'Jawa', 'kabupaten', '3601'),
  ('Kab. Lebak',       'KAB. LEBAK',       'Banten', 'Jawa', 'kabupaten', '3602'),
  ('Kab. Tangerang',   'KAB. TANGERANG',   'Banten', 'Jawa', 'kabupaten', '3603'),
  ('Kab. Serang',      'KAB. SERANG',      'Banten', 'Jawa', 'kabupaten', '3604'),

-- ── Banten — Kota (tambahan) ──────────────────────────────────────────────
  ('Tangerang Selatan','KOTA TANGERANG SELATAN','Banten', 'Jawa', 'kota', '3674'),

-- ── Bali — Kabupaten ──────────────────────────────────────────────────────
  ('Kab. Jembrana',    'KAB. JEMBRANA',    'Bali', 'Bali', 'kabupaten', '5101'),
  ('Kab. Tabanan',     'KAB. TABANAN',     'Bali', 'Bali', 'kabupaten', '5102'),
  ('Kab. Badung',      'KAB. BADUNG',      'Bali', 'Bali', 'kabupaten', '5103'),
  ('Kab. Gianyar',     'KAB. GIANYAR',     'Bali', 'Bali', 'kabupaten', '5104'),
  ('Kab. Klungkung',   'KAB. KLUNGKUNG',   'Bali', 'Bali', 'kabupaten', '5105'),
  ('Kab. Bangli',      'KAB. BANGLI',      'Bali', 'Bali', 'kabupaten', '5106'),
  ('Kab. Karangasem',  'KAB. KARANGASEM',  'Bali', 'Bali', 'kabupaten', '5107'),
  ('Kab. Buleleng',    'KAB. BULELENG',    'Bali', 'Bali', 'kabupaten', '5108'),

-- ── Lombok (NTB) — Kabupaten ──────────────────────────────────────────────
  ('Kab. Lombok Barat',  'KAB. LOMBOK BARAT',  'NTB', 'Lombok', 'kabupaten', '5201'),
  ('Kab. Lombok Tengah', 'KAB. LOMBOK TENGAH', 'NTB', 'Lombok', 'kabupaten', '5202'),
  ('Kab. Lombok Timur',  'KAB. LOMBOK TIMUR',  'NTB', 'Lombok', 'kabupaten', '5203'),
  ('Kab. Lombok Utara',  'KAB. LOMBOK UTARA',  'NTB', 'Lombok', 'kabupaten', '5208')

ON CONFLICT (kode_wilayah) DO NOTHING;
