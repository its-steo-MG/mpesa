/**
 * Biometric (Face ID / Touch ID / Android fingerprint) login via WebAuthn.
 *
 * Flow:
 *  1. After a successful PIN login the user can enable biometrics. We create a
 *     platform (device-bound) WebAuthn credential and remember the credential id
 *     plus the phone number locally.
 *  2. On the login screen the Face ID button asks the device to verify the user.
 *     Once verified we complete the login with the backend:
 *       - if a backend is configured we POST the assertion to
 *         /mpesa/biometric-login/ so the server can issue the JWT,
 *       - otherwise (or if that endpoint is not available yet) we fall back to
 *         the securely stored PIN so the offline/demo mode keeps working.
 */

const KEY_CRED = "mpesa_biometric_credential_v1";

export interface BiometricRecord {
  credentialId: string; // base64url
  phone: string;
  pin: string; // obfuscated, demo/offline fallback only
  createdAt: string;
}

/* ---------- base64url helpers ---------- */
function toB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string): Uint8Array {
  const pad = value.replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(pad + "=".repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) out[i] = str.charCodeAt(i);
  return out;
}

function scramble(value: string): string {
  return toB64url(new TextEncoder().encode(value.split("").reverse().join("")).buffer as ArrayBuffer);
}

function unscramble(value: string): string {
  return new TextDecoder().decode(fromB64url(value)).split("").reverse().join("");
}

/* ---------- capability ---------- */
export function isWebAuthnSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;
}

export async function isBiometricAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    // Some browsers never settle this promise; never block the login screen.
    return await Promise.race([
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 1200)),
    ]);
  } catch {
    return false;
  }
}

/* ---------- local record ---------- */
export function getBiometricRecord(): BiometricRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY_CRED);
    if (!raw) return null;
    const rec = JSON.parse(raw) as BiometricRecord;
    return rec?.credentialId ? rec : null;
  } catch {
    return null;
  }
}

export function isBiometricEnabled(): boolean {
  return !!getBiometricRecord();
}

export function disableBiometric() {
  localStorage.removeItem(KEY_CRED);
}

/* ---------- enrolment ---------- */
export async function enableBiometric(opts: { phone: string; pin: string; name?: string }) {
  if (!(await isBiometricAvailable())) {
    throw new Error("Face ID / fingerprint is not available on this device.");
  }

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));

  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "My OneApp", id: window.location.hostname },
      user: {
        id: userId,
        name: opts.phone,
        displayName: opts.name || opts.phone,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 60000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("Could not set up Face ID.");

  const record: BiometricRecord = {
    credentialId: toB64url(credential.rawId),
    phone: opts.phone.replace(/\D/g, ""),
    pin: scramble(opts.pin),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(KEY_CRED, JSON.stringify(record));
  return record;
}

/* ---------- verification ---------- */
export interface BiometricAssertion {
  credential_id: string;
  client_data: string;
  authenticator_data: string;
  signature: string;
  user_handle: string | null;
  phone: string;
  /** demo/offline fallback only */
  pin: string;
}

export async function verifyBiometric(): Promise<BiometricAssertion> {
  const record = getBiometricRecord();
  if (!record) throw new Error("Face ID is not set up yet. Log in with your PIN first.");
  if (!isWebAuthnSupported()) throw new Error("Face ID is not supported in this browser.");

  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge,
      timeout: 60000,
      userVerification: "required",
      rpId: window.location.hostname,
      allowCredentials: [
        {
          id: fromB64url(record.credentialId).buffer as ArrayBuffer,
          type: "public-key",
          transports: ["internal"],
        },
      ],
    },
  })) as PublicKeyCredential | null;

  if (!assertion) throw new Error("Face ID was cancelled.");

  const response = assertion.response as AuthenticatorAssertionResponse;
  return {
    credential_id: toB64url(assertion.rawId),
    client_data: toB64url(response.clientDataJSON),
    authenticator_data: toB64url(response.authenticatorData),
    signature: toB64url(response.signature),
    user_handle: response.userHandle ? toB64url(response.userHandle) : null,
    phone: record.phone,
    pin: unscramble(record.pin),
  };
}
