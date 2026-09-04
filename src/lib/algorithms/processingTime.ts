/**
 * KRISHI SETU — Processing Time & Dynamic Slot Arrival Window Engine
 * Formula: Estimated Processing Time = Base Time + Quantity Factor + Crop Complexity + Inspection Time + Vehicle Delta + Incident Penalty
 */

export interface ProcessingTimeParams {
  quantityQuintals: number;
  cropBaseMinutesPerQuintal?: number;
  vehicleType?: "TRACTOR_TROLLEY" | "PICKUP_TRUCK" | "BULLOCK_CART" | "MINI_VAN" | "OTHER" | string;
  baseEntryMinutes?: number;
  inspectionBaseMinutes?: number;
  activeIncidentPenaltyMinutes?: number;
}

export interface ProcessingTimeResult {
  totalEstimatedMinutes: number;
  breakdown: {
    baseEntryMinutes: number;
    quantityHandlingMinutes: number;
    inspectionMinutes: number;
    vehicleAdjustmentMinutes: number;
    incidentPenaltyMinutes: number;
  };
}

export interface ArrivalWindow {
  windowStart: Date;
  windowEnd: Date;
  slotStartTime: Date;
  graceExpiryTime: Date;
  formattedWindow: string;
}

/**
 * Calculates estimated processing time in minutes per booking.
 */
export function calculateProcessingTime(params: ProcessingTimeParams): ProcessingTimeResult {
  const baseEntryMinutes = params.baseEntryMinutes ?? 10;
  const cropFactor = params.cropBaseMinutesPerQuintal ?? 0.8;
  const inspectionMinutes = params.inspectionBaseMinutes ?? 8;
  const incidentPenaltyMinutes = params.activeIncidentPenaltyMinutes ?? 0;

  // Vehicle type adjustment
  let vehicleAdjustmentMinutes = 0;
  switch (params.vehicleType) {
    case "BULLOCK_CART":
      vehicleAdjustmentMinutes = 10;
      break;
    case "TRACTOR_TROLLEY":
      vehicleAdjustmentMinutes = 5;
      break;
    case "PICKUP_TRUCK":
      vehicleAdjustmentMinutes = 0;
      break;
    case "MINI_VAN":
      vehicleAdjustmentMinutes = 2;
      break;
    default:
      vehicleAdjustmentMinutes = 3;
      break;
  }

  // Quantity handling: bulk commercial lots (>100Q) utilize high-throughput bulk hoppers
  const quantityHandlingMinutes =
    params.quantityQuintals > 100
      ? Math.round(100 * cropFactor + (params.quantityQuintals - 100) * 0.15)
      : Math.round(params.quantityQuintals * cropFactor);


  const totalEstimatedMinutes =
    baseEntryMinutes +
    quantityHandlingMinutes +
    inspectionMinutes +
    vehicleAdjustmentMinutes +
    incidentPenaltyMinutes;

  return {
    totalEstimatedMinutes,
    breakdown: {
      baseEntryMinutes,
      quantityHandlingMinutes,
      inspectionMinutes,
      vehicleAdjustmentMinutes,
      incidentPenaltyMinutes,
    },
  };
}

/**
 * Computes the arrival window given a scheduled slot time.
 * Grace period: 10 minutes prior to slot start, 20 minutes after slot start.
 * Grace expiry: 15 minutes after window end (auto-noshow boundary).
 */
export function calculateArrivalWindow(slotDate: Date | string, slotStartTimeStr: string): ArrivalWindow {
  const baseDate = typeof slotDate === "string" ? new Date(slotDate) : new Date(slotDate);
  const [hours, minutes] = slotStartTimeStr.split(":").map(Number);
  
  const slotStartTime = new Date(baseDate);
  slotStartTime.setHours(hours, minutes, 0, 0);

  // Arrival window starts 10 mins before slot
  const windowStart = new Date(slotStartTime.getTime() - 10 * 60 * 1000);
  // Arrival window ends 20 mins after slot
  const windowEnd = new Date(slotStartTime.getTime() + 20 * 60 * 1000);
  // Grace expiry (triggering auto-noshow) is 15 mins after window end
  const graceExpiryTime = new Date(windowEnd.getTime() + 15 * 60 * 1000);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  return {
    windowStart,
    windowEnd,
    slotStartTime,
    graceExpiryTime,
    formattedWindow: `${formatTime(windowStart)} - ${formatTime(windowEnd)}`,
  };
}
