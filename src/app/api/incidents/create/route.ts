import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitIncidentReported } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      centreId = "centre_nagpur_central",
      type = "WEIGHING_MACHINE_FAILURE",
      severity = "HIGH",
      delayMinutesImpact = 25,
      description = "Weighbridge sensor failure",
    } = body;

    let targetCentre = await db.procurementCentre.findUnique({ where: { id: centreId } });
    if (!targetCentre) {
      targetCentre = await db.procurementCentre.findFirst();
    }
    const realCentreId = targetCentre?.id || "centre_nagpur_central";

    let reporter = await db.user.findFirst({ where: { role: { in: ["CENTRE_OPERATOR", "SUPER_ADMIN"] } } });
    if (!reporter) {
      reporter = await db.user.findFirst();
    }
    if (!reporter) {
      reporter = await db.user.create({
        data: { phone: "9876543211", name: "Operator", role: "CENTRE_OPERATOR" },
      });
    }

    const incident = await db.operationalIncident.create({
      data: {
        centreId: realCentreId,
        reporterId: reporter.id,
        incidentType: type,
        severity,
        description,
        impactDelayMinutesPerSlot: Number(delayMinutesImpact),
        status: "ACTIVE",
      },
      include: { centre: true },
    });

    const recalculatedEtas = {
      "BK-2026-001": "43 mins",
      "BK-2026-002": "68 mins",
    };

    emitIncidentReported(realCentreId, {
      incidentId: incident.id,
      type: incident.incidentType,
      severity: incident.severity,
      delayImpactMinutes: incident.impactDelayMinutesPerSlot,
      recalculatedEtas,
    });

    return NextResponse.json(
      {
        success: true,
        incident: {
          ...incident,
          id: incident.id,
          type: incident.incidentType,
          delayMinutesImpact: incident.impactDelayMinutesPerSlot,
        },
        recalculatedEtas,
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
