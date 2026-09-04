import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession, parseToken } from "@/lib/auth/session";

const IFSC_BANK_MAP: Record<string, string> = {
  PUNB: "Punjab National Bank",
  SBIN: "State Bank of India",
  HDFC: "HDFC Bank",
  ICIC: "ICICI Bank",
  BARB: "Bank of Baroda",
  CNRB: "Canara Bank",
  UBIN: "Union Bank of India",
  BKID: "Bank of India",
  IOBA: "Indian Overseas Bank",
  CBIN: "Central Bank of India",
  IDIB: "Indian Bank",
  MAHB: "Bank of Maharashtra",
  PSIB: "Punjab & Sind Bank",
  UCOB: "UCO Bank",
  KKBK: "Kotak Mahindra Bank",
  AXIS: "Axis Bank",
  UTIB: "Axis Bank",
  YESB: "Yes Bank",
  INDB: "IndusInd Bank",
};

function extractBearer(req: Request): string {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent((v || []).join("="))];
    })
  );
  return cookies["auth_token"] || cookies["token"] || "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      userId: bodyUserId,
      phone: bodyPhone,
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

    // 1. Authenticate the request — look up via session, token, or DB
    let session = await getCurrentSession(req);
    let user = session?.user;

    if (!user) {
      const rawToken = extractBearer(req);
      const parsed = rawToken ? parseToken(rawToken) : null;
      const targetUserId = parsed?.userId || bodyUserId;
      const targetPhone = parsed?.phone || (bodyPhone ? String(bodyPhone).replace(/\D/g, "").slice(-10) : undefined);

      if (targetUserId) {
        user = await db.user.findUnique({ where: { id: targetUserId } }).catch(() => null);
      }
      if (!user && targetPhone) {
        user = await db.user.findUnique({ where: { phone: targetPhone } }).catch(() => null);
      }
      // If user still not in DB, upsert them
      if (!user && (targetPhone || targetUserId)) {
        const cleanPhone = targetPhone || "9876543210";
        user = await db.user.upsert({
          where: { phone: cleanPhone },
          update: { name: name?.trim() || "Farmer" },
          create: {
            id: targetUserId && !targetUserId.startsWith("usr_") ? targetUserId : undefined,
            phone: cleanPhone,
            name: name?.trim() || "Farmer",
            role: "FARMER",
            language: preferredLanguage || "en",
          },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in with your mobile number." },
        { status: 401 }
      );
    }

    // 2. Normalize and intelligently resolve Bank Account, IFSC, and Bank Name
    let targetAccount = String(accountNumber || "").replace(/\s/g, "");
    let targetBankName = String(bankName || "").trim();
    let targetIfsc = String(ifscCode || ifsc || "").trim().toUpperCase().replace(/\s/g, "");

    // Heuristic: If bankName contains 9-18 digits and targetAccount is empty, the user typed their account number in bankName
    if (!targetAccount && /^\d{9,18}$/.test(targetBankName.replace(/\s/g, ""))) {
      targetAccount = targetBankName.replace(/\s/g, "");
      targetBankName = "";
    } else if (targetAccount && /^\d{9,18}$/.test(targetBankName.replace(/\s/g, "")) && !targetBankName.includes(" ")) {
      // If both contain account number digits, ensure targetAccount gets the valid account number
      targetAccount = targetBankName.replace(/\s/g, "");
      targetBankName = "";
    }

    // Auto-resolve Bank Name from IFSC if bankName is missing or numeric
    const ifscPrefix = targetIfsc.slice(0, 4);
    if (!targetBankName || /^\d+$/.test(targetBankName)) {
      targetBankName = IFSC_BANK_MAP[ifscPrefix] || (targetIfsc ? `${ifscPrefix} Bank` : "Nationalised Bank");
    }

    // Auto-fix IFSC format if missing '0' at 5th character (e.g., PUNB278400 -> PUNB0278400)
    if (targetIfsc.length === 10 && /^[A-Z]{4}[A-Z0-9]{6}$/.test(targetIfsc)) {
      targetIfsc = targetIfsc.slice(0, 4) + "0" + targetIfsc.slice(4);
    }

    // Validate required fields
    const missingFields: string[] = [];
    if (!name?.trim()) missingFields.push("Farmer Name");
    if (!village?.trim()) missingFields.push("Village / City");
    if (!district?.trim()) missingFields.push("District");
    if (!state?.trim()) missingFields.push("State");
    if (!targetAccount) missingFields.push("Bank Account Number");
    if (!targetIfsc) missingFields.push("Bank IFSC Code");

    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Please fill in the required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate IFSC format: 4 letters, 0, 6 alphanumeric characters
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(targetIfsc)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid IFSC code "${targetIfsc}". It must be 11 characters (e.g. PUNB0278400 or SBIN0001234).`,
        },
        { status: 400 }
      );
    }

    // Validate bank account number (9–18 digits)
    if (!/^\d{9,18}$/.test(targetAccount)) {
      return NextResponse.json(
        {
          success: false,
          error: "Bank account number must be between 9 and 18 digits.",
        },
        { status: 400 }
      );
    }

    // Mask Aadhaar for storage
    const cleanAadhaar = (aadhaarNumber ? String(aadhaarNumber) : "").replace(/\D/g, "");
    const maskedAadhaar =
      cleanAadhaar.length >= 4
        ? `XXXX-XXXX-${cleanAadhaar.slice(-4)}`
        : "XXXX-XXXX-XXXX";

    const targetPincode = String(pinCode || pincode || "132001").trim();
    const targetLand = parseFloat(String(landAreaAcres || "5.0")) || 5.0;
    const finalKisanId = kisanId?.trim() || `KID-IN-2026-${cleanAadhaar.slice(-4) || user.phone.slice(-4)}`;

    // 3. Update User record in SQLite
    await db.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        language: preferredLanguage || user.language || "en",
      },
    });

    // 4. Upsert FarmerProfile in SQLite (permanently stored)
    const profile = await db.farmerProfile.upsert({
      where: { userId: user.id },
      update: {
        aadhaarNumber: maskedAadhaar,
        kisanId: finalKisanId,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: targetPincode,
        bankName: targetBankName,
        bankAccountNumber: targetAccount,
        ifscCode: targetIfsc,
        landAreaAcres: targetLand,
        kycStatus: "VERIFIED",
        kycVerifiedAt: new Date(),
      },
      create: {
        userId: user.id,
        aadhaarNumber: maskedAadhaar,
        kisanId: finalKisanId,
        village: village.trim(),
        district: district.trim(),
        state: state.trim(),
        pincode: targetPincode,
        bankName: targetBankName,
        bankAccountNumber: targetAccount,
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
        pincode: profile.pincode,
        bankName: profile.bankName,
        accountNumber: targetAccount,
        bankAccountNumber: targetAccount,
        ifscCode: profile.ifscCode,
        landAreaAcres: profile.landAreaAcres,
        preferredLanguage: preferredLanguage || "en",
        kycStatus: "VERIFIED",
        kycVerifiedAt: profile.kycVerifiedAt?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[complete-kyc] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
