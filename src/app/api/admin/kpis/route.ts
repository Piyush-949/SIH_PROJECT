import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      totalProcurementQuintals: 14250,
      totalActiveBookings: 342,
      averageWaitMinutes: 24,
      totalDisbursedAmount: 32400000,
      activeIncidentsCount: 1,
      kpis: [
        {
          id: "turnaround_time",
          label: "Average Turnaround Time",
          value: "45 mins",
          baseline: "14 hours",
          change: "-94.6%",
          status: "EXCELLENT",
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
