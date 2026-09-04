/**
 * KRISHI SETU — Agmarknet Live Mandi Price Fetcher
 * Source: data.gov.in / eNAM API — Daily Commodity Arrival Prices
 * Resource: Agmarknet Price & Arrivals dataset (public, no auth required for read)
 *
 * Dataset URL:
 * https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
 *
 * Documentation: https://agmarknet.gov.in/
 */

export interface MandiPrice {
  market: string;
  district: string;
  state: string;
  commodity: string;
  variety: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalDate: string;
  source: "live" | "cached" | "fallback";
}

export interface MarketPriceSummary {
  cropName: string;
  cropHindi: string;
  nationalAvgModal: number;
  highestPrice: number;
  lowestPrice: number;
  topMarket: string;
  priceVsMsp: number; // percentage diff: positive = above MSP
  sampleCount: number;
  lastUpdated: string;
  prices: MandiPrice[];
  source: "live" | "cached" | "fallback";
}

// ─── Fallback data (realistic estimates based on recent mandi trends) ─────────
const MANDI_FALLBACK: Record<string, MarketPriceSummary> = {
  Wheat: {
    cropName: "Wheat",
    cropHindi: "गेहूँ",
    nationalAvgModal: 2480,
    highestPrice: 2650,
    lowestPrice: 2310,
    topMarket: "Khanna Mandi, Punjab",
    priceVsMsp: 2.3,
    sampleCount: 847,
    lastUpdated: new Date().toISOString(),
    source: "fallback",
    prices: [
      { market: "Khanna", district: "Ludhiana", state: "Punjab", commodity: "Wheat", variety: "Desi", minPrice: 2410, maxPrice: 2650, modalPrice: 2530, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
      { market: "Karnal", district: "Karnal", state: "Haryana", commodity: "Wheat", variety: "PBW343", minPrice: 2350, maxPrice: 2600, modalPrice: 2480, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
      { market: "Hapur", district: "Hapur", state: "Uttar Pradesh", commodity: "Wheat", variety: "HD2967", minPrice: 2310, maxPrice: 2540, modalPrice: 2430, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
    ],
  },
  Paddy: {
    cropName: "Paddy",
    cropHindi: "धान",
    nationalAvgModal: 2200,
    highestPrice: 2420,
    lowestPrice: 2050,
    topMarket: "Warangal Mandi, Telangana",
    priceVsMsp: -4.3,
    sampleCount: 612,
    lastUpdated: new Date().toISOString(),
    source: "fallback",
    prices: [
      { market: "Warangal", district: "Warangal", state: "Telangana", commodity: "Paddy", variety: "IR64", minPrice: 2100, maxPrice: 2420, modalPrice: 2260, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
      { market: "Amritsar", district: "Amritsar", state: "Punjab", commodity: "Paddy", variety: "PR121", minPrice: 2050, maxPrice: 2380, modalPrice: 2200, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
    ],
  },
  Maize: {
    cropName: "Maize",
    cropHindi: "मक्का",
    nationalAvgModal: 2180,
    highestPrice: 2340,
    lowestPrice: 1980,
    topMarket: "Gulbarga Mandi, Karnataka",
    priceVsMsp: -2.0,
    sampleCount: 423,
    lastUpdated: new Date().toISOString(),
    source: "fallback",
    prices: [
      { market: "Gulbarga", district: "Gulbarga", state: "Karnataka", commodity: "Maize", variety: "Hybrid", minPrice: 2050, maxPrice: 2340, modalPrice: 2200, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
      { market: "Indore", district: "Indore", state: "Madhya Pradesh", commodity: "Maize", variety: "Yellow", minPrice: 1980, maxPrice: 2300, modalPrice: 2150, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
    ],
  },
  Soybean: {
    cropName: "Soybean",
    cropHindi: "सोयाबीन",
    nationalAvgModal: 4750,
    highestPrice: 5100,
    lowestPrice: 4400,
    topMarket: "Indore Mandi, Madhya Pradesh",
    priceVsMsp: -2.9,
    sampleCount: 298,
    lastUpdated: new Date().toISOString(),
    source: "fallback",
    prices: [
      { market: "Indore", district: "Indore", state: "Madhya Pradesh", commodity: "Soybean", variety: "Yellow", minPrice: 4600, maxPrice: 5100, modalPrice: 4850, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
      { market: "Latur", district: "Latur", state: "Maharashtra", commodity: "Soybean", variety: "Yellow", minPrice: 4400, maxPrice: 4980, modalPrice: 4700, arrivalDate: new Date().toISOString().split("T")[0], source: "fallback" },
    ],
  },
};

// ─── In-memory cache ──────────────────────────────────────────────────────────
const priceCache: Map<string, { data: MarketPriceSummary; expiry: number }> = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6-hour cache for price data

/**
 * Fetches live mandi prices for a commodity from Agmarknet via data.gov.in.
 */
async function fetchAgmarknetPrices(
  commodity: string,
  state?: string,
  limit = 30
): Promise<MandiPrice[]> {
  const apiKey =
    process.env.DATA_GOV_IN_API_KEY ||
    "579b464db66ec23bdd000001cdd3946e44ce4aab825641fb7d15b68";

  const today = new Date();
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 7);
  const fmtDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  let url = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=${limit}&filters[Commodity]=${encodeURIComponent(commodity)}`;
  if (state) url += `&filters[State]=${encodeURIComponent(state)}`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: { Accept: "application/json" },
  });

  if (!res.ok) throw new Error(`Agmarknet API returned ${res.status}`);
  const json = await res.json();
  const records: any[] = json?.records || [];

  return records
    .filter((r) => r["Modal Price"] || r["modal_price"] || r["Modal_Price"])
    .map((r) => ({
      market: r["Market"] || r["market_name"] || r["Market_Name"] || "Unknown",
      district: r["District"] || r["district"] || "",
      state: r["State"] || r["state"] || "",
      commodity: r["Commodity"] || r["commodity"] || commodity,
      variety: r["Variety"] || r["variety"] || "Standard",
      minPrice: parseFloat(r["Min Price"] || r["min_price"] || r["Min_Price"] || "0"),
      maxPrice: parseFloat(r["Max Price"] || r["max_price"] || r["Max_Price"] || "0"),
      modalPrice: parseFloat(r["Modal Price"] || r["modal_price"] || r["Modal_Price"] || "0"),
      arrivalDate:
        r["Arrival Date"] || r["arrival_date"] || r["Arrival_Date"] || new Date().toISOString().split("T")[0],
      source: "live" as const,
    }))
    .filter((p) => p.modalPrice > 0);
}

/**
 * Get market price summary for a crop.
 */
export async function getMarketPrices(
  cropName: string,
  mspPerQuintal?: number
): Promise<MarketPriceSummary> {
  const cacheKey = `mandi_${cropName}`;
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    const agmarknetName = cropToAgmarknet(cropName);
    const prices = await fetchAgmarknetPrices(agmarknetName);

    if (!prices.length) throw new Error("No prices returned");

    const modalPrices = prices.map((p) => p.modalPrice).filter((p) => p > 0);
    const nationalAvgModal = Math.round(modalPrices.reduce((a, b) => a + b, 0) / modalPrices.length);
    const highestPrice = Math.max(...modalPrices);
    const lowestPrice = Math.min(...modalPrices);
    const topEntry = prices.reduce((a, b) => (a.modalPrice > b.modalPrice ? a : b));

    const priceVsMsp = mspPerQuintal
      ? Math.round(((nationalAvgModal - mspPerQuintal) / mspPerQuintal) * 100 * 10) / 10
      : 0;

    const summary: MarketPriceSummary = {
      cropName,
      cropHindi: MANDI_FALLBACK[cropName]?.cropHindi || cropName,
      nationalAvgModal,
      highestPrice,
      lowestPrice,
      topMarket: `${topEntry.market}, ${topEntry.state}`,
      priceVsMsp,
      sampleCount: prices.length,
      lastUpdated: new Date().toISOString(),
      prices: prices.slice(0, 10),
      source: "live",
    };

    priceCache.set(cacheKey, { data: summary, expiry: Date.now() + CACHE_TTL_MS });
    console.log(`[Agmarknet] Loaded ${prices.length} price records for ${cropName}`);
    return summary;
  } catch (err: any) {
    console.warn(`[Agmarknet] ${cropName} fetch failed: ${err.message}. Using fallback.`);
    const fallback = MANDI_FALLBACK[cropName] || MANDI_FALLBACK["Wheat"];
    // Update priceVsMsp if MSP provided
    if (mspPerQuintal) {
      fallback.priceVsMsp = Math.round(
        ((fallback.nationalAvgModal - mspPerQuintal) / mspPerQuintal) * 100 * 10
      ) / 10;
    }
    return { ...fallback, source: "fallback" };
  }
}

/**
 * Get prices for all major crops at once.
 */
export async function getAllMarketPrices(): Promise<MarketPriceSummary[]> {
  const crops = ["Wheat", "Paddy", "Maize", "Soybean"];
  const results = await Promise.allSettled(crops.map((c) => getMarketPrices(c)));
  return results.map((r, i) =>
    r.status === "fulfilled" ? r.value : { ...MANDI_FALLBACK[crops[i]], source: "fallback" as const }
  );
}

function cropToAgmarknet(cropName: string): string {
  const map: Record<string, string> = {
    Wheat: "Wheat",
    Paddy: "Paddy(Dhan)(Common)",
    Maize: "Maize",
    Soybean: "Soyabean",
    Cotton: "Cotton",
    Groundnut: "Groundnut",
  };
  return map[cropName] || cropName;
}

export { MANDI_FALLBACK };
