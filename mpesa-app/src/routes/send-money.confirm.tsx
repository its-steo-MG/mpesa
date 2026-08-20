import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Delete } from "lucide-react";
import { getInitials, getAvatarColor, formatKsh } from "@/lib/mpesa-utils";
import { apiSendMoney } from "@/lib/mpesa-api";
import { z } from "zod";

const search = z.object({
  phone: z.string().default(""),
  amount: z.string().default("0"),
  name: z.string().default("Recipient"),
  fee: z.string().default("0"),
});

export const Route = createFileRoute("/send-money/confirm")({
  validateSearch: search,
  head: () => ({ meta: [{ title: "Confirm Send" }] }),
  component: Confirm,
});

function Confirm() {
  const navigate = useNavigate();
  const { phone, amount, name, fee = "0" } = Route.useSearch();

  const [step, setStep] = useState<"review" | "pin">("review");
  const [pin, setPin] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const feeValue = parseFloat(fee) || 0;
  const amountValue = parseFloat(amount) || 0;

  const handlePinPress = (k: string) => {
    if (sending) return;

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
      handleSend(newPin);
    }
  };

  const handleSend = async (enteredPin: string) => {
    setSending(true);
    setError("");

    try {
      const tx = await apiSendMoney({
        recipient_phone: phone,
        amount: amountValue,
        description: `Send to ${name}`,
        pin: enteredPin,
      });

      sessionStorage.setItem("mpesa_just_sent", JSON.stringify(tx));

      // Notification is now created automatically by the backend signal.
      // No manual fetch or popNotification needed here.

      navigate({
        to: "/send-money/success",
        search: {
          id: String(tx.mpesa_id || tx.id),
          fee: feeValue.toString(),
        },
      });
    } catch (error: any) {
      console.error("Send failed:", error);
      const msg = error.message || "Transaction failed. Please try again.";
      setError(msg);
      setPin("");
    } finally {
      setSending(false);
    }
  };

  const displayFee = () => {
    if (feeValue <= 0) return "N/A";
    return `Ksh ${formatKsh(feeValue.toString())}`;
  };

  return (
    <div className="phone-shell app-text flex flex-col min-h-screen page-enter">
      <div className="flex items-center px-5 pt-4 pb-2">
        <button
          onClick={() => (step === "pin" ? setStep("review") : navigate({ to: "/send-money" }))}
          className="w-10 h-10 rounded-full app-card flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-center font-semibold text-[17px] -ml-10">
          {step === "review" ? "Confirm" : "Enter M-PESA PIN"}
        </h1>
      </div>

      {/* Step 1: Review */}
      {step === "review" && (
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="w-full" style={{ animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="relative">
              {/* Avatar */}
              <div
                className="absolute -top-[34px] left-1/2 -translate-x-1/2 w-[68px] h-[68px] rounded-full
                           flex items-center justify-center font-semibold text-lg z-30 border-4"
                style={{
                  background: `color-mix(in oklab, ${getAvatarColor(name)} 22%, var(--app-surface))`,
                  color: getAvatarColor(name),
                  borderColor: "var(--app-bg)",
                }}
              >
                {getInitials(name)}
              </div>

              <div className="ring-card pt-0">
                <div className="ring-card-inner wave-bg pt-12 pb-5">
                  <div className="text-center font-medium text-[17px]">Send Money</div>
                </div>

                <div className="px-5">
                  <div className="py-4 border-t app-line">
                    <div className="text-[13px] app-sub">Send to</div>
                    <div className="font-semibold text-[17px] mt-1">{name}</div>
                  </div>

                  <div className="py-4 border-t app-line">
                    <div className="text-[13px] app-sub">Amount</div>
                    <div className="font-semibold text-[17px] mt-1">Ksh {formatKsh(amount)}</div>
                  </div>

                  <div className="py-4 border-t app-line">
                    <div className="text-[13px] app-sub">Transaction cost</div>
                    <div className="font-semibold text-[17px] mt-1">{displayFee()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: PIN Entry */}
      {step === "pin" && (
        <div className="flex-1 flex flex-col items-center px-6 pt-8">
          <div className="text-center mb-8">
            <div className="text-lg font-semibold">Enter M-PESA PIN</div>
            <p className="text-sm app-sub mt-1">to authorize this transaction</p>
          </div>

          {/* PIN Dots */}
          <div className="flex gap-3 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  i < pin.length ? "border-[#2ba84a]" : "app-line"
                }`}
              >
                {i < pin.length && <span className="w-3 h-3 rounded-full bg-[#2ba84a]" />}
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-sm mb-6 text-center px-4">{error}</p>}
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-5 pb-8 mt-auto">
        {step === "review" ? (
          <button onClick={() => setStep("pin")} className="solid-green text-base">
            Send
          </button>
        ) : (
          /* PIN Keypad */
          <div className="grid grid-cols-3 gap-y-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <button key={k} className="keypad-key text-[34px]" onClick={() => handlePinPress(k)}>
                {k}
              </button>
            ))}

            <button className="keypad-key" onClick={() => handlePinPress("del")}>
              <span className="w-12 h-9 rounded-lg border-2 border-[#2ba84a] flex items-center justify-center">
                <Delete size={18} className="text-red-500" />
              </span>
            </button>

            <button className="keypad-key text-[34px]" onClick={() => handlePinPress("0")}>
              0
            </button>

            <div className="col-span-1" />
          </div>
        )}
      </div>
    </div>
  );
}