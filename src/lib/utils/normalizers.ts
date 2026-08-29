/**
 * KRISHI SETU — API Response Normalizers
 * Maps real Prisma DB response shapes → the flat MockBooking/MockCentre/MockIncident shapes
 * that existing UI components already expect. UI components need zero changes.
 */

import {
  SEEDED_BOOKINGS,
  SEEDED_CENTRES,
  SEEDED_INCIDENTS,
  MockBooking,
  MockCentre,
} from "@/lib/data/mockDatabase";

// ─── Booking Normalizer ────────────────────────────────────────────────────

/**
 * Converts a real Prisma Booking (with nested farmer, centre, crop, payment, queueEntry)
 * into the flat MockBooking shape the UI uses.
 */
export function normalizeBooking(raw: any): MockBooking {
  const farmer = raw.farmer || {};
  const centre = raw.centre || {};
  const crop = raw.crop || {};
  const payment = raw.payment || null;
  const queueEntry = raw.queueEntry || null;
  const procurementRecord = raw.procurementRecord || null;
  const qualityInspection = raw.qualityInspection || null;

  // Parse stageTimestamps from JSON string if needed
  let stageTimestamps: Record<string, string> = {};
  try {
    if (typeof raw.stageTimestamps === "string") {
      stageTimestamps = JSON.parse(raw.stageTimestamps);
    } else if (raw.stageTimestamps && typeof raw.stageTimestamps === "object") {
      stageTimestamps = raw.stageTimestamps;
    }
  } catch {}

  let stageRemarks: Record<string, string> = {};
  try {
    if (typeof raw.stageRemarks === "string") {
      stageRemarks = JSON.parse(raw.stageRemarks);
    } else if (raw.stageRemarks && typeof raw.stageRemarks === "object") {
      stageRemarks = raw.stageRemarks;
    }
  } catch {}

  // Format arrival window times as strings (e.g., "08:30 AM")
  const fmtTime = (d: any) => {
    if (!d) return "08:00 AM";
    try {
      const date = new Date(d);
      return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch {
      return String(d);
    }
  };

  return {
    id: raw.id || raw.bookingNumber || "",
    bookingNumber: raw.bookingNumber || raw.id || "",
    farmerId: raw.farmerId || farmer.id || farmer.userId || "fp_farmer_demo",
    farmerName: farmer.user?.name || farmer.name || raw.farmerName || "Farmer",
    farmerPhone: farmer.user?.phone || farmer.phone || raw.farmerPhone || "9876543210",
    kisanId: farmer.kisanId || raw.kisanId || "KID-HR-2024-0001",
    centreId: raw.centreId || centre.id || "",
    centreName: centre.name || raw.centreName || "Procurement Centre",
    centreDistrict: centre.district || raw.centreDistrict || "",
    cropId: raw.cropId || crop.id || "",
    cropName: crop.name || raw.cropName || "Wheat",
    estimatedQuantityQuintals: Number(raw.estimatedQuantityQuintals) || 30,
    actualQuantityQuintals: raw.actualQuantityQuintals ? Number(raw.actualQuantityQuintals) : undefined,
    vehicleType: raw.vehicleType || "TRACTOR_TROLLEY",
    transportType: raw.transportType || "SELF_TRANSPORT",
    status: raw.status || "CONFIRMED",
    currentStage: raw.currentStage || "SLOT_BOOKED",
    qrToken: raw.qrToken || "",
    arrivalWindowStart: fmtTime(raw.arrivalWindowStart),
    arrivalWindowEnd: fmtTime(raw.arrivalWindowEnd),
    estimatedProcessingTimeMinutes: Number(raw.estimatedProcessingTimeMinutes) || 30,
    originalEstimatedArrival: fmtTime(raw.originalEstimatedArrival),
    dynamicEstimatedArrival: fmtTime(raw.dynamicEstimatedArrival),
    tokenNumber: queueEntry?.tokenNumber || raw.tokenNumber || "TK-000",
    queuePosition: queueEntry?.queuePosition || raw.queuePosition || 0,
    grossWeightQuintals: procurementRecord?.grossWeightQuintals
      ? Number(procurementRecord.grossWeightQuintals)
      : raw.grossWeightQuintals
      ? Number(raw.grossWeightQuintals)
      : undefined,
    tareWeightQuintals: procurementRecord?.tareWeightQuintals
      ? Number(procurementRecord.tareWeightQuintals)
      : raw.tareWeightQuintals
      ? Number(raw.tareWeightQuintals)
      : undefined,
    netWeightQuintals: procurementRecord?.netWeightQuintals
      ? Number(procurementRecord.netWeightQuintals)
      : raw.netWeightQuintals
      ? Number(raw.netWeightQuintals)
      : undefined,
    discrepancyFlagged: raw.discrepancyFlagged || false,
    discrepancyPercentage: raw.discrepancyPercentage
      ? Number(raw.discrepancyPercentage)
      : undefined,
    moisturePercentage: qualityInspection?.moisturePercentage
      ? Number(qualityInspection.moisturePercentage)
      : raw.moisturePercentage
      ? Number(raw.moisturePercentage)
      : undefined,
    foreignMaterialPercentage: qualityInspection?.foreignMaterialPercentage
      ? Number(qualityInspection.foreignMaterialPercentage)
      : undefined,
    damagedGrainPercentage: qualityInspection?.damagedGrainPercentage
      ? Number(qualityInspection.damagedGrainPercentage)
      : undefined,
    assignedGrade: qualityInspection?.assignedGrade || raw.assignedGrade || undefined,
    qualityDecision: qualityInspection?.decision || raw.qualityDecision || undefined,
    acceptedQuantityQuintals: qualityInspection?.acceptedQuantityQuintals
      ? Number(qualityInspection.acceptedQuantityQuintals)
      : undefined,
    deductionPercentage: qualityInspection?.deductionPercentage
      ? Number(qualityInspection.deductionPercentage)
      : undefined,
    grossAmount: payment?.grossAmount ? Number(payment.grossAmount) : undefined,
    deductionAmount: payment?.deductionAmount ? Number(payment.deductionAmount) : undefined,
    netPayableAmount: payment?.netPayableAmount ? Number(payment.netPayableAmount) : undefined,
    mspRateApplied: payment?.mspRateApplied ? Number(payment.mspRateApplied) : undefined,
    paymentStatus: payment?.status || raw.paymentStatus || undefined,
    transactionReference: payment?.transactionReference || raw.transactionReference || undefined,
    boostRequested: payment?.boostStatus
      ? payment.boostStatus !== "NONE"
      : raw.boostRequested || false,
    boostReason: payment?.boostReason || raw.boostReason || undefined,
    stageTimestamps: Object.keys(stageTimestamps).length > 0 ? stageTimestamps : undefined,
    stageRemarks: Object.keys(stageRemarks).length > 0 ? stageRemarks : undefined,
  };
}

/**
 * Normalizes an array of raw bookings. Falls back to SEEDED_BOOKINGS if result is empty.
 */
export function normalizeBookings(
  rawBookings: any[],
  fallbackToMock = true
): MockBooking[] {
  if (!rawBookings || rawBookings.length === 0) {
    return fallbackToMock ? SEEDED_BOOKINGS : [];
  }
  return rawBookings.map(normalizeBooking);
}

// ─── Centre Normalizer ─────────────────────────────────────────────────────

/**
 * Converts a real Prisma ProcurementCentre (from GET /api/centres) into
 * the flat MockCentre shape the UI uses.
 */
export function normalizeCentre(raw: any): MockCentre {
  const loadPct = raw.congestionPercentage || 0;
  const capacity = Number(raw.capacityPerDayQuintals) || 1000;
  const currentLoad = raw.currentLoadQuintals !== undefined
    ? Number(raw.currentLoadQuintals)
    : Math.round((loadPct / 100) * capacity);

  // Derive status from API "status" field (GREEN/YELLOW/RED/GREY) → MockCentre status
  let status: MockCentre["status"] = "ACTIVE";
  if (raw.status === "RED" || raw.status === "CONGESTED") status = "CONGESTED";
  else if (raw.status === "GREY" || raw.status === "INACTIVE") status = "INACTIVE";
  else if (raw.status === "MAINTENANCE") status = "MAINTENANCE";

  const waitingQueueCount = raw.waitingQueueCount || Math.round(loadPct / 5) || 0;

  return {
    id: raw.id || "",
    name: raw.name || "Procurement Centre",
    code: raw.code || raw.id || "",
    district: raw.district || "",
    state: raw.state || "",
    address: raw.address || "",
    latitude: Number(raw.latitude) || 20.5937,
    longitude: Number(raw.longitude) || 78.9629,
    capacityPerDayQuintals: capacity,
    currentLoadQuintals: currentLoad,
    processingSpeedPerHour: Number(raw.processingSpeedPerHour) || 100,
    operatingHours: raw.operatingHours || "08:00 AM - 06:00 PM",
    activeCounters: Number(raw.activeCounters) || 3,
    weighingMachinesTotal: raw.weighingMachinesTotal || 2,
    weighingMachinesActive: raw.weighingMachinesActive || 2,
    moistureMetersTotal: raw.moistureMetersTotal || 2,
    moistureMetersActive: raw.moistureMetersActive || 2,
    status,
    waitingQueueCount,
    estimatedWaitMinutes: raw.estimatedWaitMinutes || Math.round(waitingQueueCount * 4) || 15,
  };
}

/**
 * Normalizes an array of raw centres. Falls back to SEEDED_CENTRES if result is empty.
 */
export function normalizeCentres(
  rawCentres: any[],
  fallbackToMock = true
): MockCentre[] {
  if (!rawCentres || rawCentres.length === 0) {
    return fallbackToMock ? SEEDED_CENTRES : [];
  }
  return rawCentres.map(normalizeCentre);
}

// ─── Incident Normalizer ───────────────────────────────────────────────────

/**
 * Converts a real Prisma OperationalIncident into the flat shape the UI uses.
 */
export function normalizeIncident(raw: any): typeof SEEDED_INCIDENTS[0] {
  const centre = raw.centre || {};

  const fmtAge = (d: any) => {
    if (!d) return "recently";
    try {
      const ms = Date.now() - new Date(d).getTime();
      const mins = Math.floor(ms / 60000);
      if (mins < 2) return "Just now";
      if (mins < 60) return `${mins} mins ago`;
      return `${Math.floor(mins / 60)} hours ago`;
    } catch {
      return "recently";
    }
  };

  return {
    id: raw.id || "",
    centreId: raw.centreId || centre.id || "",
    centreName: centre.name || raw.centreName || "Procurement Centre",
    incidentType: raw.incidentType || raw.type || "SYSTEM_GLITCH",
    severity: raw.severity || "MEDIUM",
    description: raw.description || "",
    delayImpactMinutes:
      Number(raw.impactDelayMinutesPerSlot) ||
      Number(raw.delayImpactMinutes) ||
      Number(raw.delayMinutesImpact) ||
      15,
    capacityReductionPercentage:
      Number(raw.capacityReductionPercentage) || 20,
    status: raw.status || "ACTIVE",
    reportedAt: fmtAge(raw.reportedAt || raw.createdAt),
    reporterName: raw.reporter?.name
      ? `${raw.reporter.name} (Operator)`
      : raw.reporterName || "Operator",
  };
}

/**
 * Normalizes an array of raw incidents. Falls back to SEEDED_INCIDENTS if result is empty.
 */
export function normalizeIncidents(
  rawIncidents: any[],
  fallbackToMock = true
): typeof SEEDED_INCIDENTS {
  if (!rawIncidents || rawIncidents.length === 0) {
    return fallbackToMock ? SEEDED_INCIDENTS : [];
  }
  return rawIncidents.map(normalizeIncident);
}
