// In-memory OTP store only — used transiently between send-otp and verify-otp
// OTPs expire after 5 minutes and are deleted after successful verification
// This intentionally does NOT store user data — that lives in the Prisma DB

export const otpStore = new Map<string, { otp: string; expiry: number }>();
