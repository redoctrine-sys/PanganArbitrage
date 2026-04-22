import { NextResponse } from 'next/server'
import { runCommodityReview } from '@/lib/naming-agent'

export async function POST() {
  try {
    const result = await runCommodityReview()
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[commodity/run]', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
