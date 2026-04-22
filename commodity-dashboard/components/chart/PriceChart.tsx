'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDateShort } from '@/lib/utils/date'

type DataPoint = {
  date: string
  price: number
  het_ha?: number | null
  source?: string
}

type Props = {
  data: DataPoint[]
  color?: string
  showHet?: boolean
  height?: number
}

export default function PriceChart({ data, color = '#1b5e3b', showHet = true, height = 200 }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-32 text-xs" style={{ color: '#8a8580' }}>
      Belum ada data
    </div>
  )

  const hetValue = showHet ? data.find((d) => d.het_ha)?.het_ha : null

  const formatted = data.map((d) => ({
    ...d,
    label: formatDateShort(d.date),
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e1d8" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#8a8580' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#8a8580' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={36}
        />
        <Tooltip
          formatter={(value) => [formatRupiah(Number(value)), 'Harga']}
          labelStyle={{ fontSize: 11, color: '#4a4540' }}
          contentStyle={{
            fontSize: 11,
            background: '#f5f1ea',
            border: '1px solid #d8d4cb',
            borderRadius: 6,
          }}
        />
        {hetValue && (
          <ReferenceLine
            y={hetValue}
            stroke="#ef4444"
            strokeDasharray="4 3"
            label={{ value: 'HET', fill: '#ef4444', fontSize: 9, position: 'right' }}
          />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: color }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
