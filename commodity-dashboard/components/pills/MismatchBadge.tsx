'use client'

type Props = { pct: number | null | undefined }

export default function MismatchBadge({ pct }: Props) {
  if (pct == null || pct < 5) return null
  const isHigh = pct >= 20
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-medium"
      style={{
        background: isHigh ? '#fee2e2' : '#fef3c7',
        color: isHigh ? '#991b1b' : '#78350f',
      }}
    >
      ⚠ {pct.toFixed(1)}% selisih
    </span>
  )
}
