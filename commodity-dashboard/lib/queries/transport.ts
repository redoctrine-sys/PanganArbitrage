import { supabase } from '@/lib/supabase'
import type { TransportVendor, CityDistance } from '@/types/transport'

export async function getTransportVendors(): Promise<TransportVendor[]> {
  const { data, error } = await supabase
    .from('transport_vendors')
    .select('*')
    .eq('active', true)
    .order('nama')
  if (error) throw error
  return data as TransportVendor[]
}

export async function getCityDistances(fromId?: string, toId?: string) {
  let query = supabase
    .from('city_distances')
    .select(`
      *,
      city_from:cities!city_from_id(id, name, province),
      city_to:cities!city_to_id(id, name, province)
    `)
    .order('distance_km')

  if (fromId) query = query.eq('city_from_id', fromId)
  if (toId) query = query.eq('city_to_id', toId)

  const { data, error } = await query.limit(500)
  if (error) throw error
  return data
}

export async function getTransportCostEstimate(
  distanceKm: number,
  vendor: TransportVendor,
  quantityKg: number
): Promise<number | null> {
  if (vendor.price_type === 'per_km' && vendor.price_per_km) {
    const totalCost = vendor.price_per_km * distanceKm
    return quantityKg > 0 ? totalCost / quantityKg : null
  }
  if (vendor.price_type === 'flat' && vendor.price_flat) {
    return quantityKg > 0 ? vendor.price_flat / quantityKg : null
  }
  return null
}
