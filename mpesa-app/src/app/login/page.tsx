"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Fingerprint, Edit } from "lucide-react";

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

function LoginContent() {
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

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
          setPhone(parsed.phone?.replace(/\D/g, "") || "");
        } catch {
          localStorage.removeItem("mpesa_user_profile");
        }
      }

      const queryPhone = searchParams.get("phone");
      if (queryPhone && !phone) {
        setPhone(queryPhone.replace(/\D/g, ""));
      }

      if (!phone) {
        setIsEditingPhone(true);
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
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 9) {
      setError("Please enter a valid phone number");
      setIsEditingPhone(true);
      return;
    }

    setIsLoggingIn(true);
    setError("");

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/login/`, {
        phone_number: cleanPhone,
        pin,
      });

      const { access } = res.data;
      localStorage.setItem("mpesa_access_token", access);

      await fetchProfile(access);

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
      <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md md:max-w-lg flex-1 justify-center py-10 sm:py-16">
        <div className="text-center mb-8 sm:mb-10 md:mb-12 w-full">
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

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 tracking-tight">
            {userData.name || "M-PESA"}
          </h1>

          {/* Phone – centered, responsive, with visible placeholder */}
          {!isEditingPhone ? (
            <button
              className="mt-1 flex items-center justify-center gap-1.5 mx-auto group cursor-pointer"
              onClick={() => setIsEditingPhone(true)}
            >
              <p className="text-base sm:text-lg text-gray-400 font-medium text-center">
                {phone || "XXXXXXXXX"}
              </p>
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPhone(val);
                setError("");
              }}
              onBlur={() => {
                if (phone.trim()) setIsEditingPhone(false);
              }}
              autoFocus
              placeholder="254XXXXXXX"
              className="mt-1 bg-transparent text-center text-base sm:text-lg text-white outline-none caret-green-500 w-40 sm:w-52 max-w-full placeholder-gray-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              maxLength={12}
            />
          )}
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

          <div />

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