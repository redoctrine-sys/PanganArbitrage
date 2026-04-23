'use client'

import { useState, useEffect, useCallback } from 'react'
import type { City, Commodity } from '@/types/prices'
import { formatRupiah } from '@/lib/utils/format-rupiah'
import { formatDate } from '@/lib/utils/date'
import PedagangForm from '@/components/pedagang/PedagangForm'
import HargaForm from '@/components/pedagang/HargaForm'
import EmptyState from '@/components/shared/EmptyState'

type PedagangWithData = {
  id: string
  nama: string
  no_hp: string | null
  city_id: string
  lokasi_detail: string | null
  keterangan: string | null
  city?: { id: string; name: string; province: string | null }
  harga?: {
    id: string
    price: number
    date: string
    satuan: string
    commodity?: { id: string; name: string; unit: string }
  }[]
}

export default function PedagangPage() {
  const [tab, setTab] = useState<'list' | 'tambah'>('list')
  const [pedagang, setPedagang] = useState<PedagangWithData[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [commodities, setCommodities] = useState<Commodity[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hargaFormId, setHargaFormId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [pdRes, citiesRes, commRes] = await Promise.all([
        fetch('/api/pedagang'),
        fetch('/api/admin/cities-list'),
        fetch('/api/admin/commodities-list'),
      ])
      const [pdData, citiesData, commData] = await Promise.all([
        pdRes.json(), citiesRes.json(), commRes.json()
      ])
      setPedagang(pdData.data ?? [])
      setCities(citiesData.data ?? [])
      setCommodities(commData.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = pedagang.filter((p) =>
    !search || p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#1e3a5f' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Data Pedagang
          </h1>
          <span
            className="text-xs px-2 py-0.5 rounded font-mono ml-1"
            style={{ background: '#dbeafe', color: '#1e3a5f' }}
          >
            {pedagang.length} pedagang
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mb-3">
          {[
            { label: 'Total Pedagang', value: pedagang.length.toString() },
            {
              label: 'Total Harga',
              value: pedagang.reduce((s, p) => s + (p.harga?.length ?? 0), 0).toString(),
            },
            {
              label: 'Kota Tercakup',
              value: new Set(pedagang.map((p) => p.city_id)).size.toString(),
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-lg px-3 py-2"
              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
            >
              <div className="text-xs font-mono uppercase tracking-wide mb-1" style={{ color: '#8a8580' }}>
                {s.label}
              </div>
              <div className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { id: 'list', label: 'Daftar Pedagang' },
            { id: 'tambah', label: '+ Tambah Pedagang' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className="px-3 py-1 rounded-md text-xs font-medium transition-all border"
              style={{
                background: tab === t.id ? '#f5f1ea' : 'transparent',
                borderColor: tab === t.id ? '#c4bfb5' : 'transparent',
                color: tab === t.id ? '#1a1612' : '#8a8580',
                fontWeight: tab === t.id ? 600 : 400,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'tambah' ? (
          <div className="p-4 max-w-xl">
            <div className="text-sm font-medium mb-4">Tambah Pedagang Baru</div>
            <PedagangForm
              cities={cities}
              commodities={commodities}
              onSuccess={() => {
                loadData()
                setTab('list')
              }}
            />
          </div>
        ) : (
          <>
            {/* Filter */}
            <div
              className="flex gap-2 items-center px-4 py-2 sticky top-0 z-10"
              style={{ background: '#edeae2', borderBottom: '1px solid #d8d4cb' }}
            >
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs flex-1 max-w-48"
                style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
              >
                <span style={{ color: '#8a8580' }}>🔍</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama / kota..."
                  className="border-none outline-none bg-transparent w-full text-xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-xs" style={{ color: '#8a8580' }}>
                Memuat...
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon="🏪"
                title="Belum ada data pedagang"
                desc="Tambah pedagang untuk mulai input harga lapangan"
                action={
                  <button
                    onClick={() => setTab('tambah')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium"
                    style={{ background: '#1e3a5f', color: '#dbeafe' }}
                  >
                    + Tambah Pedagang
                  </button>
                }
              />
            ) : (
              <div className="divide-y" style={{ borderColor: '#d8d4cb' }}>
                {filtered.map((p) => {
                  const isExpanded = expandedId === p.id
                  const latestHarga = p.harga?.slice().sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                  ).slice(0, 3) ?? []

                  return (
                    <div key={p.id}>
                      {/* Pedagang row */}
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#f0ece4] transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                      >
                        <span style={{ color: '#8a8580', fontSize: 10, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                          ▶
                        </span>
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: '#1e3a5f', color: '#dbeafe' }}
                        >
                          {p.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{p.nama}</div>
                          <div className="text-xs" style={{ color: '#8a8580' }}>
                            {p.city?.name}{p.lokasi_detail ? ` · ${p.lokasi_detail}` : ''}
                          </div>
                        </div>
                        {p.no_hp && (
                          <span className="text-xs font-mono" style={{ color: '#8a8580' }}>
                            {p.no_hp}
                          </span>
                        )}
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{ background: '#e5e1d8', color: '#4a4540' }}
                        >
                          {p.harga?.length ?? 0} harga
                        </span>
                      </button>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2" style={{ background: '#fafaf8', borderTop: '1px solid #e5e1d8' }}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold" style={{ color: '#4a4540' }}>
                              Riwayat Harga
                            </span>
                            <button
                              onClick={() => setHargaFormId(hargaFormId === p.id ? null : p.id)}
                              className="text-xs px-2.5 py-1 rounded-md font-medium"
                              style={{ background: '#1e3a5f', color: '#dbeafe' }}
                            >
                              {hargaFormId === p.id ? 'Tutup' : '+ Input Harga'}
                            </button>
                          </div>

                          {/* Harga form */}
                          {hargaFormId === p.id && (
                            <div
                              className="rounded-lg p-3 mb-3"
                              style={{ background: '#f5f1ea', border: '1px solid #d8d4cb' }}
                            >
                              <HargaForm
                                pedagangId={p.id}
                                pedagangNama={p.nama}
                                commodities={commodities}
                                onSuccess={() => { loadData(); setHargaFormId(null) }}
                                onCancel={() => setHargaFormId(null)}
                              />
                            </div>
                          )}

                          {/* Harga table */}
                          {latestHarga.length === 0 ? (
                            <div className="text-xs py-4 text-center" style={{ color: '#8a8580' }}>
                              Belum ada data harga
                            </div>
                          ) : (
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr style={{ background: '#e5e1d8' }}>
                                  {['Komoditas', 'Harga', 'Satuan', 'Tanggal'].map((h) => (
                                    <th key={h} className="text-left px-2 py-1.5 font-medium">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {latestHarga.map((h) => (
                                  <tr key={h.id} style={{ borderBottom: '1px solid #e5e1d8' }}>
                                    <td className="px-2 py-1.5">{h.commodity?.name ?? '—'}</td>
                                    <td className="px-2 py-1.5 font-mono font-semibold">
                                      {formatRupiah(h.price)}
                                    </td>
                                    <td className="px-2 py-1.5" style={{ color: '#8a8580' }}>
                                      /{h.satuan}
                                    </td>
                                    <td className="px-2 py-1.5" style={{ color: '#8a8580' }}>
                                      {formatDate(h.date)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
