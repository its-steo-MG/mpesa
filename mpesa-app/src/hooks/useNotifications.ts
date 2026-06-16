"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { api, type MpesaNotification } from "@/lib/mpesa-api";

const POLL_MS = 10000; // 10 seconds polling interval

export function useNotifications(onNew?: (n: MpesaNotification) => void) {
  const [items, setItems] = useState<MpesaNotification[]>([]);

  const seen = useRef<Set<number>>(new Set());
  const initialized = useRef(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const fetchOnce = useCallback(async () => {
    try {
      if (!api.hasBackend?.()) return;

      const data: MpesaNotification[] = await api.listMpesaNotifications?.() || [];
      setItems(data);

      if (!initialized.current) {
        // First load - mark everything as seen
        data.forEach((n) => seen.current.add(n.id));
        initialized.current = true;
      } else {
        // Detect new notifications
        for (const n of data) {
          if (!seen.current.has(n.id)) {
            seen.current.add(n.id);
            console.log("🆕 NEW NOTIFICATION:", n);
            onNewRef.current?.(n);
          }
        }
      }
    } catch (e: any) {
      // Only log real errors (ignore 404 if endpoint doesn't exist yet)
      if (e?.response?.status !== 404) {
        console.error("Failed to fetch notifications:", e);
      }
    }
  }, []);

  useEffect(() => {
    fetchOnce();
    const interval = setInterval(fetchOnce, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchOnce]);

  return { items };
}