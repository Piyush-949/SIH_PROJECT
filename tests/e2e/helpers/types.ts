/**
 * KRISHI SETU - End-to-End Test Suite Type Definitions
 * SIH 2026 Problem Statement ID: 26032
 */

export type UserRole =
  | 'FARMER'
  | 'CENTRE_OPERATOR'
  | 'QUALITY_INSPECTOR'
  | 'DISTRICT_ADMIN'
  | 'STATE_ADMIN'
  | 'SUPER_ADMIN';

export type CongestionStatus = 'GREEN' | 'YELLOW' | 'RED' | 'GREY';

export type ProcurementStage =
  | 'SLOT_BOOKED'
  | 'CHECKED_IN'
  | 'IDENTITY_VERIFIED'
  | 'DOCUMENTS_VERIFIED'
  | 'PRODUCE_WEIGHED'
  | 'QUALITY_INSPECTED'
  | 'PROCUREMENT_ACCEPTED'
  | 'PAYMENT_PROCESSING'
  | 'PAYMENT_COMPLETED'
  | 'NO_SHOW'
  | 'CANCELLED'
  | 'QUALITY_REJECTED';

export type PaymentStatus =
  | 'NOT_INITIATED'
  | 'INITIATED'
  | 'PROCESSING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'NOT_APPLICABLE';

export type QualityGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'REJECT';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentType =
  | 'WEIGHING_MACHINE_FAILURE'
  | 'POWER_OUTAGE'
  | 'MOISTURE_METER_BREAKDOWN'
  | 'STAFF_SHORTAGE'
  | 'SEVERE_WEATHER'
  | 'NETWORK_CONNECTIVITY_ISSUE'
  | 'STORAGE_SATURATION';

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  durationMs: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SuiteReport {
  tierName: string;
  total: number;
  passed: number;
  failed: number;
  durationMs: number;
  results: TestResult[];
}

export interface ApiResponse<T = any> {
  status: number;
  ok: boolean;
  data: T;
  headers: Record<string, string>;
  rawText?: string;
}

export interface AuthSession {
  token: string;
  role: UserRole;
  userId: string;
  phone: string;
  name?: string;
  centreId?: string;
}

export interface ProcurementCentreDTO {
  id: string;
  name: string;
  code: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  capacityPerDayQuintals: number;
  currentBookedQuintals: number;
  congestionPercentage: number;
  status: CongestionStatus;
  activeDocks: number;
  supportedCrops: string[];
  aiScore?: number;
  recommendationReason?: string;
  distanceKm?: number;
  estimatedWaitMinutes?: number;
}

export interface BookingDTO {
  id: string;
  bookingNumber: string;
  farmerId: string;
  farmerName?: string;
  farmerPhone?: string;
  centreId: string;
  centreName?: string;
  cropId: string;
  cropName?: string;
  quantityQuintals: number;
  vehicleType: string;
  slotStartTime: string;
  slotEndTime: string;
  tokenNumber: string;
  qrPayload: string;
  status: ProcurementStage;
  isFarmVisitRequest: boolean;
  estimatedProcessingMinutes: number;
  createdAt: string;
}

export interface QueueEntryDTO {
  id: string;
  bookingId: string;
  centreId: string;
  tokenNumber: string;
  position: number;
  estimatedWaitMinutes: number;
  status: string;
  checkedInAt?: string;
  priorityScore: number;
}

export interface IncidentDTO {
  id: string;
  centreId: string;
  type: IncidentType;
  severity: IncidentSeverity;
  description: string;
  delayMinutesImpact: number;
  isResolved: boolean;
  reportedAt: string;
  resolvedAt?: string;
}

export interface QualityInspectionDTO {
  id: string;
  bookingId: string;
  inspectorId: string;
  grade: QualityGrade;
  moisturePercentage: number;
  foreignMatterPercentage: number;
  damagedGrainPercentage: number;
  deductionPercentage: number;
  decision: 'ACCEPTED' | 'PARTIAL_ACCEPT' | 'REJECT' | 'REINSPECT';
  acceptedQuantityQuintals: number;
  rejectedQuantityQuintals: number;
  notes?: string;
  inspectedAt: string;
}

export interface PaymentRecordDTO {
  id: string;
  bookingId: string;
  farmerId: string;
  cropName: string;
  acceptedQuantityQuintals: number;
  mspRatePerQuintal: number;
  grossAmount: number;
  deductions: number;
  netPayableAmount: number;
  status: PaymentStatus;
  transactionReference?: string;
  initiatedAt?: string;
  completedAt?: string;
  boostRequested: boolean;
  boostReason?: string;
  boostStatus?: 'NONE' | 'ACTIVE' | 'EXPEDITED' | 'RESOLVED';
}
