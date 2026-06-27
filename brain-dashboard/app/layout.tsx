import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pauli Second Brain',
  description: 'Pi Agent — ArchonX Second Brain Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased h-screen overflow-hidden">{children}</body>
    </html>
  )
}
