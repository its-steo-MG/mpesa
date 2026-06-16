"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
  type ReactNode,
  useEffect,
} from "react";
import CallerPopup from "./CallerPopup";
import {
  installSoundUnlock,
  playNotificationSound,
} from "@/lib/notification-sound";

export interface MpesaNotification {
  id: number;
  caller_id?: string;
  message: string;
  created_at?: string;
}

type Ctx = {
  popNotification: (n: MpesaNotification) => void;
  clearAllNotifications: () => void;
};

const NotificationCtx = createContext<Ctx>({
  popNotification: () => {},
  clearAllNotifications: () => {},
});

export const useNotificationPopup = () => useContext(NotificationCtx);

const MAX_NOTIFICATIONS = 2;

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [queue, setQueue] = useState<MpesaNotification[]>([]);
  const shownIds = useRef(new Set<number>());

  useEffect(() => {
    installSoundUnlock();
  }, []);

  const popNotification = useCallback((notification: MpesaNotification) => {
    // === DEDUPLICATION ===
    if (shownIds.current.has(notification.id)) {
      console.log("⏭️ Duplicate notification blocked:", notification.id);
      return;
    }
    shownIds.current.add(notification.id);

    // Optional: allow the same ID to show again after 60 seconds (safety)
    setTimeout(() => {
      shownIds.current.delete(notification.id);
    }, 60000);
    // =====================

    setQueue((prev) => {
      const newQueue = [...prev, notification];
      if (newQueue.length > MAX_NOTIFICATIONS) {
        return newQueue.slice(1);
      }
      return newQueue;
    });

    void playNotificationSound();

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate?.([60, 30, 60]);
    }
  }, []);

  const clearAllNotifications = useCallback(() => {
    setQueue([]);
    shownIds.current.clear(); // also clear the dedupe set
  }, []);

  const dismiss = useCallback((id: number) => {
    setQueue((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationCtx.Provider value={{ popNotification, clearAllNotifications }}>
      {children}

      <div className="fixed top-0 inset-x-0 z-[9999] flex flex-col items-center pointer-events-none">
        {queue.map((notif) => (
          <CallerPopup 
            key={notif.id} 
            notif={notif} 
            onDone={() => dismiss(notif.id)} 
          />
        ))}
      </div>
    </NotificationCtx.Provider>
  );
}