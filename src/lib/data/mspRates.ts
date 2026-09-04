/**
 * KRISHI SETU — Real MSP Rate Fetcher
 * Sources: data.gov.in (Ministry of Agriculture & Farmers Welfare)
 * CACP MSP 2025-26 official rates with live API fetch + 24hr cache + fallback table.
 */

export interface MspRate {
  crop: string;
  cropHindi: string;
  season: "Kharif" | "Rabi";
  mspPerQuintal: number;
  effectiveYear: string;
  source: "live" | "cached" | "fallback";
  lastUpdated: string;
}

// ─── Official CACP MSP 2025-26 Fallback Table ────────────────────────────────
// Source: https://cacp.dacnet.nic.in/
// Press Release: PIB, Ministry of Agriculture & Farmers Welfare
const OFFICIAL_MSP_FALLBACK: Record<string, MspRate> = {
  Wheat: {
    crop: "Wheat",
    cropHindi: "गेहूँ (Kanak)",
    season: "Rabi",
    mspPerQuintal: 2425,   // ₹2,425/Q — Rabi 2025-26 CACP recommendation
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  },
  Paddy: {
    crop: "Paddy",
    cropHindi: "धान (Rice)",
    season: "Kharif",
    mspPerQuintal: 2300,   // ₹2,300/Q — Kharif 2025-26
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  },
  Maize: {
    crop: "Maize",
    cropHindi: "मक्का (Corn)",
    season: "Kharif",
    mspPerQuintal: 2225,   // ₹2,225/Q — Kharif 2025-26
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  },
  Soybean: {
    crop: "Soybean",
    cropHindi: "सोयाबीन (Yellow)",
    season: "Kharif",
    mspPerQuintal: 4892,   // ₹4,892/Q — Kharif 2025-26
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  },
  Cotton: {
    crop: "Cotton",
    cropHindi: "कपास (Medium Staple)",
    season: "Kharif",
    mspPerQuintal: 7121,   // ₹7,121/Q — Kharif 2025-26
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  },
  Groundnut: {
    crop: "Groundnut",
    cropHindi: "मूँगफली",
    season: "Kharif",
    mspPerQuintal: 6783,   // ₹6,783/Q — Kharif 2025-26
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  },
};

// ─── In-memory Cache ─────────────────────────────────────────────────────────
let mspCache: Record<string, MspRate> = {};
let mspCacheExpiry = 0;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetches real MSP data from data.gov.in OGD API.
 * Resource ID: Ministry of Agriculture MSP dataset.
 * Falls back gracefully if API is unavailable.
 */
async function fetchLiveMspRates(): Promise<Record<string, MspRate>> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY;

  // data.gov.in MSP resource — commodity prices dataset
  const url = `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=${apiKey || "579b464db66ec23bdd000001cdd3946e44ce4aab825641fb7d15b68"}&format=json&limit=50&filters[year]=2025-26`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) throw new Error(`data.gov.in returned ${res.status}`);

    const json = await res.json();
    const records: any[] = json?.records || [];

    if (!records.length) throw new Error("No MSP records in response");

    const rates: Record<string, MspRate> = {};

    for (const r of records) {
      // Normalize crop name from API field names
      const cropRaw: string =
        r["commodity"] || r["crop"] || r["crop_name"] || "";
      const priceRaw = parseFloat(
        r["msp"] || r["price"] || r["msp_per_quintal"] || "0"
      );

      if (!cropRaw || !priceRaw) continue;

      // Map API crop names to our internal names
      const cropKey = normalizeCropName(cropRaw);
      if (!cropKey) continue;

      rates[cropKey] = {
        crop: cropKey,
        cropHindi: OFFICIAL_MSP_FALLBACK[cropKey]?.cropHindi || cropKey,
        season: inferSeason(cropKey),
        mspPerQuintal: priceRaw,
        effectiveYear: r["year"] || r["season_year"] || "2025-26",
        source: "live",
        lastUpdated: new Date().toISOString(),
      };
    }

    // Merge with fallback for any missing crops
    for (const [key, fallback] of Object.entries(OFFICIAL_MSP_FALLBACK)) {
      if (!rates[key]) {
        rates[key] = { ...fallback, source: "cached" };
      }
    }

    console.log(
      `[MSP] Loaded ${Object.keys(rates).length} MSP rates from data.gov.in`
    );
    return rates;
  } catch (err: any) {
    console.warn(`[MSP] Live fetch failed (${err.message}), using fallback rates`);
    return Object.fromEntries(
      Object.entries(OFFICIAL_MSP_FALLBACK).map(([k, v]) => [
        k,
        { ...v, source: "fallback" as const },
      ])
    );
  }
}

function normalizeCropName(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  if (lower.includes("wheat") || lower.includes("gehu")) return "Wheat";
  if (lower.includes("paddy") || lower.includes("dhan") || lower.includes("rice")) return "Paddy";
  if (lower.includes("maize") || lower.includes("makka") || lower.includes("corn")) return "Maize";
  if (lower.includes("soybean") || lower.includes("soya")) return "Soybean";
  if (lower.includes("cotton") || lower.includes("kapas")) return "Cotton";
  if (lower.includes("groundnut") || lower.includes("moongphali")) return "Groundnut";
  return null;
}

function inferSeason(crop: string): "Kharif" | "Rabi" {
  const kharif = ["Paddy", "Maize", "Soybean", "Cotton", "Groundnut"];
  return kharif.includes(crop) ? "Kharif" : "Rabi";
}

/**
 * Get MSP rates — returns cached rates if fresh, else fetches live.
 */
export async function getMspRates(): Promise<Record<string, MspRate>> {
  if (Date.now() < mspCacheExpiry && Object.keys(mspCache).length > 0) {
    return mspCache;
  }

  const rates = await fetchLiveMspRates();
  mspCache = rates;
  mspCacheExpiry = Date.now() + CACHE_TTL_MS;
  return rates;
}

/**
 * Get MSP rate for a specific crop (with fallback).
 */
export async function getMspForCrop(cropName: string): Promise<MspRate> {
  const rates = await getMspRates();
  const key = normalizeCropName(cropName) || cropName;
  return rates[key] || OFFICIAL_MSP_FALLBACK[key] || {
    crop: cropName,
    cropHindi: cropName,
    season: "Rabi",
    mspPerQuintal: 2275,
    effectiveYear: "2025-26",
    source: "fallback",
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Returns all MSP rates as an array sorted by rate (descending).
 */
export async function getAllMspRates(): Promise<MspRate[]> {
  const rates = await getMspRates();
  return Object.values(rates).sort((a, b) => b.mspPerQuintal - a.mspPerQuintal);
}

// Convenience sync fallback for client-side rendering
export const MSP_FALLBACK_TABLE = OFFICIAL_MSP_FALLBACK;
