'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDate } from '@/lib/utils/date'
import PriceChart from '@/components/chart/PriceChart'
import CSVUploader from '@/components/csv/CSVUploader'
import EmptyState from '@/components/shared/EmptyState'

type City = { id: string; name: string; province: string | null }
type Commodity = { id: string; name: string; category: string | null; unit: string }
type PriceRow = { date: string; price: number; het_ha: number | null; city_raw: string; commodity_raw: string }
type Stats = { totalRows: number; lastDate: string | null; pendingCities: number; pendingComms: number }

type GroupedData = {
  city: City
  commodities: {
    commodity: Commodity
    latestPrice: number | null
    latestDate: string | null
    het: number | null
    history: { date: string; price: number; het_ha: number | null }[]
  }[]
}[]

export default function SP2KPPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'upload'>('data')
  const [cities, setCities] = useState<City[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [stats, setStats] = useState<Stats>({ totalRows: 0, lastDate: null, pendingCities: 0, pendingComms: 0 })
  const [grouped, setGrouped] = useState<GroupedData>([])
  const [loading, setLoading] = useState(true)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  const [expandedComms, setExpandedComms] = useState<Set<string>>(new Set())
  const [filterComm, setFilterComm] = useState('')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [citiesRes, commsRes, statsRes] = await Promise.all([
        supabase.from('cities').select('id, name, province').in('island', ['Jawa', 'Madura', 'Bali', 'Lombok']).order('name'),
        supabase.from('commodities').select('id, name, category, unit').eq('is_sp2kp', true).order('name'),
        // Get stats
        Promise.all([
          supabase.from('prices_raw').select('*', { count: 'exact', head: true }).eq('source', 'sp2kp'),
          supabase.from('prices_raw').select('date').eq('source', 'sp2kp').not('city_id', 'is', null).order('date', { ascending: false }).limit(1),
          supabase.from('prices_raw').select('*', { count: 'exact', head: true }).eq('source', 'sp2kp').is('city_id', null),
          supabase.from('prices_raw').select('*', { count: 'exact', head: true }).eq('source', 'sp2kp').is('commodity_id', null),
        ])
      ])

      const [totalRes, lastRes, pendCityRes, pendCommRes] = statsRes

      setCities(citiesRes.data ?? [])
      setCommodities(commsRes.data ?? [])
      setStats({
        totalRows: totalRes.count ?? 0,
        lastDate: lastRes.data?.[0]?.date ?? null,
        pendingCities: pendCityRes.count ?? 0,
        pendingComms: pendCommRes.count ?? 0,
      })

      // Load latest prices grouped by city + commodity
      const { data: prices } = await supabase
        .from('prices_raw')
        .select('city_id, commodity_id, date, price, het_ha')
        .eq('source', 'sp2kp')
        .not('city_id', 'is', null)
        .not('commodity_id', 'is', null)
        .order('date', { ascending: false })

      if (prices && citiesRes.data && commsRes.data) {
        // Group: city → commodity → latest price
        const grouped: Map<string, Map<string, { latest: typeof prices[0]; history: typeof prices }>> = new Map()

        for (const row of prices) {
          if (!row.city_id || !row.commodity_id) continue
          if (!grouped.has(row.city_id)) grouped.set(row.city_id, new Map())
          const cityMap = grouped.get(row.city_id)!
          if (!cityMap.has(row.commodity_id)) {
            cityMap.set(row.commodity_id, { latest: row, history: [] })
          }
          cityMap.get(row.commodity_id)!.history.push(row)
        }

        const result: GroupedData = []
        for (const city of citiesRes.data) {
          const cityMap = grouped.get(city.id)
          if (!cityMap) continue
          const commRows: GroupedData[0]['commodities'] = []
          for (const comm of commsRes.data) {
            const entry = cityMap.get(comm.id)
            if (!entry) continue
            commRows.push({
              commodity: comm,
              latestPrice: entry.latest.price,
              latestDate: entry.latest.date,
              het: entry.latest.het_ha,
              history: entry.history.slice(0, 60).reverse(),
            })
          }
          if (commRows.length > 0) {
            result.push({ city, commodities: commRows })
          }
        }
        setGrouped(result)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filteredGrouped = grouped.filter((g) => {
    if (search && !g.city.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).map((g) => ({
    ...g,
    commodities: g.commodities.filter((c) =>
      !filterComm || c.commodity.id === filterComm
    ),
  })).filter((g) => g.commodities.length > 0)

  function toggleCity(id: string) {
    setExpandedCities((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
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
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#1b5e3b' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Data SP2KP
          </h1>
          <span
            className="text-xs px-2 py-0.5 rounded font-mono ml-1"
            style={{ background: '#e8f3ec', color: '#1b5e3b' }}
          >
            Resmi
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Total Baris', value: stats.totalRows.toLocaleString('id-ID'), sub: 'harga' },
            { label: 'Update Terakhir', value: stats.lastDate ? formatDate(stats.lastDate) : '—', sub: '' },
            {
              label: 'Pending Kota',
              value: stats.pendingCities.toLocaleString(),
              sub: 'belum review',
              warn: stats.pendingCities > 0,
            },
            {
              label: 'Pending Komoditas',
              value: stats.pendingComms.toLocaleString(),
              sub: 'belum review',
              warn: stats.pendingComms > 0,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-lg px-3 py-2"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
            >
              <div
                className="text-xs font-mono font-semibold uppercase tracking-wide mb-1"
                style={{ color: '#8a8580', letterSpacing: '0.9px' }}
              >
                {s.label}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: (s as any).warn ? '#991b1b' : '#1a1612', fontFamily: 'Georgia, serif' }}
              >
                {s.value}
              </div>
              {s.sub && <div className="text-xs" style={{ color: '#8a8580' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Sub-tabs */}
        <div className="flex gap-1">
          {[
            { id: 'data', label: 'Data & Chart' },
            { id: 'upload', label: 'Upload CSV' },
          ].map((t) => (
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
            <CSVUploader onSuccess={() => loadData()} />
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
                {commodities.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setExpandedCities(new Set(filteredGrouped.map((g) => g.city.id)))
                }}
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
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>
                Memuat data...
              </div>
            ) : filteredGrouped.length === 0 ? (
              stats.totalRows > 0 ? (
                <EmptyState
                  icon="⏳"
                  title="Data tersimpan, menunggu review"
                  desc={`${stats.pendingCities.toLocaleString()} kota dan ${stats.pendingComms.toLocaleString()} komoditas belum disetujui Naming Agent`}
                  action={
                    <a
                      href="/dashboard/admin/naming"
                      className="px-3 py-1.5 rounded-md text-xs font-medium inline-block"
                      style={{ background: '#1b5e3b', color: '#e8f3ec' }}
                    >
                      Buka Naming Agent →
                    </a>
                  }
                />
              ) : (
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
              )
            ) : (
              <div className="divide-y" style={{ borderColor: '#d8d4cb' }}>
                {filteredGrouped.map((group) => {
                  const cityOpen = expandedCities.has(group.city.id)
                  return (
                    <div key={group.city.id}>
                      {/* City row (Level 1) */}
                      <button
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[#f0ece4] transition-colors"
                        onClick={() => toggleCity(group.city.id)}
                      >
                        <span
                          className="text-xs transition-transform"
                          style={{ color: '#8a8580', transform: cityOpen ? 'rotate(90deg)' : 'none' }}
                        >
                          ▶
                        </span>
                        <span className="font-semibold text-sm flex-1">{group.city.name}</span>
                        <span className="text-xs" style={{ color: '#8a8580' }}>
                          {group.city.province}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: '#e5e1d8', color: '#4a4540' }}
                        >
                          {group.commodities.length} komoditas
                        </span>
                      </button>

                      {/* Commodity rows (Level 2) */}
                      {cityOpen && (
                        <div style={{ background: '#fafaf8' }}>
                          {group.commodities.map((entry) => {
                            const commKey = `${group.city.id}-${entry.commodity.id}`
                            const commOpen = expandedComms.has(commKey)
                            return (
                              <div key={entry.commodity.id} style={{ borderTop: '1px solid #e5e1d8' }}>
                                <button
                                  className="w-full flex items-center gap-2 px-6 py-2 text-left hover:bg-[#f0ece4] transition-colors"
                                  onClick={() => toggleComm(commKey)}
                                >
                                  <span
                                    className="text-xs transition-transform flex-shrink-0"
                                    style={{
                                      color: '#8a8580',
                                      transform: commOpen ? 'rotate(90deg)' : 'none',
                                    }}
                                  >
                                    ▶
                                  </span>
                                  <span className="flex-1 text-xs font-medium">
                                    {entry.commodity.name}
                                  </span>
                                  {entry.commodity.category && (
                                    <span
                                      className="text-xs px-1.5 rounded font-mono"
                                      style={{ background: '#e8f3ec', color: '#1b5e3b' }}
                                    >
                                      {entry.commodity.category}
                                    </span>
                                  )}
                                  <span className="font-mono text-xs font-semibold">
                                    {formatRupiah(entry.latestPrice)}
                                  </span>
                                  <span className="text-xs" style={{ color: '#8a8580' }}>
                                    /{entry.commodity.unit}
                                  </span>
                                  <span className="text-xs ml-2" style={{ color: '#8a8580' }}>
                                    {entry.latestDate ? formatDate(entry.latestDate) : '—'}
                                  </span>
                                </button>

                                {/* Chart detail (Level 3) */}
                                {commOpen && (
                                  <div className="px-6 pb-4 pt-2" style={{ background: '#f5f1ea' }}>
                                    <div className="flex items-center gap-4 mb-2">
                                      <div>
                                        <div className="text-xs" style={{ color: '#8a8580' }}>
                                          Harga Terakhir
                                        </div>
                                        <div className="text-base font-bold font-mono">
                                          {formatRupiah(entry.latestPrice)}
                                        </div>
                                      </div>
                                      {entry.het != null && (
                                        <div>
                                          <div className="text-xs" style={{ color: '#8a8580' }}>
                                            HET Pemerintah
                                          </div>
                                          <div
                                            className="text-sm font-mono"
                                            style={{ color: '#ef4444' }}
                                          >
                                            {formatRupiah(entry.het)}
                                          </div>
                                        </div>
                                      )}
                                      <div>
                                        <div className="text-xs" style={{ color: '#8a8580' }}>
                                          Satuan
                                        </div>
                                        <div className="text-sm">/{entry.commodity.unit}</div>
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
