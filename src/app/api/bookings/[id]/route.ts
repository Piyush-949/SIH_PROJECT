import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    const booking = await db.booking.findFirst({
      where: { OR: [{ id: bookingId }, { bookingNumber: bookingId }] },
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
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
