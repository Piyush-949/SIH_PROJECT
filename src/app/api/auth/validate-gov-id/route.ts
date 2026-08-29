import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const aadhaarRaw = (body?.aadhaarNumber || body?.aadhaar || "").toString();
    const targetAadhaar = aadhaarRaw.replace(/\D/g, "");
    const kisanId = (body?.kisanId || "").trim();

    if (targetAadhaar.length !== 12) {
      return NextResponse.json(
        { valid: false, error: "Aadhaar must be exactly 12 digits" },
        { status: 400 }
      );
    }

    if (kisanId && !/^KID-[A-Z]{2}-\d{4}-\d{4,}$/.test(kisanId)) {
      return NextResponse.json(
        {
          valid: false,
          error:
            "Kisan ID format invalid. Expected format: KID-XX-YYYY-NNNN (e.g. KID-HR-2024-8891)",
        },
        { status: 400 }
      );
    }

    // Query GovRegistry table in our Prisma DB
    // Supports matching by Aadhaar alone or Aadhaar + KisanID combination
    let govRecord = null;

    if (kisanId) {
      // Strict match: both Aadhaar + KisanID must match the same record
      govRecord = await db.govRegistry.findFirst({
        where: {
          aadhaarNumber: targetAadhaar,
          kisanId: kisanId,
          active: true,
        },
      });

      if (!govRecord) {
        return NextResponse.json(
          {
            valid: false,
            error:
              "Aadhaar and Kisan ID combination not found in the National Farmer Registry. Please verify your details.",
          },
          { status: 422 }
        );
      }
    } else {
      // Aadhaar-only check (KisanID not provided yet)
      govRecord = await db.govRegistry.findFirst({
        where: { aadhaarNumber: targetAadhaar, active: true },
      });

      if (!govRecord) {
        return NextResponse.json(
          {
            valid: false,
            error:
              "Aadhaar not found in the National Farmer Registry. Please ensure you are a registered farmer.",
          },
          { status: 422 }
        );
      }
    }

    // Check if this farmer has already completed KYC with a different phone
    const existingProfile = await db.farmerProfile.findFirst({
      where: { kisanId: govRecord.kisanId },
      include: { user: true },
    });

    if (existingProfile) {
      // Mask the phone for privacy
      const maskedPhone = `XXXXX${existingProfile.user.phone.slice(-5)}`;
      return NextResponse.json({
        valid: true,
        alreadyRegistered: true,
        maskedPhone,
        record: {
          aadhaarNumber: targetAadhaar,
          kisanId: govRecord.kisanId,
          fullName: govRecord.farmerName,
          village: govRecord.village,
          district: govRecord.district,
          state: govRecord.state,
          pincode: govRecord.pincode,
          landAreaAcres: govRecord.registeredLandAcres,
          active: govRecord.active,
        },
        message: `This Kisan ID is already registered to mobile ending ${maskedPhone}. If this is you, please login with that number.`,
      });
    }

    return NextResponse.json({
      valid: true,
      alreadyRegistered: false,
      record: {
        aadhaarNumber: targetAadhaar,
        kisanId: govRecord.kisanId,
        fullName: govRecord.farmerName,
        village: govRecord.village,
        district: govRecord.district,
        state: govRecord.state,
        pincode: govRecord.pincode,
        landAreaAcres: govRecord.registeredLandAcres,
        active: govRecord.active,
      },
      message: "Aadhaar verified successfully with the National Farmer Registry.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
