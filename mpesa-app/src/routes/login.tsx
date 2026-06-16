import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Delete, Fingerprint, Edit2 } from "lucide-react";
import userAvatar from "@/assets/user-avatar.jpg";
import { ensureSeed, getProfile, isAuthed, setAuthed } from "@/lib/mpesa-store";
import { apiLogin, apiProfile, hasBackend } from "@/lib/mpesa-api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "My OneApp" }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("M-PESA User");
  const [phone, setPhone] = useState("0118951544");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      ensureSeed();

      if (isAuthed()) {
        navigate({ to: "/" });
        return;
      }

      try {
        const localProfile = getProfile();
        if (localProfile?.real_name) setName(localProfile.real_name);
        if (localProfile?.phone_number) setPhone(localProfile.phone_number);
      } catch (e) {
        console.warn("Local profile load failed", e);
      }

      setLoading(false);
    };

    init();
  }, [navigate]);

  const press = (k: string) => {
    if (submitting || loading) return;

    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }

    if (pin.length >= 4) return;

    const newPin = pin + k;
    setPin(newPin);
    setError("");

    if (newPin.length === 4) {
      setSubmitting(true);

      (async () => {
        try {
          await apiLogin(phone.replace(/\D/g, ""), newPin);

          try {
            const prof = await apiProfile();
            if (prof?.real_name) setName(prof.real_name);
          } catch (e) {
            console.warn("Profile refresh after login failed", e);
          }

          setAuthed(true);
          setTimeout(() => navigate({ to: "/" }), 400);
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: string } } };
          const errorMsg = e?.response?.data?.error || "Invalid PIN. Please try again.";
          setError(errorMsg);
          setPin("");
          setSubmitting(false);
        }
      })();
    }
  };

// ==================== CLEAR LIQUID GLASS LOADING (WHITE SPINNER + TEXT) ====================
if (loading) {
  return (
    <div className="phone-shell bg-white flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        {/* Clear Liquid Glass Card */}
        <div className="w-28 h-28 bg-white/25 backdrop-blur-3xl border border-white/50 rounded-3xl flex flex-col items-center justify-center mb-5 shadow-2xl">
          <div className="flex flex-col items-center justify-center">
            {/* White Spinner */}
            <div className="w-9 h-9 border-4 border-white/40 border-t-white rounded-full animate-spin mb-3" />
            
            {/* White Loading Text */}
            <p className="text-sm text-white font-medium tracking-wide">Loading...</p>
          </div>
        </div>

        {/* Safaricom M-PESA Logo */}
        <img 
          src="/safaricom-mpesa-logo.png" 
          alt="Safaricom M-PESA" 
          className="h-42 object-contain mt-2"
        />
      </div>
    </div>
  );
}
// ============================================================
  return (
    <div className="phone-shell text-white flex flex-col page-enter">
      <div className="text-center pt-6 pb-4 text-base">Enter your M-PESA PIN</div>

      <div className="flex-1 flex flex-col items-center px-6 pt-4">
        <img
          src={userAvatar}
          alt="Profile"
          loading="lazy"
          className="w-20 h-20 rounded-full object-cover border-4 border-green-600"
        />

        <div className="mt-3 font-semibold text-lg text-center">{name}</div>

        {/* Editable Phone Number */}
        <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
          <span className="font-semibold">Phone Number</span>

          {isEditingPhone ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="bg-transparent border-b border-gray-500 focus:border-[#00C853] outline-none text-center min-w-[150px] font-mono"
              autoFocus
              maxLength={15}
            />
          ) : (
            <span className="font-mono">{phone}</span>
          )}

          <button
            onClick={() => setIsEditingPhone(!isEditingPhone)}
            className="text-[#00C853] hover:text-green-400 p-1 transition-colors"
          >
            <Edit2 size={16} />
          </button>
        </div>

        <div className="flex gap-3 mt-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 ${
                i < pin.length ? "border-[#00C853]" : "border-gray-700"
              }`}
            >
              {i < pin.length && (
                <span
                  className="w-3 h-3 rounded-full bg-[#00C853]"
                  style={{ animation: "pin-fill 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
                />
              )}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-6 text-center px-4">{error}</p>
        )}
      </div>

      <div className="px-6 pb-8">
        <div className="grid grid-cols-3 gap-y-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <button
              key={k}
              className="keypad-key text-[34px]"
              onClick={() => press(k)}
            >
              {k}
            </button>
          ))}

          <button
            className="keypad-key flex items-center justify-center"
            onClick={() => alert("Biometric login coming soon")}
          >
            <Fingerprint size={28} className="text-[#00C853]" />
          </button>

          <button
            className="keypad-key text-[34px]"
            onClick={() => press("0")}
          >
            0
          </button>

          <button
            className="keypad-key flex items-center justify-center"
            onClick={() => press("del")}
          >
            <span className="w-12 h-9 rounded-lg border-2 border-[#00C853] flex items-center justify-center">
              <Delete size={18} className="text-red-500" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}