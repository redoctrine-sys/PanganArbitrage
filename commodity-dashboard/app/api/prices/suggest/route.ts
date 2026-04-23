import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Returns average recent price for a commodity+city combination
// Query: ?commodity_id=X&city_name=Y&days=30
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const commodityId = searchParams.get('commodity_id')
  const cityName = searchParams.get('city_name')
  const days = parseInt(searchParams.get('days') ?? '30')

  if (!commodityId || !cityName) {
    return NextResponse.json({ error: 'commodity_id and city_name required' }, { status: 400 })
  }

  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)

  // Match by city_raw (fuzzy contains) and commodity_id
  const { data, error } = await supabase
    .from('prices_raw')
    .select('price, date, city_raw')
    .eq('commodity_id', commodityId)
    .ilike('city_raw', `%${cityName}%`)
    .gte('date', dateFrom.toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data?.length) {
    return NextResponse.json({ avg: null, min: null, max: null, count: 0, latest_date: null })
  }

  const prices = data.map((r) => r.price)
  const avg = Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  return NextResponse.json({
    avg,
    min,
    max,
    count: data.length,
    latest_date: data[0].date,
  })
}
