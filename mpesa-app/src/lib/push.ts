/**
 * M-Pesa OneApp — Web Push registration + foreground notifications.
 *
 * - Registers service worker (public/sw.js)
 * - Subscribes with VAPID public key from backend
 * - Posts subscription to the M-Pesa endpoint (NOT Binance)
 */

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "");
const PUSH_PUBLIC_KEY =
  (import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY as string | undefined) ||
  (import.meta.env.VITE_BINANCE_WEB_PUSH_PUBLIC_KEY as string | undefined) ||
  "";

// IMPORTANT: must point at the M-Pesa endpoint, never Binance
const PUSH_SUBSCRIBE_PATH =
  (import.meta.env.VITE_PUSH_SUBSCRIBE_PATH as string | undefined) ||
  "/mpesa/push/subscription/";

const NOTIF_PATH =
  (import.meta.env.VITE_MPESA_NOTIF_PATH as string | undefined) ||
  "/mpesa-notif/notifications/";

const TOKEN_KEY = "mpesa_access_token";
const SEEN_KEY = "mpesa_seen_notif_ids";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;
    return reg;
  } catch (e) {
    console.warn("[mpesa-push] SW register failed", e);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

/** Register for Web Push and send subscription to the M-Pesa backend endpoint. */
export async function subscribeWebPush(): Promise<boolean> {
  if (!API_URL || !PUSH_PUBLIC_KEY) {
    console.info("[mpesa-push] Skipping web push subscribe (no API_URL or VAPID public key)");
    return false;
  }
  const perm = await requestNotificationPermission();
  if (perm !== "granted") return false;

  const reg = await registerServiceWorker();
  if (!reg?.pushManager) return false;

  try {
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUSH_PUBLIC_KEY),
      });
    }

    const json = sub.toJSON();
    const token = getToken();
    const res = await fetch(`${API_URL}${PUSH_SUBSCRIBE_PATH}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: {
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        },
      }),
    });

    if (!res.ok) {
      console.warn("[mpesa-push] Subscribe API failed", res.status);
      return false;
    }
    console.info("[mpesa-push] Subscription registered on M-Pesa origin");
    return true;
  } catch (e) {
    console.warn("[mpesa-push] Subscribe error", e);
    return false;
  }
}

export function showLocalNotification(title: string, body: string, tag?: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, {
          body,
          icon: "/mpesa-icon-192.png",
          tag: tag || "mpesa-local",
          renotify: true,
        });
      });
    } else {
      new Notification(title, { body, tag: tag || "mpesa-local" });
    }
  } catch (e) {
    console.warn("[mpesa-push] showLocalNotification failed", e);
  }
}

function loadSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<number>) {
  const arr = Array.from(ids).slice(-200);
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
}

export type MpesaNotif = {
  id: number;
  message: string;
  caller_id?: string;
  notification_type?: string;
  is_read?: boolean;
  created_at?: string;
  mpesa_id?: string;
};

export function startNotificationPolling(intervalMs = 15000): () => void {
  if (typeof window === "undefined" || !API_URL) return () => {};

  let stopped = false;
  const seen = loadSeenIds();
  let firstRun = true;

  const tick = async () => {
    if (stopped) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}${NOTIF_PATH}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) return;
      const list = (await res.json()) as MpesaNotif[];
      if (!Array.isArray(list)) return;

      for (const n of list) {
        if (seen.has(n.id)) continue;
        seen.add(n.id);
        if (!firstRun && !n.is_read) {
          const title = n.caller_id || "MPESA";
          const body = n.message || "You have a new message";
          showLocalNotification(title, body, String(n.id));
          window.dispatchEvent(
            new CustomEvent("mpesa-new-notification", { detail: n })
          );
        }
      }
      firstRun = false;
      saveSeenIds(seen);
    } catch {
      /* ignore network errors */
    }
  };

  tick();
  const id = window.setInterval(tick, intervalMs);
  return () => {
    stopped = true;
    window.clearInterval(id);
  };
}

export async function setupMpesaPush() {
  await requestNotificationPermission();
  await registerServiceWorker();
  await subscribeWebPush();
}
