import { NextResponse } from "next/server";
import { INDIAN_STATES, POPULAR_INDIAN_LOCATIONS } from "@/lib/data/indianStates";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pincodeParam = searchParams.get("pincode")?.trim();
    const queryParam = searchParams.get("q")?.trim();

    // 1. Exact 6-Digit Indian PIN Code Lookup
    if (pincodeParam && /^\d{6}$/.test(pincodeParam)) {
      try {
        const pinRes = await fetch(`https://api.postalpincode.in/pincode/${pincodeParam}`, {
          signal: AbortSignal.timeout(3500),
        });
        if (pinRes.ok) {
          const pinData = await pinRes.json();
          if (Array.isArray(pinData) && pinData[0]?.Status === "Success" && pinData[0]?.PostOffice?.length > 0) {
            const offices = pinData[0].PostOffice;
            const first = offices[0];
            return NextResponse.json({
              success: true,
              source: "IndiaPost",
              pincode: pincodeParam,
              district: first.District || "",
              state: first.State || "",
              country: "India",
              villages: offices.map((o: any) => o.Name).filter(Boolean),
            });
          }
        }
      } catch (err: any) {
        console.warn("[Location API] IndiaPost PIN error:", err.message);
      }

      // Local fallback for PIN Code
      const localMatch = POPULAR_INDIAN_LOCATIONS.find((l) => l.pincode === pincodeParam);
      if (localMatch) {
        return NextResponse.json({
          success: true,
          source: "LocalRegistry",
          pincode: pincodeParam,
          district: localMatch.district,
          state: localMatch.state,
          country: "India",
          villages: [localMatch.village],
        });
      }
    }

    // 2. City, Village, Town, or Gram Panchayat Search
    if (queryParam && queryParam.length >= 2) {
      const qLower = queryParam.toLowerCase();

      // Check local curated list first (instant 0ms response)
      const localMatches = POPULAR_INDIAN_LOCATIONS.filter(
        (l) =>
          l.village.toLowerCase().includes(qLower) ||
          l.district.toLowerCase().includes(qLower) ||
          l.state.toLowerCase().includes(qLower) ||
          l.pincode.startsWith(qLower)
      );

      // Query India Post official API if query is >= 3 chars
      let apiMatches: any[] = [];
      if (queryParam.length >= 3) {
        try {
          const postRes = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(queryParam)}`, {
            signal: AbortSignal.timeout(3500),
          });
          if (postRes.ok) {
            const postData = await postRes.json();
            if (Array.isArray(postData) && postData[0]?.Status === "Success" && Array.isArray(postData[0]?.PostOffice)) {
              apiMatches = postData[0].PostOffice.slice(0, 8).map((po: any) => ({
                village: po.Name,
                district: po.District,
                state: po.State,
                pincode: po.Pincode,
              }));
            }
          }
        } catch {
          // Timeout or network error - gracefully rely on local matches
        }
      }

      // Merge and deduplicate by pincode + village
      const combined = [...localMatches, ...apiMatches];
      const seen = new Set<string>();
      const results: any[] = [];

      for (const item of combined) {
        if (!item.village || !item.district || !item.state) continue;
        const key = `${item.village.toLowerCase()}_${item.district.toLowerCase()}_${item.pincode}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            village: item.village,
            district: item.district,
            state: item.state,
            pincode: item.pincode,
            label: `${item.village}, ${item.district}, ${item.state} (${item.pincode})`,
          });
        }
        if (results.length >= 10) break;
      }

      return NextResponse.json({
        success: true,
        query: queryParam,
        results,
      });
    }

    // Default: return list of states
    return NextResponse.json({
      success: true,
      states: INDIAN_STATES,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
