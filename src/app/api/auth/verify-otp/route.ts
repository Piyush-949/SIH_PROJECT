import { NextResponse } from "next/server";
import { otpStore, verifyOtpSignature } from "../otpStore";
import { db } from "@/lib/db";
import { createToken } from "@/lib/auth/session";

function purgeExpired() {
  const now = Date.now();
  for (const [key, val] of otpStore.entries()) {
    if (val.expiry < now) otpStore.delete(key);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = (body?.phone || body?.mobile || "").trim();
    const otp = (body?.otp || "").trim();
    const role = (body?.role || "FARMER").toUpperCase();

    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    purgeExpired();

    // 1. Fast demo / test bypass codes
    const isDemoBypass =
      otp === "999999" ||
      otp === "123456" ||
      otp === "000000" ||
      ["9876543210", "9876543220", "9876543230", "9876543240", "9876543250", "9876543260"].includes(phone);

    // 2. In-memory OTP verification (for local server)
    const stored = otpStore.get(phone);
    const isMemoryValid = stored && stored.otp === otp && stored.expiry > Date.now();

    // 3. Cryptographic stateless HMAC signature verification (for Vercel serverless lambdas)
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    const signature =
      body.signature ||
      cookies[`otp_sig_${phone}`] ||
      cookies["latest_otp_sig"];

    const isSignatureValid = verifyOtpSignature(phone, otp, signature);

    const isValidOtp = isDemoBypass || isMemoryValid || isSignatureValid;

    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP. Please request a new OTP." },
        { status: 401 }
      );
    }

    // OTP is valid — delete from memory store if present
    otpStore.delete(phone);

    // Upsert the user in Prisma DB (with serverless fallback)
    let user: any = null;
    try {
      user = await db.user.findUnique({ where: { phone } });
      if (!user) {
        user = await db.user.create({
          data: {
            phone,
            name: "New User",
            role,
          },
        });
      } else if (user.role !== role && role !== "FARMER") {
        user = await db.user.update({
          where: { id: user.id },
          data: { role },
        });
      }
    } catch (dbErr: any) {
      console.warn("[verify-otp] Database fallback for serverless environment:", dbErr.message);
      user = {
        id: `usr_${phone}`,
        phone,
        name: "Farmer",
        role,
        language: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Check KYC status
    let farmerProfile: any = null;
    try {
      farmerProfile = user.role === "FARMER" && user.id && !user.id.startsWith("usr_")
        ? await db.farmerProfile.findUnique({ where: { userId: user.id } })
        : null;
    } catch {
      farmerProfile = null;
    }

    const kycStatus = farmerProfile?.kycStatus || "PENDING";
    const token = createToken(user.id, user.role, user.phone);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        kycStatus,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : new Date().toISOString(),
      },
      token,
    });

    // Set auth cookie
    response.cookies.set("auth_token", token, {
      path: "/",
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60, // 7 days
      sameSite: "lax",
    });
    response.cookies.set("user_role", user.role, {
      path: "/",
      httpOnly: false,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

