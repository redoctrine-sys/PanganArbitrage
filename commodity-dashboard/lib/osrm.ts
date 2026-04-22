// OSRM public routing server — hanya untuk Jawa/Bali/Lombok
// Dokumentasi: http://router.project-osrm.org

const OSRM_BASE = 'http://router.project-osrm.org/route/v1/driving'

type OSRMResult = {
  distance_km: number
  duration_hours: number
  route_type: 'darat' | 'darat+ferry' | 'ferry'
}

export async function getOSRMDistance(
  fromLat: number, fromLng: number,
  toLat: number, toLng: number
): Promise<OSRMResult | null> {
  try {
    const url = `${OSRM_BASE}/${fromLng},${fromLat};${toLng},${toLat}?overview=false`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return null

    const data = await res.json()
    if (data.code !== 'Ok' || !data.routes?.length) return null

    const route = data.routes[0]
    return {
      distance_km: Math.round(route.distance / 1000 * 10) / 10,
      duration_hours: Math.round(route.duration / 3600 * 10) / 10,
      route_type: 'darat', // OSRM driving = darat
    }
  } catch {
    return null
  }
}

export async function batchComputeDistances(
  pairs: { from_id: string; to_id: string; from_lat: number; from_lng: number; to_lat: number; to_lng: number }[]
): Promise<{ from_id: string; to_id: string; result: OSRMResult | null }[]> {
  const results = []
  for (const pair of pairs) {
    const result = await getOSRMDistance(pair.from_lat, pair.from_lng, pair.to_lat, pair.to_lng)
    results.push({ from_id: pair.from_id, to_id: pair.to_id, result })
    // Rate limit: 1 req/sec untuk public OSRM
    await new Promise((r) => setTimeout(r, 1100))
  }
  return results
}
