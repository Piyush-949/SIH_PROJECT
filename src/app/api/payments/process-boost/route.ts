import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = "EXPEDITE" } = body;

    return NextResponse.json({
      success: true,
      updatedStatus: action === "EXPEDITE" ? "EXPEDITED" : "APPROVED",
      message: "Boost approved and queued for priority disbursal",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
