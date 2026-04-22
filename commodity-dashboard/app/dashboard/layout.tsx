'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  {
    label: 'SP2KP',
    href: '/dashboard/sp2kp',
    pip: '#1b5e3b',
    desc: 'Data resmi pemerintah',
  },
  {
    label: 'Pedagang',
    href: '/dashboard/pedagang',
    pip: '#1e3a5f',
    desc: 'Data lapangan',
  },
  {
    label: 'Komparasi',
    href: '/dashboard/komparasi',
    pip: '#4c1d95',
    desc: 'SP2KP vs Pedagang',
  },
  {
    label: 'Arbitrase AI',
    href: '/dashboard/arbitrase/ai',
    pip: '#7c2d12',
    desc: 'Analisis otomatis',
  },
  {
    label: 'Kalkulator',
    href: '/dashboard/arbitrase/manual',
    pip: '#7c2d12',
    desc: 'Manual multi-leg',
  },
]

const ADMIN_ITEMS = [
  { label: 'Naming Review', href: '/dashboard/admin/naming' },
  { label: 'Commodity Review', href: '/dashboard/admin/commodity' },
  { label: 'Ingest Log', href: '/dashboard/admin/ingest-log' },
  { label: 'Kota', href: '/dashboard/admin/cities' },
  { label: 'Komoditas', href: '/dashboard/admin/commodities' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Topbar */}
      <div
        className="flex items-center px-4 flex-shrink-0 relative z-50"
        style={{ background: '#1a1612', height: 50 }}
      >
        <span
          className="mr-5 whitespace-nowrap text-base font-bold"
          style={{ color: '#f5f1ea', fontFamily: 'Georgia, serif' }}
        >
          Pangan<span style={{ color: '#6ee7a0', fontStyle: 'italic' }}>Arbitrage</span>
        </span>

        <nav className="flex flex-1 gap-1 overflow-hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  color: active ? '#f5f1ea' : 'rgba(245,241,234,0.38)',
                  background: active ? 'rgba(245,241,234,0.12)' : 'transparent',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.pip }}
                />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs font-mono"
            style={{ color: 'rgba(245,241,234,0.28)' }}
          >
            {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className="flex-shrink-0 flex flex-col overflow-y-auto p-2"
          style={{ width: 186, background: '#f0ece4', borderRight: '1px solid #d8d4cb' }}
        >
          <div
            className="text-xs font-bold tracking-widest uppercase px-2 py-1.5"
            style={{ color: '#8a8580', letterSpacing: '1.6px' }}
          >
            Data
          </div>
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs mb-0.5 transition-all"
                style={{
                  color: active ? '#f5f1ea' : '#4a4540',
                  background: active ? '#1a1612' : 'transparent',
                  fontWeight: active ? 500 : 400,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.pip, opacity: active ? 1 : 0.5 }}
                />
                <span className="flex-1">{item.label}</span>
              </Link>
            )
          })}

          <hr className="my-1.5 border-t" style={{ borderColor: '#d8d4cb' }} />

          <div
            className="text-xs font-bold tracking-widest uppercase px-2 py-1.5"
            style={{ color: '#8a8580', letterSpacing: '1.6px' }}
          >
            Admin
          </div>
          {ADMIN_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs mb-0.5 transition-all"
                style={{
                  paddingLeft: 24,
                  color: active ? '#1a1612' : '#8a8580',
                  fontWeight: active ? 500 : 400,
                  background: active ? '#e5e1d8' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            )
          })}

          <div className="mt-auto" />
          <div
            className="p-2 rounded-lg text-xs font-mono leading-relaxed mt-2"
            style={{ background: '#f5f1ea', border: '1px solid #d8d4cb', color: '#8a8580' }}
          >
            <div><b style={{ color: '#4a4540' }}>v6</b> · Phase 1</div>
            <div>SP2KP aktif</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
