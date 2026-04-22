'use client'

import { useState } from 'react'
import type { Commodity } from '@/types/prices'
import { formatRupiah } from '@/lib/utils/format-rupiah'

type Props = {
  pedagangId: string
  pedagangNama: string
  commodities: Commodity[]
  onSuccess: () => void
  onCancel: () => void
}

export default function HargaForm({ pedagangId, pedagangNama, commodities, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState({
    commodity_id: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    satuan: 'kg',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.commodity_id || !form.price) {
      setError('Komoditas dan harga wajib diisi')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pedagang/harga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedagang_id: pedagangId,
          commodity_id: form.commodity_id,
          price: parseFloat(form.price.replace(/[^0-9.]/g, '')),
          date: form.date,
          satuan: form.satuan,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan')
      setForm({ commodity_id: '', price: '', date: new Date().toISOString().split('T')[0], satuan: 'kg' })
      onSuccess()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-xs font-medium mb-2" style={{ color: '#4a4540' }}>
        Input harga untuk: <b>{pedagangNama}</b>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
          Komoditas *
        </label>
        <select
          value={form.commodity_id}
          onChange={(e) => set('commodity_id', e.target.value)}
          className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
          style={{ border: '1px solid #d8d4cb', background: '#fff' }}
        >
          <option value="">-- Pilih komoditas --</option>
          {commodities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.unit})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
            Harga (Rp) *
          </label>
          <input
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            placeholder="Contoh: 45000"
            type="number"
            min="0"
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none font-mono"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }}
          />
          {form.price && !isNaN(parseFloat(form.price)) && (
            <div className="text-xs mt-0.5" style={{ color: '#8a8580' }}>
              {formatRupiah(parseFloat(form.price))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
            Tanggal
          </label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }}
          />
        </div>
      </div>

      {error && (
        <div className="text-xs p-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 rounded-md text-xs font-semibold"
          style={{ background: '#1e3a5f', color: '#dbeafe' }}
        >
          {loading ? 'Menyimpan...' : 'Simpan Harga'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md text-xs"
          style={{ background: '#e5e1d8', color: '#4a4540' }}
        >
          Batal
        </button>
      </div>
    </form>
  )
}
