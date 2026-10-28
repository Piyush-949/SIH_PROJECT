import { NextRequest, NextResponse } from "next/server";
import {
  generateRecommendationExplanation,
  generateMarketSummary,
  generateFarmerAdvisory,
  type CentreRecommendationInput,
} from "@/lib/data/geminiClient";

/**
 * POST /api/ai/recommend
 * Generate natural-language AI recommendation for a procurement centre.
 *
 * Body:
 * {
 *   type: "centre" | "market" | "advisory",
 *   ...input fields
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = body.type as "centre" | "market" | "advisory";

    if (!type) {
      return NextResponse.json(
        { success: false, error: "Missing 'type' field" },
        { status: 400 }
      );
    }

    if (type === "centre") {
      const input: CentreRecommendationInput = {
        centreName: body.centreName || "Procurement Centre",
        distanceKm: body.distanceKm || 10,
        waitMinutes: body.waitMinutes || 30,
        loadPercentage: body.loadPercentage || 50,
        score: body.score || 70,
        weatherCondition: body.weatherCondition,
        activeIncidents: body.activeIncidents || 0,
        cropName: body.cropName,
        farmerName: body.farmerName,
      };

      const result = await generateRecommendationExplanation(input);
      return NextResponse.json({ success: true, ...result });
    }

    if (type === "market") {
      const summary = await generateMarketSummary({
        cropName: body.cropName || "Wheat",
        mspPerQuintal: body.mspPerQuintal || 2425,
        mandiAvgPrice: body.mandiAvgPrice || 2480,
        highestMarket: body.highestMarket || "National Average",
      });
      return NextResponse.json({ success: true, text: summary, source: "gemini" });
    }

    if (type === "advisory") {
      const advisory = await generateFarmerAdvisory(
        body.farmerName || "Farmer",
        body.cropName || "Wheat",
        body.quantity || 20,
        body.district || "Unknown",
        body.weatherCondition || "Clear"
      );
      return NextResponse.json({ success: true, text: advisory, source: "gemini" });
    }

    return NextResponse.json(
      { success: false, error: `Unknown type: ${type}` },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "AI generation failed" },
      { status: 500 }
    );
  }
}
