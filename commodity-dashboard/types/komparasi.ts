export type KomparasiRow = {
  city_id: string
  city_name: string
  province: string | null
  island: string | null
  entity_type: string | null
  commodity_id: string
  commodity_name: string
  category: string | null
  is_sp2kp: boolean
  sp2kp_price: number | null
  sp2kp_date: string | null
  pedagang_price: number | null
  pedagang_date: string | null
  pedagang_count: number | null
  pedagang_via_pair: boolean
  mismatch_pct: number | null
  is_mismatch: boolean
  volatility_pct: number | null
}

export type SectionBItem = {
  commodity_id: string
  commodity_name: string
  city_count?: number
  pedagang_count?: number
}
