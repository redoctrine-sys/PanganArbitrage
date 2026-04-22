export type PriceRaw = {
  id: string
  date: string
  city_raw: string
  commodity_raw: string
  city_id: string | null
  commodity_id: string | null
  price: number
  het_ha: number | null
  source: string
  kode_wilayah: string | null
  created_at: string
}

export type City = {
  id: string
  name: string
  name_sp2kp: string | null
  province: string | null
  island: 'Jawa' | 'Madura' | 'Bali' | 'Lombok' | null
  entity_type: 'kota' | 'kabupaten' | null
  kode_wilayah: string | null
  lat: number | null
  lng: number | null
}

export type Commodity = {
  id: string
  name: string
  unit: string
  category: string | null
  source_origin: string
  is_sp2kp: boolean
  created_at: string
}

export type SP2KPRow = {
  date: string
  city_raw: string
  commodity_raw: string
  price: number
  het_ha: number | null
  kode_wilayah: string | null
}

export type IngestResult = {
  inserted: number
  skipped: number
  errors: string[]
}
