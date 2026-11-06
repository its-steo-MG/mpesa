import { useState } from "react";
import { setupMpesaPush, disableMpesaPush } from "@/lib/push";

export function PushToggle() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const enable = async () => {
    setBusy(true);
    setStatus("");
    try {
      await setupMpesaPush();
      setStatus("Notifications enabled for My OneApp");
    } catch (e) {
      setStatus("Could not enable notifications");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    setStatus("");
    try {
      const ok = await disableMpesaPush();
      setStatus(ok ? "Notifications disabled" : "Could not disable");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border-b">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Phone notifications</span>
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={enable}
            className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            Enable
          </button>
          <button
            disabled={busy}
            onClick={disable}
            className="rounded border px-3 py-1.5 text-xs disabled:opacity-50"
          >
            Disable
          </button>
        </div>
      </div>
      {status && <p className="text-xs text-muted-foreground">{status}</p>}
    </div>
  );
}