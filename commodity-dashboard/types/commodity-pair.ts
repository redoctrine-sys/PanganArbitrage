export type CommodityPair = {
  id: string
  commodity_a_id: string
  commodity_b_id: string
  similarity_score: number | null
  pair_type: 'exact' | 'variant' | 'comparable' | null
  approved_at: string | null
  notes: string | null
  created_at: string
}
