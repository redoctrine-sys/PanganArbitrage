import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { pedagang_id, commodity_id, price, date, satuan } = body

    if (!pedagang_id || !commodity_id || !price) {
      return NextResponse.json({ error: 'pedagang_id, commodity_id, price wajib diisi' }, { status: 400 })
    }

    const db = getServiceClient()
    const { data, error } = await db
      .from('pedagang_harga')
      .insert({
        pedagang_id,
        commodity_id,
        price: Number(price),
        date: date ?? new Date().toISOString().split('T')[0],
        satuan: satuan ?? 'kg',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
