import { NextResponse } from "next/server";
import { sharedPools } from "./poolStore";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const village = searchParams.get("village");
    const district = searchParams.get("district");
    const crop = searchParams.get("crop");

    let filtered = [...sharedPools];
    if (village) {
      filtered = filtered.filter((p) => p.originVillage.toLowerCase().includes(village.toLowerCase()));
    }
    if (district) {
      filtered = filtered.filter((p) => p.district.toLowerCase().includes(district.toLowerCase()));
    }
    if (crop) {
      filtered = filtered.filter((p) => p.cropType.toLowerCase() === crop.toLowerCase());
    }

    return NextResponse.json({
      success: true,
      pools: filtered,
      totalOpenPools: filtered.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch shared vehicle pools" },
      { status: 500 }
    );
  }
}
