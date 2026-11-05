import { useEffect } from "react";
import { useNotificationPopup } from "./NotificationProvider";

/**
 * Listens for the custom "mpesa-new-notification" event
 * (dispatched by startNotificationPolling in lib/push.ts)
 * and feeds it into the in-app popup system.
 */
export function NotificationWatcher() {
  const { popNotification } = useNotificationPopup();

  useEffect(() => {
    const handler = (e: Event) => {
      const notif = (e as CustomEvent).detail;
      if (notif?.id) {
        popNotification(notif);
      }
    };

    window.addEventListener("mpesa-new-notification", handler);
    return () => window.removeEventListener("mpesa-new-notification", handler);
  }, [popNotification]);

  return null;
}
