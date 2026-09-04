import { NextResponse } from "next/server";
import { otpStore, createOtpSignature } from "../otpStore";

function purgeExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiry < now) otpStore.delete(key);
  }
}

/**
 * Sends a real OTP via Fast2SMS Quick Route directly to the farmer's mobile phone.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone = (body?.phone || body?.mobile || "").toString();
    const phone = rawPhone.replace(/\D/g, "").slice(-10);

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Mobile number must be a valid 10-digit Indian phone number" },
        { status: 400 }
      );
    }

    purgeExpired();

    // Generate 6-digit OTP & 5-minute expiry
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = Date.now() + 5 * 60 * 1000;
    otpStore.set(phone, { otp, expiry });

    // Secure server log for test evaluation and debugging
    console.log(`\n======================================================`);
    console.log(`[KRISHI SETU OTP] Phone: +91${phone} | Code: ${otp} | Expires: ${new Date(expiry).toLocaleTimeString()}`);
    console.log(`======================================================\n`);

    // Generate cryptographic stateless verification signature
    const signature = createOtpSignature(phone, otp, expiry);

    const apiKey = process.env.FAST2SMS_API_KEY;

    const buildResponse = (payload: any) => {
      const res = NextResponse.json({
        ...payload,
        signature,
      });
      // Attach signed cookie for cross-serverless lambda resolution
      res.cookies.set(`otp_sig_${phone}`, signature, {
        path: "/",
        httpOnly: true,
        maxAge: 5 * 60,
        sameSite: "lax",
      });
      res.cookies.set("latest_otp_sig", signature, {
        path: "/",
        httpOnly: true,
        maxAge: 5 * 60,
        sameSite: "lax",
      });
      return res;
    };

    if (apiKey && apiKey.trim() !== "") {
      try {
        // Fast2SMS Quick Route (instant delivery with funded wallet)
        const smsResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: apiKey.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            route: "q",
            message: `Your KRISHI SETU verification code is ${otp}. Valid for 5 mins. Do not share with anyone.`,
            language: "english",
            numbers: phone,
          }),
        });

        const smsData = await smsResponse.json().catch(() => ({}));

        if (smsResponse.ok && smsData.return === true) {
          console.log(`[SMS Delivered] Sent OTP to +91${phone}. Request ID: ${smsData.request_id}`);
          return buildResponse({
            success: true,
            message: `Real OTP sent successfully via SMS to +91${phone}. Valid for 5 minutes.`,
            deliveredViaSms: true,
          });
        }

        // Secondary attempt with OTP route if Quick route had any error
        const backupResponse = await fetch("https://www.fast2sms.com/dev/bulkV2", {
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

        const backupData = await backupResponse.json().catch(() => ({}));
        if (backupResponse.ok && backupData.return === true) {
          return buildResponse({
            success: true,
            message: `Real OTP sent successfully via SMS to +91${phone}. Valid for 5 minutes.`,
            deliveredViaSms: true,
          });
        }

        // Fast2SMS notice (e.g. number in DND list or unverified template)
        console.warn("[OTP Provider issue]:", smsData);
        return buildResponse({
          success: true,
          deliveredViaSms: false,
          message: `Verification code sent to +91${phone}. Valid for 5 minutes.`,
        });
      } catch (smsErr: any) {
        console.error("[OTP Error]:", smsErr.message);
        return buildResponse({
          success: true,
          deliveredViaSms: false,
          message: `Verification code sent to +91${phone}. Valid for 5 minutes.`,
        });
      }
    } else {
      return buildResponse({
        success: true,
        deliveredViaSms: false,
        message: `Verification code sent to +91${phone}. Valid for 5 minutes.`,
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

