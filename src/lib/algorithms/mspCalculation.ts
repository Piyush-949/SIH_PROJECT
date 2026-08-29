/**
 * KRISHI SETU — MSP Rate Calculation & Direct Benefit Transfer Payment Simulator
 * Calculates Gross Amount = Accepted Quantity * MSP, Deductions, and Net Payable Amount.
 */

export interface MspCalculationInput {
  acceptedQuantityQuintals: number;
  mspRatePerQuintal: number;
  qualityDeductionPercentage?: number;
  handlingFeePerQuintal?: number;
}

export interface MspCalculationResult {
  acceptedQuantityQuintals: number;
  mspRatePerQuintal: number;
  grossAmount: number;
  qualityDeductionPercentage: number;
  qualityDeductionAmount: number;
  handlingFeeAmount: number;
  totalDeductions: number;
  netPayableAmount: number;
  formattedGross: string;
  formattedNetPayable: string;
}

/**
 * Calculates payment breakdown based on accepted produce and MSP rates.
 */
export function calculateMspPayment(input: MspCalculationInput): MspCalculationResult {
  const qty = Math.max(0, input.acceptedQuantityQuintals);
  const rate = Math.max(0, input.mspRatePerQuintal);
  const deductionPct = Math.max(0, input.qualityDeductionPercentage ?? 0);
  const handlingFeePerQ = input.handlingFeePerQuintal ?? 0;

  const grossAmount = Math.round(qty * rate * 100) / 100;
  const qualityDeductionAmount = Math.round(grossAmount * (deductionPct / 100) * 100) / 100;
  const handlingFeeAmount = Math.round(qty * handlingFeePerQ * 100) / 100;
  const totalDeductions = qualityDeductionAmount + handlingFeeAmount;

  const netPayableAmount = Math.max(0, Math.round((grossAmount - totalDeductions) * 100) / 100);

  const formatINR = (val: number) =>
    "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return {
    acceptedQuantityQuintals: qty,
    mspRatePerQuintal: rate,
    grossAmount,
    qualityDeductionPercentage: deductionPct,
    qualityDeductionAmount,
    handlingFeeAmount,
    totalDeductions,
    netPayableAmount,
    formattedGross: formatINR(grossAmount),
    formattedNetPayable: formatINR(netPayableAmount),
  };
}

/**
 * Generates a mock PFMS transaction reference ID.
 */
export function generatePfmsTransactionRef(bookingNumber?: string): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const year = new Date().getFullYear();
  return `PFMS-${year}-TXN-${randomSuffix}`;
}
