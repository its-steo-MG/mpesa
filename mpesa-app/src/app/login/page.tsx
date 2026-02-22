"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function MpesaLoginPage() {
  const [pin, setPin] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Placeholder until fetch after login
  const [userData, setUserData] = useState({
    name: "Loading...",
    phone: "",
    photo: "/placeholder-avatar.jpg",
  });

  useEffect(() => {
    const token = localStorage.getItem("mpesa_access_token");
    if (token) {
      fetchProfile(token);  // Fetch profile if already logged in
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (pin.length === 4 && !loading && phone) {
      handleLogin();
    }
  }, [pin]);

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
    if (pin.length !== 4 || !phone) return;

    setLoading(true);
    setError("");

    try {
      const loginRes = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/login/`, {
        phone_number: phone.replace(/\D/g, ""),
        pin,
      });

      const { access } = loginRes.data;
      localStorage.setItem("mpesa_access_token", access);

      await fetchProfile(access);

      router.push("/");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Wrong PIN or server error. Try again.";
      setError(msg);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const profileRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/mpesa/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const profile = profileRes.data;

      localStorage.setItem("mpesa_user_profile", JSON.stringify({
        name: profile.real_name || "User",
        phone: profile.phone_number || "",
        photo: profile.profile_photo || "/placeholder-avatar.jpg",
      }));

      setUserData({
        name: profile.real_name || "User",
        phone: profile.phone_number || "",
        photo: profile.profile_photo || "/placeholder-avatar.jpg",
      });
    } catch (err) {
      console.error("Profile fetch failed", err);
      setError("Failed to load profile.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6">
      {/* Profile section - uses fetched data or placeholder */}
      <div className="text-center mb-10">
        <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 border-4 border-green-600 shadow-lg">
          <img
            src={userData.photo}
            alt={userData.name}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = "/placeholder-avatar.jpg")}
          />
        </div>
        <h1 className="text-2xl font-bold mb-1">{userData.name}</h1>
        <p className="text-gray-400 text-lg">{userData.phone}</p>
      </div>

      {/* Phone input - new field */}
      <div className="mb-6 w-full max-w-xs">
        <label className="block text-lg mb-2">M-Pesa Phone Number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          placeholder="254xxxxxxxxx"
          maxLength={12}
          className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-green-500 outline-none"
        />
      </div>

      {/* PIN prompt */}
      <p className="text-lg mb-6 tracking-wide">ENTER M-PESA PIN</p>

      {/* PIN display circles */}
      <div className="flex gap-5 mb-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-6 h-6 rounded-full border-2 transition-all duration-150 ${
              pin.length > i
                ? "bg-green-500 border-green-500 scale-110"
                : "border-gray-600"
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 mb-6 text-center">{error}</p>}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-x-14 gap-y-10 text-4xl font-medium">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => addDigit(num.toString())}
            disabled={loading}
            className="w-20 h-20 rounded-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-center"
          >
            {num}
          </button>
        ))}

        <div /> {/* spacer */}

        <button
          onClick={() => addDigit("0")}
          disabled={loading}
          className="w-20 h-20 rounded-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-center"
        >
          0
        </button>

        <button
          onClick={deleteDigit}
          disabled={loading || pin.length === 0}
          className="w-20 h-20 rounded-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 transition-colors flex items-center justify-center text-3xl"
        >
          ←
        </button>
      </div>

      {/* Fingerprint hint */}
      <div className="mt-10 flex flex-col items-center text-gray-500">
        <div className="text-5xl mb-2">✋</div>
        <p className="text-sm">Use fingerprint</p>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
        </div>
      )}
    </div>
  );
}