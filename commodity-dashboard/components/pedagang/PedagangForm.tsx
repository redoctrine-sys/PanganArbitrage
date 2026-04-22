'use client'

import { useState } from 'react'
import type { City } from '@/types/prices'

type Props = {
  cities: City[]
  onSuccess: () => void
}

export default function PedagangForm({ cities, onSuccess }: Props) {
  const [form, setForm] = useState({
    nama: '',
    no_hp: '',
    city_id: '',
    lokasi_detail: '',
    keterangan: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: string, value: string) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nama.trim() || !form.city_id) {
      setError('Nama dan kota wajib diisi')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pedagang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan')
      setForm({ nama: '', no_hp: '', city_id: '', lokasi_detail: '', keterangan: '' })
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
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
            Nama Pedagang *
          </label>
          <input
            value={form.nama}
            onChange={(e) => set('nama', e.target.value)}
            placeholder="Nama lengkap pedagang"
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }}
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
            No. HP
          </label>
          <input
            value={form.no_hp}
            onChange={(e) => set('no_hp', e.target.value)}
            placeholder="08xx-xxxx-xxxx"
            className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
            style={{ border: '1px solid #d8d4cb', background: '#fff' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
          Kota *
        </label>
        <select
          value={form.city_id}
          onChange={(e) => set('city_id', e.target.value)}
          className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
          style={{ border: '1px solid #d8d4cb', background: '#fff', color: form.city_id ? '#1a1612' : '#8a8580' }}
        >
          <option value="">-- Pilih kota --</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.province ? ` — ${c.province}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
          Lokasi Detail
        </label>
        <input
          value={form.lokasi_detail}
          onChange={(e) => set('lokasi_detail', e.target.value)}
          placeholder="Nama pasar, jalan, kecamatan..."
          className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
          style={{ border: '1px solid #d8d4cb', background: '#fff' }}
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
          Keterangan
        </label>
        <input
          value={form.keterangan}
          onChange={(e) => set('keterangan', e.target.value)}
          placeholder="Info tambahan..."
          className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
          style={{ border: '1px solid #d8d4cb', background: '#fff' }}
        />
      </div>

      {error && (
        <div className="text-xs p-2 rounded" style={{ background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-md text-xs font-semibold transition-colors"
        style={{ background: '#1e3a5f', color: '#dbeafe' }}
      >
        {loading ? 'Menyimpan...' : 'Tambah Pedagang'}
      </button>
    </form>
  )
}
