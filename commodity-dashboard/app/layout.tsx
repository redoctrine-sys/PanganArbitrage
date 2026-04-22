import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PanganArbitrage',
  description: 'Dashboard analitik harga pangan & arbitrase komoditas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  )
}
