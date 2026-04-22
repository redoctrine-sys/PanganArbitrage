'use client'

import { useState } from 'react'
import { formatRupiah } from '@/lib/utils/format-rupiah'

type Props = { onSuccess: () => void }

const MODA_OPTIONS = [
  { value: 'truk', label: 'Truk' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'ekspedisi', label: 'Ekspedisi' },
  { value: 'kapal', label: 'Kapal' },
  { value: 'motor', label: 'Motor' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function TransportForm({ onSuccess }: Props) {
  const [form, setForm] = useState({
    nama: '', kontak: '', moda: 'truk',
    price_type: 'per_km', price_per_km: '', price_flat: '',
    kapasitas_kg: '', catatan: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan')
      setForm({ nama: '', kontak: '', moda: 'truk', price_type: 'per_km', price_per_km: '', price_flat: '', kapasitas_kg: '', catatan: '' })
      onSuccess()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Nama Vendor *</label>
          <input value={form.nama} onChange={(e) => set('nama', e.target.value)}
            placeholder="CV Maju Jaya" className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Kontak</label>
          <input value={form.kontak} onChange={(e) => set('kontak', e.target.value)}
            placeholder="08xx-xxxx" className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Moda *</label>
          <select value={form.moda} onChange={(e) => set('moda', e.target.value)}
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }}>
            {MODA_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Kapasitas (kg)</label>
          <input value={form.kapasitas_kg} onChange={(e) => set('kapasitas_kg', e.target.value)}
            placeholder="5000" type="number" min="0"
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none font-mono"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Tipe Harga *</label>
        <div className="flex gap-2">
          {[{ v: 'per_km', l: 'Per KM' }, { v: 'flat', l: 'Flat' }].map((o) => (
            <button key={o.v} type="button" onClick={() => set('price_type', o.v)}
              className="flex-1 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={{
                background: form.price_type === o.v ? '#1a1612' : '#e5e1d8',
                color: form.price_type === o.v ? '#f5f1ea' : '#4a4540',
              }}>
              {o.l}
            </button>
          ))}
        </div>
      </div>

      {form.price_type === 'per_km' && (
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Harga per KM (Rp) *</label>
          <input value={form.price_per_km} onChange={(e) => set('price_per_km', e.target.value)}
            placeholder="3500" type="number" min="0"
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none font-mono"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }} />
          {form.price_per_km && <div className="text-xs mt-0.5" style={{ color: '#8a8580' }}>
            {formatRupiah(Number(form.price_per_km))}/km
          </div>}
        </div>
      )}
      {form.price_type === 'flat' && (
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Harga Flat (Rp) *</label>
          <input value={form.price_flat} onChange={(e) => set('price_flat', e.target.value)}
            placeholder="500000" type="number" min="0"
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none font-mono"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }} />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>Catatan</label>
        <input value={form.catatan} onChange={(e) => set('catatan', e.target.value)}
          placeholder="Cakupan wilayah, syarat, dll..."
          className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
          style={{ border: '1px solid #d8d4cb', background: '#fff' }} />
      </div>

      {error && <div className="text-xs p-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>{error}</div>}
      <button type="submit" disabled={loading}
        className="w-full py-2 rounded-md text-xs font-semibold"
        style={{ background: '#7c2d12', color: '#ffedd5' }}>
        {loading ? 'Menyimpan...' : 'Tambah Vendor Transport'}
      </button>
    </form>
  )
}
