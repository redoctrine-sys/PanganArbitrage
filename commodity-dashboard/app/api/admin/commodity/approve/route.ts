import { NextRequest, NextResponse } from 'next/server'
import { approveTypo, approvePair, approveAsNew } from '@/lib/naming-agent'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, action, canonical_id, pair_type, note } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'id and action required' }, { status: 400 })
    }

    switch (action) {
      case 'typo':
        if (!canonical_id) return NextResponse.json({ error: 'canonical_id required for typo' }, { status: 400 })
        await approveTypo(id, canonical_id, note)
        break
      case 'pair':
        if (!pair_type) return NextResponse.json({ error: 'pair_type required for pair' }, { status: 400 })
        await approvePair(id, pair_type, note)
        break
      case 'new':
        await approveAsNew(id, note)
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
