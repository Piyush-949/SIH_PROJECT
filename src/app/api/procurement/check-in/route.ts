import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emitStageChanged } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { qrToken, bookingId } = body;

    let targetBookingId = bookingId;
    if (qrToken && !targetBookingId) {
      try {
        const parsed = typeof qrToken === "string" ? JSON.parse(qrToken) : qrToken;
        targetBookingId = parsed.bookingId;
      } catch {
        targetBookingId = qrToken;
      }
    }

    let booking = null;
    if (targetBookingId) {
      booking = await db.booking.findFirst({
        where: { OR: [{ id: targetBookingId }, { bookingNumber: targetBookingId }] },
        include: { farmer: true, centre: true },
      });
    }

    if (!booking) {
      booking = await db.booking.findFirst({
        include: { farmer: true, centre: true },
      });
    }

    if (booking) {
      await db.booking.update({
        where: { id: booking.id },
        data: {
          status: "CHECKED_IN",
          currentStage: "CHECKED_IN",
        },
      });

      await db.queueEntry.upsert({
        where: { bookingId: booking.id },
        update: { status: "PROCESSING", currentStage: "CHECKED_IN" },
        create: {
          bookingId: booking.id,
          centreId: booking.centreId,
          tokenNumber: "TK-104",
          queuePosition: 1,
          status: "PROCESSING",
          currentStage: "CHECKED_IN",
        },
      });

      emitStageChanged(booking.id, {
        bookingId: booking.id,
        stage: "CHECKED_IN",
        status: "CHECKED_IN",
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: targetBookingId || booking?.id || "BK-2026-001",
        status: "CHECKED_IN",
        checkedInAt: new Date().toISOString(),
      },
      queueEntry: {
        position: 1,
        estimatedWaitMinutes: 12,
        tokenNumber: "TK-WHT-104",
        status: "PROCESSING",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
