'use client'

import { useState } from 'react'
import PriceChart from '@/components/chart/PriceChart'
import StatsPanel from './StatsPanel'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import type { CommEntry, Timeframe } from '@/lib/sp2kp/aggregate'
import { sliceByTimeframe } from '@/lib/sp2kp/aggregate'

type Props = {
  cityRaw: string
  entry: CommEntry
}

const TF_OPTIONS: { key: Timeframe; label: string }[] = [
  { key: 'D', label: '7H' },
  { key: 'W', label: '30H' },
  { key: 'M', label: '60H' },
]

export default function CommodityChart({ cityRaw, entry }: Props) {
  const [tf, setTf] = useState<Timeframe>('M')
  const sliced = sliceByTimeframe(entry.history, tf)
  const aboveHet = entry.het != null && entry.latestPrice > entry.het

  return (
    <div
      className="mx-4 mb-4 mt-1 rounded-lg overflow-hidden"
      style={{ border: '1px solid #d8d4cb' }}
    >
      {aboveHet && (
        <div
          className="px-4 py-2 flex items-center gap-2 text-xs font-semibold"
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            borderBottom: '1px solid #fecaca',
          }}
        >
          <span>⚠️</span>
          <span>
            Harga saat ini <strong>{formatRupiah(entry.latestPrice)}</strong> melampaui
            HET <strong>{formatRupiah(entry.het!)}</strong>
            {' '}(+{((entry.latestPrice / entry.het! - 1) * 100).toFixed(1)}%)
          </span>
        </div>
      )}

      <div className="flex" style={{ background: '#f5f1ea' }}>
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold truncate" style={{ color: '#4a4540' }}>
              {entry.commRaw} — {cityRaw}
            </div>
            <div
              className="flex rounded overflow-hidden flex-shrink-0 ml-2"
              style={{ border: '1px solid #d8d4cb' }}
            >
              {TF_OPTIONS.map((o) => (
                <button
                  key={o.key}
                  onClick={(e) => {
                    e.stopPropagation()
                    setTf(o.key)
                  }}
                  className="px-2.5 py-0.5 text-xs transition-colors"
                  style={{
                    background: tf === o.key ? '#1b5e3b' : '#f5f1ea',
                    color: tf === o.key ? '#e8f3ec' : '#4a4540',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {sliced.length < 2 ? (
            <div
              className="flex items-center justify-center h-32 text-xs"
              style={{ color: '#8a8580' }}
            >
              Tidak cukup data untuk periode ini
            </div>
          ) : (
            <PriceChart data={sliced} color="#1b5e3b" showHet height={160} />
          )}

          <div className="text-xs mt-1 font-mono" style={{ color: '#8a8580' }}>
            {sliced.length} titik
            {sliced.length > 0 && (
              <> · {sliced[0].date} s/d {sliced[sliced.length - 1].date}</>
            )}
          </div>
        </div>

        <StatsPanel entry={entry} />
      </div>
    </div>
  )
}
