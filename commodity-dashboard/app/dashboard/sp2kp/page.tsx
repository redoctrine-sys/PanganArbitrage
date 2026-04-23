'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDateShort } from '@/lib/utils/date'
import CSVUploader from '@/components/csv/CSVUploader'
import EmptyState from '@/components/shared/EmptyState'
import MiniSparkline from '@/components/sp2kp/MiniSparkline'
import CommodityChart from '@/components/sp2kp/CommodityChart'
import {
  aggregate,
  PROVINCE_LIST,
  type CityEntry,
  type RawRow,
} from '@/lib/sp2kp/aggregate'

function ChangePill({ val }: { val: number | null }) {
  if (val == null) return <span style={{ color: '#c4bfb5', fontSize: 11 }}>—</span>
  const up = val > 0
  const down = val < 0
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full font-mono text-xs font-semibold"
      style={{
        background: up ? '#fee2e2' : down ? '#dcfce7' : '#e5e1d8',
        color: up ? '#dc2626' : down ? '#166534' : '#6b7280',
      }}
    >
      {up ? '▲' : down ? '▼' : ''}
      {Math.abs(val).toFixed(1)}%
    </span>
  )
}

function VolPill({ val }: { val: number }) {
  const high = val > 15
  const med = val > 8
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-full font-mono text-xs"
      style={{
        background: high ? '#fef3c7' : med ? '#fef9c3' : '#e5e1d8',
        color: high ? '#92400e' : med ? '#713f12' : '#6b7280',
      }}
    >
      {val.toFixed(1)}%
    </span>
  )
}

export default function SP2KPPage() {
  const [activeTab, setActiveTab] = useState<'data' | 'upload'>('data')
  const [grouped, setGrouped] = useState<CityEntry[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [lastDate, setLastDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  const [expandedComms, setExpandedComms] = useState<Set<string>>(new Set())
  const [filterProvince, setFilterProvince] = useState('Semua')
  const [filterComm, setFilterComm] = useState('')
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - 60)

      const [pricesRes, totalRes, lastRes] = await Promise.all([
        supabase
          .from('prices_raw')
          .select('city_raw, commodity_raw, date, price, het_ha, kode_wilayah')
          .eq('source', 'sp2kp')
          .gte('date', dateFrom.toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(50000),
        supabase
          .from('prices_raw')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'sp2kp'),
        supabase
          .from('prices_raw')
          .select('date')
          .eq('source', 'sp2kp')
          .order('date', { ascending: false })
          .limit(1),
      ])

      const rows = (pricesRes.data ?? []) as RawRow[]
      setGrouped(aggregate(rows))
      setTotalRows(totalRes.count ?? 0)
      setLastDate(lastRes.data?.[0]?.date ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const allComms = useMemo(() => {
    const s = new Set<string>()
    for (const g of grouped) for (const c of g.commodities) s.add(c.commRaw)
    return [...s].sort((a, b) => a.localeCompare(b, 'id'))
  }, [grouped])

  const filtered = useMemo(() => {
    return grouped
      .filter((g) => filterProvince === 'Semua' || g.province === filterProvince)
      .filter((g) => !search || g.cityRaw.toLowerCase().includes(search.toLowerCase()))
      .map((g) => ({
        ...g,
        commodities: g.commodities.filter((c) => !filterComm || c.commRaw === filterComm),
      }))
      .filter((g) => g.commodities.length > 0)
  }, [grouped, filterProvince, search, filterComm])

  const toggle = (s: Set<string>, k: string, set: (v: Set<string>) => void) => {
    const n = new Set(s)
    n.has(k) ? n.delete(k) : n.add(k)
    set(n)
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
            Resmi · 8 Provinsi Target
          </span>
        </div>

        <div className="flex gap-2 mb-3 flex-wrap">
          {[
            { label: 'Total Baris', value: totalRows.toLocaleString('id-ID'), sub: 'semua tanggal' },
            { label: 'Kab/Kota', value: grouped.length.toLocaleString(), sub: '60 hari terakhir' },
            { label: 'Komoditas', value: allComms.length.toLocaleString(), sub: 'dalam scope' },
            { label: 'Update Terakhir', value: lastDate ? formatDateShort(lastDate) : '—', sub: '' },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-lg px-3 py-2 min-w-24"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
            >
              <div
                className="text-xs font-mono font-semibold uppercase tracking-wide mb-1"
                style={{ color: '#8a8580' }}
              >
                {s.label}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: '#1a1612', fontFamily: 'Georgia, serif' }}
              >
                {s.value}
              </div>
              {s.sub && (
                <div className="text-xs" style={{ color: '#8a8580' }}>
                  {s.sub}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-1">
          {[
            { id: 'data', label: 'Data & Chart' },
            { id: 'upload', label: 'Upload CSV' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as 'data' | 'upload')}
              className="px-3 py-1 rounded-md text-xs font-medium border"
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

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'upload' ? (
          <div className="p-4 max-w-xl">
            <div className="text-sm font-medium mb-3">Upload CSV SP2KP</div>
            <div className="text-xs mb-4" style={{ color: '#8a8580' }}>
              Format: Tanggal, Kode Wilayah, Provinsi, Kota/Kabupaten, Nama Komoditas, Harga, HET/HA
            </div>
            <CSVUploader
              onSuccess={() => {
                loadData()
                setActiveTab('data')
              }}
            />
          </div>
        ) : (
          <>
            {/* Filter bar */}
            <div
              className="flex gap-2 items-center px-4 py-2 flex-wrap flex-shrink-0 sticky top-0 z-20"
              style={{ background: '#edeae2', borderBottom: '1px solid #d8d4cb' }}
            >
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', width: 180 }}
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

              <div className="flex gap-1 flex-wrap">
                {PROVINCE_LIST.map((p) => (
                  <button
                    key={p}
                    onClick={() => setFilterProvince(p)}
                    className="px-2 py-0.5 rounded text-xs transition-all"
                    style={{
                      background: filterProvince === p ? '#1b5e3b' : '#f5f1ea',
                      color: filterProvince === p ? '#e8f3ec' : '#4a4540',
                      border: `1px solid ${filterProvince === p ? '#1b5e3b' : '#d8d4cb'}`,
                      fontWeight: filterProvince === p ? 600 : 400,
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <select
                value={filterComm}
                onChange={(e) => setFilterComm(e.target.value)}
                className="px-2 py-1 rounded-md text-xs"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
              >
                <option value="">Semua komoditas</option>
                {allComms.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <div className="flex gap-1">
                <button
                  onClick={() => setExpandedCities(new Set(filtered.map((g) => g.cityRaw)))}
                  className="px-2 py-1 rounded-md text-xs"
                  style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
                >
                  Buka Semua
                </button>
                <button
                  onClick={() => {
                    setExpandedCities(new Set())
                    setExpandedComms(new Set())
                  }}
                  className="px-2 py-1 rounded-md text-xs"
                  style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
                >
                  Tutup
                </button>
              </div>

              <span className="text-xs font-mono ml-auto" style={{ color: '#8a8580' }}>
                {filtered.length} kota
              </span>
            </div>

            {/* Column headers */}
            <div
              className="flex items-center px-4 py-1.5 text-xs font-medium"
              style={{ background: '#e5e1d8', color: '#6b6560', borderBottom: '1px solid #d8d4cb' }}
            >
              <div className="w-6 flex-shrink-0 text-center">#</div>
              <div className="flex-1 ml-2">Kota / Provinsi</div>
              <div className="w-28 text-right">Harga Rata-rata</div>
              <div className="w-16 text-center">Ubah</div>
              <div className="w-16 text-center">Volatilitas</div>
              <div className="w-16 text-center">Tren</div>
              <div className="w-4" />
            </div>

            {loading ? (
              <div
                className="flex items-center justify-center py-16 text-xs"
                style={{ color: '#8a8580' }}
              >
                Memuat data...
              </div>
            ) : filtered.length === 0 ? (
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
                {filtered.map((group, gIdx) => {
                  const cityOpen = expandedCities.has(group.cityRaw)
                  return (
                    <div key={group.cityRaw}>
                      {/* Level 1: City */}
                      <button
                        className="w-full flex items-center px-4 py-2.5 text-left hover:bg-[#f0ece4] transition-colors"
                        onClick={() =>
                          toggle(expandedCities, group.cityRaw, setExpandedCities)
                        }
                      >
                        <div
                          className="w-6 flex-shrink-0 text-center text-xs font-mono"
                          style={{ color: '#8a8580' }}
                        >
                          {gIdx + 1}
                        </div>
                        <div className="flex-1 ml-2 min-w-0">
                          <div className="font-semibold text-sm truncate">{group.cityRaw}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="text-xs px-1.5 py-0 rounded font-medium"
                              style={{ background: '#e8f3ec', color: '#1b5e3b' }}
                            >
                              {group.province}
                            </span>
                            <span className="text-xs" style={{ color: '#8a8580' }}>
                              {group.commodities.length} komoditas
                            </span>
                          </div>
                        </div>
                        <div className="w-28 text-right text-sm font-mono font-semibold">
                          {formatRupiah(group.avgLatestPrice)}
                        </div>
                        <div className="w-16 flex justify-center">
                          <ChangePill val={group.avgChange} />
                        </div>
                        <div className="w-16 flex justify-center">
                          <VolPill val={group.avgVol} />
                        </div>
                        <div className="w-16 flex justify-center">
                          <MiniSparkline vals={group.spark} />
                        </div>
                        <div
                          className="w-4 text-xs flex-shrink-0"
                          style={{ color: '#8a8580' }}
                        >
                          <span
                            style={{
                              transform: cityOpen ? 'rotate(90deg)' : 'none',
                              display: 'inline-block',
                              transition: 'transform 0.15s',
                            }}
                          >
                            ▶
                          </span>
                        </div>
                      </button>

                      {cityOpen && (
                        <div style={{ background: '#fafaf8' }}>
                          {/* Level 2 header */}
                          <div
                            className="flex items-center px-8 py-1 text-xs"
                            style={{ background: '#f0ece4', color: '#8a8580' }}
                          >
                            <div className="w-6 flex-shrink-0 text-center">#</div>
                            <div className="flex-1 ml-2">Komoditas</div>
                            <div className="w-28 text-right">Harga</div>
                            <div className="w-16 text-center">vs Kemarin</div>
                            <div className="w-16 text-center">Volatilitas</div>
                            <div className="w-16 text-center">vs Avg</div>
                            <div className="w-4" />
                          </div>

                          {group.commodities.map((entry, cIdx) => {
                            const commKey = `${group.cityRaw}||${entry.commRaw}`
                            const commOpen = expandedComms.has(commKey)
                            const aboveHet =
                              entry.het != null && entry.latestPrice > entry.het
                            return (
                              <div
                                key={entry.commRaw}
                                style={{ borderTop: '1px solid #e5e1d8' }}
                              >
                                <button
                                  className="w-full flex items-center px-8 py-2 text-left hover:bg-[#f0ece4] transition-colors"
                                  onClick={() =>
                                    toggle(expandedComms, commKey, setExpandedComms)
                                  }
                                >
                                  <div
                                    className="w-6 flex-shrink-0 text-center text-xs font-mono"
                                    style={{ color: '#8a8580' }}
                                  >
                                    {cIdx + 1}
                                  </div>
                                  <div className="flex-1 ml-2 min-w-0">
                                    <div className="text-xs font-medium truncate">
                                      {entry.commRaw}
                                    </div>
                                    <div className="text-xs" style={{ color: '#8a8580' }}>
                                      {formatDateShort(entry.latestDate)}
                                      {aboveHet && (
                                        <span
                                          className="ml-1.5 font-semibold"
                                          style={{ color: '#dc2626' }}
                                        >
                                          · Di atas HET
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div
                                    className="w-28 text-right font-mono text-sm font-semibold"
                                    style={{ color: aboveHet ? '#dc2626' : '#1a1612' }}
                                  >
                                    {formatRupiah(entry.latestPrice)}
                                  </div>
                                  <div className="w-16 flex justify-center">
                                    <ChangePill val={entry.changeVsYest} />
                                  </div>
                                  <div className="w-16 flex justify-center">
                                    <VolPill val={entry.volatility} />
                                  </div>
                                  <div className="w-16 flex justify-center">
                                    <ChangePill val={entry.changeVsAvg} />
                                  </div>
                                  <div
                                    className="w-4 text-xs flex-shrink-0"
                                    style={{ color: '#8a8580' }}
                                  >
                                    <span
                                      style={{
                                        transform: commOpen ? 'rotate(90deg)' : 'none',
                                        display: 'inline-block',
                                        transition: 'transform 0.15s',
                                      }}
                                    >
                                      ▶
                                    </span>
                                  </div>
                                </button>

                                {commOpen && (
                                  <CommodityChart cityRaw={group.cityRaw} entry={entry} />
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
