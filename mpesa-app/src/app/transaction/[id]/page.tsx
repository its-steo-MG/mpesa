'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Copy, Star, RotateCw, Download, Share2 } from 'lucide-react'
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

export default function TransactionDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('mpesa_access_token')
    if (!token) {
      router.replace('/login')
      return
    }

    const fetchTransaction = async () => {
      try {
        setLoading(true)
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/mpesa/transactions/${id}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setTransaction(res.data)
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem('mpesa_access_token')
          router.replace('/login')
        } else if (err.response?.status === 404) {
          setError('Transaction not found')
        } else {
          setError('Failed to load transaction')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [id, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] text-white flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] text-white flex items-center justify-center p-6">
        {error || 'Transaction not found'}
      </div>
    )
  }

  const numAmount = typeof transaction.amount === 'string'
    ? parseFloat(transaction.amount)
    : transaction.amount

  const absAmount = Math.abs(numAmount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const isDeposit = transaction.transaction_type === 'deposit'
  const sign = isDeposit ? '+' : '-'

  const date = new Date(transaction.created_at)
  const formattedDate = `${date.getDate()}th ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()} | ${date
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase()}`

  const getInitials = (name: string = '') => {
    if (!name) return 'ST'
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  const handleCopy = () => {
    if (transaction.mpesa_id) {
      navigator.clipboard.writeText(transaction.mpesa_id)
      alert('Transaction ID copied!')
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0F0A] text-white flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-5">
        <button 
          onClick={() => router.back()} 
          className="relative w-8 h-8 flex items-center justify-center active:opacity-70"
        >
          <div className="relative w-7 h-7">
            <div className="absolute w-7 h-[3px] bg-red-500 rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded" />
            <div className="absolute w-7 h-[3px] bg-[#00C853] -rotate-45 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded" />
          </div>
        </button>

        <p className="text-sm text-gray-300 tracking-wide text-center flex-1 px-2 line-clamp-1">
          {formattedDate}
        </p>

        <div className="w-8" />
      </div>

      {/* Centered Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md mx-auto">
          <div className="relative">
            {/* Circular Avatar */}
            <div className="flex justify-center -mb-11 sm:-mb-12 z-20 relative">
              <div className="w-20 h-20 sm:w-[92px] sm:h-[92px] bg-[#2563EB] rounded-full flex items-center justify-center border-[7px] sm:border-[8px] border-[#0A0F0A] shadow-2xl">
                <span className="text-white text-[34px] sm:text-4xl font-bold tracking-widest">
                  {getInitials(transaction.recipient_name || transaction.description)}
                </span>
              </div>
            </div>

            {/* Main Card - Green line fixed at the top */}
            <div className="bg-[#181A18] rounded-3xl border border-gray-800 overflow-hidden relative">
              
              {/* Green Top Line - Now properly at the very top edge */}
              <div className="h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent absolute top-0 left-0 right-0 z-10" />

              <div className="px-5 sm:px-6 pb-9 pt-8">
                {/* Merchant Customer Payment */}
                <div className="flex justify-center mb-5">
                  <div className="bg-[#272A27] text-white text-xs font-medium px-6 py-1.5 rounded-full border border-gray-700">
                    Merchant Customer Payment
                  </div>
                </div>

                {/* Business Name */}
                <p className="text-center text-[17px] font-semibold tracking-wider text-white mb-2">
                  {transaction.recipient_name || 'SASHITRENDY TECHNOLOGIES'}
                </p>

                {/* Amount */}
                <p className="text-center text-[28px] sm:text-[31px] font-semibold mb-9 text-white">
                  {sign}KSH.{absAmount}
                </p>

                {/* Number */}
                <div className="mb-6">
                  <p className="text-xs text-gray-400 mb-1">Number</p>
                  <p className="text-[17px] font-medium tracking-wider text-white">
                    {transaction.recipient_phone || '5515738'}
                  </p>
                </div>

                {/* Separator Line */}
                <div className="h-px bg-gray-700 mb-6" />

                {/* Transaction ID + Copy Button */}
                <div>
                  <p className="text-xs text-gray-400 mb-1">Transaction ID</p>
                  <div className="flex items-center gap-3">
                    <p className="font-mono text-[16px] sm:text-[17px] tracking-widest text-white break-all">
                      {transaction.mpesa_id || 'UDF7P18A9C'}
                    </p>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 bg-[#272A27] hover:bg-[#323532] px-4 py-2 rounded-2xl text-sm text-white transition-colors flex-shrink-0"
                    >
                      <Copy size={16} />
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 mt-10 px-1">
            {[
              { icon: Star, color: 'text-yellow-400', label: 'Add to\nfavourites' },
              { icon: RotateCw, color: 'text-emerald-400', label: 'Reverse\ntransaction' },
              { icon: Download, color: 'text-emerald-400', label: 'Download\nreceipt' },
              { icon: Share2, color: 'text-emerald-400', label: 'Share\ndetails' },
            ].map((item, i) => (
              <button
                key={i}
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#272A27] rounded-2xl flex items-center justify-center border border-gray-800">
                  <item.icon size={22} className={item.color} />
                </div>
                <span className="text-[10px] text-gray-400 text-center leading-tight whitespace-pre">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Done Button */}
      <div className="px-5 pb-8">
        <button
          onClick={() => router.back()}
          className="w-full bg-[#00C853] text-black font-semibold text-lg py-4 rounded-2xl active:scale-[0.98] transition-all"
        >
          Done
        </button>
      </div>
    </div>
  )
}