'use client'

import { useState } from 'react'
import type { NamingQueueItem } from '@/types/naming'

type Props = {
  item: NamingQueueItem
  sp2kpName?: string
  onApprove: (pairType: 'exact' | 'variant' | 'comparable', note?: string) => Promise<void>
  onReject: (note?: string) => Promise<void>
  processing?: boolean
}

export default function CommodityPairCard({ item, sp2kpName, onApprove, onReject, processing }: Props) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  const confidenceLabel = item.similarity_score != null
    ? item.similarity_score >= 0.8 ? 'Tinggi' : item.similarity_score >= 0.5 ? 'Sedang' : 'Rendah'
    : '—'
  const confidenceColor = item.similarity_score != null
    ? item.similarity_score >= 0.8 ? '#166534' : item.similarity_score >= 0.5 ? '#713f12' : '#991b1b'
    : '#8a8580'

  return (
    <div
      className="rounded-lg p-4 mb-3"
      style={{ background: '#fafaf8', border: '1px solid #d8d4cb' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-xs px-2 py-0.5 rounded font-medium"
          style={{ background: '#ede9fe', color: '#4c1d95' }}
        >
          🔗 Usulan Pairing
        </span>
        <span className="text-xs ml-auto" style={{ color: confidenceColor }}>
          Similarity: {item.similarity_score != null ? `${(item.similarity_score * 100).toFixed(0)}%` : '—'} ({confidenceLabel})
        </span>
      </div>

      {/* Pair display */}
      <div
        className="flex items-center gap-3 p-3 rounded-md mb-3"
        style={{ background: '#f0ece4' }}
      >
        <div className="flex-1 text-center">
          <div className="text-xs mb-0.5" style={{ color: '#1e3a5f', fontWeight: 600 }}>
            Pedagang
          </div>
          <div className="font-medium text-sm">{item.raw_value}</div>
        </div>
        <div className="text-lg" style={{ color: '#8a8580' }}>↔</div>
        <div className="flex-1 text-center">
          <div className="text-xs mb-0.5" style={{ color: '#1b5e3b', fontWeight: 600 }}>
            SP2KP
          </div>
          <div className="font-medium text-sm">{sp2kpName ?? item.suggestion ?? '—'}</div>
        </div>
      </div>

      {/* Note */}
      {showNote && (
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (opsional)..."
          className="w-full text-xs px-2 py-1.5 rounded mb-3 outline-none"
          style={{ border: '1px solid #d8d4cb', background: '#fff' }}
        />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onApprove('exact', note || undefined)}
          disabled={processing}
          className="px-2.5 py-1 rounded text-xs font-medium"
          style={{ background: '#dcfce7', color: '#166534' }}
        >
          ✓ Sama (exact)
        </button>
        <button
          onClick={() => onApprove('comparable', note || undefined)}
          disabled={processing}
          className="px-2.5 py-1 rounded text-xs font-medium"
          style={{ background: '#ede9fe', color: '#4c1d95' }}
        >
          ~ Comparable
        </button>
        <button
          onClick={() => onApprove('variant', note || undefined)}
          disabled={processing}
          className="px-2.5 py-1 rounded text-xs font-medium"
          style={{ background: '#fef3c7', color: '#78350f' }}
        >
          ≈ Variant
        </button>
        <button
          onClick={() => onReject(note || undefined)}
          disabled={processing}
          className="px-2.5 py-1 rounded text-xs font-medium"
          style={{ background: '#fee2e2', color: '#991b1b' }}
        >
          ✕ Section B
        </button>
        <button
          onClick={() => setShowNote((v) => !v)}
          className="px-2.5 py-1 rounded text-xs"
          style={{ background: '#e5e1d8', color: '#4a4540' }}
        >
          ✎
        </button>
        {processing && <span className="text-xs self-center" style={{ color: '#8a8580' }}>Menyimpan...</span>}
      </div>
    </div>
  )
}
