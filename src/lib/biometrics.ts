// Lightweight WebAuthn helper for "fingerprint login".
// We register a platform credential keyed to the user's 4-digit code.
// On next login, getCredential unlocks the code stored in localStorage.

const STORAGE_KEY = "apt.biometric.v1";

type Stored = { credentialId: string; code: string };

function b64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): ArrayBuffer {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const buf = new ArrayBuffer(bin.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return buf;
}

export function biometricsSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export function getStoredBiometric(): Stored | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearBiometric() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function registerBiometric(code: string, label: string): Promise<Stored> {
  if (!biometricsSupported()) throw new Error("Biometrics not supported on this device");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "Apartment" },
      user: { id: userId, name: `code-${code}`, displayName: label },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        residentKey: "preferred",
      },
      timeout: 45000,
      attestation: "none",
    },
  }) as PublicKeyCredential | null;
  if (!cred) throw new Error("Registration cancelled");
  const stored: Stored = { credentialId: b64url(cred.rawId), code };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return stored;
}

export async function unlockWithBiometric(): Promise<string | null> {
  const s = getStoredBiometric();
  if (!s) return null;
  if (!biometricsSupported()) return null;
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ id: fromB64url(s.credentialId), type: "public-key" }],
        userVerification: "required",
        timeout: 45000,
      },
    });
    if (!assertion) return null;
    return s.code;
  } catch {
    return null;
  }
}