import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServiceClient } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('cities')
    .select('id, name, province, island, entity_type, kode_wilayah, lat, lng')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, lat, lng } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getServiceClient()
    const { error } = await db
      .from('cities')
      .update({ lat: lat ?? null, lng: lng ?? null })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
