'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDate } from '@/lib/utils/date'

type Opportunity = {
  id: string
  date: string
  gross_spread_pct: number
  price_buy: number
  price_sell: number
  net_profit_per_kg: number | null
  roi_pct: number | null
  viable: boolean | null
  risk_score: 'RENDAH' | 'SEDANG' | 'TINGGI' | null
  distance_km: number | null
  route_type: string | null
  ai_recommendation: 'BELI' | 'TUNGGU' | 'HINDARI' | null
  commodity?: { name: string; unit: string }
  city_buy?: { name: string; province: string | null }
  city_sell?: { name: string; province: string | null }
  vendor?: { nama: string; moda: string } | null
}

type Stats = { total: number; viable: number; lastComputed: string | null }

const RISK_STYLE: Record<string, { bg: string; color: string }> = {
  RENDAH: { bg: '#dcfce7', color: '#166534' },
  SEDANG: { bg: '#fef3c7', color: '#713f12' },
  TINGGI: { bg: '#fee2e2', color: '#991b1b' },
}

const REC_STYLE: Record<string, { bg: string; color: string }> = {
  BELI:   { bg: '#dcfce7', color: '#166534' },
  TUNGGU: { bg: '#fef3c7', color: '#713f12' },
  HINDARI:{ bg: '#fee2e2', color: '#991b1b' },
}

export default function ArbitraseAIPage() {
  const [opps, setOpps] = useState<Opportunity[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, viable: 0, lastComputed: null })
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [computeResult, setComputeResult] = useState<string | null>(null)
  const [filterViable, setFilterViable] = useState(false)
  const [filterMinSpread, setFilterMinSpread] = useState('')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterViable) params.set('viable', 'true')
      if (filterMinSpread) params.set('min_spread', filterMinSpread)

      const res = await fetch(`/api/arbitrage?${params}`)
      const data = await res.json()
      setOpps(data.data ?? [])

      const viable = (data.data ?? []).filter((o: Opportunity) => o.viable).length
      const lastDate = data.data?.[0]?.date ?? null
      setStats({ total: data.data?.length ?? 0, viable, lastComputed: lastDate })
    } finally {
      setLoading(false)
    }
  }, [filterViable, filterMinSpread])

  useEffect(() => { loadData() }, [loadData])

  async function runCompute(phase: 'A' | 'B') {
    setComputing(true)
    setComputeResult(null)
    try {
      const res = await fetch('/api/arbitrage/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase }),
      })
      const data = await res.json()
      if (data.result) {
        const r = data.result
        setComputeResult(
          phase === 'A'
            ? `Phase A: ${r.computed} pasangan dihitung, ${r.saved} disimpan`
            : `Phase B: ${r.enriched} peluang diperkaya dengan data transport`
        )
      }
      await loadData()
    } finally {
      setComputing(false)
    }
  }

  const filtered = opps.filter((o) => {
    if (!search) return true
    const s = search.toLowerCase()
    return (
      o.commodity?.name.toLowerCase().includes(s) ||
      o.city_buy?.name.toLowerCase().includes(s) ||
      o.city_sell?.name.toLowerCase().includes(s)
    )
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#7c2d12' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Arbitrase AI</h1>
          <span className="text-xs px-2 py-0.5 rounded font-mono ml-1" style={{ background: '#ffedd5', color: '#7c2d12' }}>
            Phase 4 — Gemini coming
          </span>
          <div className="ml-auto flex items-center gap-2">
            {computeResult && <span className="text-xs" style={{ color: '#166534' }}>{computeResult}</span>}
            <button onClick={() => runCompute('A')} disabled={computing}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: '#e5e1d8', color: '#1a1612' }}>
              ▶ Hitung Phase A
            </button>
            <button onClick={() => runCompute('B')} disabled={computing}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: '#1a1612', color: '#f5f1ea' }}>
              ▶ Enrich Transport
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Total Peluang', value: stats.total.toString() },
            { label: 'Viable', value: stats.viable.toString(), warn: false },
            { label: 'Terakhir Dihitung', value: stats.lastComputed ? formatDate(stats.lastComputed) : '—' },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg px-3 py-2"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}>
              <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: '#8a8580' }}>{s.label}</div>
              <div className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2 items-center px-4 py-2 flex-shrink-0"
        style={{ background: '#edeae2', borderBottom: '1px solid #d8d4cb' }}>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs flex-1 max-w-48"
          style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}>
          <span style={{ color: '#8a8580' }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari komoditas / kota..." className="border-none outline-none bg-transparent w-full text-xs" />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span style={{ color: '#8a8580' }}>Min spread:</span>
          <input value={filterMinSpread} onChange={(e) => setFilterMinSpread(e.target.value)}
            type="number" placeholder="5" className="w-12 px-1.5 py-1 rounded font-mono outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#f5f1ea' }} />
          <span style={{ color: '#8a8580' }}>%</span>
        </div>
        <button onClick={() => setFilterViable((v) => !v)}
          className="text-xs px-2.5 py-1 rounded-md font-medium"
          style={{
            background: filterViable ? '#dcfce7' : '#f5f1ea',
            border: `1px solid ${filterViable ? '#86efac' : '#d8d4cb'}`,
            color: filterViable ? '#166534' : '#4a4540',
          }}>
          ✓ Viable saja
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="text-4xl">📈</div>
            <div className="font-medium text-sm">Belum ada peluang arbitrase</div>
            <div className="text-xs mb-3" style={{ color: '#8a8580' }}>
              Klik "Hitung Phase A" untuk menganalisis spread dari data komparasi
            </div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#d8d4cb' }}>
            {filtered.map((o) => (
              <div key={o.id} className="px-4 py-3 hover:bg-[#fafaf8] transition-colors">
                <div className="flex items-start gap-3">
                  {/* Left: commodity + route */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{o.commodity?.name ?? '—'}</span>
                      {o.risk_score && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={RISK_STYLE[o.risk_score]}>
                          {o.risk_score}
                        </span>
                      )}
                      {o.ai_recommendation && (
                        <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={REC_STYLE[o.ai_recommendation]}>
                          {o.ai_recommendation}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: '#4a4540' }}>
                      <span className="font-medium">{o.city_buy?.name}</span>
                      <span style={{ color: '#8a8580' }}>{o.city_buy?.province}</span>
                      <span style={{ color: '#8a8580' }}>→</span>
                      <span className="font-medium">{o.city_sell?.name}</span>
                      <span style={{ color: '#8a8580' }}>{o.city_sell?.province}</span>
                      {o.distance_km && (
                        <span className="font-mono" style={{ color: '#8a8580' }}>· {o.distance_km} km</span>
                      )}
                    </div>
                    {o.vendor && (
                      <div className="text-xs mt-0.5" style={{ color: '#8a8580' }}>
                        via {o.vendor.nama} ({o.vendor.moda})
                      </div>
                    )}
                  </div>

                  {/* Right: prices + metrics */}
                  <div className="flex items-center gap-4 flex-shrink-0 text-right">
                    <div>
                      <div className="text-xs" style={{ color: '#8a8580' }}>Beli</div>
                      <div className="font-mono text-xs">{formatRupiah(o.price_buy)}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: '#8a8580' }}>Jual</div>
                      <div className="font-mono text-xs">{formatRupiah(o.price_sell)}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: '#8a8580' }}>Gross</div>
                      <div className="font-mono font-bold text-sm" style={{ color: '#166534' }}>
                        {o.gross_spread_pct.toFixed(1)}%
                      </div>
                    </div>
                    {o.net_profit_per_kg != null && (
                      <div>
                        <div className="text-xs" style={{ color: '#8a8580' }}>Net/kg</div>
                        <div className="font-mono text-xs" style={{ color: o.net_profit_per_kg >= 0 ? '#166534' : '#991b1b' }}>
                          {formatRupiah(o.net_profit_per_kg)}
                        </div>
                      </div>
                    )}
                    {o.roi_pct != null && (
                      <div>
                        <div className="text-xs" style={{ color: '#8a8580' }}>ROI</div>
                        <div className="font-mono text-xs font-bold"
                          style={{ color: o.roi_pct >= 0 ? '#166534' : '#991b1b' }}>
                          {o.roi_pct.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
