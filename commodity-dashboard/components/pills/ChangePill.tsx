'use client'

type Props = {
  value: number | null | undefined
  suffix?: string
}

export default function ChangePill({ value, suffix = '%' }: Props) {
  if (value == null) return null

  const isUp = value > 0
  const isDown = value < 0
  const abs = Math.abs(value)

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono font-medium"
      style={{
        background: isUp ? '#dcfce7' : isDown ? '#fee2e2' : '#f3f4f6',
        color: isUp ? '#166534' : isDown ? '#991b1b' : '#6b7280',
      }}
    >
      {isUp ? '▲' : isDown ? '▼' : ''}
      {abs.toFixed(1)}{suffix}
    </span>
  )
}
