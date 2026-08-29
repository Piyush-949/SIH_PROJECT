import { NextResponse } from "next/server";
import { otpStore } from "../otpStore";
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

    const stored = otpStore.get(phone);
    const isValidOtp = stored && stored.otp === otp && stored.expiry > Date.now();

    if (!isValidOtp) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired OTP. Please request a new OTP." },
        { status: 401 }
      );
    }

    // OTP is valid — delete it so it can't be reused
    otpStore.delete(phone);

    // Upsert the user in Prisma DB (find existing or create new)
    let user = await db.user.findUnique({ where: { phone } });
    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          name: "New User",   // Will be updated during KYC
          role,
        },
      });
    } else if (user.role !== role && role !== "FARMER") {
      // Allow role override only for non-farmer roles (system roles set at creation)
      user = await db.user.update({
        where: { id: user.id },
        data: { role },
      });
    }

    // Check KYC status
    const farmerProfile = user.role === "FARMER"
      ? await db.farmerProfile.findUnique({ where: { userId: user.id } })
      : null;

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
        createdAt: user.createdAt.toISOString(),
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
