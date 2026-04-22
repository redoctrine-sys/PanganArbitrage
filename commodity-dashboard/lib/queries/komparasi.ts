import { supabase } from '@/lib/supabase'
import type { KomparasiRow, SectionBItem } from '@/types/komparasi'

export async function getKomparasi(filters?: {
  island?: string
  province?: string
  commodityId?: string
}) {
  let query = supabase.from('komparasi_harga').select('*')

  if (filters?.island) query = query.eq('island', filters.island)
  if (filters?.province) query = query.eq('province', filters.province)
  if (filters?.commodityId) query = query.eq('commodity_id', filters.commodityId)

  const { data, error } = await query
  if (error) throw error
  return data as KomparasiRow[]
}

export async function getSectionBSP2KP(): Promise<SectionBItem[]> {
  const { data, error } = await supabase.rpc('get_sp2kp_only_commodities')
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    commodity_id: r.commodity_id,
    commodity_name: r.commodity_name,
    city_count: r.city_count,
  }))
}

export async function getSectionBPedagang(): Promise<SectionBItem[]> {
  const { data, error } = await supabase.rpc('get_pedagang_only_commodities')
  if (error) throw error
  return (data ?? []).map((r: any) => ({
    commodity_id: r.commodity_id,
    commodity_name: r.commodity_name,
    pedagang_count: r.pedagang_count,
  }))
}
