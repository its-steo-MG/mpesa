import { useEffect } from "react";
import { setupMpesaPush, startNotificationPolling } from "@/lib/push";
import { getToken } from "@/lib/mpesa-api";

/**
 * Enable push + live notification polling when the user is logged in.
 * Mount once on the home shell (or root after auth).
 */
export function useMpesaPush(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    if (!getToken()) return;

    let stopPoll: (() => void) | undefined;

    (async () => {
      try {
        await setupMpesaPush();
      } catch (e) {
        console.warn("[useMpesaPush] setup failed", e);
      }
      stopPoll = startNotificationPolling(12_000);
    })();

    return () => {
      stopPoll?.();
    };
  }, [enabled]);
}
