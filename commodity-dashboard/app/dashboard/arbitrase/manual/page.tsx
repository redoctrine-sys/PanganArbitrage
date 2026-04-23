'use client'

import { useState, useEffect } from 'react'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import type { Commodity } from '@/types/prices'

type Leg = {
  id: string
  city_from: string
  city_to: string
  commodity: string
  commodity_id: string
  price_buy: number
  price_sell: number
  quantity_kg: number
  transport_cost_per_kg: number
}

type LegResult = Leg & {
  gross_profit: number
  transport_total: number
  net_profit: number
  roi_pct: number
}

type PriceSuggest = { avg: number | null; min: number | null; max: number | null; count: number }

function computeLeg(leg: Leg): LegResult {
  const gross_profit = (leg.price_sell - leg.price_buy) * leg.quantity_kg
  const transport_total = leg.transport_cost_per_kg * leg.quantity_kg
  const net_profit = gross_profit - transport_total
  const total_investment = leg.price_buy * leg.quantity_kg + transport_total
  const roi_pct = total_investment > 0 ? (net_profit / total_investment) * 100 : 0
  return { ...leg, gross_profit, transport_total, net_profit, roi_pct }
}

const EMPTY_LEG = (): Leg => ({
  id: crypto.randomUUID(),
  city_from: '',
  city_to: '',
  commodity: '',
  commodity_id: '',
  price_buy: 0,
  price_sell: 0,
  quantity_kg: 1000,
  transport_cost_per_kg: 0,
})

export default function ArbitraseManualPage() {
  const [legs, setLegs] = useState<Leg[]>([EMPTY_LEG()])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [suggestions, setSuggestions] = useState<Record<string, { buy?: PriceSuggest; sell?: PriceSuggest }>>({})
  const [loadingSuggest, setLoadingSuggest] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/commodities-list')
      .then((r) => r.json())
      .then((d) => setCommodities(d.data ?? []))
      .catch(() => {})
  }, [])

  function updateLeg(id: string, field: keyof Leg, value: string | number) {
    setLegs((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)))
  }

  function addLeg() {
    setLegs((prev) => [...prev, EMPTY_LEG()])
  }

  function removeLeg(id: string) {
    setLegs((prev) => prev.filter((l) => l.id !== id))
  }

  async function fetchSuggest(legId: string, leg: Leg) {
    if (!leg.commodity_id) return
    const cities = [leg.city_from?.trim(), leg.city_to?.trim()].filter(Boolean)
    if (!cities.length) return

    setLoadingSuggest((p) => ({ ...p, [legId]: true }))
    try {
      const [buyRes, sellRes] = await Promise.all([
        leg.city_from?.trim()
          ? fetch(`/api/prices/suggest?commodity_id=${leg.commodity_id}&city_name=${encodeURIComponent(leg.city_from.trim())}`)
          : Promise.resolve(null),
        leg.city_to?.trim()
          ? fetch(`/api/prices/suggest?commodity_id=${leg.commodity_id}&city_name=${encodeURIComponent(leg.city_to.trim())}`)
          : Promise.resolve(null),
      ])
      const [buyData, sellData] = await Promise.all([
        buyRes?.json() ?? null,
        sellRes?.json() ?? null,
      ])
      setSuggestions((p) => ({
        ...p,
        [legId]: {
          buy: buyData?.avg != null ? buyData : undefined,
          sell: sellData?.avg != null ? sellData : undefined,
        },
      }))
    } finally {
      setLoadingSuggest((p) => ({ ...p, [legId]: false }))
    }
  }

  const results = legs.map(computeLeg)
  const totalNetProfit = results.reduce((sum, r) => sum + r.net_profit, 0)
  const totalInvestment = results.reduce(
    (sum, r) => sum + r.price_buy * r.quantity_kg + r.transport_total,
    0
  )
  const chainROI = totalInvestment > 0 ? (totalNetProfit / totalInvestment) * 100 : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#7c2d12' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Kalkulator Manual
          </h1>
          <span className="text-xs px-2 py-0.5 rounded font-mono ml-1" style={{ background: '#ffedd5', color: '#7c2d12' }}>
            Multi-leg
          </span>
          <button
            onClick={addLeg}
            className="ml-auto px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: '#1a1612', color: '#f5f1ea' }}
          >
            + Tambah Leg
          </button>
        </div>
        <p className="text-xs" style={{ color: '#8a8580' }}>
          Hitung profit arbitrase multi-rute secara manual
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 flex flex-col gap-3">
          {legs.map((leg, idx) => {
            const res = computeLeg(leg)
            const isViable = res.net_profit > 0
            const sug = suggestions[leg.id]
            const isLoadingSug = loadingSuggest[leg.id]
            return (
              <div
                key={leg.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #d8d4cb', background: '#fafaf8' }}
              >
                {/* Leg header */}
                <div
                  className="px-3 py-2 flex items-center gap-2"
                  style={{ background: '#f0ece4', borderBottom: '1px solid #d8d4cb' }}
                >
                  <span className="text-xs font-bold font-mono" style={{ color: '#7c2d12' }}>
                    LEG {idx + 1}
                  </span>
                  {leg.city_from && leg.city_to && (
                    <span className="text-xs" style={{ color: '#4a4540' }}>
                      {leg.city_from} → {leg.city_to}
                    </span>
                  )}
                  {leg.commodity && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: '#e5e1d8', color: '#4a4540' }}
                    >
                      {leg.commodity}
                    </span>
                  )}
                  {leg.price_buy > 0 && leg.price_sell > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-bold"
                      style={{
                        background: isViable ? '#dcfce7' : '#fee2e2',
                        color: isViable ? '#166534' : '#991b1b',
                      }}
                    >
                      {isViable ? 'VIABLE' : 'TIDAK VIABLE'}
                    </span>
                  )}
                  {legs.length > 1 && (
                    <button
                      onClick={() => removeLeg(leg.id)}
                      className="ml-auto text-xs px-2 py-0.5 rounded"
                      style={{ background: '#fee2e2', color: '#991b1b' }}
                    >
                      ✕ Hapus
                    </button>
                  )}
                </div>

                {/* Leg inputs */}
                <div className="p-3 space-y-3">
                  {/* Commodity picker from data */}
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: '#8a8580' }}>
                      Komoditas (dari data)
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={leg.commodity_id}
                        onChange={(e) => {
                          const selected = commodities.find((c) => c.id === e.target.value)
                          setLegs((prev) => prev.map((l) =>
                            l.id === leg.id
                              ? { ...l, commodity_id: e.target.value, commodity: selected?.name ?? l.commodity }
                              : l
                          ))
                          setSuggestions((p) => ({ ...p, [leg.id]: {} }))
                        }}
                        className="flex-1 text-xs px-2.5 py-1.5 rounded-md outline-none"
                        style={{ border: '1px solid #d8d4cb', background: '#fff' }}
                      >
                        <option value="">-- Pilih dari data (opsional) --</option>
                        {commodities.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {leg.commodity_id && (
                        <button
                          onClick={() => fetchSuggest(leg.id, leg)}
                          disabled={isLoadingSug}
                          className="px-2.5 py-1.5 rounded-md text-xs font-medium"
                          style={{ background: '#1e3a5f', color: '#dbeafe' }}
                        >
                          {isLoadingSug ? '...' : '🔍 Cari Harga'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Price suggestions */}
                  {(sug?.buy || sug?.sell) && (
                    <div
                      className="rounded-lg p-2 flex gap-4 text-xs flex-wrap"
                      style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}
                    >
                      <span className="font-medium" style={{ color: '#0c4a6e' }}>Saran dari data (30 hari):</span>
                      {sug.buy?.avg != null && (
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: '#64748b' }}>Beli ({leg.city_from}):</span>
                          <span className="font-mono font-semibold" style={{ color: '#166534' }}>
                            {formatRupiah(sug.buy.avg)}
                          </span>
                          <span style={{ color: '#94a3b8' }}>({sug.buy.count} data)</span>
                          <button
                            onClick={() => updateLeg(leg.id, 'price_buy', sug.buy!.avg!)}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#166534', color: '#fff' }}
                          >
                            Pakai
                          </button>
                        </div>
                      )}
                      {sug.sell?.avg != null && (
                        <div className="flex items-center gap-1.5">
                          <span style={{ color: '#64748b' }}>Jual ({leg.city_to}):</span>
                          <span className="font-mono font-semibold" style={{ color: '#1e3a5f' }}>
                            {formatRupiah(sug.sell.avg)}
                          </span>
                          <span style={{ color: '#94a3b8' }}>({sug.sell.count} data)</span>
                          <button
                            onClick={() => updateLeg(leg.id, 'price_sell', sug.sell!.avg!)}
                            className="px-1.5 py-0.5 rounded text-xs"
                            style={{ background: '#1e3a5f', color: '#fff' }}
                          >
                            Pakai
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regular inputs grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <LegInput label="Kota Asal (Beli)" value={leg.city_from}
                      onChange={(v) => updateLeg(leg.id, 'city_from', v)} placeholder="Jakarta" />
                    <LegInput label="Kota Tujuan (Jual)" value={leg.city_to}
                      onChange={(v) => updateLeg(leg.id, 'city_to', v)} placeholder="Surabaya" />
                    <LegInput label="Komoditas (nama)" value={leg.commodity}
                      onChange={(v) => updateLeg(leg.id, 'commodity', v)} placeholder="Bawang Merah" />
                    <LegInput label="Kuantitas (kg)" value={leg.quantity_kg} type="number"
                      onChange={(v) => updateLeg(leg.id, 'quantity_kg', Number(v))} placeholder="1000" />
                    <LegInput label="Harga Beli (Rp/kg)" value={leg.price_buy} type="number"
                      onChange={(v) => updateLeg(leg.id, 'price_buy', Number(v))} placeholder="15000" />
                    <LegInput label="Harga Jual (Rp/kg)" value={leg.price_sell} type="number"
                      onChange={(v) => updateLeg(leg.id, 'price_sell', Number(v))} placeholder="20000" />
                    <LegInput label="Biaya Transport (Rp/kg)" value={leg.transport_cost_per_kg} type="number"
                      onChange={(v) => updateLeg(leg.id, 'transport_cost_per_kg', Number(v))} placeholder="500" />
                  </div>
                </div>

                {/* Leg results */}
                {leg.price_buy > 0 && leg.price_sell > 0 && (
                  <div
                    className="px-3 py-2 flex gap-4 flex-wrap"
                    style={{ background: '#f5f1ea', borderTop: '1px solid #d8d4cb' }}
                  >
                    <MetricCell label="Gross Profit" value={formatRupiah(res.gross_profit)}
                      positive={res.gross_profit > 0} />
                    <MetricCell label="Biaya Transport" value={formatRupiah(res.transport_total)} />
                    <MetricCell label="Net Profit" value={formatRupiah(res.net_profit)}
                      positive={res.net_profit > 0} highlight />
                    <MetricCell
                      label="ROI"
                      value={`${res.roi_pct.toFixed(2)}%`}
                      positive={res.roi_pct > 0}
                      highlight
                    />
                    <MetricCell label="Spread Kotor"
                      value={leg.price_buy > 0
                        ? `${(((leg.price_sell - leg.price_buy) / leg.price_buy) * 100).toFixed(1)}%`
                        : '—'
                      }
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Chain Summary */}
      {legs.length > 0 && legs.some((l) => l.price_buy > 0) && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{ background: '#1a1612', borderTop: '2px solid #d8d4cb' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#f5f1ea' }}>
              Chain Summary — {legs.length} Leg
            </span>
          </div>
          <div className="flex gap-6 flex-wrap">
            <ChainMetric label="Total Investasi" value={formatRupiah(totalInvestment)} />
            <ChainMetric
              label="Total Net Profit"
              value={formatRupiah(totalNetProfit)}
              positive={totalNetProfit > 0}
            />
            <ChainMetric
              label="Chain ROI"
              value={`${chainROI.toFixed(2)}%`}
              positive={chainROI > 0}
              big
            />
            <ChainMetric
              label="Status"
              value={totalNetProfit > 0 ? 'PROFITABLE' : 'TIDAK PROFIT'}
              positive={totalNetProfit > 0}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function LegInput({
  label, value, type = 'text', onChange, placeholder,
}: {
  label: string
  value: string | number
  type?: 'text' | 'number'
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <div className="text-xs mb-1 font-medium" style={{ color: '#8a8580' }}>{label}</div>
      <input
        type={type}
        value={value === 0 && type === 'number' ? '' : value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 rounded-md text-xs font-mono outline-none"
        style={{ border: '1px solid #d8d4cb', background: '#fff' }}
      />
    </div>
  )
}

function MetricCell({
  label, value, positive, highlight,
}: {
  label: string
  value: string
  positive?: boolean
  highlight?: boolean
}) {
  const color = positive === undefined ? '#4a4540' : positive ? '#166534' : '#991b1b'
  return (
    <div>
      <div className="text-xs" style={{ color: '#8a8580' }}>{label}</div>
      <div
        className={`font-mono text-xs ${highlight ? 'font-bold text-sm' : ''}`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}

function ChainMetric({
  label, value, positive, big,
}: {
  label: string
  value: string
  positive?: boolean
  big?: boolean
}) {
  const color = positive === undefined ? '#c0bdb8' : positive ? '#86efac' : '#fca5a5'
  return (
    <div>
      <div className="text-xs" style={{ color: '#8a8580' }}>{label}</div>
      <div
        className={`font-mono font-bold ${big ? 'text-xl' : 'text-sm'}`}
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}
