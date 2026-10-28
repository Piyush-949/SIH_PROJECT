import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId } = body;

    const booking = await db.booking.findFirst({
      where: { OR: [{ id: bookingId }, { bookingNumber: bookingId }] },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    const updated = await db.booking.update({
      where: { id: booking.id },
      data: { status: "RESCHEDULED" },
    });

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
