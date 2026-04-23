export const KODE_PROVINCE: Record<string, string> = {
  '31': 'DKI Jakarta',
  '32': 'Jawa Barat',
  '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta',
  '35': 'Jawa Timur',
  '36': 'Banten',
  '51': 'Bali',
  '52': 'NTB',
}

export const ALLOWED_PREFIXES = new Set(Object.keys(KODE_PROVINCE))
export const PROVINCE_LIST = ['Semua', ...Object.values(KODE_PROVINCE)]

export type HistPoint = { date: string; price: number; het_ha: number | null }

export type CommEntry = {
  commRaw: string
  latestPrice: number
  latestDate: string
  prevPrice: number | null
  avgPrice: number
  changeVsYest: number | null
  changeVsAvg: number
  volatility: number
  het: number | null
  history: HistPoint[]
  rank: number
  totalCities: number
}

export type CityEntry = {
  cityRaw: string
  province: string
  commodities: CommEntry[]
  avgLatestPrice: number
  avgChange: number | null
  avgVol: number
  spark: number[]
}

export type RawRow = {
  city_raw: string | null
  commodity_raw: string | null
  date: string
  price: number
  het_ha: number | null
  kode_wilayah: string | null
}

function pct(a: number, b: number) {
  return b ? ((a - b) / b) * 100 : 0
}

export function aggregate(rawRows: RawRow[]): CityEntry[] {
  // Filter to target provinces via kode_wilayah prefix
  const rows = rawRows.filter((r) => {
    if (!r.city_raw || !r.commodity_raw || !r.kode_wilayah) return false
    return ALLOWED_PREFIXES.has(String(r.kode_wilayah).slice(0, 2))
  })

  // Group: city -> commodity -> { points, kodePrefix }
  type Acc = { points: HistPoint[]; kodePrefix: string }
  const cityMap = new Map<string, Map<string, Acc>>()

  for (const row of rows) {
    const prefix = String(row.kode_wilayah).slice(0, 2)
    if (!cityMap.has(row.city_raw!)) cityMap.set(row.city_raw!, new Map())
    const commMap = cityMap.get(row.city_raw!)!
    if (!commMap.has(row.commodity_raw!)) {
      commMap.set(row.commodity_raw!, { points: [], kodePrefix: prefix })
    }
    commMap.get(row.commodity_raw!)!.points.push({
      date: row.date,
      price: row.price,
      het_ha: row.het_ha,
    })
  }

  // Pass 1: build rank map across all cities per commodity (by latest price ascending)
  const rankMap = new Map<string, { cityRaw: string; price: number }[]>()
  for (const [cityRaw, commMap] of cityMap) {
    for (const [commRaw, acc] of commMap) {
      if (!acc.points.length) continue
      const latest = acc.points[acc.points.length - 1].price
      if (!rankMap.has(commRaw)) rankMap.set(commRaw, [])
      rankMap.get(commRaw)!.push({ cityRaw, price: latest })
    }
  }
  for (const arr of rankMap.values()) arr.sort((a, b) => a.price - b.price)

  // Pass 2: build CityEntry[]
  const result: CityEntry[] = []

  for (const [cityRaw, commMap] of cityMap) {
    const comms: CommEntry[] = []
    let kodePrefix = ''

    for (const [commRaw, acc] of commMap) {
      kodePrefix = acc.kodePrefix
      const pts = acc.points
      if (!pts.length) continue

      const latest = pts[pts.length - 1]
      const prev = pts.length >= 2 ? pts[pts.length - 2] : null
      const priceVals = pts.map((p) => p.price)
      const avg = priceVals.reduce((a, b) => a + b, 0) / priceVals.length
      const mn = Math.min(...priceVals)
      const mx = Math.max(...priceVals)
      const vol = avg ? ((mx - mn) / avg) * 100 : 0
      const het = pts.find((p) => p.het_ha)?.het_ha ?? null

      const rankArr = rankMap.get(commRaw) ?? []
      const rankIdx = rankArr.findIndex((r) => r.cityRaw === cityRaw)

      comms.push({
        commRaw,
        latestPrice: latest.price,
        latestDate: latest.date,
        prevPrice: prev?.price ?? null,
        avgPrice: avg,
        changeVsYest: prev ? pct(latest.price, prev.price) : null,
        changeVsAvg: pct(latest.price, avg),
        volatility: vol,
        het,
        history: pts,
        rank: rankIdx + 1,
        totalCities: rankArr.length,
      })
    }

    if (!comms.length) continue

    const latestPrices = comms.map((c) => c.latestPrice)
    const avgLatest = latestPrices.reduce((a, b) => a + b, 0) / latestPrices.length
    const changes = comms
      .map((c) => c.changeVsYest)
      .filter((v): v is number => v != null)
    const vols = comms.map((c) => c.volatility)

    // Sparkline: avg price per day across commodities, last 7 days
    const perDate = new Map<string, number[]>()
    for (const c of comms) {
      for (const p of c.history.slice(-14)) {
        if (!perDate.has(p.date)) perDate.set(p.date, [])
        perDate.get(p.date)!.push(p.price)
      }
    }
    const spark = [...perDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([, ps]) => ps.reduce((a, b) => a + b, 0) / ps.length)

    result.push({
      cityRaw,
      province: KODE_PROVINCE[kodePrefix] ?? 'Lainnya',
      commodities: comms.sort((a, b) => a.commRaw.localeCompare(b.commRaw, 'id')),
      avgLatestPrice: avgLatest,
      avgChange: changes.length ? changes.reduce((a, b) => a + b, 0) / changes.length : null,
      avgVol: vols.length ? vols.reduce((a, b) => a + b, 0) / vols.length : 0,
      spark,
    })
  }

  return result.sort((a, b) => a.cityRaw.localeCompare(b.cityRaw, 'id'))
}

export type Timeframe = 'D' | 'W' | 'M'

export function sliceByTimeframe(history: HistPoint[], tf: Timeframe): HistPoint[] {
  if (!history.length || tf === 'M') return history
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (tf === 'D' ? 7 : 30))
  const cutStr = cutoff.toISOString().split('T')[0]
  return history.filter((h) => h.date >= cutStr)
}
