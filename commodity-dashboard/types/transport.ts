export type TransportVendor = {
  id: string
  nama: string
  kontak: string | null
  moda: 'truk' | 'pickup' | 'ekspedisi' | 'kapal' | 'motor' | 'lainnya' | null
  price_type: 'per_km' | 'flat' | null
  price_per_km: number | null
  price_flat: number | null
  kapasitas_kg: number | null
  cakupan: string[] | null
  catatan: string | null
  active: boolean
  created_at: string
}

export type CityDistance = {
  id: string
  city_from_id: string
  city_to_id: string
  distance_km: number
  duration_hours: number | null
  route_type: 'darat' | 'darat+ferry' | 'ferry' | null
  source: string
  updated_at: string
}
