import { NextResponse } from "next/server";

export async function GET() {
  try {
    const recommendations = [
      {
        id: "rec_01",
        title: "ACTION RECOMMENDED: High Congestion at Kalmeshwar (96%)",
        description: "Redirect 15 incoming bookings to nearby Nagpur Central APMC (42% capacity, 4 docks open)",
        actionType: "REDIRECT_TRAFFIC",
        fromCentreId: "centre_kalmeshwar_sub",
        toCentreId: "centre_nagpur_central",
        estimatedReductionPercent: 28,
      },
    ];

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
