import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createToken } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const role = (body?.role || "FARMER").toUpperCase();

    const user = await db.user.findFirst({
      where: { role },
      include: { farmerProfile: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No user found for role: " + role },
        { status: 404 }
      );
    }

    const token = createToken(user.id, user.role, user.phone);
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        language: user.language,
      },
      token,
    });

    response.cookies.set("auth_token", token, { path: "/", httpOnly: false });
    response.cookies.set("user_role", user.role, { path: "/", httpOnly: false });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
