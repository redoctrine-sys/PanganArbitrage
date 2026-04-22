'use client'

import { useState, useEffect } from 'react'

type City = {
  id: string; name: string; province: string | null
  island: string | null; entity_type: string | null
  kode_wilayah: string | null; lat: number | null; lng: number | null
}

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editCoords, setEditCoords] = useState({ lat: '', lng: '' })
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/cities-list')
      .then((r) => r.json())
      .then((d) => setCities(d.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  async function saveCoords(id: string) {
    setSaving(true)
    try {
      await fetch('/api/admin/cities-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, lat: Number(editCoords.lat), lng: Number(editCoords.lng) }),
      })
      setCities((prev) => prev.map((c) =>
        c.id === id ? { ...c, lat: Number(editCoords.lat), lng: Number(editCoords.lng) } : c
      ))
      setEditId(null)
    } finally {
      setSaving(false)
    }
  }

  const filtered = cities.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.province ?? '').toLowerCase().includes(search.toLowerCase())
  )
  const withCoords = cities.filter((c) => c.lat && c.lng).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#1c1c1c' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Manajemen Kota</h1>
          <span className="text-xs ml-auto" style={{ color: '#8a8580' }}>
            {withCoords}/{cities.length} punya koordinat
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs max-w-60"
          style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}>
          <span style={{ color: '#8a8580' }}>🔍</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kota..." className="border-none outline-none bg-transparent w-full text-xs" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>Memuat...</div>
        ) : (
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0" style={{ background: '#edeae2' }}>
              <tr>
                {['Nama', 'Provinsi', 'Pulau', 'Tipe', 'Kode', 'Lat', 'Lng', ''].map((h) => (
                  <th key={h} className="text-left px-3 py-2 font-medium" style={{ borderBottom: '1px solid #d8d4cb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #e5e1d8' }}>
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2" style={{ color: '#4a4540' }}>{c.province ?? '—'}</td>
                  <td className="px-3 py-2" style={{ color: '#4a4540' }}>{c.island ?? '—'}</td>
                  <td className="px-3 py-2" style={{ color: '#8a8580' }}>{c.entity_type ?? '—'}</td>
                  <td className="px-3 py-2 font-mono" style={{ color: '#8a8580' }}>{c.kode_wilayah ?? '—'}</td>
                  {editId === c.id ? (
                    <>
                      <td className="px-2 py-1">
                        <input value={editCoords.lat} onChange={(e) => setEditCoords((p) => ({ ...p, lat: e.target.value }))}
                          className="w-20 text-xs px-1.5 py-1 rounded font-mono outline-none"
                          style={{ border: '1px solid #d8d4cb' }} placeholder="lat" />
                      </td>
                      <td className="px-2 py-1">
                        <input value={editCoords.lng} onChange={(e) => setEditCoords((p) => ({ ...p, lng: e.target.value }))}
                          className="w-20 text-xs px-1.5 py-1 rounded font-mono outline-none"
                          style={{ border: '1px solid #d8d4cb' }} placeholder="lng" />
                      </td>
                      <td className="px-2 py-1">
                        <div className="flex gap-1">
                          <button onClick={() => saveCoords(c.id)} disabled={saving}
                            className="px-2 py-1 rounded text-xs" style={{ background: '#1b5e3b', color: '#e8f3ec' }}>
                            Simpan
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="px-2 py-1 rounded text-xs" style={{ background: '#e5e1d8', color: '#4a4540' }}>
                            Batal
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-mono" style={{ color: c.lat ? '#4a4540' : '#d8d4cb' }}>
                        {c.lat ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: c.lng ? '#4a4540' : '#d8d4cb' }}>
                        {c.lng ?? '—'}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => { setEditId(c.id); setEditCoords({ lat: String(c.lat ?? ''), lng: String(c.lng ?? '') }) }}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{ background: '#e5e1d8', color: '#4a4540' }}>
                          ✎ Edit Koordinat
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
