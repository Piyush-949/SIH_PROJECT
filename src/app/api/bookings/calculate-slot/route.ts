import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { quantity, quantityQuintals, cropId } = body;
    const qty = quantity !== undefined && quantity !== null ? Number(quantity) : (quantityQuintals !== undefined ? Number(quantityQuintals) : 30);

    if (qty <= 0) {
      return NextResponse.json(
        { success: false, error: "Booking quantity must be greater than 0 Quintals" },
        { status: 400 }
      );
    }

    const baseTime = 15;
    const qtyFactor = Math.round(qty * 0.5);
    const cropComplexity = (cropId === 'PADDY' || cropId === 'SOYBEAN') ? 10 : 5;
    const inspectionTime = 10;
    const delayPenalty = 0;
    const estimatedMinutes = baseTime + qtyFactor + cropComplexity + inspectionTime + delayPenalty;

    return NextResponse.json({
      success: true,
      estimatedMinutes,
      estimatedTimeMinutes: estimatedMinutes,
      breakdown: {
        baseTime,
        qtyFactor,
        cropComplexity,
        inspectionTime,
        delayPenalty,
      },
      suggestedSlots: [
        {
          id: "slot_01",
          startTime: "2026-08-27T09:00:00Z",
          endTime: "2026-08-27T10:00:00Z",
          slotTime: "09:00 AM - 10:00 AM",
          availableCapacity: 150,
          availableCapacityQuintals: 500,
          congestionLevel: "GREEN",
        },
        {
          id: "slot_02",
          startTime: "2026-08-27T10:00:00Z",
          endTime: "2026-08-27T11:00:00Z",
          slotTime: "10:00 AM - 11:00 AM",
          availableCapacity: 120,
          availableCapacityQuintals: 450,
          congestionLevel: "GREEN",
        },
      ],
      recommendedSlots: [
        {
          slotTime: "09:00 AM - 10:00 AM",
          congestionLevel: "GREEN",
          availableCapacityQuintals: 500,
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
