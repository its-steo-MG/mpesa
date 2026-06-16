// Local-storage-backed mock data store for the M-PESA clone.

export type TxType = "send" | "deposit" | "withdrawal" | "transfer" | "paybill" | "buygoods" | "airtime" | "bundles";

export interface Tx {
  id: number;
  transaction_type: TxType;
  amount: number;
  recipient_name?: string;
  recipient_phone?: string;
  description?: string;
  mpesa_id: string;
  reference?: string;
  created_at: string;
  fee?: number;
  till_number?: string;
  category?: "send" | "buygoods" | "paybill" | "deposit" | "airtime" | "bundles";
}

export interface UserProfile {
  real_name: string;
  phone_number: string;
  profile_photo: string;
  balance?: number;
}

const KEY_TX = "mpesa_transactions_v1";
const KEY_BAL = "mpesa_balance_v1";
const KEY_AIR = "mpesa_airtime_v1";
const KEY_PROFILE = "mpesa_user_profile";
const KEY_AUTH = "mpesa_logged_in_v1";

const DEFAULT_PROFILE: UserProfile = {
  real_name: "Mpesa User",
  phone_number: "254712345678",
  profile_photo: "",
};

const DEFAULT_BALANCE = 2252.76;
const DEFAULT_AIRTIME = 0.01;

function seedTxs(): Tx[] {
  const d13 = (h: number, m: number) => new Date(2026, 5, 13, h, m).toISOString();
  const d12 = (h: number, m: number) => new Date(2026, 5, 12, h, m).toISOString();
  const d11 = (h: number, m: number) => new Date(2026, 5, 11, h, m).toISOString();
  let id = 1000;
  const t = (data: Omit<Tx, "id">): Tx => ({ id: ++id, ...data });
  return [
    t({ transaction_type: "buygoods", category: "buygoods", amount: 300, recipient_name: "Softlife Fastfoods", till_number: "6330813", mpesa_id: "UFD7P82UQ4", created_at: d13(18, 12), reference: "softlife" }),
    t({ transaction_type: "send", category: "send", amount: 200, fee: 7, recipient_name: "Fridah Karimi", recipient_phone: "0790000042", mpesa_id: "UFD7P81QMV", created_at: d13(18, 1), reference: "fk" }),
    t({ transaction_type: "bundles", category: "bundles", amount: 83, recipient_name: "Safaricom Bundles", description: "4093441", mpesa_id: "UFD7P81B83", created_at: d13(17, 51), reference: "sb" }),
    t({ transaction_type: "deposit", category: "deposit", amount: 300, recipient_name: "Stephen Samuel", recipient_phone: "254701000540", mpesa_id: "UFDR97B50Z", created_at: d13(17, 42), reference: "ss-in" }),
    t({ transaction_type: "buygoods", category: "buygoods", amount: 900, recipient_name: "Sashitrendy Technologies", till_number: "5515738", mpesa_id: "UFD7P8149M", created_at: d13(16, 21), reference: "sashi1" }),
    t({ transaction_type: "send", category: "send", amount: 500, fee: 12, recipient_name: "Alice Gathiru", recipient_phone: "254794000854", mpesa_id: "UFD7P80AG5", created_at: d13(13, 10), reference: "ag" }),
    t({ transaction_type: "paybill", category: "paybill", amount: 300, recipient_name: "Kplc Prepaid", description: "888880", mpesa_id: "UFC8P9KPLC", created_at: d12(22, 47), reference: "kplc" }),
    t({ transaction_type: "deposit", category: "deposit", amount: 1250, recipient_name: "Sashitrendy Technologies", till_number: "5515738", description: "Merchant Customer Payment", mpesa_id: "UFC7P7YBGH", created_at: d12(20, 31), reference: "sashi2" }),
    t({ transaction_type: "send", category: "send", amount: 1500, fee: 25, recipient_name: "John Chama", recipient_phone: "254711000774", mpesa_id: "UFC7P78JC1", created_at: d12(21, 49), reference: "jc" }),
    t({ transaction_type: "paybill", category: "paybill", amount: 2787.08, recipient_name: "M-Pesa Globalpay", description: "Global payment", mpesa_id: "UFC7P7MPG2", created_at: d12(15, 5), reference: "mpg" }),
    t({ transaction_type: "buygoods", category: "buygoods", amount: 450, recipient_name: "Naivas Supermarket", till_number: "400200", mpesa_id: "UFB6P6N450", created_at: d11(19, 30), reference: "naivas" }),
    t({ transaction_type: "airtime", category: "airtime", amount: 100, description: "Airtime top-up", mpesa_id: "UFB6P6AIR1", created_at: d11(11, 15), reference: "air1" }),
  ];
}

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, val: unknown) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

export function ensureSeed() {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEY_TX)) safeSet(KEY_TX, seedTxs());
  if (!localStorage.getItem(KEY_BAL)) safeSet(KEY_BAL, DEFAULT_BALANCE);
  if (!localStorage.getItem(KEY_AIR)) safeSet(KEY_AIR, DEFAULT_AIRTIME);
  if (!localStorage.getItem(KEY_PROFILE)) safeSet(KEY_PROFILE, DEFAULT_PROFILE);
}

export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY_AUTH) === "1";
}
export function setAuthed(v: boolean) {
  if (typeof window === "undefined") return;
  if (v) localStorage.setItem(KEY_AUTH, "1");
  else localStorage.removeItem(KEY_AUTH);
}

export function getProfile(): UserProfile {
  ensureSeed();
  return safeGet<UserProfile>(KEY_PROFILE, DEFAULT_PROFILE);
}
export function setProfile(p: Partial<UserProfile>) {
  const cur = getProfile();
  safeSet(KEY_PROFILE, { ...cur, ...p });
}

export function getBalance(): number { ensureSeed(); return safeGet<number>(KEY_BAL, DEFAULT_BALANCE); }
export function getAirtime(): number { ensureSeed(); return safeGet<number>(KEY_AIR, DEFAULT_AIRTIME); }

export function getTxs(): Tx[] {
  ensureSeed();
  const txs = safeGet<Tx[]>(KEY_TX, []);
  return [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getTx(id: number | string): Tx | undefined {
  const txs = getTxs();
  return txs.find(t => 
    String(t.id) === String(id) || 
    t.mpesa_id === String(id)
  );
}

// ====================== FIXED SAVE TX ======================
export function saveTx(txInput: any): Tx {
  ensureSeed();
  const txs = safeGet<Tx[]>(KEY_TX, []);

  const newTx: Tx = {
    id: Number(txInput.id || Date.now()),
    transaction_type: (txInput.transaction_type as TxType) || "send",
    category: txInput.category || "send",
    amount: Number(txInput.amount),
    fee: Number(txInput.fee ?? 0),
    recipient_name: txInput.recipient_name,
    recipient_phone: txInput.recipient_phone,
    mpesa_id: txInput.mpesa_id || generateMpesaId(),
    created_at: txInput.created_at || new Date().toISOString(),
    reference: txInput.reference || String(Date.now()),
  };

  console.log("💾 Transaction saved successfully:", newTx);

  // Check for duplicates
  if (txs.some(t => t.mpesa_id === newTx.mpesa_id || String(t.id) === String(newTx.id))) {
    console.log("⚠️ Duplicate transaction found");
    return txs.find(t => t.mpesa_id === newTx.mpesa_id || String(t.id) === String(newTx.id))!;
  }

  const updatedTxs = [newTx, ...txs];
  safeSet(KEY_TX, updatedTxs);

  // Update balance for outgoing transactions
  if (newTx.transaction_type === "send" || newTx.transaction_type === "withdrawal") {
    const currentBal = getBalance();
    const newBal = Math.max(0, currentBal - newTx.amount - (newTx.fee || 0));
    safeSet(KEY_BAL, newBal);
  }

  return newTx;
}

// ==================== REST OF FILE ====================
const DIRECTORY: Record<string, string> = {
  "0797341831": "Sospeter Samuel",
  "0794277854": "Alice Gathiru",
  "0790000042": "Fridah Karimi",
  "254701000540": "Stephen Samuel",
  "254711000774": "John Chama",
  "0712345678": "Mary Wanjiku",
  "0722111222": "James Mwangi",
  "0733444555": "Grace Achieng",
};

export function lookupRecipient(phone: string): string | null {
  const clean = phone.replace(/\D/g, "");
  if (DIRECTORY[clean]) return DIRECTORY[clean];
  if (clean.startsWith("254") && DIRECTORY["0" + clean.slice(3)]) return DIRECTORY["0" + clean.slice(3)];
  if (clean.startsWith("0") && DIRECTORY["254" + clean.slice(1)]) return DIRECTORY["254" + clean.slice(1)];
  if (clean.length >= 10) return "M-PESA User";
  return null;
}

export function sendMoney(args: { phone_number: string; amount: number; recipient_name: string; }): Tx {
  ensureSeed();
  const bal = getBalance();
  const fee = computeFee(args.amount);
  const newBal = Math.max(0, bal - args.amount - fee);
  safeSet(KEY_BAL, newBal);
  const txs = safeGet<Tx[]>(KEY_TX, []);
  const tx: Tx = {
    id: Date.now(),
    transaction_type: "send",
    category: "send",
    amount: args.amount,
    fee,
    recipient_name: args.recipient_name,
    recipient_phone: args.phone_number,
    mpesa_id: generateMpesaId(),
    created_at: new Date().toISOString(),
    reference: String(Date.now()),
  };
  safeSet(KEY_TX, [tx, ...txs]);
  return tx;
}

function computeFee(amount: number): number {
  if (amount <= 100) return 0;
  if (amount <= 500) return 7;
  if (amount <= 1000) return 13;
  if (amount <= 1500) return 25;
  if (amount <= 2500) return 33;
  return 55;
}

function generateMpesaId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const now = new Date();
  const yearChar = String.fromCharCode(64 + (now.getFullYear() - 2005));
  const monthChar = String.fromCharCode(64 + now.getMonth() + 1);
  const dayNum = now.getDate();
  const dayChar = dayNum <= 9 ? String(dayNum) : String.fromCharCode(64 + dayNum - 9);
  let s = "";
  for (let i = 0; i < 7; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return yearChar + monthChar + dayChar + s;
}