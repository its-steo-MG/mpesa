'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, Search, Eye, EyeOff, ArrowRight, QrCode } from 'lucide-react'
import axios from 'axios'
import Image from 'next/image'

export default function Home() {
  const router = useRouter()
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const bannerRef = useRef<HTMLDivElement>(null)

  const [showBalance, setShowBalance] = useState(true)
  const [balance, setBalance] = useState<string>('0.00')
  const [fuliza, setFuliza] = useState<string>('0.00')
  const [airtimeBalance, setAirtimeBalance] = useState<string>('0.00')
  const [userName, setUserName] = useState<string>('Elizabeth')
  const [userPhoto, setUserPhoto] = useState<string | null>(null)
  const [greeting, setGreeting] = useState<string>('Good afternoon')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isFrequentsOpen, setIsFrequentsOpen] = useState(true)
  const [isScanExpanded, setIsScanExpanded] = useState(true)

  // Helper functions
  const getFirstName = (fullName: string): string => {
    if (!fullName?.trim()) return 'User'
    return fullName.trim().split(/\s+/)[0]
  }

  const getInitials = (fullName: string): string => {
    if (!fullName?.trim()) return 'MP'
    
    const names = fullName.trim().split(/\s+/).filter(Boolean)
    
    if (names.length === 1) {
      return names[0][0].toUpperCase()
    }
    
    // First name + Last name initials
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      if (mainContainerRef.current) {
        setIsScanExpanded(mainContainerRef.current.scrollTop < 90)
      }
    }
    const container = mainContainerRef.current
    container?.addEventListener('scroll', handleScroll, { passive: true })
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [])

  // Banner auto-scroll
  useEffect(() => {
    const bannerContainer = bannerRef.current
    if (!bannerContainer) return

    const interval = setInterval(() => {
      if (!bannerContainer) return
      const scrollPosition = bannerContainer.scrollLeft
      const itemWidth = bannerContainer.offsetWidth
      const maxScroll = bannerContainer.scrollWidth - bannerContainer.offsetWidth

      if (scrollPosition + itemWidth + 10 >= maxScroll) {
        bannerContainer.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        bannerContainer.scrollBy({ left: itemWidth + 12, behavior: 'smooth' })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Greeting
  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) setGreeting('Good morning')
    else if (hour >= 12 && hour < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  // Fetch M-Pesa Data
  useEffect(() => {
    const token = localStorage.getItem('mpesa_access_token')
    if (!token) {
      router.replace('/login')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const [profileRes, balanceRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/profile/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/balance/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const profile = profileRes.data
        setUserName(profile.real_name || 'Elizabeth')
        setUserPhoto(profile.profile_photo || null)
        setFuliza(profile.fuliza || '0.00')
        setBalance(balanceRes.data.balance || '0.00')
      } catch (err: any) {
        console.error("Fetch error:", err)
        if (err.response?.status === 401) {
          localStorage.removeItem('mpesa_access_token')
          router.replace('/login')
        } else {
          setError('Failed to load M-Pesa data')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const formatCurrency = (amount: string | number): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return num.toLocaleString('en-US', { minimumFractionDigits: 2 })
  }

  const formattedBalance = formatCurrency(balance)
  const formattedFuliza = formatCurrency(fuliza)

  // Computed values for display
  const displayName = getFirstName(userName)
  const initials = getInitials(userName)

  // Quick Actions
  const quickActions = [
    { icon: "/icons/send-money.png", label: "Send Money", w: 68, h: 68 },
    { icon: "/icons/lipa-na-mpesa.png", label: "Lipa na\nM-PESA", w: 52, h: 52 },
    { icon: "/icons/withdraw-money.png", label: "Withdraw\nMoney", w: 50, h: 50 },
    { icon: "/icons/buy-bundles.png", label: "Buy Bundles", w: 38, h: 52 },
    { icon: "/icons/airtime-topup.png", label: "Airtime Top\nup", w: 58, h: 54 },
    { icon: "/icons/tunukiwa-bundles.png", label: "Tunukiwa\nBundles", w: 55, h: 50 },
    { icon: "/icons/international-transfers.png", label: "International\nTransfers", w: 60, h: 52 },
    { icon: "/icons/home-internet.png", label: "Home\nInternet", w: 42, h: 54 },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#00C853]"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0F0A] text-white flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-[#00C853] px-6 py-3 rounded-2xl font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A0F0A] text-white relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#0A0F0A] border-b border-gray-800/70 backdrop-blur-md px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00C853]/30 bg-zinc-800">
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={userName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.style.display = 'none'
                    
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full bg-[#00C853] flex items-center justify-center text-2xl font-bold text-black">
                          ${initials}
                        </div>
                      `
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#00C853] flex items-center justify-center text-2xl font-bold text-black">
                  {initials}
                </div>
              )}
            </div>
            <div className="absolute -bottom-px -right-px bg-[#00C853] text-black text-[10px] w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#0A0F0A]">
              ✓
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400">{greeting},</p>
            <p className="font-semibold text-lg flex items-center gap-1">
              {displayName} 👋
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-9 h-9 bg-zinc-900 rounded-2xl flex items-center justify-center border border-gray-800">
            <Bell className="w-5 h-5 text-[#00C853]" />
          </div>
          <div className="w-9 h-9 bg-zinc-900 rounded-2xl flex items-center justify-center border border-gray-800">
            <Search className="w-5 h-5 text-[#00C853]" />
          </div>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <div ref={mainContainerRef} className="h-[calc(100vh-73px)] overflow-y-auto pb-32 px-4 pt-5 space-y-5">
        
        {/* Balance Cards */}
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 no-scrollbar scroll-smooth">
          <div className="min-w-[92%] snap-center bg-zinc-900/95 backdrop-blur rounded-3xl p-5 border-l-4 border-[#00C853] flex-shrink-0">
            <p className="text-[#00C853] text-sm font-medium">M-PESA Balance</p>
            <div className="flex items-center gap-2 mt-3">
              <p className="text-3xl font-semibold tracking-tighter">Ksh {showBalance ? formattedBalance : '••••••'}</p>
              <button onClick={() => setShowBalance(!showBalance)} className="text-gray-400">
                {showBalance ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Available Fuliza: KSh {formattedFuliza}</p>
            <Link href="/transaction" className="mt-5 block text-center border border-[#00C853] text-[#00C853] py-3 rounded-2xl text-sm font-medium hover:bg-[#00C853]/10">
              View statements
            </Link>
          </div>

          <div className="min-w-[92%] snap-center bg-zinc-900/95 backdrop-blur rounded-3xl p-5 border-l-4 border-[#00C853] flex-shrink-0">
            <p className="text-[#00C853] text-sm font-medium">My Balance</p>
            <div className="flex justify-between mt-6">
              <div>
                <p className="text-xs text-gray-400">Airtime</p>
                <p className="text-2xl font-semibold">Ksh {airtimeBalance}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Data</p>
                <p className="text-2xl font-semibold text-gray-400">--</p>
              </div>
            </div>
            <Link href="#" className="mt-6 block text-center border border-[#00C853] text-[#00C853] py-3 rounded-2xl text-sm font-medium hover:bg-[#00C853]/10">
              View All Balances
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900/95 backdrop-blur rounded-3xl p-6">
          <div className="flex justify-between items-center mb-5">
            <p className="font-semibold text-lg">Quick Actions</p>
            <p className="text-[#00C853] text-sm flex items-center gap-1 cursor-pointer">View all <ArrowRight size={18} /></p>
          </div>
          
          <div className="grid grid-cols-4 gap-x-5 gap-y-5">
            {quickActions.map((item, index) => (
              <button 
                key={index} 
                className="flex flex-col items-center gap-2 active:scale-95 transition-transform"
              >
                <div className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                  <Image 
                    src={item.icon} 
                    alt={item.label} 
                    width={item.w} 
                    height={item.h} 
                    className="object-contain"
                  />
                </div>
                <span className="text-[10px] text-center leading-tight font-medium text-gray-200 whitespace-pre-line">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Frequents */}
        <div className="bg-zinc-900/95 backdrop-blur rounded-3xl overflow-hidden">
          <button
            onClick={() => setIsFrequentsOpen(!isFrequentsOpen)}
            className="w-full flex justify-between items-center px-6 py-4 text-left"
          >
            <p className="font-semibold text-lg">Frequents</p>
            <span className={`text-[#00C853] text-3xl transition-transform ${isFrequentsOpen ? 'rotate-180' : ''}`}>⌄</span>
          </button>

          {isFrequentsOpen && (
            <div className="px-6 pb-6">
              <div className="flex bg-zinc-800 rounded-[30px] p-1 mb-6">
                <button className="flex-1 bg-[#00C853] text-black font-medium rounded-[30px] py-2.5 text-sm">Apps</button>
                <button className="flex-1 text-gray-400 font-medium rounded-[30px] py-2.5 text-sm">Send</button>
                <button className="flex-1 text-gray-400 font-medium rounded-[30px] py-2.5 text-sm">Pay</button>
                <button className="flex-1 text-gray-400 font-medium rounded-[30px] py-2.5 text-sm">Bundles</button>
              </div>

              <div className="flex justify-center gap-10">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-emerald-700 rounded-2xl flex items-center justify-center mb-2 overflow-hidden">
                    <Image src="/icons/ziidi.png" alt="Ziidi" width={48} height={48} className="object-contain" />
                  </div>
                  <p className="text-sm font-medium text-center">Ziidi</p>
                  <p className="text-xs text-gray-400 text-center -mt-1">Shariah</p>
                </div>

                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-gray-300">
                    <Image src="/icons/m-shwari.png" alt="M-Shwari" width={52} height={52} className="object-contain" />
                  </div>
                  <p className="text-sm font-medium text-center">M-Shwari</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Explore & Discover Deals */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <p className="font-semibold text-lg">Explore &amp; Discover Deals</p>
            <span className="text-xl">🔥</span>
          </div>
          
          <div 
            ref={bannerRef}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-3 no-scrollbar scroll-smooth"
          >
            <div className="min-w-full snap-center rounded-3xl overflow-hidden">
              <Image src="/ads/safaricom-5g-business.jpg" alt="Safaricom 5G Deal" width={800} height={260} className="w-full object-cover" />
            </div>
            <div className="min-w-full snap-center rounded-3xl overflow-hidden">
              <Image src="/ads/deal-2.jpg" alt="Share Feedback" width={800} height={260} className="w-full object-cover" />
            </div>
          </div>
        </div>

        {/* My Finances */}
        <div className="bg-zinc-900/95 backdrop-blur rounded-3xl p-6">
          <div className="flex justify-between items-center mb-5">
            <p className="font-semibold text-lg">My Finances</p>
            <p className="text-[#00C853] text-sm flex items-center gap-1 cursor-pointer">View all <ArrowRight size={18} /></p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-2 overflow-hidden">
                <Image src="/icons/tuunza-mapato.png" alt="Tuunza Mapato" width={48} height={48} className="object-contain" />
              </div>
              <p className="text-[10px] text-center leading-tight">Tuunza<br />Mapato</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-2 overflow-hidden">
                <Image src="/icons/pochi-la-biashara.png" alt="Pochi la Biashara" width={36} height={36} className="object-contain" />
              </div>
              <p className="text-[10px] text-center leading-tight">Pochi la<br />Biashara</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-2 overflow-hidden">
                <Image src="/icons/shirikipay.png" alt="ShirikiPay" width={36} height={36} className="object-contain" />
              </div>
              <p className="text-[10px] text-center leading-tight">ShirikiPay</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-2 overflow-hidden border border-gray-300">
                <Image src="/icons/ziidi-trader.png" alt="Ziidi" width={48} height={48} className="object-contain" />
              </div>
              <p className="text-[10px] text-center leading-tight">Ziidi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Scan Button */}
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          className={`flex items-center gap-3 bg-[#1C2526] text-white font-medium rounded-3xl shadow-2xl border border-gray-700 transition-all duration-300 active:scale-95 overflow-hidden ${
            isScanExpanded ? 'pl-5 pr-6 py-3.5' : 'w-14 h-14 justify-center'
          }`}
        >
          <QrCode className="w-7 h-7 text-[#00C853]" />
          {isScanExpanded && <span className="whitespace-nowrap text-sm">Scan to pay</span>}
        </button>
      </div>
    </div>
  )
}