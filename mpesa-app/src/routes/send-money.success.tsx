import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, Copy, Star, RotateCw, Download, Share2 } from "lucide-react";
import { getInitials, getAvatarColor, formatKsh } from "@/lib/mpesa-utils";
import { getTx, type Tx } from "@/lib/mpesa-store";
import { z } from "zod";

const search = z.object({ 
  id: z.string(),
  fee: z.string().default("0")   // Added to receive fee from confirm page
});

export const Route = createFileRoute("/send-money/success")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Transaction Successful" }] }),
  component: Success,
});

function Success() {
  const navigate = useNavigate();
  const { id, fee: urlFee = "0" } = Route.useSearch();
  const [tx, setTx] = useState<any>(null);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    let transactionData = null;

    // 1. Try sessionStorage first (has the real fee from backend)
    const savedTx = sessionStorage.getItem("mpesa_just_sent");
    if (savedTx) {
      try {
        transactionData = JSON.parse(savedTx);
        sessionStorage.removeItem("mpesa_just_sent");
      } catch (e) {
        console.warn("Failed to parse mpesa_just_sent");
      }
    }

    // 2. Fallback to local storage
    if (!transactionData) {
      const localTx = getTx(id);
      if (localTx) transactionData = localTx;
    }

    if (transactionData) {
      setTx(transactionData);
    }

    const timer = setTimeout(() => setShowCheck(true), 300);
    return () => clearTimeout(timer);
  }, [id]);

  if (!tx) {
    return <div className="phone-shell flex items-center justify-center text-gray-500">Loading...</div>;
  }

  const display = tx.recipient_name || "Recipient";
  const dateStr = new Date(tx.created_at || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = new Date(tx.created_at || Date.now()).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase().replace(" ", "");

  // Get fee from URL first (most reliable), then from tx object
  const feeAmount = Number(
    urlFee || 
    tx.fee || 
    tx.transaction_cost || 
    tx.fee_amount || 
    0
  );

  return (
    <div className="phone-shell text-white flex flex-col min-h-screen page-enter">
      <div className="flex items-center px-4 pt-3 pb-2">
        <button onClick={() => navigate({ to: "/" })} className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center">
          <X size={18} className="text-red-500" />
        </button>
      </div>

      <div className="flex-1 px-4 mt-8">
        <div className="relative ring-card pt-10 pb-6 px-5" style={{ animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
          <div
            className="absolute -top-9 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full bg-black border-2 border-[#1A1A1A] flex items-center justify-center text-4xl z-10"
            style={{ animation: showCheck ? "pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}
          >
            🎉
          </div>

          <div className="ring-card-inner pt-8 text-center">
            <div className="font-semibold text-lg leading-tight">Your transaction was<br />successful</div>
            <div className="mt-3 text-sm text-gray-400">{dateStr} | {timeStr}</div>
            
            <div className="mt-5 text-3xl font-bold">Ksh {formatKsh(tx.amount)}</div>

            {/* Transaction Cost - Now shows real fee */}
            <div className="mt-2 text-sm text-gray-300">
              Transaction cost: <span className="font-semibold">Ksh {formatKsh(feeAmount)}</span>
            </div>

            <div className="inline-flex items-center gap-2 mt-3 bg-[#1F1F1F] rounded-lg px-3 py-1.5">
              <span className="text-sm text-gray-400">ID: <span className="text-[#00C853] font-semibold">{tx.mpesa_id}</span></span>
              <button onClick={() => navigator.clipboard.writeText(tx.mpesa_id)} className="text-red-500 flex items-center gap-1 text-sm">
                <Copy size={14} /> <span className="text-[#00C853]">Copy</span>
              </button>
            </div>
          </div>

          <div className="mt-5 bg-[#1F1F1F] rounded-xl p-4">
            <div className="text-sm text-gray-400">Sent to:</div>
            <div className="flex items-center gap-3 mt-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold" style={{ background: `${getAvatarColor(display)}33`, color: getAvatarColor(display) }}>
                {getInitials(display)}
              </div>
              <div>
                <div className="font-semibold">{display}</div>
                {tx.recipient_phone && <div className="text-sm text-gray-400">Phone number: {tx.recipient_phone}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-8">
          {[
            { Icon: Star, label: "Add to\nfavourites" },
            { Icon: RotateCw, label: "Reverse\ntransaction" },
            { Icon: Download, label: "Download\nreceipt" },
            { Icon: Share2, label: "Share\ndetails" },
          ].map(({ Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-2 active:opacity-70">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                <Icon size={20} className="text-[#00C853]" />
              </div>
              <span className="text-[11px] text-center text-white whitespace-pre-line leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 mt-6">
        <button onClick={() => navigate({ to: "/" })} className="solid-green">Done</button>
      </div>
    </div>
  );
}