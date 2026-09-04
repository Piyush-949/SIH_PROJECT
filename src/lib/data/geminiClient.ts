/**
 * KRISHI SETU — Google Gemini AI Client
 * Uses Gemini 1.5 Flash (free tier: 15 RPM / 1M tokens/day)
 * API Key: https://aistudio.google.com/app/apikey
 *
 * Used for:
 * - Natural language "Why we recommend this centre" explanations
 * - Personalized farmer advisories
 * - Market trend summaries
 */

interface GeminiCandidate {
  content: { parts: { text: string }[] };
  finishReason: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message: string; code: number };
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
let lastCallTime = 0;
const MIN_INTERVAL_MS = 4000; // 15 RPM = 1 call per 4 seconds

async function throttle(): Promise<void> {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastCallTime);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastCallTime = Date.now();
}

/**
 * Core Gemini API call with automatic model fallback.
 */
async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  await throttle();

  const models = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];
  let lastError = new Error("No models available");

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const body: any = {
        contents: [{ parts: [{ text: prompt }], role: "user" }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          topP: 0.8,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        ],
      };

      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      });

      const json: GeminiResponse = await res.json();

      if (json.error) {
        throw new Error(`Gemini API error (${model}): ${json.error.message}`);
      }
      if (!json.candidates?.length) {
        throw new Error(`No candidates in Gemini response (${model})`);
      }

      const result = json.candidates[0].content.parts
        .filter((p) => p.text)
        .map((p) => p.text)
        .join("")
        .trim();

      if (result) return result;
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini] ${model} attempt failed: ${err.message}. Trying next model...`);
    }
  }

  throw lastError;
}

// ─── Recommendation Explanation ───────────────────────────────────────────────

export interface CentreRecommendationInput {
  centreName: string;
  distanceKm: number;
  waitMinutes: number;
  loadPercentage: number;
  score: number;
  weatherCondition?: string;
  activeIncidents?: number;
  cropName?: string;
  farmerName?: string;
}

/**
 * Generate natural language "Why we recommend this" for a procurement centre.
 * Falls back to a deterministic template if Gemini is unavailable.
 */
export async function generateRecommendationExplanation(
  input: CentreRecommendationInput
): Promise<{ text: string; hindi: string; source: "gemini" | "template" }> {
  const systemInstruction = `You are an AI assistant for KRISHI SETU, India's agricultural procurement platform. 
Help farmers understand why a centre is recommended. Be concise, practical, farmer-friendly.`;

  const prompt = `Farmer ${input.farmerName || "the farmer"} wants to sell ${input.cropName || "their crop"}.

Centre: ${input.centreName}
Distance: ${input.distanceKm} km | Wait time: ~${input.waitMinutes} min | Load: ${input.loadPercentage}% | Score: ${input.score}/100
Weather: ${input.weatherCondition || "Clear"} | Incidents: ${input.activeIncidents || 0}

Reply ONLY with valid JSON in this exact format (no markdown, no extra text):
{"en":"<2-3 sentence recommendation in English>","hi":"<same in simple Hindi Devanagari script>"}`;

  try {
    const raw = await callGemini(prompt, systemInstruction);
    // Parse JSON response
    const jsonStr = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    if (parsed.en && parsed.hi) {
      return { text: parsed.en, hindi: parsed.hi, source: "gemini" };
    }
    // If JSON is incomplete, use what we got
    return { text: parsed.en || raw, hindi: parsed.hi || buildFallbackHindi(input), source: "gemini" };
  } catch (err: any) {
    console.warn(`[Gemini] Recommendation fallback: ${err.message}`);
    return {
      text: buildFallbackText(input),
      hindi: buildFallbackHindi(input),
      source: "template",
    };
  }
}

function buildFallbackText(input: CentreRecommendationInput): string {
  const parts: string[] = [];

  if (input.loadPercentage < 50) {
    parts.push(`${input.centreName} is operating at only ${input.loadPercentage}% capacity, ensuring fast processing.`);
  } else if (input.loadPercentage < 75) {
    parts.push(`${input.centreName} has moderate load (${input.loadPercentage}%), with manageable wait times.`);
  } else {
    parts.push(`${input.centreName} is busy but still accepting bookings.`);
  }

  if (input.distanceKm <= 10) {
    parts.push(`It is only ${input.distanceKm} km from your location — the closest available option.`);
  } else {
    parts.push(`At ${input.distanceKm} km, it is accessible with an estimated wait of ~${input.waitMinutes} minutes.`);
  }

  if (input.activeIncidents === 0) {
    parts.push("No operational incidents reported — a smooth experience is expected.");
  }

  return parts.join(" ");
}

function buildFallbackHindi(input: CentreRecommendationInput): string {
  const capacity =
    input.loadPercentage < 50
      ? "कम भीड़ है"
      : input.loadPercentage < 75
      ? "मध्यम भार है"
      : "अधिक व्यस्त है";
  return `${input.centreName} में आज ${capacity}। आपसे ${input.distanceKm} किमी दूर है और प्रतीक्षा समय लगभग ${input.waitMinutes} मिनट है। यहाँ बुकिंग करने की सलाह दी जाती है।`;
}

// ─── Market Price Summary ─────────────────────────────────────────────────────

export interface MarketSummaryInput {
  cropName: string;
  mspPerQuintal: number;
  mandiAvgPrice: number;
  highestMarket: string;
}

/**
 * Generate an AI-powered market intelligence summary for a crop.
 */
export async function generateMarketSummary(input: MarketSummaryInput): Promise<string> {
  const diffPct = Math.round(
    ((input.mandiAvgPrice - input.mspPerQuintal) / input.mspPerQuintal) * 100
  );
  const above = diffPct >= 0 ? `${diffPct}% above` : `${Math.abs(diffPct)}% below`;

  const prompt = `India agricultural market analysis for ${input.cropName}:
- Current MSP: ₹${input.mspPerQuintal}/quintal
- Average mandi price today: ₹${input.mandiAvgPrice}/quintal (${above} MSP)
- Best price at: ${input.highestMarket}

Write a 2-sentence market intelligence advisory for a farmer deciding whether to sell at MSP procurement centre vs. open market. Be concise and actionable.`;

  try {
    return await callGemini(prompt);
  } catch {
    if (diffPct >= 5) {
      return `Market prices for ${input.cropName} are ${diffPct}% above MSP today (₹${input.mandiAvgPrice}/Q vs ₹${input.mspPerQuintal}/Q). Consider both options — MSP gives guaranteed payment, while ${input.highestMarket} offers higher rates today.`;
    }
    return `Current mandi prices for ${input.cropName} are near or below MSP (₹${input.mandiAvgPrice}/Q). MSP procurement via KRISHI SETU guarantees ₹${input.mspPerQuintal}/Q — the safer and more reliable choice.`;
  }
}

// ─── Farmer Advisory ──────────────────────────────────────────────────────────

/**
 * Generate personalized farming/selling advisory for a farmer.
 */
export async function generateFarmerAdvisory(
  farmerName: string,
  cropName: string,
  quantity: number,
  district: string,
  weatherCondition: string
): Promise<string> {
  const prompt = `Farmer ${farmerName} from ${district} district has ${quantity} quintals of ${cropName} ready to sell. Current weather: ${weatherCondition}.
Give a short (2 sentences), practical advisory about when and how to transport the produce to the mandi. Simple language, actionable advice.`;

  try {
    return await callGemini(prompt);
  } catch {
    const weatherNote =
      weatherCondition.toLowerCase().includes("rain")
        ? "Avoid transport during rain to prevent moisture damage."
        : "Good weather for transport — proceed as planned.";
    return `${farmerName}, your ${quantity}Q of ${cropName} is ready for procurement. ${weatherNote}`;
  }
}
