// /home/workdir/frontend/src/lib/mpesa-api.ts
import axios from "axios";
import { 
  getProfile, 
  setProfile, 
  setAuthed, 
  saveTx,
  sendMoney as localSendMoney,
  lookupRecipient,
  getTxs as localGetTxs,
  getBalance,
} from "./mpesa-store";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") 
  || "http://localhost:8000/api";

const TOKEN_KEY = "mpesa_access_token";

export const hasBackend = () => !!import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "false";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

function auth() {
  const token = getToken();
  return token 
    ? { headers: { Authorization: `Bearer ${token}` } } 
    : { headers: {} };
}

// ==================== NOTIFICATION TYPE ====================
export interface MpesaNotification {
  id: number;
  caller_id?: string;
  message: string;
  created_at?: string;
  notification_type?: string;
}

// ==================== RECIPIENT LOOKUP ====================
export async function apiLookupRecipient(phone: string) {
  const cleaned = phone.replace(/\D/g, "");

  if (!hasBackend()) {
    const name = lookupRecipient(cleaned);
    return { 
      recipient_name: name || "M-PESA User", 
      recipient_phone: cleaned,
      exists: !!name
    };
  }

  try {
    const res = await axios.post(
      `${API_URL}/mpesa/lookup-recipient/`, 
      { recipient_phone: cleaned }, 
      auth()
    );
    return res.data;
  } catch (error: any) {
    console.warn("Backend lookup failed, falling back to local");
    const name = lookupRecipient(cleaned);
    return { 
      recipient_name: name || "M-PESA User", 
      recipient_phone: cleaned,
      exists: !!name
    };
  }
}

// ==================== SEND MONEY ====================
export async function apiSendMoney(payload: {
  recipient_phone: string;
  amount: number | string;
  description?: string;
  pin: string;
}) {
  const cleanedPhone = payload.recipient_phone.replace(/\D/g, "");

  if (!hasBackend()) {
    return localSendMoney({
      phone_number: cleanedPhone,
      amount: Number(payload.amount),
      recipient_name: "Local Recipient",
    });
  }

  try {
    const res = await axios.post(`${API_URL}/mpesa/send-money/`, {
      ...payload,
      recipient_phone: cleanedPhone,
    }, auth());

    const data = res.data;

    // Normalize backend response
    const tx: any = {
      id: Date.now(),
      transaction_type: "withdrawal" as const,   // ← Fixed
      category: "family_friends" as const,
      amount: Number(data.amount),
      fee: Number(data.fee) || 0,
      recipient_name: data.recipient_name,
      recipient_phone: data.recipient_phone,
      mpesa_id: data.mpesa_id,
      description: data.description || `Send to ${data.recipient_name}`,
      created_at: new Date().toISOString(),
      reference: data.reference || data.mpesa_id,
    };

    const savedTx = saveTx(tx);

    // Update local balance
    const currentProfile = getProfile();
    if (data.new_balance !== undefined) {
      setProfile({ 
        ...currentProfile, 
        balance: Number(data.new_balance) 
      });
    }

    console.log("✅ Send money successful:", savedTx.mpesa_id);
    return savedTx;

  } catch (error: any) {
    const errData = error.response?.data || {};
    let message = errData.error || "Transaction failed. Please try again.";

    if (message.includes("Daily limit")) message = "Daily sending limit exceeded";
    if (message.includes("Insufficient balance")) message = "Insufficient M-PESA balance";
    if (message.includes("Invalid PIN")) message = "Incorrect M-PESA PIN";

    console.error("Send money failed:", errData);
    throw new Error(message);
  }
}

// ==================== NOTIFICATIONS (for polling) ====================
export async function listMpesaNotifications(): Promise<MpesaNotification[]> {
  if (!hasBackend()) return [];

  try {
    // ✅ Correct URL
    const res = await axios.get(`${API_URL}/mpesa-notif/notifications/`, auth());
    return res.data || [];
  } catch (error: any) {
    console.warn("Failed to fetch notifications");
    return [];
  }
}
// ==================== OTHER APIS ====================
export async function apiLogin(phone_number: string, pin: string) {
  if (!hasBackend()) {
    setAuthed(true);
    return { ok: true };
  }

  try {
    const res = await axios.post(`${API_URL}/mpesa/login/`, { 
      phone_number: phone_number.replace(/\D/g, ""), 
      pin 
    });
    
    if (res.data?.access) {
      setToken(res.data.access);
      setAuthed(true);
    }
    return res.data;
  } catch (error: any) {
    console.error("Login failed:", error.response?.data);
    throw error;
  }
}

export async function apiProfile() {
  if (!hasBackend()) return getProfile();

  try {
    const res = await axios.get(`${API_URL}/mpesa/profile/`, auth());
    const profile = res.data;
    setProfile(profile);
    return profile;
  } catch (error: any) {
    if (error.response?.status === 401) {
      setToken(null);
      setAuthed(false);
    }
    throw error;
  }
}

export async function apiBalance() {
  if (!hasBackend()) {
    const profile = getProfile();
    return { balance: String(profile.balance || getBalance()) };
  }

  try {
    const res = await axios.get(`${API_URL}/mpesa/balance/`, auth());
    return res.data;
  } catch (error: any) {
    throw error;
  }
}

export async function apiTransactions() {
  if (!hasBackend()) return localGetTxs();

  try {
    const res = await axios.get(`${API_URL}/mpesa/transactions/`, auth());
    return res.data;
  } catch (error: any) {
    console.warn("Backend transactions failed, using local");
    return localGetTxs();
  }
}

export async function apiConnectMpesa(data: any) {
  if (!hasBackend()) return { message: "Connected (local)" };

  const formData = new FormData();
  formData.append("real_name", data.real_name);
  formData.append("pin", data.pin);
  if (data.phone_number) formData.append("phone_number", data.phone_number.replace(/\D/g, ""));
  if (data.profile_photo) formData.append("profile_photo", data.profile_photo);

  const res = await axios.post(`${API_URL}/mpesa/connect/`, formData, {
    ...auth(),
    headers: { "Content-Type": "multipart/form-data" }
  });
  return res.data;
}
// ==================== API OBJECT (for hooks like useNotifications) ====================
export const api = {
  listMpesaNotifications,
  hasBackend,
  // You can add more methods here later if needed
};

export default {
  apiLogin,
  apiProfile,
  apiBalance,
  apiTransactions,
  apiSendMoney,
  apiLookupRecipient,
  apiConnectMpesa,
  listMpesaNotifications,
  hasBackend,
  getToken,
  setToken,
  api,
};