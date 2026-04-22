import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServiceClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const fromId = searchParams.get('from_id')
  const toId = searchParams.get('to_id')

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

  const { data, error } = await query.limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { city_from_id, city_to_id, distance_km, duration_hours, route_type } = body

    if (!city_from_id || !city_to_id || !distance_km) {
      return NextResponse.json({ error: 'city_from_id, city_to_id, distance_km wajib diisi' }, { status: 400 })
    }

    const db = getServiceClient()
    const { data, error } = await db
      .from('city_distances')
      .upsert({
        city_from_id,
        city_to_id,
        distance_km: Number(distance_km),
        duration_hours: duration_hours ? Number(duration_hours) : null,
        route_type: route_type ?? 'darat',
        source: 'manual',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'city_from_id,city_to_id' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
