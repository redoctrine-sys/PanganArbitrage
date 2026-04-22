import { NextRequest, NextResponse } from 'next/server'
import { rejectItem } from '@/lib/naming-agent'

export async function POST(req: NextRequest) {
  try {
    const { id, note } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await rejectItem(id, note)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
