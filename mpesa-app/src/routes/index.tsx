import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, Eye, EyeOff, ChevronUp, ChevronDown, ArrowRight, CreditCard, Download, ChevronRight, Wallet, PiggyBank, LineChart, Smartphone, Landmark, Beer, Gamepad2, Newspaper, Music4, Banknote, ShieldCheck, Ticket, Zap, Dice5, Plane, Gift, Briefcase } from "lucide-react";
import { AppSplash } from "@/components/AppSplash";
import { getInitials, getAvatarColor, formatKsh, getGreeting } from "@/lib/mpesa-utils";
import { ensureSeed, getProfile, isAuthed, getBalance, setProfile } from "@/lib/mpesa-store";
import { apiProfile, apiBalance, hasBackend } from "@/lib/mpesa-api";
import { QuickActionIcon, QUICK_ACTIONS } from "@/components/QuickActionIcon";

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

type Tile = { label: string; Icon: typeof Wallet; tint: string };

const MY_FINANCES: Tile[] = [
  { label: "Loans", Icon: Banknote, tint: "#00C853" },
  { label: "Savings", Icon: PiggyBank, tint: "#3B82F6" },
  { label: "Invest", Icon: LineChart, tint: "#A855F7" },
  { label: "Insurance", Icon: ShieldCheck, tint: "#F97316" },
  { label: "Bank", Icon: Landmark, tint: "#06B6D4" },
  { label: "Wallet", Icon: Wallet, tint: "#EAB308" },
];

const ENTERTAINMENT: Tile[] = [
  { label: "Gaming", Icon: Gamepad2, tint: "#A855F7" },
  { label: "Betting", Icon: Dice5, tint: "#00C853" },
  { label: "Music", Icon: Music4, tint: "#EC4899" },
  { label: "News", Icon: Newspaper, tint: "#3B82F6" },
];

const DO_MORE: Tile[] = [
  { label: "Buy Airtime & Bundles", Icon: Smartphone, tint: "#00C853" },
  { label: "Pay Bills & Tokens", Icon: Zap, tint: "#EAB308" },
  { label: "Book Travel & Events", Icon: Plane, tint: "#06B6D4" },
  { label: "Movie & Match Tickets", Icon: Ticket, tint: "#A855F7" },
  { label: "Order Food & Drinks", Icon: Beer, tint: "#F97316" },
  { label: "Offers & Rewards", Icon: Gift, tint: "#EC4899" },
  { label: "Business Tools", Icon: Briefcase, tint: "#3B82F6" },
  { label: "Buy Goods & Paybill", Icon: CreditCard, tint: "#00C853" },
];

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
        className="rounded-2xl app-surface ml-[3px] overflow-hidden"
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
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [activeFreqTab, setActiveFreqTab] = useState<"Apps" | "Send" | "Pay" | "Bundles">("Apps");
  const [showFrequents, setShowFrequents] = useState(true);
  const [banner, setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showZuriTip, setShowZuriTip] = useState(true);
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

    if (currentScrollY <= 40 || currentScrollY < lastScrollY) {
      // At the top or scrolling UP → expand labels
      setShowZuriTip(true);
    } else if (currentScrollY > lastScrollY) {
      // Scrolling DOWN → collapse labels
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

// ==================== PULL TO REFRESH ====================
const [pullY, setPullY] = useState(0);
const [refreshing, setRefreshing] = useState(false);
const pullStart = useRef<number | null>(null);

const doRefresh = async () => {
  setRefreshing(true);
  try {
    await refreshBalance();
    const profData = await apiProfile().catch(() => null);
    if (profData?.real_name) setUserName(profData.real_name);
    if (profData?.profile_photo) {
      setUserPhoto(profData.profile_photo);
      setPhotoFailed(false);
    }
    if (profData?.fuliza) setFuliza(profData.fuliza);
  } finally {
    setTimeout(() => {
      setRefreshing(false);
      setPullY(0);
    }, 700);
  }
};

useEffect(() => {
  const onStart = (e: TouchEvent) => {
    if (window.scrollY <= 0 && !refreshing) pullStart.current = e.touches[0]!.clientY;
    else pullStart.current = null;
  };
  const onMove = (e: TouchEvent) => {
    if (pullStart.current === null || refreshing) return;
    const delta = e.touches[0]!.clientY - pullStart.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPullY(Math.min(90, delta * 0.5));
    }
  };
  const onEnd = () => {
    if (pullStart.current === null) return;
    pullStart.current = null;
    setPullY((y) => {
      if (y >= 55 && !refreshing) {
        void doRefresh();
        return 55;
      }
      return 0;
    });
  };

  window.addEventListener("touchstart", onStart, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onEnd);
  return () => {
    window.removeEventListener("touchstart", onStart);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", onEnd);
  };
}, [refreshing]);
// =========================================================


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

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setUserPhoto(dataUrl);
      setPhotoFailed(false);
      setProfile({ profile_photo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const firstName = userName.trim().split(/\s+/)[0];
  const showInitials = !userPhoto || photoFailed;

// ==================== CLEAR LIQUID GLASS LOADING (WHITE SPINNER + TEXT) ====================
if (loading) {
  return <AppSplash />;
}
// ============================================================
  return (
    <>
    {/* Pull to refresh spinner */}
    <div
      className="fixed left-0 right-0 top-0 z-40 flex justify-center pointer-events-none"
      style={{
        height: pullY,
        opacity: pullY > 8 ? 1 : 0,
        transition: pullY === 0 ? "height .25s ease, opacity .25s ease" : "none",
      }}
    >
      <div className="mt-2 h-9 w-9 rounded-full app-surface flex items-center justify-center">
        <div
          className="spinner"
          style={{
            width: 20,
            height: 20,
            borderWidth: 2,
            animationPlayState: refreshing ? "running" : "paused",
            transform: refreshing ? undefined : `rotate(${pullY * 4}deg)`,
          }}
        />
      </div>
    </div>
    <div
      ref={scrollRef}
      className="phone-shell app-text pb-28 page-enter"
      style={{
        transform: pullY ? `translateY(${pullY}px)` : undefined,
        transition: pullY === 0 ? "transform .25s ease" : "none",
      }}
    >


      {/* Success Banner */}
      {banner && (
        <div className="fixed top-2 left-3 right-3 z-50 mx-auto" style={{ maxWidth: 420 }}>
          <div className="notif-banner flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#1DE76C] flex items-center justify-center text-xs font-bold text-black shrink-0">M</div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] app-sub">
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
      <div className="sticky top-0 z-30 px-4 pt-3 pb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 app-header">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate({ to: "/profile" })}
            className="relative shrink-0"
            aria-label="Open profile and settings"
          >
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoPick}
            />
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
            <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#00C853] border-2 border-[var(--app-bg)]">
              <ChevronRight size={10} className="text-white" strokeWidth={3} />
            </span>
          </button>
          <div className="text-sm min-w-0">
            <div className="app-sub truncate">{getGreeting()},</div>
            <div className="font-semibold flex items-center gap-1 truncate">{firstName} 👋</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative w-10 h-10 rounded-full app-card flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <path
                d="M18 8a6 6 0 1 0-12 0c0 5-2 6-2 6h16s-2-1-2-6Z"
                stroke="#00C853"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.3 18a2 2 0 0 0 3.4 0"
                stroke="#00C853"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path d="M12 6.5v4" stroke="#E4002B" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E4002B] text-white text-[10px] font-bold flex items-center justify-center">
              10
            </span>
          </button>
          <button className="w-10 h-10 rounded-full app-card flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="11" cy="11" r="6.2" stroke="#00C853" strokeWidth="2" />
              <path
                d="m15.8 15.8 3.6 3.6"
                stroke="#E4002B"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
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
              className="app-sub"
            >
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-[11px] app-sub mt-1">
            Available Fuliza: Ksh {formatKsh(fuliza)}
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
              <p className="text-[11px] app-sub">Airtime</p>
              <p className="text-lg font-semibold leading-tight">0.01</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] app-sub">Data</p>
              <p className="text-lg font-semibold app-sub leading-tight">--</p>
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
        <span className="h-1 w-3 rounded-full bg-current/20" />
      </div>

      {/* Quick Actions */}
      <div className="mx-4 mt-4 app-surface rounded-3xl p-5">
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
      <div className="mx-4 mt-3 app-surface rounded-3xl p-5">
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
            <div className="flex gap-1 mt-4 app-chip rounded-full p-1">
              {(["Apps", "Send", "Pay", "Bundles"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveFreqTab(t)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition ${
                    activeFreqTab === t ? "bg-[#00C853] text-black" : "app-sub"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-14 h-14 rounded-xl bg-[#00C853]/10 border border-[#00C853]/30 flex items-center justify-center">
                  <CreditCard size={22} className="text-[#00C853]" />
                </div>
                <span className="text-[10px] app-sub text-center max-w-[68px] leading-tight">
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
        className="relative shrink-0 snap-center min-w-full rounded-3xl overflow-hidden app-card"
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
      {/* My Finances */}
      <div className="mx-4 mt-4 app-surface rounded-3xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-[17px]">My Finances</h3>
          <button className="text-[#00C853] text-sm flex items-center gap-1">
            View all <ArrowRight size={16} />
          </button>
        </div>
        <div className="flex gap-5 overflow-x-auto no-scrollbar">
          {MY_FINANCES.map(({ label, Icon, tint }) => (
            <div key={label} className="flex w-[62px] shrink-0 flex-col items-center gap-1.5">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: `${tint}22` }}
              >
                <Icon size={22} style={{ color: tint }} />
              </span>
              <span className="app-sub text-[10px] leading-tight text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Entertainment */}
      <div className="mx-4 mt-3 app-surface rounded-3xl p-5">
        <h3 className="font-semibold text-[17px] mb-4">Entertainment</h3>
        <div className="grid grid-cols-4 gap-3">
          {ENTERTAINMENT.map(({ label, Icon, tint }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: `${tint}22` }}
              >
                <Icon size={22} style={{ color: tint }} />
              </span>
              <span className="app-sub text-[10px] leading-tight text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Do more with M-PESA */}
      <div className="mx-4 mt-3 app-surface rounded-3xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-[17px]">
              Do more with <span className="font-bold">M-PESA</span>
            </h3>
            <p className="app-sub text-[13px] mt-0.5">Pay, book, learn and earn in one place</p>
          </div>
          <Search size={18} className="text-[#00C853] mt-1" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {DO_MORE.map(({ label, Icon, tint }) => (
            <div key={label} className="app-card rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${tint}22` }}
                >
                  <Icon size={15} style={{ color: tint }} />
                </span>
                <span className="text-[13px] font-medium leading-tight">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="app-sub mt-5 text-center text-[13px]">Can&apos;t find what you&apos;re looking for?</p>
        <button className="mt-3 w-full rounded-2xl bg-[#00C853] py-3.5 text-[15px] font-semibold text-white active:scale-[0.99] transition">
          Browse all services
        </button>
      </div>

    </div>

    {/* ==================== FLOATING OVERLAYS (outside animated shell) ==================== */}
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 mx-auto w-full" style={{ maxWidth: 480 }}>
      {/* INSTALL APP BUTTON */}
      {showInstallButton && (
        <div className="pointer-events-auto absolute bottom-28 left-1/2 -translate-x-1/2">
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-[#00C853] text-white font-semibold px-6 py-3.5 rounded-2xl shadow-xl active:scale-95 transition-all"
          >
            <Download size={18} />
            Install My OneApp
          </button>
        </div>
      )}

      {/* zuri */}
      <div
        className="pointer-events-auto absolute right-4 flex flex-col items-end gap-3"
        style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center gap-2">
          {showZuriTip && (
            <div className="relative zuri-label">
              <div className="rounded-2xl app-surface px-4 py-2.5 shadow-2xl">
                <span className="text-[13px] font-medium whitespace-nowrap app-text">
                  Need Help? Talk to Zuri
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowZuriTip((s) => !s)}
            aria-label="Talk to Zuri"
            className="relative h-[52px] w-[52px] overflow-hidden rounded-2xl app-surface shadow-2xl flex items-center justify-center"
            style={{ boxShadow: "0 10px 25px rgba(0,0,0,0.25)" }}
          >
            {!zuriFailed ? (
              <img
                src="/zuri.png"
                alt="Zuri"
                className="h-full w-full object-cover"
                onError={() => setZuriFailed(true)}
              />
            ) : (
              <span className="font-bold text-lg text-[#00C853]">Z</span>
            )}
          </button>
        </div>

        <button
          className="app-surface app-text flex items-center gap-3 rounded-2xl py-2.5 pl-3 shadow-2xl transition-all duration-300"
          style={{ paddingRight: showZuriTip ? "1.25rem" : "0.75rem" }}
        >
          <ScanToPayIcon size={28} />
          {showZuriTip && <span className="zuri-label text-[15px] font-medium">Scan to pay</span>}
        </button>
      </div>
    </div>
    </>
  );
}
