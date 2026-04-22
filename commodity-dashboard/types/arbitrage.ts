export type ArbitrageOpportunity = {
  id: string
  date: string
  commodity_id: string
  city_buy_id: string
  city_sell_id: string
  price_buy: number
  price_sell: number
  price_buy_source: string | null
  price_sell_source: string | null
  gross_spread_pct: number
  route_type: string | null
  distance_km: number | null
  transport_vendor_id: string | null
  transport_cost_total: number | null
  net_profit_per_kg: number | null
  roi_pct: number | null
  viable: boolean | null
  risk_score: 'RENDAH' | 'SEDANG' | 'TINGGI' | null
  ai_recommendation: 'BELI' | 'TUNGGU' | 'HINDARI' | null
  ai_reasoning: string | null
  ai_timing: string | null
  ai_risk_flag: string | null
  ai_generated_at: string | null
  created_at: string
}

export type ManualLeg = {
  city_from: string
  city_to: string
  commodity: string
  price_buy: number
  price_sell: number
  quantity_kg: number
  transport_cost_per_kg: number
}
