// app/layout.tsx
import './globals.css'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My OneApp',
  description: 'Send money, pay bills, withdraw cash - all in one app',
  manifest: '/manifest.json',
  
  // Change this to a neutral/dark color so the status bar looks normal
  themeColor: '#000000',        // or '#0a0a0a' to match your dark background
  
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  icons: {
    icon: '/mpesa icon.webp',
    apple: '/mpesa icon.webp',
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