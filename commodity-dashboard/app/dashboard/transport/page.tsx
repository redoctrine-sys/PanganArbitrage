'use client'

import { useState, useEffect, useCallback } from 'react'
import type { TransportVendor, CityDistance } from '@/types/transport'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import TransportForm from '@/components/transport/TransportForm'
import EmptyState from '@/components/shared/EmptyState'

type City = { id: string; name: string; province: string | null }

export default function TransportPage() {
  const [tab, setTab] = useState<'vendor' | 'jarak' | 'tambah'>('vendor')
  const [vendors, setVendors] = useState<TransportVendor[]>([])
  const [distances, setDistances] = useState<any[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [computing, setComputing] = useState(false)
  const [distForm, setDistForm] = useState({ from_id: '', to_id: '', distance_km: '', duration_hours: '', route_type: 'darat' })
  const [distError, setDistError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, dRes, cRes] = await Promise.all([
        fetch('/api/transport'),
        fetch('/api/distances'),
        fetch('/api/admin/cities-list'),
      ])
      const [vData, dData, cData] = await Promise.all([vRes.json(), dRes.json(), cRes.json()])
      setVendors(vData.data ?? [])
      setDistances(dData.data ?? [])
      setCities(cData.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function computeOSRM() {
    if (!distForm.from_id || !distForm.to_id) return
    setComputing(true)
    setDistError(null)
    try {
      const res = await fetch('/api/distances/compute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_from_id: distForm.from_id, city_to_id: distForm.to_id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.result) {
        setDistForm((p) => ({
          ...p,
          distance_km: String(data.result.distance_km),
          duration_hours: String(data.result.duration_hours),
          route_type: data.result.route_type,
        }))
      }
    } catch (e: any) {
      setDistError(e.message)
    } finally {
      setComputing(false)
    }
  }

  async function saveDistance() {
    if (!distForm.from_id || !distForm.to_id || !distForm.distance_km) return
    const res = await fetch('/api/distances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(distForm),
    })
    if (res.ok) {
      setDistForm({ from_id: '', to_id: '', distance_km: '', duration_hours: '', route_type: 'darat' })
      loadData()
    }
  }

  const MODA_COLORS: Record<string, { bg: string; color: string }> = {
    truk: { bg: '#e5e1d8', color: '#4a4540' },
    pickup: { bg: '#dbeafe', color: '#1e3a5f' },
    ekspedisi: { bg: '#ede9fe', color: '#4c1d95' },
    kapal: { bg: '#dcfce7', color: '#166534' },
    motor: { bg: '#fef3c7', color: '#713f12' },
    lainnya: { bg: '#f3f4f6', color: '#6b7280' },
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#7c2d12' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>Transport & Jarak</h1>
          <span className="text-xs px-2 py-0.5 rounded font-mono ml-1" style={{ background: '#ffedd5', color: '#7c2d12' }}>
            {vendors.length} vendor · {distances.length} rute
          </span>
        </div>
        <div className="flex gap-1">
          {[
            { id: 'vendor', label: 'Vendor Transport' },
            { id: 'jarak', label: 'Jarak Kota' },
            { id: 'tambah', label: '+ Tambah Vendor' },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all border"
              style={{
                background: tab === t.id ? '#f5f1ea' : 'transparent',
                borderColor: tab === t.id ? '#c4bfb5' : 'transparent',
                color: tab === t.id ? '#1a1612' : '#8a8580',
                fontWeight: tab === t.id ? 600 : 400,
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Vendor list */}
        {tab === 'vendor' && (
          loading ? (
            <div className="text-xs text-center py-12" style={{ color: '#8a8580' }}>Memuat...</div>
          ) : vendors.length === 0 ? (
            <EmptyState icon="🚛" title="Belum ada vendor transport" desc="Tambah vendor untuk kalkulasi biaya pengiriman"
              action={<button onClick={() => setTab('tambah')} className="px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ background: '#7c2d12', color: '#ffedd5' }}>+ Tambah Vendor</button>} />
          ) : (
            <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {vendors.map((v) => {
                const c = MODA_COLORS[v.moda ?? 'lainnya'] ?? MODA_COLORS.lainnya
                return (
                  <div key={v.id} className="rounded-lg p-4" style={{ background: '#fafaf8', border: '1px solid #d8d4cb' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-sm">{v.nama}</div>
                        {v.kontak && <div className="text-xs font-mono" style={{ color: '#8a8580' }}>{v.kontak}</div>}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded font-medium" style={c}>
                        {v.moda}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span style={{ color: '#8a8580' }}>Harga</span>
                        <span className="font-mono font-semibold">
                          {v.price_type === 'per_km'
                            ? `${formatRupiah(v.price_per_km)}/km`
                            : `${formatRupiah(v.price_flat)} (flat)`}
                        </span>
                      </div>
                      {v.kapasitas_kg && (
                        <div className="flex justify-between">
                          <span style={{ color: '#8a8580' }}>Kapasitas</span>
                          <span className="font-mono">{v.kapasitas_kg.toLocaleString('id-ID')} kg</span>
                        </div>
                      )}
                      {v.catatan && (
                        <div className="mt-2 text-xs p-2 rounded" style={{ background: '#f0ece4', color: '#4a4540' }}>
                          {v.catatan}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Distance table + add form */}
        {tab === 'jarak' && (
          <div className="p-4">
            {/* Add distance form */}
            <div className="rounded-lg p-4 mb-4" style={{ background: '#fafaf8', border: '1px solid #d8d4cb' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: '#4a4540' }}>Tambah / Update Jarak</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[
                  { key: 'from_id', label: 'Dari Kota' },
                  { key: 'to_id', label: 'Ke Kota' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs mb-1" style={{ color: '#4a4540' }}>{label}</label>
                    <select value={(distForm as any)[key]}
                      onChange={(e) => setDistForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="w-full text-xs px-2 py-1.5 rounded-md outline-none"
                      style={{ border: '1px solid #d8d4cb', background: '#fff' }}>
                      <option value="">-- Pilih --</option>
                      {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={computeOSRM} disabled={computing || !distForm.from_id || !distForm.to_id}
                  className="text-xs px-3 py-1.5 rounded-md font-medium"
                  style={{ background: '#1a1612', color: '#f5f1ea' }}>
                  {computing ? 'Menghitung...' : '📍 Hitung via OSRM'}
                </button>
                <div className="flex items-center gap-1">
                  <input value={distForm.distance_km} onChange={(e) => setDistForm((p) => ({ ...p, distance_km: e.target.value }))}
                    placeholder="km" type="number" className="w-20 text-xs px-2 py-1.5 rounded-md font-mono outline-none"
                    style={{ border: '1px solid #d8d4cb' }} />
                  <span className="text-xs" style={{ color: '#8a8580' }}>km</span>
                  <input value={distForm.duration_hours} onChange={(e) => setDistForm((p) => ({ ...p, duration_hours: e.target.value }))}
                    placeholder="jam" type="number" className="w-16 text-xs px-2 py-1.5 rounded-md font-mono outline-none"
                    style={{ border: '1px solid #d8d4cb' }} />
                  <span className="text-xs" style={{ color: '#8a8580' }}>jam</span>
                </div>
                <button onClick={saveDistance}
                  disabled={!distForm.from_id || !distForm.to_id || !distForm.distance_km}
                  className="text-xs px-3 py-1.5 rounded-md font-medium"
                  style={{ background: '#1b5e3b', color: '#e8f3ec' }}>
                  Simpan
                </button>
              </div>
              {distError && <div className="text-xs" style={{ color: '#991b1b' }}>{distError}</div>}
            </div>

            {/* Distance list */}
            {distances.length === 0 ? (
              <div className="text-xs text-center py-8" style={{ color: '#8a8580' }}>
                Belum ada data jarak. Tambah rute di atas.
              </div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead style={{ background: '#edeae2' }}>
                  <tr>
                    {['Dari', 'Ke', 'Jarak', 'Durasi', 'Tipe', 'Source'].map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-medium" style={{ borderBottom: '1px solid #d8d4cb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {distances.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid #e5e1d8' }}>
                      <td className="px-3 py-2">{d.city_from?.name ?? '—'}</td>
                      <td className="px-3 py-2">{d.city_to?.name ?? '—'}</td>
                      <td className="px-3 py-2 font-mono">{d.distance_km} km</td>
                      <td className="px-3 py-2 font-mono">{d.duration_hours ? `${d.duration_hours} jam` : '—'}</td>
                      <td className="px-3 py-2" style={{ color: '#4a4540' }}>{d.route_type ?? '—'}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-xs"
                          style={{ background: d.source === 'osrm' ? '#dcfce7' : '#e5e1d8', color: d.source === 'osrm' ? '#166534' : '#4a4540' }}>
                          {d.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Add vendor form */}
        {tab === 'tambah' && (
          <div className="p-4 max-w-xl">
            <div className="text-sm font-medium mb-4">Tambah Vendor Transport</div>
            <TransportForm onSuccess={() => { loadData(); setTab('vendor') }} />
          </div>
        )}
      </div>
    </div>
  )
}
