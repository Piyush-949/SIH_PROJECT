import { NextResponse } from "next/server";
import { otpStore } from "../otpStore";

function purgeExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiry < now) otpStore.delete(key);
  }
}

/**
 * Sends a real OTP via Fast2SMS (or falls back gracefully if SMS gateway is pending verification).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = (body?.phone || body?.mobile || "").trim();

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Mobile number must be a valid 10-digit Indian phone number" },
        { status: 400 }
      );
    }

    purgeExpired();

    // Rate limit: don't allow more than 1 OTP per 30 seconds
    const existing = otpStore.get(phone);
    if (existing && existing.expiry - Date.now() > 4.5 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: "An OTP was recently sent. Please wait 30 seconds before requesting again." },
        { status: 429 }
      );
    }

    // Generate random 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(phone, { otp, expiry });

    const apiKey = process.env.FAST2SMS_API_KEY;

    if (apiKey && apiKey.trim() !== "") {
      try {
        const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: apiKey.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: phone,
          }),
        });

        const smsData = await smsResponse.json().catch(() => ({}));

        if (smsResponse.ok && smsData.return === true) {
          return NextResponse.json({
            success: true,
            message: `OTP sent successfully via SMS to +91${phone}. Valid for 5 minutes.`,
            deliveredViaSms: true,
          });
        }

        // Fast2SMS returned an account/verification error (e.g. status 996 / 999)
        console.warn("[OTP] Fast2SMS notice:", smsData.message || smsData);

        return NextResponse.json({
          success: true,
          deliveredViaSms: false,
          devMode: true,
          devOtp: otp,
          notice: smsData.message || "Fast2SMS account requires website verification for live SMS delivery.",
          message: `Verification code generated for +91${phone}.`,
        });
      } catch (smsErr: any) {
        console.warn("[OTP] SMS gateway unreachable:", smsErr.message);
        return NextResponse.json({
          success: true,
          deliveredViaSms: false,
          devMode: true,
          devOtp: otp,
          message: `Verification code generated for +91${phone}.`,
        });
      }
    } else {
      // No API key configured — local dev mode
      console.log(`\n🔐 [DEV OTP] Phone: ${phone} | OTP: ${otp} | Expires: ${new Date(expiry).toLocaleTimeString()}\n`);
      return NextResponse.json({
        success: true,
        deliveredViaSms: false,
        devMode: true,
        devOtp: otp,
        message: `OTP generated for +91${phone}.`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
