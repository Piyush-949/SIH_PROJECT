import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitStageChanged } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      bookingId,
      moisturePercentage = 11.2,
      foreignMatterPercentage = 0.5,
      damagedGrainPercentage = 0.8,
      grade,
      decision,
    } = body;

    const moisture = Number(moisturePercentage);
    const assignedGrade = grade || (moisture > 18 ? "REJECT" : (moisture > 14 ? "GRADE_B" : "GRADE_A"));
    const assignedDecision = decision || (assignedGrade === "REJECT" ? "REJECT" : "ACCEPTED");

    let deductionPercentage = 0;
    if (moisture > 12.0 && assignedGrade !== "REJECT") {
      deductionPercentage = Number(((moisture - 12.0) * 1.0).toFixed(2));
    }

    let booking = null;
    if (bookingId) {
      booking = await db.booking.findFirst({
        where: { OR: [{ id: bookingId }, { bookingNumber: bookingId }] },
      });
    }

    if (booking) {
      const inspector = await db.user.findFirst({ where: { role: "QUALITY_INSPECTOR" } });
      await db.qualityInspection.upsert({
        where: { bookingId: booking.id },
        update: {
          moisturePercentage: moisture,
          foreignMaterialPercentage: foreignMatterPercentage,
          damagedGrainPercentage: damagedGrainPercentage,
          assignedGrade,
          decision: assignedDecision,
          acceptedQuantityQuintals: assignedDecision === "REJECT" ? 0 : booking.estimatedQuantityQuintals,
          rejectedQuantityQuintals: assignedDecision === "REJECT" ? booking.estimatedQuantityQuintals : 0,
          deductionPercentage,
        },
        create: {
          bookingId: booking.id,
          inspectorId: inspector?.id || "usr_inspector_1",
          moisturePercentage: moisture,
          foreignMaterialPercentage: foreignMatterPercentage,
          damagedGrainPercentage: damagedGrainPercentage,
          assignedGrade,
          decision: assignedDecision,
          acceptedQuantityQuintals: assignedDecision === "REJECT" ? 0 : booking.estimatedQuantityQuintals,
          rejectedQuantityQuintals: assignedDecision === "REJECT" ? booking.estimatedQuantityQuintals : 0,
          deductionPercentage,
        },
      });

      emitStageChanged(booking.id, {
        bookingId: booking.id,
        stage: "QUALITY_INSPECTED",
        grade: assignedGrade,
        decision: assignedDecision,
      });
    }

    return NextResponse.json({
      success: true,
      inspection: {
        id: "insp_" + Date.now(),
        bookingId: bookingId || "BK-2026-001",
        grade: assignedGrade,
        moisturePercentage: moisture,
        foreignMatterPercentage,
        damagedGrainPercentage,
        deductionPercentage,
        decision: assignedDecision,
        inspectedAt: new Date().toISOString(),
      },
      status: "PROCUREMENT_ACCEPTED",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
