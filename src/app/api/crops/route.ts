import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const crops = await db.crop.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      crops: crops.map((c) => ({
        id: c.id,
        code: c.name.slice(0, 3).toUpperCase(),
        name: c.name,
        nameHindi: c.nameHindi,
        category: c.category,
        basePricePerQuintal: c.basePricePerQuintal,
        moistureStandardMax: c.moistureStandardMax,
        foreignMaterialMax: c.foreignMaterialMax,
        damagedGrainMax: c.damagedGrainMax,
        baseProcessingMinutesPerQuintal: c.baseProcessingMinutesPerQuintal,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
