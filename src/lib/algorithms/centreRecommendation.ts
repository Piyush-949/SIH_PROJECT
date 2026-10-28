/**
 * KRISHI SETU — 6+ Factor AI Centre Recommendation Engine
 * Calculates normalized suitability score S in [0, 100] and generates natural language explanations.
 * Factor 6: Real-time weather condition (via OpenWeatherMap)
 */

export interface CentreScoringInput {
  centreId: string;
  centreName: string;
  distanceKm: number;
  waitingQueueCount: number;
  estimatedWaitMinutes: number;
  currentLoadQuintals: number;
  capacityPerDayQuintals: number;
  processingSpeedPerHour: number;
  activeIncidentsCount: number;
  weighingMachinesActive: number;
  weighingMachinesTotal: number;
  status: "ACTIVE" | "CONGESTED" | "MAINTENANCE" | "INACTIVE";
  // Factor 6: Weather (optional — degrades gracefully if not provided)
  weatherAdvisoryLevel?: "none" | "caution" | "warning" | "severe";
  weatherDescription?: string;
}

export interface RecommendationResult {
  centreId: string;
  score: number; // 0 to 100
  congestionStatus: "GREEN" | "YELLOW" | "RED" | "GREY";
  loadPercentage: number;
  reasons: string[];
  primaryRecommendation: boolean;
  distanceKm?: number;
}


/**
 * Calculates Haversine distance in km between two lat/lng coordinates.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Evaluates suitability score for a procurement centre.
 */
export function scoreProcurementCentre(input: CentreScoringInput): RecommendationResult {
  // If under maintenance or inactive, return zero score with GREY status
  if (input.status === "MAINTENANCE" || input.status === "INACTIVE") {
    return {
      centreId: input.centreId,
      score: 0,
      congestionStatus: "GREY",
      loadPercentage: 0,
      reasons: ["Centre currently under maintenance or inactive"],
      primaryRecommendation: false,
    };
  }

  const loadPercentage =
    input.capacityPerDayQuintals > 0
      ? Math.round((input.currentLoadQuintals / input.capacityPerDayQuintals) * 100)
      : 50;

  // Determine congestion color
  let congestionStatus: "GREEN" | "YELLOW" | "RED" | "GREY" = "GREEN";
  if (loadPercentage >= 85 || input.status === "CONGESTED") {
    congestionStatus = "RED";
  } else if (loadPercentage >= 60) {
    congestionStatus = "YELLOW";
  }

  // Factor 1: Distance Penalty (weight: 35) — strictly penalizes long-haul transport
  let distancePenalty = 0;
  if (input.distanceKm <= 25) {
    distancePenalty = (input.distanceKm / 25) * 8;
  } else if (input.distanceKm <= 60) {
    distancePenalty = 8 + ((input.distanceKm - 25) / 35) * 10;
  } else if (input.distanceKm <= 120) {
    distancePenalty = 18 + ((input.distanceKm - 60) / 60) * 14;
  } else {
    // Over 120km away (inter-district/inter-state), apply heavy hauling penalty
    distancePenalty = 32 + Math.min(45, ((input.distanceKm - 120) / 200) * 45);
  }

  // Factor 2: Queue Length Penalty (weight: 20) - normalized against 30 waiting farmers
  const normQueue = Math.min(input.waitingQueueCount / 30, 1.0);
  const queuePenalty = normQueue * 20;

  // Factor 3: Estimated Wait Time Penalty (weight: 20) - normalized against 120 mins
  const normWait = Math.min(input.estimatedWaitMinutes / 120, 1.0);
  const waitPenalty = normWait * 20;

  // Factor 4: Congestion Load Penalty (weight: 15) - normalized against 100%
  const normLoad = Math.min(loadPercentage / 100, 1.0);
  const loadPenalty = normLoad * 15;

  // Factor 5: Incident Frequency Penalty (weight: 10)
  const incidentPenalty = Math.min(input.activeIncidentsCount * 5, 10);

  // Factor 6: Weather Penalty (weight: 0–15) — from OpenWeatherMap real data
  const weatherPenaltyMap: Record<string, number> = {
    severe: 15,
    warning: 8,
    caution: 4,
    none: 0,
  };
  const weatherPenalty = weatherPenaltyMap[input.weatherAdvisoryLevel || "none"] ?? 0;

  // Bonus Factor: Processing Speed & Active Equipment Bonus (up to +10)
  const normSpeed = Math.min(input.processingSpeedPerHour / 150, 1.0);
  const equipmentRatio =
    input.weighingMachinesTotal > 0
      ? input.weighingMachinesActive / input.weighingMachinesTotal
      : 1.0;
  const speedBonus = normSpeed * 5 + equipmentRatio * 5;

  // Final score computation
  let rawScore =
    100 -
    (distancePenalty + queuePenalty + waitPenalty + loadPenalty + incidentPenalty + weatherPenalty) +
    speedBonus;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Generate natural language explanation reasons
  const reasons: string[] = [];

  if (input.distanceKm <= 8) {
    reasons.push(`Closest Proximity (${input.distanceKm} km away)`);
  } else if (input.distanceKm <= 20) {
    reasons.push(`Accessible distance (${input.distanceKm} km)`);
  }

  if (input.estimatedWaitMinutes <= 20) {
    reasons.push(`Minimal wait time (~${input.estimatedWaitMinutes} mins)`);
  } else if (input.estimatedWaitMinutes <= 45) {
    reasons.push(`Moderate wait time (~${input.estimatedWaitMinutes} mins)`);
  } else {
    reasons.push(`High wait time (~${input.estimatedWaitMinutes} mins)`);
  }

  if (loadPercentage < 45) {
    reasons.push(`Optimal capacity (Only ${loadPercentage}% full today)`);
  } else if (loadPercentage < 75) {
    reasons.push(`Capacity at ${loadPercentage}%`);
  } else {
    reasons.push(`High congestion (${loadPercentage}% capacity utilised)`);
  }

  if (input.weighingMachinesActive >= input.weighingMachinesTotal && input.weighingMachinesTotal > 0) {
    reasons.push(`All ${input.weighingMachinesActive} weighbridges fully operational`);
  } else if (input.weighingMachinesActive < input.weighingMachinesTotal) {
    reasons.push(`Warning: ${input.weighingMachinesTotal - input.weighingMachinesActive} weighbridge offline`);
  }

  if (input.activeIncidentsCount > 0) {
    reasons.push(`${input.activeIncidentsCount} active operational incident(s) reported`);
  }

  // Factor 6: Weather advisory
  if (input.weatherAdvisoryLevel && input.weatherAdvisoryLevel !== "none") {
    const weatherEmoji: Record<string, string> = {
      severe: "⛈️",
      warning: "🌧️",
      caution: "🌫️",
    };
    const emoji = weatherEmoji[input.weatherAdvisoryLevel] || "🌤️";
    reasons.push(
      `${emoji} Weather advisory: ${input.weatherDescription || input.weatherAdvisoryLevel} — factor in travel time`
    );
  } else if (input.weatherDescription) {
    reasons.push(`🌤️ Weather: ${input.weatherDescription} — good conditions for transport`);
  }

  return {
    centreId: input.centreId,
    score,
    congestionStatus,
    loadPercentage,
    reasons,
    primaryRecommendation: false,
    distanceKm: input.distanceKm,
  };
}


/**
 * Scores and ranks a list of centres, marking the highest scoring active centre.
 */
export function rankCentres(centres: CentreScoringInput[]): RecommendationResult[] {
  const results = centres.map(scoreProcurementCentre);
  results.sort((a, b) => {
    // If one centre is local (<= 100km) and another is far (> 150km), local centre always wins
    const aDist = a.distanceKm ?? 999;
    const bDist = b.distanceKm ?? 999;
    if (aDist <= 100 && bDist > 150) return -1;
    if (bDist <= 100 && aDist > 150) return 1;
    return b.score - a.score;
  });

  if (results.length > 0 && results[0].score > 0) {
    results[0].primaryRecommendation = true;
  }

  return results;
}
