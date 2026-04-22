'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NamingQueueItem } from '@/types/naming'
import NamingQueue from '@/components/admin/NamingQueue'

type Counts = { city: number; commodity: number }

export default function AdminNamingPage() {
  const [tab, setTab] = useState<'city' | 'commodity'>('city')
  const [items, setItems] = useState<NamingQueueItem[]>([])
  const [counts, setCounts] = useState<Counts>({ city: 0, commodity: 0 })
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    setLoading(true)
    try {
      const [cityRes, commRes] = await Promise.all([
        fetch('/api/admin/naming/queue?type=city'),
        fetch('/api/admin/naming/queue?type=commodity'),
      ])
      const [cityData, commData] = await Promise.all([cityRes.json(), commRes.json()])
      setCounts({
        city: cityData.data?.length ?? 0,
        commodity: commData.data?.length ?? 0,
      })
      setItems(tab === 'city' ? (cityData.data ?? []) : (commData.data ?? []))
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { loadItems() }, [loadItems])

  async function runAgent() {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/admin/naming/run', { method: 'POST' })
      const data = await res.json()
      if (data.result) {
        const r = data.result
        setRunResult(`Selesai: ${r.processed} diproses, ${r.autoApproved} auto-approve, ${r.queued} antri`)
      }
      await loadItems()
    } finally {
      setRunning(false)
    }
  }

  async function handleApprove(id: string, canonicalId: string, note?: string) {
    await fetch('/api/admin/naming/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, canonical_id: canonicalId, note }),
    })
    await loadItems()
  }

  async function handleReject(id: string, note?: string) {
    await fetch('/api/admin/naming/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, note }),
    })
    await loadItems()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#1c1c1c' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Naming Review
          </h1>
          <div className="ml-auto flex items-center gap-2">
            {runResult && (
              <span className="text-xs" style={{ color: '#166534' }}>{runResult}</span>
            )}
            <button
              onClick={runAgent}
              disabled={running}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: '#1a1612', color: '#f5f1ea' }}
            >
              {running ? 'Menjalankan...' : '▶ Jalankan Naming Agent'}
            </button>
          </div>
        </div>

        <div className="flex gap-1">
          {(['city', 'commodity'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all border"
              style={{
                background: tab === t ? '#f5f1ea' : 'transparent',
                borderColor: tab === t ? '#c4bfb5' : 'transparent',
                color: tab === t ? '#1a1612' : '#8a8580',
                fontWeight: tab === t ? 600 : 400,
              }}
            >
              {t === 'city' ? 'Kota' : 'Komoditas'}
              {counts[t] > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ background: '#fee2e2', color: '#991b1b' }}
                >
                  {counts[t]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <NamingQueue
          items={items}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
        />
      </div>
    </div>
  )
}
