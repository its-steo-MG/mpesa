"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Fingerprint } from "lucide-react";

// Main page component with Suspense wrapper
export default function MpesaLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

// Inner content component that uses client hooks safely
function LoginContent() {
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams(); // now safe inside Suspense + client component

  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    photo: "",
  });

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem("mpesa_access_token");

      if (token) {
        try {
          await fetchProfile(token);
        } catch {}
        router.replace("/");
        return;
      }

      const stored = localStorage.getItem("mpesa_user_profile");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserData({
            name: parsed.name || "",
            phone: parsed.phone || "",
            photo: parsed.photo || "",
          });
        } catch {
          localStorage.removeItem("mpesa_user_profile");
        }
      }

      const queryPhone = searchParams.get("phone");
      if (queryPhone) {
        const clean = queryPhone.replace(/\D/g, "");
        setPhone(clean);
      }

      setLoading(false);
    };

    initialize();
  }, [searchParams, router]);

  useEffect(() => {
    if (pin.length === 4 && !isLoggingIn && phone && !loading) {
      handleLogin();
    }
  }, [pin, isLoggingIn, phone, loading]);

  const addDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
      setError("");
      if ("vibrate" in navigator) navigator.vibrate(15);
    }
  };

  const deleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError("");

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/login/`, {
        phone_number: phone.replace(/\D/g, ""),
        pin,
      });

      const { access } = res.data;
      localStorage.setItem("mpesa_access_token", access);

      await fetchProfile(access);

      // Small delay to let user see the real name & photo
      await new Promise((r) => setTimeout(r, 900));

      router.push("/");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Wrong PIN or phone number. Try again.";
      setError(msg);
      setPin("");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const p = res.data;

      const profile = {
        name: p.real_name?.trim() || "User",
        phone: p.phone_number || phone || "",
        photo: p.profile_photo || "",
      };

      localStorage.setItem("mpesa_user_profile", JSON.stringify(profile));
      setUserData(profile);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  };

  // Generate initials (S, SC, AK, etc.)
  const getInitials = (fullName: string): string => {
    if (!fullName?.trim()) return "?";
    const names = fullName.trim().split(/\s+/).filter(Boolean);
    if (names.length === 0) return "?";
    if (names.length === 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[1][0]).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 relative overflow-hidden">
      <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-lg flex-1 justify-center py-12 sm:py-16">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden mx-auto mb-4 border-4 border-green-600/80 shadow-xl shadow-green-900/30 flex items-center justify-center bg-gray-800 relative">
            {userData.photo ? (
              <img
                src={userData.photo}
                alt={userData.name || "Profile"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-4xl sm:text-5xl md:text-6xl font-bold text-white absolute inset-0 flex items-center justify-center">${getInitials(userData.name)}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
                {getInitials(userData.name)}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 tracking-tight">
            {userData.name || "M-PESA"}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-400 font-medium">
            {phone || "Enter your number"}
          </p>
        </div>

        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 tracking-wider uppercase text-gray-300">
          Enter M-Pesa PIN
        </p>

        <div className="flex gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 transition-all duration-200 ${
                pin.length > i
                  ? "bg-green-500 border-green-500 scale-110 shadow-lg shadow-green-600/40"
                  : "border-gray-600"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm sm:text-base mb-6 sm:mb-8 px-4 text-center max-w-xs">
            {error}
          </p>
        )}

        {/* Keypad – 0 centered bottom, fingerprint bottom right */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full max-w-[320px] sm:max-w-[380px] md:max-w-[440px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => addDigit(num.toString())}
              disabled={isLoggingIn}
              className="aspect-square rounded-full bg-gray-900/40 hover:bg-gray-800/60 active:bg-gray-700/80 transition-all duration-150 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-medium touch-manipulation"
            >
              {num}
            </button>
          ))}

          {/* Bottom row: spacer (left) – 0 (center) – fingerprint (right) */}
          <div /> {/* empty left cell */}

          <button
            onClick={() => addDigit("0")}
            disabled={isLoggingIn}
            className="aspect-square rounded-full bg-gray-900/40 hover:bg-gray-800/60 active:bg-gray-700/80 transition-all duration-150 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-medium touch-manipulation"
          >
            0
          </button>

          <button
            onClick={deleteDigit}
            disabled={isLoggingIn || pin.length === 0}
            className="aspect-square rounded-full bg-gray-900/40 hover:bg-gray-800/60 active:bg-gray-700/80 transition-all duration-150 flex items-center justify-center touch-manipulation"
          >
            <Fingerprint className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
          </button>
        </div>
      </div>

      {isLoggingIn && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <div className="animate-spin rounded-full h-14 w-14 sm:h-16 sm:w-16 border-t-4 border-b-4 border-green-500"></div>
        </div>
      )}
    </div>
  );
}