import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const island = searchParams.get('island')
  const province = searchParams.get('province')
  const commodityId = searchParams.get('commodity_id')
  const section = searchParams.get('section') // 'a' | 'b-sp2kp' | 'b-pedagang'

  if (section === 'b-sp2kp') {
    const { data, error } = await supabase.rpc('get_sp2kp_only_commodities')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (section === 'b-pedagang') {
    const { data, error } = await supabase.rpc('get_pedagang_only_commodities')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Section A: komparasi_harga VIEW
  let query = supabase.from('komparasi_harga').select('*')
  if (island) query = query.eq('island', island)
  if (province) query = query.eq('province', province)
  if (commodityId) query = query.eq('commodity_id', commodityId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
