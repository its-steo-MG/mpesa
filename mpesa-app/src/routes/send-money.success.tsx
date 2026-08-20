import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, Copy, Star, RotateCw, FileText, CalendarClock, Share2 } from "lucide-react";
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
    return <div className="phone-shell flex items-center justify-center app-sub">Loading...</div>;
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
    <div className="phone-shell app-text flex flex-col min-h-screen page-enter">
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="w-10 h-10 rounded-full app-card flex items-center justify-center"
        >
          <X size={18} className="text-[#E60012]" />
        </button>
        <button className="w-10 h-10 rounded-full app-card flex items-center justify-center">
          <Share2 size={18} className="text-[#E60012]" />
        </button>
      </div>

      <div className="flex-1 px-5 mt-14">
        <div className="relative" style={{ animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
          <div
            className="absolute -top-[34px] left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full app-surface border flex items-center justify-center text-3xl z-30 app-line"
            style={{ animation: showCheck ? "pop-in 0.55s cubic-bezier(0.34,1.56,0.64,1)" : "none" }}
          >
            🎉
          </div>

          <div className="ring-card px-5 pt-14 pb-6">
            <div className="text-center">
              <div className="font-semibold text-[19px] leading-snug">
                Your transaction was
                <br />
                successful
              </div>
              <div className="mt-3 text-[15px] app-sub">
                {dateStr} | {timeStr}
              </div>

              <div className="mt-4 text-[30px] font-bold">Ksh {formatKsh(tx.amount)}</div>

              <div className="mt-2 text-[14px] app-sub">
                Transaction cost: <span className="font-semibold app-text">Ksh {formatKsh(feeAmount)}</span>
              </div>

              <div
                className="inline-flex items-center gap-3 mt-4 rounded-lg px-3 py-2"
                style={{ background: "var(--app-chip)" }}
              >
                <span className="text-[14px] app-sub">
                  ID: <span className="text-[#00A651] font-semibold">{tx.mpesa_id}</span>
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(tx.mpesa_id)}
                  className="flex items-center gap-1 text-[14px]"
                >
                  <Copy size={14} className="text-[#E60012]" />
                  <span className="text-[#00A651]">Copy</span>
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-xl p-4" style={{ background: "var(--app-chip)" }}>
              <div className="text-[13px] app-sub">Sent to:</div>
              <div className="flex items-center gap-3 mt-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-semibold"
                  style={{
                    background: `color-mix(in oklab, ${getAvatarColor(display)} 22%, var(--app-surface))`,
                    color: getAvatarColor(display),
                  }}
                >
                  {getInitials(display)}
                </div>
                <div>
                  <div className="font-semibold text-[16px]">{display}</div>
                  {tx.recipient_phone && (
                    <div className="text-[15px] app-sub">Phone number: {tx.recipient_phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-8">
          {[
            { Icon: Star, label: "Add to\nfavourites" },
            { Icon: CalendarClock, label: "Schedule\nPayment" },
            { Icon: FileText, label: "Download\nreceipt" },
            { Icon: RotateCw, label: "Reverse\ntransaction" },
          ].map(({ Icon, label }) => (
            <button key={label} className="flex flex-col items-center gap-2 active:opacity-70">
              <span
                className="w-12 h-12 rounded-full flex items-center justify-center"
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

      <div className="px-5 pb-8 mt-6">
        <button onClick={() => navigate({ to: "/" })} className="solid-green text-base">
          Done
        </button>
      </div>
    </div>
  );
}
