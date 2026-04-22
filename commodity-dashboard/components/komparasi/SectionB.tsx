'use client'

import { useState } from 'react'
import type { SectionBItem } from '@/types/komparasi'

type Props = {
  sp2kpOnly: SectionBItem[]
  pedagangOnly: SectionBItem[]
  onRequestPair?: (commodityId: string, name: string) => void
}

export default function SectionB({ sp2kpOnly, pedagangOnly, onRequestPair }: Props) {
  const [open, setOpen] = useState(false)

  const totalCount = sp2kpOnly.length + pedagangOnly.length
  if (totalCount === 0) return null

  return (
    <div
      className="mx-4 my-3 rounded-lg overflow-hidden"
      style={{ border: '1px solid #d8d4cb' }}
    >
      {/* Collapsible header */}
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors"
        style={{ background: open ? '#edeae2' : '#f0ece4' }}
        onClick={() => setOpen((v) => !v)}
      >
        <span
          className="text-xs transition-transform flex-shrink-0"
          style={{ color: '#8a8580', transform: open ? 'rotate(90deg)' : 'none' }}
        >
          ▶
        </span>
        <span className="font-semibold text-sm flex-1">
          Komoditas Eksklusif (Section B)
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded font-mono"
          style={{ background: '#e5e1d8', color: '#4a4540' }}
        >
          {totalCount} komoditas
        </span>
        <span className="text-xs" style={{ color: '#8a8580' }}>
          Tidak masuk arbitrase
        </span>
      </button>

      {open && (
        <div style={{ background: '#fafaf8' }}>
          {/* SP2KP Only */}
          {sp2kpOnly.length > 0 && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid #e5e1d8' }}>
              <div
                className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: '#1b5e3b' }}
              >
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: '#e8f3ec', color: '#1b5e3b' }}
                >
                  SP2KP
                </span>
                Hanya di SP2KP ({sp2kpOnly.length})
              </div>
              <div className="space-y-1.5">
                {sp2kpOnly.map((item) => (
                  <div
                    key={item.commodity_id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md"
                    style={{ background: '#f5f1ea', border: '1px solid #e5e1d8' }}
                  >
                    <span className="flex-1 text-xs font-medium">{item.commodity_name}</span>
                    {item.city_count != null && (
                      <span className="text-xs" style={{ color: '#8a8580' }}>
                        {item.city_count} kota
                      </span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#e5e1d8', color: '#4a4540' }}>
                      Tidak ada data pedagang
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pedagang Only */}
          {pedagangOnly.length > 0 && (
            <div className="px-4 py-3" style={{ borderTop: '1px solid #e5e1d8' }}>
              <div
                className="text-xs font-semibold mb-2 flex items-center gap-1.5"
                style={{ color: '#1e3a5f' }}
              >
                <span
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: '#dbeafe', color: '#1e3a5f' }}
                >
                  Pedagang
                </span>
                Hanya di Pedagang ({pedagangOnly.length})
              </div>
              <div className="space-y-1.5">
                {pedagangOnly.map((item) => (
                  <div
                    key={item.commodity_id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md"
                    style={{ background: '#f5f1ea', border: '1px solid #e5e1d8' }}
                  >
                    <span className="flex-1 text-xs font-medium">{item.commodity_name}</span>
                    {item.pedagang_count != null && (
                      <span className="text-xs" style={{ color: '#8a8580' }}>
                        {item.pedagang_count} pedagang
                      </span>
                    )}
                    {onRequestPair && (
                      <button
                        onClick={() => onRequestPair(item.commodity_id, item.commodity_name)}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: '#ede9fe', color: '#4c1d95' }}
                      >
                        → Ajukan Pairing
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
