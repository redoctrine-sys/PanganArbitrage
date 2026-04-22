import type { SP2KPRow } from '@/types/prices'

export type ParsedCSV = {
  rows: SP2KPRow[]
  errors: string[]
  total: number
}

export function parseSP2KPCSV(csvText: string): ParsedCSV {
  // Remove BOM if present
  const text = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  if (lines.length < 2) {
    return { rows: [], errors: ['CSV kosong atau tidak valid'], total: 0 }
  }

  const firstLine = lines[0]

  // Auto-detect delimiter: tab, semicolon, or comma
  const tabCount = (firstLine.match(/\t/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length
  const commaCount = (firstLine.match(/,/g) ?? []).length
  const delimiter = tabCount > semicolonCount && tabCount > commaCount ? '\t'
    : semicolonCount > commaCount ? ';' : ','

  const header = splitCSVLine(firstLine, delimiter).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''))

  // Detect format: wide (tanggal sebagai kolom) vs long (ada kolom "tanggal")
  const hasDateCol = findCol(header, ['tanggal', 'date', 'tgl']) >= 0
  const dateColIndices = findDateColumns(header)

  // Debug: if neither format detected, show diagnostic
  if (!hasDateCol && dateColIndices.length === 0) {
    const sample = header.slice(0, 8).join(' | ')
    const delName = delimiter === '\t' ? 'TAB' : delimiter
    return {
      rows: [],
      errors: [`Format tidak dikenali. Delimiter: "${delName}", Kolom pertama: [${sample}]`],
      total: 0,
    }
  }

  if (!hasDateCol && dateColIndices.length > 0) {
    return parseWideFormat(lines, header, dateColIndices, delimiter)
  }
  return parseLongFormat(lines, header, delimiter)
}

// Wide format: No | Kode Wilayah | Provinsi | Kabupaten | Komoditas | HET/HA | 2/1/2026 | 5/1/2026 | ...
function parseWideFormat(
  lines: string[],
  header: string[],
  dateColIndices: { col: number; date: string }[],
  delimiter: string
): ParsedCSV {
  const errors: string[] = []
  const rows: SP2KPRow[] = []

  const idx = {
    kode: findCol(header, ['kode wilayah', 'kode_wilayah', 'kode']),
    province: findCol(header, ['provinsi', 'province', 'prov']),
    city: findCol(header, ['kabupaten', 'kota/kabupaten', 'kota', 'city', 'nama kota']),
    commodity: findCol(header, ['komoditas', 'nama komoditas', 'commodity', 'nama komoditi']),
    het: findCol(header, ['het/ha', 'het', 'ha', 'het (rp)']),
  }

  if (idx.city < 0) errors.push('Kolom kabupaten/kota tidak ditemukan')
  if (idx.commodity < 0) errors.push('Kolom komoditas tidak ditemukan')
  if (errors.length > 0) return { rows: [], errors, total: 0 }

  let rowCount = 0
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i], delimiter)
    if (cols.length < 4) continue

    const cityRaw = cols[idx.city]?.trim() ?? ''
    const commodityRaw = cols[idx.commodity]?.trim() ?? ''
    if (!cityRaw || !commodityRaw) continue

    const kode = idx.kode >= 0 ? cols[idx.kode]?.trim() || null : null

    const rawHet = idx.het >= 0 ? cleanNumber(cols[idx.het]) : ''
    const het = rawHet ? parseFloat(rawHet) : null

    for (const { col, date } of dateColIndices) {
      const rawPrice = cleanNumber(cols[col] ?? '')
      const price = parseFloat(rawPrice)
      if (!rawPrice || isNaN(price) || price <= 0) continue

      rowCount++
      rows.push({
        date,
        city_raw: cityRaw,
        commodity_raw: commodityRaw,
        price,
        het_ha: het && !isNaN(het) && het > 0 ? het : null,
        kode_wilayah: kode,
      })
    }
  }

  return { rows, errors: errors.slice(0, 20), total: rowCount }
}

// Long format: Tanggal | Kode Wilayah | Provinsi | Kota | Komoditas | Harga | HET/HA
function parseLongFormat(lines: string[], header: string[], delimiter: string): ParsedCSV {
  const errors: string[] = []
  const rows: SP2KPRow[] = []

  const idx = {
    date: findCol(header, ['tanggal', 'date', 'tgl']),
    kode: findCol(header, ['kode wilayah', 'kode_wilayah', 'kode']),
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
    const cols = splitCSVLine(lines[i], delimiter)
    if (cols.length < 4) continue

    const parsedDate = parseDate(cols[idx.date]?.trim() ?? '')
    if (!parsedDate) {
      errors.push(`Baris ${i + 1}: format tanggal tidak valid`)
      continue
    }

    const rawPrice = cleanNumber(cols[idx.price] ?? '')
    const price = parseFloat(rawPrice)
    if (!rawPrice || isNaN(price) || price <= 0) continue

    const rawHet = idx.het >= 0 ? cleanNumber(cols[idx.het] ?? '') : ''
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

// Find columns whose header looks like a date (D/M/YYYY, YYYY-MM-DD, or Excel serial)
function findDateColumns(header: string[]): { col: number; date: string }[] {
  const result: { col: number; date: string }[] = []
  for (let i = 0; i < header.length; i++) {
    const raw = header[i].trim()
    const d = parseDate(raw) ?? parseExcelSerial(raw)
    if (d) result.push({ col: i, date: d })
  }
  return result
}

// Excel stores dates as integers (days since Jan 0, 1900). Range 2000-2040 ≈ 36526-54787
function parseExcelSerial(raw: string): string | null {
  const n = parseInt(raw, 10)
  if (isNaN(n) || raw !== String(n)) return null // must be a plain integer
  if (n < 36526 || n > 54787) return null // outside year 2000-2040
  // Excel epoch: Dec 30, 1899 (with leap year bug offset)
  const ms = (n - 25569) * 86400 * 1000
  const d = new Date(ms)
  if (isNaN(d.getTime())) return null
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function findCol(header: string[], candidates: string[]): number {
  for (const c of candidates) {
    const idx = header.findIndex((h) => h.includes(c))
    if (idx >= 0) return idx
  }
  return -1
}

function cleanNumber(raw: string): string {
  return raw.trim().replace(/[^0-9.,-]/g, '').replace(',', '.')
}

function parseDate(raw: string): string | null {
  if (!raw) return null
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  // D/M/YYYY or DD/MM/YYYY or D/M/YY (Indonesian: day/month/year)
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (m) {
    const day = parseInt(m[1], 10)
    const month = parseInt(m[2], 10)
    let year = parseInt(m[3], 10)
    if (year < 100) year += 2000
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }
  // DD-MM-YYYY
  const m2 = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/)
  if (m2) {
    let year = parseInt(m2[3], 10)
    if (year < 100) year += 2000
    return `${year}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`
  }
  return null
}

function splitCSVLine(line: string, delimiter = ','): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
