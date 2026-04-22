'use client'

import { useState } from 'react'
import type { City, Commodity } from '@/types/prices'

type Props = {
  cities: City[]
  commodities: Commodity[]
  onSuccess: () => void
}

export default function PedagangForm({ cities, commodities, onSuccess }: Props) {
  const [form, setForm] = useState({
    nama: '',
    no_hp: '',
    city_id: '',
    lokasi_detail: '',
    keterangan: '',
  })
  const [harga, setHarga] = useState({
    commodity_id: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
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
      // Create pedagang
      const res = await fetch('/api/pedagang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Gagal menyimpan pedagang')

      // Optionally add initial commodity price
      if (harga.commodity_id && harga.price) {
        const hargaRes = await fetch('/api/pedagang/harga', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pedagang_id: data.data.id,
            commodity_id: harga.commodity_id,
            price: parseFloat(harga.price.replace(/[^0-9.]/g, '')),
            date: harga.date,
            satuan: 'kg',
          }),
        })
        if (!hargaRes.ok) {
          const hargaData = await hargaRes.json()
          throw new Error(hargaData.error ?? 'Gagal menyimpan harga')
        }
      }

      setForm({ nama: '', no_hp: '', city_id: '', lokasi_detail: '', keterangan: '' })
      setHarga({ commodity_id: '', price: '', date: new Date().toISOString().split('T')[0] })
      onSuccess()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Pedagang info */}
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

      {/* Harga awal (opsional) */}
      <div
        className="rounded-lg p-3 space-y-2"
        style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color: '#4a4540' }}>
          Komoditas &amp; Harga Awal <span style={{ color: '#8a8580', fontWeight: 400 }}>(opsional)</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
              Komoditas
            </label>
            <select
              value={harga.commodity_id}
              onChange={(e) => setHarga((p) => ({ ...p, commodity_id: e.target.value }))}
              className="w-full text-xs px-2.5 py-2 rounded-md outline-none"
              style={{ border: '1px solid #d8d4cb', background: '#fff', color: harga.commodity_id ? '#1a1612' : '#8a8580' }}
            >
              <option value="">-- Pilih komoditas --</option>
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.unit})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
              Harga (Rp/kg)
            </label>
            <input
              value={harga.price}
              onChange={(e) => setHarga((p) => ({ ...p, price: e.target.value }))}
              placeholder="Contoh: 45000"
              type="number"
              min="0"
              className="w-full text-xs px-2.5 py-2 rounded-md outline-none font-mono"
              style={{ border: '1px solid #d8d4cb', background: '#fff' }}
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#4a4540' }}>
            Tanggal Harga
          </label>
          <input
            type="date"
            value={harga.date}
            onChange={(e) => setHarga((p) => ({ ...p, date: e.target.value }))}
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
