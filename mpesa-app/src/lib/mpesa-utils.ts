// lib/mpesa-utils.ts  ← For M-Pesa Simulator frontend

export function generateFakeMpesaReceipt(transaction: any): string {
  if (!transaction?.created_at) return "MPESA-UNKNOWN";

  const createdDate = new Date(transaction.created_at);

  // Year letter
  const yearOffset = createdDate.getFullYear() - 2005;
  const yearChar =
    yearOffset >= 1 && yearOffset <= 26
      ? String.fromCharCode(64 + yearOffset)
      : "Z";

  // Month letter (This matches your Wallet modal exactly)
  const monthChar = String.fromCharCode(64 + createdDate.getMonth() + 1);

  // Day character (This matches your Wallet modal exactly)
  const dayNum = createdDate.getDate();
  let dayChar: string;
  if (dayNum >= 1 && dayNum <= 9) {
    dayChar = dayNum.toString();
  } else if (dayNum >= 10 && dayNum <= 31) {
    dayChar = String.fromCharCode(64 + dayNum - 9);
  } else {
    dayChar = "A";
  }

  const datePrefix = yearChar + monthChar + dayChar;

  // Seed: prefer reference or reference_id
  const seed = transaction.reference || transaction.reference_id || 
               transaction.id?.toString() || "default";

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 7; i++) {
    hash = (hash * 31 + i) >>> 0;
    suffix += chars[hash % chars.length];
  }

  return datePrefix + suffix;
}