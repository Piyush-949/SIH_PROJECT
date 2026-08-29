import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitStageChanged } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      bookingId,
      grossWeight,
      tareWeight = 0,
      actualQuantity,
    } = body;

    if (grossWeight !== undefined && tareWeight !== undefined && grossWeight < tareWeight) {
      return NextResponse.json(
        { success: false, error: "Net crop weight cannot be negative. Recalibrate weighbridge." },
        { status: 400 }
      );
    }

    const bookedQty = 30.0;
    const actualQty = actualQuantity !== undefined ? Number(actualQuantity) : (grossWeight ? (grossWeight - tareWeight) / 100 : 35.0);

    const diff = Math.abs(actualQty - bookedQty);
    const discrepancyPercentage = (diff / bookedQty) * 100;
    const alertTriggered = discrepancyPercentage > 20.0;

    let booking = null;
    if (bookingId) {
      booking = await db.booking.findFirst({
        where: { OR: [{ id: bookingId }, { bookingNumber: bookingId }] },
      });
    }

    if (booking) {
      await db.booking.update({
        where: { id: booking.id },
        data: {
          actualQuantityQuintals: actualQty,
          currentStage: "PRODUCE_WEIGHED",
        },
      });

      const operator = await db.user.findFirst({ where: { role: "CENTRE_OPERATOR" } });
      await db.procurementRecord.upsert({
        where: { bookingId: booking.id },
        update: {
          grossWeightQuintals: grossWeight ? grossWeight / 100 : actualQty + 25,
          tareWeightQuintals: tareWeight ? tareWeight / 100 : 25,
          netWeightQuintals: actualQty,
          weightDiscrepancyPercentage: discrepancyPercentage,
          discrepancyFlagged: alertTriggered,
        },
        create: {
          bookingId: booking.id,
          centreId: booking.centreId,
          operatorId: operator?.id || "usr_operator_1",
          grossWeightQuintals: grossWeight ? grossWeight / 100 : actualQty + 25,
          tareWeightQuintals: tareWeight ? tareWeight / 100 : 25,
          netWeightQuintals: actualQty,
          weightDiscrepancyPercentage: discrepancyPercentage,
          discrepancyFlagged: alertTriggered,
        },
      });

      emitStageChanged(booking.id, {
        bookingId: booking.id,
        stage: "PRODUCE_WEIGHED",
        actualQuantity: actualQty,
      });
    }

    return NextResponse.json({
      success: true,
      bookingId: bookingId || "BK-2026-001",
      actualQuantity: actualQty,
      discrepancyPercentage: Number(discrepancyPercentage.toFixed(2)),
      alertTriggered,
      status: "PRODUCE_WEIGHED",
      grossWeightKg: (grossWeight || (actualQty + 25) * 100),
      tareWeightKg: (tareWeight || 2500),
      netWeightKg: actualQty * 100,
      netWeightQuintals: actualQty,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
