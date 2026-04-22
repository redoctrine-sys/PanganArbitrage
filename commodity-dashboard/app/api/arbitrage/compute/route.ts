import { NextRequest, NextResponse } from 'next/server'
import { computeArbitragePhaseA, enrichWithTransport } from '@/lib/analytics/arbitrage-engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const date = body.date ?? new Date().toISOString().split('T')[0]
    const phase = body.phase ?? 'A'

    if (phase === 'A') {
      const result = await computeArbitragePhaseA(date)
      return NextResponse.json({ success: true, phase: 'A', date, result })
    }

    if (phase === 'B') {
      const result = await enrichWithTransport(date)
      return NextResponse.json({ success: true, phase: 'B', date, result })
    }

    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
  } catch (err: any) {
    console.error('[arbitrage/compute]', err)
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 })
  }
}
