import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Zenith — The Celestial Eye',
  description:
    'Real-time cosmic radar platform. Pick any location on Earth and instantly see celestial objects overhead — ISS, satellites, planets, and constellations.',
  keywords: ['space', 'ISS', 'satellites', 'planets', 'celestial', 'radar', 'cosmic', 'astronomy'],
  authors: [{ name: 'Project Zenith' }],
  openGraph: {
    title: 'Project Zenith — The Celestial Eye',
    description: 'Real-time cosmic radar. See what\'s above you right now.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
