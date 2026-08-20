import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Delete, Fingerprint, Edit2, ScanFace, ShieldCheck, X } from "lucide-react";
import { AppSplash } from "@/components/AppSplash";

import { ensureSeed, getProfile, isAuthed, setAuthed } from "@/lib/mpesa-store";
import { getInitials, getAvatarColor } from "@/lib/mpesa-utils";
import { apiBiometricLogin, apiLogin, apiProfile, apiRegisterBiometric } from "@/lib/mpesa-api";
import {
  disableBiometric,
  enableBiometric,
  isBiometricAvailable,
  isBiometricEnabled,
  verifyBiometric,
} from "@/lib/biometric";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in | My OneApp" },
      { name: "description", content: "Enter your M-PESA PIN or use Face ID to sign in to My OneApp." },
      { property: "og:title", content: "Sign in | My OneApp" },
      { property: "og:description", content: "Enter your M-PESA PIN or use Face ID to sign in." },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [name, setName] = useState("M-PESA User");
  const [phone, setPhone] = useState("0118951544");
  const [photo, setPhoto] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // biometrics
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnrolled, setBioEnrolled] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [askEnroll, setAskEnroll] = useState<{ phone: string; pin: string } | null>(null);

  const maskedPhone = (() => {
    const d = phone.replace(/\D/g, "");
    if (d.length < 7) return phone;
    return `${d.slice(0, 2)}${"*".repeat(Math.max(d.length - 5, 3))}${d.slice(-3)}`;
  })();

  const finishLogin = useCallback(async () => {
    try {
      const prof = await apiProfile();
      if (prof?.real_name) setName(prof.real_name);
    } catch {
      /* keep local profile */
    }
    setAuthed(true);
    setTimeout(() => navigate({ to: "/" }), 350);
  }, [navigate]);

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
        if (localProfile?.profile_photo) setPhoto(localProfile.profile_photo);
      } catch (e) {
        console.warn("Local profile load failed", e);
      }

      const available = await isBiometricAvailable();
      setBioAvailable(available);
      const enrolled = isBiometricEnabled();
      setBioEnrolled(enrolled);
      setLoading(false);

      // Auto-prompt Face ID, exactly like the real app
      if (available && enrolled) {
        setTimeout(() => void handleBiometric(true), 450);
      }
    };

    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const handleBiometric = async (silentCancel = false) => {
    if (bioBusy || submitting) return;
    setError("");

    if (!bioAvailable) {
      setError("Face ID is not available on this device.");
      return;
    }
    if (!isBiometricEnabled()) {
      setError("Enter your PIN once to set up Face ID.");
      return;
    }

    setBioBusy(true);
    try {
      const assertion = await verifyBiometric();
      await apiBiometricLogin(assertion);
      await finishLogin();
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string };
      if (e?.name === "NotAllowedError" || e?.name === "AbortError") {
        if (!silentCancel) setError("Face ID cancelled. Enter your PIN instead.");
      } else {
        setError(e?.message || "Face ID failed. Enter your PIN instead.");
        disableBiometric();
        setBioEnrolled(false);
      }
    } finally {
      setBioBusy(false);
    }
  };

  const press = (k: string) => {
    if (submitting || loading || bioBusy) return;

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
      const cleanPhone = phone.replace(/\D/g, "");

      void (async () => {
        try {
          await apiLogin(cleanPhone, newPin);

          if (bioAvailable && !isBiometricEnabled()) {
            setSubmitting(false);
            setAskEnroll({ phone: cleanPhone, pin: newPin });
            return;
          }

          await finishLogin();
        } catch (err: unknown) {
          const e = err as { response?: { data?: { error?: string } } };
          setError(e?.response?.data?.error || "Invalid PIN. Please try again.");
          setPin("");
          setSubmitting(false);
        }
      })();
    }
  };

  const confirmEnroll = async () => {
    if (!askEnroll) return;
    setBioBusy(true);
    try {
      const record = await enableBiometric({ phone: askEnroll.phone, pin: askEnroll.pin, name });
      await apiRegisterBiometric(record.credentialId, record.phone);
      setBioEnrolled(true);
    } catch (err) {
      console.warn("Biometric enrolment failed", err);
    } finally {
      setBioBusy(false);
      setAskEnroll(null);
      await finishLogin();
    }
  };

  const skipEnroll = async () => {
    setAskEnroll(null);
    await finishLogin();
  };

  if (loading) {
    return <AppSplash />;
  }

  return (
    <div className="phone-shell page-enter flex flex-col app-text">
      <h1 className="pt-6 pb-4 text-center text-base font-medium">Enter your M-PESA PIN</h1>

      <div className="flex flex-1 flex-col items-center px-6">
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="h-[86px] w-[86px] rounded-full border app-line border object-cover"
            onError={() => setPhoto(null)}
          />
        ) : (
          <div
            className="flex h-[86px] w-[86px] items-center justify-center rounded-full border app-line border text-2xl font-semibold text-white"
            style={{ background: getAvatarColor(name) }}
          >
            {getInitials(name)}
          </div>
        )}

        <div className="mt-3 text-lg font-semibold">{name}</div>

        <div className="mt-1 flex items-center gap-2 text-sm app-sub">
          {isEditingPhone ? (
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="min-w-[150px] border-b border-current/25 bg-transparent text-center font-mono outline-none focus:border-[#00C853]"
              autoFocus
              maxLength={15}
            />
          ) : (
            <span className="font-mono">{maskedPhone}</span>
          )}
          <button
            onClick={() => setIsEditingPhone((v) => !v)}
            className="p-1 text-[#00C853] transition-colors hover:text-green-400"
            aria-label="Edit phone number"
          >
            <Edit2 size={14} />
          </button>
        </div>

        <div className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-lg bg-[#00C853]/10 px-4 py-3">
          <ShieldCheck size={18} className="shrink-0 text-[#00C853]" />
          <span className="text-[13px] app-text">This app will not use any of your data bundles</span>
        </div>

        <div className="mt-9 flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl border transition-all duration-200 ${
                i < pin.length
                  ? "border-[#00C853]"
                  : i === pin.length
                    ? "border-[#00C853]/70"
                    : "border-current/25"
              }`}
            >
              {i < pin.length ? (
                <span
                  className="h-3.5 w-3.5 rounded-full bg-[#00C853]"
                  style={{ animation: "pin-fill 0.18s cubic-bezier(0.34,1.56,0.64,1)" }}
                />
              ) : i === pin.length ? (
                <span className="h-6 w-px animate-pulse bg-[#00C853]" />
              ) : null}
            </div>
          ))}
        </div>

        {bioBusy && (
          <div className="mt-6 flex items-center gap-2 text-sm app-sub">
            <ScanFace size={18} className="text-[#00C853]" />
            Verifying Face ID...
          </div>
        )}

        {error && <p className="mt-5 px-4 text-center text-sm text-red-400">{error}</p>}
      </div>

      <div className="px-8 pb-10">
        <div className="grid grid-cols-3 gap-y-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
            <button key={k} className="keypad-key text-[34px]" onClick={() => press(k)}>
              {k}
            </button>
          ))}

          <button
            className="keypad-key"
            onClick={() => void handleBiometric()}
            aria-label={bioEnrolled ? "Sign in with Face ID" : "Set up Face ID"}
          >
            <BiometricGlyph active={bioEnrolled} />
          </button>

          <button className="keypad-key text-[34px]" onClick={() => press("0")}>
            0
          </button>

          <button className="keypad-key" onClick={() => press("del")} aria-label="Delete">
            <span className="flex h-8 w-11 items-center justify-center rounded-full border border-[#00C853]">
              <Delete size={15} className="text-[#00C853]" />
            </span>
          </button>
        </div>
      </div>

      {askEnroll && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-6">
          <div className="w-full max-w-[420px] rounded-3xl app-surface p-6 text-center">
            <button
              onClick={() => void skipEnroll()}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400"
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <div className="mx-auto mt-1 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00C853]/12">
              <ScanFace size={32} className="text-[#00C853]" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Sign in with Face ID</h2>
            <p className="mt-2 text-sm app-sub">
              Use Face ID or your fingerprint next time instead of typing your M-PESA PIN.
            </p>
            <button
              onClick={() => void confirmEnroll()}
              disabled={bioBusy}
              className="mt-5 w-full rounded-full bg-[#00C853] py-3 font-semibold text-black disabled:opacity-60"
            >
              {bioBusy ? "Setting up..." : "Enable Face ID"}
            </button>
            <button onClick={() => void skipEnroll()} className="mt-3 w-full py-2 text-sm app-sub">
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BiometricGlyph({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-9 w-9 items-center justify-center">
      <Fingerprint
        size={30}
        strokeWidth={1.6}
        className={active ? "text-[#00C853]" : "text-gray-500"}
      />
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background: active
            ? "radial-gradient(circle at 30% 30%, rgba(236,72,153,0.35), transparent 60%)"
            : "none",
        }}
      />
    </span>
  );
}
