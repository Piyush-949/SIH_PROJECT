import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const centreId = searchParams.get("centreId");

    const whereClause: any = {};
    if (centreId) whereClause.centreId = centreId;

    const entries = await db.queueEntry.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            farmer: true,
            crop: true,
            centre: true,
          },
        },
      },
      orderBy: { queuePosition: "asc" },
    });

    return NextResponse.json({
      success: true,
      entries,
      total: entries.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
