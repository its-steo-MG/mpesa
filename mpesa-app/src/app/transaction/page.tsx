// app/transactions/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'

type Transaction = {
  id: number
  transaction_type: 'deposit' | 'withdrawal' | 'transfer'
  amount: number
  description: string
  recipient_name: string
  recipient_phone: string
  reference: string
  mpesa_id: string
  created_at: string
  category?: string
}

const avatarColors = [
  '#6B7280', // gray
  '#60A5FA', // soft blue
  '#A78BFA', // soft violet
  '#34D399', // soft emerald
  '#FBBF24', // soft amber
  '#F472B6', // soft pink
  '#818CF8', // soft indigo
  '#F87171', // soft red
]

export default function MpesaStatements() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentMonth, setCurrentMonth] = useState('')
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    // Set dynamic month
    const month = new Date().toLocaleString('en-US', { month: 'long' }).toUpperCase()
    setCurrentMonth(month)

    const token = localStorage.getItem('mpesa_access_token')
    if (!token) {
      router.replace('/login')
      return
    }

    const fetchTransactions = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/transactions/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const sorted = [...res.data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        setTransactions(sorted)
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('mpesa_access_token')
          router.replace('/login')
        } else {
          setError('Unable to load statements')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    // Scroll listener for export button
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 200)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [router])

  const grouped = transactions.reduce((acc: Record<string, Transaction[]>, tx) => {
    const dateStr = new Date(tx.created_at).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).toUpperCase()

    acc[dateStr] = acc[dateStr] || []
    acc[dateStr].push(tx)
    return acc
  }, {})

  const getInitials = (name = '') => {
    const cleaned = name.trim()
    if (!cleaned) return '??'
    const parts = cleaned.split(/\s+/)
    return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase()
  }

  const getAvatarColor = (str: string) => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return avatarColors[Math.abs(hash) % avatarColors.length]
  }

  const maskValue = (value = '') => {
    if (!value) return '—'
    const digits = value.replace(/\D/g, '')
    if (digits.length < 9) return value
    return digits.slice(0, 6) + '***' + digits.slice(-3)
  }

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'deposit' ? '+' : '-'
    const color = type === 'deposit' ? 'text' : 'text-white'
    const num = Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return { sign, color, num }
  }

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase()

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (error || Object.keys(grouped).length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p>{error || 'No transactions found'}</p>
        <button onClick={() => router.back()} className="text-[#00C853] underline">
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24 sm:pb-20 lg:pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-gray-800/50">
        <div className="flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 max-w-3xl mx-auto">
          <button onClick={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm sm:text-base font-semibold tracking-tight">
            M-PESA STATEMENTS
          </h1>
          <Search size={18} className="sm:size-5" />
        </div>
      </header>

      {/* Month pill */}
      <div className="flex justify-center py-3 sm:py-4">
        <div className="bg-green-800/70 text-white font-semibold px-5 py-1.5 rounded-full text-xs sm:text-sm uppercase tracking-wide shadow-sm">
          {currentMonth}
        </div>
      </div>

      {/* Transactions */}
      <div className="px-3 sm:px-4 lg:px-6 space-y-6 sm:space-y-7 max-w-3xl mx-auto">
        {Object.entries(grouped).map(([date, txs]) => (
          <section key={date}>
            <h2 className="text-xs sm:text-sm text-gray-400 font-medium mb-2.5 sm:mb-3">
              {date}
            </h2>

            <div className="space-y-4 sm:space-y-5">
              {txs.map((tx) => {
                const { sign, color, num } = formatAmount(tx.amount, tx.transaction_type)
                const name = (tx.recipient_name || tx.description || 'Unknown').toUpperCase()
                const refOrPhone = tx.recipient_phone || tx.mpesa_id || tx.reference || ''
                const bgColor = getAvatarColor(name)

                return (
                  <Link
                    key={tx.id}
                    href={`/transaction/${tx.id}`}
                    className="flex items-start gap-3 active:opacity-80 transition-opacity"
                  >
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-white"
                      style={{ backgroundColor: bgColor }}
                    >
                      {getInitials(name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-xs sm:text-[13.5px] font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
                          {name}
                        </p>
                        <p className={`text-xs sm:text-[13.5px] font-medium whitespace-nowrap ${color} flex-shrink-0`}>
                          {sign} KSH. {num}
                        </p>
                      </div>

                      <div className="flex justify-between items-baseline text-[10px] sm:text-[11px] text-gray-400 mt-0.5">
                        <p className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[70%]">
                          {maskValue(refOrPhone)}
                        </p>
                        <p className="whitespace-nowrap">
                          {formatTime(tx.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Export button with animation */}
    <div className="fixed bottom-5 sm:bottom-6 right-3 sm:right-5 z-20 pointer-events-none">
      <button
        className={`pointer-events-auto flex items-center gap-2 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-300 ${
          isScrolled
            ? 'bg-gray-700/95 text-white px-6 py-3 text-sm backdrop-blur-md border border-gray-600/60'
            : 'bg-gray-700/90 text-white p-3.5 w-12 h-12 justify-center backdrop-blur-md border border-gray-600/50'
        }`}
        onClick={() => alert('Export coming soon')}
      >
        <span className="text-xl">📄</span>
        {isScrolled && <span className="font-semibold">EXPORT STATEMENTS</span>}
      </button>
    </div>
    </div>
  )
}