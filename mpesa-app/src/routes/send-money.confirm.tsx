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
    <div className="phone-shell text-white flex flex-col min-h-screen page-enter">
      <div className="flex items-center px-4 pt-3 pb-2">
        <button
          onClick={() => navigate({ to: "/send-money" })}
          className="w-9 h-9 rounded-full bg-[#1A1A1A] flex items-center justify-center"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="flex-1 text-center font-semibold -ml-9">
          {step === "review" ? "Confirm" : "Enter M-PESA PIN"}
        </h1>
      </div>

      {/* Step 1: Review */}
      {step === "review" && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full" style={{ animation: "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
            <div className="relative ring-card pt-10 pb-5 px-5">
              {/* Avatar */}
              <div
                className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full 
                           flex items-center justify-center text-white font-semibold z-30
                           border-4 border-black"
                style={{ background: getAvatarColor(name) }}
              >
                {getInitials(name)}
              </div>

              <div className="ring-card-inner wave-bg pt-6 pb-3">
                <div className="text-center font-semibold">Send Money</div>
              </div>

              <div className="mt-3 divide-y divide-gray-800">
                <div className="py-3">
                  <div className="text-xs text-gray-400">Send to</div>
                  <div className="font-semibold text-base mt-0.5">{name}</div>
                </div>

                <div className="py-3">
                  <div className="text-xs text-gray-400">Amount</div>
                  <div className="font-semibold text-base mt-0.5">Ksh {formatKsh(amount)}</div>
                </div>

                {/* Transaction Cost */}
                <div className="py-3">
                  <div className="text-xs text-gray-400">Transaction cost</div>
                  <div className="font-semibold text-base mt-0.5 text-[#00C853]">
                    {displayFee()}
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
            <p className="text-sm text-gray-400 mt-1">to authorize this transaction</p>
          </div>

          {/* PIN Dots */}
          <div className="flex gap-3 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                  i < pin.length ? "border-[#00C853]" : "border-gray-700"
                }`}
              >
                {i < pin.length && (
                  <span className="w-3 h-3 rounded-full bg-[#00C853]" />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm mb-6 text-center px-4">{error}</p>}
        </div>
      )}

      {/* Bottom Section */}
      <div className="px-4 pb-8 mt-auto">
        {step === "review" ? (
          <button
            onClick={() => setStep("pin")}
            className="solid-green w-full py-4 text-base font-semibold"
          >
            Continue to PIN
          </button>
        ) : (
          /* PIN Keypad */
          <div className="grid grid-cols-3 gap-y-4">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
              <button
                key={k}
                className="keypad-key text-[34px]"
                onClick={() => handlePinPress(k)}
              >
                {k}
              </button>
            ))}

            <button className="keypad-key" onClick={() => handlePinPress("del")}>
              <span className="w-12 h-9 rounded-lg border-2 border-[#00C853] flex items-center justify-center">
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