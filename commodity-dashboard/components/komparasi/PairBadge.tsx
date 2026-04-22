'use client'

type Props = { viaPair?: boolean; pairName?: string }

export default function PairBadge({ viaPair, pairName }: Props) {
  if (!viaPair) return null
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-mono"
      style={{ background: '#ede9fe', color: '#4c1d95' }}
    >
      🔗 via pair{pairName ? `: ${pairName}` : ''}
    </span>
  )
}
