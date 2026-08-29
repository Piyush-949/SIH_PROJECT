import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    // Authenticate the request — farmer must be logged in
    const session = await getCurrentSession(req);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please login first." },
        { status: 401 }
      );
    }

    const { user } = session;

    const body = await req.json().catch(() => ({}));
    const {
      name,
      aadhaarNumber,
      kisanId,
      village,
      district,
      state,
      pinCode,
      pincode,
      bankName,
      accountNumber,
      ifscCode,
      ifsc,
      preferredLanguage,
      landAreaAcres,
    } = body || {};

    // Validate required fields
    const missingFields: string[] = [];
    if (!name?.trim()) missingFields.push("name");
    if (!village?.trim()) missingFields.push("village");
    if (!district?.trim()) missingFields.push("district");
    if (!state?.trim()) missingFields.push("state");
    if (!bankName?.trim()) missingFields.push("bankName");
    if (!accountNumber?.trim()) missingFields.push("accountNumber");

    const targetIfsc = (ifscCode || ifsc || "").trim().toUpperCase();
    if (!targetIfsc) missingFields.push("ifscCode");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    if (targetIfsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(targetIfsc)) {
      return NextResponse.json(
        { success: false, error: "IFSC must match standard 11-character format (e.g. SBIN0001234)" },
        { status: 400 }
      );
    }

    // Validate bank account number (9–18 digits)
    const cleanAccount = accountNumber.replace(/\s/g, "");
    if (!/^\d{9,18}$/.test(cleanAccount)) {
      return NextResponse.json(
        { success: false, error: "Bank account number must be 9–18 digits" },
        { status: 400 }
      );
    }

    // Mask Aadhaar for storage
    const cleanAadhaar = aadhaarNumber?.replace(/\D/g, "") || "";
    const maskedAadhaar = cleanAadhaar.length >= 4
      ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}`
      : "XXXX-XXXX-XXXX";

    const targetPincode = (pinCode || pincode || "").trim();
    const targetLand = parseFloat(String(landAreaAcres || "5.0")) || 5.0;

    // Update user name and language in DB
    await db.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        language: preferredLanguage || user.language || "en",
      },
    });

    // Upsert FarmerProfile in DB (create or update)
    const profile = await db.farmerProfile.upsert({
      where: { userId: user.id },
      update: {
        aadhaarNumber: maskedAadhaar,
        kisanId: kisanId || `KID-IN-2026-${cleanAadhaar.slice(-4) || "0000"}`,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: targetPincode,
        bankName: bankName.trim(),
        bankAccountNumber: cleanAccount,
        ifscCode: targetIfsc,
        landAreaAcres: targetLand,
        kycStatus: "VERIFIED",
        kycVerifiedAt: new Date(),
      },
      create: {
        userId: user.id,
        aadhaarNumber: maskedAadhaar,
        kisanId: kisanId || `KID-IN-2026-${cleanAadhaar.slice(-4) || "0000"}`,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: targetPincode,
        bankName: bankName.trim(),
        bankAccountNumber: cleanAccount,
        ifscCode: targetIfsc,
        landAreaAcres: targetLand,
        kycStatus: "VERIFIED",
        kycVerifiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        userId: user.id,
        name: name.trim(),
        aadhaarNumber: maskedAadhaar,
        kisanId: profile.kisanId,
        village: profile.village,
        district: profile.district,
        state: profile.state,
        pinCode: profile.pincode,
        bankName: profile.bankName,
        accountNumber: `XXXX${cleanAccount.slice(-4)}`, // Masked for response
        ifscCode: profile.ifscCode,
        landAreaAcres: profile.landAreaAcres,
        preferredLanguage: preferredLanguage || "en",
        kycStatus: "VERIFIED",
        kycVerifiedAt: profile.kycVerifiedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
