import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const session = await getCurrentSession(req);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user, profile } = session;

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
        createdAt: user.createdAt?.toISOString?.() || new Date().toISOString(),
      },
      profile: profile
        ? {
            id: profile.id,
            userId: user.id,
            name: user.name,
            aadhaarNumber: profile.aadhaarNumber || "",
            kisanId: profile.kisanId,
            village: profile.village,
            district: profile.district,
            state: profile.state,
            pincode: profile.pincode,
            pinCode: profile.pincode,
            bankName: profile.bankName,
            bankAccountNumber: profile.bankAccountNumber || "",
            ifscCode: profile.ifscCode || "",
            landAreaAcres: profile.landAreaAcres,
            kycStatus: profile.kycStatus,
            kycVerifiedAt: profile.kycVerifiedAt?.toISOString?.() || null,
          }
        : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
