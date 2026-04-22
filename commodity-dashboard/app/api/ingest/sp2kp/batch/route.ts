import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import type { SP2KPRow } from '@/types/prices'

// Accepts pre-parsed rows as JSON — avoids Vercel 4.5MB body limit on file uploads
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rows: SP2KPRow[] = body.rows ?? []

    if (!rows.length) {
      return NextResponse.json({ error: 'Tidak ada baris' }, { status: 400 })
    }

    const db = getServiceClient()
    let inserted = 0
    let skipped = 0
    const insertErrors: string[] = []

    const CHUNK = 500
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map((r) => ({
        date: r.date,
        city_raw: r.city_raw,
        commodity_raw: r.commodity_raw,
        price: r.price,
        het_ha: r.het_ha,
        kode_wilayah: r.kode_wilayah,
        source: 'sp2kp',
      }))

      const { data, error } = await db
        .from('prices_raw')
        .upsert(chunk, {
          onConflict: 'date,city_raw,commodity_raw,source',
          ignoreDuplicates: true,
        })
        .select('id')

      if (error) {
        insertErrors.push(error.message)
      } else {
        inserted += data?.length ?? 0
        skipped += chunk.length - (data?.length ?? 0)
      }
    }

    return NextResponse.json({
      success: true,
      result: { inserted, skipped, errors: insertErrors.slice(0, 10) },
      total: rows.length,
    })
  } catch (err) {
    console.error('[ingest/sp2kp/batch]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
