import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { approveTypo, approvePair, approveAsNew } from '@/lib/naming-agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, canonical_id, pair_type, note, override_name } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    }

    const db = getServiceClient()

    // Resolve override_name to a canonical commodity ID
    let resolvedCanonicalId: string | undefined = canonical_id
    if (override_name?.trim() && (action === 'typo' || action === 'new')) {
      const name = override_name.trim()
      const { data: existing } = await db
        .from('commodities')
        .select('id')
        .ilike('name', name)
        .maybeSingle()
      if (existing) {
        resolvedCanonicalId = existing.id
      } else {
        const { data: newComm } = await db
          .from('commodities')
          .insert({ name, unit: 'kg', is_sp2kp: false })
          .select('id')
          .single()
        resolvedCanonicalId = newComm?.id
      }
    }

    const resolvedNote = override_name?.trim() ? `manual: ${override_name.trim()}` : note

    switch (action) {
      case 'typo':
        if (!resolvedCanonicalId) return NextResponse.json({ error: 'canonical_id or override_name required for typo' }, { status: 400 })
        await approveTypo(id, resolvedCanonicalId, resolvedNote)
        break
      case 'pair':
        if (!pair_type) return NextResponse.json({ error: 'pair_type required for pair' }, { status: 400 })
        await approvePair(id, pair_type, note)
        break
      case 'new':
        if (resolvedCanonicalId) {
          // User provided override_name → link to that commodity instead of Section B
          await approveTypo(id, resolvedCanonicalId, resolvedNote)
        } else {
          await approveAsNew(id, note)
        }
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[commodity/approve]', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
