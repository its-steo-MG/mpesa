import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { X, Copy, Download, Share2 } from "lucide-react";
import { getInitials, getAvatarColor, maskPhone, formatKsh } from "@/lib/mpesa-utils";
import { getTx, type Tx } from "@/lib/mpesa-store";
import { apiTransactions, hasBackend } from "@/lib/mpesa-api";

export const Route = createFileRoute("/transactions/$id")({
  head: () => ({ meta: [{ title: "Transaction Details" }] }),
  component: TxDetail,
});

function TxDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [tx, setTx] = useState<Tx | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTransaction = async () => {
    setLoading(true);
    try {
      if (hasBackend()) {
        const allTxs = await apiTransactions();
        const found = allTxs.find(
          (t: any) => String(t.id) === String(id) || t.mpesa_id === String(id)
        );
        if (found) {
          setTx({
            id: found.id,
            transaction_type: found.transaction_type,
            amount: Number(found.amount),
            recipient_name: found.recipient_name,
            recipient_phone: found.recipient_phone,
            description: found.description,
            mpesa_id: found.mpesa_id,
            reference: found.reference,
            created_at: found.created_at,
            category: found.category,
            till_number: found.till_number,
          } as Tx);
          setLoading(false);
          return;
        }
      }
      // Fallback to local storage
      const localTx = getTx(id);
      setTx(localTx || null);
    } catch (err) {
      console.warn("Failed to load from backend, using local");
      const localTx = getTx(id);
      setTx(localTx || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransaction();
  }, [id]);

  if (loading) {
    return (
      <div className="phone-shell flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32 }} />
          <p>Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="phone-shell flex items-center justify-center text-gray-500">
        Transaction not found
      </div>
    );
  }

  const isOut = tx.transaction_type !== "deposit";
  const display = tx.recipient_name || tx.description || "Transaction";
  const dateStr = new Date(tx.created_at).toLocaleDateString("en-GB", { 
    day: "numeric", month: "short", year: "numeric" 
  });
  const timeStr = new Date(tx.created_at).toLocaleTimeString("en-US", { 
    hour: "numeric", minute: "2-digit", hour12: true 
  }).toLowerCase().replace(" ", "");

  // ==================== IMPROVED LABEL LOGIC ====================
  const isWalletTransaction = 
    tx.description?.toLowerCase().includes("sashitrendy") || 
    tx.description?.toLowerCase().includes("wallet");

  const isMerchant = 
    tx.category === "buygoods" || 
    (tx.category === "deposit" && !!tx.till_number) ||
    isWalletTransaction;

  const label = isMerchant ? "Merchant Customer Payment" : "Send Money";
  // ============================================================

  const amountSign = isOut ? "-" : "+";
  const amountText = `${amountSign} KSH ${formatKsh(tx.amount)}`;

  return (
    <div className="phone-shell text-white flex flex-col min-h-screen pb-6 page-enter">
      {/* Top Bar */}
      <div className="flex items-center px-4 pt-3 pb-2">
        <button 
          onClick={() => navigate({ to: "/statements" })} 
          className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center relative"
        >
          <div className="relative w-5 h-5">
            <div className="absolute top-1/2 left-0 w-5 h-[2.5px] bg-red-500 rotate-45 rounded" />
            <div className="absolute top-1/2 left-0 w-5 h-[2.5px] bg-[#00C853] -rotate-45 rounded" />
          </div>
        </button>
        <div className="flex-1 text-center text-gray-400 text-sm -ml-9">
          {dateStr} | {timeStr}
        </div>
      </div>

      <div className="px-4 mt-6 flex-1">
        <div className="relative">
          <div className="relative bg-[#111114] rounded-3xl pt-14 pb-8 px-5 overflow-visible">
            {/* Gradient Top Border */}
            <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#1E88E5] via-[#00C853] to-[#1E88E5] z-0" />

            {/* Floating Avatar */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-9 z-20">
              <div 
                className="w-[78px] h-[78px] rounded-full flex items-center justify-center text-3xl font-bold border-[5px] border-[#111114]"
                style={{ 
                  background: getAvatarColor(display), 
                  color: "#111",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.6)"
                }}
              >
                {getInitials(display)}
              </div>
            </div>

            {/* Content */}
            <div className="text-center pt-3">
              <div className="inline-block px-5 py-1 rounded-full border border-gray-700 text-xs text-gray-300 mb-3">
                {label}
              </div>

              <div className="text-xl font-semibold">{display}</div>

              {/* Amount - Made smaller and less bold */}
              <div className="text-3xl font-semibold mt-2 text-white tracking-tight">
                {amountText}
              </div>
            </div>

            {/* Details Section */}
            <div className="mt-8 space-y-5">
              {tx.till_number && (
                <div>
                  <div className="text-xs text-gray-400">Till Number</div>
                  <div className="text-2xl mt-1">{tx.till_number}</div>
                </div>
              )}

              {tx.recipient_phone && (
                <div>
                  <div className="text-xs text-gray-400">Phone Number</div>
                  <div className="text-2xl mt-1">{maskPhone(tx.recipient_phone)}</div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-xs text-gray-400">Transaction ID</div>
                    <div className="font-mono text-xl mt-1">{tx.mpesa_id}</div>
                  </div>

                  <button 
                    onClick={() => navigator.clipboard.writeText(tx.mpesa_id)}
                    className="flex items-center gap-1.5 bg-[#1F1F22] rounded-xl px-3 py-2 active:bg-[#2A2A2A] shrink-0"
                  >
                    <Copy size={16} className="text-red-500" />
                    <span className="text-[#00C853] text-sm font-medium">Copy</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isMerchant && (
          <div className="grid grid-cols-2 gap-4 mt-12 px-1">
            <button className="flex flex-col items-center gap-3 py-5 bg-[#1A1A1A] rounded-2xl active:bg-[#252525]">
              <Download size={26} className="text-[#00C853]" />
              <span className="text-sm">Download receipt</span>
            </button>
            <button className="flex flex-col items-center gap-3 py-5 bg-[#1A1A1A] rounded-2xl active:bg-[#252525]">
              <Share2 size={26} className="text-[#00C853]" />
              <span className="text-sm">Share details</span>
            </button>
          </div>
        )}
      </div>

      {/* Done Button */}
      <div className="px-5 pt-8 pb-6">
        <button 
          onClick={() => navigate({ to: "/statements" })}
          className="solid-green w-full py-4 text-base font-semibold"
        >
          Done
        </button>
      </div>
    </div>
  );
}