import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district");
    const state = searchParams.get("state");
    const lat = parseFloat(searchParams.get("lat") || "0");
    const lng = parseFloat(searchParams.get("lng") || "0");

    const whereClause: any = { status: { not: "INACTIVE" } };
    if (district) whereClause.district = district;
    if (state) whereClause.state = state;

    const centresFromDb = await db.procurementCentre.findMany({
      where: whereClause,
      include: {
        cropsSupported: { include: { crop: true } },
        incidents: { where: { status: "ACTIVE" } },
        queueEntries: { where: { status: { in: ["WAITING", "CALLED", "PROCESSING"] } } },
      },
      orderBy: { name: "asc" },
    });

    const centres = centresFromDb.map((c) => {
      const activeQueue = c.queueEntries.length;
      const capacity = c.capacityPerDayQuintals || 1000;
      const currentLoad = c.currentLoadQuintals || 0;

      // Compute real congestion from actual queue and load data
      const loadPercentage = Math.min(100, Math.round((currentLoad / capacity) * 100));
      const queueRatio = Math.min(100, Math.round((activeQueue / Math.max(c.activeCounters * 5, 5)) * 100));
      const congestionPercentage = Math.round((loadPercentage * 0.6) + (queueRatio * 0.4));

      // Real status based on data (not hardcoded index)
      let status: "GREEN" | "YELLOW" | "RED" | "GREY" = "GREEN";
      if (c.status === "MAINTENANCE") {
        status = "GREY";
      } else if (c.incidents.length > 0 || congestionPercentage >= 85) {
        status = "RED";
      } else if (congestionPercentage >= 55) {
        status = "YELLOW";
      }

      // Real AI score based on actual metrics
      const incidentPenalty = c.incidents.length * 15;
      const congestionPenalty = Math.round(congestionPercentage * 0.4);
      const activeCounterBonus = Math.min(c.activeCounters * 3, 15);
      const aiScore = Math.max(10, Math.min(98, 90 - incidentPenalty - congestionPenalty + activeCounterBonus));

      // Real wait time estimate
      const avgProcessingTime = 20; // minutes per farmer
      const estimatedWaitMinutes = activeQueue * Math.round(avgProcessingTime / Math.max(c.activeCounters, 1));

      // Distance from farmer's location (if provided)
      let distanceKm: number | null = null;
      if (lat && lng && c.latitude && c.longitude) {
        const R = 6371;
        const dLat = ((c.latitude - lat) * Math.PI) / 180;
        const dLon = ((c.longitude - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((c.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const deg = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distanceKm = Math.round(R * deg * 10) / 10;
      }

      const supportedCrops = c.cropsSupported
        .filter((cc) => cc.available)
        .map((cc) => cc.crop.name.toUpperCase());

      // Generate real recommendation reason
      let recommendationReason = "";
      if (status === "GREEN") {
        recommendationReason = `Low congestion (${congestionPercentage}%), estimated wait ${estimatedWaitMinutes} mins. ${c.activeCounters} counters active.`;
      } else if (status === "YELLOW") {
        recommendationReason = `Moderate congestion (${congestionPercentage}%). Estimated wait ${estimatedWaitMinutes} mins.`;
      } else if (status === "RED") {
        const reasons = [];
        if (c.incidents.length > 0) reasons.push(`${c.incidents.length} active incident(s)`);
        if (congestionPercentage >= 85) reasons.push(`High congestion (${congestionPercentage}%)`);
        recommendationReason = reasons.join(". ") + `. Estimated wait ${estimatedWaitMinutes}+ mins.`;
      } else {
        recommendationReason = "Centre is under maintenance. Not available for booking.";
      }

      return {
        id: c.id,
        name: c.name,
        code: c.code,
        latitude: c.latitude,
        longitude: c.longitude,
        address: c.address,
        district: c.district,
        state: c.state,
        pincode: c.pincode,
        contactPhone: c.contactPhone,
        capacityPerDayQuintals: c.capacityPerDayQuintals,
        currentLoadQuintals: c.currentLoadQuintals,
        processingSpeedPerHour: c.processingSpeedPerHour,
        operatingHours: c.operatingHours,
        activeCounters: c.activeCounters,
        activeDocks: c.activeCounters,
        status,
        congestionPercentage,
        estimatedWaitMinutes,
        aiScore,
        recommendationReason,
        supportedCrops,
        activeIncidentsCount: c.incidents.length,
        activeQueueCount: activeQueue,
        distanceKm,
      };
    });

    // Sort by: distance first (if available), then aiScore
    const sorted = centres.sort((a, b) => {
      if (a.distanceKm !== null && b.distanceKm !== null) {
        return a.distanceKm - b.distanceKm;
      }
      return b.aiScore - a.aiScore;
    });

    return NextResponse.json({
      success: true,
      centres: sorted,
      total: sorted.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
