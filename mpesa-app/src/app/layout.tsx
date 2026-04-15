import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My OneApp',
  description: 'Mobile money made easy',
  manifest: '/manifest.json',
  themeColor: '#00A651',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/mpesa%20icon.webp',
    apple: '/mpesa%20icon.webp',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}