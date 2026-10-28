/**
 * KRISHI SETU — Weighbridge Weight Calculation & Discrepancy Alerting Engine
 * Computes Net Weight = Gross - Tare, verifies against booked quantity, and flags > 20% discrepancies.
 */

export interface WeighingInput {
  grossWeightQuintals: number;
  tareWeightQuintals: number;
  bookedEstimatedQuantityQuintals: number;
  tolerancePercentageThreshold?: number; // default: 20.0
  discrepancyThresholdPercentage?: number;
}

export interface WeighingResult {
  grossWeightQuintals: number;
  tareWeightQuintals: number;
  netWeightQuintals: number;
  bookedQuantityQuintals: number;
  weightDifferenceQuintals: number;
  discrepancyPercentage: number;
  isDiscrepancyFlagged: boolean;
  alertType?: "HIGH_SURPLUS" | "HIGH_DEFICIT" | "NORMAL";
  alertMessage?: string;
  suggestedActions: string[];
}

/**
 * Calculates net weight and detects quantity discrepancies.
 */
export function calculateWeighingDiscrepancy(input: WeighingInput): WeighingResult {
  const threshold =
    input.tolerancePercentageThreshold ?? input.discrepancyThresholdPercentage ?? 20.0;
  const netWeightQuintals = Math.max(
    0,
    Math.round((input.grossWeightQuintals - input.tareWeightQuintals) * 100) / 100
  );

  const booked = input.bookedEstimatedQuantityQuintals;
  const weightDifferenceQuintals = Math.round((netWeightQuintals - booked) * 100) / 100;

  const discrepancyPercentage =
    booked > 0
      ? Math.round((Math.abs(weightDifferenceQuintals) / booked) * 1000) / 10
      : 0;

  const isDiscrepancyFlagged = discrepancyPercentage > threshold;

  let alertType: "HIGH_SURPLUS" | "HIGH_DEFICIT" | "NORMAL" = "NORMAL";
  let alertMessage: string | undefined;
  const suggestedActions: string[] = [];

  if (isDiscrepancyFlagged) {
    if (weightDifferenceQuintals > 0) {
      alertType = "HIGH_SURPLUS";
      alertMessage = `High Produce Quantity Discrepancy (+${discrepancyPercentage}% surplus). Booked: ${booked} Q, Actual Net: ${netWeightQuintals} Q.`;
      suggestedActions.push("Approve Quota Override (Single Lot)");
      suggestedActions.push("Flag for Centre Supervisor Verification");
      suggestedActions.push("Split Excess into Multi-Batch Booking");
    } else {
      alertType = "HIGH_DEFICIT";
      alertMessage = `High Produce Quantity Deficit (-${discrepancyPercentage}% deficit). Booked: ${booked} Q, Actual Net: ${netWeightQuintals} Q.`;
      suggestedActions.push("Accept Actual Weighed Quantity");
      suggestedActions.push("Request Farmer Confirmation for Reduced Batch");
    }
  } else {
    suggestedActions.push("Proceed to Quality Inspection Lab");
  }

  return {
    grossWeightQuintals: input.grossWeightQuintals,
    tareWeightQuintals: input.tareWeightQuintals,
    netWeightQuintals,
    bookedQuantityQuintals: booked,
    weightDifferenceQuintals,
    discrepancyPercentage,
    isDiscrepancyFlagged,
    alertType,
    alertMessage,
    suggestedActions,
  };
}
