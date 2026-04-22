'use client'

type Props = { value: number | null | undefined }

export default function VolatilityPill({ value }: Props) {
  if (value == null) return null

  const level = value > 15 ? 'TINGGI' : value > 7 ? 'SEDANG' : 'RENDAH'
  const colors = {
    TINGGI: { bg: '#ffedd5', color: '#9a3412' },
    SEDANG: { bg: '#fef9c3', color: '#713f12' },
    RENDAH: { bg: '#dcfce7', color: '#14532d' },
  }

  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-mono"
      style={colors[level]}
    >
      {value.toFixed(1)}% {level}
    </span>
  )
}
