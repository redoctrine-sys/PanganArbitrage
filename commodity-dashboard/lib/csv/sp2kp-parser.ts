import type { SP2KPRow } from '@/types/prices'

// SP2KP CSV format:
// Tanggal, Kode Wilayah, Provinsi, Kota/Kabupaten, Nama Komoditas, Harga, HET/HA
// Date can be DD/MM/YYYY or YYYY-MM-DD

export type ParsedCSV = {
  rows: SP2KPRow[]
  errors: string[]
  total: number
}

export function parseSP2KPCSV(csvText: string): ParsedCSV {
  const lines = csvText.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV kosong atau tidak valid'], total: 0 }
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const errors: string[] = []
  const rows: SP2KPRow[] = []

  // Detect column indices
  const idx = {
    date: findCol(header, ['tanggal', 'date', 'tgl']),
    kode: findCol(header, ['kode wilayah', 'kode_wilayah', 'kode']),
    province: findCol(header, ['provinsi', 'province', 'prov']),
    city: findCol(header, ['kota/kabupaten', 'kota', 'kabupaten', 'city', 'nama kota']),
    commodity: findCol(header, ['nama komoditas', 'komoditas', 'commodity', 'nama komoditi']),
    price: findCol(header, ['harga', 'price', 'harga (rp)', 'harga rp']),
    het: findCol(header, ['het', 'het/ha', 'ha', 'het (rp)']),
  }

  if (idx.date < 0) errors.push('Kolom tanggal tidak ditemukan')
  if (idx.city < 0) errors.push('Kolom kota tidak ditemukan')
  if (idx.commodity < 0) errors.push('Kolom komoditas tidak ditemukan')
  if (idx.price < 0) errors.push('Kolom harga tidak ditemukan')
  if (errors.length > 0) return { rows: [], errors, total: 0 }

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i])
    if (cols.length < 4) continue

    const rawDate = cols[idx.date]?.trim() ?? ''
    const parsedDate = parseDate(rawDate)
    if (!parsedDate) {
      errors.push(`Baris ${i + 1}: format tanggal tidak valid "${rawDate}"`)
      continue
    }

    const rawPrice = cols[idx.price]?.trim().replace(/[^0-9.,-]/g, '').replace(',', '') ?? ''
    const price = parseFloat(rawPrice)
    if (isNaN(price) || price <= 0) {
      errors.push(`Baris ${i + 1}: harga tidak valid "${cols[idx.price]}"`)
      continue
    }

    const rawHet = idx.het >= 0 ? cols[idx.het]?.trim().replace(/[^0-9.,-]/g, '').replace(',', '') : ''
    const het = rawHet ? parseFloat(rawHet) : null

    rows.push({
      date: parsedDate,
      city_raw: cols[idx.city]?.trim() ?? '',
      commodity_raw: cols[idx.commodity]?.trim() ?? '',
      price,
      het_ha: het && !isNaN(het) && het > 0 ? het : null,
      kode_wilayah: idx.kode >= 0 ? cols[idx.kode]?.trim() || null : null,
    })
  }

  return { rows, errors: errors.slice(0, 20), total: lines.length - 1 }
}

function findCol(header: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = header.findIndex((h) => h.includes(c))
    if (idx >= 0) return idx
  }
  return -1
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // DD/MM/YYYY
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // DD-MM-YYYY
  const m2 = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`
  return null
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
