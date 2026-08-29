import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const incidents = await db.operationalIncident.findMany({
      include: { centre: true },
      orderBy: { reportedAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      incidents,
      total: incidents.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
