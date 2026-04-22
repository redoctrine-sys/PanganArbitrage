import { supabase } from '@/lib/supabase'
import type { PriceRaw } from '@/types/prices'

export async function getSP2KPPrices(filters?: {
  cityId?: string
  commodityId?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  let query = supabase
    .from('prices_raw')
    .select('*')
    .eq('source', 'sp2kp')
    .order('date', { ascending: false })

  if (filters?.cityId) query = query.eq('city_id', filters.cityId)
  if (filters?.commodityId) query = query.eq('commodity_id', filters.commodityId)
  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom)
  if (filters?.dateTo) query = query.lte('date', filters.dateTo)
  if (filters?.limit) query = query.limit(filters.limit)

  const { data, error } = await query
  if (error) throw error
  return data as PriceRaw[]
}

export async function getPriceHistory(cityId: string, commodityId: string, days = 30) {
  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)

  const { data, error } = await supabase
    .from('prices_raw')
    .select('date, price, het_ha, source')
    .eq('city_id', cityId)
    .eq('commodity_id', commodityId)
    .gte('date', dateFrom.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (error) throw error
  return data
}

export async function getSP2KPStats() {
  const { data, error } = await supabase
    .from('prices_raw')
    .select('date, city_id, commodity_id')
    .eq('source', 'sp2kp')
    .not('city_id', 'is', null)
    .not('commodity_id', 'is', null)
    .order('date', { ascending: false })
    .limit(1)

  if (error) throw error

  const { count: totalRows } = await supabase
    .from('prices_raw')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'sp2kp')

  const { count: pendingCities } = await supabase
    .from('prices_raw')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'sp2kp')
    .is('city_id', null)

  const { count: pendingComms } = await supabase
    .from('prices_raw')
    .select('*', { count: 'exact', head: true })
    .eq('source', 'sp2kp')
    .is('commodity_id', null)

  return {
    lastDate: data?.[0]?.date ?? null,
    totalRows: totalRows ?? 0,
    pendingCities: pendingCities ?? 0,
    pendingComms: pendingComms ?? 0,
  }
}
