import { supabase } from '@/lib/supabase'
import type { ArbitrageOpportunity } from '@/types/arbitrage'

export async function getArbitrageOpportunities(filters?: {
  commodityId?: string
  minSpread?: number
  viable?: boolean
  date?: string
  limit?: number
}) {
  let query = supabase
    .from('arbitrage_opportunities')
    .select(`
      *,
      commodity:commodities(id, name, unit),
      city_buy:cities!city_buy_id(id, name, province),
      city_sell:cities!city_sell_id(id, name, province)
    `)
    .order('gross_spread_pct', { ascending: false })

  if (filters?.commodityId) query = query.eq('commodity_id', filters.commodityId)
  if (filters?.minSpread) query = query.gte('gross_spread_pct', filters.minSpread)
  if (filters?.viable != null) query = query.eq('viable', filters.viable)
  if (filters?.date) query = query.eq('date', filters.date)

  const { data, error } = await query.limit(filters?.limit ?? 200)
  if (error) throw error
  return data as (ArbitrageOpportunity & {
    commodity?: { id: string; name: string; unit: string }
    city_buy?: { id: string; name: string; province: string | null }
    city_sell?: { id: string; name: string; province: string | null }
  })[]
}

export async function getArbitrageStats() {
  const { count: total } = await supabase
    .from('arbitrage_opportunities')
    .select('*', { count: 'exact', head: true })

  const { count: viable } = await supabase
    .from('arbitrage_opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('viable', true)

  const { data: latest } = await supabase
    .from('arbitrage_opportunities')
    .select('date')
    .order('created_at', { ascending: false })
    .limit(1)

  return {
    total: total ?? 0,
    viable: viable ?? 0,
    lastComputed: latest?.[0]?.date ?? null,
  }
}
