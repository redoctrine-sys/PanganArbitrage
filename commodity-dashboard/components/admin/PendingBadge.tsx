'use client'

type Props = { count: number; warn?: boolean }

export default function PendingBadge({ count, warn }: Props) {
  if (count === 0) return null
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
      style={{
        background: warn ? 'rgba(239,68,68,0.2)' : 'rgba(245,241,234,0.1)',
        color: warn ? '#fca5a5' : 'rgba(245,241,234,0.45)',
      }}
    >
      {count}
    </span>
  )
}
