import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  // Aggregate prices_raw by date + source to show upload history
  const { data, error } = await supabase
    .from('prices_raw')
    .select('date, source, city_id, commodity_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by date + source
  const grouped = new Map<string, {
    date: string
    source: string
    total: number
    resolved: number
    unresolved: number
    firstAt: string
  }>()

  for (const row of data ?? []) {
    const key = `${row.date}:${row.source}`
    if (!grouped.has(key)) {
      grouped.set(key, {
        date: row.date,
        source: row.source,
        total: 0,
        resolved: 0,
        unresolved: 0,
        firstAt: row.created_at,
      })
    }
    const entry = grouped.get(key)!
    entry.total++
    if (row.city_id && row.commodity_id) {
      entry.resolved++
    } else {
      entry.unresolved++
    }
    if (row.created_at < entry.firstAt) entry.firstAt = row.created_at
  }

  const result = Array.from(grouped.values()).sort((a, b) =>
    b.date.localeCompare(a.date) || a.source.localeCompare(b.source)
  )

  return NextResponse.json({ data: result })
}
