import { useEffect, useRef, useState } from "react";
import { MpesaNotification } from "./NotificationProvider";

export default function CallerPopup({
  notif,
  onDone,
}: {
  notif: MpesaNotification;
  onDone: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss (longer time for long backend messages)
  useEffect(() => {
    if (expanded) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }
    timerRef.current = setTimeout(onDone, 8000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [expanded, onDone]);

  return (
    <div
      className="caller-pop pointer-events-auto mt-[max(env(safe-area-inset-top),12px)] mx-3 w-[min(92vw,380px)]"
      style={{
        animation: "iosSlideIn 0.45s cubic-bezier(0.32, 0.72, 0, 1) forwards",
        boxShadow: "0 20px 40px -10px rgb(0 0 0 / 0.35), 0 8px 15px -6px rgb(0 0 0 / 0.25)",
      }}
      role="alert"
      aria-live="assertive"
    >
      <div
        className="ios-notification-card transition-all active:scale-[0.99]"
        style={{
          background: "rgba(28, 28, 30, 0.78)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          borderRadius: "22px",
          overflow: "hidden",
          boxShadow: "0 8px 32px -8px rgb(0 0 0 / 0.35), inset 0 1px 0 rgba(255,255,255,0.22)",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-3.5 pb-2">
          <div className="relative h-11 w-11 flex-shrink-0">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#5b7fb9] to-[#3a5a8c] flex items-center justify-center ring-1 ring-white/10 overflow-hidden avatar">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-white/90"
                fill="currentColor"
              >
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
              </svg>
            </div>
            <img
              src="/icon-192.png"
              alt="Messages"
              width={20}
              height={20}
              loading="lazy"
              className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-[6px] object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="text-title truncate font-semibold text-[17px] text-white">
                {notif.caller_id || "MPESA"}
              </div>
              <div className="text-time ml-auto text-[13px] text-white/70">now</div>
            </div>
          </div>
        </div>

        {/* Message body - Scrollable for long backend messages */}
        <div className="px-4 pb-3 max-h-[220px] overflow-y-auto">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="block w-full text-left"
            aria-expanded={expanded}
          >
            <div
              className={`text-[15px] leading-[1.45] text-white/95 ${expanded ? "" : "line-clamp-4"}`}
              dangerouslySetInnerHTML={{ __html: notif.message }}
            />

            <div className="mt-2 flex items-center gap-1 text-[12px] font-medium text-white/50">
              <span>{expanded ? "Tap to collapse" : "Tap to expand"}</span>
              <svg
                viewBox="0 0 24 24"
                className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </button>
        </div>

        {/* Dismiss button when expanded */}
        {expanded && (
          <div className="px-4 pb-3 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={onDone}
              className="w-full rounded-full bg-white/10 py-2 text-[13px] font-semibold text-white/85 active:bg-white/15 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Bottom indicator */}
        <div className="h-1 w-9 bg-white/30 rounded-full mx-auto mb-2.5" />
      </div>
    </div>
  );
}