import { getServiceClient } from '@/lib/supabase'
import type { ArbitrageOpportunity } from '@/types/arbitrage'

// Phase A: gross spread dari komparasi_harga VIEW (Section A only)
// Dipanggil dari /api/arbitrage/compute
export async function computeArbitragePhaseA(date?: string): Promise<{
  computed: number
  saved: number
  errors: number
}> {
  const db = getServiceClient()
  const targetDate = date ?? new Date().toISOString().split('T')[0]

  // Get all komparasi rows where BOTH sources have prices (Section A)
  const { data: rows, error } = await db
    .from('komparasi_harga')
    .select('*')

  if (error || !rows?.length) return { computed: 0, saved: 0, errors: error ? 1 : 0 }

  // Group by commodity: find city pairs with price spread
  const byCommodity = new Map<string, typeof rows>()
  for (const row of rows) {
    if (!row.sp2kp_price || !row.pedagang_price) continue
    if (!byCommodity.has(row.commodity_id)) byCommodity.set(row.commodity_id, [])
    byCommodity.get(row.commodity_id)!.push(row)
  }

  let computed = 0, saved = 0, errors = 0
  const opportunities: Omit<ArbitrageOpportunity, 'id' | 'created_at'>[] = []

  for (const [commodityId, commodityRows] of byCommodity) {
    // Find all city pairs within same commodity
    for (let i = 0; i < commodityRows.length; i++) {
      for (let j = i + 1; j < commodityRows.length; j++) {
        const a = commodityRows[i]
        const b = commodityRows[j]

        // Use SP2KP as canonical price for spread calculation
        const priceA = a.sp2kp_price!
        const priceB = b.sp2kp_price!

        if (priceA === priceB) continue

        const buyRow = priceA < priceB ? a : b
        const sellRow = priceA < priceB ? b : a
        const buyPrice = Math.min(priceA, priceB)
        const sellPrice = Math.max(priceA, priceB)

        const grossSpreadPct = ((sellPrice - buyPrice) / buyPrice) * 100
        if (grossSpreadPct < 2) continue // Skip trivial spreads

        computed++
        opportunities.push({
          date: targetDate,
          commodity_id: commodityId,
          city_buy_id: buyRow.city_id,
          city_sell_id: sellRow.city_id,
          price_buy: buyPrice,
          price_sell: sellPrice,
          price_buy_source: 'sp2kp',
          price_sell_source: 'sp2kp',
          gross_spread_pct: Math.round(grossSpreadPct * 100) / 100,
          route_type: null,
          distance_km: null,
          transport_vendor_id: null,
          transport_cost_total: null,
          net_profit_per_kg: null,
          roi_pct: null,
          viable: null,
          risk_score: null,
          ai_recommendation: null,
          ai_reasoning: null,
          ai_timing: null,
          ai_risk_flag: null,
          ai_generated_at: null,
        })
      }
    }
  }

  // Batch upsert in chunks
  const CHUNK = 100
  for (let i = 0; i < opportunities.length; i += CHUNK) {
    const chunk = opportunities.slice(i, i + CHUNK)
    const { error: upsertErr } = await db
      .from('arbitrage_opportunities')
      .upsert(chunk, { onConflict: 'date,commodity_id,city_buy_id,city_sell_id' })

    if (upsertErr) errors++
    else saved += chunk.length
  }

  return { computed, saved, errors }
}

// Phase B: enrich dengan transport cost
export async function enrichWithTransport(date: string): Promise<{ enriched: number }> {
  const db = getServiceClient()

  // Get opportunities without transport cost
  const { data: opps } = await db
    .from('arbitrage_opportunities')
    .select('id, city_buy_id, city_sell_id, price_buy, price_sell, gross_spread_pct')
    .eq('date', date)
    .is('transport_cost_total', null)

  if (!opps?.length) return { enriched: 0 }

  // Get distances
  const { data: distances } = await db
    .from('city_distances')
    .select('city_from_id, city_to_id, distance_km, route_type')

  // Get vendors
  const { data: vendors } = await db
    .from('transport_vendors')
    .select('*')
    .eq('active', true)

  if (!distances?.length || !vendors?.length) return { enriched: 0 }

  const distMap = new Map<string, { distance_km: number; route_type: string | null }>()
  for (const d of distances) {
    distMap.set(`${d.city_from_id}:${d.city_to_id}`, d)
    distMap.set(`${d.city_to_id}:${d.city_from_id}`, d) // bidirectional
  }

  let enriched = 0
  for (const opp of opps) {
    const dist = distMap.get(`${opp.city_buy_id}:${opp.city_sell_id}`)
    if (!dist) continue

    // Pick cheapest vendor per kg (assume 1000 kg capacity)
    const QUANTITY_KG = 1000
    let bestCostPerKg = Infinity
    let bestVendorId: string | null = null

    for (const v of vendors) {
      let costPerKg: number | null = null
      if (v.price_type === 'per_km' && v.price_per_km) {
        costPerKg = (v.price_per_km * dist.distance_km) / QUANTITY_KG
      } else if (v.price_type === 'flat' && v.price_flat) {
        costPerKg = v.price_flat / QUANTITY_KG
      }
      if (costPerKg != null && costPerKg < bestCostPerKg) {
        bestCostPerKg = costPerKg
        bestVendorId = v.id
      }
    }

    if (bestVendorId === null || !isFinite(bestCostPerKg)) continue

    const transportCostTotal = bestCostPerKg * QUANTITY_KG
    const netProfitPerKg = opp.price_sell - opp.price_buy - bestCostPerKg
    const roi = (netProfitPerKg / (opp.price_buy + bestCostPerKg)) * 100
    const viable = netProfitPerKg > 0

    // Risk score based on spread
    const riskScore: 'RENDAH' | 'SEDANG' | 'TINGGI' =
      opp.gross_spread_pct > 20 ? 'RENDAH' :
      opp.gross_spread_pct > 10 ? 'SEDANG' : 'TINGGI'

    await db.from('arbitrage_opportunities').update({
      transport_vendor_id: bestVendorId,
      transport_cost_total: Math.round(transportCostTotal),
      net_profit_per_kg: Math.round(netProfitPerKg * 100) / 100,
      roi_pct: Math.round(roi * 100) / 100,
      viable,
      risk_score: riskScore,
      distance_km: dist.distance_km,
      route_type: dist.route_type,
    }).eq('id', opp.id)

    enriched++
  }

  return { enriched }
}
