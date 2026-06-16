import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, User as UserIcon, ScanLine, Users, Wallet, Globe, CheckCircle } from "lucide-react";
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
  const [activeField, setActiveField] = useState<"phone" | "amount">("phone");
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
    } catch (err) {
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
      } catch (err: any) {
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
  const canContinue =
    cleanedPhone.length >= 10 &&
    numericAmount > 0 &&
    !!recipientName;

  const onContinue = () => {
    if (!canContinue) return;

    const fee = calculateSendFee(numericAmount);

    navigate({
      to: "/send-money/confirm",
      search: {
        phone: cleanedPhone,
        amount,
        name: recipientName || "",
        fee: fee.toString(),           // ← Fee is now passed
      },
    });
  };

  const phoneInvalid = cleanedPhone.length >= 10 && !!lookupErr;

  return (
    <div className="phone-shell text-white flex flex-col page-enter">
      <div className="flex items-center px-4 pt-3 pb-2">
        <button 
          onClick={() => {
            console.log("Back button clicked");
            navigate({ to: "/" });
          }} 
          className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center active:bg-[#252525] transition-colors cursor-pointer z-50"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center font-semibold -ml-9">Send Money</h1>
      </div>

      {/* Tabs */}
      <div className="px-4 mt-2">
        <div className="bg-[#1A1A1A] rounded-full p-1 flex">
          <button 
            onClick={() => setTab("mobile")} 
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${tab === "mobile" ? "bg-[#00C853] text-white shadow-lg" : "text-gray-300"}`}
          >
            Mobile number
          </button>
          <button 
            onClick={() => setTab("pochi")} 
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all ${tab === "pochi" ? "bg-[#00C853] text-white shadow-lg" : "text-gray-300"}`}
          >
            Pochi la Biashara
          </button>
        </div>
      </div>

      {/* Phone Input */}
      <div className="px-4 mt-4">
        <label className="text-xs text-gray-300">Enter phone number</label>
        <div
          onClick={() => setActiveField("phone")}
          className={`mt-1 flex items-center bg-transparent border rounded-xl px-3 py-3.5 transition-colors ${
            activeField === "phone" ? "border-gray-500" : phoneInvalid ? "border-red-500" : "border-gray-700"
          }`}
        >
          <input
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
            onFocus={() => setActiveField("phone")}
            placeholder="0712345678"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-500"
          />
          <div className="flex items-center gap-2">
            <UserIcon size={18} className="text-[#00C853]" />
            <div className="w-px h-5 bg-gray-700" />
            <ScanLine size={18} className="text-red-500" />
          </div>
        </div>

        {isLookingUp && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <span className="spinner w-3 h-3" /> Looking up recipient...
          </p>
        )}

        {recipientName && !isLookingUp && (
          <div className="flex items-center gap-1.5 text-xs text-[#00C853] font-semibold mt-1.5">
            <CheckCircle size={16} />
            {recipientName}
          </div>
        )}

        {phoneInvalid && !isLookingUp && (
          <p className="text-xs text-red-500 mt-1">{lookupErr}</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="px-4 mt-4">
        <label className="text-xs text-gray-300">Enter amount</label>
        <div
          onClick={() => setActiveField("amount")}
          className={`mt-1 flex items-center bg-transparent border rounded-xl px-3 py-3.5 transition-colors ${
            activeField === "amount" ? "border-gray-500" : "border-gray-700"
          }`}
        >
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, "").slice(0, 8))}
            onFocus={() => setActiveField("amount")}
            placeholder="0"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-500"
          />
          <span className="text-gray-400 text-sm">Ksh</span>
        </div>
        
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          Balance: Ksh {loadingBalance ? "..." : formatKsh(balance)}
        </p>
      </div>

      <div className="px-4 mt-6">
        <button 
          onClick={onContinue} 
          disabled={!canContinue || isLookingUp} 
          className={`w-full py-4 rounded-xl font-semibold transition-all ${
            canContinue && !isLookingUp 
              ? "bg-[#00C853] text-white active:scale-[0.98]" 
              : "bg-[#2A2A2A] text-gray-500 cursor-not-allowed"
          }`}
        >
          {isLookingUp ? "Verifying..." : "Continue"}
        </button>
      </div>

      <div className="px-4 mt-6 pb-8">
        <h3 className="text-sm font-bold mb-2">Do More</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Send to\nmany", Icon: Users, color: "text-red-500" },
            { label: "Request\nmoney", Icon: Wallet, color: "text-[#00C853]" },
            { label: "International\ntransfers", Icon: Globe, color: "text-[#00C853]" },
          ].map(({ label, Icon, color }) => (
            <button key={label} className="bg-[#1A1A1A] rounded-2xl p-3 flex flex-col items-center gap-2 active:bg-[#252525] transition">
              <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center">
                <Icon size={18} className={color} />
              </div>
              <span className="text-[11px] text-center text-white whitespace-pre-line leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}