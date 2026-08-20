import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Palette,
  Fingerprint,
  ShieldCheck,
  KeyRound,
  AlertTriangle,
  Activity,
  Repeat,
  LifeBuoy,
  SmartphoneNfc,
  Info,
  Share2,
  Sun,
  Moon,
  Settings2,
  Check,
  LogOut,
  Camera,
} from "lucide-react";

import { ensureSeed, getProfile, setProfile, setAuthed } from "@/lib/mpesa-store";
import { getInitials, getAvatarColor } from "@/lib/mpesa-utils";
import {
  disableBiometric,
  enableBiometric,
  isBiometricAvailable,
  isBiometricEnabled,
} from "@/lib/biometric";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/lib/theme";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings | My OneApp" },
      {
        name: "description",
        content: "Manage your M-PESA profile, appearance, biometric login, security and support settings.",
      },
      { property: "og:title", content: "Profile & Settings | My OneApp" },
      {
        property: "og:description",
        content: "Manage your profile, theme, biometric login and account settings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

const QUICK_CARE = [
  { label: "Security Center", Icon: ShieldCheck },
  { label: "Get Puk", Icon: KeyRound },
  { label: "Report Fraud", Icon: AlertTriangle },
  { label: "Check My Usage", Icon: Activity },
  { label: "My Subscriptions", Icon: Repeat },
  { label: "Get Help", Icon: LifeBuoy },
  { label: "Manage My Line", Icon: SmartphoneNfc },
];

function Tile({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: typeof ShieldCheck;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="app-card flex h-[104px] flex-col justify-between rounded-2xl p-3 text-left active:scale-[0.98] transition"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00C853]/12">
        <Icon size={18} className="text-[#00C853]" />
      </span>
      <span className="app-text text-[13px] leading-tight">{label}</span>
    </button>
  );
}

function ProfilePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("M-PESA User");
  const [phone, setPhone] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    ensureSeed();
    const p = getProfile();
    setName(p.real_name || "M-PESA User");
    setPhone(p.phone_number || "");
    setPhoto(p.profile_photo || null);
    setMode(getThemeMode());
    setBioOn(isBiometricEnabled());
    void isBiometricAvailable().then(setBioAvailable);
  }, []);

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setPhoto(dataUrl);
      setProfile({ profile_photo: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const toggleBio = async () => {
    if (bioOn) {
      disableBiometric();
      setBioOn(false);
      return;
    }
    try {
      await enableBiometric({ phone: phone.replace(/\D/g, ""), pin: "", name });
      setBioOn(true);
    } catch {
      setBioOn(false);
    }
  };

  const chooseTheme = (m: ThemeMode) => {
    setMode(m);
    setThemeMode(m);
  };

  return (
    <div className="phone-shell page-enter pb-16">
      {/* Header */}
      <div className="relative flex items-center px-4 pt-4 pb-2">
        <button
          onClick={() => navigate({ to: "/" })}
          className="app-card flex h-10 w-10 items-center justify-center rounded-full"
          aria-label="Back"
        >
          <ChevronLeft size={20} className="app-text" />
        </button>
        <h1 className="app-text absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold">Profile</h1>
      </div>

      {/* User card */}
      <div className="app-card mx-4 mt-3 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => fileRef.current?.click()} className="relative" aria-label="Change photo">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
            {photo ? (
              <img src={photo} alt={name} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{ background: getAvatarColor(name) }}
              >
                {getInitials(name)}
              </span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00C853]">
              <Camera size={11} className="text-white" />
            </span>
          </button>
          <p className="app-text text-[17px] font-semibold">{name}</p>
        </div>

        <div className="mt-5 grid grid-cols-3 text-center">
          {[
            ["Phone No.", phone || "—"],
            ["Status", "Active"],
            ["Tariff", "Prepaid"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="app-sub text-[12px]">{k}</p>
              <p className="app-text mt-0.5 text-[13px]">{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="app-text mx-4 mt-6 text-[15px] font-semibold">Quick Actions</h2>
      <div className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowTheme(true)}
          className="app-card flex h-[104px] flex-col justify-between rounded-2xl p-3 text-left active:scale-[0.98] transition"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00C853]/12">
            <Palette size={18} className="text-[#00C853]" />
          </span>
          <span className="app-text text-[13px]">Appearance</span>
        </button>

        <div className="app-card flex h-[104px] flex-col justify-between rounded-2xl p-3">
          <div className="flex items-start justify-between">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FF3B30]/12">
              <Fingerprint size={18} className="text-[#FF3B30]" />
            </span>
            <button
              onClick={() => void toggleBio()}
              disabled={!bioAvailable && !bioOn}
              aria-label="Toggle biometric authentication"
              className={`relative h-7 w-12 rounded-full transition ${bioOn ? "bg-[#00C853]" : "bg-black/20 dark:bg-white/15"}`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${bioOn ? "left-6" : "left-1"}`}
              />
            </button>
          </div>
          <span className="app-text text-[13px]">Biometric Authentication</span>
        </div>
      </div>

      {/* Quick Care */}
      <h2 className="app-text mx-4 mt-6 text-[15px] font-semibold">Quick Care</h2>
      <div className="mx-4 mt-3 grid grid-cols-3 gap-3">
        {QUICK_CARE.map((q) => (
          <Tile key={q.label} label={q.label} Icon={q.Icon} />
        ))}
      </div>

      {/* Account and Settings */}
      <h2 className="app-text mx-4 mt-6 text-[15px] font-semibold">Account and Settings</h2>
      <div className="mx-4 mt-3 grid grid-cols-3 gap-3">
        <Tile label="About App" Icon={Info} />
        <Tile label="Recommend A Friend" Icon={Share2} />
        <Tile
          label="Log Out"
          Icon={LogOut}
          onClick={() => {
            setAuthed(false);
            navigate({ to: "/login" });
          }}
        />
      </div>

      {/* Theme sheet */}
      {showTheme && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => setShowTheme(false)}
        >
          <div
            className="app-surface w-full max-w-[480px] rounded-t-3xl pb-8 pt-3"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="mx-auto mb-4 block h-1 w-10 rounded-full bg-current opacity-20" />
            <div className="relative flex items-center px-4">
              <button
                onClick={() => setShowTheme(false)}
                className="app-card flex h-9 w-9 items-center justify-center rounded-full"
                aria-label="Close"
              >
                <ChevronLeft size={18} className="app-text" />
              </button>
              <h3 className="app-text absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold">Theme</h3>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 px-6">
              {(
                [
                  { key: "light", label: "Light Mode", Icon: Sun },
                  { key: "dark", label: "Dark Mode", Icon: Moon },
                  { key: "system", label: "System", Icon: Settings2 },
                ] as const
              ).map(({ key, label, Icon }) => (
                <button key={key} onClick={() => chooseTheme(key)} className="flex flex-col items-center gap-2">
                  <span className="app-card relative flex h-[76px] w-[76px] items-center justify-center rounded-full">
                    <Icon size={26} className={mode === key ? "text-[#00C853]" : "app-text"} />
                    {mode === key && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#00C853]">
                        <Check size={12} className="text-white" />
                      </span>
                    )}
                  </span>
                  <span className="app-text text-[13px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
