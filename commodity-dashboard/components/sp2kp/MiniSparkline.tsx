'use client'

type Props = {
  vals: number[]
  w?: number
  h?: number
}

export default function MiniSparkline({ vals, w = 64, h = 24 }: Props) {
  if (vals.length < 2) {
    return <span className="text-xs" style={{ color: '#c4bfb5' }}>—</span>
  }
  const mn = Math.min(...vals)
  const mx = Math.max(...vals)
  const rng = mx - mn || 1
  const pts = vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * w
      const y = h - ((v - mn) / rng) * (h - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const last = vals[vals.length - 1]
  const prev = vals[vals.length - 2]
  const color = last > prev ? '#dc2626' : last < prev ? '#166534' : '#8a8580'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} />
    </svg>
  )
}
