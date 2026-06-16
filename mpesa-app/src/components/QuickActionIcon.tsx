import { useState } from "react";
import { Link } from "@tanstack/react-router";

/**
 * Quick-action icon. Tries /icons/{slug}.png from the public folder first.
 * Falls back to colorful badge if image is missing.
 */
export interface QAProps {
  slug: string;
  label: string;
  fallbackColor: string;
  fallbackEmoji: string;
  to?: string;
}

export function QuickActionIcon({ slug, label, fallbackColor, fallbackEmoji, to }: QAProps) {
  const [errored, setErrored] = useState(false);

  const content = (
    <div className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform cursor-pointer">
      <div className="w-14 h-14 rounded-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden border border-gray-800">
        {!errored ? (
          <img
            src={`/icons/${slug}.png`}
            alt={label}
            className="w-12 h-12 object-contain"
            onError={() => setErrored(true)}
          />
        ) : (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-inner"
            style={{ background: fallbackColor }}
          >
            {fallbackEmoji}
          </div>
        )}
      </div>
      <span className="text-[10px] text-center leading-tight font-medium text-gray-200 whitespace-pre-line px-1">
        {label}
      </span>
    </div>
  );

  return to ? <Link to={to}>{content}</Link> : <button type="button">{content}</button>;
}

export const QUICK_ACTIONS: QAProps[] = [
  { slug: "send-money", label: "Send Money", fallbackColor: "#00C853", fallbackEmoji: "💸", to: "/send-money" },
  { slug: "lipa-na-mpesa", label: "Lipa na\nM-PESA", fallbackColor: "#E60012", fallbackEmoji: "🛒" },
  { slug: "withdraw-money", label: "Withdraw\nMoney", fallbackColor: "#00B0FF", fallbackEmoji: "🏧" },
  { slug: "buy-bundles", label: "Buy Bundles", fallbackColor: "#9333EA", fallbackEmoji: "📶" },
  { slug: "airtime-topup", label: "Airtime Top\nup", fallbackColor: "#F59E0B", fallbackEmoji: "📞" },
  { slug: "tunukiwa-bundles", label: "Tunukiwa\nBundles", fallbackColor: "#EC4899", fallbackEmoji: "🎁" },
  { slug: "international-transfers", label: "International\nTransfers", fallbackColor: "#3B82F6", fallbackEmoji: "🌍" },
  { slug: "home-internet", label: "Home\nInternet", fallbackColor: "#10B981", fallbackEmoji: "🏠" },
];