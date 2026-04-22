'use client'

import { useState, useCallback } from 'react'
import type { KomparasiRow } from '@/types/komparasi'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDate } from '@/lib/utils/date'
import PriceChart from '@/components/chart/PriceChart'
import PairBadge from './PairBadge'
import MismatchBadge from '@/components/pills/MismatchBadge'
import VolatilityPill from '@/components/pills/VolatilityPill'

type Props = { rows: KomparasiRow[] }

type GroupedCity = {
  city_id: string
  city_name: string
  province: string | null
  island: string | null
  commodities: KomparasiRow[]
}

export default function SectionA({ rows }: Props) {
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set())
  const [expandedComms, setExpandedComms] = useState<Set<string>>(new Set())
  const [chartData, setChartData] = useState<Record<string, any[]>>({})
  const [loadingChart, setLoadingChart] = useState<Set<string>>(new Set())

  // Group rows by city
  const grouped: GroupedCity[] = []
  const cityMap = new Map<string, GroupedCity>()
  for (const row of rows) {
    if (!cityMap.has(row.city_id)) {
      const g: GroupedCity = {
        city_id: row.city_id,
        city_name: row.city_name,
        province: row.province,
        island: row.island,
        commodities: [],
      }
      cityMap.set(row.city_id, g)
      grouped.push(g)
    }
    cityMap.get(row.city_id)!.commodities.push(row)
  }

  function toggleCity(id: string) {
    setExpandedCities((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function toggleComm(row: KomparasiRow) {
    const key = `${row.city_id}-${row.commodity_id}`
    setExpandedComms((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key); return next }
      next.add(key)
      return next
    })

    if (!chartData[key]) {
      setLoadingChart((prev) => new Set(prev).add(key))
      try {
        const params = new URLSearchParams({ city_id: row.city_id, commodity_id: row.commodity_id, days: '60' })
        const res = await fetch(`/api/prices?${params}`)
        const data = await res.json()
        setChartData((prev) => ({ ...prev, [key]: data.data ?? [] }))
      } finally {
        setLoadingChart((prev) => { const next = new Set(prev); next.delete(key); return next })
      }
    }
  }

  if (!grouped.length) {
    return (
      <div className="text-xs text-center py-12" style={{ color: '#8a8580' }}>
        Tidak ada data komparasi. Pastikan data SP2KP dan pedagang sudah diinput dan direview.
      </div>
    )
  }

  return (
    <div className="divide-y" style={{ borderColor: '#d8d4cb' }}>
      {grouped.map((g) => {
        const cityOpen = expandedCities.has(g.city_id)
        const mismatchCount = g.commodities.filter((c) => c.is_mismatch).length
        return (
          <div key={g.city_id}>
            {/* Level 1: Kota */}
            <button
              className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-[#f0ece4]"
              onClick={() => toggleCity(g.city_id)}
            >
              <span
                className="text-xs flex-shrink-0 transition-transform"
                style={{ color: '#8a8580', transform: cityOpen ? 'rotate(90deg)' : 'none' }}
              >
                ▶
              </span>
              <span className="font-semibold text-sm flex-1">{g.city_name}</span>
              <span className="text-xs" style={{ color: '#8a8580' }}>{g.province}</span>
              {g.island && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: '#e5e1d8', color: '#4a4540' }}
                >
                  {g.island}
                </span>
              )}
              {mismatchCount > 0 && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-mono"
                  style={{ background: '#fee2e2', color: '#991b1b' }}
                >
                  ⚠ {mismatchCount} mismatch
                </span>
              )}
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: '#e5e1d8', color: '#4a4540' }}
              >
                {g.commodities.length} komoditas
              </span>
            </button>

            {/* Level 2: Komoditas */}
            {cityOpen && (
              <div style={{ background: '#fafaf8' }}>
                {g.commodities.map((row) => {
                  const commKey = `${row.city_id}-${row.commodity_id}`
                  const commOpen = expandedComms.has(commKey)
                  const hasChart = !!chartData[commKey]
                  const isLoading = loadingChart.has(commKey)
                  const sp2kpOnly = row.sp2kp_price != null && row.pedagang_price == null
                  const pedagangOnly = row.sp2kp_price == null && row.pedagang_price != null

                  return (
                    <div key={row.commodity_id} style={{ borderTop: '1px solid #e5e1d8' }}>
                      <button
                        className="w-full flex items-center gap-2 px-6 py-2 text-left transition-colors hover:bg-[#f0ece4]"
                        onClick={() => toggleComm(row)}
                      >
                        <span
                          className="text-xs flex-shrink-0 transition-transform"
                          style={{ color: '#8a8580', transform: commOpen ? 'rotate(90deg)' : 'none' }}
                        >
                          ▶
                        </span>
                        <span className="flex-1 text-xs font-medium">{row.commodity_name}</span>

                        {row.pedagang_via_pair && <PairBadge viaPair />}
                        {row.is_mismatch && <MismatchBadge pct={row.mismatch_pct} />}

                        {/* SP2KP price */}
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs px-1 py-0.5 rounded"
                            style={{ background: '#e8f3ec', color: '#1b5e3b', fontSize: 9 }}
                          >
                            SP2KP
                          </span>
                          <span className="font-mono text-xs">
                            {row.sp2kp_price ? formatRupiah(row.sp2kp_price) : '—'}
                          </span>
                        </div>

                        {/* Pedagang price */}
                        <div className="flex items-center gap-1">
                          <span
                            className="text-xs px-1 py-0.5 rounded"
                            style={{ background: '#dbeafe', color: '#1e3a5f', fontSize: 9 }}
                          >
                            Pedagang
                          </span>
                          <span className="font-mono text-xs">
                            {row.pedagang_price ? formatRupiah(row.pedagang_price) : '—'}
                          </span>
                        </div>
                      </button>

                      {/* Level 3: Chart detail */}
                      {commOpen && (
                        <div className="px-6 pb-4 pt-2" style={{ background: '#f5f1ea' }}>
                          {/* Stats row */}
                          <div className="flex flex-wrap gap-4 mb-3">
                            {row.sp2kp_price != null && (
                              <div>
                                <div className="text-xs mb-0.5" style={{ color: '#1b5e3b', fontWeight: 600 }}>SP2KP</div>
                                <div className="font-mono font-bold text-sm">{formatRupiah(row.sp2kp_price)}</div>
                                <div className="text-xs" style={{ color: '#8a8580' }}>{formatDate(row.sp2kp_date)}</div>
                              </div>
                            )}
                            {row.pedagang_price != null && (
                              <div>
                                <div className="text-xs mb-0.5 flex items-center gap-1" style={{ color: '#1e3a5f', fontWeight: 600 }}>
                                  Pedagang
                                  {row.pedagang_via_pair && <PairBadge viaPair />}
                                </div>
                                <div className="font-mono font-bold text-sm">{formatRupiah(row.pedagang_price)}</div>
                                <div className="text-xs" style={{ color: '#8a8580' }}>
                                  {formatDate(row.pedagang_date)} · {row.pedagang_count} pedagang
                                </div>
                              </div>
                            )}
                            {row.mismatch_pct != null && (
                              <div>
                                <div className="text-xs mb-0.5" style={{ color: '#78350f', fontWeight: 600 }}>Selisih</div>
                                <MismatchBadge pct={row.mismatch_pct} />
                              </div>
                            )}
                            {row.volatility_pct != null && (
                              <div>
                                <div className="text-xs mb-0.5" style={{ color: '#4a4540', fontWeight: 600 }}>Volatilitas</div>
                                <VolatilityPill value={row.volatility_pct} />
                              </div>
                            )}
                          </div>

                          {isLoading && (
                            <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>
                              Memuat chart...
                            </div>
                          )}
                          {hasChart && (
                            <PriceChart
                              data={chartData[commKey]}
                              color="#1b5e3b"
                              showHet={false}
                              height={160}
                            />
                          )}
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
  )
}
