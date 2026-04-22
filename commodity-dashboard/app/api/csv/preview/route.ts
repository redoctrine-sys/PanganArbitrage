import { NextRequest, NextResponse } from 'next/server'
import { parseSP2KPCSV } from '@/lib/csv/sp2kp-parser'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    const text = await file.text()
    const { rows, errors, total } = parseSP2KPCSV(text)

    return NextResponse.json({
      preview: rows.slice(0, 20),
      total,
      valid: rows.length,
      errors,
    })
  } catch (err) {
    console.error('[csv/preview]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
