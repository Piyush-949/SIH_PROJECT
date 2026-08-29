import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const farmerId = searchParams.get("farmerId");
    const centreId = searchParams.get("centreId");
    const status = searchParams.get("status");

    const whereClause: any = {};
    if (farmerId) whereClause.farmerId = farmerId;
    if (centreId) whereClause.centreId = centreId;
    if (status) whereClause.status = status;

    const bookings = await db.booking.findMany({
      where: whereClause,
      include: {
        farmer: true,
        centre: true,
        crop: true,
        slot: true,
        queueEntry: true,
        procurementRecord: true,
        qualityInspection: true,
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      bookings,
      total: bookings.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
