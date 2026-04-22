'use client'

import { useState, useEffect } from 'react'

type Commodity = {
  id: string
  name: string
  unit: string
  category: string | null
  is_sp2kp: boolean
}

const CATEGORIES = ['Beras', 'Bumbu', 'Sayuran', 'Buah', 'Daging', 'Ikan', 'Minyak', 'Lainnya']

export default function AdminCommoditiesPage() {
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ name: '', unit: 'kg', category: '', is_sp2kp: true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/commodities-list')
    const data = await res.json()
    setCommodities(data.data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(c: Commodity) {
    setEditId(c.id)
    setForm({ name: c.name, unit: c.unit, category: c.category ?? '', is_sp2kp: c.is_sp2kp })
    setShowForm(true)
    setError(null)
  }

  function startAdd() {
    setEditId(null)
    setForm({ name: '', unit: 'kg', category: '', is_sp2kp: true })
    setShowForm(true)
    setError(null)
  }

  async function submit() {
    if (!form.name.trim()) { setError('Nama wajib diisi'); return }
    setSubmitting(true)
    setError(null)
    try {
      const method = editId ? 'PATCH' : 'POST'
      const body = editId
        ? { id: editId, ...form, category: form.category || null }
        : { ...form, category: form.category || null }
      const res = await fetch('/api/admin/commodities-manage', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setShowForm(false)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteCommodity(id: string, name: string) {
    if (!confirm(`Hapus komoditas "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    const res = await fetch(`/api/admin/commodities-manage?id=${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.error) { alert(data.error); return }
    await load()
  }

  async function toggleSP2KP(c: Commodity) {
    await fetch('/api/admin/commodities-manage', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: c.id, is_sp2kp: !c.is_sp2kp }),
    })
    await load()
  }

  const filtered = commodities.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#7c2d12' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Manajemen Komoditas</h1>
          <span className="text-xs font-mono ml-1" style={{ color: '#8a8580' }}>{commodities.length} komoditas</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}>
              <span style={{ color: '#8a8580' }}>🔍</span>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari..." className="border-none outline-none bg-transparent w-28 text-xs" />
            </div>
            <button onClick={startAdd}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{ background: '#1a1612', color: '#f5f1ea' }}>
              + Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="flex-shrink-0 px-4 py-3" style={{ background: '#f5f1ea', borderBottom: '1px solid #d8d4cb' }}>
          <div className="text-xs font-bold mb-2">{editId ? 'Edit Komoditas' : 'Tambah Komoditas'}</div>
          <div className="flex gap-2 flex-wrap items-end">
            <div>
              <div className="text-xs mb-1" style={{ color: '#8a8580' }}>Nama *</div>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="px-2 py-1.5 rounded text-xs outline-none w-36"
                style={{ border: '1px solid #d8d4cb', background: '#fff' }}
                placeholder="Bawang Merah" />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#8a8580' }}>Satuan *</div>
              <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                className="px-2 py-1.5 rounded text-xs outline-none w-16"
                style={{ border: '1px solid #d8d4cb', background: '#fff' }}
                placeholder="kg" />
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#8a8580' }}>Kategori</div>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="px-2 py-1.5 rounded text-xs outline-none"
                style={{ border: '1px solid #d8d4cb', background: '#fff' }}>
                <option value="">— Pilih —</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <input type="checkbox" id="is_sp2kp" checked={form.is_sp2kp}
                onChange={(e) => setForm((f) => ({ ...f, is_sp2kp: e.target.checked }))} />
              <label htmlFor="is_sp2kp" className="text-xs">SP2KP</label>
            </div>
            {error && <span className="text-xs" style={{ color: '#991b1b' }}>{error}</span>}
            <div className="flex gap-1.5">
              <button onClick={submit} disabled={submitting}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: '#1a1612', color: '#f5f1ea' }}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded text-xs font-medium"
                style={{ background: '#e5e1d8', color: '#1a1612' }}>
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>Memuat...</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ background: '#f0ece4', borderBottom: '1px solid #d8d4cb' }}>
                <th className="px-4 py-2 text-left font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Nama</th>
                <th className="px-4 py-2 text-left font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Satuan</th>
                <th className="px-4 py-2 text-left font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Kategori</th>
                <th className="px-4 py-2 text-center font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>SP2KP</th>
                <th className="px-4 py-2 text-right font-mono uppercase tracking-wide" style={{ color: '#8a8580' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id}
                  style={{
                    background: i % 2 === 0 ? '#fafaf8' : '#fff',
                    borderBottom: '1px solid #e8e5de',
                  }}>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2 font-mono" style={{ color: '#8a8580' }}>{c.unit}</td>
                  <td className="px-4 py-2" style={{ color: '#4a4540' }}>
                    {c.category ? (
                      <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: '#e5e1d8' }}>
                        {c.category}
                      </span>
                    ) : <span style={{ color: '#c0bdb8' }}>—</span>}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => toggleSP2KP(c)}
                      className="px-2 py-0.5 rounded font-mono text-xs"
                      style={{
                        background: c.is_sp2kp ? '#dcfce7' : '#f5f1ea',
                        color: c.is_sp2kp ? '#166534' : '#8a8580',
                        border: `1px solid ${c.is_sp2kp ? '#86efac' : '#d8d4cb'}`,
                      }}>
                      {c.is_sp2kp ? '✓ Ya' : '✕ Tidak'}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => startEdit(c)}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: '#e5e1d8', color: '#1a1612' }}>
                        Edit
                      </button>
                      <button onClick={() => deleteCommodity(c.id, c.name)}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ background: '#fee2e2', color: '#991b1b' }}>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
