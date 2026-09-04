/**
 * KRISHI SETU — OpenStreetMap Nominatim Geocoding Utility
 * Free, no API key required.
 * Rate limit: 1 request/second (we throttle automatically)
 * Terms: https://operations.osmfoundation.org/policies/nominatim/
 */

export interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
  city: string;
  district: string;
  state: string;
  country: string;
  source: "nominatim" | "fallback";
}

// ─── Throttle ─────────────────────────────────────────────────────────────────
let lastNominatimCall = 0;

async function nominatimThrottle(): Promise<void> {
  const now = Date.now();
  const wait = 1100 - (now - lastNominatimCall); // 1.1s between calls
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatimCall = Date.now();
}

/**
 * Geocode a free-form address to lat/lng using Nominatim.
 */
export async function geocodeAddress(
  address: string,
  district?: string,
  state?: string
): Promise<GeocodingResult | null> {
  await nominatimThrottle();

  const query = [address, district, state, "India"].filter(Boolean).join(", ");
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=IN&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "KrishiSetu-SIH2026/1.0 (contact@krishisetu.in)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`Nominatim returned ${res.status}`);

    const results: any[] = await res.json();
    if (!results.length) return null;

    const r = results[0];
    const addr = r.address || {};

    return {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      displayName: r.display_name || query,
      city: addr.city || addr.town || addr.village || address,
      district: addr.county || addr.district || district || "",
      state: addr.state || state || "",
      country: addr.country || "India",
      source: "nominatim",
    };
  } catch (err: any) {
    console.warn(`[Geocoding] Failed for "${query}": ${err.message}`);
    return null;
  }
}

/**
 * Reverse geocode lat/lng to a human-readable address.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ district: string; state: string; displayName: string } | null> {
  await nominatimThrottle();

  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "KrishiSetu-SIH2026/1.0 (contact@krishisetu.in)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const addr = data.address || {};

    return {
      district: addr.county || addr.district || addr.city || "Unknown",
      state: addr.state || "Unknown",
      displayName: data.display_name || `${lat}, ${lon}`,
    };
  } catch {
    return null;
  }
}

/**
 * Validate and verify that a coordinate pair is within India's bounds.
 */
export function isCoordinateInIndia(lat: number, lon: number): boolean {
  // Approximate bounding box of India
  return lat >= 6.5 && lat <= 37.1 && lon >= 68.0 && lon <= 97.5;
}

/**
 * Calculate Haversine distance between two points in km.
 * (Reexported here for convenience — also in centreRecommendation.ts)
 */
export function haversineDistanceKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}
