import { NextRequest, NextResponse } from "next/server";
import { getWeather } from "@/lib/data/weather";

/**
 * GET /api/weather?lat=29.68&lng=76.99&city=Karnal&district=Karnal
 * Returns current weather + advisory for the given coordinates.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lat = parseFloat(searchParams.get("lat") || "28.6139");
    const lng = parseFloat(searchParams.get("lng") || "77.2090");
    const city = searchParams.get("city") || "Unknown";
    const district = searchParams.get("district") || "Unknown";

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { success: false, error: "Invalid lat/lng parameters" },
        { status: 400 }
      );
    }

    const weather = await getWeather(lat, lng, city, district);

    return NextResponse.json(
      { success: true, weather },
      {
        headers: {
          "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Weather fetch failed" },
      { status: 500 }
    );
  }
}
