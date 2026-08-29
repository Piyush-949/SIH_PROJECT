import { NextResponse } from "next/server";
import { calculateMspPayment } from "@/lib/algorithms/mspCalculation";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { quantityQuintals = 35, acceptedQuantityQuintals, mspRate = 2275, mspRatePerQuintal } = body;
    const qty = acceptedQuantityQuintals !== undefined ? Number(acceptedQuantityQuintals) : Number(quantityQuintals);
    const rate = mspRatePerQuintal !== undefined ? Number(mspRatePerQuintal) : Number(mspRate);

    const res = calculateMspPayment({
      acceptedQuantityQuintals: qty,
      mspRatePerQuintal: rate,
      qualityDeductionPercentage: 0,
      handlingFeePerQuintal: 0,
    });

    return NextResponse.json({
      success: true,
      ...res,
      grossAmount: res.grossAmount,
      finalPayableAmount: res.netPayableAmount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
