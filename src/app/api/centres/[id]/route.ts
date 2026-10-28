import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const centreId = resolvedParams.id;

    const centre = await db.procurementCentre.findUnique({
      where: { id: centreId },
      include: {
        cropsSupported: { include: { crop: true } },
        incidents: { where: { status: "ACTIVE" } },
        queueEntries: {
          where: { status: { in: ["WAITING", "CALLED", "PROCESSING"] } },
          include: { booking: true },
        },
        slots: { take: 10 },
      },
    });

    if (!centre) {
      return NextResponse.json(
        { success: false, error: "Procurement centre not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      centre: {
        ...centre,
        aiScore: centre.incidents.length > 0 ? 48 : 94,
        congestionPercentage: Math.min(100, (centre.queueEntries.length / 10) * 100),
        status: centre.incidents.length > 0 ? "RED" : "GREEN",
        activeQueueCount: centre.queueEntries.length,
        hasIncidents: centre.incidents.length > 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
