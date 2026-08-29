/**
 * KRISHI SETU — Agmarknet Quality Grading & Deduction Matrix
 * Evaluates Moisture %, Foreign Material %, and Damaged Grain % to determine Grade (A, B, C, Reject),
 * Decision (Accept, Partial Accept, Reject, Reinspect), and Deduction %.
 */

export interface QualityMetricsInput {
  moisturePercentage: number;
  foreignMaterialPercentage: number;
  damagedGrainPercentage: number;
  cropName?: string;
  moistureStandardMax?: number;
  foreignMaterialMax?: number;
  damagedGrainMax?: number;
  submittedQuantityQuintals: number;
}

export type QualityGradeType = "GRADE_A" | "GRADE_B" | "GRADE_C" | "REJECTED";
export type InspectionDecisionType = "ACCEPT" | "PARTIAL_ACCEPT" | "REJECT" | "REINSPECT";

export interface QualityGradingResult {
  grade: QualityGradeType;
  decision: InspectionDecisionType;
  deductionPercentage: number;
  acceptedQuantityQuintals: number;
  rejectedQuantityQuintals: number;
  gradeDescription: string;
  passedMoisture: boolean;
  passedForeignMatter: boolean;
  passedDamagedGrain: boolean;
  qualityRemarks: string;
}

/**
 * Evaluates crop quality based on Agmarknet standards.
 */
export function evaluateQuality(input: QualityMetricsInput): QualityGradingResult {
  const stdMoisture = input.moistureStandardMax ?? 12.0;
  const stdForeign = input.foreignMaterialMax ?? 2.0;
  const stdDamaged = input.damagedGrainMax ?? 3.0;

  const passedMoisture = input.moisturePercentage <= stdMoisture + 4.0;
  const passedForeignMatter = input.foreignMaterialPercentage <= stdForeign + 2.0;
  const passedDamagedGrain = input.damagedGrainPercentage <= stdDamaged + 2.5;

  let grade: QualityGradeType = "GRADE_A";
  let decision: InspectionDecisionType = "ACCEPT";
  let deductionPercentage = 0.0;
  let gradeDescription = "Premium Quality (Grade A) — 100% MSP Payout";

  // Rejection check
  if (
    input.moisturePercentage > stdMoisture + 4.5 ||
    input.foreignMaterialPercentage > stdForeign + 2.5 ||
    input.damagedGrainPercentage > stdDamaged + 3.0
  ) {
    grade = "REJECTED";
    decision = "REJECT";
    deductionPercentage = 100.0;
    gradeDescription = "Quality Below Requisite Procurement Thresholds — Lot Rejected";
    return {
      grade,
      decision,
      deductionPercentage,
      acceptedQuantityQuintals: 0,
      rejectedQuantityQuintals: input.submittedQuantityQuintals,
      gradeDescription,
      passedMoisture: false,
      passedForeignMatter: false,
      passedDamagedGrain: false,
      qualityRemarks: `Moisture (${input.moisturePercentage}%) or Foreign Material (${input.foreignMaterialPercentage}%) exceeded rejection limits.`,
    };
  }

  // Grade C: High moisture / foreign material within acceptable margin with 5% deduction
  if (
    input.moisturePercentage > stdMoisture + 2.0 ||
    input.foreignMaterialPercentage > stdForeign + 1.0 ||
    input.damagedGrainPercentage > stdDamaged + 1.0
  ) {
    grade = "GRADE_C";
    decision = "PARTIAL_ACCEPT";
    deductionPercentage = 5.0;
    gradeDescription = "Fair Average Quality (Grade C) — 5.0% Quality Moisture Deduction";
  }
  // Grade B: Moderate moisture / foreign matter with 2% deduction
  else if (
    input.moisturePercentage > stdMoisture ||
    input.foreignMaterialPercentage > stdForeign * 0.7 ||
    input.damagedGrainPercentage > stdDamaged * 0.7
  ) {
    grade = "GRADE_B";
    decision = "ACCEPT";
    deductionPercentage = 2.0;
    gradeDescription = "Good Commercial Quality (Grade B) — 2.0% Moisture Deduction";
  }
  // Grade A: Meets all standard thresholds
  else {
    grade = "GRADE_A";
    decision = "ACCEPT";
    deductionPercentage = 0.0;
    gradeDescription = "Premium Quality (Grade A) — Full 100% MSP Payout";
  }

  const acceptedQuantityQuintals =
    Math.round(input.submittedQuantityQuintals * (1 - deductionPercentage / 100) * 100) / 100;
  const rejectedQuantityQuintals =
    Math.round((input.submittedQuantityQuintals - acceptedQuantityQuintals) * 100) / 100;

  return {
    grade,
    decision,
    deductionPercentage,
    acceptedQuantityQuintals,
    rejectedQuantityQuintals,
    gradeDescription,
    passedMoisture,
    passedForeignMatter,
    passedDamagedGrain,
    qualityRemarks: `Quality grading approved: ${grade} (${gradeDescription})`,
  };
}
