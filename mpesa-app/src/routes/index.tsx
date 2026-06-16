import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, Eye, EyeOff, ChevronUp, ChevronDown, ArrowRight, CreditCard, Download } from "lucide-react";
import { getInitials, getAvatarColor, formatKsh, getGreeting } from "@/lib/mpesa-utils";
import { ensureSeed, getProfile, isAuthed, getBalance } from "@/lib/mpesa-store";
import { apiProfile, apiBalance, hasBackend } from "@/lib/mpesa-api";
import { QuickActionIcon, QUICK_ACTIONS } from "@/components/QuickActionIcon";
import userAvatar from "@/assets/user-avatar.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My OneApp" },
      { name: "description", content: "Safaricom My OneApp" },
    ],
  }),
  component: Home,
});

const CARD_PATTERN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='160' viewBox='0 0 220 160'><g fill='none' stroke='%2300C853' stroke-opacity='0.10' stroke-width='1'><path d='M10 140 L80 30 L150 120 L210 20'/><path d='M0 90 L60 10 L130 100 L200 40 L220 110'/><path d='M30 160 L100 70 L170 150 L220 80'/><path d='M40 0 L110 90 L180 10'/></g></svg>\")";

const EXPLORE_BANNERS = [
  { 
    src: "/banners/alpha-roam.jpg", 
    alt: "AlphaROAM - Affordable Data Roaming Internet" 
  },
  { 
    src: "/banners/shell-club.jpg", 
    alt: "Shell Club — Unlock More Surprises" 
  },
];
function BalanceCardShell({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative shrink-0 snap-start basis-[88%] rounded-2xl"
      style={{
        background: "linear-gradient(180deg, #22C55E 0%, #3B82F6 100%)",
      }}
    >
      <div
        className="rounded-2xl bg-[#111111] ml-[3px] overflow-hidden"
        style={{
          backgroundImage: CARD_PATTERN,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right center",
          backgroundSize: "70% 100%",
        }}
      >
        <div className="pl-4 pr-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function ScanToPayIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <g stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M3 9 V5 a2 2 0 0 1 2 -2 H9" />
        <path d="M23 3 H27 a2 2 0 0 1 2 2 V9" />
        <path d="M29 23 V27 a2 2 0 0 1 -2 2 H23" />
        <path d="M9 29 H5 a2 2 0 0 1 -2 -2 V23" />
      </g>
      <g fill="#00C853">
        <rect x="9" y="9" width="3" height="3" rx="0.5" />
        <rect x="13" y="9" width="2" height="2" rx="0.5" />
        <rect x="17" y="9" width="2" height="2" rx="0.5" />
        <rect x="20" y="9" width="3" height="3" rx="0.5" />
        <rect x="9" y="13" width="2" height="2" rx="0.5" />
        <rect x="13" y="13" width="3" height="3" rx="0.5" />
        <rect x="18" y="13" width="2" height="2" rx="0.5" />
        <rect x="21" y="14" width="2" height="2" rx="0.5" />
        <rect x="9" y="17" width="3" height="2" rx="0.5" />
        <rect x="14" y="17" width="2" height="3" rx="0.5" />
        <rect x="18" y="17" width="3" height="2" rx="0.5" />
        <rect x="9" y="20" width="3" height="3" rx="0.5" />
        <rect x="13" y="21" width="2" height="2" rx="0.5" />
        <rect x="17" y="20" width="2" height="2" rx="0.5" />
        <rect x="20" y="20" width="3" height="3" rx="0.5" />
      </g>
    </svg>
  );
}

function Home() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState("0.00");
  const [fuliza, setFuliza] = useState("0.00");
  const [userName, setUserName] = useState("M-PESA User");
  const [userPhoto, setUserPhoto] = useState<string | null>(userAvatar);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [activeFreqTab, setActiveFreqTab] = useState<"Apps" | "Send" | "Pay" | "Bundles">("Apps");
  const [showFrequents, setShowFrequents] = useState(true);
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showZuriTip, setShowZuriTip] = useState(false);
  const [zuriFailed, setZuriFailed] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

// ==================== PWA INSTALL BUTTON (Smart Hide) ====================
const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
const [showInstallButton, setShowInstallButton] = useState(false);
const [installing, setInstalling] = useState(false);

// Check if app is already installed (standalone mode)
const isStandalone = () => {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true // iOS
  );
};

// ==================== AUTO SHOW/HIDE ZURI TIP ON SCROLL ====================
useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY < lastScrollY && currentScrollY > 100) {
      // Scrolling UP → Show tooltip
      setShowZuriTip(true);
    } else if (currentScrollY > lastScrollY) {
      // Scrolling DOWN → Hide tooltip
      setShowZuriTip(false);
    }

    setLastScrollY(currentScrollY);
  };

  window.addEventListener("scroll", handleScroll, { passive: true });

  return () => window.removeEventListener("scroll", handleScroll);
}, [lastScrollY]);
// ======================================================================

useEffect(() => {
  // Don't show install button if already installed
  if (isStandalone()) {
    return;
  }

  const handler = (e: any) => {
    e.preventDefault();
    setDeferredPrompt(e);
    setShowInstallButton(true);
  };

  window.addEventListener("beforeinstallprompt", handler);

  // Fallback: Show button after delay only if not installed
  const timer = setTimeout(() => {
    if (!showInstallButton && !isStandalone()) {
      setShowInstallButton(true);
    }
  }, 6000);

  // Hide button after successful installation
  const handleAppInstalled = () => {
    setShowInstallButton(false);
    setDeferredPrompt(null);
    console.log("[PWA] App was installed");
  };

  window.addEventListener("appinstalled", handleAppInstalled);

  return () => {
    window.removeEventListener("beforeinstallprompt", handler);
    window.removeEventListener("appinstalled", handleAppInstalled);
    clearTimeout(timer);
  };
}, []);

const handleInstallClick = async () => {
  if (!deferredPrompt) {
    alert(
      "To install My OneApp:\n\n" +
      "1. Open in Chrome\n" +
      "2. Tap the ⋮ menu\n" +
      "3. Tap 'Install app' or 'Add to Home screen'"
    );
    return;
  }

  setInstalling(true);

  try {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallButton(false);
    }
  } catch (err) {
    console.error("[PWA] Install failed:", err);
  } finally {
    setDeferredPrompt(null);
    setInstalling(false);
  }
};
// ======================================================================
  // ==================== IMPROVED BALANCE REFRESH ====================
const refreshBalance = async () => {
  try {
    if (hasBackend()) {
      const data = await apiBalance();
      if (data?.balance) {
        setBalance(String(data.balance));
        return;
      }
    }
    // Fallback to local storage only if backend fails
    const localBalance = getBalance();
    setBalance(String(localBalance));
  } catch (err) {
    console.warn("Failed to refresh balance from backend, using local");
    const localBalance = getBalance();
    setBalance(String(localBalance));
  }
};

// Call this on focus/visibility (but now it prefers backend)
useEffect(() => {
  const handleFocus = () => refreshBalance();
  
  const handleVisibility = () => {
    if (document.visibilityState === "visible") {
      refreshBalance();
    }
  };

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibility);

  return () => {
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibility);
  };
}, []);
// ============================================================
  useEffect(() => {
    ensureSeed();

    if (!isAuthed()) {
      navigate({ to: "/login" });
      return;
    }

    const loadDashboard = async () => {
      try {
        const profile = getProfile();
        setUserName(profile.real_name || "M-PESA User");
        if (profile.profile_photo) {
          setUserPhoto(profile.profile_photo);
          setPhotoFailed(false);
        }
        refreshBalance();

        const [profData, balData] = await Promise.all([
          apiProfile().catch(() => profile),
          apiBalance().catch(() => ({ balance: String(getBalance()) })),
        ]);

        if (profData?.real_name) setUserName(profData.real_name);
        if (profData?.profile_photo) {
          setUserPhoto(profData.profile_photo);
          setPhotoFailed(false);
        }
        if (profData?.fuliza) setFuliza(profData.fuliza);
        if (balData?.balance) setBalance(balData.balance);
      } catch (err) {
        console.warn("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    const handleFocus = () => refreshBalance();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshBalance();
    });

    try {
      const justSent = sessionStorage.getItem("mpesa_just_sent");
      if (justSent) {
        const tx = JSON.parse(justSent);
        setBanner(tx);
        sessionStorage.removeItem("mpesa_just_sent");
        setTimeout(() => setBanner(null), 7000);
      }
    } catch (e) {
      console.warn("Banner parse failed", e);
    }

    return () => window.removeEventListener("focus", handleFocus);
  }, [navigate]);

  const firstName = userName.trim().split(/\s+/)[0];
  const showInitials = !userPhoto || photoFailed;

// ==================== CLEAR LIQUID GLASS LOADING (WHITE SPINNER + TEXT) ====================
if (loading) {
  return (
    <div className="phone-shell bg-white flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        {/* Clear Liquid Glass Card */}
        <div className="w-28 h-28 bg-white/25 backdrop-blur-3xl border border-white/50 rounded-3xl flex flex-col items-center justify-center mb-5 shadow-2xl">
          <div className="flex flex-col items-center justify-center">
            {/* White Spinner */}
            <div className="w-9 h-9 border-4 border-white/40 border-t-white rounded-full animate-spin mb-3" />
            
            {/* White Loading Text */}
            <p className="text-sm text-white font-medium tracking-wide">Loading...</p>
          </div>
        </div>

        {/* Safaricom M-PESA Logo */}
        <img 
          src="/safaricom-mpesa-logo.png" 
          alt="Safaricom M-PESA" 
          className="h-čľ object-contain mt-2"
        />
      </div>
    </div>
  );
}
// ============================================================
  return (
    <div ref={scrollRef} className="phone-shell text-white pb-24 page-enter">
      {/* Success Banner */}
      {banner && (
        <div className="fixed top-2 left-3 right-3 z-50 mx-auto" style={{ maxWidth: 420 }}>
          <div className="notif-banner flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1DE76C] flex items-center justify-center text-xs font-bold text-black shrink-0">M</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] text-gray-300">
                <span className="font-semibold text-white">MPESA</span>
                <span>just now</span>
              </div>
              <p className="text-[13px] leading-snug mt-0.5">
                {banner.mpesa_id ? `${banner.mpesa_id} Confirmed.` : "Transaction Confirmed."}{" "}
                Ksh {formatKsh(banner.amount)} sent to {banner.recipient_name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-3 pb-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative shrink-0">
            {showInitials ? (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm border-2 border-[#00C853]/30"
                style={{ background: getAvatarColor(userName) }}
              >
                {getInitials(userName)}
              </div>
            ) : (
              <img
                src={userPhoto!}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-[#00C853]/30"
                onError={() => setPhotoFailed(true)}
              />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00C853] border-2 border-black flex items-center justify-center">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
          <div className="text-sm min-w-0">
            <div className="text-gray-400 truncate">{getGreeting()},</div>
            <div className="font-semibold flex items-center gap-1 truncate">{firstName} 👋</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <Bell size={18} className="text-[#00C853]" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              10
            </span>
          </button>
          <button className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <Search size={18} className="text-[#00C853]" />
          </button>
        </div>
      </div>

      {/* Balance Cards Carousel */}
      <div className="mt-4 mx-4 overflow-x-auto no-scrollbar snap-x snap-mandatory flex items-start gap-3 pb-2">
        <BalanceCardShell>
          <p className="text-[#00C853] text-sm font-semibold">M-PESA Balance</p>
          <div className="flex items-center gap-3 mt-1.5">
            <p className="text-[22px] font-bold tracking-tight leading-none">
              Ksh {showBalance ? formatKsh(balance) : "••••••"}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBalance((s) => !s);
              }}
              className="text-gray-300"
            >
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Available Fuliza: KSh {formatKsh(fuliza)}
          </p>
          <button
            onClick={() => navigate({ to: "/statements" })}
            className="mt-2.5 block w-full text-center border border-[#00C853] text-[#00C853] py-2 rounded-xl text-sm font-medium hover:bg-[#00C853]/10 transition"
          >
            View statements
          </button>
        </BalanceCardShell>

        <BalanceCardShell>
          <p className="text-[#00C853] text-sm font-semibold">My Balance</p>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-[11px] text-gray-400">Airtime</p>
              <p className="text-lg font-semibold leading-tight">0.01</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Data</p>
              <p className="text-lg font-semibold text-gray-400 leading-tight">--</p>
            </div>
          </div>
          <button className="mt-2.5 block w-full text-center border border-[#00C853] text-[#00C853] py-2 rounded-xl text-sm font-medium hover:bg-[#00C853]/10 transition">
            View All Balances
          </button>
        </BalanceCardShell>
      </div>

      {/* Carousel dots */}
      <div className="flex justify-center gap-1.5 mt-1">
        <span className="h-1 w-5 rounded-full bg-[#00C853]" />
        <span className="h-1 w-3 rounded-full bg-gray-700" />
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-4 bg-zinc-900/95 rounded-3xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-[17px]">Quick Actions</h3>
          <button className="text-[#00C853] text-sm flex items-center gap-1">
            View all <ArrowRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {QUICK_ACTIONS.map((qa) => (
            <QuickActionIcon key={qa.slug} {...qa} />
          ))}
        </div>
      </div>

      {/* Frequents */}
      <div className="mx-4 mt-3 bg-zinc-900/95 rounded-3xl p-5">
        <button className="w-full flex justify-between items-center" onClick={() => setShowFrequents((s) => !s)}>
          <h3 className="font-semibold text-[17px]">Frequents</h3>
          {showFrequents ? (
            <ChevronUp size={18} className="text-[#00C853]" />
          ) : (
            <ChevronDown size={18} className="text-[#00C853]" />
          )}
        </button>
        {showFrequents && (
          <>
            <div className="flex gap-1 mt-4 bg-zinc-800 rounded-full p-1">
              {(["Apps", "Send", "Pay", "Bundles"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFreqTab(t)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                    activeFreqTab === t ? "bg-[#00C853] text-black" : "text-gray-400"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-xl bg-[#0A2818] border border-[#00C853]/30 flex items-center justify-center">
                  <CreditCard size={22} className="text-[#00C853]" />
                </div>
                <span className="text-[10px] text-gray-300 text-center max-w-[68px] leading-tight">
                  M-Pesa Visa Card
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Explore & Discover Deals */}
<div className="mt-4">
  <h3 className="font-semibold text-[17px] flex items-center gap-1 mb-2 mx-4">
    Explore &amp; Discover Deals 🔥
  </h3>

  <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory flex gap-3 px-4 pb-2">
    {EXPLORE_BANNERS.map((b, i) => (
      <div
        key={i}
        className="relative shrink-0 snap-center min-w-full rounded-3xl overflow-hidden bg-zinc-800"
      >
        <img
          src={b.src}
          alt={b.alt}
          loading="lazy"
          className="w-full h-40 object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    ))}
  </div>
</div>
      {/* ==================== INSTALL APP BUTTON ==================== */}
      {showInstallButton && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-[#00C853] text-black font-semibold px-6 py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            <Download size={18} />
            Install My OneApp
          </button>
        </div>
      )}
      {/* ======================================================== */}

      {/* ==========================zuri============================== */}
      <div className="fixed bottom-6 right-4 z-40 flex flex-col items-end gap-3">
        <div className="flex items-center gap-1.5">
          {showZuriTip && (
            <div className="relative animate-fade-in">
              <div className="bg-[#EDEDED] text-black rounded-2xl px-4 py-2.5 shadow-2xl">
                <span className="text-[13px] font-medium whitespace-nowrap">Need Help? Talk to Zuri</span>
              </div>
              <span className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#EDEDED] rotate-45" />
            </div>
          )}
      
          <button
            onClick={() => setShowZuriTip((s) => !s)}
            className="relative w-14 h-14 rounded-full bg-black shadow-2xl flex items-center justify-center overflow-hidden ring-2 ring-black"
            style={{ boxShadow: "0 0 0 3px #1A1A1A, 0 10px 25px rgba(0,0,0,0.5)" }}
          >
            {!zuriFailed ? (
              <img
                src="/zuri.png"
                alt="Zuri"
                className="w-full h-full rounded-full object-cover"
                onError={() => setZuriFailed(true)}
              />
            ) : (
              <span className="text-white font-bold text-lg">Z</span>
            )}
          </button>
        </div>

        <button className="flex items-center gap-3 bg-black/90 backdrop-blur rounded-2xl pl-3 pr-5 py-2.5 shadow-2xl ring-1 ring-white/10">
          <ScanToPayIcon size={28} />
          <span className="text-[15px] font-medium text-white">Scan to pay</span>
        </button>
      </div>
    </div>
  );
}