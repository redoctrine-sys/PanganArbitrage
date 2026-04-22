export default function PedagangPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ background: '#f0ece4', borderBottom: '2px solid #d8d4cb' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1 h-5 rounded-sm" style={{ background: '#1e3a5f' }} />
          <h1 className="text-base font-bold" style={{ fontFamily: 'Georgia, serif' }}>
            Data Pedagang
          </h1>
        </div>
        <p className="text-xs" style={{ color: '#8a8580' }}>
          Input harga dari pedagang lapangan — Phase 2
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center" style={{ color: '#8a8580' }}>
        <div className="text-center">
          <div className="text-4xl mb-3">🏪</div>
          <div className="font-medium mb-1">Fitur Pedagang</div>
          <div className="text-xs">Akan diimplementasikan di Phase 2</div>
        </div>
      </div>
    </div>
  )
}
