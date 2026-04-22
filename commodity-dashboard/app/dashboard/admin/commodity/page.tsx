'use client'

import { useState, useEffect, useCallback } from 'react'
import type { NamingQueueItem } from '@/types/naming'
import CommodityQueue from '@/components/admin/CommodityQueue'

export default function AdminCommodityPage() {
  const [items, setItems] = useState<NamingQueueItem[]>([])
  const [commodityNames, setCommodityNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [queueRes, commRes] = await Promise.all([
        fetch('/api/admin/commodity/queue'),
        fetch('/api/admin/commodities-list'),
      ])
      const [queueData, commData] = await Promise.all([queueRes.json(), commRes.json()])
      setItems(queueData.data ?? [])

      const nameMap: Record<string, string> = {}
      for (const c of commData.data ?? []) nameMap[c.id] = c.name
      setCommodityNames(nameMap)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function runAgent() {
    setRunning(true)
    setRunResult(null)
    try {
      const res = await fetch('/api/admin/commodity/run', { method: 'POST' })
      const data = await res.json()
      if (data.result) {
        const r = data.result
        setRunResult(`Selesai: ${r.processed} diproses, ${r.autoApproved} auto-approve, ${r.queued} antri`)
      }
      await loadData()
    } finally {
      setRunning(false)
    }
  }

  async function handleApprove(id: string, action: 'typo' | 'pair' | 'new', opts?: any) {
    await fetch('/api/admin/commodity/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...opts }),
    })
    await loadData()
  }

  async function handleReject(id: string, note?: string) {
    await fetch('/api/admin/commodity/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, note }),
    })
    await loadData()
  }

  const typoCount = items.filter((i) => i.review_subtype === 'typo').length
  const pairCount = items.filter((i) => i.review_subtype === 'pair').length
  const newCount = items.filter((i) => i.review_subtype === 'new').length

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
            Commodity Review
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
              {running ? 'Menjalankan...' : '▶ Jalankan Commodity Agent'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 text-xs">
          {[
            { label: 'Typo / Variasi', count: typoCount, color: '#78350f', bg: '#fef3c7' },
            { label: 'Pair Suggestion', count: pairCount, color: '#4c1d95', bg: '#ede9fe' },
            { label: 'Komoditas Baru', count: newCount, color: '#991b1b', bg: '#fee2e2' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 px-2 py-1 rounded"
              style={{ background: s.bg, color: s.color }}>
              <span className="font-semibold">{s.count}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        <CommodityQueue
          items={items}
          commodityNames={commodityNames}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
        />
      </div>
    </div>
  )
}
