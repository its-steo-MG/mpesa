import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Search, FileText } from "lucide-react";
import { getInitials, getAvatarColor, formatKsh } from "@/lib/mpesa-utils";
import { ensureSeed, getTxs, isAuthed, type Tx } from "@/lib/mpesa-store";
import { apiTransactions, hasBackend } from "@/lib/mpesa-api";

export const Route = createFileRoute("/statements")({
  head: () => ({ meta: [{ title: "M-PESA Statements" }] }),
  component: Statements,
});

function Statements() {
  const navigate = useNavigate();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      if (hasBackend()) {
        const data = await apiTransactions();
        // Normalize backend data to match frontend Tx interface
        const normalized = data.map((t: any) => ({
          id: t.id,
          transaction_type: t.transaction_type,
          amount: Number(t.amount),
          recipient_name: t.recipient_name,
          recipient_phone: t.recipient_phone,
          description: t.description,
          mpesa_id: t.mpesa_id,
          reference: t.reference,
          created_at: t.created_at,
          category: t.category,
          till_number: t.till_number,
        }));
        setTxs(normalized);
      } else {
        ensureSeed();
        setTxs(getTxs());
      }
    } catch (err) {
      console.warn("Failed to load from backend, using local");
      ensureSeed();
      setTxs(getTxs());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed()) {
      navigate({ to: "/login" });
      return;
    }
    loadTransactions();
  }, [navigate]);

  // Refresh when returning to the page
  useEffect(() => {
    const handleFocus = () => loadTransactions();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") loadTransactions();
    });

    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const filtered = txs.filter(t => {
    const s = q.toLowerCase();
    return !s ||
      (t.recipient_name || "").toLowerCase().includes(s) ||
      (t.description || "").toLowerCase().includes(s) ||
      (t.till_number || "").includes(s) ||
      (t.mpesa_id || "").toLowerCase().includes(s);
  });

  const grouped = filtered.reduce<Record<string, Tx[]>>((acc, t) => {
    const k = new Date(t.created_at).toLocaleDateString("en-GB", { 
      day: "numeric", 
      month: "long", 
      year: "numeric" 
    });
    (acc[k] ||= []).push(t);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="phone-shell text-white flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} />
          <p className="text-gray-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="phone-shell text-white pb-24 page-enter">
      {/* Header */}
      <div className="flex items-center px-4 pt-3 pb-2 sticky top-0 bg-black z-20 border-b border-gray-800">
        <button 
          onClick={() => {
            console.log("Back button clicked"); // For debugging
            navigate({ to: "/" });
          }} 
          className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center active:bg-[#252525] transition-colors cursor-pointer z-50"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="flex-1 text-center font-semibold text-lg -ml-9">M-PESA Statements</h1>
      </div>

      {/* Search */}
      <div className="px-4 mt-4">
        <div className="flex items-center bg-transparent border border-gray-700 rounded-xl px-3 py-3 gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <Search size={16} className="text-[#00C853]" />
          </div>
          <input 
            value={q} 
            onChange={e => setQ(e.target.value)} 
            placeholder="Search transactions" 
            className="flex-1 bg-transparent outline-none text-base placeholder:text-gray-400" 
          />
        </div>
      </div>

      {/* Month Filter */}
      <div className="px-4 mt-4">
        <button className="bg-[#00C853] text-white text-sm font-semibold rounded-full px-5 py-1.5">
          {new Date().toLocaleString('default', { month: 'long' })}
        </button>
      </div>

      {/* Transactions List */}
      <div className="mt-4">
        {Object.entries(grouped).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No transactions found
          </div>
        ) : (
          Object.entries(grouped).map(([date, list]) => (
            <div key={date}>
              <div className="px-4 py-3 text-sm font-medium text-gray-300 sticky top-0 bg-black z-10">
                {date}
              </div>
              <div className="px-2">
                {list.map(t => {
                  const isOut = t.transaction_type !== "deposit";
                  const display = t.recipient_name || t.description || "Transaction";
                  const sub = t.till_number || t.recipient_phone || t.description || "";

                  return (
                    <Link 
                      key={t.id} 
                      to="/transactions/$id" 
                      params={{ id: String(t.id) }} 
                      className="flex items-center gap-3 px-3 py-4 rounded-2xl active:bg-[#1A1A1A] transition"
                    >
                      <div 
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0" 
                        style={{ background: `${getAvatarColor(display)}33`, color: getAvatarColor(display) }}
                      >
                        {getInitials(display)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold truncate">{display}</div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{sub}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-[15px] font-semibold text-white">
                          {isOut ? "- " : "+ "}Ksh {formatKsh(t.amount)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {new Date(t.created_at).toLocaleTimeString("en-US", { 
                            hour: "2-digit", 
                            minute: "2-digit", 
                            hour12: true 
                          })}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Button */}
      <button className="fixed bottom-5 right-4 bg-[#1A1A1A] rounded-full px-5 py-3 flex items-center gap-2 shadow-2xl border border-[#00C853]/30 active:scale-95 transition">
        <FileText size={16} className="text-[#00C853]" />
        <span className="text-[#00C853] font-semibold text-sm">Statement Options</span>
      </button>
    </div>
  );
}