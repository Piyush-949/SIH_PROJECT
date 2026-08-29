/**
 * KRISHI SETU — Challenger 1 Adversarial & Stress Test Suite
 * Milestone 1 & Test Infrastructure Empirical Verification
 * Problem Statement ID: 26032 | Smart India Hackathon 2026
 *
 * This test suite executes adversarial stress testing against src/lib/algorithms:
 *  1. Extreme quantities (0.001Q, 0.01Q, 50Q, 1,000Q, 10,000Q, 100,000Q)
 *  2. Discrepancy threshold edge cases (19.99% vs 20.00% vs 20.05% / 20.10%, negative deltas, huge surges)
 *  3. Quality grading boundary limits (Moisture 12.0% vs 12.1%, 14.0% vs 14.1%, 16.5% vs 16.6%, foreign matter & damaged grain steps)
 *  4. Negative weights, zero denominators, invalid vehicle types, and edge-case handling
 *  5. AI centre scoring stability under extreme / degraded conditions
 *  6. Arrival window slot boundary and midnight wrap-around handling
 */

import {
  calculateProcessingTime,
  calculateArrivalWindow,
  scoreProcurementCentre,
  rankCentres,
  evaluateQuality,
  calculateWeighingDiscrepancy,
  calculateMspPayment,
  generatePfmsTransactionRef,
  calculateDistanceKm,
} from "../src/lib/algorithms";

export function runChallengerStressTests(): { passed: number; failed: number; total: number } {
  console.log("\n================================================================================");
  console.log("🔥 KRISHI SETU — CHALLENGER 1 ADVERSARIAL STRESS & EDGE-CASE TEST HARNESS 🔥");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} -> ${details || "Assertion condition evaluated to false"}`);
      failed++;
    }
  }

  // ============================================================================
  // GROUP 1: EXTREME QUANTITIES (0.001Q to 100,000Q)
  // ============================================================================
  console.log("\n--- [GROUP 1] Extreme Quantity Stress Tests (0.001Q to 100,000Q) ---");

  // 1.1 Micro-quantity (0.01Q) processing time
  const procMicro = calculateProcessingTime({
    quantityQuintals: 0.01,
    cropBaseMinutesPerQuintal: 0.8,
    vehicleType: "OTHER",
  });
  // 10 (base) + round(0.008 = 0) + 8 (inspection) + 3 (other) + 0 = 21 mins
  assert("Micro quantity (0.01Q) computes without error or NaN", !isNaN(procMicro.totalEstimatedMinutes) && procMicro.totalEstimatedMinutes === 21);

  // 1.2 Massive bulk quantity (10,000Q) processing time
  const procBulk10k = calculateProcessingTime({
    quantityQuintals: 10000,
    cropBaseMinutesPerQuintal: 0.8,
    vehicleType: "TRACTOR_TROLLEY",
  });
  // 10 + 8000 + 8 + 5 = 8023 mins
  assert("Massive bulk quantity (10,000Q) scales linearly to 8023 mins", procBulk10k.totalEstimatedMinutes === 8023);

  // 1.3 Extreme 100,000Q processing time
  const procMega100k = calculateProcessingTime({
    quantityQuintals: 100000,
    cropBaseMinutesPerQuintal: 0.9,
    vehicleType: "BULLOCK_CART",
  });
  // 10 + 90000 + 8 + 10 = 90028 mins
  assert("Extreme 100,000Q calculates 90028 mins safely without overflow", procMega100k.totalEstimatedMinutes === 90028);

  // 1.4 Micro quantity (0.01Q) MSP payment calculation
  const mspMicro = calculateMspPayment({
    acceptedQuantityQuintals: 0.01,
    mspRatePerQuintal: 2275,
    qualityDeductionPercentage: 0,
  });
  // 0.01 * 2275 = 22.75
  assert("Micro quantity (0.01Q) MSP gross is ₹22.75", mspMicro.grossAmount === 22.75);
  assert("Micro quantity (0.01Q) net payable is ₹22.75", mspMicro.netPayableAmount === 22.75);

  // 1.5 Mega quantity (10,000Q) MSP payment calculation
  const msp10k = calculateMspPayment({
    acceptedQuantityQuintals: 10000,
    mspRatePerQuintal: 2275,
    qualityDeductionPercentage: 2.0,
    handlingFeePerQuintal: 10,
  });
  // Gross = 22,750,000; Quality Deduction 2% = 455,000; Handling = 100,000; Net = 22,195,000
  assert("10,000Q MSP Gross is ₹22,750,000.00", msp10k.grossAmount === 22750000);
  assert("10,000Q Quality Deduction is ₹455,000.00", msp10k.qualityDeductionAmount === 455000);
  assert("10,000Q Handling fee is ₹100,000.00", msp10k.handlingFeeAmount === 100000);
  assert("10,000Q Net payable is ₹22,195,000.00", msp10k.netPayableAmount === 22195000);

  // 1.6 Micro quantity (0.05Q) quality evaluation
  const qualityMicro = evaluateQuality({
    moisturePercentage: 11.5,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    submittedQuantityQuintals: 0.05,
  });
  assert("Micro quantity (0.05Q) Grade A preserves 0.05Q accepted", qualityMicro.acceptedQuantityQuintals === 0.05);

  // 1.7 Bulk quantity (10,000Q) with Grade C (5% deduction)
  const quality10kGradeC = evaluateQuality({
    moisturePercentage: 14.5,
    foreignMaterialPercentage: 1.5,
    damagedGrainPercentage: 2.0,
    submittedQuantityQuintals: 10000,
  });
  // 10000 * 0.95 = 9500Q accepted, 500Q rejected
  assert("10,000Q lot with Grade C accepts 9500Q", quality10kGradeC.acceptedQuantityQuintals === 9500);
  assert("10,000Q lot with Grade C rejects 500Q deduction", quality10kGradeC.rejectedQuantityQuintals === 500);

  // ============================================================================
  // GROUP 2: DISCREPANCY THRESHOLD EDGE CASES (19.99% vs 20.00% vs 20.05% vs 20.10%)
  // ============================================================================
  console.log("\n--- [GROUP 2] Discrepancy Threshold Edge Cases (19.99% vs 20.01%) ---");

  // 2.1 Exactly below threshold: 19.90% surplus
  const disc19_90 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 146.9,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 100.0,
  });
  // Net = 119.90Q -> Diff = +19.90Q -> Discrepancy = 19.9% <= 20.0%
  assert("19.90% surplus is NOT flagged (discrepancyPercentage = 19.9%)", !disc19_90.isDiscrepancyFlagged && disc19_90.discrepancyPercentage === 19.9);

  // 2.2 Exactly on 20.00% boundary
  const disc20_00 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 147.0,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 100.0,
  });
  // Net = 120.00Q -> Diff = +20.00Q -> Discrepancy = 20.0% <= 20.0%
  assert("Exact 20.00% boundary is NOT flagged (threshold is strictly > 20.0%)", !disc20_00.isDiscrepancyFlagged && disc20_00.discrepancyPercentage === 20.0);

  // 2.3 Just above threshold: 20.10% surplus
  const disc20_10 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 147.1,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 100.0,
  });
  // Net = 120.10Q -> Diff = +20.10Q -> Discrepancy = 20.1% > 20.0%
  assert("20.10% surplus IS flagged as HIGH_SURPLUS", disc20_10.isDiscrepancyFlagged && disc20_10.alertType === "HIGH_SURPLUS" && disc20_10.discrepancyPercentage === 20.1);

  // 2.4 Deficit boundary: exactly 20.00% deficit
  const discDeficit20_00 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 107.0,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 100.0,
  });
  // Net = 80.00Q -> Diff = -20.00Q -> Discrepancy = 20.0% <= 20.0%
  assert("Exact -20.00% deficit is NOT flagged", !discDeficit20_00.isDiscrepancyFlagged && discDeficit20_00.discrepancyPercentage === 20.0);

  // 2.5 Deficit boundary: 20.10% deficit
  const discDeficit20_10 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 106.9,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 100.0,
  });
  // Net = 79.90Q -> Diff = -20.10Q -> Discrepancy = 20.1% > 20.0%
  assert("20.10% deficit IS flagged as HIGH_DEFICIT", discDeficit20_10.isDiscrepancyFlagged && discDeficit20_10.alertType === "HIGH_DEFICIT" && discDeficit20_10.discrepancyPercentage === 20.1);

  // 2.6 Custom tolerance threshold support (e.g. strict 5.0% threshold)
  const discCustom5 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 133.0,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 100.0,
    tolerancePercentageThreshold: 5.0,
  });
  // Net = 106.00Q -> Diff = +6.00Q -> Discrepancy = 6.0% > 5.0%
  assert("Custom 5.0% threshold flags 6.0% discrepancy correctly", discCustom5.isDiscrepancyFlagged && discCustom5.discrepancyPercentage === 6.0);

  // 2.7 High surge case (Booked 20Q, Actual Net 68Q => +240% discrepancy)
  const discSurge240 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 95.0,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 20.0,
  });
  assert("Booked 20Q vs Actual 68Q triggers +240.0% discrepancy", discSurge240.discrepancyPercentage === 240.0 && discSurge240.alertType === "HIGH_SURPLUS");
  assert("Suggested actions contain supervisor verification & quota override", discSurge240.suggestedActions.some(a => a.includes("Quota Override")));

  // ============================================================================
  // GROUP 3: QUALITY GRADING BOUNDARY LIMITS (Moisture 12.0% vs 12.1%)
  // ============================================================================
  console.log("\n--- [GROUP 3] Quality Grading Boundary Limits (Moisture, Foreign Matter, Damaged Grain) ---");

  // 3.1 Moisture exactly at standard limit (12.0%) -> GRADE A
  const qAtLimit12_0 = evaluateQuality({
    moisturePercentage: 12.0,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture exactly 12.0% (at standard limit) evaluates to GRADE_A with 0% deduction", qAtLimit12_0.grade === "GRADE_A" && qAtLimit12_0.deductionPercentage === 0);

  // 3.2 Moisture barely above standard limit (12.1%) -> GRADE B (2% deduction)
  const qAboveLimit12_1 = evaluateQuality({
    moisturePercentage: 12.1,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture 12.1% (just above 12.0%) evaluates to GRADE_B with 2% deduction", qAboveLimit12_1.grade === "GRADE_B" && qAboveLimit12_1.deductionPercentage === 2.0);

  // 3.3 Moisture exactly at Grade B ceiling (14.0% = 12.0 + 2.0) -> GRADE B
  const qAtLimit14_0 = evaluateQuality({
    moisturePercentage: 14.0,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture exactly 14.0% (at Grade B ceiling) evaluates to GRADE_B", qAtLimit14_0.grade === "GRADE_B" && qAtLimit14_0.deductionPercentage === 2.0);

  // 3.4 Moisture crossing into Grade C (14.1% > 14.0%) -> GRADE C (5% deduction)
  const qAboveLimit14_1 = evaluateQuality({
    moisturePercentage: 14.1,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture 14.1% evaluates to GRADE_C with 5% deduction", qAboveLimit14_1.grade === "GRADE_C" && qAboveLimit14_1.deductionPercentage === 5.0);

  // 3.5 Moisture exactly at Rejection boundary (16.5% = 12.0 + 4.5) -> GRADE C
  const qAtLimit16_5 = evaluateQuality({
    moisturePercentage: 16.5,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture exactly 16.5% remains GRADE_C (PARTIAL_ACCEPT)", qAtLimit16_5.grade === "GRADE_C" && qAtLimit16_5.decision === "PARTIAL_ACCEPT");

  // 3.6 Moisture exceeding Rejection boundary (16.6% > 16.5%) -> REJECTED
  const qAboveLimit16_6 = evaluateQuality({
    moisturePercentage: 16.6,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture 16.6% triggers immediate REJECTED lot (100% deduction, 0Q accepted)", qAboveLimit16_6.grade === "REJECTED" && qAboveLimit16_6.decision === "REJECT" && qAboveLimit16_6.acceptedQuantityQuintals === 0);

  // 3.7 Foreign matter standard boundary (std: 2.0 -> 0.7 * 2.0 = 1.4)
  const qForeign1_4 = evaluateQuality({
    moisturePercentage: 11.0,
    foreignMaterialPercentage: 1.4,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Foreign matter 1.4% (<= 1.4) qualifies as GRADE_A", qForeign1_4.grade === "GRADE_A");

  const qForeign1_5 = evaluateQuality({
    moisturePercentage: 11.0,
    foreignMaterialPercentage: 1.5,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Foreign matter 1.5% (> 1.4) steps to GRADE_B", qForeign1_5.grade === "GRADE_B");

  // 3.8 Damaged grain rejection boundary (std: 3.0 -> reject at > 3.0 + 3.0 = 6.0)
  const qDamaged6_0 = evaluateQuality({
    moisturePercentage: 11.0,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 6.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Damaged grain 6.0% (at reject ceiling) is GRADE_C", qDamaged6_0.grade === "GRADE_C");

  const qDamaged6_1 = evaluateQuality({
    moisturePercentage: 11.0,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 6.1,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Damaged grain 6.1% (> 6.0%) triggers REJECTED lot", qDamaged6_1.grade === "REJECTED" && qDamaged6_1.decision === "REJECT");

  // ============================================================================
  // GROUP 4: NEGATIVE WEIGHTS, ZERO QUANTITIES & INVALID INPUTS
  // ============================================================================
  console.log("\n--- [GROUP 4] Negative Weights, Zero Quantities & Invalid Input Defenses ---");

  // 4.1 Negative Gross Weight
  const weighNegativeGross = calculateWeighingDiscrepancy({
    grossWeightQuintals: -15.0,
    tareWeightQuintals: 20.0,
    bookedEstimatedQuantityQuintals: 50.0,
  });
  assert("Negative gross weight clamped to 0 net weight", weighNegativeGross.netWeightQuintals === 0);

  // 4.2 Gross Weight less than Tare Weight (e.g. sensor tare glitch)
  const weighGrossLessThanTare = calculateWeighingDiscrepancy({
    grossWeightQuintals: 10.0,
    tareWeightQuintals: 25.0,
    bookedEstimatedQuantityQuintals: 40.0,
  });
  assert("Gross < Tare produces 0 net weight and flags deficit", weighGrossLessThanTare.netWeightQuintals === 0 && weighGrossLessThanTare.isDiscrepancyFlagged);

  // 4.3 Zero Booked Quantity (Division by Zero defense)
  const weighZeroBooked = calculateWeighingDiscrepancy({
    grossWeightQuintals: 50.0,
    tareWeightQuintals: 20.0,
    bookedEstimatedQuantityQuintals: 0,
  });
  assert("Zero booked quantity does NOT cause NaN / division by zero", !isNaN(weighZeroBooked.discrepancyPercentage) && weighZeroBooked.discrepancyPercentage === 0);

  // 4.4 Negative Booked Quantity
  const weighNegativeBooked = calculateWeighingDiscrepancy({
    grossWeightQuintals: 50.0,
    tareWeightQuintals: 20.0,
    bookedEstimatedQuantityQuintals: -10,
  });
  assert("Negative booked quantity handled without crash", !isNaN(weighNegativeBooked.netWeightQuintals));

  // 4.5 Unknown / Invalid Vehicle Types
  const procInvalidVehicle1 = calculateProcessingTime({
    quantityQuintals: 30,
    vehicleType: "SUPER_HELICOPTER" as any,
  });
  assert("Unknown vehicle type defaults safely to 3 min adjustment", procInvalidVehicle1.breakdown.vehicleAdjustmentMinutes === 3);

  const procNullVehicle = calculateProcessingTime({
    quantityQuintals: 30,
    vehicleType: undefined,
  });
  assert("Undefined vehicle type defaults safely to 3 min adjustment", procNullVehicle.breakdown.vehicleAdjustmentMinutes === 3);

  // 4.6 Negative MSP Rate and Negative Accepted Quantity Clamping
  const mspNegativeInputs = calculateMspPayment({
    acceptedQuantityQuintals: -40,
    mspRatePerQuintal: -2000,
    qualityDeductionPercentage: -5,
  });
  assert("Negative MSP quantity & rate clamp to ₹0.00 gross", mspNegativeInputs.grossAmount === 0);
  assert("Negative MSP net payable clamps to ₹0.00", mspNegativeInputs.netPayableAmount === 0);

  // 4.7 Excessive Deduction Percentage (e.g. 150%)
  const mspOverDeduction = calculateMspPayment({
    acceptedQuantityQuintals: 50,
    mspRatePerQuintal: 2000,
    qualityDeductionPercentage: 150,
  });
  assert("Excessive deduction percentage results in 0 net payable (no negative payout)", mspOverDeduction.netPayableAmount === 0);

  // ============================================================================
  // GROUP 5: AI CENTRE RECOMMENDATION ROBUSTNESS & EDGE CONDITIONS
  // ============================================================================
  console.log("\n--- [GROUP 5] AI Centre Recommendation Engine Robustness ---");

  // 5.1 Maintenance & Inactive Centre handling
  const centreMaint = scoreProcurementCentre({
    centreId: "PC-TEST-001",
    centreName: "Maintenance Mandi",
    distanceKm: 2,
    waitingQueueCount: 0,
    estimatedWaitMinutes: 0,
    currentLoadQuintals: 0,
    capacityPerDayQuintals: 1000,
    processingSpeedPerHour: 100,
    activeIncidentsCount: 0,
    weighingMachinesActive: 0,
    weighingMachinesTotal: 2,
    status: "MAINTENANCE",
  });
  assert("Maintenance centre assigned score 0 and GREY status", centreMaint.score === 0 && centreMaint.congestionStatus === "GREY");

  // 5.2 Zero capacity center (Zero denominator defense)
  const centreZeroCap = scoreProcurementCentre({
    centreId: "PC-TEST-002",
    centreName: "Zero Capacity PAC",
    distanceKm: 10,
    waitingQueueCount: 5,
    estimatedWaitMinutes: 30,
    currentLoadQuintals: 50,
    capacityPerDayQuintals: 0,
    processingSpeedPerHour: 80,
    activeIncidentsCount: 0,
    weighingMachinesActive: 1,
    weighingMachinesTotal: 1,
    status: "ACTIVE",
  });
  assert("Zero capacity centre handled without NaN / division by zero", !isNaN(centreZeroCap.score) && !isNaN(centreZeroCap.loadPercentage));

  // 5.3 Zero total weighing machines (Zero denominator defense)
  const centreZeroMachines = scoreProcurementCentre({
    centreId: "PC-TEST-003",
    centreName: "No Machine PAC",
    distanceKm: 10,
    waitingQueueCount: 5,
    estimatedWaitMinutes: 30,
    currentLoadQuintals: 100,
    capacityPerDayQuintals: 500,
    processingSpeedPerHour: 80,
    activeIncidentsCount: 0,
    weighingMachinesActive: 0,
    weighingMachinesTotal: 0,
    status: "ACTIVE",
  });
  assert("Zero total machines handled without NaN", !isNaN(centreZeroMachines.score));

  // 5.4 Extreme Distance (e.g. 1,000 km) penalty normalization
  const centreFar = scoreProcurementCentre({
    centreId: "PC-TEST-004",
    centreName: "Far Outpost",
    distanceKm: 1000,
    waitingQueueCount: 0,
    estimatedWaitMinutes: 0,
    currentLoadQuintals: 0,
    capacityPerDayQuintals: 1000,
    processingSpeedPerHour: 150,
    activeIncidentsCount: 0,
    weighingMachinesActive: 2,
    weighingMachinesTotal: 2,
    status: "ACTIVE",
  });
  assert("1000km distance penalty normalized safely (score between 0 and 100)", centreFar.score >= 0 && centreFar.score <= 100);

  // 5.5 Haversine Distance: Identical coordinates
  const distIdentical = calculateDistanceKm(29.6857, 76.9905, 29.6857, 76.9905);
  assert("Distance between identical coordinates is 0.0 km", distIdentical === 0);

  // 5.6 Haversine Distance: Known coordinates (Karnal to Nilokheri: ~18km)
  const distKarnalNilokheri = calculateDistanceKm(29.6857, 76.9905, 29.8333, 76.9167);
  assert("Haversine distance between Karnal and Nilokheri is ~17.9km", distKarnalNilokheri >= 16 && distKarnalNilokheri <= 20, `Got ${distKarnalNilokheri} km`);

  // 5.7 Ranking multiple centres with identical scores
  const rankedTied = rankCentres([
    {
      centreId: "C1",
      centreName: "Centre 1",
      distanceKm: 10,
      waitingQueueCount: 5,
      estimatedWaitMinutes: 20,
      currentLoadQuintals: 200,
      capacityPerDayQuintals: 1000,
      processingSpeedPerHour: 100,
      activeIncidentsCount: 0,
      weighingMachinesActive: 2,
      weighingMachinesTotal: 2,
      status: "ACTIVE",
    },
    {
      centreId: "C2",
      centreName: "Centre 2",
      distanceKm: 10,
      waitingQueueCount: 5,
      estimatedWaitMinutes: 20,
      currentLoadQuintals: 200,
      capacityPerDayQuintals: 1000,
      processingSpeedPerHour: 100,
      activeIncidentsCount: 0,
      weighingMachinesActive: 2,
      weighingMachinesTotal: 2,
      status: "ACTIVE",
    },
  ]);
  assert("Ranked ties designate exactly one primary recommendation", rankedTied.filter(c => c.primaryRecommendation).length === 1);

  // ============================================================================
  // GROUP 6: DYNAMIC ARRIVAL WINDOW & TIME WRAPAROUND BOUNDARIES
  // ============================================================================
  console.log("\n--- [GROUP 6] Dynamic Arrival Window & Time Boundary Tests ---");

  // 6.1 Midnight Slot (00:00) wraparound
  const arrivalMidnight = calculateArrivalWindow("2026-08-26", "00:00");
  assert("Midnight slot (00:00) window start wraps to previous day 23:50", arrivalMidnight.windowStart.getMinutes() === 50 && arrivalMidnight.windowStart.getHours() === 23);
  assert("Midnight slot (00:00) window end is 00:20", arrivalMidnight.windowEnd.getMinutes() === 20 && arrivalMidnight.windowEnd.getHours() === 0);
  assert("Midnight slot (00:00) grace expiry is 00:35", arrivalMidnight.graceExpiryTime.getMinutes() === 35 && arrivalMidnight.graceExpiryTime.getHours() === 0);

  // 6.2 Late night slot (23:45)
  const arrivalLateNight = calculateArrivalWindow("2026-08-26", "23:45");
  assert("Late night slot (23:45) window start is 23:35", arrivalLateNight.windowStart.getMinutes() === 35 && arrivalLateNight.windowStart.getHours() === 23);
  assert("Late night slot (23:45) window end wraps to next day 00:05", arrivalLateNight.windowEnd.getMinutes() === 5 && arrivalLateNight.windowEnd.getHours() === 0);
  assert("Late night slot (23:45) grace expiry is next day 00:20", arrivalLateNight.graceExpiryTime.getMinutes() === 20 && arrivalLateNight.graceExpiryTime.getHours() === 0);

  // 6.3 Leap year date (2028-02-29)
  const arrivalLeapYear = calculateArrivalWindow("2028-02-29", "14:30");
  assert("Leap day (2028-02-29) preserves correct date format and window", arrivalLeapYear.slotStartTime.getDate() === 29 && arrivalLeapYear.slotStartTime.getMonth() === 1);

  // 6.4 PFMS Transaction Reference Uniqueness Generator
  const pfmsRefs = new Set<string>();
  for (let i = 0; i < 50; i++) {
    pfmsRefs.add(generatePfmsTransactionRef());
  }
  assert("PFMS reference generator produces unique transaction IDs across 50 iterations", pfmsRefs.size === 50);

  console.log("\n================================================================================");
  console.log(`📊 ADVERSARIAL STRESS TEST SUMMARY: ${passed} Passed, ${failed} Failed out of ${passed + failed} Tests`);
  console.log("================================================================================");

  return { passed, failed, total: passed + failed };
}

if (require.main === module || !module.parent) {
  const result = runChallengerStressTests();
  if (result.failed > 0) {
    process.exit(1);
  }
}
