import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Download, Share2, Star, RotateCcw, Check } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

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
      const localTx = getTx(id);
      setTx(localTx || null);
    } catch {
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
      <div className="phone-shell flex items-center justify-center app-sub">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 32, height: 32 }} />
          <p>Loading transaction...</p>
        </div>
      </div>
    );
  }

  if (!tx) {
    return (
      <div className="phone-shell flex items-center justify-center app-sub">
        Transaction not found
      </div>
    );
  }

  const isOut = tx.transaction_type !== "deposit";
  const display = tx.recipient_name || tx.description || "Transaction";
  const color = getAvatarColor(display);
  const d = new Date(tx.created_at);
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? "th" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const dateStr = `${day}${day === 1 || day === 21 || day === 31 ? "st" : suffix} ${d.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`;
  const timeStr = d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(" ", "")
    .toUpperCase();

  const isWalletTransaction =
    tx.description?.toLowerCase().includes("sashitrendy") ||
    tx.description?.toLowerCase().includes("wallet");

  const isMerchant =
    tx.category === "buygoods" ||
    (tx.category === "deposit" && !!tx.till_number) ||
    isWalletTransaction;

  const label = isMerchant ? "Merchant Customer Payment" : "Send Money";
  const amountText = `${isOut ? "-" : "+"} KSH ${formatKsh(tx.amount)}`;

  const copyId = () => {
    navigator.clipboard.writeText(tx.mpesa_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const actions = [
    { icon: Star, label: "Add to\nfavourites" },
    { icon: RotateCcw, label: "Reverse\ntransaction" },
    { icon: Download, label: "Download\nreceipt" },
    { icon: Share2, label: "Share\ndetails" },
  ];

  return (
    <div className="phone-shell app-text flex flex-col min-h-[100dvh] page-enter">
      {/* Top Bar */}
      <div className="flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => navigate({ to: "/statements" })}
          aria-label="Close"
          className="w-11 h-11 rounded-full app-card flex items-center justify-center active:opacity-80"
        >
          <div className="relative w-[18px] h-[18px]">
            <div className="absolute top-1/2 left-0 w-[18px] h-[2px] -mt-[1px] bg-[#E53935] rotate-45 rounded" />
            <div className="absolute top-1/2 left-0 w-[18px] h-[2px] -mt-[1px] bg-[#00C853] -rotate-45 rounded" />
          </div>
        </button>
        <div className="flex-1 text-center app-sub text-[15px] -ml-11">
          {dateStr} | {timeStr}
        </div>
      </div>

      {/* Card */}
      <div className="px-4 mt-16">
        <div className="relative">
          {/* Floating Avatar */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-[54px] z-20">
            <div
              className="w-[110px] h-[110px] rounded-full flex items-center justify-center app-bg p-[6px]"
              style={{ boxShadow: "0 0 0 1px var(--app-line)" }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold"
                style={{ background: `${color}22`, color }}
              >
                {getInitials(display)}
              </div>
            </div>
          </div>

          <div className="ring-card pt-16 pb-7 px-5">
            <div className="text-center">
              <div className="inline-block px-4 py-1.5 rounded-full border app-line text-[13px] app-sub">
                {label}
              </div>
              <div className="text-[19px] mt-4">{display}</div>
              <div className="text-[30px] font-bold mt-1.5 tracking-tight">{amountText}</div>
            </div>

            <div className="mt-10 space-y-5">
              {tx.till_number && (
                <div>
                  <div className="text-[13px] app-sub">Transaction Number</div>
                  <div className="text-[22px] mt-0.5">{tx.till_number}</div>
                </div>
              )}

              {!tx.till_number && tx.recipient_phone && (
                <div>
                  <div className="text-[13px] app-sub">Phone Number</div>
                  <div className="text-[22px] mt-0.5">{maskPhone(tx.recipient_phone)}</div>
                </div>
              )}

              <div className="pt-5 border-t app-line">
                <div className="text-[13px] app-sub">Transaction ID</div>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="text-[22px] tracking-tight">{tx.mpesa_id}</div>
                  <button
                    onClick={copyId}
                    className="flex items-center gap-1.5 app-card rounded-lg px-3 py-2 active:opacity-80 shrink-0"
                  >
                    {copied ? (
                      <Check size={15} className="text-[#00C853]" />
                    ) : (
                      <Copy size={15} className="text-[#E53935]" />
                    )}
                    <span className="text-[#00C853] text-sm font-medium">
                      {copied ? "Copied" : "Copy"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Actions (non-merchant) */}
      {!isMerchant && (
        <div className="grid grid-cols-4 gap-2 px-4 pb-4">
          {actions.map(({ icon: Icon, label: l }) => (
            <button key={l} className="flex flex-col items-center gap-2 active:opacity-70">
              <div className="w-12 h-12 rounded-full app-card flex items-center justify-center">
                <Icon size={20} className="text-[#00C853]" />
              </div>
              <span className="text-[12px] leading-tight text-center whitespace-pre-line app-text">
                {l}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="px-4 pb-8 pt-2">
        <button onClick={() => navigate({ to: "/statements" })} className="solid-green text-base">
          Done
        </button>
      </div>
    </div>
  );
}
