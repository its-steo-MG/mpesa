'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Bell,
  Moon,
  QrCode,
  ArrowDownLeft,
  CreditCard,
  Phone,
  House,
  ArrowLeft,
  Shapes,
  TrendingUp,
  Eye,
  EyeOff,
  ArrowUpDown,
  HandCoins,
  Banknote,
  ArrowDown,
  Radio,
  ArrowUpCircle,
  ArrowDownCircle,
  Globe,
  Scan,
  Building2,
  ShoppingCart,
  User,
  Smartphone,
  X,
} from 'lucide-react'
import axios from 'axios'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)

  const [showBalance, setShowBalance] = useState(true)
  const [balance, setBalance] = useState<string>('0.00')
  const [fuliza, setFuliza] = useState<string>('0.00')
  const [userName, setUserName] = useState<string>('User')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [greeting, setGreeting] = useState<string>('Good evening')
  const [transactions, setTransactions] = useState<any[]>([])
  const [ads, setAds] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Bottom sheet states
  const [showSendModal, setShowSendModal] = useState(false)
  const [showPayModal, setShowPayModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showAirtimeModal, setShowAirtimeModal] = useState(false)
  const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

  // Dynamic greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning');
      } else if (hour >= 12 && hour < 17) {
        setGreeting('Good afternoon');
      } else if (hour >= 17) {
        setGreeting('Good evening');
      } else {
        setGreeting('Good morning');
      }
    };

    updateGreeting();

    const interval = setInterval(updateGreeting, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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
        setTransactions(txRes.data.slice(0, 1) || [])

        // Updated: only images from public folder
        setAds([
          { image: '/ads/ziidi-invest.jpg' },
          { image: '/ads/fuliza.jpg' },
          { image: '/ads/credit.jpg' },
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

  // Detect scroll → compact header
  useEffect(() => {
    const handleScroll = () => {
      if (pageRef.current) {
        setIsScrolled(pageRef.current.scrollTop > 80)
      }
    }

    const page = pageRef.current
    if (page) {
      page.addEventListener('scroll', handleScroll)
      return () => page.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Carousel auto-scroll
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

  // Carousel dot update on manual scroll
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

 const formattedBalance = formatCurrency(balance);
 const formattedFuliza = formatCurrency(fuliza);

  const quickActions = [
    {
      icon: (
        <div className="rotate-[60deg]">
          <ArrowUpDown className="w-5 h-5 text-white sm:w-5.5 sm:h-5.5" />
        </div>
      ),
      label: 'SEND AND REQUEST',
      color: 'bg-[#00C853]',
      onClick: () => setShowSendModal(true),
    },
    {
      icon: <HandCoins className="w-5 h-5 text-white sm:w-5.5 sm:h-5.5" />,
      label: 'PAY',
      color: 'bg-[#2196F3]',
      onClick: () => setShowPayModal(true),
    },
    {
      icon: (
        <div className="relative w-6 h-6 flex items-center justify-center">
          <Banknote className="w-6 h-6 text-white" />
          <ArrowDown className="w-4 h-4 text-white absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3" />
        </div>
      ),
      label: 'WITHDRAW',
      color: 'bg-[#F44336]',
      onClick: () => setShowWithdrawModal(true),
    },
    {
      icon: <Radio className="w-5 h-5 text-white sm:w-5.5 sm:h-5.5" />,
      label: 'AIRTIME',
      color: 'bg-[#26C6DA]',
      onClick: () => setShowAirtimeModal(true),
    },
  ]

 const financialServices = [
  { name: 'ZIIDI TRADER',          logo: '/icons/ziidi-trader.jpg' },
  { name: 'ZIIDI INVEST & SAVE',   logo: '/icons/ziidi-invest-save.jpg' },
  { name: 'M-SHWARI',              logo: '/icons/m-shwari.jpg' },
  { name: 'TUUNZA MAPATO',         logo: '/icons/tuunza-mapato.jpg' },
];

const globalPayments = [
  { name: 'M-PESA VISA CARD',      logo: '/icons/mpesa-visa-card.jpg' },
  { name: 'INTERNATIONAL AIRTIME', logo: '/icons/international-airtime.jpg' },
  { name: 'PAYPAL',                logo: '/icons/paypal.jpg' },
];

  const maskReference = (ref?: string) => {
    if (!ref) return '—'
    const cleaned = ref.replace(/\D/g, '')
    if ((ref.startsWith('07') || ref.startsWith('01') || ref.startsWith('+254')) && cleaned.length === 10) {
      return cleaned.slice(0, 2) + '******' + cleaned.slice(-2)
    }
    if (cleaned.length <= 8) return ref
    return ref.slice(0, 4) + '...' + ref.slice(-4)
  }

  const getInitials = (name: string | undefined) => {
    if (!name?.trim()) return 'U'
    const parts = name.trim().split(/\s+/).filter(Boolean)
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
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
    <div
      ref={pageRef}
      className="min-h-screen bg-black text-white overflow-y-auto pb-20 font-sans relative"
    >
      {/* FIXED HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 bg-black transition-all duration-300 ${
          isScrolled ? 'py-2 shadow-md' : 'py-4'
        }`}
      >
        <div className="px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`relative w-8 h-8 rounded-full overflow-hidden border-2 border-[#00A651]/30 shadow-sm transition-all duration-300 ${
                isScrolled ? 'scale-90' : ''
              }`}
            >
              {userPhoto && (
                <Image
                  src={userPhoto}
                  alt={`${userName}'s profile`}
                  fill
                  className="object-cover"
                  sizes="32px"
                  priority
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}

              <div
                className={`absolute inset-0 flex items-center justify-center bg-[#00A651] text-white font-bold text-lg uppercase ${
                  userPhoto ? 'hidden' : 'flex'
                }`}
              >
                {getInitials(userName)}
              </div>
            </div>

            {!isScrolled && (
              <div>
                <p className="text-[11px] text-gray-400">{greeting},</p>
                <p className="text-base font-semibold">{userName} 👋</p>
              </div>
            )}
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
      </header>

      {/* MAIN CONTENT */}
      <div className={`${isScrolled ? 'pt-14' : 'pt-20'}`}>
        {/* Balance Card */}
        <div className="px-4 pt-4 pb-4">
          <div className="bg-gray-900 rounded-xl p-3.5">
            <p className="text-center text-gray-400 text-[11px] mb-1.5">Balance</p>
            <div className="flex items-center justify-center gap-2 mb-1.5">
              <p className="text-xl sm:text-2xl font-medium">
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
                Available FULIZA: KSH {formattedFuliza}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <section className="px-4 py-6">
          <div className="flex justify-center gap-2.5 sm:gap-6 max-w-md mx-auto">
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="flex flex-col items-center gap-1 flex-1 max-w-[70px] active:scale-95 transition-transform duration-150"
                onClick={action.onClick}
              >
                <div
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-md ${action.color}`}
                >
                  {action.icon}
                </div>
                <span className="text-[9px] sm:text-[10px] font-medium text-center leading-tight uppercase">
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* M-PESA STATEMENTS */}
        <section className="px-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-semibold uppercase">M-PESA STATEMENTS</p>
            <Link href="/transaction" className="text-[#00A651] text-xs uppercase">
              SEE ALL
            </Link>
          </div>

          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.slice(0, 1).map((tx, i) => (
                <Link
                  key={tx.id || i}
                  href={`/transaction/${tx.id}`}
                  className="block rounded-xl p-3 flex items-center gap-2.5 hover:bg-gray-800 active:bg-gray-700 transition-colors duration-150"
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
                        tx.transaction_type === 'deposit' ? 'text-white-400' : 'text-white-400'
                      }`}
                    >
                      {tx.transaction_type === 'deposit' ? '+' : '-'} KSH.{' '}
                      {Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {(() => {
                        const date = new Date(tx.created_at);
                        if (isNaN(date.getTime())) return '—';
                    
                        const datePart = date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                        });
                    
                        const timePart = date.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                        });
                    
                        return `${datePart}, ${timePart}`;
                      })() || '—'}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-gray-400 py-4 text-sm">No recent transactions</p>
            )}
          </div>
        </section>

        {/* Ad Banner – NOW IMAGE ONLY + DOTS KEPT */}
        <section className="px-4 mb-8">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory no-scrollbar scroll-smooth"
          >
            {ads.map((ad, i) => (
              <div
                key={i}
                className="min-w-full snap-center rounded-2xl overflow-hidden shadow-lg"
              >
                <Image
                  src={ad.image}
                  alt="Banner"
                  width={600}
                  height={240}
                  className="w-full h-auto object-cover"
                  priority={i === 0} // load first faster
                />
              </div>
            ))}
          </div>

          {/* Dots kept exactly as before */}
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
<section className="px-4 mb-6">
  <div className="bg-gray-900 rounded-xl p-4">
    <div className="flex justify-between items-center mb-3">
      <p className="text-sm font-semibold">Financial Services</p>
      <p className="text-[#00A651] text-xs">View All</p>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {financialServices.map((service, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
            <Image
              src={service.logo}
              alt={`${service.name} logo`}
              width={48}
              height={48}
              className="w-full h-full object-cover"  // ← changed to object-cover + full size
            />
          </div>
          <p className="text-[9px] text-center uppercase leading-tight mt-1">
            {service.name}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>

{/* Global Payments */}
<section className="px-4 mb-24">
  <div className="bg-gray-900 rounded-xl p-4">
    <div className="flex justify-between items-center mb-3">
      <p className="text-sm font-semibold">Global Payments</p>
      <p className="text-[#00A651] text-xs">View All</p>
    </div>
    <div className="grid grid-cols-4 gap-3">
      {globalPayments.map((service, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
            <Image
              src={service.logo}
              alt={`${service.name} logo`}
              width={48}
              height={48}
              className="w-full h-full object-cover"  // ← changed to object-cover + full size
            />
          </div>
          <p className="text-[9px] text-center uppercase leading-tight mt-1">
            {service.name}
          </p>
        </div>
      ))}
    </div>
  </div>
</section>
      </div>

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

      {/* BOTTOM SHEETS */}
      {/* Send and Request */}
      {showSendModal && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-end z-50"
          onClick={() => setShowSendModal(false)}
        >
          <div 
            className="bg-black w-full rounded-t-2xl p-6 max-h-[55vh] overflow-y-auto touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing" />

            <h2 className="text-xl font-bold mb-5">Send and Request</h2>

            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <ArrowUpCircle className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Send Money</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                  <ArrowDownCircle className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Request Money</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Global</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center">
                  <Scan className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Scan QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay */}
      {showPayModal && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-end z-50"
          onClick={() => setShowPayModal(false)}
        >
          <div 
            className="bg-black w-full rounded-t-2xl p-6 max-h-[55vh] overflow-y-auto touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing" />

            <h2 className="text-xl font-bold mb-5">Pay</h2>

            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Pay Bill</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Buy Goods</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <HandCoins className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Pochi la Biashara</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Global Pay</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Scan className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Scan QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw */}
      {showWithdrawModal && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-end z-50"
          onClick={() => setShowWithdrawModal(false)}
        >
          <div 
            className="bg-black w-full rounded-t-2xl p-6 max-h-[55vh] overflow-y-auto touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing" />

            <h2 className="text-xl font-bold mb-5">Withdraw</h2>

            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Withdraw at Agent</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Withdraw at ATM</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                  <Scan className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Scan QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Airtime */}
      {showAirtimeModal && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-end z-50"
          onClick={() => setShowAirtimeModal(false)}
        >
          <div 
            className="bg-black w-full rounded-t-2xl p-6 max-h-[55vh] overflow-y-auto touch-pan-y"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-5 cursor-grab active:cursor-grabbing" />

            <h2 className="text-xl font-bold mb-5">Airtime</h2>

            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Buy for My Number</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Buy for Other Number</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Radio className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Buy Bundles</span>
              </button>
              <button className="flex items-center gap-4 p-2.5 hover:bg-gray-900 rounded-lg transition">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <span className="text-base font-medium">Buy International Airtime</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}