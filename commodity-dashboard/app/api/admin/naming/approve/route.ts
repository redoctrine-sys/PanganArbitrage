import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, canonical_id, note } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getServiceClient()

    // Get queue item
    const { data: item, error: fetchErr } = await db
      .from('naming_queue')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Update prices_raw city_id or commodity_id
    if (item.type === 'city' && canonical_id) {
      await db
        .from('prices_raw')
        .update({ city_id: canonical_id })
        .eq('city_raw', item.raw_value)
        .is('city_id', null)
    } else if (item.type === 'commodity' && canonical_id) {
      await db
        .from('prices_raw')
        .update({ commodity_id: canonical_id })
        .eq('commodity_raw', item.raw_value)
        .is('commodity_id', null)
    }

    // Mark approved
    await db
      .from('naming_queue')
      .update({
        status: 'approved',
        canonical_id: canonical_id ?? item.canonical_id,
        reviewed_at: new Date().toISOString(),
        reviewer_note: note ?? null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[naming/approve]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
