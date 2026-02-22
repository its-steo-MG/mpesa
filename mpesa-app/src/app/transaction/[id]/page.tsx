'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Copy } from 'lucide-react'
import axios from 'axios'

export default function TransactionDetail() {
  const router = useRouter()
  const { id } = useParams()
  const [transaction, setTransaction] = useState<any>(null)
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
        setError(null)
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/transactions/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setTransaction(res.data)
      } catch (err: any) {
        console.error('Fetch failed:', err)
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
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  }

  if (error || !transaction) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">{error || 'No data'}</div>
  }

  const formattedDate = new Date(transaction.created_at).toLocaleString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase().replace(',', '')

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').slice(0, 2)
  }

  const maskPhone = (phone: string) => {
    if (!phone) return '—'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) return phone
    return cleaned.slice(0, 6) + '*' + cleaned.slice(-3)  // Matches image: 254757*237
  }

  const getCategoryLabel = (cat: string) => {
    const choices: { [key: string]: string } = {
      family_friends: 'FAMILY AND FRIENDS',
      business: 'BUSINESS',
      other: 'OTHER',
    }
    return choices[cat] || '—'
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.mpesa_id || '')
      .then(() => alert('M-Pesa ID copied to clipboard!'))
      .catch(() => alert('Failed to copy M-Pesa ID.'))
  }

  const isDeposit = transaction.transaction_type === 'deposit'
  const isWithdrawal = transaction.transaction_type === 'withdrawal'
  const isBusinessToCustomer = isDeposit && transaction.category === 'business'
  const isCustomerToBusiness = isWithdrawal
  const transactionTypeLabel = isBusinessToCustomer 
    ? 'BUSINESS TO CUSTOMER' 
    : (isCustomerToBusiness 
      ? 'CUSTOMER TO BUSINESS' 
      : (isDeposit ? 'DEPOSIT' : transaction.transaction_type.toUpperCase()))

  const lowerLabel = isBusinessToCustomer || isCustomerToBusiness ? 'PAY BILL NUMBER' : 'PHONE NUMBER'
  const lowerValue = isBusinessToCustomer || isCustomerToBusiness
    ? (transaction.recipient_phone || '—') 
    : maskPhone(transaction.recipient_phone)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Top Bar - Matches image */}
      <div className="flex items-center px-4 py-3">
        <button onClick={() => router.back()} className="text-white">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <p className="flex-1 text-center text-sm uppercase">{formattedDate}</p>
      </div>

      {/* Main Card - Centered vertically and horizontally */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="bg-gray-800/80 rounded-2xl p-6 w-full max-w-md shadow-2xl">
          {/* Type Pill */}
          <div className="bg-gray-700/50 rounded-full px-4 py-1.5 mb-6 text-center text-sm font-medium uppercase">
            {transactionTypeLabel}
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-gray-600">
              {getInitials(transaction.recipient_name || transaction.description || 'TX')}
            </div>

            {/* Name - reduced size to fit one line */}
            <p className="text-lg font-medium uppercase text-center">
              {transaction.recipient_name || 'Unknown Recipient'}
            </p>

            {/* Amount - reduced size to fit one line */}
            <p className={`text-xl font-medium ${isDeposit ? 'text-[]' : 'text-white-500'}`}>
              {isDeposit ? '+' : '-'} KSH. {Math.abs(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>

            {/* ID with Copy */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[#00A651] text-sm font-bold"
            >
              ID: {transaction.mpesa_id || '—'}
              <Copy className="w-4 h-4" />
            </button>

            {/* Conditional Lower Field */}
            <p className="text-xs text-gray-400 uppercase mt-6">{lowerLabel}</p>
            <p className="text-sm font-medium">
              {lowerValue}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}