'use client'

import { useState, useRef } from 'react'
import { parseSP2KPCSV } from '@/lib/csv/sp2kp-parser'
import type { SP2KPRow } from '@/types/prices'
import type { IngestResult } from '@/types/prices'

type Props = {
  onSuccess?: (result: IngestResult) => void
}

export default function CSVUploader({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<{ rows: SP2KPRow[]; errors: string[]; total: number; filteredOut: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [result, setResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(f: File) {
    setFile(f)
    setResult(null)
    setError(null)
    setParsed(null)
    setLoading(true)
    try {
      // Parse entirely client-side — no file upload to server, avoids 4.5MB Vercel limit
      const text = await f.text()
      const data = parseSP2KPCSV(text)
      if (data.rows.length === 0) {
        setError(data.errors[0] ?? 'Tidak ada baris valid ditemukan')
      } else {
        setParsed(data)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleIngest() {
    if (!parsed?.rows.length) return
    setLoading(true)
    setError(null)

    // Send rows in JSON batches of 500 to avoid any single request being too large
    const BATCH = 500
    let totalInserted = 0
    let totalSkipped = 0
    const allErrors: string[] = []

    try {
      for (let i = 0; i < parsed.rows.length; i += BATCH) {
        const batch = parsed.rows.slice(i, i + BATCH)
        setProgress(`Mengunggah ${Math.min(i + BATCH, parsed.rows.length)} / ${parsed.rows.length} baris...`)

        const res = await fetch('/api/ingest/sp2kp/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: batch }),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text.startsWith('{') ? JSON.parse(text).error : `HTTP ${res.status}`)
        }

        const data = await res.json()
        totalInserted += data.result?.inserted ?? 0
        totalSkipped += data.result?.skipped ?? 0
        allErrors.push(...(data.result?.errors ?? []))
      }

      const finalResult: IngestResult = {
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: allErrors.slice(0, 20),
      }
      setResult(finalResult)
      onSuccess?.(finalResult)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.name.endsWith('.csv')) handleFileChange(f)
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      {!file && (
        <div
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors"
          style={{ borderColor: '#d8d4cb', background: '#fafaf8' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
        >
          <div className="text-3xl mb-2">📂</div>
          <div className="text-sm font-medium mb-1">Drop file CSV SP2KP di sini</div>
          <div className="text-xs" style={{ color: '#8a8580' }}>
            atau klik untuk pilih file · ukuran berapapun didukung
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFileChange(f)
            }}
          />
        </div>
      )}

      {/* File selected */}
      {file && (
        <div className="rounded-lg border p-3" style={{ borderColor: '#d8d4cb', background: '#fafaf8' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📄</span>
              <div>
                <div className="text-sm font-medium">{file.name}</div>
                <div className="text-xs" style={{ color: '#8a8580' }}>
                  {(file.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <button
              onClick={() => { setFile(null); setParsed(null); setResult(null); setError(null) }}
              className="text-xs px-2 py-1 rounded"
              style={{ color: '#8a8580', background: '#e5e1d8' }}
            >
              Ganti
            </button>
          </div>

          {loading && (
            <div className="text-xs text-center py-3" style={{ color: '#8a8580' }}>
              {progress ?? 'Mem-parsing CSV...'}
            </div>
          )}

          {parsed && !loading && !result && (
            <>
              <div className="flex gap-3 text-xs mb-3 flex-wrap">
                <span>Total: <b>{parsed.total}</b></span>
                <span style={{ color: '#166534' }}>Valid: <b>{parsed.rows.length}</b></span>
                {parsed.filteredOut > 0 && (
                  <span style={{ color: '#92400e' }}>Di luar cakupan: <b>{parsed.filteredOut}</b></span>
                )}
                {parsed.errors.length > 0 && (
                  <span style={{ color: '#991b1b' }}>Error: <b>{parsed.errors.length}</b></span>
                )}
              </div>

              {/* Preview table — first 20 rows */}
              <div className="overflow-x-auto mb-3">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: '#e5e1d8' }}>
                      {['Tanggal', 'Kota', 'Komoditas', 'Harga', 'HET/HA'].map((h) => (
                        <th key={h} className="text-left px-2 py-1 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.rows.slice(0, 20).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e5e1d8' }}>
                        <td className="px-2 py-1 font-mono">{row.date}</td>
                        <td className="px-2 py-1">{row.city_raw}</td>
                        <td className="px-2 py-1">{row.commodity_raw}</td>
                        <td className="px-2 py-1 font-mono">{row.price.toLocaleString('id-ID')}</td>
                        <td className="px-2 py-1 font-mono">
                          {row.het_ha ? row.het_ha.toLocaleString('id-ID') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.rows.length > 20 && (
                  <div className="text-xs text-center py-1" style={{ color: '#8a8580' }}>
                    ... dan {parsed.rows.length - 20} baris lainnya
                  </div>
                )}
              </div>

              {parsed.errors.length > 0 && (
                <div className="mb-3 p-2 rounded text-xs" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  {parsed.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}

              <button
                onClick={handleIngest}
                disabled={parsed.rows.length === 0}
                className="w-full py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: parsed.rows.length > 0 ? '#1b5e3b' : '#d8d4cb',
                  color: parsed.rows.length > 0 ? '#e8f3ec' : '#8a8580',
                }}
              >
                Upload {parsed.rows.length.toLocaleString('id-ID')} baris ke database
              </button>
            </>
          )}

          {result && !loading && (
            <div className="p-3 rounded-md" style={{ background: '#dcfce7' }}>
              <div className="text-sm font-medium mb-1" style={{ color: '#166534' }}>
                Upload berhasil!
              </div>
              <div className="text-xs" style={{ color: '#166534' }}>
                ✓ {result.inserted} baris dimasukkan · {result.skipped} duplikat dilewati
              </div>
              {result.errors.length > 0 && (
                <div className="mt-1 text-xs" style={{ color: '#991b1b' }}>
                  {result.errors.length} error
                </div>
              )}
              <button
                onClick={() => { setFile(null); setParsed(null); setResult(null) }}
                className="mt-2 text-xs px-2 py-1 rounded"
                style={{ background: '#1b5e3b', color: '#e8f3ec' }}
              >
                Upload lagi
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-2 rounded text-xs" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}
    </div>
  )
}
