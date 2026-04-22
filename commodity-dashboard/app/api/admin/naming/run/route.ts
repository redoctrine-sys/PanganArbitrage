import { NextResponse } from 'next/server'
import { runCityReview } from '@/lib/naming-agent'

export async function POST() {
  try {
    const result = await runCityReview()
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    console.error('[naming/run]', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
