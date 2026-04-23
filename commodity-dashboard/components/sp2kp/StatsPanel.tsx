'use client'

import { formatRupiah } from '@/lib/utils/format-rupiah'
import type { CommEntry } from '@/lib/sp2kp/aggregate'

type Props = { entry: CommEntry }

export default function StatsPanel({ entry }: Props) {
  const aboveHet = entry.het != null && entry.latestPrice > entry.het

  const rows = [
    {
      label: 'Harga hari ini',
      value: formatRupiah(entry.latestPrice),
      color: aboveHet ? '#dc2626' : '#1a1612',
    },
    {
      label: 'vs Kemarin',
      value:
        entry.changeVsYest != null
          ? `${entry.changeVsYest > 0 ? '+' : ''}${entry.changeVsYest.toFixed(1)}%`
          : '—',
      color:
        entry.changeVsYest == null
          ? '#8a8580'
          : entry.changeVsYest > 0
            ? '#dc2626'
            : entry.changeVsYest < 0
              ? '#166534'
              : '#4a4540',
    },
    {
      label: 'Avg 60 Hari',
      value: formatRupiah(Math.round(entry.avgPrice)),
      color: '#1a1612',
    },
    {
      label: 'vs Rata-rata',
      value: `${entry.changeVsAvg > 0 ? '+' : ''}${entry.changeVsAvg.toFixed(1)}%`,
      color: entry.changeVsAvg > 0 ? '#dc2626' : entry.changeVsAvg < 0 ? '#166534' : '#4a4540',
    },
    {
      label: 'Volatilitas',
      value: `${entry.volatility.toFixed(1)}%`,
      color:
        entry.volatility > 15 ? '#92400e' : entry.volatility > 8 ? '#713f12' : '#1a1612',
    },
    {
      label: 'HET Pemerintah',
      value: entry.het ? formatRupiah(entry.het) : '—',
      color: aboveHet ? '#dc2626' : entry.het ? '#1a1612' : '#8a8580',
    },
    {
      label: 'Rank Nasional',
      value: entry.totalCities ? `${entry.rank} / ${entry.totalCities}` : '—',
      color: '#1a1612',
    },
  ]

  return (
    <div
      className="w-48 p-4 flex-shrink-0"
      style={{ background: '#f0ece4', borderLeft: '1px solid #d8d4cb' }}
    >
      {rows.map((r) => (
        <div key={r.label} className="mb-3 last:mb-0">
          <div className="text-xs mb-0.5" style={{ color: '#8a8580' }}>
            {r.label}
          </div>
          <div
            className="text-sm font-semibold font-mono"
            style={{ color: r.color }}
          >
            {r.value}
          </div>
        </div>
      ))}
    </div>
  )
}
