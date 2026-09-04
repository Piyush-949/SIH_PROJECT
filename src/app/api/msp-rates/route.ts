import { NextRequest, NextResponse } from "next/server";
import { getAllMspRates, getMspForCrop } from "@/lib/data/mspRates";

/**
 * GET /api/msp-rates
 * Returns all official MSP rates for the current season (2025-26).
 * Sources data.gov.in with 24-hour cache.
 *
 * GET /api/msp-rates?crop=Wheat
 * Returns MSP for a specific crop.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const crop = searchParams.get("crop");

    if (crop) {
      const rate = await getMspForCrop(crop);
      return NextResponse.json(
        { success: true, ...rate },
        {
          headers: {
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800",
          },
        }
      );
    }

    const allRates = await getAllMspRates();
    return NextResponse.json(
      {
        success: true,
        mspRates: allRates,
        season: "2025-26",
        authority: "CACP — Commission for Agricultural Costs & Prices",
        source: "data.gov.in / Ministry of Agriculture & Farmers Welfare",
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=172800",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "MSP fetch failed" },
      { status: 500 }
    );
  }
}
