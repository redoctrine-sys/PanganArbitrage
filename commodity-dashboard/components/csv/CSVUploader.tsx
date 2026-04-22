'use client'

import { useState, useRef } from 'react'
import type { SP2KPRow } from '@/types/prices'
import type { IngestResult } from '@/types/prices'

type PreviewData = {
  preview: SP2KPRow[]
  total: number
  valid: number
  errors: string[]
}

type Props = {
  onSuccess?: (result: IngestResult) => void
}

export default function CSVUploader({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(f: File) {
    setFile(f)
    setResult(null)
    setError(null)
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch('/api/csv/preview', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Preview failed')
      setPreview(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleIngest() {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/ingest/sp2kp', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Ingest failed')
      setResult(data.result)
      onSuccess?.(data.result)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
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
            atau klik untuk pilih file
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

      {/* File selected + preview */}
      {file && (
        <div
          className="rounded-lg border p-3"
          style={{ borderColor: '#d8d4cb', background: '#fafaf8' }}
        >
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
              onClick={() => { setFile(null); setPreview(null); setResult(null) }}
              className="text-xs px-2 py-1 rounded"
              style={{ color: '#8a8580', background: '#e5e1d8' }}
            >
              Ganti
            </button>
          </div>

          {loading && (
            <div className="text-xs text-center py-3" style={{ color: '#8a8580' }}>
              Memproses...
            </div>
          )}

          {preview && !loading && !result && (
            <>
              <div className="flex gap-3 text-xs mb-3">
                <span>Total: <b>{preview.total}</b></span>
                <span style={{ color: '#166534' }}>Valid: <b>{preview.valid}</b></span>
                {preview.errors.length > 0 && (
                  <span style={{ color: '#991b1b' }}>Error: <b>{preview.errors.length}</b></span>
                )}
              </div>

              {/* Preview table */}
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
                    {preview.preview.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #e5e1d8' }}>
                        <td className="px-2 py-1 font-mono">{row.date}</td>
                        <td className="px-2 py-1">{row.city_raw}</td>
                        <td className="px-2 py-1">{row.commodity_raw}</td>
                        <td className="px-2 py-1 font-mono">
                          {row.price.toLocaleString('id-ID')}
                        </td>
                        <td className="px-2 py-1 font-mono">
                          {row.het_ha ? row.het_ha.toLocaleString('id-ID') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {preview.errors.length > 0 && (
                <div className="mb-3 p-2 rounded text-xs" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  {preview.errors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
                </div>
              )}

              <button
                onClick={handleIngest}
                disabled={preview.valid === 0}
                className="w-full py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  background: preview.valid > 0 ? '#1b5e3b' : '#d8d4cb',
                  color: preview.valid > 0 ? '#e8f3ec' : '#8a8580',
                }}
              >
                Upload {preview.valid.toLocaleString()} baris ke database
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
                onClick={() => { setFile(null); setPreview(null); setResult(null) }}
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
