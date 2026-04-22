'use client'

import { useState } from 'react'
import type { NamingQueueItem } from '@/types/naming'
import { formatDate } from '@/lib/utils/date'
import CommodityPairCard from './CommodityPairCard'

type Props = {
  items: NamingQueueItem[]
  commodityNames: Record<string, string>
  onApprove: (id: string, action: 'typo' | 'pair' | 'new', opts?: { canonical_id?: string; pair_type?: string; note?: string }) => Promise<void>
  onReject: (id: string, note?: string) => Promise<void>
  loading?: boolean
}

export default function CommodityQueue({ items, commodityNames, onApprove, onReject, loading }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [noteMap, setNoteMap] = useState<Record<string, string>>({})
  const [showNote, setShowNote] = useState<Record<string, boolean>>({})

  if (loading) return <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>Memuat...</div>
  if (!items.length) return <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>Tidak ada item pending</div>

  const typoItems = items.filter((i) => i.review_subtype === 'typo')
  const pairItems = items.filter((i) => i.review_subtype === 'pair')
  const newItems = items.filter((i) => i.review_subtype === 'new')

  async function doApprove(id: string, action: 'typo' | 'pair' | 'new', opts?: any) {
    setProcessingId(id)
    try {
      await onApprove(id, action, opts)
    } finally {
      setProcessingId(null)
    }
  }

  async function doReject(id: string) {
    setProcessingId(id)
    try {
      await onReject(id, noteMap[id])
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Typo section */}
      {typoItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a4540' }}>
              📝 Koreksi Nama ({typoItems.length})
            </span>
          </div>
          <div
            className="rounded-lg divide-y overflow-hidden"
            style={{ border: '1px solid #d8d4cb' }}
          >
            {typoItems.map((item) => (
              <div key={item.id} className="px-4 py-3" style={{ background: '#fafaf8' }}>
                <div className="flex items-center gap-2 mb-2">
                  <code
                    className="text-xs px-1.5 py-0.5 rounded font-mono"
                    style={{ background: '#e5e1d8' }}
                  >
                    "{item.raw_value}"
                  </code>
                  <span style={{ color: '#8a8580' }}>→</span>
                  <span className="font-medium text-xs">{item.suggestion ?? '—'}</span>
                  {item.similarity_score != null && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded font-mono ml-auto"
                      style={{
                        background: item.similarity_score >= 0.8 ? '#dcfce7' : '#fef3c7',
                        color: item.similarity_score >= 0.8 ? '#166534' : '#78350f',
                      }}
                    >
                      {(item.similarity_score * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
                <div className="text-xs mb-2" style={{ color: '#8a8580' }}>
                  Source: {item.source ?? '—'} · {formatDate(item.created_at)}
                </div>
                {showNote[item.id] && (
                  <input
                    value={noteMap[item.id] ?? ''}
                    onChange={(e) => setNoteMap((p) => ({ ...p, [item.id]: e.target.value }))}
                    placeholder="Catatan..."
                    className="w-full text-xs px-2 py-1 rounded mb-2 outline-none"
                    style={{ border: '1px solid #d8d4cb', background: '#fff' }}
                  />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => doApprove(item.id, 'typo', { canonical_id: item.canonical_id, note: noteMap[item.id] })}
                    disabled={processingId === item.id || !item.canonical_id}
                    className="px-2.5 py-1 rounded text-xs font-medium"
                    style={{ background: '#1b5e3b', color: '#e8f3ec' }}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => doReject(item.id)}
                    disabled={processingId === item.id}
                    className="px-2.5 py-1 rounded text-xs"
                    style={{ background: '#fee2e2', color: '#991b1b' }}
                  >
                    ✕ Reject
                  </button>
                  <button
                    onClick={() => setShowNote((p) => ({ ...p, [item.id]: !p[item.id] }))}
                    className="px-2.5 py-1 rounded text-xs"
                    style={{ background: '#e5e1d8', color: '#4a4540' }}
                  >
                    ✎
                  </button>
                  {processingId === item.id && <span className="text-xs self-center" style={{ color: '#8a8580' }}>...</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pair section */}
      {pairItems.length > 0 && (
        <div>
          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a4540' }}>
              🔗 Usulan Pairing Lintas Source ({pairItems.length})
            </span>
          </div>
          {pairItems.map((item) => (
            <CommodityPairCard
              key={item.id}
              item={item}
              sp2kpName={item.pair_target_id ? commodityNames[item.pair_target_id] : undefined}
              processing={processingId === item.id}
              onApprove={async (pairType, note) => {
                await doApprove(item.id, 'pair', { pair_type: pairType, note })
              }}
              onReject={async (note) => {
                await doReject(item.id)
              }}
            />
          ))}
        </div>
      )}

      {/* New section */}
      {newItems.length > 0 && (
        <div>
          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4a4540' }}>
              🆕 Komoditas Baru ({newItems.length})
            </span>
          </div>
          <div
            className="rounded-lg divide-y overflow-hidden"
            style={{ border: '1px solid #d8d4cb' }}
          >
            {newItems.map((item) => (
              <div key={item.id} className="px-4 py-3" style={{ background: '#fafaf8' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-mono font-medium"
                    style={{ background: '#fee2e2', color: '#991b1b' }}
                  >
                    Tidak ada padanan (score &lt; 30%)
                  </span>
                </div>
                <div className="font-medium text-sm mb-1">"{item.raw_value}"</div>
                <div className="text-xs mb-2" style={{ color: '#8a8580' }}>
                  Source: {item.source ?? '—'} · {formatDate(item.created_at)}
                </div>
                <div className="text-xs mb-3" style={{ color: '#78350f', background: '#fef3c7', padding: '6px 10px', borderRadius: 6 }}>
                  Komoditas ini tidak ada padanannya di SP2KP. Jika dikonfirmasi, akan masuk ke Section B.
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => doApprove(item.id, 'new', { note: noteMap[item.id] })}
                    disabled={processingId === item.id}
                    className="px-2.5 py-1 rounded text-xs font-medium"
                    style={{ background: '#e5e1d8', color: '#1a1612' }}
                  >
                    ✓ Konfirmasi ke Section B
                  </button>
                  <button
                    onClick={() => doReject(item.id)}
                    disabled={processingId === item.id}
                    className="px-2.5 py-1 rounded text-xs"
                    style={{ background: '#fee2e2', color: '#991b1b' }}
                  >
                    ✕ Reject
                  </button>
                  {processingId === item.id && <span className="text-xs self-center" style={{ color: '#8a8580' }}>...</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
