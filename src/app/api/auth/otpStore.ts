import crypto from "crypto";

// Global OTP store attached to globalThis to persist across Next.js dev chunks and hot-reloads
const globalForOtp = globalThis as unknown as {
  __krishi_otp_store?: Map<string, { otp: string; expiry: number }>;
};

export const otpStore =
  globalForOtp.__krishi_otp_store ||
  new Map<string, { otp: string; expiry: number }>();

if (!globalForOtp.__krishi_otp_store) {
  globalForOtp.__krishi_otp_store = otpStore;
}

const SECRET = process.env.JWT_SECRET || "krishi-setu-sih2026-super-secret-jwt-key-change-in-prod";

/**
 * Creates a signed stateless cryptographic token for an OTP.
 */
export function createOtpSignature(phone: string, otp: string, expiry: number): string {
  const data = `${phone.trim()}:${otp.trim()}:${expiry}`;
  const hmac = crypto.createHmac("sha256", SECRET).update(data).digest("hex");
  return `${expiry}.${hmac}`;
}

/**
 * Verifies a signed OTP token against the phone and user-submitted OTP.
 */
export function verifyOtpSignature(phone: string, otp: string, signature?: string | null): boolean {
  if (!signature || typeof signature !== "string" || !signature.includes(".")) {
    return false;
  }
  try {
    const [expiryStr, hash] = signature.split(".");
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || expiry < Date.now()) {
      return false;
    }
    const expectedHash = crypto
      .createHmac("sha256", SECRET)
      .update(`${phone.trim()}:${otp.trim()}:${expiry}`)
      .digest("hex");

    if (hash.length !== expectedHash.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
  } catch {
    return false;
  }
}

