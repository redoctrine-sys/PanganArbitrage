import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { getOSRMDistance } from '@/lib/osrm'

// Compute OSRM distance for a single pair of cities
export async function POST(req: NextRequest) {
  try {
    const { city_from_id, city_to_id } = await req.json()
    if (!city_from_id || !city_to_id) {
      return NextResponse.json({ error: 'city_from_id and city_to_id required' }, { status: 400 })
    }

    const db = getServiceClient()

    const [fromRes, toRes] = await Promise.all([
      db.from('cities').select('id, name, lat, lng').eq('id', city_from_id).single(),
      db.from('cities').select('id, name, lat, lng').eq('id', city_to_id).single(),
    ])

    if (!fromRes.data?.lat || !toRes.data?.lat) {
      return NextResponse.json({ error: 'Koordinat kota belum tersedia' }, { status: 400 })
    }

    const result = await getOSRMDistance(
      Number(fromRes.data.lat), Number(fromRes.data.lng),
      Number(toRes.data.lat), Number(toRes.data.lng)
    )

    if (!result) {
      return NextResponse.json({ error: 'OSRM tidak dapat menghitung rute' }, { status: 422 })
    }

    // Save to city_distances
    await db.from('city_distances').upsert({
      city_from_id,
      city_to_id,
      distance_km: result.distance_km,
      duration_hours: result.duration_hours,
      route_type: result.route_type,
      source: 'osrm',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'city_from_id,city_to_id' })

    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
