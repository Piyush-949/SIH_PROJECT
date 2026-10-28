/**
 * KRISHI SETU — Core TypeScript Type Definitions & Domain Contracts
 */

export type Role =
  | "FARMER"
  | "CENTRE_OPERATOR"
  | "QUALITY_INSPECTOR"
  | "DISTRICT_ADMIN"
  | "STATE_ADMIN"
  | "SUPER_ADMIN";

export type GovVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type CentreStatus = "ACTIVE" | "CONGESTED" | "MAINTENANCE" | "INACTIVE";

export type TransportType = "SELF_TRANSPORT" | "TEAM_VISIT";

export type VehicleType =
  | "TRACTOR_TROLLEY"
  | "PICKUP_TRUCK"
  | "BULLOCK_CART"
  | "MINI_VAN"
  | "OTHER";

export type BookingStatus =
  | "PENDING_VISIT"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type QueueStatus =
  | "WAITING"
  | "CALLED"
  | "PROCESSING"
  | "COMPLETED"
  | "SKIPPED"
  | "NO_SHOW";

export type ProcurementStage =
  | "SLOT_BOOKED"
  | "CHECKED_IN"
  | "IDENTITY_VERIFIED"
  | "DOCUMENTS_VERIFIED"
  | "PRODUCE_WEIGHED"
  | "QUALITY_INSPECTED"
  | "PROCUREMENT_ACCEPTED"
  | "PAYMENT_PROCESSING"
  | "PAYMENT_COMPLETED";

export type QualityGrade = "GRADE_A" | "GRADE_B" | "GRADE_C" | "REJECTED";

export type InspectionDecision = "ACCEPT" | "PARTIAL_ACCEPT" | "REJECT" | "REINSPECT";

export type PaymentStatus =
  | "NOT_INITIATED"
  | "INITIATED"
  | "PROCESSING"
  | "SUCCESSFUL"
  | "FAILED";

export type BoostStatus = "NONE" | "PENDING" | "APPROVED" | "EXPEDITED" | "REJECTED";

export type IncidentType =
  | "EQUIPMENT_FAILURE"
  | "WEIGHING_MACHINE_DOWN"
  | "MOISTURE_METER_DOWN"
  | "STAFF_SHORTAGE"
  | "WEATHER_DISRUPTION"
  | "POWER_OUTAGE"
  | "SYSTEM_GLITCH"
  | "CROWD_SURGE";

export type IncidentSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type NotificationCategory =
  | "BOOKING_CONFIRMED"
  | "QUEUE_APPROACHING"
  | "DELAY_ALERT"
  | "INCIDENT_ALERT"
  | "STAGE_COMPLETED"
  | "PAYMENT_UPDATE"
  | "GENERAL";

// User & Auth
export interface UserSession {
  id: string;
  phone: string;
  name: string;
  role: Role;
  language: string;
}

export interface FarmerProfileSummary {
  id: string;
  userId: string;
  name?: string;
  aadhaarNumber: string;
  kisanId: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  landAreaAcres: number;
  kycStatus: GovVerificationStatus;
}

// Centre & Map
export interface CentreSummary {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  state: string;
  contactPhone: string;
  capacityPerDayQuintals: number;
  currentLoadQuintals: number;
  processingSpeedPerHour: number;
  operatingHours: string;
  activeCounters: number;
  weighingMachinesTotal: number;
  weighingMachinesActive: number;
  moistureMetersTotal: number;
  moistureMetersActive: number;
  status: CentreStatus;
}

// Crops
export interface CropSummary {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  basePricePerQuintal: number;
  moistureStandardMax: number;
  foreignMaterialMax: number;
  damagedGrainMax: number;
  baseProcessingMinutesPerQuintal: number;
}

// Booking & Queue
export interface BookingSummary {
  id: string;
  bookingNumber: string;
  farmerId: string;
  centreId: string;
  cropId: string;
  slotId?: string | null;
  estimatedQuantityQuintals: number;
  actualQuantityQuintals?: number | null;
  vehicleType: VehicleType;
  transportType: TransportType;
  status: BookingStatus;
  currentStage: ProcurementStage;
  qrToken: string;
  arrivalWindowStart: string | Date;
  arrivalWindowEnd: string | Date;
  estimatedProcessingTimeMinutes: number;
  originalEstimatedArrival: string | Date;
  dynamicEstimatedArrival: string | Date;
}

export interface QueueEntrySummary {
  id: string;
  bookingId: string;
  centreId: string;
  tokenNumber: string;
  queuePosition: number;
  priorityScore: number;
  status: QueueStatus;
  currentStage: ProcurementStage;
  etaMinutes: number;
  checkInTime: string | Date;
}

// Socket Payloads
export interface SocketQueueUpdatePayload {
  centreId: string;
  totalWaiting: number;
  averageWaitMinutes: number;
  activeServingToken: string | null;
  entries: {
    token: string;
    bookingId: string;
    farmerName: string;
    crop: string;
    quantity: number;
    status: QueueStatus;
    etaMinutes: number;
    stage: ProcurementStage;
  }[];
  timestamp: string;
}

export interface SocketIncidentPayload {
  incidentId: string;
  centreId: string;
  centreName?: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  delayImpactMinutes: number;
  recalculatedEtas: {
    bookingId: string;
    tokenNumber: string;
    previousEta: string;
    newEta: string;
    deltaMinutes: number;
  }[];
  timestamp: string;
}

export interface SocketStageChangedPayload {
  bookingId: string;
  bookingNumber: string;
  previousStage: ProcurementStage;
  currentStage: ProcurementStage;
  actor: string;
  timestamp: string;
  details?: Record<string, any>;
}
