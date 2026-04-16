"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

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

  // Fetch profile with better error handling
  const fetchProfile = async (token: string) => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 8000,
      });

      const p = res.data;

      const profile = {
        name: p.real_name?.trim() || "M-PESA User",
        phone: p.phone_number || phone || "",
        photo: p.profile_photo || "",
      };

      // Save to localStorage for persistence
      localStorage.setItem("mpesa_user_profile", JSON.stringify(profile));
      setUserData(profile);

      return profile;
    } catch (err) {
      console.error("Profile fetch failed:", err);
      // Don't throw - we still want to proceed with login
      return null;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const token = localStorage.getItem("mpesa_access_token");

      if (token) {
        // If already logged in, fetch latest profile and go to home
        await fetchProfile(token);
        router.replace("/");
        return;
      }

      // Load saved profile from localStorage
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

      // Check for phone in URL query params
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

  // Auto-login when PIN reaches 4 digits
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

      // Fetch fresh profile after successful login
      await fetchProfile(access);

      // Small delay for smooth transition
      await new Promise((r) => setTimeout(r, 800));

      router.push("/");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Wrong PIN or phone number. Try again.";
      setError(msg);
      setPin("");
    } finally {
      setIsLoggingIn(false);
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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Subtle M-PESA green glow background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-950/20 via-transparent to-black pointer-events-none" />

      <div className="flex flex-col items-center w-full max-w-[380px] flex-1 justify-center py-12">
        
        {/* Header Text */}
        <div className="text-center mb-8">
          <p className="text-lg font-medium tracking-wider text-white">
            Enter your M-PESA PIN
          </p>
        </div>

        {/* Profile Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-green-600 shadow-2xl shadow-green-900/50 mb-4 bg-gray-900">
            {userData.photo ? (
              <img
                src={userData.photo}
                alt={userData.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center text-5xl font-bold text-white bg-gray-800">
                        ${getInitials(userData.name)}
                      </div>
                    `;
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-white bg-gray-800">
                {getInitials(userData.name)}
              </div>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-white mb-1">
            {userData.name || "M-PESA"}
          </h1>

          {/* Phone Number */}
          {!isEditingPhone ? (
            <button
              onClick={() => setIsEditingPhone(true)}
              className="text-green-400 text-[15px] font-medium flex items-center gap-1 hover:underline"
            >
              {phone ? `0${phone.slice(-9)}` : "XXXXXXXXX"}
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
              placeholder="2547XXXXXXXX"
              className="bg-transparent text-center text-green-400 text-[15px] outline-none caret-green-500 w-40 placeholder-gray-500"
              maxLength={12}
            />
          )}
        </div>

        {/* PIN Boxes */}
        <div className="flex gap-5 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-4xl font-light transition-all duration-200 ${
                pin.length > i
                  ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/50"
                  : "border-gray-400 bg-transparent"
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <p className="text-red-400 text-sm mb-6 text-center px-4">
            {error}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[300px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => addDigit(num.toString())}
              disabled={isLoggingIn}
              className="aspect-square rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#3a3a3c] transition-all text-4xl font-light text-white touch-manipulation"
            >
              {num}
            </button>
          ))}

          <button
            onClick={deleteDigit}
            disabled={isLoggingIn || pin.length === 0}
            className="aspect-square rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#3a3a3c] flex items-center justify-center text-red-500 touch-manipulation"
          >
            <span className="text-4xl font-light">×</span>
          </button>

          <button
            onClick={() => addDigit("0")}
            disabled={isLoggingIn}
            className="aspect-square rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] active:bg-[#3a3a3c] transition-all text-4xl font-light text-white touch-manipulation"
          >
            0
          </button>

          <button
            onClick={deleteDigit}
            disabled={isLoggingIn || pin.length === 0}
            className="aspect-square rounded-full bg-green-600 hover:bg-green-500 active:bg-green-700 flex items-center justify-center text-white touch-manipulation"
          >
            <span className="text-3xl font-medium">✕</span>
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoggingIn && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
        </div>
      )}
    </div>
  );
}