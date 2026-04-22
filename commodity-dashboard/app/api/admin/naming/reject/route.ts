import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { id, note } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const db = getServiceClient()
    await db
      .from('naming_queue')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewer_note: note ?? null,
      })
      .eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
