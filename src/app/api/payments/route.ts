import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const payments = await db.payment.findMany({
      include: { booking: { include: { farmer: true, crop: true, centre: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      payments,
      total: payments.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
