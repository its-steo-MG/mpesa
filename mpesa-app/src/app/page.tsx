'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Moon,
  QrCode,
  ArrowDownLeft,
  HandCoins,
  CreditCard,
  Phone,
  House,
  ArrowLeft,
  Shapes,
  TrendingUp,
  Eye,
  EyeOff,
} from 'lucide-react'
import axios from 'axios'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [showBalance, setShowBalance] = useState(true)
  const [balance, setBalance] = useState<string>('0.00')
  const [fuliza, setFuliza] = useState<string>('0.00')
  const [userName, setUserName] = useState<string>('User')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [ads, setAds] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('mpesa_access_token')

    if (!token) {
      router.replace('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const profile = profileRes.data
        setUserName(profile.real_name || 'User')
        setUserPhoto(profile.profile_photo || null)
        setFuliza(profile.fuliza || '0.00')

        const balanceRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/balance/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setBalance(balanceRes.data.balance || '0.00')

        const txRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/transactions/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        // Only keep the latest transaction
        setTransactions(txRes.data.slice(0, 1) || [])

        // 3 banners matching your screenshot style
        setAds([
          {
            title: 'Zoea Ku-Invest as you spend on Ziidi Money Market Fund.',
            buttonText: 'Opt In',
            terms: 'T&Cs apply',
            image: 'https://via.placeholder.com/300x120/00A651/FFFFFF?text=Ziidi+Invest',
          },
          {
            title: 'Handle Njaanjuary Like a Pro na FULIZA',
            buttonText: 'Learn How',
            terms: 'T&Cs apply',
            image: 'https://via.placeholder.com/300x120/006633/FFFFFF?text=Fuliza+Pro',
          },
          {
            title: 'Jipange Kifedha ku-cheki credit status yako',
            buttonText: 'JIPANGE KIFEDHA',
            terms: 'T&Cs apply',
            image: 'https://via.placeholder.com/300x120/004D33/FFFFFF?text=Credit+Check',
          },
        ])
      } catch (err: any) {
        console.error('Data fetch failed:', err)
        if (err.response?.status === 401) {
          localStorage.removeItem('mpesa_access_token')
          router.replace('/login')
        } else {
          setError('Failed to load data. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Auto-scroll + update active dot
  useEffect(() => {
    if (!scrollRef.current || ads.length === 0) return

    const container = scrollRef.current
    const slideWidth = container.clientWidth
    let index = 0

    const interval = setInterval(() => {
      index = (index + 1) % ads.length
      setCurrentAdIndex(index)

      container.scrollTo({
        left: index * slideWidth,
        behavior: 'smooth',
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [ads.length])

  // Update active dot when user scrolls manually
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft
      const slideWidth = container.clientWidth
      const newIndex = Math.round(scrollLeft / slideWidth)
      setCurrentAdIndex(newIndex)
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const formattedBalance = Number(balance).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const quickActions = [
    { icon: ArrowDownLeft, label: 'SEND AND REQUEST', color: 'bg-[#00A651]' },
    { icon: HandCoins, label: 'PAY', color: 'bg-[#00A0E9]' },
    { icon: CreditCard, label: 'WITHDRAW', color: 'bg-[#FF0000]' },
    { icon: Phone, label: 'AIRTIME', color: 'bg-[#00BFFF]' },
  ]

  const financialServices = [
    { name: 'ZIIDI TRADER', logo: 'https://via.placeholder.com/64?text=Ziidi+Trader' },
    { name: 'ZIIDI INVEST & SAVE', logo: 'https://via.placeholder.com/64?text=Ziidi+Invest' },
    { name: 'M-SHWARI', logo: 'https://via.placeholder.com/64?text=M-Shwari' },
    { name: 'TUUNZA MAPATO', logo: 'https://via.placeholder.com/64?text=Tuunza+Mapato' },
  ]

  const maskReference = (ref?: string) => {
    if (!ref) return '—'
    const cleaned = ref.replace(/\D/g, '')
    if ((ref.startsWith('07') || ref.startsWith('01') || ref.startsWith('+254')) && cleaned.length === 10) {
      return cleaned.slice(0, 2) + '******' + cleaned.slice(-2)
    }
    if (cleaned.length <= 8) return ref
    return ref.slice(0, 4) + '...' + ref.slice(-4)
  }

  const getInitials = (str: string | undefined) => {
    if (!str?.trim()) return 'TX'
    const words = str.trim().split(/\s+/).filter(Boolean)
    const initials = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
    return initials || 'TX'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-[#00A651] mx-auto mb-2"></div>
          <p className="text-sm font-medium">Loading your M-PESA...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <p className="text-red-500 text-lg mb-4">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-[#00A651] hover:bg-green-700 px-5 py-2 rounded-lg font-medium text-white text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20 font-sans">
      {/* Header & Greeting */}
      <header className="px-4 pt-3 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#00A651]/30 shadow-sm">
              <Image
                src={userPhoto || 'https://via.placeholder.com/150/00A651/FFFFFF?text=MP'}
                alt={`${userName}'s profile`}
                fill
                className="object-cover"
                sizes="32px"
                priority
                onError={(e) => {
                  e.currentTarget.src = 'https://via.placeholder.com/150/00A651/FFFFFF?text=MP'
                }}
              />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Good evening,</p>
              <p className="text-base font-semibold">{userName} 👋</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="relative">
              <Bell className="w-4.5 h-4.5 text-gray-300" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full px-1 py-0">8</span>
            </div>
            <Moon className="w-4.5 h-4.5 text-gray-300" />
            <QrCode className="w-4.5 h-4.5 text-gray-300" />
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-gray-900 rounded-xl p-3.5">
          <p className="text-center text-gray-400 text-[11px] mb-1.5">Balance</p>
          <div className="flex items-center justify-center gap-2 mb-1.5">
            <p className="text-xl sm:text-2xl font-bold">
              {showBalance ? `Ksh. ${formattedBalance}` : '••••••'}
            </p>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-gray-400 hover:text-gray-200 transition"
            >
              {showBalance ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
            </button>
          </div>
          {fuliza !== '0.00' && (
            <p className="text-center text-cyan-400 text-[11px]">
              Available FULIZA: KSH {fuliza}
            </p>
          )}
        </div>
      </header>

      {/* Quick Actions */}
      <section className="px-4 mb-6">
        <div className="flex justify-between items-start gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className="flex flex-col items-center gap-1 flex-1 hover:scale-105 transition-transform"
            >
              <div className={`${action.color} w-10 h-10 rounded-full flex items-center justify-center shadow-md`}>
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[9px] text-center uppercase font-medium leading-tight">
                {action.label}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* M-PESA STATEMENTS - only latest one */}
      <section className="px-4 mb-6">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold uppercase">LATEST TRANSACTION</p>
          <Link href="/transactions" className="text-[#00A651] text-xs uppercase">
            SEE ALL
          </Link>
        </div>

        <div className="space-y-3">
          {transactions.length > 0 ? (
            transactions.slice(0, 1).map((tx, i) => (
              <Link
                key={tx.id || i}
                href={`/transaction/${tx.id}`}
                className="block rounded-xl p-3 flex items-center gap-2.5  hover:bg-gray-800 active:bg-gray-700 transition-colors duration-150"
              >
                <div className="w-9 h-9 bg-teal-500 rounded-full flex items-center justify-center text-base font-bold uppercase text-white shrink-0">
                  {getInitials(tx.recipient_name || tx.description || tx.reference)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm uppercase truncate">
                    {tx.description || 'Transaction'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {maskReference(tx.reference)}
                  </p>
                </div>
                <div className="text-right shrink-0 min-w-[90px]">
                  <p
                    className={`font-medium text-sm ${
                      tx.transaction_type === 'deposit' ? 'text-[]' : 'text-400'
                    }`}
                  >
                    {tx.transaction_type === 'deposit' ? '+' : '-'} KSH.{' '}
                    {Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {new Date(tx.created_at).toLocaleString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    }) || '—'}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-center text-gray-400 py-4 text-sm">No recent transactions</p>
          )}
        </div>
      </section>

      {/* Ad Banner – 3 banners + 3-dot indicator */}
      <section className="px-4 mb-8">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory no-scrollbar scroll-smooth"
        >
          {ads.map((ad, i) => (
            <div
              key={i}
              className="min-w-full snap-center bg-gradient-to-r from-[#004D33] to-[#00A651] rounded-2xl p-4 text-white flex items-center gap-3 shadow-lg"
            >
              <div className="flex-1">
                <p className="text-base font-bold mb-1 leading-tight">{ad.title}</p>
                <button className="bg-white text-[#004D33] px-4 py-2 rounded-full text-xs font-semibold mt-2 shadow">
                  {ad.buttonText}
                </button>
                <p className="text-[10px] mt-2 opacity-80">{ad.terms}</p>
              </div>
              <img src={ad.image} alt={ad.title} className="w-28 h-28 object-cover rounded-lg" />
            </div>
          ))}
        </div>

        {/* 3-dot indicator */}
        <div className="flex justify-center gap-2 mt-3">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (scrollRef.current) {
                  scrollRef.current.scrollTo({
                    left: i * scrollRef.current.clientWidth,
                    behavior: 'smooth',
                  })
                }
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                currentAdIndex === i ? 'bg-white scale-125' : 'bg-white/40'
              }`}
              aria-label={`Go to ad ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Financial Services */}
      <section className="px-4 mb-24">
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm font-semibold">Financial Services</p>
          <p className="text-[#00A651] text-xs">View All</p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {financialServices.map((service, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10">
                <Image src={service.logo} alt={service.name} width={44} height={44} className="object-contain" />
              </div>
              <p className="text-[9px] text-center uppercase leading-tight">{service.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
        <div className="grid grid-cols-4 py-2">
          <button className="flex flex-col items-center gap-0.5 text-[#00A651]">
            <House className="w-5 h-5" />
            <span className="text-[9px] uppercase">Home</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-[9px] uppercase">Transact</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-500">
            <Shapes className="w-5 h-5" />
            <span className="text-[9px] uppercase">Services</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-gray-500">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[9px] uppercase">Grow</span>
          </button>
        </div>
      </nav>
    </div>
  )
}