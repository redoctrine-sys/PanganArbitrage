'use client'

import { useState, useEffect } from 'react'
import { formatDate } from '@/lib/utils/date'

type LogEntry = {
  date: string
  source: string
  total: number
  resolved: number
  unresolved: number
  firstAt: string
}

const SOURCE_STYLE: Record<string, { bg: string; color: string }> = {
  sp2kp:    { bg: '#e0f2fe', color: '#0c4a6e' },
  pedagang: { bg: '#fef9c3', color: '#713f12' },
}

export default function IngestLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterSource, setFilterSource] = useState<string>('')

  useEffect(() => {
    fetch('/api/admin/ingest-log')
      .then((r) => r.json())
      .then((d) => setLogs(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filterSource ? logs.filter((l) => l.source === filterSource) : logs

  const totalRows = filtered.reduce((s, l) => s + l.total, 0)
  const totalResolved = filtered.reduce((s, l) => s + l.resolved, 0)
  const totalUnresolved = filtered.reduce((s, l) => s + l.unresolved, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#7c2d12' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Ingest Log</h1>
          <span className="text-xs font-mono ml-1" style={{ color: '#8a8580' }}>Riwayat upload data</span>
          <div className="ml-auto flex items-center gap-1.5">
            {['', 'sp2kp', 'pedagang'].map((s) => (
              <button key={s}
                onClick={() => setFilterSource(s)}
                className="text-xs px-2.5 py-1 rounded-md font-medium"
                style={{
                  background: filterSource === s ? '#1a1612' : '#e5e1d8',
                  color: filterSource === s ? '#f5f1ea' : '#1a1612',
                }}>
                {s === '' ? 'Semua' : s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          {[
            { label: 'Total Baris', value: totalRows.toLocaleString('id-ID') },
            { label: 'Resolved', value: totalResolved.toLocaleString('id-ID') },
            { label: 'Unresolved', value: totalUnresolved.toLocaleString('id-ID') },
            { label: 'Batch Upload', value: filtered.length.toString() },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg px-3 py-2"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}>
              <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: '#8a8580' }}>{s.label}</div>
              <div className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>Memuat...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <div className="text-4xl">📋</div>
            <div className="font-medium text-sm">Belum ada data ingest</div>
            <div className="text-xs" style={{ color: '#8a8580' }}>Upload CSV SP2KP untuk memulai</div>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f0ece4', borderBottom: '1px solid #d8d4cb' }}>
                <th className="px-4 py-2 text-left font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Tanggal Data</th>
                <th className="px-4 py-2 text-left font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Sumber</th>
                <th className="px-4 py-2 text-right font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Total Baris</th>
                <th className="px-4 py-2 text-right font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Resolved</th>
                <th className="px-4 py-2 text-right font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Unresolved</th>
                <th className="px-4 py-2 text-right font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Match %</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log, i) => {
                const matchPct = log.total > 0 ? (log.resolved / log.total) * 100 : 0
                const style = SOURCE_STYLE[log.source] ?? { bg: '#e5e1d8', color: '#4a4540' }
                return (
                  <tr key={`${log.date}:${log.source}`}
                    style={{
                      background: i % 2 === 0 ? '#fafaf8' : '#fff',
                      borderBottom: '1px solid #e8e5de',
                    }}>
                    <td className="px-4 py-2 font-mono font-medium">{formatDate(log.date)}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded font-mono uppercase text-xs font-bold"
                        style={{ background: style.bg, color: style.color }}>
                        {log.source}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">{log.total.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-2 text-right font-mono" style={{ color: '#166534' }}>
                      {log.resolved.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-right font-mono"
                      style={{ color: log.unresolved > 0 ? '#991b1b' : '#8a8580' }}>
                      {log.unresolved.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 rounded-full" style={{ background: '#e5e1d8' }}>
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${matchPct}%`,
                              background: matchPct > 80 ? '#22c55e' : matchPct > 50 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="font-mono font-bold w-10 text-right"
                          style={{ color: matchPct > 80 ? '#166534' : matchPct > 50 ? '#713f12' : '#991b1b' }}>
                          {matchPct.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
