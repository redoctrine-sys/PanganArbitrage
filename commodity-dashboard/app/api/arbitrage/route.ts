import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const commodityId = searchParams.get('commodity_id')
  const minSpread = searchParams.get('min_spread')
  const viableOnly = searchParams.get('viable') === 'true'
  const date = searchParams.get('date')

  let query = supabase
    .from('arbitrage_opportunities')
    .select(`
      *,
      commodity:commodities(id, name, unit),
      city_buy:cities!city_buy_id(id, name, province),
      city_sell:cities!city_sell_id(id, name, province),
      vendor:transport_vendors(id, nama, moda)
    `)
    .order('gross_spread_pct', { ascending: false })

  if (commodityId) query = query.eq('commodity_id', commodityId)
  if (minSpread) query = query.gte('gross_spread_pct', Number(minSpread))
  if (viableOnly) query = query.eq('viable', true)
  if (date) query = query.eq('date', date)

  const { data, error } = await query.limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
