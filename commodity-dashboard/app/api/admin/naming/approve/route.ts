import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, canonical_id, override_name } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getServiceClient()

    const { data: item, error: fetchErr } = await db
      .from('naming_queue')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    let resolvedId: string | null = canonical_id ?? item.canonical_id ?? null

    // If override_name is provided, find or create the entity with that name
    if (override_name?.trim()) {
      const name = override_name.trim()
      if (item.type === 'city') {
        const { data: existing } = await db
          .from('cities')
          .select('id')
          .ilike('name', name)
          .maybeSingle()
        if (existing) {
          resolvedId = existing.id
        } else {
          const { data: newCity } = await db
            .from('cities')
            .insert({ name, entity_type: 'kota', island: 'Jawa' })
            .select('id')
            .single()
          resolvedId = newCity?.id ?? null
        }
      } else if (item.type === 'commodity') {
        const { data: existing } = await db
          .from('commodities')
          .select('id')
          .ilike('name', name)
          .maybeSingle()
        if (existing) {
          resolvedId = existing.id
        } else {
          const { data: newComm } = await db
            .from('commodities')
            .insert({ name, unit: 'kg', is_sp2kp: false })
            .select('id')
            .single()
          resolvedId = newComm?.id ?? null
        }
      }
    }

    if (!resolvedId) {
      return NextResponse.json({ error: 'canonical_id or override_name required' }, { status: 400 })
    }

    // Update prices_raw city_id or commodity_id
    if (item.type === 'city') {
      await db
        .from('prices_raw')
        .update({ city_id: resolvedId })
        .eq('city_raw', item.raw_value)
        .is('city_id', null)
    } else if (item.type === 'commodity') {
      await db
        .from('prices_raw')
        .update({ commodity_id: resolvedId })
        .eq('commodity_raw', item.raw_value)
        .is('commodity_id', null)
    }

    // Mark approved
    await db
      .from('naming_queue')
      .update({
        status: 'approved',
        canonical_id: resolvedId,
        reviewed_at: new Date().toISOString(),
        reviewer_note: override_name?.trim() ? `manual: ${override_name.trim()}` : null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[naming/approve]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
