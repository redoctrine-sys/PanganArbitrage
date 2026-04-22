'use client'

import { useState, useEffect, useCallback } from 'react'
import type { KomparasiRow, SectionBItem } from '@/types/komparasi'
import SectionA from '@/components/komparasi/SectionA'
import SectionB from '@/components/komparasi/SectionB'

const ISLANDS = ['Jawa', 'Bali', 'Lombok', 'Madura']

type Stats = {
  totalPairs: number
  mismatchCount: number
  avgMismatchPct: number
  withBothSources: number
}

function calcStats(rows: KomparasiRow[]): Stats {
  const withBoth = rows.filter((r) => r.sp2kp_price != null && r.pedagang_price != null)
  const mismatches = withBoth.filter((r) => r.is_mismatch)
  const avgMismatch = mismatches.length
    ? mismatches.reduce((s, r) => s + (r.mismatch_pct ?? 0), 0) / mismatches.length
    : 0
  return {
    totalPairs: rows.length,
    withBothSources: withBoth.length,
    mismatchCount: mismatches.length,
    avgMismatchPct: avgMismatch,
  }
}

export default function KomparasiPage() {
  const [rows, setRows] = useState<KomparasiRow[]>([])
  const [sectionBSP2KP, setSectionBSP2KP] = useState<SectionBItem[]>([])
  const [sectionBPedagang, setSectionBPedagang] = useState<SectionBItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterIsland, setFilterIsland] = useState('')
  const [filterComm, setFilterComm] = useState('')
  const [search, setSearch] = useState('')
  const [showMismatchOnly, setShowMismatchOnly] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterIsland) params.set('island', filterIsland)

      const [mainRes, bSP2KPRes, bPedRes] = await Promise.all([
        fetch(`/api/komparasi?${params}`),
        fetch('/api/komparasi?section=b-sp2kp'),
        fetch('/api/komparasi?section=b-pedagang'),
      ])
      const [mainData, bSP2KP, bPed] = await Promise.all([
        mainRes.json(), bSP2KPRes.json(), bPedRes.json()
      ])

      setRows(mainData.data ?? [])
      setSectionBSP2KP(bSP2KP.data ?? [])
      setSectionBPedagang(bPed.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterIsland])

  useEffect(() => { loadData() }, [loadData])

  // Client-side filter
  const filtered = rows.filter((r) => {
    if (search && !r.city_name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterComm && r.commodity_id !== filterComm) return false
    if (showMismatchOnly && !r.is_mismatch) return false
    return true
  })

  const stats = calcStats(rows)
  const uniqueCommodities = [...new Map(rows.map((r) => [r.commodity_id, r.commodity_name])).entries()]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#4c1d95' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Komparasi Harga
          </h1>
          <span
            className="text-xs px-2 py-0.5 rounded font-mono ml-1"
            style={{ background: '#ede9fe', color: '#4c1d95' }}
          >
            SP2KP vs Pedagang
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Pasangan Data', value: stats.withBothSources.toString(), sub: 'kota × komoditas' },
            {
              label: 'Mismatch',
              value: stats.mismatchCount.toString(),
              sub: `≥5% selisih`,
              warn: stats.mismatchCount > 0,
            },
            {
              label: 'Avg Selisih',
              value: stats.mismatchCount > 0 ? `${stats.avgMismatchPct.toFixed(1)}%` : '—',
              sub: 'hanya mismatch',
            },
            {
              label: 'Total Baris',
              value: stats.totalPairs.toString(),
              sub: 'incl. single-source',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-lg px-3 py-2"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
            >
              <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: '#8a8580', letterSpacing: '0.9px' }}>
                {s.label}
              </div>
              <div
                className="text-lg font-bold"
                style={{ color: (s as any).warn ? '#991b1b' : '#1a1612', fontFamily: 'Georgia, serif' }}
              >
                {s.value}
              </div>
              <div className="text-xs" style={{ color: '#8a8580' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="flex gap-2 items-center px-4 py-2 flex-shrink-0 flex-wrap"
        style={{ background: '#edeae2', borderBottom: '1px solid #d8d4cb' }}
      >
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs flex-1 max-w-44"
          style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
        >
          <span style={{ color: '#8a8580' }}>🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kota..."
            className="border-none outline-none bg-transparent w-full text-xs"
          />
        </div>

        <select
          value={filterIsland}
          onChange={(e) => setFilterIsland(e.target.value)}
          className="text-xs px-2 py-1 rounded-md"
          style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
        >
          <option value="">Semua pulau</option>
          {ISLANDS.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>

        <select
          value={filterComm}
          onChange={(e) => setFilterComm(e.target.value)}
          className="text-xs px-2 py-1 rounded-md"
          style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#4a4540' }}
        >
          <option value="">Semua komoditas</option>
          {uniqueCommodities.map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        <button
          onClick={() => setShowMismatchOnly((v) => !v)}
          className="text-xs px-2.5 py-1 rounded-md font-medium transition-colors"
          style={{
            background: showMismatchOnly ? '#fee2e2' : '#f5f1ea',
            border: `1px solid ${showMismatchOnly ? '#fca5a5' : '#d8d4cb'}`,
            color: showMismatchOnly ? '#991b1b' : '#4a4540',
          }}
        >
          ⚠ Mismatch saja
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>
            Memuat data komparasi...
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="text-4xl">📊</div>
            <div className="font-medium text-sm">Belum ada data komparasi</div>
            <div className="text-xs" style={{ color: '#8a8580' }}>
              Pastikan data SP2KP sudah diupload dan naming review sudah diapprove
            </div>
          </div>
        ) : (
          <>
            <SectionA rows={filtered} />
            <SectionB
              sp2kpOnly={sectionBSP2KP}
              pedagangOnly={sectionBPedagang}
            />
          </>
        )}
      </div>
    </div>
  )
}
