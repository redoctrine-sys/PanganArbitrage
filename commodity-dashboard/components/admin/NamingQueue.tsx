'use client'

import { useState } from 'react'
import type { NamingQueueItem } from '@/types/naming'
import { formatDate } from '@/lib/utils/date'

type Props = {
  items: NamingQueueItem[]
  onApprove: (id: string, canonicalId: string, overrideName?: string) => Promise<void>
  onReject: (id: string, note?: string) => Promise<void>
  loading?: boolean
}

export default function NamingQueue({ items, onApprove, onReject, loading }: Props) {
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  const [processingId, setProcessingId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>
        Memuat...
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>
        Tidak ada item pending
      </div>
    )
  }

  async function handleApprove(item: NamingQueueItem) {
    const overrideName = notesMap[item.id]?.trim()
    if (!overrideName && !item.canonical_id) return
    setProcessingId(item.id)
    try {
      await onApprove(item.id, item.canonical_id ?? '', overrideName || undefined)
      setNotesMap((p) => { const n = { ...p }; delete n[item.id]; return n })
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(item: NamingQueueItem) {
    setProcessingId(item.id)
    try {
      await onReject(item.id, notesMap[item.id] || undefined)
      setNotesMap((p) => { const n = { ...p }; delete n[item.id]; return n })
    } finally {
      setProcessingId(null)
    }
  }

  const confidenceColor = (score: number | null) => {
    if (!score) return '#8a8580'
    if (score >= 0.9) return '#166534'
    if (score >= 0.6) return '#713f12'
    return '#991b1b'
  }

  return (
    <div className="divide-y" style={{ borderColor: '#e5e1d8' }}>
      {items.map((item) => {
        const overrideName = notesMap[item.id]?.trim()
        const canApprove = !!(overrideName || item.canonical_id)
        return (
          <div key={item.id} className="px-4 py-3">
            {/* Type + subtype badge */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                style={{
                  background: item.review_subtype === 'new' ? '#fee2e2' : '#fef3c7',
                  color: item.review_subtype === 'new' ? '#991b1b' : '#78350f',
                }}
              >
                {item.review_subtype === 'new' ? '🆕 Baru' : '📝 Typo'}
              </span>
              {item.source && (
                <span className="text-xs" style={{ color: '#8a8580' }}>
                  {item.source}
                </span>
              )}
              <span className="text-xs ml-auto" style={{ color: '#8a8580' }}>
                {formatDate(item.created_at)}
              </span>
            </div>

            {/* Raw value → suggestion or override preview */}
            <div className="flex items-center gap-2 mb-1">
              <code
                className="text-xs px-1.5 py-0.5 rounded font-mono"
                style={{ background: '#e5e1d8', color: '#1a1612' }}
              >
                "{item.raw_value}"
              </code>
              {overrideName ? (
                <>
                  <span style={{ color: '#8a8580' }}>→</span>
                  <span className="text-xs font-medium" style={{ color: '#1b5e3b' }}>
                    "{overrideName}" <span style={{ color: '#8a8580' }}>(manual)</span>
                  </span>
                </>
              ) : item.suggestion ? (
                <>
                  <span style={{ color: '#8a8580' }}>→</span>
                  <span className="text-xs font-medium">{item.suggestion}</span>
                </>
              ) : null}
            </div>

            {/* Confidence score */}
            {item.similarity_score != null && (
              <div className="text-xs mb-2" style={{ color: confidenceColor(item.similarity_score) }}>
                Confidence: {(item.similarity_score * 100).toFixed(0)}%
                {item.method && ` · ${item.method}`}
              </div>
            )}

            {/* Notes input — always visible; text here overrides the auto-suggestion */}
            <input
              value={notesMap[item.id] ?? ''}
              onChange={(e) => setNotesMap((p) => ({ ...p, [item.id]: e.target.value }))}
              placeholder="Ketik nama manual untuk override saran otomatis..."
              className="w-full text-xs px-2 py-1.5 rounded mb-2 outline-none"
              style={{ border: '1px solid #d8d4cb', background: '#fafaf8' }}
            />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canApprove && (
                <button
                  onClick={() => handleApprove(item)}
                  disabled={processingId === item.id}
                  className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  style={{ background: '#1b5e3b', color: '#e8f3ec' }}
                >
                  ✓ Approve{overrideName ? ' (manual)' : ''}
                </button>
              )}
              <button
                onClick={() => handleReject(item)}
                disabled={processingId === item.id}
                className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
                style={{ background: '#fee2e2', color: '#991b1b' }}
              >
                ✕ Reject
              </button>
              {processingId === item.id && (
                <span className="text-xs" style={{ color: '#8a8580' }}>Menyimpan...</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
