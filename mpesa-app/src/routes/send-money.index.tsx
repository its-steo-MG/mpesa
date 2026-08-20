import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Contact,
  ScanLine,
  Users,
  Wallet,
  Globe,
  CheckCircle,
  Plus,
  Check,
} from "lucide-react";
import { getBalance, lookupRecipient, ensureSeed, isAuthed } from "@/lib/mpesa-store";
import { apiLookupRecipient, apiBalance, hasBackend } from "@/lib/mpesa-api";
import { formatKsh } from "@/lib/mpesa-utils";

export const Route = createFileRoute("/send-money/")({
  head: () => ({ meta: [{ title: "Send Money" }] }),
  component: SendMoney,
});

// ==================== M-PESA FEE CALCULATOR ====================
function calculateSendFee(amount: number): number {
  if (amount <= 100) return 0;
  if (amount <= 500) return 6;
  if (amount <= 1000) return 12;
  if (amount <= 1500) return 22;
  if (amount <= 2500) return 32;
  if (amount <= 3500) return 51;
  if (amount <= 5000) return 55;
  if (amount <= 7500) return 65;
  if (amount <= 10000) return 77;
  if (amount <= 15000) return 87;
  if (amount <= 20000) return 97;
  return 102; // Above 20,000
}
// ============================================================

function SendMoney() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"mobile" | "pochi">("mobile");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [lookupErr, setLookupErr] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [balance, setBalance] = useState("0.00");
  const [method, setMethod] = useState<"mpesa" | "shiriki">("mpesa");
  const [loadingBalance, setLoadingBalance] = useState(true);

  const refreshBalance = async () => {
    try {
      if (hasBackend()) {
        const data = await apiBalance();
        const bal = data.balance || "0.00";
        setBalance(String(bal));
      } else {
        ensureSeed();
        setBalance(String(getBalance()));
      }
    } catch {
      console.warn("Failed to refresh balance, using local");
      ensureSeed();
      setBalance(String(getBalance()));
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    ensureSeed();
    if (!isAuthed()) {
      navigate({ to: "/login" });
      return;
    }
    refreshBalance();
  }, [navigate]);

  // Refresh balance when returning to this page
  useEffect(() => {
    const handleFocus = () => refreshBalance();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshBalance();
    });

    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Real-time recipient lookup
  useEffect(() => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      setRecipientName(null);
      setLookupErr(null);
      return;
    }

    const t = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const data = await apiLookupRecipient(cleaned);
        if (data.recipient_name && data.exists !== false) {
          setRecipientName(data.recipient_name);
          setLookupErr(null);
        } else {
          setRecipientName(null);
          setLookupErr(data.error || "Recipient not found");
        }
      } catch {
        console.warn("Lookup failed, using local fallback");
        const name = lookupRecipient(cleaned);
        setRecipientName(name || null);
        setLookupErr(name ? null : "Please enter a valid phone number");
      } finally {
        setIsLookingUp(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [phone]);

  const cleanedPhone = phone.replace(/\D/g, "");
  const numericAmount = parseFloat(amount || "0");
  const canContinue = cleanedPhone.length >= 10 && numericAmount > 0 && !!recipientName;

  const onContinue = () => {
    if (!canContinue) return;
    const fee = calculateSendFee(numericAmount);
    navigate({
      to: "/send-money/confirm",
      search: {
        phone: cleanedPhone,
        amount,
        name: recipientName || "",
        fee: fee.toString(),
      },
    });
  };

  const phoneInvalid = cleanedPhone.length >= 10 && !!lookupErr;

  return (
    <div className="phone-shell app-text flex flex-col page-enter pb-10">
      {/* Header */}
      <div className="flex items-center px-5 pt-4 pb-3">
        <button
          onClick={() => navigate({ to: "/" })}
          className="w-10 h-10 rounded-full app-card flex items-center justify-center active:opacity-80"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center font-semibold text-[17px] -ml-10">Send Money</h1>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-1">
        <div className="app-card rounded-full p-1 flex">
          <button
            onClick={() => setTab("mobile")}
            className={`flex-1 py-3 rounded-full text-sm font-medium transition-all ${
              tab === "mobile" ? "bg-[#2ba84a] text-white" : "app-text"
            }`}
          >
            Mobile number
          </button>
          <button
            onClick={() => setTab("pochi")}
            className={`flex-1 py-3 rounded-full text-sm font-medium transition-all ${
              tab === "pochi" ? "bg-[#2ba84a] text-white" : "app-text"
            }`}
          >
            Pochi la Biashara
          </button>
        </div>
      </div>

      {/* Favourites */}
      <div className="px-5 mt-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold">Favourites</h2>
          <button className="text-sm font-medium text-[#00A651]">View All</button>
        </div>
        <div className="flex gap-5 mt-3">
          <button className="flex flex-col items-center gap-1.5 active:opacity-70">
            <span className="w-[52px] h-[52px] rounded-full app-card flex items-center justify-center">
              <Plus size={20} className="text-[#E60012]" />
            </span>
            <span className="text-[11px] app-sub">Add</span>
          </button>
        </div>
      </div>

      {/* Phone Input */}
      <div className="px-5 mt-5">
        <label className="text-[15px] app-text">Enter phone number</label>
        <div
          className={`mt-2 flex items-center app-input px-4 py-4 ${
            phoneInvalid ? "border-red-500" : ""
          }`}
        >
          <input
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="Enter phone number"
            className="flex-1 bg-transparent outline-none text-base app-text placeholder:app-sub"
          />
          <div className="flex items-center gap-3">
            <Contact size={20} className="text-[#00A651]" />
            <span className="w-px h-6" style={{ background: "var(--app-line)" }} />
            <ScanLine size={20} className="text-[#E60012]" />
          </div>
        </div>

        {isLookingUp && (
          <p className="text-xs app-sub mt-1.5 flex items-center gap-1">
            <span className="spinner w-3 h-3" /> Looking up recipient...
          </p>
        )}

        {recipientName && !isLookingUp && (
          <div className="flex items-center gap-1.5 text-xs text-[#00A651] font-semibold mt-1.5">
            <CheckCircle size={16} />
            {recipientName}
          </div>
        )}

        {phoneInvalid && !isLookingUp && (
          <p className="text-xs text-red-500 mt-1.5">{lookupErr}</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="px-5 mt-5">
        <label className="text-[15px] app-text">Enter amount</label>
        <div className="mt-2 flex items-center app-input px-4 py-4">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 8))}
            placeholder="0"
            className="flex-1 bg-transparent outline-none text-base app-text placeholder:app-sub"
          />
          <span className="app-sub text-base">Ksh</span>
        </div>
        <p className="text-[13px] app-sub mt-2">
          Balance: Ksh {loadingBalance ? "..." : formatKsh(balance)}
        </p>
      </div>

      {/* Payment Method */}
      <div className="px-5 mt-5">
        <h3 className="text-[15px] app-text">Payment Method</h3>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            onClick={() => setMethod("mpesa")}
            className={`relative overflow-hidden rounded-xl border px-3 py-4 text-center transition ${
              method === "mpesa" ? "border-[#2ba84a]" : "app-line"
            }`}
            style={{
              background:
                method === "mpesa" ? "color-mix(in oklab, #2ba84a 8%, var(--app-surface))" : "var(--app-surface)",
            }}
          >
            {method === "mpesa" && (
              <span className="absolute top-0 right-0 w-8 h-8 flex items-start justify-end pr-1 pt-0.5 bg-[#2ba84a]"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}>
                <Check size={12} className="text-white" />
              </span>
            )}
            <div className="text-xl leading-none text-[#E60012]">〰</div>
            <div className="mt-2 text-sm font-semibold app-text">M-PESA</div>
            <div className="text-[11px] app-sub mt-0.5">Bal. Ksh {formatKsh(balance)}</div>
          </button>

          <button
            onClick={() => setMethod("shiriki")}
            className={`relative overflow-hidden rounded-xl border px-3 py-4 text-center transition ${
              method === "shiriki" ? "border-[#2ba84a]" : "app-line"
            }`}
            style={{
              background:
                method === "shiriki" ? "color-mix(in oklab, #2ba84a 8%, var(--app-surface))" : "var(--app-surface)",
            }}
          >
            {method === "shiriki" && (
              <span className="absolute top-0 right-0 w-8 h-8 flex items-start justify-end pr-1 pt-0.5 bg-[#2ba84a]"
                style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}>
                <Check size={12} className="text-white" />
              </span>
            )}
            <div className="text-xl leading-none app-sub">〰</div>
            <div className="mt-2 text-sm font-semibold app-text">Shiriki Pay</div>
            <div className="text-[11px] app-sub mt-0.5">Select</div>
          </button>
        </div>
      </div>

      {/* Continue */}
      <div className="px-5 mt-6">
        <button
          onClick={onContinue}
          disabled={!canContinue || isLookingUp}
          className={`w-full py-4 rounded-xl font-medium transition-all ${
            canContinue && !isLookingUp
              ? "bg-[#2ba84a] text-white active:scale-[0.98]"
              : "app-card app-sub cursor-not-allowed"
          }`}
        >
          {isLookingUp ? "Verifying..." : "Continue"}
        </button>
      </div>

      {/* Do More */}
      <div className="px-5 mt-7 pb-10">
        <h3 className="text-[15px] font-bold mb-3">Do More</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Send to\nmany", Icon: Users },
            { label: "Request\nmoney", Icon: Wallet },
            { label: "International\ntransfers", Icon: Globe },
          ].map(({ label, Icon }) => (
            <button
              key={label}
              className="app-card rounded-2xl py-4 flex flex-col items-center gap-2 active:opacity-80 transition"
            >
              <span
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: "var(--app-chip)" }}
              >
                <Icon size={20} className="text-[#00A651]" />
              </span>
              <span className="text-[12px] text-center app-text whitespace-pre-line leading-tight">
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
