import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const cityId = searchParams.get('city_id')
  const commodityId = searchParams.get('commodity_id')
  const source = searchParams.get('source') ?? 'sp2kp'
  const days = parseInt(searchParams.get('days') ?? '30')

  const dateFrom = new Date()
  dateFrom.setDate(dateFrom.getDate() - days)

  let query = supabase
    .from('prices_raw')
    .select('date, price, het_ha, source, city_id, commodity_id')
    .eq('source', source)
    .gte('date', dateFrom.toISOString().split('T')[0])
    .order('date', { ascending: true })

  if (cityId) query = query.eq('city_id', cityId)
  if (commodityId) query = query.eq('commodity_id', commodityId)

  const { data, error } = await query.limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
