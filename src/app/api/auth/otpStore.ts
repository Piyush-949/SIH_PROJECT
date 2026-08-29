import crypto from "crypto";

// In-memory OTP store (used for local dev / same-instance caching)
export const otpStore = new Map<string, { otp: string; expiry: number }>();

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

