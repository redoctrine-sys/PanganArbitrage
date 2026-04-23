'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDate } from '@/lib/utils/date'
import PriceChart from '@/components/chart/PriceChart'
import CSVUploader from '@/components/csv/CSVUploader'
import EmptyState from '@/components/shared/EmptyState'

type Stats = { totalRows: number; lastDate: string | null; pendingNaming: number; kotaCount: number }

type CommEntry = {
  commRaw: string
  latestPrice: number
  latestDate: string
  het: number | null
  history: { date: string; price: number; het_ha: number | null }[]
}

type CityEntry = {
  cityRaw: string
  commodities: CommEntry[]
}

export default function SP2KPPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'upload'>('data')
  const [grouped, setGrouped] = useState<CityEntry[]>([])
  const [stats, setStats] = useState<Stats>({ totalRows: 0, lastDate: null, pendingNaming: 0, kotaCount: 0 })
  const [allComms, setAllComms] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  const [expandedComms, setExpandedComms] = useState<Set<string>>(new Set())
  const [filterComm, setFilterComm] = useState('')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - 30)

      const [pricesRes, totalRes, lastRes, pendingRes] = await Promise.all([
        supabase
          .from('prices_raw')
          .select('city_raw, commodity_raw, date, price, het_ha')
          .eq('source', 'sp2kp')
          .gte('date', dateFrom.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(25000),
        supabase.from('prices_raw').select('*', { count: 'exact', head: true }).eq('source', 'sp2kp'),
        supabase.from('prices_raw').select('date').eq('source', 'sp2kp').order('date', { ascending: false }).limit(1),
        supabase.from('naming_queue').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      const prices = pricesRes.data ?? []

      // Group: city_raw → commodity_raw → { latest + history }
      const cityMap = new Map<string, Map<string, {
        latestPrice: number
        latestDate: string
        het: number | null
        history: { date: string; price: number; het_ha: number | null }[]
      }>>()

      for (const row of prices) {
        if (!row.city_raw || !row.commodity_raw) continue
        if (!cityMap.has(row.city_raw)) cityMap.set(row.city_raw, new Map())
        const commMap = cityMap.get(row.city_raw)!
        if (!commMap.has(row.commodity_raw)) {
          commMap.set(row.commodity_raw, {
            latestPrice: row.price,
            latestDate: row.date,
            het: row.het_ha,
            history: [],
          })
        }
        commMap.get(row.commodity_raw)!.history.push({ date: row.date, price: row.price, het_ha: row.het_ha })
      }

      const result: CityEntry[] = [...cityMap.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], 'id'))
        .map(([cityRaw, commMap]) => ({
          cityRaw,
          commodities: [...commMap.entries()]
            .sort((a, b) => a[0].localeCompare(b[0], 'id'))
            .map(([commRaw, data]) => ({
              commRaw,
              latestPrice: data.latestPrice,
              latestDate: data.latestDate,
              het: data.het,
              history: data.history.slice(0, 60).reverse(),
            })),
        }))

      const commSet = new Set<string>()
      for (const city of result) {
        for (const c of city.commodities) commSet.add(c.commRaw)
      }

      setGrouped(result)
      setAllComms([...commSet].sort((a, b) => a.localeCompare(b, 'id')))
      setStats({
        totalRows: totalRes.count ?? 0,
        lastDate: lastRes.data?.[0]?.date ?? null,
        pendingNaming: pendingRes.count ?? 0,
        kotaCount: cityMap.size,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredGrouped = grouped
    .filter((g) => !search || g.cityRaw.toLowerCase().includes(search.toLowerCase()))
    .map((g) => ({
      ...g,
      commodities: g.commodities.filter((c) => !filterComm || c.commRaw === filterComm),
    }))
    .filter((g) => g.commodities.length > 0)

  function toggleCity(key: string) {
    setExpandedCities((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleComm(key: string) {
    setExpandedComms((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#1b5e3b' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Data SP2KP</h1>
          <span className="text-xs px-2 py-0.5 rounded font-mono ml-1" style={{ background: '#e8f3ec', color: '#1b5e3b' }}>Resmi</span>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Total Baris', value: stats.totalRows.toLocaleString('id-ID'), sub: 'semua tanggal' },
            { label: 'Kab/Kota', value: stats.kotaCount.toLocaleString(), sub: '30 hari terakhir' },
            { label: 'Update Terakhir', value: stats.lastDate ? formatDate(stats.lastDate) : '—', sub: '' },
            {
              label: 'Pending Naming',
              value: stats.pendingNaming.toLocaleString(),
              sub: 'untuk komparasi',
              warn: stats.pendingNaming > 0,
            },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg px-3 py-2" style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}>
              <div className="text-xs font-mono font-semibold uppercase tracking-wide mb-1" style={{ color: '#8a8580', letterSpacing: '0.9px' }}>
                {s.label}
              </div>
              <div className="text-lg font-bold" style={{ color: (s as any).warn ? '#b45309' : '#1a1612', fontFamily: 'Georgia, serif' }}>
                {s.value}
              </div>
              {s.sub && <div className="text-xs" style={{ color: '#8a8580' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1">
          {[{ id: 'data', label: 'Data & Chart' }, { id: 'upload', label: 'Upload CSV' }].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all border"
              style={{
                background: activeTab === t.id ? '#f5f1ea' : 'transparent',
                borderColor: activeTab === t.id ? '#c4bfb5' : 'transparent',
                color: activeTab === t.id ? '#1a1612' : '#8a8580',
                fontWeight: activeTab === t.id ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'upload' ? (
          <div className="p-4 max-w-xl">
            <div className="text-sm font-medium mb-3">Upload CSV SP2KP</div>
            <div className="text-xs mb-4" style={{ color: '#8a8580' }}>
              Format: Tanggal, Kode Wilayah, Provinsi, Kota/Kabupaten, Nama Komoditas, Harga, HET/HA
            </div>
            <CSVUploader onSuccess={() => { loadData(); setActiveTab('data') }} />
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div
              className="flex gap-2 items-center px-4 py-2 flex-wrap flex-shrink-0 sticky top-0 z-10"
              style={{ background: '#edeae2', borderBottom: '1px solid #d8d4cb' }}
            >
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs flex-1 max-w-48"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
              >
                <span style={{ color: '#8a8580' }}>🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari kota..."
                  className="border-none outline-none bg-transparent w-full text-xs"
                  style={{ color: '#1a1612' }}
                />
              </div>

              <select
                value={filterComm}
                onChange={(e) => setFilterComm(e.target.value)}
                className="px-2 py-1 rounded-md text-xs"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
              >
                <option value="">Semua komoditas</option>
                {allComms.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <button
                onClick={() => setExpandedCities(new Set(filteredGrouped.map((g) => g.cityRaw)))}
                className="px-2 py-1 rounded-md text-xs"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
              >
                Buka Semua
              </button>
              <button
                onClick={() => setExpandedCities(new Set())}
                className="px-2 py-1 rounded-md text-xs"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
              >
                Tutup Semua
              </button>

              <span className="text-xs ml-auto font-mono" style={{ color: '#8a8580' }}>
                {filteredGrouped.length} kota
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>
                Memuat data...
              </div>
            ) : filteredGrouped.length === 0 ? (
              <EmptyState
                icon="📭"
                title="Belum ada data SP2KP"
                desc="Upload CSV untuk memulai"
                action={
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium"
                    style={{ background: '#1b5e3b', color: '#e8f3ec' }}
                  >
                    Upload CSV
                  </button>
                }
              />
            ) : (
              <div className="divide-y" style={{ borderColor: '#d8d4cb' }}>
                {filteredGrouped.map((group) => {
                  const cityOpen = expandedCities.has(group.cityRaw)
                  return (
                    <div key={group.cityRaw}>
                      {/* City row (Level 1) */}
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[#f0ece4] transition-colors"
                        onClick={() => toggleCity(group.cityRaw)}
                      >
                        <span
                          className="text-xs flex-shrink-0"
                          style={{ color: '#8a8580', transform: cityOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}
                        >▶</span>
                        <span className="font-semibold text-sm flex-1">{group.cityRaw}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: '#e5e1d8', color: '#4a4540' }}>
                          {group.commodities.length} komoditas
                        </span>
                      </button>

                      {/* Commodity rows (Level 2) */}
                      {cityOpen && (
                        <div style={{ background: '#fafaf8' }}>
                          {group.commodities.map((entry) => {
                            const commKey = `${group.cityRaw}||${entry.commRaw}`
                            const commOpen = expandedComms.has(commKey)
                            return (
                              <div key={entry.commRaw} style={{ borderTop: '1px solid #e5e1d8' }}>
                                <button
                                  className="w-full flex items-center gap-2 px-6 py-2 text-left hover:bg-[#f0ece4] transition-colors"
                                  onClick={() => toggleComm(commKey)}
                                >
                                  <span
                                    className="text-xs flex-shrink-0"
                                    style={{ color: '#8a8580', transform: commOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', display: 'inline-block' }}
                                  >▶</span>
                                  <span className="flex-1 text-xs font-medium">{entry.commRaw}</span>
                                  <span className="font-mono text-xs font-semibold">{formatRupiah(entry.latestPrice)}</span>
                                  <span className="text-xs" style={{ color: '#8a8580' }}>/kg</span>
                                  <span className="text-xs ml-2" style={{ color: '#8a8580' }}>
                                    {formatDate(entry.latestDate)}
                                  </span>
                                </button>

                                {/* Chart detail (Level 3) */}
                                {commOpen && (
                                  <div className="px-6 pb-4 pt-2" style={{ background: '#f5f1ea' }}>
                                    <div className="flex items-center gap-4 mb-3">
                                      <div>
                                        <div className="text-xs" style={{ color: '#8a8580' }}>Harga Terakhir</div>
                                        <div className="text-base font-bold font-mono">{formatRupiah(entry.latestPrice)}</div>
                                      </div>
                                      {entry.het != null && (
                                        <div>
                                          <div className="text-xs" style={{ color: '#8a8580' }}>HET Pemerintah</div>
                                          <div className="text-sm font-mono" style={{ color: '#ef4444' }}>{formatRupiah(entry.het)}</div>
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-xs" style={{ color: '#8a8580' }}>Data points</div>
                                        <div className="text-sm font-mono">{entry.history.length}</div>
                                      </div>
                                    </div>
                                    <PriceChart
                                      data={entry.history}
                                      color="#1b5e3b"
                                      showHet={true}
                                      height={160}
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
