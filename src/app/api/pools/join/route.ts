import { NextResponse } from "next/server";
import { sharedPools } from "../poolStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { poolId, farmerName = "Farmer", farmerPhone, quantity = 10.0, village = "Village" } = body;

    const pool = sharedPools.find((p: any) => p.id === poolId);
    if (!pool) {
      return NextResponse.json({ success: false, error: "Pool not found" }, { status: 404 });
    }

    const joinQty = Number(quantity);
    if (joinQty > pool.availableCapacityQuintals) {
      return NextResponse.json(
        { success: false, error: `Quantity exceeds available pool capacity (${pool.availableCapacityQuintals} Q remaining)` },
        { status: 400 }
      );
    }

    pool.filledQuantityQuintals += joinQty;
    pool.availableCapacityQuintals -= joinQty;
    pool.participants.push({
      farmerName,
      quantity: joinQty,
      village,
    });

    if (pool.availableCapacityQuintals <= 0) {
      pool.status = "FULL";
    }

    return NextResponse.json({
      success: true,
      pool,
      joinedQuantity: joinQty,
      collectiveTokenNumber: `${pool.poolNumber}-TK`,
      message: `Successfully booked ${joinQty}Q slot in shared transport ${pool.poolNumber}!`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to join shared pool" },
      { status: 500 }
    );
  }
}
