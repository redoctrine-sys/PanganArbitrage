import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const island = searchParams.get('island')
  const province = searchParams.get('province')
  const commodityId = searchParams.get('commodity_id')

  let query = supabase.from('komparasi_harga').select('*')
  if (island) query = query.eq('island', island)
  if (province) query = query.eq('province', province)
  if (commodityId) query = query.eq('commodity_id', commodityId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}
