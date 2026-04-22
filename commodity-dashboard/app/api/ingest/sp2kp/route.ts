import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase'
import { parseSP2KPCSV } from '@/lib/csv/sp2kp-parser'
import type { IngestResult } from '@/types/prices'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    const text = await file.text()
    const { rows, errors, total } = parseSP2KPCSV(text)

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada baris valid', parseErrors: errors, total },
        { status: 400 }
      )
    }

    const db = getServiceClient()
    let inserted = 0
    let skipped = 0
    const insertErrors: string[] = []

    // Batch insert in chunks of 500
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

    const result: IngestResult = {
      inserted,
      skipped,
      errors: [...errors, ...insertErrors].slice(0, 20),
    }

    return NextResponse.json({ success: true, result, total })
  } catch (err) {
    console.error('[ingest/sp2kp]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
