'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Settings } from 'lucide-react'
import axios from 'axios'

type Transaction = {
  id: number
  transaction_type: 'deposit' | 'withdrawal' | 'transfer'
  amount: string | number
  description: string
  recipient_name?: string
  recipient_phone?: string
  mpesa_id?: string
  reference?: string
  created_at: string
}

export default function MpesaStatements() {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
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
  }, [router])

  // Group by date
  const grouped = transactions.reduce((acc: Record<string, Transaction[]>, tx) => {
    const dateStr = new Date(tx.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    if (!acc[dateStr]) acc[dateStr] = []
    acc[dateStr].push(tx)
    return acc
  }, {})

  const getInitials = (name = '') => {
    if (!name) return '??'
    const parts = name.trim().split(/\s+/)
    return (parts[0]?.[0] + (parts[1]?.[0] || '')).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const key = name.slice(0, 2).toUpperCase()
    const colors: Record<string, string> = {
      'SB': '#C9A56E',
      'KP': '#14B8A6',
      'AK': '#9CA53F',
      'MM': '#4ADE80',
      'MF': '#A855F7',
      'JM': '#4ADE80',
      'AG': '#22C55E',
    }
    return colors[key] || '#22C55E'
  }

  const showPlainId = (value = '') => value || '—'

  const formatAmount = (tx: Transaction) => {
    const numAmount = typeof tx.amount === 'string' 
      ? parseFloat(tx.amount) 
      : tx.amount

    const absAmount = Math.abs(numAmount).toFixed(1)
    return tx.transaction_type === 'deposit' 
      ? `+KSH ${absAmount}` 
      : `-KSH ${absAmount}`
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).toLowerCase()
  }

  const handleTransactionClick = (id: number) => {
    router.push(`/transaction/${id}`)
  }

  if (loading) return <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center text-white">Loading statements...</div>

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] text-white flex flex-col items-center justify-center p-6">
        <p className="text-red-500">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-[#00C853]">Try Again</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F0A] text-white pb-28">
      {/* Header with centered title and simple "<" back button */}
      <header className="sticky top-0 z-50 bg-[#0A0F0A] border-b border-gray-800 px-4 py-4">
        <div className="flex items-center">
          {/* Simple "<" Back Button */}
          <button 
            onClick={() => router.back()} 
            className="text-3xl font-light text-white pr-4 active:opacity-70"
          >
            ‹
          </button>

          {/* Centered Title */}
          <h1 className="flex-1 text-center text-lg font-semibold tracking-tight">
            M-PESA Statements
          </h1>

          {/* Spacer to balance layout */}
          <div className="w-10" />
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00C853]">
            <Search size={18} />
          </div>
          <input
            type="text"
            placeholder="Search transactions"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-gray-700 rounded-2xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[#00C853]"
          />
        </div>

        {/* April Pill */}
        <div className="mt-4">
          <div className="inline-block bg-[#00C853] text-black font-semibold px-6 py-1.5 rounded-full text-sm">
            April
          </div>
        </div>
      </header>

      {/* Transactions List - Tight Spacing */}
      <div className="px-4 pt-6 space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <h2 className="text-xl font-semibold mb-4 tracking-tight">{date}</h2>
            
            <div className="space-y-0.5">
              {txs.map((tx) => {
                const name = tx.recipient_name || tx.description || 'Unknown'
                const avatarColor = getAvatarColor(name)

                return (
                  <div
                    key={tx.id}
                    onClick={() => handleTransactionClick(tx.id)}
                    className="flex items-start gap-3 cursor-pointer active:bg-zinc-900/60 rounded-2xl p-1.5 -mx-2 transition-colors hover:bg-zinc-900/30"
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5"
                      style={{ backgroundColor: avatarColor }}
                    >
                      {getInitials(name)}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[14px] font-medium truncate text-white">
                        {name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 font-mono tracking-wider">
                        {showPlainId(tx.recipient_phone || tx.mpesa_id || tx.reference)}
                      </p>
                    </div>

                    {/* Amount & Time - All white */}
                    <div className="text-right shrink-0 pt-0.5">
                      <p className="text-[14px] font-semibold text-white">
                        {formatAmount(tx)}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {formatTime(tx.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <p className="text-center text-gray-400 py-10">No transactions yet</p>
        )}
      </div>

      {/* Floating Button */}
      <div className="fixed bottom-6 right-4 z-50">
        <button
          onClick={() => alert('Statement Options - Coming Soon')}
          className="flex items-center gap-2 bg-zinc-900 border border-gray-700 hover:border-gray-600 active:scale-95 transition-all rounded-full px-5 py-3 shadow-2xl"
        >
          <Settings size={17} className="text-[#00C853]" />
          <span className="text-[#00C853] font-medium text-sm">Statement Options</span>
        </button>
      </div>
    </div>
  )
}