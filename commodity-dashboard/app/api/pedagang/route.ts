import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('pedagang')
    .select(`
      *,
      city:cities(id, name, province),
      harga:pedagang_harga(
        id, price, date, satuan,
        commodity:commodities(id, name, unit)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nama, no_hp, city_id, lokasi_detail, keterangan } = body

    if (!nama || !city_id) {
      return NextResponse.json({ error: 'nama dan city_id wajib diisi' }, { status: 400 })
    }

    const db = getServiceClient()
    const { data, error } = await db
      .from('pedagang')
      .insert({ nama, no_hp, city_id, lokasi_detail, keterangan })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
