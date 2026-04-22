import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { analyzeArbitrageOpportunity, type ArbitrageContext } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { id, ids } = body as { id?: string; ids?: string[] }

    const db = getServiceClient()

    // Support single id or batch ids
    const targetIds = ids ?? (id ? [id] : [])
    if (!targetIds.length) {
      return NextResponse.json({ error: 'Provide id or ids' }, { status: 400 })
    }

    // Fetch opportunities with context
    const { data: opps, error } = await db
      .from('arbitrage_opportunities')
      .select(`
        id, gross_spread_pct, price_buy, price_sell,
        net_profit_per_kg, roi_pct, distance_km, route_type, risk_score,
        commodity:commodities(name),
        city_buy:cities!city_buy_id(name),
        city_sell:cities!city_sell_id(name)
      `)
      .in('id', targetIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!opps?.length) return NextResponse.json({ error: 'No opportunities found' }, { status: 404 })

    const results: { id: string; ok: boolean }[] = []

    for (const opp of opps) {
      const ctx: ArbitrageContext = {
        commodity: (opp.commodity as any)?.name ?? 'Unknown',
        city_buy: (opp.city_buy as any)?.name ?? 'Unknown',
        city_sell: (opp.city_sell as any)?.name ?? 'Unknown',
        price_buy: opp.price_buy,
        price_sell: opp.price_sell,
        gross_spread_pct: opp.gross_spread_pct,
        net_profit_per_kg: opp.net_profit_per_kg,
        roi_pct: opp.roi_pct,
        distance_km: opp.distance_km,
        route_type: opp.route_type,
        risk_score: opp.risk_score as any,
      }

      try {
        const rec = await analyzeArbitrageOpportunity(ctx)
        await db.from('arbitrage_opportunities').update({
          ai_recommendation: rec.recommendation,
          ai_reasoning: rec.reasoning,
          ai_timing: rec.timing,
          ai_risk_flag: rec.risk_flag,
          ai_generated_at: new Date().toISOString(),
        }).eq('id', opp.id)
        results.push({ id: opp.id, ok: true })
      } catch (err: any) {
        console.error('[arbitrage/ai]', opp.id, err.message)
        results.push({ id: opp.id, ok: false })
      }
    }

    return NextResponse.json({ success: true, results, analyzed: results.filter((r) => r.ok).length })
  } catch (err: any) {
    console.error('[arbitrage/ai]', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}

// GET — analyze top N viable opportunities without AI recommendation yet
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limitStr = searchParams.get('limit') ?? '10'
  const limit = Math.min(parseInt(limitStr, 10) || 10, 50)
  const date = searchParams.get('date')

  const db = getServiceClient()
  let query = db
    .from('arbitrage_opportunities')
    .select(`
      id, gross_spread_pct, price_buy, price_sell,
      net_profit_per_kg, roi_pct, distance_km, route_type, risk_score,
      commodity:commodities(name),
      city_buy:cities!city_buy_id(name),
      city_sell:cities!city_sell_id(name)
    `)
    .eq('viable', true)
    .is('ai_recommendation', null)
    .order('gross_spread_pct', { ascending: false })
    .limit(limit)

  if (date) query = query.eq('date', date)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data, count: data?.length ?? 0 })
}
