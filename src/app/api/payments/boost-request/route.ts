import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId, reason = "Urgent farming inputs" } = body;

    return NextResponse.json(
      {
        success: true,
        boostRequest: {
          id: "bst_" + Date.now(),
          bookingId: bookingId || "BK-2026-001",
          reason: reason || "Urgent requirement for rabi inputs",
          status: "ACTIVE",
          requestedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
