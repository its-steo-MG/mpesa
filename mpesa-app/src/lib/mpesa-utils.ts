export function generateFakeMpesaReceipt(transaction: { created_at?: string; reference?: string; id?: number | string } = {}): string {
  const createdDate = transaction.created_at ? new Date(transaction.created_at) : new Date();
  const yearOffset = createdDate.getFullYear() - 2005;
  const yearChar = yearOffset >= 1 && yearOffset <= 26 ? String.fromCharCode(64 + yearOffset) : "Z";
  const monthChar = String.fromCharCode(64 + createdDate.getMonth() + 1);
  const dayNum = createdDate.getDate();
  const dayChar = dayNum <= 9 ? String(dayNum) : String.fromCharCode(64 + dayNum - 9);
  const datePrefix = yearChar + monthChar + dayChar;
  const seed = transaction.reference || transaction.id?.toString() || "default";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let suffix = "";
  for (let i = 0; i < 7; i++) { hash = (hash * 31 + i) >>> 0; suffix += chars[hash % chars.length]; }
  return datePrefix + suffix;
}

export function getInitials(fullName = ""): string {
  if (!fullName?.trim()) return "MP";
  const names = fullName.trim().split(/\s+/).filter(Boolean);
  if (names.length === 1) return names[0][0].toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
}

export function getAvatarColor(name: string): string {
  const firstLetter = (name?.trim().charAt(0) || "M").toUpperCase();
  const colors: Record<string, string> = {
    A: "#3B82F6", B: "#3B82F6", C: "#06B6D4", D: "#0EA5E9",
    E: "#3B82F6", F: "#3B82F6", G: "#6366F1", H: "#A855F7",
    I: "#D946EF", J: "#10B981", K: "#06B6D4", L: "#F97316",
    M: "#10B981", N: "#EAB308", O: "#84CC16", P: "#22C55E",
    Q: "#10B981", R: "#14B8A6", S: "#8B5CF6", T: "#A855F7",
    U: "#3B82F6", V: "#6366F1", W: "#8B5CF6", X: "#A855F7",
    Y: "#D946EF", Z: "#EC4899",
  };
  return colors[firstLetter] || "#10B981";
}

export function getAvatarBg(name: string): string {
  // Soft tinted bg like screenshots (semi-transparent variant)
  const color = getAvatarColor(name);
  return `${color}33`; // 20% opacity
}

export function formatKsh(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0.00";
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  if (digits.startsWith("254")) {
    return digits.slice(0, 6) + "***" + digits.slice(-3);
  }
  return digits.slice(0, 4) + "***" + digits.slice(-3);
}
