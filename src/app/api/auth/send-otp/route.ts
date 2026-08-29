import { NextResponse } from "next/server";
import { otpStore } from "../otpStore";

function purgeExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiry < now) otpStore.delete(key);
  }
}

/**
 * Sends a real OTP via Fast2SMS (or logs to console in dev if API key is missing).
 * OTP is NEVER returned in the API response for security.
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

    // Rate limit: don't allow more than 1 OTP per 60 seconds
    const existing = otpStore.get(phone);
    if (existing && existing.expiry - Date.now() > 4 * 60 * 1000) {
      return NextResponse.json(
        { success: false, error: "An OTP was recently sent. Please wait 60 seconds before requesting again." },
        { status: 429 }
      );
    }

    // Generate random 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(phone, { otp, expiry });

    const apiKey = process.env.FAST2SMS_API_KEY;

    if (apiKey && apiKey.trim() !== "") {
      // Send real SMS via Fast2SMS
      try {
        const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "otp",
            variables_values: otp,
            numbers: phone,
          }),
        });

        const smsData = await smsResponse.json();

        if (!smsResponse.ok || smsData.return === false) {
          console.error("[OTP] Fast2SMS error:", smsData);
          // Clean up OTP if SMS failed
          otpStore.delete(phone);
          return NextResponse.json(
            { success: false, error: "Failed to send OTP. Please try again." },
            { status: 503 }
          );
        }

        return NextResponse.json({
          success: true,
          message: `OTP sent successfully to +91${phone}. Valid for 5 minutes.`,
        });
      } catch (smsErr: any) {
        console.error("[OTP] SMS provider error:", smsErr.message);
        otpStore.delete(phone);
        return NextResponse.json(
          { success: false, error: "SMS service unavailable. Please try again." },
          { status: 503 }
        );
      }
    } else {
      // Development mode: log OTP to server console only
      // NEVER expose OTP in API response — even in dev
      console.log(`\n🔐 [DEV OTP] Phone: ${phone} | OTP: ${otp} | Expires: ${new Date(expiry).toLocaleTimeString()}\n`);
      return NextResponse.json({
        success: true,
        message: `OTP sent to ${phone}. (Dev mode: check server console for OTP)`,
        // In development without Fast2SMS key, show a hint in the UI
        devMode: process.env.NODE_ENV === "development",
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
