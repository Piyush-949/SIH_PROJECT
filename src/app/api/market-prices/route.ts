import { NextRequest, NextResponse } from "next/server";
import { getAllMarketPrices, getMarketPrices } from "@/lib/data/agmarknet";
import { getMspForCrop } from "@/lib/data/mspRates";

/**
 * GET /api/market-prices
 * Returns live mandi prices for all major crops from Agmarknet.
 *
 * GET /api/market-prices?crop=Wheat
 * Returns prices for a specific crop with MSP comparison.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const cropParam = searchParams.get("crop");

    if (cropParam) {
      // Single crop
      const mspRate = await getMspForCrop(cropParam);
      const prices = await getMarketPrices(cropParam, mspRate.mspPerQuintal);
      return NextResponse.json(
        {
          success: true,
          crop: cropParam,
          mspRate,
          marketPrices: prices,
          summary: {
            msP: mspRate.mspPerQuintal,
            mandiAvg: prices.nationalAvgModal,
            bestPrice: prices.highestPrice,
            bestMarket: prices.topMarket,
            priceVsMspPct: prices.priceVsMsp,
            isAboveMsp: prices.priceVsMsp >= 0,
            recommendation:
              prices.priceVsMsp >= 5
                ? "Open market prices are significantly above MSP today. Compare both options."
                : "MSP procurement ensures guaranteed payment at official government rate.",
          },
        },
        {
          headers: {
            "Cache-Control": "public, max-age=21600, stale-while-revalidate=43200",
          },
        }
      );
    }

    // All crops
    const [allPrices, wheatMsp, paddyMsp, maizeMsp, soybeanMsp] =
      await Promise.allSettled([
        getAllMarketPrices(),
        getMspForCrop("Wheat"),
        getMspForCrop("Paddy"),
        getMspForCrop("Maize"),
        getMspForCrop("Soybean"),
      ]);

    const prices =
      allPrices.status === "fulfilled" ? allPrices.value : [];
    const mspMap: Record<string, number> = {
      Wheat: wheatMsp.status === "fulfilled" ? wheatMsp.value.mspPerQuintal : 2425,
      Paddy: paddyMsp.status === "fulfilled" ? paddyMsp.value.mspPerQuintal : 2300,
      Maize: maizeMsp.status === "fulfilled" ? maizeMsp.value.mspPerQuintal : 2225,
      Soybean: soybeanMsp.status === "fulfilled" ? soybeanMsp.value.mspPerQuintal : 4892,
    };

    return NextResponse.json(
      {
        success: true,
        crops: prices.map((p) => ({
          ...p,
          mspPerQuintal: mspMap[p.cropName] || 0,
          priceVsMsp: mspMap[p.cropName]
            ? Math.round(((p.nationalAvgModal - mspMap[p.cropName]) / mspMap[p.cropName]) * 1000) / 10
            : null,
        })),
        fetchedAt: new Date().toISOString(),
        source: "Agmarknet / data.gov.in",
      },
      {
        headers: {
          "Cache-Control": "public, max-age=21600, stale-while-revalidate=43200",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Market price fetch failed" },
      { status: 500 }
    );
  }
}
