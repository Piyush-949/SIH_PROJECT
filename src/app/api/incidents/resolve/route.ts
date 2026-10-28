import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitIncidentResolved } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { incidentId } = body;

    const incident = await db.operationalIncident.update({
      where: { id: incidentId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    emitIncidentResolved(incident.centreId, {
      incidentId: incident.id,
      centreId: incident.centreId,
    });

    return NextResponse.json({
      success: true,
      incident,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
