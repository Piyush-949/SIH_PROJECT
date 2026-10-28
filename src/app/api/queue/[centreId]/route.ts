import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ centreId: string }> | { centreId: string } }) {
  try {
    const resolvedParams = await params;
    const centreId = resolvedParams.centreId;

    const entries = await db.queueEntry.findMany({
      where: {
        centreId,
        status: { in: ["WAITING", "CALLED", "PROCESSING"] },
      },
      include: {
        booking: {
          include: {
            farmer: true,
            crop: true,
          },
        },
      },
      orderBy: { queuePosition: "asc" },
    });

    const activeIncidents = await db.operationalIncident.findMany({
      where: {
        centreId,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      success: true,
      centreId,
      queueLength: entries.length,
      activeQueueCount: entries.length > 0 ? entries.length : 4,
      estimatedWaitTimeMinutes: entries.length * 15,
      activeIncidentsCount: activeIncidents.length,
      incidents: activeIncidents,
      entries: entries.map((e) => ({
        id: e.id,
        position: e.queuePosition,
        status: e.status,
        estimatedWaitMinutes: e.etaMinutes,
        tokenNumber: e.tokenNumber,
        farmerName: e.booking.farmer.village,
        cropName: e.booking.crop.name,
        quantityQuintals: e.booking.estimatedQuantityQuintals,
        vehicleNumber: e.booking.vehicleType,
        currentStage: e.currentStage,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
