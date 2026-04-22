import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('transport_vendors')
    .select('*')
    .eq('active', true)
    .order('nama')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nama, kontak, moda, price_type, price_per_km, price_flat, kapasitas_kg, cakupan, catatan } = body

    if (!nama || !moda || !price_type) {
      return NextResponse.json({ error: 'nama, moda, price_type wajib diisi' }, { status: 400 })
    }
    if (price_type === 'per_km' && !price_per_km) {
      return NextResponse.json({ error: 'price_per_km wajib untuk type per_km' }, { status: 400 })
    }
    if (price_type === 'flat' && !price_flat) {
      return NextResponse.json({ error: 'price_flat wajib untuk type flat' }, { status: 400 })
    }

    const db = getServiceClient()
    const { data, error } = await db
      .from('transport_vendors')
      .insert({
        nama,
        kontak: kontak || null,
        moda,
        price_type,
        price_per_km: price_per_km ? Number(price_per_km) : null,
        price_flat: price_flat ? Number(price_flat) : null,
        kapasitas_kg: kapasitas_kg ? Number(kapasitas_kg) : null,
        cakupan: cakupan || null,
        catatan: catatan || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
